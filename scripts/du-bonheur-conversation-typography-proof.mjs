import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { buildConversationTypographyExploration } from '../projects/du-bonheur/counter-ritual-v3/runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const outputRoot = path.join(repoRoot, 'artifacts', 'du-bonheur', 'counter-ritual-conversation-typography-v1');
const framesRoot = path.join(outputRoot, 'frames');
const sourceRoot = path.join(outputRoot, 'source-html');
const compareRoot = path.join(outputRoot, 'comparisons');
const overviewRoot = path.join(outputRoot, 'system-overviews');

const exploration = buildConversationTypographyExploration();
if (!exploration.pass || exploration.systems.length < 3) {
  throw new Error(`Conversation typography exploration is not proof-ready: ${JSON.stringify(exploration.findings)}`);
}

await fs.rm(outputRoot, { recursive:true, force:true });
for (const dir of [framesRoot, sourceRoot, compareRoot, overviewRoot]) await fs.mkdir(dir, { recursive:true });

const MOMENTS = [
  { id:'opening', label:'Opening / Attention', width:1440, height:900 },
  { id:'choice', label:'Choice / Response', width:1440, height:900 },
  { id:'recommendation', label:'Recommendation / Product Answer', width:1440, height:900 },
  { id:'utility', label:'Utility / Visit', width:1440, height:900 },
  { id:'mobile', label:'Mobile / Direct Service', width:390, height:844 }
];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char)=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function familyParam(family) { return family.trim().replace(/\s+/g,'+') + ':wght@400;600;700'; }
function css2(display, body) {
  const families = [...new Set([display, body])];
  return `https://fonts.googleapis.com/css2?${families.map((family)=>`family=${familyParam(family)}`).join('&')}&display=swap`;
}

function commonCss(display, body) {
  return `
    :root{--paper:#f4f1e8;--ink:#11110f;--muted:#68675f;--acid:#d9ff38;--line:rgba(17,17,15,.18);--display:'${display}',Arial,sans-serif;--body:'${body}',Arial,sans-serif}
    *{box-sizing:border-box} html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--paper);color:var(--ink)}
    body{font-family:var(--body);-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    .frame{position:relative;width:100vw;height:100vh;overflow:hidden;background:var(--paper)}
    .brand{font-weight:700;letter-spacing:-.025em}.display{font-family:var(--display)}
    .top{position:absolute;left:30px;right:30px;top:24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;font-size:12px}
    .top .center{text-align:center;color:var(--muted)}.top .right{text-align:right}
    .hair{height:1px;background:var(--line)}
    .eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
    .prompt{font-family:var(--display);font-size:clamp(84px,9.5vw,142px);font-weight:600;line-height:.84;letter-spacing:-.065em}
    .bodycopy{font-size:17px;line-height:1.48;max-width:520px}
    .answer{font-family:var(--display);font-size:clamp(66px,7vw,106px);font-weight:600;line-height:.9;letter-spacing:-.05em}
    .choice{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding:15px 0;font-size:18px;line-height:1.2}
    .choice strong{font-family:var(--display);font-weight:600;font-size:26px;letter-spacing:-.025em}.choice .arrow{font-size:24px}
    .signal{background:var(--acid)}
    .proof-meta{position:absolute;left:28px;bottom:18px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);z-index:40}
    .type-meta{position:absolute;right:24px;bottom:16px;padding:8px 11px;background:var(--ink);color:var(--paper);font-size:9px;letter-spacing:.08em;z-index:40}
    .material{position:relative;overflow:hidden;background:radial-gradient(ellipse at 36% 44%,rgba(217,255,56,.62),transparent 22%),radial-gradient(ellipse at 62% 48%,rgba(17,17,15,.14),transparent 18%),repeating-radial-gradient(ellipse at 50% 54%,#d8b686 0 8px,#f0d3a7 9px 16px,#ad7950 17px 22px);filter:saturate(.72)}
    .material:after{content:'NON-DOCUMENTARY MATERIAL STUDY · REAL DU BONHEUR SOURCE REQUIRED';position:absolute;left:14px;bottom:12px;background:var(--paper);padding:7px 9px;font:9px var(--body);letter-spacing:.08em}
  `;
}

function frameHtml(system, moment, index) {
  const display = system.display.font.family;
  const body = system.body.font.family;
  const link = css2(display, body);
  const head = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${link}"><style>${commonCss(display, body)}</style></head><body><main class="frame">`;
  const top = `<div class="top"><div class="brand">DU BONHEUR</div><div class="center">COUNTER RITUAL · THE CONVERSATION</div><div class="right">BERLIN MITTE</div></div>`;
  const meta = `<div class="proof-meta">HF art-direction proof · real Google Fonts delivery · candidate ${index + 1}</div><div class="type-meta">${esc(display)} × ${esc(body)}</div>`;
  let bodyHtml = '';

  if (moment.id === 'opening') bodyHtml = `${top}
    <div style="position:absolute;left:30px;right:30px;top:88px;border-top:1px solid var(--line)"></div>
    <section style="position:absolute;left:30px;top:126px;width:75%"><div class="eyebrow">Arrival → attention</div><h1 class="prompt" style="margin:34px 0 0">What are you<br>in the mood for?</h1></section>
    <div class="signal" style="position:absolute;right:30px;top:120px;width:17px;height:490px"></div>
    <section style="position:absolute;left:30px;right:92px;bottom:72px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:34px"><div class="choice"><strong>Something buttery.</strong><span class="arrow">↗</span></div><div class="choice"><strong>Chocolate.</strong><span class="arrow">↗</span></div><div class="choice"><strong>Just coffee.</strong><span class="arrow">↗</span></div></section>`;

  if (moment.id === 'choice') bodyHtml = `${top}
    <div style="position:absolute;left:30px;right:30px;top:88px;border-top:1px solid var(--line)"></div>
    <section style="position:absolute;left:30px;top:126px;width:64%"><div class="eyebrow">Choice → response</div><div class="answer" style="margin-top:34px">Something<br>buttery.</div><p class="bodycopy" style="margin-top:34px">Good. One clear answer should follow the choice—not a grid of everything we sell.</p></section>
    <aside style="position:absolute;right:30px;top:118px;width:31%;height:650px;border-left:1px solid var(--line);padding-left:28px"><div class="eyebrow">Your answer is forming</div><div class="signal" style="height:10px;width:64%;margin-top:28px"></div><div style="position:absolute;left:28px;right:0;bottom:0"><div class="choice"><strong>Go back</strong><span>01</span></div><div class="choice"><strong>Continue</strong><span class="arrow">→</span></div></div></aside>`;

  if (moment.id === 'recommendation') bodyHtml = `${top}
    <div style="position:absolute;left:30px;right:30px;top:88px;border-top:1px solid var(--line)"></div>
    <section style="position:absolute;left:30px;top:126px;width:38%"><div class="eyebrow">Response → recommendation</div><div class="answer" style="margin-top:34px;font-size:88px">Then start<br>here.</div><p class="bodycopy" style="margin-top:28px">A real product image enters only now, because it is answering an expressed appetite.</p><div style="margin-top:52px;border-top:1px solid var(--line)"><div class="choice"><strong>See today's selection</strong><span class="arrow">→</span></div></div></section>
    <div class="material" style="position:absolute;right:30px;top:118px;width:56%;height:650px"></div><div class="signal" style="position:absolute;right:30px;top:118px;width:18%;height:18px"></div>`;

  if (moment.id === 'utility') bodyHtml = `${top}
    <div style="position:absolute;left:30px;right:30px;top:88px;border-top:1px solid var(--line)"></div>
    <section style="position:absolute;left:30px;top:130px;width:63%"><div class="eyebrow">Useful information remains service</div><div class="prompt" style="font-size:126px;margin-top:34px">Coming by?</div><div style="margin-top:48px;display:grid;grid-template-columns:1.1fr .9fr;gap:56px"><p class="bodycopy" style="margin:0">Du Bonheur is in Berlin Mitte. Route, opening information and shop actions arrive as the answer—not as a generic footer detour.</p><div><div class="choice"><strong>Berlin Mitte</strong><span>PLACE</span></div><div class="choice"><strong>Get directions</strong><span class="arrow">→</span></div><div class="choice"><strong>Shop</strong><span class="arrow">→</span></div></div></div></section><aside style="position:absolute;right:30px;top:118px;width:29%;bottom:70px;background:var(--ink);color:var(--paper);padding:34px;display:flex;flex-direction:column;justify-content:space-between"><div class="eyebrow" style="color:#aaa99f">Handoff</div><div class="display" style="font-size:58px;line-height:.92;font-weight:600;letter-spacing:-.045em">No detour.<br>Just the next useful thing.</div><div class="signal" style="height:16px;width:100%"></div></aside>`;

  if (moment.id === 'mobile') bodyHtml = `<div style="position:absolute;inset:0;padding:18px 16px 60px"><div style="display:flex;justify-content:space-between;font-size:10px"><strong>DU BONHEUR</strong><span>BERLIN MITTE</span></div><div style="margin-top:62px" class="eyebrow">Direct service</div><div class="display" style="font-size:59px;line-height:.89;font-weight:600;letter-spacing:-.055em;margin-top:22px">What are you<br>in the mood for?</div><div class="signal" style="width:44px;height:10px;margin-top:28px"></div><div style="margin-top:50px"><div class="choice"><strong style="font-size:22px">Something buttery.</strong><span>↗</span></div><div class="choice"><strong style="font-size:22px">Chocolate.</strong><span>↗</span></div><div class="choice"><strong style="font-size:22px">Coffee.</strong><span>↗</span></div><div class="choice"><strong style="font-size:22px">I'm visiting.</strong><span>↗</span></div></div><div style="position:absolute;left:16px;right:16px;bottom:62px;display:flex;justify-content:space-between;font-size:12px;border-top:1px solid var(--line);padding-top:14px"><span>Pâtisserie · für dich · à Berlin</span><span>01 / 05</span></div></div>`;

  return `${head}${bodyHtml}${meta}</main><script>window.__fontProof={display:${JSON.stringify(display)},body:${JSON.stringify(body)}};</script></body></html>`;
}

async function dataUri(file) {
  const bytes = await fs.readFile(file);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}

function boardHtml({ title, subtitle, images, width=1440, imageHeight=900 }) {
  const cardWidth = Math.floor((width - 80) / images.length);
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#11110f;color:#f4f1e8;font-family:Arial,sans-serif}.wrap{padding:26px 24px 30px}.head{display:flex;justify-content:space-between;align-items:end;margin-bottom:20px}.title{font-size:26px;font-weight:700}.sub{font-size:11px;color:#aaa99f;max-width:640px;text-align:right}.grid{display:grid;grid-template-columns:repeat(${images.length},1fr);gap:10px}.card{background:#201f1b;padding:8px}.label{height:36px;font-size:11px;display:flex;align-items:center;justify-content:space-between}.card img{display:block;width:100%;height:auto;background:#f4f1e8}</style></head><body><div class="wrap"><div class="head"><div class="title">${esc(title)}</div><div class="sub">${esc(subtitle)}</div></div><div class="grid">${images.map((image)=>`<div class="card"><div class="label"><b>${esc(image.label)}</b><span>${esc(image.meta ?? '')}</span></div><img src="${image.src}"></div>`).join('')}</div></div></body></html>`;
}

const browser = await chromium.launch({ headless:true });
const fontEvidence = [];
const frameIndex = [];
try {
  for (let systemIndex = 0; systemIndex < exploration.systems.length; systemIndex += 1) {
    const system = exploration.systems[systemIndex];
    const systemSlug = `system-${String(systemIndex + 1).padStart(2,'0')}-${slug(system.display.font.family)}-${slug(system.body.font.family)}`;
    for (const moment of MOMENTS) {
      const html = frameHtml(system, moment, systemIndex);
      const sourcePath = path.join(sourceRoot, `${systemSlug}-${moment.id}.html`);
      const framePath = path.join(framesRoot, `${systemSlug}-${moment.id}.png`);
      await fs.writeFile(sourcePath, html);
      const page = await browser.newPage({ viewport:{ width:moment.width, height:moment.height }, deviceScaleFactor:1 });
      await page.goto(pathToFileURL(sourcePath).href, { waitUntil:'networkidle', timeout:45000 });
      const proof = await page.evaluate(async () => {
        const { display, body } = window.__fontProof;
        await Promise.all([document.fonts.load(`600 72px "${display}"`), document.fonts.load(`400 18px "${body}"`)]);
        await document.fonts.ready;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `600 72px "${display}"`;
        const displayWidth = context.measureText('What are you in the mood for?').width;
        context.font = `400 18px "${body}"`;
        const bodyWidth = context.measureText('Pâtisserie für dich à Berlin').width;
        return {
          display, body,
          displayLoaded:document.fonts.check(`600 72px "${display}"`),
          bodyLoaded:document.fonts.check(`400 18px "${body}"`),
          displayWidth:Math.round(displayWidth * 100) / 100,
          bodyWidth:Math.round(bodyWidth * 100) / 100
        };
      });
      if (!proof.displayLoaded || !proof.bodyLoaded) throw new Error(`Google font delivery failed for ${proof.display} × ${proof.body}`);
      await page.screenshot({ path:framePath, fullPage:false });
      await page.close();
      frameIndex.push({ systemIndex:systemIndex + 1, systemId:system.systemId, systemSlug, moment:moment.id, frame:path.relative(outputRoot,framePath), source:path.relative(outputRoot,sourcePath) });
      if (moment.id === 'opening') fontEvidence.push({ systemIndex:systemIndex + 1, systemId:system.systemId, ...proof, css2Url:css2(proof.display, proof.body) });
    }
  }

  for (const moment of MOMENTS) {
    const images = [];
    for (let index = 0; index < exploration.systems.length; index += 1) {
      const system = exploration.systems[index];
      const systemSlug = `system-${String(index + 1).padStart(2,'0')}-${slug(system.display.font.family)}-${slug(system.body.font.family)}`;
      const framePath = path.join(framesRoot, `${systemSlug}-${moment.id}.png`);
      images.push({ label:`${index + 1}. ${system.display.font.family}`, meta:`+ ${system.body.font.family}`, src:await dataUri(framePath) });
    }
    const html = boardHtml({ title:`The Conversation · ${moment.label}`, subtitle:'Same art direction and content. Only the Typography Intelligence candidate system changes. No winner is automatically selected.', images, width:1920, imageHeight:moment.height });
    const boardPath = path.join(compareRoot, `${moment.id}-typography-comparison.png`);
    const page = await browser.newPage({ viewport:{ width:1920, height:moment.id === 'mobile' ? 980 : 760 }, deviceScaleFactor:1 });
    await page.setContent(html, { waitUntil:'load' });
    await page.screenshot({ path:boardPath, fullPage:true });
    await page.close();
  }

  for (let index = 0; index < exploration.systems.length; index += 1) {
    const system = exploration.systems[index];
    const systemSlug = `system-${String(index + 1).padStart(2,'0')}-${slug(system.display.font.family)}-${slug(system.body.font.family)}`;
    const images = [];
    for (const moment of MOMENTS) {
      images.push({ label:moment.label, meta:'', src:await dataUri(path.join(framesRoot, `${systemSlug}-${moment.id}.png`)) });
    }
    const html = boardHtml({ title:`${system.display.font.family} × ${system.body.font.family}`, subtitle:`Candidate ${index + 1} · system score ${system.systemCritique?.score ?? 'n/a'} · pairing ${system.pairing?.score ?? 'n/a'} · awaiting typography art-direction review`, images, width:1920 });
    const page = await browser.newPage({ viewport:{ width:1920, height:720 }, deviceScaleFactor:1 });
    await page.setContent(html, { waitUntil:'load' });
    await page.screenshot({ path:path.join(overviewRoot, `${systemSlug}.png`), fullPage:true });
    await page.close();
  }
} finally {
  await browser.close();
}

const manifest = {
  schema:'ai-studio-os/conversation-typography-browser-proof@1',
  status:'produced-awaiting-human-typography-art-direction-review',
  generatedAt:new Date().toISOString(),
  systemCount:exploration.systems.length,
  frameCount:frameIndex.length,
  comparisonCount:MOMENTS.length,
  systems:exploration.systemSummaries,
  fontDeliveryEvidence:fontEvidence,
  frames:frameIndex,
  sourceEvidence:exploration.sourceEvidence,
  truth:{
    counterRitualExperienceThesisSelected:true,
    theConversationLeadHypothesis:true,
    humanArtDirectionSelectionConfirmed:false,
    realGoogleFontsBrowserDeliveryVerified:fontEvidence.every((item)=>item.displayLoaded && item.bodyLoaded),
    typographySystemSelected:false,
    typographyApproved:false,
    canonicalTypographyConsumptionProduced:false,
    realProductImageryComplete:false,
    productionReady:false
  }
};
await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest,null,2));
await fs.writeFile(path.join(outputRoot, 'typography-systems.json'), JSON.stringify(exploration.systemSummaries,null,2));
await fs.writeFile(path.join(outputRoot, 'font-delivery-evidence.json'), JSON.stringify(fontEvidence,null,2));
await fs.writeFile(path.join(outputRoot, 'README.txt'), `The Conversation — High-Fidelity Art Direction + Typography Integration v1\n\nReview comparisons/ first. Each board holds the art direction and copy constant while changing only the Typography Intelligence candidate system.\n\nNo candidate is selected or approved by this proof.\n`);

console.log(JSON.stringify({ status:manifest.status, systems:manifest.systems, fontDeliveryVerified:manifest.truth.realGoogleFontsBrowserDeliveryVerified, outputRoot }, null, 2));
