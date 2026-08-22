import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildArtDirectionExploration } from '../modules/art-direction-exploration/runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const lockPath = path.join(root, 'projects/du-bonheur/counter-ritual-v2/EXPERIENCE_THESIS_LOCK.json');
const directionsPath = path.join(root, 'projects/du-bonheur/counter-ritual-v2/art-directions.json');
const outputRoot = path.join(root, 'artifacts/du-bonheur/counter-ritual-art-direction-v2');
const framesRoot = path.join(outputRoot, 'frames');
const sourceRoot = path.join(outputRoot, 'source-html');
const compareRoot = path.join(outputRoot, 'comparisons');
const overviewRoot = path.join(outputRoot, 'direction-overviews');

const lock = JSON.parse(await fs.readFile(lockPath, 'utf8'));
const directionsInput = JSON.parse(await fs.readFile(directionsPath, 'utf8'));
const exploration = buildArtDirectionExploration({ experienceLock: lock, authoredDirections: directionsInput.directions });
if (!exploration.reviewReady) throw new Error(`Art Direction Exploration is not review-ready: ${exploration.findings.map((item) => item.code).join(', ')}`);

const moments = [
  { id: 'opening', label: 'Opening / Attention', width: 1440, height: 900 },
  { id: 'choice', label: 'Choice / Product', width: 1440, height: 900 },
  { id: 'utility', label: 'Utility / Visit', width: 1440, height: 900 },
  { id: 'handoff', label: 'Preparation / Handoff', width: 1440, height: 900 },
  { id: 'mobile', label: 'Mobile / Direct Service', width: 390, height: 844 }
];

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [framesRoot, sourceRoot, compareRoot, overviewRoot]) await fs.mkdir(dir, { recursive: true });

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

function shell(direction, moment, css, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{-webkit-font-smoothing:antialiased}.frame{position:relative;width:100vw;height:100vh;overflow:hidden}.proof{position:absolute;right:18px;bottom:15px;font:9px/1 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.58;z-index:50}.label{position:absolute;left:18px;bottom:15px;font:9px/1 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.58;z-index:50}.proxy:after{content:'NON-DOCUMENTARY MATERIAL / IMAGE PROXY';position:absolute;left:10px;bottom:9px;font:8px Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;opacity:.6}${css}</style></head><body><main class="frame">${body}<div class="label">${esc(direction.label)} · ${esc(moment.label)}</div><div class="proof">Counter Ritual v2 · visual proof only</div></main></body></html>`;
}

function productProxy(style='warm') {
  const bg = style === 'steel'
    ? 'radial-gradient(circle at 40% 34%,#ffe0a6 0 10%,#c87f42 11% 24%,#f2be73 25% 31%,transparent 32%),linear-gradient(135deg,#d8d9d5,#f3f0e7)'
    : style === 'dark'
      ? 'radial-gradient(circle at 42% 36%,#ffb77d 0 12%,#8f3f52 13% 27%,#f0a167 28% 34%,transparent 35%),linear-gradient(135deg,#3b1730,#180d18)'
      : 'radial-gradient(circle at 42% 36%,#f6d37c 0 12%,#b66b32 13% 26%,#ffe09b 27% 34%,transparent 35%),linear-gradient(135deg,#f4f1e8,#ffffff)';
  return `<div class="proxy" style="position:absolute;inset:0;background:${bg};overflow:hidden"></div>`;
}

function renderCounter(direction, moment) {
  const css = `
  body{background:#eef0ec;color:#171a18;font-family:Arial,Helvetica,sans-serif}.frame{background:linear-gradient(#f7f6ef 0 72%,#d8dad5 72%)}
  .nav{position:absolute;left:28px;right:28px;top:24px;display:flex;justify-content:space-between;font:11px Arial,sans-serif;letter-spacing:.11em;text-transform:uppercase}.rail{position:absolute;left:0;right:0;bottom:110px;height:16px;background:#8b8f8a;box-shadow:0 -1px 0 #4c514e,0 12px 24px rgba(0,0,0,.09)}.k{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#69706c}.btn{display:inline-block;padding:13px 17px;border:1px solid #171a18;background:#f7f6ef}.butter{color:#c88b17}`;
  const nav = `<div class="nav"><strong>DU BONHEUR</strong><span>The Counter</span><span>Berlin Mitte</span></div>`;
  let body='';
  if (moment.id==='opening') body=`${nav}<div style="position:absolute;left:38px;top:142px;width:48%"><div class="k">Arrival → Attention</div><h1 style="font-size:112px;line-height:.84;letter-spacing:-.065em;margin:24px 0 32px;font-weight:650">Come to<br>the counter.</h1><p style="font-size:19px;line-height:1.45;max-width:510px">See what is ready, bring one thing into focus, then move directly toward a visit or order.</p></div><div style="position:absolute;right:40px;top:126px;width:44%;height:560px;border:1px solid #90948f;background:#ddd"><div style="position:absolute;inset:28px">${productProxy('steel')}</div><div style="position:absolute;left:38px;bottom:28px" class="k">REAL PRODUCT SOURCE REQUIRED</div></div><div class="rail"></div>`;
  if (moment.id==='choice') body=`${nav}<div style="position:absolute;left:34px;right:34px;top:130px;bottom:116px;display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:18px;align-items:end"><section><div class="k">Choice</div><h1 style="font-size:76px;line-height:.88;letter-spacing:-.055em;margin:18px 0">What catches<br>your eye?</h1><p style="font-size:16px;line-height:1.5;max-width:330px">The whole counter remains visible while one item comes within reach.</p></section><div style="height:68%;position:relative;border:1px solid #90948f">${productProxy('steel')}</div><div style="height:92%;position:relative;border:2px solid #171a18;box-shadow:0 12px 0 #c88b17">${productProxy('steel')}<div style="position:absolute;top:18px;right:18px;background:#171a18;color:#fff;padding:9px 12px;font-size:10px;letter-spacing:.12em">IN FOCUS</div></div></div><div class="rail"></div>`;
  if (moment.id==='utility') body=`${nav}<div style="position:absolute;left:38px;right:38px;top:140px;bottom:132px;display:grid;grid-template-columns:1.15fr .85fr;border-top:1px solid #8f948f"><section style="padding:42px 48px 0 0"><div class="k">Useful service</div><h1 style="font-size:86px;line-height:.88;letter-spacing:-.055em;margin:26px 0 48px">Here when<br>you need us.</h1><div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;font-size:21px"><div><div class="k">Place</div><p>Berlin Mitte</p></div><div><div class="k">Next action</div><p>Route · Shop</p></div></div></section><aside style="border-left:1px solid #8f948f;padding:42px"><div class="k">Service rail</div><div style="margin-top:42px;display:grid;gap:12px"><span class="btn">Open route</span><span class="btn" style="background:#171a18;color:#fff">Browse products</span><span class="btn">Opening information</span></div></aside></div><div class="rail"></div>`;
  if (moment.id==='handoff') body=`${nav}<div style="position:absolute;left:36px;right:36px;top:116px;bottom:130px"><div class="k">Preparation → Handoff</div><div style="position:absolute;left:0;top:70px;width:28%;height:430px;border:1px dashed #8f948f;display:grid;place-items:center;font-size:22px">YOUR CHOICE</div><div style="position:absolute;left:35%;top:22px;width:28%;height:530px;background:#171a18;color:#f7f6ef;display:grid;place-items:center;text-align:center"><div><div class="k" style="color:#bbc0bc">PREPARING</div><div style="font-size:52px;line-height:.92;margin-top:22px">Wrap.<br>Confirm.<br>Ready.</div></div></div><div style="position:absolute;right:0;top:70px;width:28%;height:430px;background:#c88b17;display:grid;place-items:center;font-size:31px;font-weight:700">READY FOR YOU</div><div style="position:absolute;left:28%;right:28%;top:280px;height:2px;background:#171a18"></div></div><div class="rail"></div>`;
  if (moment.id==='mobile') body=`<div style="position:absolute;inset:0;padding:18px 16px 60px;background:linear-gradient(#f7f6ef 0 76%,#d8dad5 76%)"><div style="display:flex;justify-content:space-between;font-size:9px;letter-spacing:.11em;text-transform:uppercase"><strong>DU BONHEUR</strong><span>The Counter</span></div><div class="k" style="margin-top:58px">Direct service</div><h1 style="font-size:58px;line-height:.88;letter-spacing:-.055em;margin:18px 0 24px">What do you<br>need today?</h1><div style="display:grid;gap:10px"><span class="btn">Something buttery</span><span class="btn">Plan a visit</span><span class="btn">Find the shop</span></div><div style="position:absolute;left:16px;right:16px;bottom:78px;border-top:1px solid #8f948f;padding-top:14px;display:flex;justify-content:space-between"><span>Berlin Mitte</span><strong class="butter">ROUTE →</strong></div></div>`;
  return shell(direction,moment,css,body);
}

function renderHandoff(direction, moment) {
  const css=`body{background:#170d18;color:#f5eadb;font-family:Georgia,'Times New Roman',serif}.frame{background:#170d18}.nav{position:absolute;left:28px;right:28px;top:24px;display:flex;justify-content:space-between;font:10px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}.left{position:absolute;left:0;top:0;bottom:0;width:48%;background:#f5eadb;color:#24111d}.line{position:absolute;left:48%;top:0;bottom:0;width:8px;background:#f08c67}.caps{font-family:Impact,'Arial Black',sans-serif;text-transform:uppercase;letter-spacing:-.025em}.meta2{font:10px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase}`;
  const nav=`<div class="nav"><strong>DU BONHEUR</strong><span>The Handoff</span><span>Berlin Mitte</span></div>`;
  let body='';
  if(moment.id==='opening') body=`<div class="left"></div><div class="line"></div>${nav}<div style="position:absolute;left:34px;top:164px;width:39%;color:#24111d"><div class="meta2">Request enters</div><div class="caps" style="font-size:104px;line-height:.82;margin-top:26px">ASK<br>FOR<br>SOMETHING.</div></div><div style="position:absolute;right:42px;bottom:132px;width:43%"><div class="meta2" style="color:#f08c67">Service returns</div><div class="caps" style="font-size:92px;line-height:.82;margin-top:24px">RECEIVE<br>THE RIGHT<br>THING.</div></div><div style="position:absolute;left:43%;top:52%;width:12%;height:2px;background:#f08c67"></div>`;
  if(moment.id==='choice') body=`<div class="left"></div><div class="line"></div>${nav}<div style="position:absolute;left:34px;top:130px;width:39%;color:#24111d"><div class="meta2">Choice</div><div style="margin-top:36px;display:grid;gap:15px;font:34px Arial,sans-serif"><span>Buttery →</span><span>Chocolate →</span><span>For sharing →</span></div></div><div style="position:absolute;right:38px;top:120px;width:43%;height:610px;border:1px solid #5e3852">${productProxy('dark')}<div style="position:absolute;left:20px;bottom:20px" class="meta2">ANSWER / PRODUCT SOURCE REQUIRED</div></div>`;
  if(moment.id==='utility') body=`<div class="left"></div><div class="line"></div>${nav}<div style="position:absolute;left:34px;top:140px;width:39%;color:#24111d"><div class="meta2">Need the place?</div><div class="caps" style="font-size:90px;line-height:.84;margin-top:26px">BERLIN<br>MITTE.</div><div style="font:22px Arial,sans-serif;margin-top:44px">Route<br><br>Opening information<br><br>Shop</div></div><div style="position:absolute;right:44px;top:176px;width:38%"><div class="meta2" style="color:#f08c67">Handoff</div><p style="font-size:38px;line-height:1.12;margin:30px 0 50px">Useful information crosses the same threshold as product service. No separate generic utility layer.</p><div style="font:14px Arial,sans-serif;border-top:1px solid #79576f;padding-top:18px">OPEN ROUTE →</div></div>`;
  if(moment.id==='handoff') body=`<div style="position:absolute;inset:0;background:#f5eadb;color:#24111d"></div><div style="position:absolute;left:0;right:0;top:46%;height:10px;background:#f08c67"></div><div class="nav" style="color:#24111d"><strong>DU BONHEUR</strong><span>The Handoff</span><span>Berlin Mitte</span></div><div class="caps" style="position:absolute;left:34px;top:110px;font-size:104px;line-height:.82">REQUEST</div><div class="caps" style="position:absolute;right:36px;bottom:112px;font-size:104px;line-height:.82;text-align:right">READY<br>TO RECEIVE</div><div style="position:absolute;left:47%;top:40%;width:88px;height:88px;background:#24111d;transform:rotate(45deg)"></div>`;
  if(moment.id==='mobile') body=`<div style="position:absolute;inset:0;background:#170d18"><div style="position:absolute;left:0;top:0;bottom:0;width:46%;background:#f5eadb"></div><div style="position:absolute;left:46%;top:0;bottom:0;width:6px;background:#f08c67"></div><div style="position:absolute;left:16px;right:16px;top:18px;display:flex;justify-content:space-between;font:9px Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase"><strong style="color:#24111d">DU BONHEUR</strong><span>The Handoff</span></div><div class="caps" style="position:absolute;left:15px;top:116px;color:#24111d;font-size:53px;line-height:.85">WHAT<br>DO YOU<br>WANT?</div><div style="position:absolute;right:16px;bottom:115px;width:43%;font:18px Arial,sans-serif;line-height:1.35"><strong style="color:#f08c67">→</strong><br>Something buttery<br><br>Visit the shop<br><br>Find the route</div></div>`;
  return shell(direction,moment,css,body);
}

function renderConversation(direction,moment){
  const css=`body{background:#fbfbf7;color:#111;font-family:Arial,Helvetica,sans-serif}.frame{background:#fbfbf7}.nav{position:absolute;left:22px;right:22px;top:20px;display:flex;justify-content:space-between;font-size:10px;letter-spacing:.12em;text-transform:uppercase}.q{font-family:Georgia,'Times New Roman',serif;letter-spacing:-.055em}.choice{display:block;border-top:1px solid #111;padding:14px 0;font-size:19px}.citron{background:#dfff2f}.small{font-size:10px;letter-spacing:.13em;text-transform:uppercase}`;
  const nav=`<div class="nav"><strong>DU BONHEUR</strong><span>The Conversation</span><span>Berlin Mitte</span></div>`;
  let body='';
  if(moment.id==='opening') body=`${nav}<div style="position:absolute;left:34px;top:118px;width:82%"><div class="small">Arrival / first service turn</div><h1 class="q" style="font-size:124px;line-height:.87;margin:28px 0 0">What would make<br>today better?</h1></div><div style="position:absolute;right:34px;bottom:98px;width:34%"><span class="choice">Something buttery</span><span class="choice">Something chocolate</span><span class="choice">A gift</span><span class="choice citron" style="padding-left:12px">I just need the shop →</span></div>`;
  if(moment.id==='choice') body=`${nav}<div style="position:absolute;left:34px;top:110px;width:40%"><div class="small">You said: something buttery</div><h1 class="q" style="font-size:92px;line-height:.9;margin:24px 0">Then start<br>here.</h1><p style="font-size:18px;line-height:1.5;max-width:420px">The product appears as the answer, not as wallpaper.</p></div><div style="position:absolute;right:34px;top:90px;width:48%;height:690px;border:1px solid #111">${productProxy('warm')}<div class="citron" style="position:absolute;left:18px;top:18px;padding:9px 12px;font-size:11px">RECOMMENDATION / SOURCE REQUIRED</div></div>`;
  if(moment.id==='utility') body=`${nav}<div style="position:absolute;left:34px;top:130px;width:67%"><div class="small">You asked for the shop</div><h1 class="q" style="font-size:116px;line-height:.88;margin:26px 0">Berlin Mitte.<br>Here you go.</h1></div><div style="position:absolute;right:38px;bottom:112px;width:31%;font-size:22px"><span class="choice citron" style="padding-left:12px">Open route →</span><span class="choice">Opening information</span><span class="choice">Browse products</span></div>`;
  if(moment.id==='handoff') body=`${nav}<div class="small" style="position:absolute;left:34px;top:120px">Preparation / response</div><div class="q" style="position:absolute;left:34px;top:176px;font-size:86px;line-height:.9">One moment.</div><div style="position:absolute;left:34px;right:34px;top:360px;height:1px;background:#111"></div><div style="position:absolute;left:34px;top:390px;width:28%;font-size:18px;line-height:1.5">Your choice is being turned into something useful.</div><div class="citron" style="position:absolute;right:34px;bottom:116px;padding:22px 26px;font-size:36px;font-weight:700">READY →</div>`;
  if(moment.id==='mobile') body=`<div style="position:absolute;inset:0;padding:17px 16px 60px"><div style="display:flex;justify-content:space-between;font-size:9px;letter-spacing:.1em;text-transform:uppercase"><strong>DU BONHEUR</strong><span>The Conversation</span></div><div class="small" style="margin-top:70px">Direct service</div><h1 class="q" style="font-size:55px;line-height:.9;margin:22px 0 40px">What are you<br>looking for?</h1><span class="choice">Something buttery</span><span class="choice">Something chocolate</span><span class="choice">A gift</span><span class="choice citron" style="padding-left:10px">Just the route →</span><div style="position:absolute;left:16px;right:16px;bottom:78px;font-size:12px">One question · one response · no chatbot chrome</div></div>`;
  return shell(direction,moment,css,body);
}

function render(direction,moment){
  if(direction.id==='the-counter') return renderCounter(direction,moment);
  if(direction.id==='the-handoff') return renderHandoff(direction,moment);
  return renderConversation(direction,moment);
}

function comparisonHtml(moment, items){
  const cards=items.map((item)=>`<section><div class="title">${esc(item.label)}</div><img src="${esc(item.file)}"></section>`).join('');
  return `<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;background:#0f0f0f;color:#eee;font-family:Arial,sans-serif;padding:18px}.head{display:flex;justify-content:space-between;margin-bottom:14px;font-size:12px;letter-spacing:.1em;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.title{font-size:11px;margin-bottom:8px}img{display:block;width:100%;border:1px solid #333}</style></head><body><div class="head"><strong>Counter Ritual · ${esc(moment.label)}</strong><span>same experience thesis / different art direction</span></div><div class="grid">${cards}</div></body></html>`;
}

function overviewHtml(direction,items){
  const cards=items.map((item)=>`<section><div>${esc(item.moment)}</div><img src="${esc(item.file)}"></section>`).join('');
  return `<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;background:#101010;color:#eee;font-family:Arial,sans-serif;padding:18px}.head{margin-bottom:16px}.head h1{margin:0 0 5px;font-size:22px}.head p{margin:0;color:#999;font-size:11px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}section:last-child{grid-column:1/-1;width:36%}section div{font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px;color:#bbb}img{width:100%;display:block;border:1px solid #333}</style></head><body><div class="head"><h1>${esc(direction.label)}</h1><p>${esc(direction.premise)}</p></div><div class="grid">${cards}</div></body></html>`;
}

const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const evidence=[];
for(const direction of exploration.directions){
  for(const moment of moments){
    const html=render(direction,moment);
    const sourcePath=path.join(sourceRoot,`${direction.id}-${moment.id}.html`);
    const pngPath=path.join(framesRoot,`${direction.id}-${moment.id}.png`);
    await fs.writeFile(sourcePath,html);
    await page.setViewportSize({width:moment.width,height:moment.height});
    await page.goto(`file://${sourcePath}`);
    await page.screenshot({path:pngPath,fullPage:false});
    const buffer=await fs.readFile(pngPath);
    evidence.push({directionId:direction.id,directionLabel:direction.label,momentId:moment.id,momentLabel:moment.label,width:moment.width,height:moment.height,png:path.relative(outputRoot,pngPath),html:path.relative(outputRoot,sourcePath),sha256:sha(buffer)});
  }
}

for(const moment of moments){
  const items=exploration.directions.map((direction)=>({label:direction.label,file:path.relative(compareRoot,path.join(framesRoot,`${direction.id}-${moment.id}.png`))}));
  const htmlPath=path.join(compareRoot,`${moment.id}-comparison.html`);
  const pngPath=path.join(compareRoot,`${moment.id}-comparison.png`);
  await fs.writeFile(htmlPath,comparisonHtml(moment,items));
  await page.setViewportSize({width:1500,height:1040});
  await page.goto(`file://${htmlPath}`);
  await page.screenshot({path:pngPath,fullPage:true});
}

for(const direction of exploration.directions){
  const items=moments.map((moment)=>({moment:moment.label,file:path.relative(overviewRoot,path.join(framesRoot,`${direction.id}-${moment.id}.png`))}));
  const htmlPath=path.join(overviewRoot,`${direction.id}.html`);
  const pngPath=path.join(overviewRoot,`${direction.id}.png`);
  await fs.writeFile(htmlPath,overviewHtml(direction,items));
  await page.setViewportSize({width:1500,height:2050});
  await page.goto(`file://${htmlPath}`);
  await page.screenshot({path:pngPath,fullPage:true});
}
await browser.close();

const manifest={
  schema:'ai-studio-os/counter-ritual-art-direction-proof@1',
  status:'produced-awaiting-human-art-direction-review',
  experienceLock:{worldId:lock.worldId,worldLabel:lock.worldLabel,lockedSequence:lock.lockedSequence,humanExperienceThesisSelectionConfirmed:true},
  directionIds:exploration.directions.map((direction)=>direction.id),
  frameCount:evidence.length,
  comparisonCount:moments.length,
  overviewCount:exploration.directions.length,
  evidence,
  truth:{
    experienceThesisLocked:true,
    currentArtDirectionApproved:false,
    artDirectionSelectedAutomatically:false,
    humanVisualApproval:false,
    typographyApproved:false,
    productionTechnologyApproved:false,
    productionReady:false
  }
};
await fs.writeFile(path.join(outputRoot,'exploration.json'),JSON.stringify(exploration,null,2));
await fs.writeFile(path.join(outputRoot,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({status:manifest.status,frameCount:manifest.frameCount,directions:manifest.directionIds,outputRoot},null,2));
