import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import {
  buildIconSemanticInventory,
  buildIconWorldExploration
} from '../modules/icon-system/runtime.mjs';
import {
  ICON_CRAFT_WORLDS,
  ICON_CRAFT_SIZES,
  ICON_CRAFT_IDS,
  ICON_CRAFT_CONTROLS,
  buildIconCraftCalibrationPlan,
  auditRegistrationBudget,
  auditConventionalControlPurity,
  auditOpticalWeight,
  buildIconCraftCalibrationEvidence
} from '../modules/icon-system/craft-calibration.mjs';
import { renderCalibrationSvg, validateCalibrationSvg } from '../modules/icon-system/calibration-glyphs.mjs';
import { renderCraftGlyphSvg } from '../modules/icon-system/craft-glyphs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'icon-world-craft-calibration-v1');
const svgCurrentRoot = path.join(outputRoot, 'svg', 'current');
const svgCraftRoot = path.join(outputRoot, 'svg', 'craft');
const beforeAfterRoot = path.join(outputRoot, 'before-after');
const overviewRoot = path.join(outputRoot, 'world-overviews');
const controlsRoot = path.join(outputRoot, 'conventional-controls');
const similarityRoot = path.join(outputRoot, 'similarity');
const sourceRoot = path.join(outputRoot, 'source-html');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const visualApproval = await readJson(path.join(projectRoot, 'visual-system-v1-human-approval.json'));
const inventoryInput = await readJson(path.join(projectRoot, 'icon-semantic-inventory-v1.json'));
const explorationInput = await readJson(path.join(projectRoot, 'icon-world-exploration-v1.json'));
const independentReview = await readJson(path.join(projectRoot, 'icon-world-independent-review-v1.json'));
const craftInput = await readJson(path.join(projectRoot, 'icon-world-craft-calibration-v1.json'));

const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: visualApproval });
if (!inventory.reviewReady) throw new Error(`Icon inventory not ready: ${inventory.findings.map((item) => item.code).join(', ')}`);
const exploration = buildIconWorldExploration(explorationInput, { inventory });
if (!exploration.reviewReady) throw new Error(`Icon exploration not ready: ${exploration.findings.map((item) => item.code).join(', ')}`);
const plan = buildIconCraftCalibrationPlan(craftInput, { exploration, independentReview });
if (!plan.reviewReady) throw new Error(`Icon craft plan not ready: ${plan.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [svgCurrentRoot, svgCraftRoot, beforeAfterRoot, overviewRoot, controlsRoot, similarityRoot, sourceRoot]) await fs.mkdir(dir, { recursive: true });
for (const worldId of ICON_CRAFT_WORLDS) {
  await fs.mkdir(path.join(svgCurrentRoot, worldId), { recursive: true });
  await fs.mkdir(path.join(svgCraftRoot, worldId), { recursive: true });
}

const rel = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const worldLabel = new Map(exploration.worlds.map((world) => [world.id, world.label]));
const iconLabel = new Map(inventory.icons.map((icon) => [icon.id, icon.label]));

const glyphSamples = [];
const currentSvgByKey = new Map();
const craftSvgByKey = new Map();
const allNeededIds = [...new Set([
  ...ICON_CRAFT_IDS,
  ...ICON_CRAFT_CONTROLS,
  ...plan.similarityWarnings.pairs.flat()
])];

for (const worldId of ICON_CRAFT_WORLDS) {
  for (const iconId of allNeededIds) {
    for (const size of ICON_CRAFT_SIZES) {
      const title = `${worldLabel.get(worldId)} ${iconLabel.get(iconId) ?? iconId} ${size}px`;
      const currentSvg = renderCalibrationSvg(worldId, iconId, { title });
      const currentIntegrity = validateCalibrationSvg(currentSvg);
      if (!currentIntegrity.pass) throw new Error(`Baseline SVG invalid ${worldId}:${iconId}:${size}: ${currentIntegrity.findings.join(',')}`);
      const craft = renderCraftGlyphSvg(worldId, iconId, { size, title: `${title} craft-corrected` });
      const craftIntegrity = validateCalibrationSvg(craft.svg);
      if (!craftIntegrity.pass) throw new Error(`Craft SVG invalid ${worldId}:${iconId}:${size}: ${craftIntegrity.findings.join(',')}`);

      const currentFile = path.join(svgCurrentRoot, worldId, `${iconId}-${size}.svg`);
      const craftFile = path.join(svgCraftRoot, worldId, `${iconId}-${size}.svg`);
      await fs.writeFile(currentFile, currentSvg);
      await fs.writeFile(craftFile, craft.svg);
      const key = `${worldId}:${iconId}:${size}`;
      currentSvgByKey.set(key, currentSvg);
      craftSvgByKey.set(key, craft.svg);
      glyphSamples.push({
        worldId,
        iconId,
        size,
        variant: craft.variant,
        registrationNodeCount: craft.registrationNodeCount,
        signatureNodeCount: craft.signatureNodeCount,
        craftCorrected: craft.craftCorrected,
        currentSvgRef: rel(currentFile),
        craftSvgRef: rel(craftFile)
      });
    }
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });

const baseCss = `
  *{box-sizing:border-box} body{margin:0;background:#f4f1ea;color:#171716;font-family:Inter,Arial,sans-serif}
  .board{padding:34px 38px 42px;min-height:100vh}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#726f68;margin-bottom:10px}
  h1{font-family:Georgia,serif;font-weight:500;font-size:31px;line-height:1.05;margin:0 0 8px}.sub{font-size:13px;color:#67645f;max-width:820px;line-height:1.5;margin-bottom:24px}
  .grid{display:grid;gap:12px}.cols4{grid-template-columns:repeat(4,1fr)}.cols5{grid-template-columns:repeat(5,1fr)}
  .card{background:#fbfaf7;border:1px solid #d8d3c8;border-radius:12px;padding:16px}.label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#77736a;margin-bottom:12px}
  .glyph{display:flex;align-items:center;justify-content:center;min-height:82px;color:#191918}.glyph svg{display:block}.size{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;color:#77736a;text-align:center;margin-top:10px}
  .split{display:grid;grid-template-columns:1fr 1fr;gap:10px}.state{font-size:12px;font-weight:600;margin-bottom:8px}.current{color:#7c7770}.craft{color:#243e32}
  .rule{height:1px;background:#ded9ce;margin:18px 0}.note{font-size:12px;line-height:1.45;color:#625f58}
`;

function svgDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
function img(svg, size) {
  return `<img alt="" src="${svgDataUrl(svg)}" style="width:${size}px;height:${size}px;display:block">`;
}
function htmlDoc(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${baseCss}</style></head><body>${body}</body></html>`;
}
async function renderHtml(html, outFile, viewport = { width: 1280, height: 900 }) {
  const sourceFile = path.join(sourceRoot, `${path.basename(outFile, '.png')}-${Math.random().toString(36).slice(2, 8)}.html`);
  await fs.writeFile(sourceFile, html);
  await page.setViewportSize(viewport);
  await page.goto(pathToFileURL(sourceFile).href);
  await page.screenshot({ path: outFile, fullPage: true });
  return { imageRef: rel(outFile), sourceRef: rel(sourceFile) };
}

const beforeAfterEvidence = [];
for (const worldId of ICON_CRAFT_WORLDS) {
  for (const iconId of ICON_CRAFT_IDS) {
    const cells = ICON_CRAFT_SIZES.map((size) => {
      const key = `${worldId}:${iconId}:${size}`;
      return `<div class="card"><div class="label">${size}px</div><div class="split"><div><div class="state current">Current</div><div class="glyph">${img(currentSvgByKey.get(key), size)}</div></div><div><div class="state craft">Craft-corrected</div><div class="glyph">${img(craftSvgByKey.get(key), size)}</div></div></div></div>`;
    }).join('');
    const title = `${worldLabel.get(worldId)} · ${iconLabel.get(iconId) ?? iconId}`;
    const html = htmlDoc(title, `<main class="board"><div class="eyebrow">Icon World Craft Calibration V1 · before / after</div><h1>${esc(title)}</h1><div class="sub">Same semantic concept. Same world constitution. Intentional optical correction at 14 / 16 / 18px against the preserved 24px-oriented calibration baseline.</div><div class="grid cols4">${cells}</div></main>`);
    const outFile = path.join(beforeAfterRoot, `${worldId}-${iconId}.png`);
    const rendered = await renderHtml(html, outFile, { width: 1220, height: 520 });
    beforeAfterEvidence.push({ worldId, iconId, ...rendered, sizes: ICON_CRAFT_SIZES });
  }
}

const controlEvidence = [];
for (const worldId of ICON_CRAFT_WORLDS) {
  const cards = ICON_CRAFT_CONTROLS.map((iconId) => {
    const sizeRows = ICON_CRAFT_SIZES.map((size) => `<div style="display:flex;align-items:center;gap:12px;margin:8px 0"><span style="width:32px;font:11px ui-monospace,monospace;color:#777">${size}</span>${img(craftSvgByKey.get(`${worldId}:${iconId}:${size}`), size)}</div>`).join('');
    return `<div class="card"><div class="label">${esc(iconLabel.get(iconId) ?? iconId)}</div>${sizeRows}</div>`;
  }).join('');
  const html = htmlDoc(`${worldLabel.get(worldId)} conventional-control firewall`, `<main class="board"><div class="eyebrow">Conventional-control purity</div><h1>${esc(worldLabel.get(worldId))}</h1><div class="sub">Search, Back, Attach, Send and Edit must remain immediately conventional. No provenance nodes, lineage marks, quiver arrows beyond the established control silhouette, or semantic-brand decoration are permitted.</div><div class="grid cols5">${cards}</div></main>`);
  const outFile = path.join(controlsRoot, `${worldId}.png`);
  const rendered = await renderHtml(html, outFile, { width: 1240, height: 560 });
  controlEvidence.push({ worldId, ...rendered, controlIds: ICON_CRAFT_CONTROLS });
}

const worldEvidence = [];
for (const worldId of ICON_CRAFT_WORLDS) {
  const cards = ICON_CRAFT_IDS.map((iconId) => {
    const small = craftSvgByKey.get(`${worldId}:${iconId}:16`);
    const large = craftSvgByKey.get(`${worldId}:${iconId}:24`);
    return `<div class="card"><div class="label">${esc(iconLabel.get(iconId) ?? iconId)}</div><div style="display:flex;align-items:end;justify-content:center;gap:24px;min-height:84px">${img(small,16)}${img(large,24)}</div><div class="size">16 / 24px</div></div>`;
  }).join('');
  const html = htmlDoc(`${worldLabel.get(worldId)} craft overview`, `<main class="board"><div class="eyebrow">Icon World Craft Calibration V1</div><h1>${esc(worldLabel.get(worldId))}</h1><div class="sub">Craft-corrected grammar only. Human selection remains unset. Evaluate semantic separation, 14–18px calm, silhouette hierarchy and whether the world still feels coherent after correction.</div><div class="grid cols5">${cards}</div></main>`);
  const outFile = path.join(overviewRoot, `${worldId}.png`);
  const rendered = await renderHtml(html, outFile, { width: 1280, height: 760 });
  worldEvidence.push({ worldId, overviewRef: rendered.imageRef, sourceRef: rendered.sourceRef, exactBrowserProof: true });
}

async function rasterMetrics(svg, size) {
  return page.evaluate(async ({ svg, size }) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, 0, 0, size, size);
    URL.revokeObjectURL(url);
    const data = ctx.getImageData(0, 0, size, size).data;
    let ink = 0;
    let minX = size, minY = size, maxX = -1, maxY = -1;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const alpha = data[(y * size + x) * 4 + 3];
        if (alpha > 20) {
          ink++;
          minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
    }
    const total = size * size;
    const boundsArea = maxX >= minX ? ((maxX - minX + 1) * (maxY - minY + 1)) : 0;
    return { inkCoverage: ink / total, boundsOccupancy: boundsArea / total };
  }, { svg, size });
}

async function rasterSimilarity(svgA, svgB, size) {
  return page.evaluate(async ({ svgA, svgB, size }) => {
    async function pixels(svg) {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      ctx.drawImage(image, 0, 0, size, size);
      URL.revokeObjectURL(url);
      return ctx.getImageData(0, 0, size, size).data;
    }
    const a = await pixels(svgA);
    const b = await pixels(svgB);
    let diff = 0;
    for (let i = 0; i < a.length; i += 4) {
      diff += Math.abs(a[i + 3] - b[i + 3]) / 255;
    }
    return Math.max(0, 1 - (diff / (size * size)));
  }, { svgA, svgB, size });
}

const opticalVariantEvidence = [];
const opticalMeasurements = [];
for (const sample of glyphSamples.filter((item) => ICON_CRAFT_IDS.includes(item.iconId))) {
  const svg = craftSvgByKey.get(`${sample.worldId}:${sample.iconId}:${sample.size}`);
  const metrics = await rasterMetrics(svg, sample.size);
  opticalVariantEvidence.push({ ...sample, ...metrics });
  if ([14, 16, 18].includes(sample.size)) opticalMeasurements.push({ worldId: sample.worldId, iconId: sample.iconId, size: sample.size, ...metrics });
}

const registrationBudgetAudit = auditRegistrationBudget(glyphSamples, plan.registrationNodeBudget.limits);
const conventionalControlAudit = auditConventionalControlPurity(glyphSamples);
const opticalWeightAudit = auditOpticalWeight(opticalMeasurements, plan.opticalWeight);

const similarityWarnings = [];
for (const worldId of ICON_CRAFT_WORLDS) {
  for (const [leftId, rightId] of plan.similarityWarnings.pairs) {
    for (const size of plan.similarityWarnings.sizes) {
      const left = craftSvgByKey.get(`${worldId}:${leftId}:${size}`) ?? renderCraftGlyphSvg(worldId, leftId, { size }).svg;
      const right = craftSvgByKey.get(`${worldId}:${rightId}:${size}`) ?? renderCraftGlyphSvg(worldId, rightId, { size }).svg;
      const similarity = await rasterSimilarity(left, right, size);
      similarityWarnings.push({
        worldId,
        pair: [leftId, rightId],
        size,
        similarity: Number(similarity.toFixed(4)),
        similarityWarning: similarity >= plan.similarityWarnings.warningThreshold
      });
    }
  }
}

const similarityRows = similarityWarnings.map((item) => `<tr><td>${esc(worldLabel.get(item.worldId))}</td><td>${esc(item.pair.join(' ≠ '))}</td><td>${item.size}px</td><td>${item.similarity.toFixed(4)}</td><td>${item.similarityWarning ? 'REVIEW' : '—'}</td></tr>`).join('');
const similarityHtml = htmlDoc('Raster similarity warnings', `<main class="board"><div class="eyebrow">Mechanical warning only</div><h1>Semantic similarity warnings</h1><div class="sub">High raster similarity flags a nearest-neighbor pair for human inspection. It does not mean low similarity is semantically good, and this table has no selection authority.</div><table style="width:100%;border-collapse:collapse;background:#fbfaf7;border:1px solid #d8d3c8"><thead><tr><th>World</th><th>Pair</th><th>Size</th><th>Similarity</th><th>Warning</th></tr></thead><tbody>${similarityRows}</tbody></table><style>th,td{text-align:left;padding:9px 12px;border-bottom:1px solid #e0dbd1;font-size:12px}th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#777}</style></main>`);
await renderHtml(similarityHtml, path.join(similarityRoot, 'warnings.png'), { width: 1100, height: 900 });
await fs.writeFile(path.join(similarityRoot, 'warnings.json'), JSON.stringify(similarityWarnings, null, 2));

const proof = buildIconCraftCalibrationEvidence({
  plan,
  worldEvidence,
  beforeAfterEvidence,
  controlEvidence,
  opticalVariantEvidence,
  registrationBudgetAudit,
  conventionalControlAudit,
  opticalWeightAudit,
  similarityWarnings
});

await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify({
  ...proof,
  plan: {
    id: plan.id,
    craftFingerprint: plan.craftFingerprint,
    baseline: plan.baseline,
    selection: null,
    selectedWorld: null
  },
  machineAuthority: {
    similarityMayWarn: true,
    similarityMaySelect: false,
    automaticWinnerAllowed: false,
    hybridizationAllowed: false
  }
}, null, 2));

await browser.close();
if (!proof.reviewReady) throw new Error(`Icon craft proof not review-ready: ${proof.findings.map((item) => item.code).join(', ')}`);
console.log(`Icon World Craft Calibration V1 ready: ${beforeAfterEvidence.length} before/after boards, ${opticalVariantEvidence.length} optical samples, ${similarityWarnings.length} similarity measurements.`);
console.log(`Manifest: ${rel(path.join(outputRoot, 'manifest.json'))}`);
