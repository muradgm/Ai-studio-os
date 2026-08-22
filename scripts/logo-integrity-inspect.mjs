#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import { chromium } from 'playwright';

const RENDERABLE = new Set(['path','rect','circle','ellipse','polygon','polyline','line','text','use']);
const GEOMETRY = {
  path:['d'], rect:['x','y','width','height','rx','ry'], circle:['cx','cy','r'],
  ellipse:['cx','cy','rx','ry'], polygon:['points'], polyline:['points'],
  line:['x1','y1','x2','y2'], text:['x','y','dx','dy','textLength'], use:['href','x','y','width','height']
};
const FORBIDDEN_SOURCE_RE = /<!DOCTYPE|<!ENTITY|@import\b/gi;

function parseArgs(argv) {
  const out = { sizes:'16,32,64,128', overlapSize:512 };
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--canonical') out.canonical = value;
    else if (key === '--candidate') out.candidate = value;
    else if (key === '--spec') out.spec = value;
    else if (key === '--sizes') out.sizes = value;
    else if (key === '--overlap-size') out.overlapSize = Number(value);
    else continue;
    i += 1;
  }
  return out;
}

function shaText(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function shaFile(path) {
  return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
}

function emptyReport(path, unsafe = [], parseError = null) {
  return {
    fileSha256: shaFile(path), viewBox:null, defsFingerprint:null, layers:[], shapes:[], shapeIds:[],
    duplicateIds:[], rawColors:[], embeddedRaster:false, unsafeElements:[...new Set(unsafe)].sort(),
    unsafeExternalRefs:[], parseError
  };
}

async function inspectSvg(page, path, source, spec) {
  const forbidden = [...source.matchAll(FORBIDDEN_SOURCE_RE)].map((match) => `forbidden-source:${match[0]}`);
  if (forbidden.length) return emptyReport(path, forbidden);

  const parsed = await page.evaluate(({ source, spec, geometry, renderable }) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) return { parseError: parserError.textContent || 'SVG parse failed' };

    const root = doc.documentElement;
    const layerIds = new Set((spec.layers || []).map((item) => item.id).filter(Boolean));
    const renderableSet = new Set(renderable);
    const all = [root, ...root.querySelectorAll('*')];
    const defsNodes = new Set();
    for (const defs of root.querySelectorAll('defs')) {
      defsNodes.add(defs);
      for (const node of defs.querySelectorAll('*')) defsNodes.add(node);
    }

    const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ');
    const styleMap = (value) => {
      const out = {};
      for (const part of String(value || '').split(';')) {
        const index = part.indexOf(':');
        if (index < 0) continue;
        out[part.slice(0, index).trim()] = part.slice(index + 1).trim();
      }
      return out;
    };
    const prop = (element, key, fallback = null) => element.getAttribute(key) ?? styleMap(element.getAttribute('style'))[key] ?? fallback;
    const refId = (value) => {
      const match = /url\(#([^)]+)\)/.exec(value || '');
      return match ? match[1] : null;
    };
    const nearestLayer = (element) => {
      let current = element;
      while (current) {
        const dataLayer = current.getAttribute?.('data-layer-id');
        if (dataLayer) return dataLayer;
        if (current.localName === 'g' && layerIds.has(current.getAttribute('id'))) return current.getAttribute('id');
        current = current.parentElement;
      }
      return null;
    };
    const colorMatches = (value) => String(value || '').match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:black|white|red|green|blue|gray|grey|none|currentColor)\b/g) || [];

    const seenIds = new Set();
    const duplicateIds = [];
    const rawColors = [];
    const unsafeElements = [];
    const unsafeExternalRefs = [];
    const layers = [];
    const shapes = [];
    let embeddedRaster = false;

    for (const element of all) {
      const tag = element.localName;
      const id = element.getAttribute?.('id');
      if (id) {
        if (seenIds.has(id)) duplicateIds.push(id);
        seenIds.add(id);
      }
      if (tag === 'image') embeddedRaster = true;
      if (tag === 'script' || tag === 'foreignObject') unsafeElements.push(tag);

      const href = element.getAttribute?.('href') || element.getAttribute?.('xlink:href');
      if (href && /^(?:https?:|file:|\/\/)/i.test(href.trim())) unsafeExternalRefs.push(href.trim());

      const styleText = `${tag === 'style' ? (element.textContent || '') : ''} ${element.getAttribute?.('style') || ''}`;
      if (/@import\b/i.test(styleText)) unsafeElements.push('css-import');
      for (const match of styleText.matchAll(/url\(([^)]+)\)/g)) {
        const value = match[1].trim().replace(/^['"]|['"]$/g, '');
        if (/^(?:https?:|file:|\/\/)/i.test(value)) unsafeExternalRefs.push(value);
      }

      const inferredLayer = element.getAttribute?.('data-layer-id') || (tag === 'g' && layerIds.has(id) ? id : null);
      if (inferredLayer) {
        const opacity = Number(prop(element, 'opacity', '1'));
        layers.push({
          id: inferredLayer,
          role: element.getAttribute('data-role'),
          opacity: Number.isFinite(opacity) ? opacity : 1,
          blendMode: styleMap(element.getAttribute('style'))['mix-blend-mode'] || 'normal',
          maskId: refId(prop(element, 'mask', '')),
          clipId: refId(prop(element, 'clip-path', ''))
        });
      }

      if (renderableSet.has(tag) && !defsNodes.has(element)) {
        const attrs = [];
        for (const key of geometry[tag] || []) {
          if (element.hasAttribute(key)) attrs.push([key, normalize(element.getAttribute(key))]);
        }
        if (element.hasAttribute('transform')) attrs.push(['transform', normalize(element.getAttribute('transform'))]);
        shapes.push({
          id: id || `__unidentified_${shapes.length + 1}`,
          tag,
          geometrySeed: JSON.stringify([tag, attrs]),
          layerId: nearestLayer(element),
          transform: normalize(element.getAttribute('transform')) || null,
          fill: prop(element, 'fill'),
          stroke: prop(element, 'stroke'),
          maskId: refId(prop(element, 'mask', '')),
          clipId: refId(prop(element, 'clip-path', ''))
        });
      }

      for (const key of ['fill','stroke','color','stop-color','flood-color']) {
        const value = prop(element, key);
        if (value && !String(value).startsWith('url(')) rawColors.push(...colorMatches(value));
      }
      rawColors.push(...colorMatches(element.getAttribute?.('style')));
    }

    let viewBox = null;
    try {
      const values = normalize(root.getAttribute('viewBox')).split(/[ ,]+/).filter(Boolean).map(Number);
      viewBox = values.every(Number.isFinite) ? values : null;
    } catch {
      viewBox = null;
    }

    const serializer = new XMLSerializer();
    const defsSeed = [...root.querySelectorAll('defs')].map((element) => serializer.serializeToString(element)).join('');

    return {
      parseError:null,
      viewBox,
      defsSeed,
      layers,
      shapes,
      duplicateIds:[...new Set(duplicateIds)].sort(),
      rawColors:[...new Set(rawColors.map((value) => value.toLowerCase()).filter((value) => value !== 'none'))].sort(),
      embeddedRaster,
      unsafeElements:[...new Set(unsafeElements)].sort(),
      unsafeExternalRefs:[...new Set(unsafeExternalRefs)].sort()
    };
  }, { source, spec, geometry:GEOMETRY, renderable:[...RENDERABLE] });

  if (parsed.parseError) return emptyReport(path, ['xml-parse-blocked'], parsed.parseError);
  return {
    fileSha256:shaFile(path),
    viewBox:parsed.viewBox,
    defsFingerprint:shaText(parsed.defsSeed),
    layers:parsed.layers,
    shapes:parsed.shapes.map(({ geometrySeed, ...shape }) => ({ ...shape, geometryFingerprint:shaText(geometrySeed) })),
    shapeIds:parsed.shapes.map((shape) => shape.id),
    duplicateIds:parsed.duplicateIds,
    rawColors:parsed.rawColors,
    embeddedRaster:parsed.embeddedRaster,
    unsafeElements:parsed.unsafeElements,
    unsafeExternalRefs:parsed.unsafeExternalRefs,
    parseError:null
  };
}

function structural(canonical, candidate, spec, findings) {
  if (spec.canonicalFileSha256 && canonical.fileSha256 !== spec.canonicalFileSha256) findings.push('canonical SVG hash does not match approved mark spec');
  if (spec.shapeIds && JSON.stringify([...canonical.shapeIds].sort()) !== JSON.stringify([...spec.shapeIds].sort())) findings.push('canonical SVG shape set does not match approved mark spec');
  if (canonical.parseError) findings.push('canonical SVG parse blocked');
  if (candidate.parseError) findings.push('candidate SVG parse blocked');
  if (canonical.unsafeElements.length || canonical.unsafeExternalRefs.length) findings.push('canonical SVG contains unsafe/external content');
  if (candidate.unsafeElements.length || candidate.unsafeExternalRefs.length) findings.push('candidate SVG contains unsafe/external content');
  if (JSON.stringify(canonical.viewBox) !== JSON.stringify(candidate.viewBox)) findings.push('SVG viewBox drift');
  if (canonical.defsFingerprint !== candidate.defsFingerprint) findings.push('SVG defs/mask/clip definition drift');
  if (candidate.duplicateIds.length) findings.push('candidate SVG contains duplicate IDs');

  const A = new Map(canonical.shapes.map((shape) => [shape.id, shape]));
  const B = new Map(candidate.shapes.map((shape) => [shape.id, shape]));
  for (const id of [...A.keys()].filter((id) => !B.has(id)).sort()) findings.push(`missing shape IDs: ${id}`);
  for (const id of [...B.keys()].filter((id) => !A.has(id)).sort()) findings.push(`unexpected shape IDs: ${id}`);
  for (const id of [...A.keys()].filter((id) => B.has(id)).sort()) {
    const a = A.get(id); const b = B.get(id);
    if (a.geometryFingerprint !== b.geometryFingerprint) findings.push(`shape geometry drift: ${id}`);
    if (a.layerId !== b.layerId) findings.push(`shape layer drift: ${id}`);
    if (a.fill !== b.fill || a.stroke !== b.stroke) findings.push(`shape color/stroke drift: ${id}`);
    if (a.maskId !== b.maskId) findings.push(`shape mask drift: ${id}`);
    if (a.clipId !== b.clipId) findings.push(`shape clip drift: ${id}`);
  }
  if (JSON.stringify(canonical.layers) !== JSON.stringify(candidate.layers)) findings.push('layer structure/order drift');
  if (candidate.embeddedRaster) findings.push('SVG contains embedded raster artwork');

  const allowed = new Set((spec.palette || []).map((item) => String(item.value || '').toLowerCase()));
  for (const color of candidate.rawColors) {
    if (allowed.size && color.startsWith('#') && !allowed.has(color)) findings.push(`unapproved SVG color: ${color}`);
  }
}

async function browserEvidence(page, canonicalSource, candidateSource, spec, sizes, overlapSize, unsafe) {
  return page.evaluate(async ({ canonicalSource, candidateSource, spec, sizes, overlapSize, unsafe, renderable }) => {
    const renderableSet = new Set(renderable);
    const parse = (source) => new DOMParser().parseFromString(source, 'image/svg+xml');
    const serialize = (doc) => new XMLSerializer().serializeToString(doc);

    const isolate = (source, targetId) => {
      const doc = parse(source);
      const root = doc.documentElement;
      const target = root.querySelector(`#${CSS.escape(targetId)}`);
      if (!target) return null;
      const keep = new Set();
      let current = target;
      while (current) { keep.add(current); current = current.parentElement; }
      const defs = new Set();
      for (const node of root.querySelectorAll('defs, defs *')) defs.add(node);
      for (const element of root.querySelectorAll('*')) {
        if (!renderableSet.has(element.localName) || keep.has(element) || defs.has(element)) continue;
        const currentStyle = element.getAttribute('style') || '';
        element.setAttribute('style', `${currentStyle}${currentStyle && !currentStyle.trim().endsWith(';') ? ';' : ''}display:none`);
      }
      return serialize(doc);
    };

    const pixels = async (source, size) => {
      const blob = new Blob([source], { type:'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently:true });
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(image, 0, 0, size, size);
        return ctx.getImageData(0, 0, size, size).data;
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    const bbox = async (source, targetId, size) => {
      const isolated = isolate(source, targetId);
      if (!isolated) return null;
      const data = await pixels(isolated, size);
      let minX = size, minY = size, maxX = -1, maxY = -1;
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          if (data[(y * size + x) * 4 + 3] === 0) continue;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      return maxX < 0 ? null : [minX, minY, maxX + 1, maxY + 1];
    };

    const overlapRatio = async (source, a, b, size) => {
      const sa = isolate(source, a); const sb = isolate(source, b);
      if (!sa || !sb) return null;
      const [pa, pb] = await Promise.all([pixels(sa, size), pixels(sb, size)]);
      let ca = 0, cb = 0, both = 0;
      for (let i = 3; i < pa.length; i += 4) {
        const aa = pa[i] > 0; const ab = pb[i] > 0;
        if (aa) ca += 1; if (ab) cb += 1; if (aa && ab) both += 1;
      }
      const denominator = Math.min(ca, cb);
      return denominator === 0 ? 0 : both / denominator;
    };

    const output = { renders:[], canonicalBBoxes:{}, candidateBBoxes:{}, overlaps:[], errors:[] };
    if (unsafe) {
      output.renders = sizes.map((size) => ({ size, visualDiffPct:100, error:'unsafe or unparsable SVG content; rendering skipped' }));
      return output;
    }

    const ids = (spec.shapeIds || []).filter(Boolean);
    for (const id of ids) {
      try {
        output.canonicalBBoxes[id] = await bbox(canonicalSource, id, overlapSize);
        output.candidateBBoxes[id] = await bbox(candidateSource, id, overlapSize);
      } catch (error) {
        output.canonicalBBoxes[id] = null; output.candidateBBoxes[id] = null;
        output.errors.push(`bbox failure ${id}: ${error.message}`);
      }
    }

    for (const size of sizes) {
      try {
        const [a, b] = await Promise.all([pixels(canonicalSource, size), pixels(candidateSource, size)]);
        let changed = 0;
        for (let i = 0; i < a.length; i += 4) {
          if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) changed += 1;
        }
        output.renders.push({ size, visualDiffPct:(changed / (a.length / 4)) * 100 });
      } catch (error) {
        output.renders.push({ size, visualDiffPct:100, error:error.message });
      }
    }

    for (const relation of spec.overlaps || []) {
      let canonicalAreaRatio = null; let candidateAreaRatio = null;
      try {
        canonicalAreaRatio = await overlapRatio(canonicalSource, relation.a, relation.b, overlapSize);
        candidateAreaRatio = await overlapRatio(candidateSource, relation.a, relation.b, overlapSize);
      } catch (error) {
        output.errors.push(`overlap failure ${relation.a}::${relation.b}: ${error.message}`);
      }
      output.overlaps.push({
        a:relation.a, b:relation.b, canonicalAreaRatio, candidateAreaRatio,
        tolerance:relation.tolerance ?? 0.005, mode:relation.mode, owner:relation.owner
      });
    }
    return output;
  }, { canonicalSource, candidateSource, spec, sizes, overlapSize, unsafe, renderable:[...RENDERABLE] });
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.canonical || !args.candidate || !args.spec) {
    console.log(JSON.stringify({ error:'missing-argument', detail:'--canonical, --candidate and --spec are required' }));
    process.exitCode = 2;
    return;
  }

  const spec = JSON.parse(fs.readFileSync(args.spec, 'utf8'));
  const canonicalSource = fs.readFileSync(args.canonical, 'utf8');
  const candidateSource = fs.readFileSync(args.candidate, 'utf8');
  const sizes = String(args.sizes).split(',').filter(Boolean).map(Number).filter(Number.isFinite);
  const findings = [];

  let browser;
  try {
    browser = await chromium.launch({ headless:true });
    const page = await browser.newPage({ viewport:{ width:1024, height:1024 } });
    const canonical = await inspectSvg(page, args.canonical, canonicalSource, spec);
    const candidate = await inspectSvg(page, args.candidate, candidateSource, spec);
    structural(canonical, candidate, spec, findings);

    const unsafe = Boolean(
      canonical.unsafeElements.length || canonical.unsafeExternalRefs.length || canonical.parseError ||
      candidate.unsafeElements.length || candidate.unsafeExternalRefs.length || candidate.parseError
    );
    const visual = await browserEvidence(page, canonicalSource, candidateSource, spec, sizes, args.overlapSize, unsafe);
    canonical.renderedBBoxes = visual.canonicalBBoxes;
    candidate.renderedBBoxes = visual.candidateBBoxes;

    for (const id of spec.shapeIds || []) {
      if (JSON.stringify(canonical.renderedBBoxes[id] ?? null) !== JSON.stringify(candidate.renderedBBoxes[id] ?? null)) findings.push(`shape rendered bbox drift: ${id}`);
    }
    for (const render of visual.renders) if (render.error) findings.push(`render failure at ${render.size}px`);
    for (const relation of visual.overlaps) {
      if (relation.canonicalAreaRatio == null || relation.candidateAreaRatio == null) findings.push(`overlap evidence unavailable: ${relation.a}::${relation.b}`);
      else if (Math.abs(relation.canonicalAreaRatio - relation.candidateAreaRatio) > relation.tolerance) findings.push(`overlap geometry drift: ${relation.a}::${relation.b}`);
    }
    const maxVisualDiffPct = Number.isFinite(Number(spec.maxVisualDiffPct)) ? Number(spec.maxVisualDiffPct) : 0.5;
    for (const render of visual.renders) if (render.visualDiffPct > maxVisualDiffPct) findings.push(`visual drift exceeds tolerance at ${render.size}px`);

    console.log(JSON.stringify({
      stage:'logo-artifact-integrity', canonical, candidate,
      renderEvidence:visual.renders, overlapEvidence:visual.overlaps,
      inspectorEvidence:'artifact-inspector:playwright-chromium',
      findings:[...new Set(findings)], status:findings.length ? 'blocked' : 'locked'
    }));
  } catch (error) {
    console.log(JSON.stringify({ error:'browser-inspector-failed', detail:error?.message || String(error) }));
    process.exitCode = 2;
  } finally {
    await browser?.close().catch(() => {});
  }
}

await main();
