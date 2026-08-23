import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'style-frame-proof-v2');
const framesRoot = path.join(outputRoot, 'frames');
const sourceRoot = path.join(outputRoot, 'source-html');
const compareRoot = path.join(outputRoot, 'comparisons');
const overviewRoot = path.join(outputRoot, 'world-overviews');
const exploration = JSON.parse(await fs.readFile(path.join(repoRoot, 'projects', 'ai-council', 'creative-worlds.json'), 'utf8'));
const moments = JSON.parse(await fs.readFile(path.join(repoRoot, 'projects', 'ai-council', 'style-frame-moments.json'), 'utf8')).moments;

const mobileFix = `<style>
.topline{display:none!important}
.proof-badge{left:10px!important;right:10px!important;bottom:7px!important;font-size:6px!important;line-height:1.25!important;padding:5px 7px!important;white-space:normal!important}
</style>`;

const replacements = {
  'counterpoint-mobile': ['inset:18px 16px 46px', 'inset:18px 16px 74px'],
  'threshold-mobile': ['inset:16px 16px 44px', 'inset:16px 16px 74px'],
  'decision-spine-mobile': ['inset:16px 14px 42px', 'inset:16px 14px 74px']
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

async function dataUri(file) {
  return `data:image/png;base64,${(await fs.readFile(file)).toString('base64')}`;
}

async function render(browser, html, output, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: output, type: 'png', fullPage: false });
  await page.close();
}

function boardShell(title, subtitle, body, { width = 1920, height = 1160 } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#121412;color:#ece9e2;font-family:Arial,Helvetica,sans-serif}.board{padding:34px;width:100vw;height:100vh}.head{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #404440;padding-bottom:18px;margin-bottom:22px}h1{font:400 40px/1 Georgia,serif;margin:0;letter-spacing:-.035em}.sub{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#999f99}.grid{display:grid;gap:18px}.tile{background:#20231f;border:1px solid #343834;padding:10px}.tile img{display:block;width:100%;height:auto}.tile-label{display:flex;justify-content:space-between;gap:16px;margin-bottom:9px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#b4b9b3}.truth{position:absolute;right:34px;bottom:20px;font-size:8px;letter-spacing:.11em;text-transform:uppercase;color:#777d77}</style></head><body><main class="board"><div class="head"><div><h1>${esc(title)}</h1><div class="sub" style="margin-top:9px">${esc(subtitle)}</div></div><div class="sub">AI Studio OS · exact Chromium proof</div></div>${body}<div class="truth">No world selected · proxy typography · scenario data</div></main></body></html>`;
}

const browser = await chromium.launch({ headless: true });
try {
  for (const [id, [from, to]] of Object.entries(replacements)) {
    const source = path.join(sourceRoot, `${id}.html`);
    let html = await fs.readFile(source, 'utf8');
    if (!html.includes(mobileFix)) html = html.replace('</head>', `${mobileFix}</head>`);
    html = html.replace(from, to);
    await fs.writeFile(source, html, 'utf8');
    await render(browser, html, path.join(framesRoot, `${id}.png`), 390, 844);
  }

  const mobileMoment = moments.find((moment) => moment.id === 'mobile');
  const mobileItems = [];
  for (const world of exploration.worlds) {
    mobileItems.push({ world, src: await dataUri(path.join(framesRoot, `${world.id}-mobile.png`)) });
  }
  const mobileBody = `<div class="grid" style="grid-template-columns:repeat(3,1fr);align-items:start">${mobileItems.map(({world,src})=>`<div class="tile"><div class="tile-label"><b>${esc(world.label)}</b><span>${esc(world.worldClass)}</span></div><img src="${src}" style="max-height:830px;object-fit:contain;background:#0d0f0d"></div>`).join('')}</div>`;
  await render(browser, boardShell(mobileMoment.label, mobileMoment.productState, mobileBody), path.join(compareRoot, 'mobile-comparison.png'), 1920, 1160);

  for (const world of exploration.worlds) {
    const tiles = [];
    for (const moment of moments) {
      tiles.push({ moment, src: await dataUri(path.join(framesRoot, `${world.id}-${moment.id}.png`)) });
    }
    const body = `<div class="grid" style="grid-template-columns:1fr 1fr 360px;grid-auto-rows:minmax(0,1fr)">${tiles.map(({moment,src})=>`<div class="tile" style="${moment.viewport==='mobile'?'grid-column:3;grid-row:1 / span 2':''}"><div class="tile-label"><b>${esc(moment.label)}</b><span>${esc(moment.viewport)}</span></div><img src="${src}" style="${moment.viewport==='mobile'?'height:820px;object-fit:contain':'width:100%'}"></div>`).join('')}</div>`;
    await render(browser, boardShell(`${world.label} · world overview`, world.worldIdea, body, { width: 1920, height: 1220 }), path.join(overviewRoot, `${world.id}-overview.png`), 1920, 1220);
  }

  console.log('AI Council mobile proof finalized and overview boards rebuilt.');
} finally {
  await browser.close();
}
