import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { buildConversationTypographyRefinement } from '../projects/du-bonheur/counter-ritual-v3/typography-refinement.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const outputRoot = path.join(repoRoot, 'artifacts', 'du-bonheur', 'counter-ritual-conversation-typography-refinement-v2');
const sourceRoot = path.join(outputRoot, 'source-html');
const framesRoot = path.join(outputRoot, 'frames');
const compareRoot = path.join(outputRoot, 'comparisons');

const refinement = buildConversationTypographyRefinement();
if (!refinement.pass || refinement.finalists.length !== 2) {
  throw new Error(`Conversation typography refinement is not proof-ready: ${JSON.stringify(refinement.findings)}`);
}

await fs.rm(outputRoot, { recursive:true, force:true });
for (const dir of [sourceRoot, framesRoot, compareRoot]) await fs.mkdir(dir, { recursive:true });

const SCENES = [
  ...refinement.languageStress.map((item) => ({ id:`language-${item.id}`, label:`Language stress · ${item.lang.toUpperCase()}`, width:1440, height:900, kind:'language', language:item })),
  { id:'nomenclature', label:'Product-name typography specimen', width:1440, height:900, kind:'nomenclature' },
  { id:'utility', label:'Utility / practical service density', width:1440, height:900, kind:'utility' },
  { id:'mobile', label:'Mobile / native direct service', width:390, height:844, kind:'mobile' },
  { id:'motion', label:'Motion continuity / keyframe triptych', width:1440, height:900, kind:'motion' }
];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function familyParam(family) { return family.trim().replace(/\s+/g, '+') + ':wght@400;600;700'; }
function css2(display, body) {
  return `https://fonts.googleapis.com/css2?${[...new Set([display, body])].map((family) => `family=${familyParam(family)}`).join('&')}&display=swap`;
}

function commonCss(finalist, scene) {
  const tuning = scene.kind === 'mobile' ? finalist.tuning.mobile : finalist.tuning.desktop;
  return `
    :root{
      --paper:#f4f1e8;--ink:#11110f;--muted:#6d6b62;--acid:#d9ff38;--line:rgba(17,17,15,.18);
      --display:'${finalist.display}',Arial,sans-serif;--body:'${finalist.body}',Arial,sans-serif;
      --display-size:${tuning.displaySizePx}px;--display-weight:${tuning.displayWeight};--display-line:${tuning.displayLineHeight};--display-track:${tuning.displayTrackingEm}em;
      --body-size:${tuning.bodySizePx}px;--body-line:${tuning.bodyLineHeight};
    }
    *{box-sizing:border-box} html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--paper);color:var(--ink)}
    body{font-family:var(--body);font-size:var(--body-size);line-height:var(--body-line);-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    .frame{position:relative;width:100vw;height:100vh;overflow:hidden;background:var(--paper)}
    .display{font-family:var(--display);font-weight:var(--display-weight);line-height:var(--display-line);letter-spacing:var(--display-track)}
    .top{position:absolute;left:30px;right:30px;top:24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-size:11px;letter-spacing:.02em}
    .top .center{text-align:center;color:var(--muted)}.top .right{text-align:right}.brand{font-weight:700;letter-spacing:-.025em}
    .rule{position:absolute;left:30px;right:30px;top:88px;height:1px;background:var(--line)}
    .eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
    .prompt{font-size:var(--display-size);max-width:1180px;margin:28px 0 0}
    .bodycopy{font-size:var(--body-size);line-height:var(--body-line);max-width:560px;margin:28px 0 0}
    .signal{background:var(--acid)}
    .choice{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding:16px 0;font-size:18px}
    .choice strong{font-family:var(--display);font-size:27px;font-weight:600;letter-spacing:-.025em}
    .meta{position:absolute;left:28px;bottom:17px;font-size:9px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted)}
    .type-meta{position:absolute;right:24px;bottom:16px;background:var(--ink);color:var(--paper);padding:8px 11px;font-size:9px;letter-spacing:.07em}
    .specimen-note{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
    .dark{background:var(--ink);color:var(--paper)}
  `;
}

function topBar() {
  return `<div class="top"><div class="brand">DU BONHEUR</div><div class="center">COUNTER RITUAL · THE CONVERSATION</div><div class="right">TYPOGRAPHY FINALIST REVIEW</div></div><div class="rule"></div>`;
}

function sceneHtml(finalist, scene) {
  const link = css2(finalist.display, finalist.body);
  const head = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${link}"><style>${commonCss(finalist, scene)}</style></head><body><main class="frame" data-scene="${esc(scene.id)}">`;
  const meta = `<div class="meta">two-finalist refinement · real Google Fonts browser delivery · authored tuning, not measured optimum</div><div class="type-meta">${esc(finalist.display)} × ${esc(finalist.body)}</div>`;
  let content = '';

  if (scene.kind === 'language') {
    const copy = scene.language;
    content = `${topBar()}<section style="position:absolute;left:30px;right:54px;top:126px"><div class="eyebrow">Language stress · ${esc(copy.lang.toUpperCase())}</div><div id="display-test" class="display prompt" lang="${esc(copy.lang)}">${esc(copy.prompt)}</div><div class="signal" style="width:72px;height:12px;margin-top:34px"></div><p id="body-test" class="bodycopy" lang="${esc(copy.lang)}">${esc(copy.response)} The service voice must remain direct while practical reading stays calm, clear and easy to scan.</p><div style="position:absolute;right:0;top:34px;width:28%;border-left:1px solid var(--line);padding-left:26px"><div class="eyebrow">Utility phrase</div><div class="display" style="font-size:42px;margin-top:24px;line-height:.96;letter-spacing:-.035em">${esc(copy.utility)}</div><div class="choice" style="margin-top:44px"><strong style="font-size:21px">Route</strong><span>→</span></div><div class="choice"><strong style="font-size:21px">Selection</strong><span>→</span></div></div></section>`;
  }

  if (scene.kind === 'nomenclature') {
    content = `${topBar()}<section style="position:absolute;left:30px;right:30px;top:126px"><div class="eyebrow">Product-name behavior</div><div style="display:grid;grid-template-columns:.72fr 1.28fr;gap:72px;margin-top:34px"><div><div id="display-test" class="display" style="font-size:86px">Names should still sound edible.</div><p id="body-test" class="bodycopy">These are typography specimens only. They are not claims about current Du Bonheur availability.</p><div class="signal" style="width:54px;height:12px;margin-top:34px"></div></div><div>${refinement.nomenclatureSpecimens.map((name, index) => `<div class="choice"><strong style="font-size:${index === 0 ? 38 : 34}px">${esc(name)}</strong><span>0${index + 1}</span></div>`).join('')}<div class="specimen-note" style="margin-top:20px">SPECIMEN COPY · NOT AN AVAILABILITY CLAIM</div></div></div></section>`;
  }

  if (scene.kind === 'utility') {
    content = `${topBar()}<section style="position:absolute;left:30px;right:30px;top:126px"><div class="eyebrow">Utility scanning under density</div><div id="display-test" class="display" style="font-size:94px;max-width:760px">Useful information should not feel like a different website.</div><div style="display:grid;grid-template-columns:1.05fr .95fr;gap:80px;margin-top:42px"><p id="body-test" class="bodycopy" style="margin:0">The reading voice must survive addresses, route labels, availability language, navigation, status and return actions without introducing a third type family.</p><div><div class="choice"><strong style="font-size:23px">Öffnungszeiten</strong><span>INFO</span></div><div class="choice"><strong style="font-size:23px">Route & Anfahrt</strong><span>→</span></div><div class="choice"><strong style="font-size:23px">Aujourd’hui</strong><span>FR</span></div><div class="choice"><strong style="font-size:23px">Back to your choice</strong><span>←</span></div></div></div><div class="specimen-note" style="margin-top:30px">UTILITY LABELS ARE TYPOGRAPHY STRESS COPY · NO LIVE BUSINESS DATA CLAIMED</div></section>`;
  }

  if (scene.kind === 'mobile') {
    content = `<div style="position:absolute;inset:0;padding:18px 16px 60px"><div style="display:flex;justify-content:space-between;font-size:10px"><strong>DU BONHEUR</strong><span>BERLIN</span></div><div class="eyebrow" style="margin-top:54px">Direct service</div><div id="display-test" class="display" style="font-size:var(--display-size);margin-top:20px">What are you in the mood for?</div><div class="signal" style="width:44px;height:10px;margin-top:24px"></div><div style="margin-top:42px"><div class="choice"><strong style="font-size:21px">Something buttery.</strong><span>↗</span></div><div class="choice"><strong style="font-size:21px">Chocolate.</strong><span>↗</span></div><div class="choice"><strong style="font-size:21px">Coffee.</strong><span>↗</span></div><div class="choice"><strong style="font-size:21px">I’m visiting.</strong><span>↗</span></div></div><p id="body-test" style="position:absolute;left:16px;right:16px;bottom:90px;margin:0;font-size:13px;line-height:1.45">One prompt, one meaningful response set, one obvious next action.</p><div style="position:absolute;left:16px;right:16px;bottom:48px;border-top:1px solid var(--line);padding-top:12px;display:flex;justify-content:space-between;font-size:11px"><span>DE · FR · EN</span><span>01 / 05</span></div></div>`;
  }

  if (scene.kind === 'motion') {
    const card = (step, title, body, accent) => `<div style="position:relative;min-height:620px;border:1px solid var(--line);padding:28px;${accent ? 'background:var(--ink);color:var(--paper)' : ''}"><div class="eyebrow" style="${accent ? 'color:#aaa99f' : ''}">${step}</div><div class="display" style="font-size:60px;margin-top:44px">${title}</div><p style="margin-top:28px;max-width:300px">${body}</p><div class="signal" style="position:absolute;left:28px;right:28px;bottom:28px;height:12px"></div></div>`;
    content = `${topBar()}<section style="position:absolute;left:30px;right:30px;top:126px"><div class="eyebrow">Static keyframes · judge continuity, not animation polish</div><div id="display-test" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:30px">${card('01 · Attention','What are you in the mood for?','The question owns the field.',false)}${card('02 · Choice','Something buttery.','The selected language becomes dominant.',false)}${card('03 · Response','Then start here.','The answer arrives as a consequence.',true)}</div><p id="body-test" class="specimen-note" style="margin-top:18px">MOTION PROOF IS A KEYFRAME CONTINUITY TEST · NO MOTION APPROVAL CLAIMED</p></section>`;
  }

  return `${head}${content}${meta}</main><script>window.__typeProof=${JSON.stringify({ display:finalist.display, body:finalist.body, scene:scene.id, finalist:finalist.id })};</script></body></html>`;
}

async function asDataUri(file) {
  const bytes = await fs.readFile(file);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

function comparisonHtml(scene, items) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#11110f;color:#f4f1e8;font-family:Arial,sans-serif}.wrap{padding:26px}.head{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px}.title{font-size:27px;font-weight:700}.note{font-size:11px;color:#aaa99f;max-width:760px;text-align:right}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.card{background:#201f1b;padding:9px}.label{height:38px;display:flex;align-items:center;justify-content:space-between;font-size:11px}.card img{display:block;width:100%;height:auto;background:#f4f1e8}</style></head><body><div class="wrap"><div class="head"><div class="title">${esc(scene.label)}</div><div class="note">Same Conversation grammar. Only the finalist type system and authored optical tuning differ. Human art-direction review remains required.</div></div><div class="grid">${items.map((item) => `<div class="card"><div class="label"><b>${esc(item.label)}</b><span>${esc(item.meta)}</span></div><img src="${item.src}"></div>`).join('')}</div></div></body></html>`;
}

const browser = await chromium.launch({ headless:true });
const metrics = [];
const frameIndex = [];
try {
  for (const scene of SCENES) {
    for (const finalist of refinement.finalists) {
      const base = `${finalist.id}-${scene.id}`;
      const sourcePath = path.join(sourceRoot, `${base}.html`);
      const framePath = path.join(framesRoot, `${base}.png`);
      await fs.writeFile(sourcePath, sceneHtml(finalist, scene));

      const page = await browser.newPage({ viewport:{ width:scene.width, height:scene.height }, deviceScaleFactor:1 });
      await page.goto(pathToFileURL(sourcePath).href, { waitUntil:'networkidle', timeout:45000 });
      const evidence = await page.evaluate(async () => {
        const proof = window.__typeProof;
        await Promise.all([
          document.fonts.load(`600 64px "${proof.display}"`),
          document.fonts.load(`400 16px "${proof.body}"`)
        ]);
        await document.fonts.ready;
        const displayEl = document.querySelector('#display-test');
        const bodyEl = document.querySelector('#body-test');
        const rect = (el) => el ? ({ x:el.getBoundingClientRect().x, y:el.getBoundingClientRect().y, width:el.getBoundingClientRect().width, height:el.getBoundingClientRect().height }) : null;
        const lineCount = (el) => {
          if (!el) return null;
          const range = document.createRange();
          range.selectNodeContents(el);
          const tops = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1).map((r) => Math.round(r.top));
          return new Set(tops).size;
        };
        return {
          ...proof,
          displayLoaded:document.fonts.check(`600 64px "${proof.display}"`),
          bodyLoaded:document.fonts.check(`400 16px "${proof.body}"`),
          viewport:{ width:window.innerWidth, height:window.innerHeight },
          overflowX:Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
          overflowY:Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight,
          displayRect:rect(displayEl),
          bodyRect:rect(bodyEl),
          displayLines:lineCount(displayEl),
          bodyLines:lineCount(bodyEl)
        };
      });
      if (!evidence.displayLoaded || !evidence.bodyLoaded) throw new Error(`Google Font failed to load for ${base}: ${JSON.stringify(evidence)}`);
      if (evidence.overflowX > 1) throw new Error(`Horizontal overflow in ${base}: ${JSON.stringify(evidence)}`);
      await page.screenshot({ path:framePath, fullPage:false });
      await page.close();
      metrics.push(evidence);
      frameIndex.push({ finalistId:finalist.id, sceneId:scene.id, source:path.relative(repoRoot, sourcePath), screenshot:path.relative(repoRoot, framePath) });
    }

    const compareItems = [];
    for (const finalist of refinement.finalists) {
      const framePath = path.join(framesRoot, `${finalist.id}-${scene.id}.png`);
      compareItems.push({ label:`${finalist.display} × ${finalist.body}`, meta:finalist.workingPosition, src:await asDataUri(framePath) });
    }
    const compareSource = path.join(compareRoot, `${scene.id}.html`);
    const comparePng = path.join(compareRoot, `${scene.id}-comparison.png`);
    await fs.writeFile(compareSource, comparisonHtml(scene, compareItems));
    const comparePage = await browser.newPage({ viewport:{ width:1800, height:scene.kind === 'mobile' ? 1120 : 1220 }, deviceScaleFactor:1 });
    await comparePage.goto(pathToFileURL(compareSource).href, { waitUntil:'load' });
    await comparePage.screenshot({ path:comparePng, fullPage:true });
    await comparePage.close();
  }
} finally {
  await browser.close();
}

const manifest = {
  schema:'ai-studio-os/conversation-typography-refinement-proof@1',
  status:'two-finalists-awaiting-human-art-direction-review',
  generatedAt:new Date().toISOString(),
  finalists:refinement.finalists.map((item) => ({ id:item.id, display:item.display, body:item.body, utility:item.utility, tuning:item.tuning, killCriteria:item.killCriteria, sourceSummary:item.sourceSummary })),
  scenes:SCENES.map((scene) => ({ id:scene.id, label:scene.label, width:scene.width, height:scene.height, kind:scene.kind })),
  metrics,
  frames:frameIndex,
  comparisons:SCENES.map((scene) => path.relative(repoRoot, path.join(compareRoot, `${scene.id}-comparison.png`))),
  evidencePolicy:refinement.evidencePolicy,
  reviewLenses:refinement.reviewLenses,
  truth:{
    realGoogleFontsBrowserDeliveryVerified:metrics.every((item) => item.displayLoaded && item.bodyLoaded),
    noHorizontalOverflow:metrics.every((item) => item.overflowX <= 1),
    twoFinalistsAdvanced:true,
    humanTypographyWinnerSelected:false,
    typographyApproved:false,
    artDirectionApproved:false,
    motionApproved:false,
    realProductImageryComplete:false,
    productionReady:false
  }
};

await fs.writeFile(path.join(outputRoot, 'refinement.json'), JSON.stringify(refinement, null, 2));
await fs.writeFile(path.join(outputRoot, 'metrics.json'), JSON.stringify(metrics, null, 2));
await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`Conversation typography finalist proof: ${refinement.finalists.length} finalists × ${SCENES.length} scenes = ${frameIndex.length} browser frames -> ${path.relative(repoRoot, outputRoot)}`);
