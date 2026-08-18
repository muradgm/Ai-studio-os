#!/usr/bin/env python3
import argparse, hashlib, json, os, re, sys, tempfile, xml.etree.ElementTree as ET
try:
    import cairosvg
    from PIL import Image, ImageChops
    from defusedxml.ElementTree import parse as safe_parse
except Exception as exc:
    print(json.dumps({'error':'missing-python-dependency','detail':str(exc)})); sys.exit(2)

RENDERABLE={'path','rect','circle','ellipse','polygon','polyline','line','text','use'}
GEOM={'path':['d'],'rect':['x','y','width','height','rx','ry'],'circle':['cx','cy','r'],'ellipse':['cx','cy','rx','ry'],'polygon':['points'],'polyline':['points'],'line':['x1','y1','x2','y2'],'text':['x','y','dx','dy','textLength'],'use':['href','x','y','width','height']}
COLOR_RE=re.compile(r'(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:black|white|red|green|blue|gray|grey|none|currentColor)\b)')
URL_RE=re.compile(r'url\(#([^)]+)\)')
EXT_RE=re.compile(r'^(?:https?:|file:|//)',re.I)
FORBIDDEN_SOURCE_RE=re.compile(r'<!DOCTYPE|<!ENTITY|@import\b',re.I)

def local(t): return t.rsplit('}',1)[-1]
def norm(v): return re.sub(r'\s+',' ',(v or '').strip())
def htext(v): return hashlib.sha256(v.encode()).hexdigest()
def hfile(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for c in iter(lambda:f.read(65536),b''): h.update(c)
    return h.hexdigest()
def style(v):
    out={}
    for x in (v or '').split(';'):
        if ':' in x:
            k,val=x.split(':',1); out[k.strip()]=val.strip()
    return out
def prop(e,k,d=None): return e.attrib.get(k,style(e.attrib.get('style')).get(k,d))
def ref_id(v):
    m=URL_RE.search(v or ''); return m.group(1) if m else None
def pmap(root): return {c:p for p in root.iter() for c in p}
def viewbox(root):
    try: return [float(x) for x in re.split(r'[ ,]+',norm(root.attrib.get('viewBox'))) if x]
    except: return None
def fingerprint(e):
    tag=local(e.tag); attrs=[(k,norm(e.attrib[k])) for k in GEOM.get(tag,[]) if k in e.attrib]
    if 'transform' in e.attrib: attrs.append(('transform',norm(e.attrib['transform'])))
    return htext(json.dumps([tag,attrs],separators=(',',':')))
def nearest_layer(e,parents,layer_ids):
    while e is not None:
        lid=e.attrib.get('data-layer-id')
        if lid: return lid
        if local(e.tag)=='g' and e.attrib.get('id') in layer_ids: return e.attrib.get('id')
        e=parents.get(e)
    return None

def empty_report(path, unsafe=None, parse_error=None):
    return {'fileSha256':hfile(path),'viewBox':None,'defsFingerprint':None,'layers':[],'shapes':[],'shapeIds':[],'duplicateIds':[],'rawColors':[],'embeddedRaster':False,'unsafeElements':sorted(set(unsafe or [])),'unsafeExternalRefs':[],'parseError':parse_error}

def inspect_svg(path,spec):
    raw=open(path,'rb').read(); source=raw.decode('utf-8','replace')
    forbidden=sorted(set(m.group(0) for m in FORBIDDEN_SOURCE_RE.finditer(source)))
    if forbidden: return empty_report(path,[f'forbidden-source:{x}' for x in forbidden])
    try: tree=safe_parse(path)
    except Exception as exc: return empty_report(path,['xml-parse-blocked'],str(exc))
    root=tree.getroot(); parents=pmap(root); layer_ids={x.get('id') for x in spec.get('layers',[]) if x.get('id')}
    in_defs=set(); defs=[]
    for e in root.iter():
        if local(e.tag)=='defs':
            defs.append(ET.tostring(e,encoding='unicode')); in_defs.update(e.iter())
    layers=[]; shapes=[]; seen=set(); dup=[]; colors=[]; embedded=False; unsafe=[]; ext=[]
    for e in root.iter():
        tag=local(e.tag); eid=e.attrib.get('id')
        if eid:
            if eid in seen: dup.append(eid)
            seen.add(eid)
        if tag=='image': embedded=True
        if tag in {'script','foreignObject'}: unsafe.append(tag)
        href=e.attrib.get('href') or e.attrib.get('{http://www.w3.org/1999/xlink}href')
        if href and EXT_RE.match(href.strip()): ext.append(href.strip())
        css_text=((e.text or '') if tag=='style' else '')+' '+(e.attrib.get('style') or '')
        if re.search(r'@import\b',css_text,re.I): unsafe.append('css-import')
        for u in re.findall(r'url\(([^)]+)\)',css_text):
            u=u.strip(' \"\'')
            if EXT_RE.match(u): ext.append(u)
        inferred=e.attrib.get('data-layer-id') or (eid if tag=='g' and eid in layer_ids else None)
        if inferred:
            layers.append({'id':inferred,'role':e.attrib.get('data-role'),'opacity':float(prop(e,'opacity','1') or 1),'blendMode':style(e.attrib.get('style')).get('mix-blend-mode','normal'),'maskId':ref_id(prop(e,'mask','')),'clipId':ref_id(prop(e,'clip-path',''))})
        if tag in RENDERABLE and e not in in_defs:
            shapes.append({'id':eid or f'__unidentified_{len(shapes)+1}','tag':tag,'geometryFingerprint':fingerprint(e),'layerId':nearest_layer(e,parents,layer_ids),'transform':norm(e.attrib.get('transform')) or None,'fill':prop(e,'fill'),'stroke':prop(e,'stroke'),'maskId':ref_id(prop(e,'mask','')),'clipId':ref_id(prop(e,'clip-path',''))})
        for k in ('fill','stroke','color','stop-color','flood-color'):
            v=prop(e,k)
            if v and not v.startswith('url('): colors += COLOR_RE.findall(v)
        colors += COLOR_RE.findall(e.attrib.get('style',''))
    return {'fileSha256':hfile(path),'viewBox':viewbox(root),'defsFingerprint':htext(''.join(defs)),'layers':layers,'shapes':shapes,'shapeIds':[x['id'] for x in shapes],'duplicateIds':sorted(set(dup)),'rawColors':sorted(set(c.lower() for c in colors if c.lower()!='none')),'embeddedRaster':embedded,'unsafeElements':sorted(set(unsafe)),'unsafeExternalRefs':sorted(set(ext)),'parseError':None}

def render(svg,out,size): cairosvg.svg2png(url=svg,write_to=out,output_width=size,output_height=size)
def diff_pct(a,b):
    a=Image.open(a).convert('RGBA'); b=Image.open(b).convert('RGBA')
    if a.size!=b.size: return 100.0
    d=ImageChops.difference(a,b); return sum(px!=(0,0,0,0) for px in d.getdata())/(a.width*a.height)*100

def isolate(src,target,out):
    tree=safe_parse(src); root=tree.getroot(); parents=pmap(root); t=next((e for e in root.iter() if e.attrib.get('id')==target),None)
    if t is None: return False
    keep=set(); cur=t
    while cur is not None: keep.add(cur); cur=parents.get(cur)
    defs=set()
    for e in root.iter():
        if local(e.tag)=='defs': defs.update(e.iter())
    for e in root.iter():
        if e in keep or e in defs: continue
        if local(e.tag) in RENDERABLE:
            st=style(e.attrib.get('style')); st['display']='none'; e.attrib['style']=';'.join(f'{k}:{v}' for k,v in st.items())
    tree.write(out,encoding='utf-8',xml_declaration=True); return True

def alpha(svg,sid,size,td):
    iso=os.path.join(td,'iso-'+re.sub(r'[^A-Za-z0-9_.-]','_',sid)+'.svg')
    if not isolate(svg,sid,iso): return None
    png=iso+'.png'; render(iso,png,size); return Image.open(png).convert('RGBA').getchannel('A')
def bbox_map(svg,ids,size,td):
    out={}
    for sid in ids:
        try:
            m=alpha(svg,sid,size,td); b=m.getbbox() if m else None; out[sid]=list(b) if b else None
        except: out[sid]=None
    return out
def overlap(svg,a,b,size,td):
    ma,mb=alpha(svg,a,size,td),alpha(svg,b,size,td)
    if ma is None or mb is None: return None
    pa,pb=list(ma.getdata()),list(mb.getdata()); den=min(sum(x>0 for x in pa),sum(x>0 for x in pb))
    return 0 if den==0 else sum(x>0 and y>0 for x,y in zip(pa,pb))/den

def structural(ca,cb,spec,f):
    if spec.get('canonicalFileSha256') and ca['fileSha256']!=spec['canonicalFileSha256']: f.append('canonical SVG hash does not match approved mark spec')
    if spec.get('shapeIds') and set(ca['shapeIds'])!=set(spec['shapeIds']): f.append('canonical SVG shape set does not match approved mark spec')
    if ca.get('parseError'): f.append('canonical SVG parse blocked')
    if cb.get('parseError'): f.append('candidate SVG parse blocked')
    if ca['unsafeElements'] or ca['unsafeExternalRefs']: f.append('canonical SVG contains unsafe/external content')
    if cb['unsafeElements'] or cb['unsafeExternalRefs']: f.append('candidate SVG contains unsafe/external content')
    if ca['viewBox']!=cb['viewBox']: f.append('SVG viewBox drift')
    if ca['defsFingerprint']!=cb['defsFingerprint']: f.append('SVG defs/mask/clip definition drift')
    if cb['duplicateIds']: f.append('candidate SVG contains duplicate IDs')
    A={x['id']:x for x in ca['shapes']}; B={x['id']:x for x in cb['shapes']}
    for x in sorted(set(A)-set(B)): f.append('missing shape IDs: '+x)
    for x in sorted(set(B)-set(A)): f.append('unexpected shape IDs: '+x)
    for sid in sorted(set(A)&set(B)):
        a,b=A[sid],B[sid]
        if a['geometryFingerprint']!=b['geometryFingerprint']: f.append(f'shape geometry drift: {sid}')
        if a['layerId']!=b['layerId']: f.append(f'shape layer drift: {sid}')
        if a['fill']!=b['fill'] or a['stroke']!=b['stroke']: f.append(f'shape color/stroke drift: {sid}')
        if a['maskId']!=b['maskId']: f.append(f'shape mask drift: {sid}')
        if a['clipId']!=b['clipId']: f.append(f'shape clip drift: {sid}')
    if ca['layers']!=cb['layers']: f.append('layer structure/order drift')
    if cb['embeddedRaster']: f.append('SVG contains embedded raster artwork')
    allowed={x['value'].lower() for x in spec.get('palette',[])}
    for c in cb['rawColors']:
        if allowed and c.startswith('#') and c not in allowed: f.append(f'unapproved SVG color: {c}')

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--canonical',required=True); ap.add_argument('--candidate',required=True); ap.add_argument('--spec',required=True); ap.add_argument('--sizes',default='16,32,64,128'); ap.add_argument('--overlap-size',type=int,default=512); a=ap.parse_args()
    spec=json.load(open(a.spec,encoding='utf-8')); ca,cb=inspect_svg(a.canonical,spec),inspect_svg(a.candidate,spec); findings=[]; structural(ca,cb,spec,findings)
    sizes=[int(x) for x in a.sizes.split(',') if x]; renders=[]; overlaps=[]; unsafe=bool(ca['unsafeElements'] or ca['unsafeExternalRefs'] or ca.get('parseError') or cb['unsafeElements'] or cb['unsafeExternalRefs'] or cb.get('parseError'))
    with tempfile.TemporaryDirectory() as td:
        ids=[x['id'] for x in ca['shapes'] if not x['id'].startswith('__unidentified_')]; ca['renderedBBoxes']=bbox_map(a.canonical,ids,a.overlap_size,td) if not unsafe else {}; cb['renderedBBoxes']=bbox_map(a.candidate,ids,a.overlap_size,td) if not unsafe else {}
        for sid in ids:
            if ca['renderedBBoxes'].get(sid)!=cb['renderedBBoxes'].get(sid): findings.append(f'shape rendered bbox drift: {sid}')
        for size in sizes:
            if unsafe: renders.append({'size':size,'visualDiffPct':100.0,'error':'unsafe or unparsable SVG content; rendering skipped'}); continue
            p1,p2=os.path.join(td,f'a{size}.png'),os.path.join(td,f'b{size}.png')
            try: render(a.canonical,p1,size); render(a.candidate,p2,size); renders.append({'size':size,'visualDiffPct':diff_pct(p1,p2)})
            except Exception as exc: renders.append({'size':size,'visualDiffPct':100.0,'error':str(exc)}); findings.append(f'render failure at {size}px')
        for r in spec.get('overlaps',[]):
            if unsafe: cr=dr=None
            else:
                try: cr,dr=overlap(a.canonical,r['a'],r['b'],a.overlap_size,td),overlap(a.candidate,r['a'],r['b'],a.overlap_size,td)
                except: cr=dr=None
            overlaps.append({'a':r['a'],'b':r['b'],'canonicalAreaRatio':cr,'candidateAreaRatio':dr,'tolerance':r.get('tolerance',.005),'mode':r.get('mode'),'owner':r.get('owner')})
            if cr is None or dr is None: findings.append(f"overlap evidence unavailable: {r['a']}::{r['b']}")
            elif abs(cr-dr)>r.get('tolerance',.005): findings.append(f"overlap geometry drift: {r['a']}::{r['b']}")
    mx=float(spec.get('maxVisualDiffPct',.5))
    for r in renders:
        if r['visualDiffPct']>mx: findings.append(f"visual drift exceeds tolerance at {r['size']}px")
    print(json.dumps({'stage':'logo-artifact-integrity','canonical':ca,'candidate':cb,'renderEvidence':renders,'overlapEvidence':overlaps,'inspectorEvidence':'artifact-inspector:defusedxml+cairosvg+pillow','findings':findings,'status':'blocked' if findings else 'locked'},separators=(',',':')))
if __name__=='__main__': main()
