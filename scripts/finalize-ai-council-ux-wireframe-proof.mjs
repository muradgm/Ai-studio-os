import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'ux-wireframe-proof-v1');
const framesRoot = path.join(outputRoot, 'frames');
const manifestPath = path.join(outputRoot, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));

const desktop = manifest.rendered.filter((item) => item.screenId !== 'mobile-conversation');
const mobile = manifest.rendered.find((item) => item.screenId === 'mobile-conversation');
const fileSrc = (screenId) => pathToFileURL(path.join(framesRoot, `${screenId}.png`)).href;

const cards = desktop.map((item) => `<figure><img src="${fileSrc(item.screenId)}"><figcaption>${item.label}</figcaption></figure>`).join('');
const mobileCard = mobile ? `<figure class="mobile"><img src="${fileSrc(mobile.screenId)}"><figcaption>${mobile.label}</figcaption></figure>` : '';
const source = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#e7e7e3;color:#181818;font-family:Arial,Helvetica,sans-serif;padding:26px}h1{font-size:26px;margin:0 0 8px}p{font-size:13px;color:#62625d;margin:0 0 22px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0;background:white;border:1px solid #c6c6c0;padding:9px}img{display:block;width:100%;height:auto}figcaption{font-size:12px;font-weight:700;padding:9px 3px 2px}.mobile{width:390px;margin-top:18px}
</style></head><body><h1>AI Council · Canonical UX wireframe proof</h1><p>Structural proof only — no Creative World, color system, typography direction, motion direction, or final UI approval.</p><div class="grid">${cards}</div>${mobileCard}</body></html>`;

const sourcePath = path.join(outputRoot, 'overview.html');
const imagePath = path.join(outputRoot, 'overview.png');
await fs.writeFile(sourcePath, source);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 3200 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 10_000 });
  await page.screenshot({ path: imagePath, fullPage: true });
  await page.close();
} finally {
  await browser.close();
}

manifest.overviewRef = path.relative(repoRoot, imagePath).replaceAll('\\', '/');
manifest.truth.overviewRebuiltFromExactFrames = true;
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log('Finalized AI Council canonical UX wireframe overview board.');
