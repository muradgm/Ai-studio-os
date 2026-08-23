import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import {
  buildIconSemanticInventory,
  buildIconWorldExploration,
  buildIconCalibrationProofEvidence,
  REQUIRED_ICON_WORLDS,
  REQUIRED_CALIBRATION_ICONS,
  REQUIRED_SIZE_MATRIX,
  REQUIRED_CONFUSING_PAIRS
} from '../modules/icon-system/runtime.mjs';
import {
  renderCalibrationSvg,
  validateCalibrationSvg,
  PROOF_GLYPH_IDS,
  CONTRAST_GLYPH_IDS
} from '../modules/icon-system/calibration-glyphs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'icon-system-v1-calibration');
const svgRoot = path.join(outputRoot, 'svg');
const specimenRoot = path.join(outputRoot, 'specimens');
const interfaceRoot = path.join(outputRoot, 'interface');
const comparisonRoot = path.join(outputRoot, 'comparisons');
const sourceRoot = path.join(outputRoot, 'source-html');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const visualApproval = await readJson(path.join(projectRoot, 'visual-system-v1-human-approval.json'));
const inventoryInput = await readJson(path.join(projectRoot, 'icon-semantic-inventory-v1.json'));
const explorationInput = await readJson(path.join(projectRoot, 'icon-world-exploration-v1.json'));
const visualSystem = await readJson(path.join(projectRoot, 'visual-system-v1.json'));

const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: visualApproval });
if (!inventory.reviewReady) throw new Error(`Icon inventory is not ready: ${inventory.findings.map((item) => item.code).join(', ')}`);
const exploration = buildIconWorldExploration(explorationInput, { inventory });
if (!exploration.reviewReady) throw new Error(`Icon World exploration is not ready: ${exploration.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [svgRoot, specimenRoot, interfaceRoot, comparisonRoot, sourceRoot]) await fs.mkdir(dir, { recursive: true });
for (const worldId of REQUIRED_ICON_WORLDS) await fs.mkdir(path.join(svgRoot, worldId), { recursive: true });

const rel = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);

const iconById = new Map(inventory.icons.map((icon) => [icon.id, icon]));
const worldById = new Map(exploration.worlds.map((world) => [world.id, world]));
const svgRefs = new Map();
let svgIntegrityPass = true;
const svgIntegrityFindings = [];

for (const worldId of REQUIRED_ICON_WORLDS) {
  for (const iconId of PROOF_GLYPH_IDS) {
    const iconSpec = iconById.get(iconId);
    if (!iconSpec) throw new Error(`Proof glyph ${iconId} is not present in the semantic inventory.`);
    const svg = renderCalibrationSvg(worldId, iconId, { title: `${worldById.get(worldId).label}: ${iconSpec.label}` });
    const integrity = validateCalibrationSvg(svg);
    if (!integrity.pass) {
      svgIntegrityPass = false;
      svgIntegrityFindings.push({ worldId, iconId, findings: integrity.findings });
    }
    const file = path.join(svgRoot, worldId, `${iconId}.svg`);
    await fs.writeFile(file, svg);
    svgRefs.set(`${worldId}:${iconId}`, file);
  }
}
if (!svgIntegrityPass) throw new Error(`Calibration SVG integrity failed: ${JSON.stringify(svgIntegrityFindings)}`);

const tokens = visualSystem.color.tokens;
const baseCss = `
  *{box-sizing:border-box}html,body{margin:0;background:${tokens.canvas};color:${tokens.ink};font-family:Inter,Arial,sans-serif}
  body{padding:26px}.kicker{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:${tokens.mutedInk};font-weight:700}
  h1{font-family:Georgia,serif;font-size:34px;font-weight:400;letter-spacing:-.025em;margin:8px 0 6px}p{color:${tokens.mutedInk};font-size:12px;line-height:1.55;margin:0}
  .card{background:${tokens.surface};border:1px solid ${tokens.line};border-radius:12px}.label{font-size:11px;font-weight:650}.meta{font-size:9px;color:${tokens.mutedInk}}
  img.glyph{display:block}
`;

function svgUrl(worldId, iconId) {
  const file = svgRefs.get(`${worldId}:${iconId}`);
  if (!file) throw new Error(`Missing generated SVG for ${worldId}:${iconId}`);
  return pathToFileURL(file).href;
}

function specimenHtml(worldId) {
  const world = worldById.get(worldId);
  const rows = REQUIRED_CALIBRATION_ICONS.map((iconId) => {
    const iconSpec = iconById.get(iconId);
    const sizes = REQUIRED_SIZE_MATRIX.map((size) => `<div class="size"><img class="glyph" src="${svgUrl(worldId, iconId)}" width="${size}" height="${size}"><span>${size}</span></div>`).join('');
    return `<div class="row"><div class="identity"><img class="glyph" src="${svgUrl(worldId, iconId)}" width="32" height="32"><div><b>${esc(iconSpec.label)}</b><small>${esc(iconSpec.semanticClass)}</small></div></div><div class="sizes">${sizes}</div><div class="rule">${esc(iconSpec.recognitionRule)}</div></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}
    body{min-width:1240px}.header{max-width:1080px;margin:0 auto 24px}.world-note{margin-top:12px;max-width:760px}.specimen{max-width:1180px;margin:0 auto;border-top:1px solid ${tokens.ink}}.row{display:grid;grid-template-columns:240px 390px minmax(0,1fr);gap:20px;align-items:center;padding:16px 0;border-bottom:1px solid ${tokens.line}}.identity{display:flex;align-items:center;gap:14px}.identity b{font-size:12px}.identity small{display:block;font-size:9px;color:${tokens.mutedInk};margin-top:3px}.sizes{display:flex;align-items:end;gap:15px}.size{width:38px;height:52px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px}.size span{font:9px/1 monospace;color:${tokens.mutedInk}}.rule{font-size:10px;line-height:1.45;color:${tokens.mutedInk}}
  </style></head><body><header class="header"><div class="kicker">AI Council Icon System V1 · calibration · no selection</div><h1>${esc(world.label)}</h1><p>${esc(world.idea)}</p><p class="world-note"><b>Risk:</b> ${esc(world.risk)}</p></header><main class="specimen">${rows}</main></body></html>`;
}

function icon(worldId, iconId, size = 18, className = '') {
  return `<img class="glyph ${className}" src="${svgUrl(worldId, iconId)}" width="${size}" height="${size}" alt="">`;
}

function interfaceHtml(worldId) {
  const world = worldById.get(worldId);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}
    body{padding:0;min-width:1280px}.shell{display:grid;grid-template-columns:210px minmax(0,1fr) 292px;min-height:900px}.side{border-right:1px solid ${tokens.line};padding:24px 18px;background:${tokens.surface}}.brand{font-weight:700;font-size:15px;margin-bottom:28px}.section{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:${tokens.mutedInk};margin:22px 0 8px}.nav{height:34px;display:flex;gap:10px;align-items:center;font-size:12px}.nav.active{font-weight:650}.main{padding:28px 42px 60px}.top{display:flex;justify-content:space-between;border-bottom:1px solid ${tokens.line};padding-bottom:14px;margin-bottom:28px}.top b{font-size:12px}.recommend{border-top:1px solid ${tokens.ink};padding-top:18px;max-width:760px}.recommend-head{display:flex;gap:12px;align-items:flex-start}.recommend h2{font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.08;margin:0 0 12px}.recommend p{font-size:14px;max-width:64ch;color:${tokens.ink}}.chips{display:flex;gap:8px;margin-top:18px}.chip{display:flex;align-items:center;gap:6px;border:1px solid ${tokens.line};border-radius:999px;padding:6px 9px;font-size:10px}.evidence{margin-top:34px;border-top:1px solid ${tokens.line}}.evidence-row{display:grid;grid-template-columns:22px 1fr 22px 90px;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid ${tokens.line};font-size:11px}.evidence-row span{color:${tokens.mutedInk};font-size:9px}.approval{margin-top:34px;border-top:4px solid ${tokens.consequence};padding-top:16px}.approval-title{display:flex;gap:10px;align-items:center;color:${tokens.consequence};font-size:10px;font-weight:750;letter-spacing:.05em}.approval-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.approval-grid div{padding:10px 0;border-top:1px solid ${tokens.line};font-size:10px}.memory{margin-top:34px;border-top:1px solid ${tokens.line};padding-top:16px}.memory-row{display:grid;grid-template-columns:22px 1fr 22px 110px;gap:10px;align-items:center;padding:11px 0;border-top:1px solid ${tokens.line};font-size:11px}.context{border-left:1px solid ${tokens.line};padding:24px 18px;background:color-mix(in srgb,${tokens.surface} 75%,transparent)}.context h3{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:${tokens.mutedInk};margin:0 0 12px}.context-block{border-top:1px solid ${tokens.line};padding:12px 0}.context-line{display:flex;gap:8px;align-items:center;font-size:10px;margin:8px 0}.proof{position:fixed;right:14px;bottom:12px;font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:${tokens.mutedInk};background:${tokens.surface};border:1px solid ${tokens.line};padding:6px 9px;border-radius:999px}
  </style></head><body><div class="shell"><aside class="side"><div class="brand">AI Council</div><div class="section">Project</div><div class="nav active">${icon(worldId,'projects',16)} AI Council</div><div class="section">Conversations</div><div class="nav">${icon(worldId,'council',16)} Architecture</div><div class="nav">${icon(worldId,'decision',16)} Cognitive Reliability</div><div class="section">Global</div><div class="nav">${icon(worldId,'search',16)} Search</div><div class="nav">${icon(worldId,'memory',16)} Memory</div></aside><main class="main"><div class="top"><b>AI Council / Architecture</b><span class="meta">${esc(world.label)} · calibration context</span></div><section class="recommend"><div class="kicker">Structured recommendation</div><div class="recommend-head">${icon(worldId,'council',24)}<div><h2>Keep the current TypeScript control plane.</h2><p>The stronger risks are decision quality, evidence discipline, and authority boundaries—not language capability.</p></div></div><div class="chips"><div class="chip">${icon(worldId,'decision',14)} Decision</div><div class="chip">${icon(worldId,'provenance',14)} Provenance</div><div class="chip">${icon(worldId,'verification',14)} Verified</div></div></section><section class="evidence"><div class="section">Evidence</div><div class="evidence-row">${icon(worldId,'evidence',16)}<b>Architecture contract</b>${icon(worldId,'provenance',14)}<span>why used</span></div><div class="evidence-row">${icon(worldId,'evidence',16)}<b>Routing decision history</b>${icon(worldId,'verification',14)}<span>verified</span></div></section><section class="approval"><div class="approval-title">${icon(worldId,'authority',18)} APPROVAL REQUIRED · ADVICE ENDS HERE</div><div class="approval-grid"><div>Risk<br><b>Medium</b></div><div>Reversibility<br><b>High</b></div><div>Scope<br><b>Create branch + modify routing files</b></div><div>Authority<br><b>Human required</b></div></div></section><section class="memory"><div class="section">Project Memory</div><div class="memory-row">${icon(worldId,'memory',16)}<b>Routing remains advisory until benchmark passes.</b>${icon(worldId,'supersede',14)}<span>Supersede</span></div></section></main><aside class="context"><h3>Current Context</h3><div class="context-block"><div class="context-line">${icon(worldId,'projects',14)} AI Council</div><div class="context-line">${icon(worldId,'evidence',14)} Repository evidence</div><div class="context-line">${icon(worldId,'provenance',14)} Related decision history</div><div class="context-line">${icon(worldId,'verification',14)} Constraints verified</div></div><h3>Icon World</h3><div class="context-block"><p>${esc(world.signatureBehavior)}</p></div></aside></div><div class="proof">Icon calibration · exact browser · no human selection</div></body></html>`;
}

function comparisonHtml(iconId) {
  const iconSpec = iconById.get(iconId);
  const columns = REQUIRED_ICON_WORLDS.map((worldId) => {
    const world = worldById.get(worldId);
    const sizes = [14,16,18,24].map((size) => `<div class="cmp-size">${icon(worldId, iconId, size)}<span>${size}px</span></div>`).join('');
    return `<section class="world"><div class="kicker">${esc(world.label)}</div><div class="large">${icon(worldId, iconId, 48)}</div><div class="cmp-sizes">${sizes}</div><p>${esc(world.signatureBehavior)}</p></section>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}
    body{min-width:1000px}.head{max-width:940px;margin:0 auto 22px}.grid{max-width:940px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.world{background:${tokens.surface};border:1px solid ${tokens.line};padding:20px;min-height:270px}.large{height:78px;display:flex;align-items:center;justify-content:center}.cmp-sizes{display:flex;justify-content:center;align-items:flex-end;gap:18px;padding:12px 0 18px;border-top:1px solid ${tokens.line};border-bottom:1px solid ${tokens.line}}.cmp-size{display:flex;flex-direction:column;align-items:center;gap:7px}.cmp-size span{font:9px/1 monospace;color:${tokens.mutedInk}}.world p{font-size:10px;margin-top:14px}
  </style></head><body><header class="head"><div class="kicker">Same concept · same sizes · same semantics</div><h1>${esc(iconSpec.label)}</h1><p>${esc(iconSpec.meaning)}</p><p><b>Recognition rule:</b> ${esc(iconSpec.recognitionRule)}</p></header><main class="grid">${columns}</main></body></html>`;
}

function confusingPairsHtml() {
  const rows = REQUIRED_CONFUSING_PAIRS.map(([a,b]) => `<div class="pair"><div class="pair-title"><b>${esc(iconById.get(a)?.label ?? a)}</b><span>≠</span><b>${esc(iconById.get(b)?.label ?? b)}</b></div>${REQUIRED_ICON_WORLDS.map((worldId) => `<div class="pair-world"><span>${esc(worldById.get(worldId).label)}</span><div>${icon(worldId,a,18)}${icon(worldId,b,18)}</div></div>`).join('')}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}
    body{min-width:1100px}.head{max-width:1000px;margin:0 auto 20px}.pairs{max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:14px}.pair{background:${tokens.surface};border:1px solid ${tokens.line};padding:16px}.pair-title{display:flex;gap:8px;align-items:center;font-size:12px;border-bottom:1px solid ${tokens.line};padding-bottom:10px;margin-bottom:8px}.pair-title span{color:${tokens.mutedInk}}.pair-world{display:grid;grid-template-columns:1fr 90px;align-items:center;padding:8px 0;border-top:1px solid ${tokens.line};font-size:10px}.pair-world div{display:flex;justify-content:flex-end;gap:22px}
  </style></head><body><header class="head"><div class="kicker">Semantic confusion gate</div><h1>Related concepts must remain distinguishable.</h1><p>These pairings are deliberately tested before any Icon World may be selected.</p></header><main class="pairs">${rows}</main></body></html>`;
}

async function screenshot(browser, html, sourceName, imagePath, viewport, fullPage = false) {
  const sourcePath = path.join(sourceRoot, sourceName);
  await fs.writeFile(sourcePath, html);
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 10_000 });
  await page.screenshot({ path: imagePath, fullPage });
  await page.close();
  return { sourceRef: rel(sourcePath), imageRef: rel(imagePath) };
}

const browser = await chromium.launch({ headless: true });
const worldEvidence = [];
const semanticComparisons = [];
const interfaceEvidence = [];
let confusingPairsRef = null;
try {
  for (const worldId of REQUIRED_ICON_WORLDS) {
    const specimenPath = path.join(specimenRoot, `${worldId}.png`);
    const specimen = await screenshot(browser, specimenHtml(worldId), `specimen-${worldId}.html`, specimenPath, { width: 1280, height: 1200 }, true);
    const interfacePath = path.join(interfaceRoot, `${worldId}.png`);
    const interfaceShot = await screenshot(browser, interfaceHtml(worldId), `interface-${worldId}.html`, interfacePath, { width: 1440, height: 900 }, false);
    const evidence = {
      worldId,
      calibrationCoverage: `${REQUIRED_CALIBRATION_ICONS.length}/${REQUIRED_CALIBRATION_ICONS.length}`,
      sizeMatrixCoverage: `${REQUIRED_SIZE_MATRIX.length}/${REQUIRED_SIZE_MATRIX.length}`,
      specimenRef: specimen.imageRef,
      specimenSourceRef: specimen.sourceRef,
      interfaceRef: interfaceShot.imageRef,
      interfaceSourceRef: interfaceShot.sourceRef,
      svgDirectoryRef: rel(path.join(svgRoot, worldId)),
      svgIntegrityPass: true,
      exactBrowserProof: true
    };
    worldEvidence.push(evidence);
    interfaceEvidence.push({ worldId, imageRef: interfaceShot.imageRef, sourceRef: interfaceShot.sourceRef });
  }

  for (const iconId of REQUIRED_CALIBRATION_ICONS) {
    const output = path.join(comparisonRoot, `${iconId}.png`);
    const shot = await screenshot(browser, comparisonHtml(iconId), `comparison-${iconId}.html`, output, { width: 1000, height: 560 }, false);
    semanticComparisons.push({ iconId, imageRef: shot.imageRef, sourceRef: shot.sourceRef, worlds: REQUIRED_ICON_WORLDS, sizes: [14,16,18,24] });
  }

  const pairsPath = path.join(comparisonRoot, 'confusing-pairs.png');
  confusingPairsRef = await screenshot(browser, confusingPairsHtml(), 'confusing-pairs.html', pairsPath, { width: 1100, height: 1000 }, true);

  const proof = buildIconCalibrationProofEvidence({ exploration, worldEvidence, semanticComparisons, interfaceEvidence });
  if (!proof.reviewReady) throw new Error(`Icon calibration proof is incomplete: ${proof.findings.map((item) => item.code).join(', ')}`);

  const manifest = {
    ...proof,
    inventoryRef: {
      id: inventory.id,
      sourceRef: 'projects/ai-council/icon-semantic-inventory-v1.json',
      fingerprint: inventory.inventoryFingerprint
    },
    explorationRef: {
      id: exploration.id,
      sourceRef: 'projects/ai-council/icon-world-exploration-v1.json',
      fingerprint: exploration.explorationFingerprint
    },
    quiverLineAuthority: exploration.quiverLineAuthority,
    calibrationIconIds: REQUIRED_CALIBRATION_ICONS,
    contrastGlyphIds: CONTRAST_GLYPH_IDS,
    sizeMatrix: REQUIRED_SIZE_MATRIX,
    criticalSizeRange: [14,16,18],
    confusingPairs: REQUIRED_CONFUSING_PAIRS,
    confusingPairsRef,
    svgIntegrityFindings,
    selectedWorld: null,
    selection: null,
    truth: {
      ...proof.truth,
      exactBrowserProof: true,
      svgIntegrityPass: true,
      quiverLineSelected: false,
      iconWorldHumanSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`AI Council Icon System V1 calibration: ${worldEvidence.length} worlds × ${REQUIRED_CALIBRATION_ICONS.length} calibration glyphs + ${CONTRAST_GLYPH_IDS.length} contrast glyphs/world, ${semanticComparisons.length} comparisons, no selection.`);
} finally {
  await browser.close();
}
