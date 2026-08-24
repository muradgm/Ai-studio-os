import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import {
  buildStandardIconBenchmark,
  deriveStandardIconTruth
} from '../modules/standard-icon-benchmark/runtime.mjs';
import {
  buildStandardIconVectorArtifact,
  inspectStandardIconSvg
} from '../modules/standard-icon-benchmark/vector-adapter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.join(root, 'projects', 'standard-icon-logic-v1');
const out = path.join(root, 'artifacts', 'standard-icon-logic-v1');
const svgDir = path.join(out, 'svg');
const htmlDir = path.join(out, 'source-html');

const readJson = async (name) => JSON.parse(await fs.readFile(path.join(projectRoot, name), 'utf8'));
const benchmark = await readJson('benchmark-v1.json');
const inventory = await readJson('semantic-inventory-v1.json');
const styleBrief = await readJson('style-constitution-v1.json');
const memory = await readJson('drawing-memory-v1.json');

const model = buildStandardIconBenchmark({ benchmark, inventory, styleBrief, memory });
if (!model.pass) throw new Error(`Standard icon benchmark planning blocked: ${JSON.stringify(model.findings)}`);

await fs.rm(out, { recursive: true, force: true });
await Promise.all([out, svgDir, htmlDir].map((dir) => fs.mkdir(dir, { recursive: true })));
await fs.writeFile(path.join(out, 'style-constitution-resolved.json'), JSON.stringify(model.style, null, 2));

const artifacts = [];
for (const intent of model.intents) {
  const vector = buildStandardIconVectorArtifact(intent, model.style);
  const fileName = `${intent.conceptId}-${intent.targetSize}.svg`;
  const filePath = path.join(svgDir, fileName);
  await fs.writeFile(filePath, vector.svg);
  const emitted = await fs.readFile(filePath, 'utf8');
  const readback = inspectStandardIconSvg(emitted, { conceptId: intent.conceptId, targetSize: intent.targetSize });
  const fileRoundTripExact = emitted === vector.svg;
  if (readback.status !== 'ready' || !fileRoundTripExact) throw new Error(`SVG integrity failed for ${intent.conceptId}@${intent.targetSize}`);
  artifacts.push({ ...vector, svg: emitted, svgRef: `svg/${fileName}`, readback, fileRoundTripExact });
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function item(conceptId, size) {
  return artifacts.find((artifact) => artifact.conceptId === conceptId && artifact.targetSize === size);
}
function inlineSvg(conceptId, size, extraClass = '') {
  const artifact = item(conceptId, size);
  if (!artifact) throw new Error(`Missing artifact ${conceptId}@${size}`);
  return artifact.svg.replace('<svg ', `<svg data-standard-icon="true" class="standard-icon ${extraClass}" `);
}
function label(conceptId) {
  return model.inventory.concepts.find((concept) => concept.id === conceptId)?.label ?? conceptId;
}
function css() {
  return `<style>
    *{box-sizing:border-box}body{margin:0;background:#f4f2ec;color:#171816;font-family:Inter,Arial,sans-serif}.page{padding:48px 54px 60px;min-height:100vh}.eyebrow{font:11px/1.2 ui-monospace,SFMono-Regular,monospace;letter-spacing:.12em;text-transform:uppercase;color:#6b6d68;margin-bottom:12px}.title{font-family:Georgia,serif;font-size:40px;font-weight:500;line-height:1.06;margin:0 0 12px}.sub{max-width:980px;color:#5c5f59;font-size:14px;line-height:1.55;margin:0 0 32px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.card{background:#fff;border:1px solid #d8d8d2;border-radius:14px;padding:18px;min-height:182px}.card-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px}.name{font-size:15px;font-weight:650}.id{font:10px ui-monospace,SFMono-Regular,monospace;color:#858780}.sizes{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}.size-cell{text-align:center;min-width:44px}.stage{height:58px;display:grid;place-items:center;color:#171816}.px{font:10px ui-monospace,SFMono-Regular,monospace;color:#8a8c86;margin-top:5px}.standard-icon{display:block;overflow:visible}.pair-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.pair{background:#fff;border:1px solid #d8d8d2;border-radius:14px;padding:18px}.pair-icons{display:flex;align-items:center;justify-content:center;gap:28px;height:84px}.pair-name{text-align:center;font-size:12px;color:#62655f}.ui-shell{display:grid;grid-template-columns:220px 1fr;min-height:640px;background:#fff;border:1px solid #d7d8d2;border-radius:16px;overflow:hidden}.sidebar{padding:18px;border-right:1px solid #e5e5df;background:#faf9f5}.brand{font-family:Georgia,serif;font-size:19px;margin-bottom:28px}.nav{display:flex;align-items:center;gap:10px;padding:10px 9px;border-radius:9px;font-size:13px}.nav.active{background:#efeee8}.content{padding:22px 26px}.toolbar{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e8e8e2;padding-bottom:18px}.searchbox{display:flex;align-items:center;gap:8px;width:290px;border:1px solid #d9dad4;border-radius:10px;padding:9px 11px;color:#6c6e68;font-size:12px}.actions{display:flex;gap:8px}.icon-btn{width:44px;height:44px;border:1px solid #d9dad4;border-radius:10px;background:#fff;display:grid;place-items:center;color:#20211f}.panel{margin-top:26px;border:1px solid #dedfd9;border-radius:13px}.row{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-bottom:1px solid #ecece7}.row:last-child{border-bottom:0}.row-left{display:flex;align-items:center;gap:11px}.row-title{font-size:13px}.row-sub{font-size:11px;color:#7b7d77;margin-top:2px}.blind{display:grid;grid-template-columns:repeat(8,1fr);gap:14px}.blind-cell{height:112px;background:#fff;border:1px solid #d8d8d2;border-radius:13px;display:grid;place-items:center}.pairing{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.pairing-row{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #d8d8d2;border-radius:10px;padding:12px 14px;font-size:14px}.squint .standard-icon{opacity:.42;filter:blur(.45px)}.squint .card{background:#f8f7f2}.truth{margin-top:26px;padding:14px 16px;border-left:3px solid #222;background:#ecebe5;font:11px/1.6 ui-monospace,SFMono-Regular,monospace}
  </style>`;
}
function doc(title, sub, body, className = '') {
  return `<!doctype html><html><head><meta charset="utf-8">${css()}</head><body class="${className}"><main class="page"><div class="eyebrow">AI Studio OS · Standard Icon Logic Test V1</div><h1 class="title">${esc(title)}</h1><p class="sub">${esc(sub)}</p>${body}</main></body></html>`;
}

const specimenBody = `<section class="grid">${benchmark.concepts.map((conceptId) => `<article class="card"><div class="card-head"><span class="name">${esc(label(conceptId))}</span><span class="id">${conceptId}</span></div><div class="sizes">${benchmark.targetSizes.slice().reverse().map((size) => `<div class="size-cell"><div class="stage">${inlineSvg(conceptId, size)}</div><div class="px">${size}px</div></div>`).join('')}</div></article>`).join('')}</section><div class="truth">style = ${esc(model.style.resolvedStyle.name)}<br>candidate lane = ${esc(benchmark.benchmarkCandidateId)}<br>human review = false<br>production approval = false</div>`;

const collisionPairs = [['like','favorite'],['favorite','bookmark'],['share','upload'],['share','logout'],['download','upload'],['link','share'],['close','logout'],['filter','menu'],['edit','link']];
const collisionBody = `<section class="pair-grid">${collisionPairs.map(([a,b]) => `<article class="pair"><div class="pair-icons">${inlineSvg(a,16)}${inlineSvg(b,16)}</div><div class="pair-name">${esc(label(a))} ↔ ${esc(label(b))}</div></article>`).join('')}</section>`;

const uiBody = `<section class="ui-shell"><aside class="sidebar"><div class="brand">Studio Workspace</div>${[['home','Home'],['bookmark','Saved'],['favorite','Favorites'],['settings','Settings']].map(([id,text],index) => `<div class="nav ${index===0?'active':''}">${inlineSvg(id,16)}<span>${text}</span></div>`).join('')}</aside><div class="content"><div class="toolbar"><div class="searchbox">${inlineSvg('search',16)}<span>Search projects</span></div><div class="actions"><button class="icon-btn">${inlineSvg('filter',16)}</button><button class="icon-btn">${inlineSvg('menu',16)}</button><button class="icon-btn">${inlineSvg('close',16)}</button></div></div><div class="panel">${[['edit','Edit project','Modify title and metadata'],['share','Share','Send this project outward'],['download','Download','Save a local copy'],['upload','Upload','Add files to this project'],['lock','Security','Protected workspace'],['logout','Log out','Leave this account session']].map(([id,titleText,subText]) => `<div class="row"><div class="row-left">${inlineSvg(id,16)}<div><div class="row-title">${titleText}</div><div class="row-sub">${subText}</div></div></div>${id==='edit'?inlineSvg('link',16):''}</div>`).join('')}</div></div></section>`;

const blindBody = `<section class="blind">${benchmark.concepts.map((conceptId) => `<div class="blind-cell">${inlineSvg(conceptId,24)}</div>`).join('')}</section>`;
const pairingBody = `<section class="pairing">${benchmark.concepts.map((conceptId) => `<div class="pairing-row">${inlineSvg(conceptId,16)}<span>${esc(label(conceptId))}</span></div>`).join('')}</section>`;
const squintBody = `<section class="grid">${benchmark.concepts.map((conceptId) => `<article class="card"><div class="stage" style="height:110px">${inlineSvg(conceptId,24)}</div></article>`).join('')}</section>`;

const pages = [
  { id: 'specimen', file: 'specimen-overview.png', html: doc('One family, sixteen familiar actions', `AI Studio OS authored ${model.style.resolvedStyle.name}: ${model.style.resolvedStyle.thesis}`, specimenBody) },
  { id: 'collision', file: 'collision-pairs.png', html: doc('Semantic neighbors', 'Risky pairs are shown at 16px without decorative rescue. Human review judges whether the authored style preserves functional distinction.', collisionBody) },
  { id: 'ui-context', file: 'ui-context.png', html: doc('Real interface context', 'The same generated SVGs are placed in navigation, toolbar and settings contexts. Interactive targets are larger than glyphs.', uiBody) },
  { id: 'label-blind', file: 'label-blind.png', html: doc('Label-blind recognition', 'No labels appear inside the specimen field. Conventional controls should remain immediately plausible without textual rescue.', blindBody) },
  { id: 'text-pairing', file: 'text-pairing.png', html: doc('Icon + text pairing', 'This board checks baseline, optical gap and icon/text weight in realistic compact rows.', pairingBody) },
  { id: 'squint', file: 'squint-family-rhythm.png', html: doc('Squint family rhythm', 'Reduced contrast and slight blur expose occupancy, directional bias and family rhythm without pretending to score aesthetics automatically.', squintBody, 'squint') }
];

await Promise.all(pages.map(({ id, html }) => fs.writeFile(path.join(htmlDir, `${id}.html`), html)));

async function renderAndAssert(page, pageSpec) {
  await page.goto(`file://${path.join(htmlDir, `${pageSpec.id}.html`)}`);
  const report = await page.locator('svg[data-standard-icon="true"]').evaluateAll((nodes) => nodes.map((svg) => {
    const rect = svg.getBoundingClientRect();
    const group = svg.querySelector('g');
    const box = group ? group.getBBox() : { width: 0, height: 0 };
    return {
      concept: svg.getAttribute('data-concept'),
      size: Number(svg.getAttribute('data-size')),
      width: rect.width,
      height: rect.height,
      inkWidth: box.width,
      inkHeight: box.height,
      shapes: svg.querySelectorAll('path,line,circle,rect,polygon,polyline').length
    };
  }));
  if (!report.length) throw new Error(`${pageSpec.id}: no standard icons rendered.`);
  for (const row of report) {
    const geometricExtent = row.inkWidth > 0 || row.inkHeight > 0;
    if (!(row.width > 0 && row.height > 0 && geometricExtent && row.shapes > 0)) throw new Error(`${pageSpec.id}: non-rendered glyph ${JSON.stringify(row)}`);
  }
  await page.screenshot({ path: path.join(out, pageSpec.file), fullPage: true });
  return { page: pageSpec.id, pass: true, glyphCount: report.length, glyphs: report };
}

const browserReports = [];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
  for (const pageSpec of pages) browserReports.push(await renderAndAssert(page, pageSpec));
} finally {
  await browser.close();
}

const inventoryPassed = model.inventory.pass;
const styleConstitutionAuthored = model.style.constitutionAuthored === true;
const drawingPlansPassed = model.plans.length === benchmark.concepts.length && model.plans.every((plan) => plan.pass);
const sizeBudgetExecutionEnforced = benchmark.concepts.every((conceptId) => benchmark.targetSizes.every((size) => {
  const artifact = item(conceptId, size);
  if (!artifact) return false;
  const expected = size <= 16 ? 1 : 2;
  return artifact.retainedSemanticDeviceIds.length === expected;
}));
const vectorSpecValidationPassed = artifacts.every((artifact) => artifact.vectorSpecValidation.status === 'ready');
const emittedSvgIntegrityPassed = artifacts.every((artifact) => artifact.emittedSvgIntegrity.status === 'ready' && artifact.readback.status === 'ready' && artifact.fileRoundTripExact);
const browserGlyphRenderPassed = browserReports.every((report) => report.pass);

const truth = deriveStandardIconTruth({
  inventoryPassed,
  styleConstitutionAuthored,
  drawingPlansPassed,
  sizeBudgetExecutionEnforced,
  vectorSpecValidationPassed,
  emittedSvgIntegrityPassed,
  browserGlyphRenderPassed,
  specimenProofComplete: browserReports.some((r) => r.page === 'specimen' && r.pass),
  uiContextProofComplete: browserReports.some((r) => r.page === 'ui-context' && r.pass),
  collisionReviewComplete: browserReports.some((r) => r.page === 'collision' && r.pass),
  labelBlindProofComplete: browserReports.some((r) => r.page === 'label-blind' && r.pass),
  textPairingProofComplete: browserReports.some((r) => r.page === 'text-pairing' && r.pass),
  squintProofComplete: browserReports.some((r) => r.page === 'squint' && r.pass)
});

const manifest = {
  schema: 'ai-studio-os/standard-icon-proof-manifest@1',
  id: benchmark.id,
  status: truth.status,
  pass: truth.pass,
  reviewReady: truth.reviewReady,
  style: model.style.resolvedStyle,
  truth,
  conceptCount: benchmark.concepts.length,
  targetSizes: benchmark.targetSizes,
  emittedSvgCount: artifacts.length,
  browserReports,
  generatedFiles: pages.map((pageSpec) => pageSpec.file),
  humanStandardIconReviewComplete: false,
  standardIconSystemApproved: false
};

await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
if (!truth.pass) throw new Error(`Standard Icon Logic V1 proof blocked: ${JSON.stringify(truth)}`);
console.log(`Standard Icon Logic V1: ${artifacts.length} exact SVGs, ${pages.length} proof boards.`);
console.log(`Style: ${model.style.resolvedStyle.name}`);
console.log(`Status: ${truth.status}`);
console.log(`Artifact: ${out}`);
