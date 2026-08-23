import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'icon-world-craft-calibration-v1');
const manifestPath = path.join(outputRoot, 'manifest.json');
const similarityRoot = path.join(outputRoot, 'similarity');
const sourceRoot = path.join(outputRoot, 'source-html');
const craftSvgRoot = path.join(outputRoot, 'svg', 'craft');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const planInput = await readJson(path.join(projectRoot, 'icon-world-craft-calibration-v1.json'));
const manifest = await readJson(manifestPath);
const worlds = ['quiver-construct', 'editorial-sign', 'provenance-glyph'];
const pairs = planInput.similarityWarnings?.pairs ?? [];
const sizes = planInput.similarityWarnings?.sizes ?? [];
const threshold = Number(planInput.similarityWarnings?.warningThreshold ?? 0.55);
const alphaThreshold = Number(planInput.similarityWarnings?.alphaThreshold ?? 20);

if (planInput.similarityWarnings?.metric !== 'alpha-mask-jaccard') {
  throw new Error('Icon craft similarity finalizer requires alpha-mask-jaccard metric.');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1 });

async function inkJaccard(svgA, svgB, size) {
  return page.evaluate(async ({ svgA, svgB, size, alphaThreshold }) => {
    async function alphaMask(svg) {
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
      const rgba = ctx.getImageData(0, 0, size, size).data;
      const mask = new Uint8Array(size * size);
      for (let i = 0; i < mask.length; i++) mask[i] = rgba[i * 4 + 3] > alphaThreshold ? 1 : 0;
      return mask;
    }
    const left = await alphaMask(svgA);
    const right = await alphaMask(svgB);
    let intersection = 0;
    let union = 0;
    for (let i = 0; i < left.length; i++) {
      if (left[i] && right[i]) intersection++;
      if (left[i] || right[i]) union++;
    }
    return union === 0 ? 1 : intersection / union;
  }, { svgA, svgB, size, alphaThreshold });
}

const warnings = [];
for (const worldId of worlds) {
  for (const [leftId, rightId] of pairs) {
    for (const size of sizes) {
      const leftPath = path.join(craftSvgRoot, worldId, `${leftId}-${size}.svg`);
      const rightPath = path.join(craftSvgRoot, worldId, `${rightId}-${size}.svg`);
      const [leftSvg, rightSvg] = await Promise.all([fs.readFile(leftPath, 'utf8'), fs.readFile(rightPath, 'utf8')]);
      const similarity = await inkJaccard(leftSvg, rightSvg, size);
      warnings.push({
        worldId,
        pair: [leftId, rightId],
        size,
        metric: 'alpha-mask-jaccard',
        similarity: Number(similarity.toFixed(4)),
        similarityWarning: similarity >= threshold
      });
    }
  }
}

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const rows = warnings.map((item) => `<tr><td>${esc(item.worldId)}</td><td>${esc(item.pair.join(' ≠ '))}</td><td>${item.size}px</td><td>${item.similarity.toFixed(4)}</td><td>${item.similarityWarning ? 'REVIEW' : '—'}</td></tr>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#f4f1ea;color:#171716;font-family:Inter,Arial,sans-serif}.board{padding:34px 38px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#726f68;margin-bottom:10px}h1{font-family:Georgia,serif;font-weight:500;font-size:31px;margin:0 0 8px}.sub{font-size:13px;color:#67645f;max-width:850px;line-height:1.5;margin-bottom:22px}table{width:100%;border-collapse:collapse;background:#fbfaf7;border:1px solid #d8d3c8}th,td{text-align:left;padding:9px 12px;border-bottom:1px solid #e0dbd1;font-size:12px}th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#777}
</style></head><body><main class="board"><div class="eyebrow">Mechanical warning only · ink overlap</div><h1>Semantic similarity warnings</h1><div class="sub">Alpha-mask Jaccard compares only rendered ink. Shared empty canvas is excluded. High overlap flags a pair for human inspection; low overlap is not evidence of semantic quality and cannot select an Icon World.</div><table><thead><tr><th>World</th><th>Pair</th><th>Size</th><th>Ink overlap</th><th>Warning</th></tr></thead><tbody>${rows}</tbody></table></main></body></html>`;

await fs.mkdir(similarityRoot, { recursive: true });
await fs.mkdir(sourceRoot, { recursive: true });
const sourcePath = path.join(sourceRoot, 'similarity-ink-overlap.html');
await fs.writeFile(sourcePath, html);
await page.goto(pathToFileURL(sourcePath).href);
await page.screenshot({ path: path.join(similarityRoot, 'warnings.png'), fullPage: true });
await fs.writeFile(path.join(similarityRoot, 'warnings.json'), JSON.stringify(warnings, null, 2));

manifest.similarityWarnings = warnings;
manifest.similarityMetric = {
  id: 'alpha-mask-jaccard',
  alphaThreshold,
  warningThreshold: threshold,
  excludesEmptyCanvas: true,
  selectionAuthority: false,
  semanticPassAuthority: false
};
manifest.machineAuthority = {
  ...(manifest.machineAuthority ?? {}),
  similarityMayWarn: true,
  similarityMaySelect: false,
  similarityMayPassSemantics: false,
  automaticWinnerAllowed: false,
  hybridizationAllowed: false
};
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

await browser.close();
console.log(`Finalized ${warnings.length} icon similarity warnings with alpha-mask Jaccard; ${warnings.filter((item) => item.similarityWarning).length} require human inspection.`);
