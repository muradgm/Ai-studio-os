import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const outDir = path.resolve('artifacts/browser-smoke');
await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.setContent(`<!doctype html><html><head><title>AI Studio OS v1.3 Browser Runtime</title><style>
    html,body{margin:0;background:#12100f;color:#f0eae0;font-family:system-ui}main{min-height:100vh;display:grid;place-items:center}div{width:min(70vw,280px);aspect-ratio:1;border:1px solid #e54832;display:grid;place-items:center}@media(prefers-reduced-motion:reduce){div{outline:2px solid #6c7772}}
  </style></head><body><main><div id="runtime">BROWSER / OBSERVED</div></main></body></html>`, { waitUntil: 'load' });
  const state = await page.evaluate(() => ({
    title: document.title,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    width: innerWidth,
    label: document.querySelector('#runtime')?.textContent
  }));
  await page.screenshot({ path: path.join(outDir, 'chromium-mobile-reduced.png'), fullPage: true });
  if (state.title !== 'AI Studio OS v1.3 Browser Runtime') throw new Error('unexpected title');
  if (state.reduced !== true) throw new Error('reduced-motion emulation failed');
  if (state.width !== 390) throw new Error(`viewport mismatch: ${state.width}`);
  if (state.label !== 'BROWSER / OBSERVED') throw new Error('DOM observation failed');
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({ pass: true, state, screenshot: 'artifacts/browser-smoke/chromium-mobile-reduced.png' }));
  await context.close();
} finally {
  await browser.close();
}
