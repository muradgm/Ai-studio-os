import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import {
  ICON_FINALIST_WORLDS,
  ICON_FINALIST_MUST_REVISIT,
  ICON_FINALIST_REFINE,
  ICON_FINALIST_TUNING,
  ICON_FINALIST_PRESERVE,
  ICON_FINALIST_FREEZE,
  ICON_FINALIST_SIZES,
  buildIconFinalistSemanticRefinementPlan,
  buildIconFinalistSemanticEvidence
} from '../modules/icon-system/finalist-semantic-refinement.mjs';
import {
  FINALIST_CANDIDATES,
  listFinalistCandidates,
  renderFinalistGlyphSvg,
  renderFinalistPreservedGlyphSvg
} from '../modules/icon-system/finalist-glyphs.mjs';
import { renderCraftGlyphSvg } from '../modules/icon-system/craft-glyphs.mjs';
import { validateCalibrationSvg } from '../modules/icon-system/calibration-glyphs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'icon-finalist-semantic-refinement-v1');
const svgRoot = path.join(outputRoot, 'svg');
const hypothesisRoot = path.join(outputRoot, 'hypotheses');
const collisionRoot = path.join(outputRoot, 'external-collision-review');
const textRoot = path.join(outputRoot, 'text-pairing');
const uiRoot = path.join(outputRoot, 'ui-context');
const mobileRoot = path.join(outputRoot, 'mobile-targets');
const overviewRoot = path.join(outputRoot, 'world-overviews');
const sourceRoot = path.join(outputRoot, 'source-html');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const craftReview = await readJson(path.join(projectRoot, 'icon-world-craft-review-v1.json'));
const refinementInput = await readJson(path.join(projectRoot, 'icon-finalist-semantic-refinement-v1.json'));
const plan = buildIconFinalistSemanticRefinementPlan(refinementInput, { craftReview });
if (!plan.reviewReady) throw new Error(`Finalist semantic refinement plan not ready: ${plan.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [svgRoot, hypothesisRoot, collisionRoot, textRoot, uiRoot, mobileRoot, overviewRoot, sourceRoot]) await fs.mkdir(dir, { recursive: true });
for (const worldId of ICON_FINALIST_WORLDS) await fs.mkdir(path.join(svgRoot, worldId), { recursive: true });

const rel = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const worldLabel = { 'provenance-glyph': 'Provenance Glyph', 'editorial-sign': 'Editorial Sign' };
const iconLabel = {
  council: 'Council', decision: 'Decision', evidence: 'Evidence', provenance: 'Provenance', authority: 'Authority', supersede: 'Supersede', verification: 'Verification',
  memory: 'Project Memory', projects: 'Projects', search: 'Search', back: 'Back', attach: 'Attach', send: 'Send', edit: 'Edit'
};
const iconScope = [...ICON_FINALIST_MUST_REVISIT, ...ICON_FINALIST_REFINE, ...ICON_FINALIST_TUNING];

// These candidates exist only so typography/UI integration can be rendered before independent review.
// They are not recommendations and carry no world/candidate selection authority.
const CONTEXT_FIXTURE = {
  'provenance-glyph': {
    council: 'voices-register', decision: 'durable-choice', evidence: 'registered-excerpt', provenance: 'origin-trace', authority: 'threshold-aperture', supersede: 'retained-predecessor', verification: 'frame-check'
  },
  'editorial-sign': {
    council: 'voices-margin', decision: 'settled-dot', evidence: 'excerpt-bracket', provenance: 'source-imprint', authority: 'soft-threshold', supersede: 'retained-layer', verification: 'frame-check'
  }
};

const fontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`;
const css = `
:root{--bg:#F2F4F1;--surface:#FAFBF9;--raised:#FFF;--ink:#151A16;--muted:#667069;--line:#D4DAD4;--lineage:#2F684E;--evidence:#5D527B;--consequence:#D84A34;--focus:#245BDB}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'Inter',Arial,sans-serif}.board{padding:32px 38px 40px;min-height:100vh}.eyebrow{font-size:10px;font-weight:650;letter-spacing:.12em;text-transform:uppercase;color:var(--lineage);margin-bottom:9px}h1{font-size:30px;line-height:1.08;letter-spacing:-.035em;margin:0 0 8px;font-weight:650}.sub{max-width:900px;font-size:13px;line-height:1.55;color:var(--muted);margin-bottom:22px}.grid{display:grid;gap:12px}.cols3{grid-template-columns:repeat(3,1fr)}.cols4{grid-template-columns:repeat(4,1fr)}.cols5{grid-template-columns:repeat(5,1fr)}.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:15px}.candidate-title{font-size:13px;font-weight:650;margin:0 0 5px}.intent{font-size:11px;line-height:1.45;color:var(--muted);min-height:48px}.sizes{display:flex;align-items:end;justify-content:center;gap:24px;min-height:82px;margin-top:12px}.size-item{text-align:center;font:10px ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted)}.glyph{display:flex;align-items:center;justify-content:center;color:var(--ink);margin-bottom:7px}.glyph img{display:block}.risk{font-size:10px;border:1px solid var(--line);border-radius:999px;padding:4px 7px;color:var(--muted);display:inline-block;margin:3px 4px 0 0;background:var(--raised)}.risk.danger{border-color:color-mix(in srgb,var(--consequence) 35%,var(--line));color:#8A392B}.section{margin-top:22px}.rule{height:1px;background:var(--line);margin:18px 0}.note{font-size:11px;line-height:1.5;color:var(--muted)}
`;
function htmlDoc(title, body, extraCss = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${fontLinks}<style>${css}${extraCss}</style></head><body>${body}</body></html>`;
}
function svgDataUrl(svg) { return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`; }
function img(svg, size) { return `<img alt="" src="${svgDataUrl(svg)}" style="width:${size}px;height:${size}px">`; }

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
async function renderHtml(html, outFile, viewport = { width: 1280, height: 900 }) {
  const sourceFile = path.join(sourceRoot, `${path.basename(outFile, '.png')}-${Math.random().toString(36).slice(2, 8)}.html`);
  await fs.writeFile(sourceFile, html);
  await page.setViewportSize(viewport);
  await page.goto(pathToFileURL(sourceFile).href);
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
  await page.screenshot({ path: outFile, fullPage: true });
  return { imageRef: rel(outFile), sourceRef: rel(sourceFile) };
}

const finalistSvg = new Map();
const hypothesisEvidence = [];
for (const worldId of ICON_FINALIST_WORLDS) {
  for (const iconId of iconScope) {
    const candidates = listFinalistCandidates(worldId, iconId);
    const candidateCards = [];
    for (const candidate of candidates) {
      const svgRefs = [];
      const sizeCells = [];
      for (const size of ICON_FINALIST_SIZES) {
        const rendered = renderFinalistGlyphSvg(worldId, iconId, candidate.id, { size, title: `${worldLabel[worldId]} ${iconLabel[iconId]} ${candidate.label} ${size}px` });
        const integrity = validateCalibrationSvg(rendered.svg);
        if (!integrity.pass) throw new Error(`Finalist SVG invalid ${worldId}:${iconId}:${candidate.id}:${size}: ${integrity.findings.join(',')}`);
        const file = path.join(svgRoot, worldId, `${iconId}-${candidate.id}-${size}.svg`);
        await fs.writeFile(file, rendered.svg);
        finalistSvg.set(`${worldId}:${iconId}:${candidate.id}:${size}`, rendered.svg);
        svgRefs.push({ size, svgRef: rel(file) });
        sizeCells.push(`<div class="size-item"><div class="glyph">${img(rendered.svg, size)}</div>${size}px</div>`);
      }
      candidateCards.push(`<article class="card"><h3 class="candidate-title">${esc(candidate.label)}</h3><div class="intent">${esc(candidate.intent)}</div><div class="sizes">${sizeCells.join('')}</div></article>`);
      hypothesisEvidence.push({ worldId, iconId, candidateId: candidate.id, candidateLabel: candidate.label, intent: candidate.intent, svgRefs });
    }
    const html = htmlDoc(`${worldLabel[worldId]} · ${iconLabel[iconId]} hypotheses`, `<main class="board"><div class="eyebrow">Icon Finalist Semantic Refinement V1 · hypothesis proof</div><h1>${esc(worldLabel[worldId])} · ${esc(iconLabel[iconId])}</h1><div class="sub">Multiple metaphor hypotheses inside one existing Icon World. Compare meaning before polish. No candidate or world is selected by this proof.</div><div class="grid ${candidates.length === 3 ? 'cols3' : candidates.length === 2 ? 'cols3' : 'cols3'}">${candidateCards.join('')}</div></main>`);
    const outFile = path.join(hypothesisRoot, `${worldId}-${iconId}.png`);
    const board = await renderHtml(html, outFile, { width: 1200, height: 620 });
    for (const record of hypothesisEvidence.filter((item) => item.worldId === worldId && item.iconId === iconId)) Object.assign(record, { boardRef: board.imageRef, sourceRef: board.sourceRef });
  }
}

function contextSvg(worldId, iconId, size = 16) {
  if (CONTEXT_FIXTURE[worldId][iconId]) return finalistSvg.get(`${worldId}:${iconId}:${CONTEXT_FIXTURE[worldId][iconId]}:${size}`) ?? renderFinalistGlyphSvg(worldId, iconId, CONTEXT_FIXTURE[worldId][iconId], { size }).svg;
  return renderFinalistPreservedGlyphSvg(worldId, iconId, { size, title: `${worldLabel[worldId]} ${iconLabel[iconId]} ${size}px preserved` }).svg;
}

const collisionEvidence = [];
for (const worldId of ICON_FINALIST_WORLDS) {
  const rows = [...ICON_FINALIST_MUST_REVISIT, ...ICON_FINALIST_REFINE].map((iconId) => {
    const baseline = renderCraftGlyphSvg(worldId, iconId, { size: 16, title: `${iconLabel[iconId]} craft baseline` }).svg;
    const fixtureId = CONTEXT_FIXTURE[worldId][iconId];
    const refined = contextSvg(worldId, iconId, 16);
    const risks = (plan.externalCollisionByConcept?.[iconId] ?? []).map((risk) => `<span class="risk danger">${esc(risk)}</span>`).join('');
    return `<div class="card" style="display:grid;grid-template-columns:130px 90px 90px 1fr;gap:14px;align-items:center"><div><div class="candidate-title">${esc(iconLabel[iconId])}</div><div class="note">context fixture: ${esc(fixtureId)}</div></div><div><div class="note">Craft baseline</div><div class="glyph" style="justify-content:flex-start;margin-top:8px">${img(baseline,16)}</div></div><div><div class="note">Refined</div><div class="glyph" style="justify-content:flex-start;margin-top:8px">${img(refined,16)}</div></div><div>${risks}</div></div>`;
  }).join('');
  const html = htmlDoc(`${worldLabel[worldId]} external metaphor collision review`, `<main class="board"><div class="eyebrow">Human-review evidence · external semantic collisions</div><h1>${esc(worldLabel[worldId])}</h1><div class="sub">Ask whether the refined candidate still strongly resembles an established developer/UI symbol with a different learned meaning. The labels at right are review prompts, not an automatic classifier. No pass/fail or world winner is computed.</div><div class="grid">${rows}</div></main>`);
  const outFile = path.join(collisionRoot, `${worldId}.png`);
  const rendered = await renderHtml(html, outFile, { width: 1280, height: 820 });
  collisionEvidence.push({ worldId, ...rendered, humanReviewOnly: true, automaticRejectionAllowed: false });
}

const textPairEvidence = [];
for (const worldId of ICON_FINALIST_WORLDS) {
  const rows = plan.textPairingProof.rows.map((row) => {
    const variants = row.candidateGlyphSizesPx.map((size) => `<div class="pair"><span class="iconbox">${img(contextSvg(worldId, row.iconId, size), size)}</span><span class="pairtext" style="font-size:${row.textSizePx}px;font-weight:${row.textWeight}">${esc(row.label)}</span><span class="spec">${size}px glyph</span></div>`).join('');
    return `<div class="pairrow"><div class="pairlabel">${esc(iconLabel[row.iconId])}<small>Inter ${row.textSizePx}px / ${row.textWeight}</small></div>${variants}</div>`;
  }).join('');
  const extraCss = `.pairrow{display:grid;grid-template-columns:190px 1fr 1fr;gap:16px;align-items:center;border-top:1px solid var(--line);padding:17px 0}.pairlabel{font-size:12px;font-weight:650}.pairlabel small{display:block;font-size:10px;font-weight:400;color:var(--muted);margin-top:4px}.pair{display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px 13px;min-height:48px}.iconbox{width:22px;height:22px;display:flex;align-items:center;justify-content:center}.pairtext{line-height:1.3}.spec{margin-left:auto;font:9px ui-monospace,monospace;color:var(--muted)}`;
  const html = htmlDoc(`${worldLabel[worldId]} text pairing`, `<main class="board"><div class="eyebrow">Typography integration proof</div><h1>${esc(worldLabel[worldId])} · icons as typography</h1><div class="sub">Real Visual System interface family and role sizes. Compare optical baseline, cap-height relationship, margins, icon-to-label gap and relative weight. Candidate glyph size is allowed to differ from text size.</div>${rows}</main>`, extraCss);
  const outFile = path.join(textRoot, `${worldId}.png`);
  const rendered = await renderHtml(html, outFile, { width: 1220, height: 650 });
  textPairEvidence.push({ worldId, ...rendered, fontFamily: 'Inter', rows: plan.textPairingProof.rows });
}

const uiContextEvidence = [];
for (const worldId of ICON_FINALIST_WORLDS) {
  const navIcon = (id) => `<span class="navico">${img(contextSvg(worldId,id,14),14)}</span>`;
  const bodyIcon = (id) => `<span class="bodyico">${img(contextSvg(worldId,id,16),16)}</span>`;
  const extraCss = `.shell{display:grid;grid-template-columns:210px 1fr 285px;min-height:760px;background:var(--bg);border:1px solid var(--line)}.left{background:color-mix(in srgb,var(--surface) 82%,transparent);border-right:1px solid var(--line);padding:22px 16px}.brand{font-size:15px;font-weight:650;margin-bottom:24px}.navrow{display:flex;align-items:center;gap:9px;height:36px;font-size:13px;font-weight:500;color:var(--muted)}.navrow.active{color:var(--ink)}.navico,.bodyico{display:flex;align-items:center;justify-content:center;width:20px}.main{padding:34px 40px}.main h2{font-size:27px;letter-spacing:-.03em;margin:0 0 8px}.body{font-size:14.5px;line-height:1.62;max-width:64ch;color:#333A35}.decision{margin-top:28px;border-top:2px solid var(--lineage);padding:15px 0}.row{display:flex;align-items:center;gap:10px;border-top:1px solid var(--line);padding:13px 0;font-size:14.5px}.row small{margin-left:auto;color:var(--muted);font-size:11px}.right{border-left:1px solid var(--line);padding:28px 20px;background:color-mix(in srgb,var(--surface) 75%,transparent)}.approval{border-top:5px solid var(--consequence);padding-top:16px}.approval-title{display:flex;align-items:center;gap:10px;font-size:14.5px;font-weight:650}.approval p{font-size:12px;line-height:1.5;color:var(--muted)}.button{margin-top:10px;background:var(--consequence);color:white;border-radius:8px;padding:10px 12px;font-size:12px;font-weight:650;text-align:center}.fixture{margin-top:18px;font-size:10px;color:var(--muted);line-height:1.5}`;
  const body = `<main class="board"><div class="eyebrow">Actual UI context · context fixture candidates only</div><h1>${esc(worldLabel[worldId])}</h1><div class="sub">The interface uses the approved Visual System hierarchy and typography. The finalist candidates shown here are fixture choices for contextual inspection—not recommendations or selection.</div><div class="shell"><aside class="left"><div class="brand">AI Council</div><div class="navrow active">${navIcon('council')}Council review</div><div class="navrow">${navIcon('projects')}Projects</div><div class="navrow">${navIcon('memory')}Project Memory</div><div class="navrow">${navIcon('search')}Search</div></aside><section class="main"><div class="eyebrow">Routing authority</div><h2>Should cognition control routing now?</h2><p class="body">Keep the current router authoritative while cognitive routing runs in shadow mode. Compare decision deltas before transferring consequence.</p><div class="decision"><div class="row">${bodyIcon('decision')}<strong>Active decision</strong><small>shadow mode first</small></div><div class="row">${bodyIcon('evidence')}12 sources<small>repository + evaluation evidence</small></div><div class="row">${bodyIcon('provenance')}Decision provenance<small>request → evidence → judgment</small></div><div class="row">${bodyIcon('verification')}Verified condition<small>authority unchanged</small></div><div class="row">${bodyIcon('supersede')}Superseded assumption<small>retained in history</small></div></div></section><aside class="right"><div class="approval"><div class="approval-title">${bodyIcon('authority')}Approval required</div><p>Crossing from recommendation into routing authority changes consequential product behavior. Human authorization remains required.</p><div class="button">Review authority boundary</div></div><div class="fixture">Context fixture candidates: ${Object.entries(CONTEXT_FIXTURE[worldId]).map(([k,v]) => `${k}=${v}`).join(' · ')}</div></aside></div></main>`;
  const html = htmlDoc(`${worldLabel[worldId]} UI context`, body, extraCss);
  const outFile = path.join(uiRoot, `${worldId}.png`);
  const rendered = await renderHtml(html, outFile, { width: 1320, height: 920 });
  uiContextEvidence.push({ worldId, ...rendered, contexts: plan.actualUiContexts, contextFixtureOnly: true });
}

const mobileTargetEvidence = [];
for (const worldId of ICON_FINALIST_WORLDS) {
  const controls = ['back','search','attach','send'];
  const extraCss = `.phone{width:390px;background:var(--surface);border:1px solid var(--line);border-radius:28px;padding:18px;margin:0 auto}.topbar,.composer{display:flex;align-items:center;justify-content:space-between}.targets{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px}.targetcase{background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:14px}.targetrow{display:flex;align-items:center;gap:10px;margin:10px 0}.tap{display:flex;align-items:center;justify-content:center;border:1px solid var(--line);background:var(--raised);border-radius:12px}.tap44{width:44px;height:44px}.tap48{width:48px;height:48px}.targetlabel{font-size:12px}.approval-mobile{margin-top:18px;border-top:4px solid var(--consequence);padding-top:14px}.approval-mobile .line{display:flex;align-items:center;gap:10px;font-size:14.5px;font-weight:650}`;
  const cases = controls.map((id) => `<div class="targetcase"><div class="targetlabel">${esc(iconLabel[id])} · fixed 16px glyph</div><div class="targetrow"><div class="tap tap44">${img(contextSvg(worldId,id,16),16)}</div><span class="note">44px target</span></div><div class="targetrow"><div class="tap tap48">${img(contextSvg(worldId,id,16),16)}</div><span class="note">48px target</span></div></div>`).join('');
  const html = htmlDoc(`${worldLabel[worldId]} mobile target proof`, `<main class="board"><div class="eyebrow">Mobile interaction-target proof</div><h1>${esc(worldLabel[worldId])}</h1><div class="sub">The glyph remains 16px. Tap affordance grows to 44–48px. This proof prevents mobile accessibility requirements from distorting the icon family itself.</div><div class="phone"><div class="topbar"><div class="tap tap44">${img(contextSvg(worldId,'back',16),16)}</div><strong style="font-size:14px">AI Council</strong><div class="tap tap44">${img(contextSvg(worldId,'search',16),16)}</div></div><div class="targets">${cases}</div><div class="approval-mobile"><div class="line"><div class="tap tap44">${img(contextSvg(worldId,'authority',16),16)}</div>Approval required</div><p class="note">16px Authority glyph inside a 44px semantic action target; the label carries the abstract meaning.</p></div></div></main>`, extraCss);
  const outFile = path.join(mobileRoot, `${worldId}.png`);
  const rendered = await renderHtml(html, outFile, { width: 900, height: 1060 });
  mobileTargetEvidence.push({ worldId, ...rendered, glyphSizePx: 16, targetSizesPx: [44,48] });
}

const finalistWorldEvidence = [];
for (const worldId of ICON_FINALIST_WORLDS) {
  const ordered = ['council','decision','evidence','provenance','authority','supersede','verification','memory','projects','search','back','attach','send','edit'];
  const cards = ordered.map((iconId) => `<div class="card"><div class="candidate-title">${esc(iconLabel[iconId])}</div><div class="sizes" style="min-height:58px;margin-top:4px">${[14,16,24].filter((size) => size !== 24 || !ICON_FINALIST_FREEZE.includes(iconId)).map((size) => `<div class="size-item"><div class="glyph">${img(contextSvg(worldId,iconId,size),size)}</div>${size}</div>`).join('')}</div></div>`).join('');
  const squint = ordered.map((iconId) => `<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center">${img(contextSvg(worldId,iconId,16),16)}</div>`).join('');
  const html = htmlDoc(`${worldLabel[worldId]} finalist overview`, `<main class="board"><div class="eyebrow">Finalist integration overview · no selection</div><h1>${esc(worldLabel[worldId])}</h1><div class="sub">Context fixture candidates plus preserved/frozen icons. Inspect family rhythm with labels, then use the unlabeled 16px strip as a squint test. The fixture choices are not yet independent-review recommendations.</div><div class="grid cols5">${cards}</div><div class="section"><div class="candidate-title">Unlabeled 16px squint strip</div><div style="display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);padding:18px;border-radius:12px;margin-top:10px">${squint}</div></div></main>`);
  const outFile = path.join(overviewRoot, `${worldId}.png`);
  const rendered = await renderHtml(html, outFile, { width: 1280, height: 980 });
  finalistWorldEvidence.push({ worldId, overviewRef: rendered.imageRef, sourceRef: rendered.sourceRef, exactBrowserProof: true, contextFixtureOnly: true });
}

const contextFixtureCandidates = ICON_FINALIST_WORLDS.map((worldId) => ({
  worldId,
  candidates: CONTEXT_FIXTURE[worldId],
  contextFixtureOnly: true,
  worldSelection: false,
  humanSelected: false
}));

const proof = buildIconFinalistSemanticEvidence({
  plan,
  hypothesisEvidence,
  collisionEvidence,
  textPairEvidence,
  uiContextEvidence,
  mobileTargetEvidence,
  finalistWorldEvidence,
  contextFixtureCandidates,
  candidateRecommendations: []
});
if (!proof.reviewReady) throw new Error(`Finalist semantic proof not ready: ${proof.findings.map((item) => item.code).join(', ')}`);

await browser.close();
await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify({
  ...proof,
  artifactPurpose: 'Finalist semantic/metaphor refinement only; no Icon World selection authority.',
  candidateGeometrySource: 'modules/icon-system/finalist-glyphs.mjs',
  sourcePlanRef: 'projects/ai-council/icon-finalist-semantic-refinement-v1.json',
  craftReviewRef: 'projects/ai-council/icon-world-craft-review-v1.json',
  retiredFromActiveRefinement: ['quiver-construct'],
  selectedWorld: null
}, null, 2));

console.log(`AI Council Icon Finalist Semantic Refinement V1: ${hypothesisEvidence.length} hypotheses across 2 finalist worlds; exact-browser context proof complete; no selection.`);
