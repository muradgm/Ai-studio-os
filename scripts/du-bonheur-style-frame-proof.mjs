import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { runCreativeRuntime } from '../lib/creative-runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const benchmarkPath = path.join(repoRoot, 'benchmarks', '001-du-bonheur', 'input.json');
const outputRoot = path.join(repoRoot, 'artifacts', 'du-bonheur', 'style-frame-proof-v1');
const framesRoot = path.join(outputRoot, 'frames');
const sourceRoot = path.join(outputRoot, 'source-html');
const compareRoot = path.join(outputRoot, 'comparisons');
const overviewRoot = path.join(outputRoot, 'world-overviews');

const benchmark = JSON.parse(await fs.readFile(benchmarkPath, 'utf8'));
const runtime = runCreativeRuntime(benchmark);
const plan = runtime.styleFrameProof;

if (!plan?.reviewReady) {
  throw new Error(`Style Frame Proof is not review-ready: ${(plan?.findings ?? []).map((item) => item.code).join(', ')}`);
}

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [framesRoot, sourceRoot, compareRoot, overviewRoot]) await fs.mkdir(dir, { recursive: true });

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function commonCss({ bg, ink, muted, accent, line }) {
  return `
    *{box-sizing:border-box} html,body{margin:0;width:100%;height:100%;overflow:hidden;background:${bg};color:${ink}}
    body{font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}
    .frame{position:relative;width:100vw;height:100vh;overflow:hidden;background:${bg}}
    .serif{font-family:Georgia,'Times New Roman',serif}
    .mono{font-family:'Courier New',monospace}
    .meta{position:absolute;left:28px;bottom:22px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${muted};z-index:30}
    .proof{position:absolute;right:24px;bottom:20px;padding:7px 10px;border:1px solid ${line};border-radius:999px;font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:${muted};z-index:30;background:${bg}cc}
    .hair{height:1px;background:${line}}
    .accent{color:${accent}}
    .placeholder{position:relative;overflow:hidden;border:1px solid ${line}}
    .placeholder:after{content:'NON-DOCUMENTARY MATERIAL STUDY';position:absolute;left:12px;bottom:10px;font-size:8px;letter-spacing:.12em;color:${muted};text-transform:uppercase}
  `;
}

function shell(body, theme, world, frame) {
  const css = commonCss(theme);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${theme.extra ?? ''}</style></head><body><main class="frame">${body}<div class="meta">${esc(world.label)} · ${esc(frame.frameLabel)}</div><div class="proof">Style-frame proof · proxy type/image</div></main></body></html>`;
}

function laminated(world, frame) {
  const theme = {
    bg:'#eee6dc', ink:'#171310', muted:'#766c63', accent:'#b33a2e', line:'rgba(23,19,16,.20)',
    extra:`
      .lc-nav{position:absolute;left:32px;right:32px;top:26px;display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
      .lc-word{font-size:clamp(76px,11vw,166px);line-height:.78;letter-spacing:-.075em;font-weight:700}
      .lc-copy{font-size:16px;line-height:1.45;max-width:420px}
      .layer{position:absolute;border:1px solid rgba(23,19,16,.25);background:rgba(255,255,255,.15);backdrop-filter:blur(1px)}
      .crumb{background:radial-gradient(circle at 30% 35%,#f7d6a4 0 5%,transparent 6%),radial-gradient(circle at 68% 40%,#c27d4a 0 4%,transparent 5%),radial-gradient(circle at 50% 70%,#efb871 0 5%,transparent 6%),linear-gradient(135deg,#c6804b,#f0c68d 52%,#9d5735);}
      .lc-label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#766c63}
    `
  };
  const nav = `<div class="lc-nav"><strong>DU BONHEUR</strong><span>French pâtisserie · Berlin Mitte</span><span>Visit / Shop</span></div>`;
  let body = '';
  if (frame.frameType === 'opening') body = `${nav}
    <section style="position:absolute;left:32px;top:145px;width:58%"><div class="lc-label">01 — Craft made visible</div><div class="lc-word serif" style="margin-top:24px">DU<br>BONHEUR</div><p class="lc-copy" style="margin:34px 0 0 6px">French pastry precision, held inside Berlin restraint. The experience opens through layers rather than decoration.</p></section>
    <div style="position:absolute;right:-2%;top:115px;width:45%;height:650px">
      <div class="layer" style="left:6%;top:0;width:66%;height:520px;transform:rotate(5deg)"></div>
      <div class="layer crumb placeholder" style="left:18%;top:62px;width:71%;height:510px;clip-path:polygon(0 7%,100% 0,91% 100%,10% 92%)"></div>
      <div class="layer" style="left:0;top:210px;width:94%;height:145px;background:${theme.bg};transform:rotate(-8deg)"></div>
      <div style="position:absolute;left:2%;top:260px;width:94%;border-top:2px solid ${theme.accent};transform:rotate(-8deg)"></div>
    </div>`;
  if (frame.frameType === 'sensory') body = `${nav}
    <div style="position:absolute;left:34px;top:118px;width:25%"><div class="lc-label">02 — Lamination / sensory proof</div><h1 class="serif" style="font-size:54px;line-height:.94;letter-spacing:-.045em;margin:22px 0">Texture is the headline.</h1><p class="lc-copy">Macro scale carries appetite. The interface around it stays quiet enough for the real product to remain the event.</p></div>
    <div class="placeholder" style="position:absolute;right:32px;top:94px;width:65%;height:700px;border:none">
      <div class="crumb" style="position:absolute;inset:0;filter:saturate(.75)"></div>
      <div style="position:absolute;left:5%;right:5%;top:18%;height:14%;background:${theme.bg};transform:rotate(-3deg);box-shadow:0 14px 0 rgba(238,230,220,.72),0 28px 0 rgba(238,230,220,.45)"></div>
      <div style="position:absolute;left:5%;right:5%;top:52%;height:2px;background:${theme.accent};transform:rotate(2deg)"></div>
      <div style="position:absolute;right:24px;top:22px;padding:9px 12px;background:${theme.bg};font-size:10px;letter-spacing:.14em">REAL PRODUCT CROP → SOURCE REQUIRED</div>
    </div>`;
  if (frame.frameType === 'utility') body = `${nav}
    <section style="position:absolute;left:34px;top:126px;width:56%;height:620px;border-top:1px solid ${theme.line};border-bottom:1px solid ${theme.line};display:grid;grid-template-columns:1.15fr .85fr">
      <div style="padding:42px 50px 38px 0;border-right:1px solid ${theme.line}"><div class="lc-label">04 — useful without leaving the world</div><h1 class="serif" style="font-size:82px;line-height:.88;letter-spacing:-.055em;margin:28px 0 52px">Visit the<br>real place.</h1><div style="display:grid;grid-template-columns:1fr 1fr;gap:30px"><div><div class="lc-label">Place</div><div style="font-size:22px;margin-top:8px">Berlin Mitte</div></div><div><div class="lc-label">Actions</div><div style="font-size:22px;margin-top:8px">Route · Shop</div></div></div></div>
      <div style="padding:42px"><div class="lc-label">Signature product evidence</div><div style="margin-top:28px;height:330px" class="crumb placeholder"></div><div style="margin-top:20px;font-size:13px;line-height:1.5">Croissant · truthful source image required for production.</div></div>
    </section>
    <aside style="position:absolute;right:34px;top:126px;width:35%;height:620px;background:#171310;color:#eee6dc;padding:42px;display:flex;flex-direction:column;justify-content:space-between"><div class="lc-label" style="color:#b9aea4">Service layer</div><div class="serif" style="font-size:62px;line-height:.94;letter-spacing:-.04em">No cinematic detour before the useful answer.</div><div style="display:flex;gap:12px"><span style="padding:14px 18px;border:1px solid #eee6dc">ROUTE</span><span style="padding:14px 18px;background:${theme.accent}">SHOP</span></div></aside>`;
  if (frame.frameType === 'transition') body = `${nav}
    <div style="position:absolute;inset:86px 32px 64px;overflow:hidden;border:1px solid ${theme.line}">
      <div style="position:absolute;inset:0;background:#171310;clip-path:polygon(0 0,58% 0,43% 100%,0 100%)"></div>
      <div style="position:absolute;left:4%;top:12%;color:#eee6dc;font-size:13px;letter-spacing:.16em;text-transform:uppercase">raw → worked → finished</div>
      <div class="serif" style="position:absolute;left:4%;bottom:11%;color:#eee6dc;font-size:118px;line-height:.78;letter-spacing:-.07em">CRAFT</div>
      <div class="serif" style="position:absolute;right:4%;top:18%;font-size:112px;line-height:.8;letter-spacing:-.07em;text-align:right">BERLIN<br>RESTRAINT</div>
      <div style="position:absolute;left:48%;top:-10%;width:2px;height:130%;background:${theme.accent};transform:rotate(9deg)"></div>
      <div style="position:absolute;right:4%;bottom:10%;width:36%;font-size:14px;line-height:1.5">Transition behavior follows a decisive cut: sensory density gives way to clear evidence and action.</div>
    </div>`;
  if (frame.frameType === 'mobile') body = `<div style="position:absolute;inset:0;padding:18px 16px 68px"><div style="display:flex;justify-content:space-between;font-size:9px;letter-spacing:.12em;text-transform:uppercase"><strong>DU BONHEUR</strong><span>Berlin Mitte</span></div><div class="lc-label" style="margin-top:58px">Laminated Craft</div><div class="serif" style="font-size:68px;line-height:.82;letter-spacing:-.06em;margin-top:18px">Craft<br>in layers.</div><div class="crumb placeholder" style="height:270px;margin-top:28px;clip-path:polygon(0 7%,100% 0,93% 100%,7% 94%)"></div><div style="margin-top:24px;border-top:1px solid ${theme.line};padding-top:18px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:end"><div><div class="lc-label">Visit</div><div style="font-size:18px;margin-top:6px">Berlin Mitte</div></div><div style="padding:12px 15px;background:#171310;color:#eee6dc">ROUTE</div></div></div>`;
  return shell(body, theme, world, frame);
}

function counter(world, frame) {
  const theme = {
    bg:'#f4dfcf', ink:'#2a1813', muted:'#8e6f63', accent:'#e24b31', line:'rgba(42,24,19,.19)',
    extra:`
      .cr-nav{position:absolute;left:30px;right:30px;top:25px;display:flex;justify-content:space-between;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
      .cr-pill{border:1px solid rgba(42,24,19,.3);border-radius:999px;padding:12px 16px;background:rgba(255,255,255,.15)}
      .cr-stage{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#8e6f63}
      .tray{border:1.5px solid #2a1813;border-radius:50%;background:radial-gradient(circle at 42% 38%,#f9c885 0 14%,#b8683c 15% 28%,#f2a75f 29% 34%,transparent 35%),#efd7c6}
    `
  };
  const nav = `<div class="cr-nav"><strong>DU BONHEUR</strong><span>COUNTER RITUAL</span><span>Berlin Mitte</span></div>`;
  let body='';
  if (frame.frameType==='opening') body=`${nav}<div style="position:absolute;left:30px;right:30px;top:108px;bottom:78px;display:grid;grid-template-columns:58% 42%;border-top:1px solid ${theme.line};border-bottom:1px solid ${theme.line}"><section style="padding:58px 48px 42px 0;display:flex;flex-direction:column;justify-content:space-between"><div><div class="cr-stage">Arrival → attention</div><h1 class="serif" style="font-size:100px;line-height:.83;letter-spacing:-.055em;margin:26px 0">What brings<br>you to the<br>counter?</h1></div><div style="display:flex;gap:10px"><span class="cr-pill">Discover pastry</span><span class="cr-pill">Plan a visit</span><span class="cr-pill">Find the shop</span></div></section><section style="border-left:1px solid ${theme.line};position:relative"><div class="tray placeholder" style="position:absolute;width:410px;height:410px;right:7%;top:14%"></div><div style="position:absolute;left:34px;bottom:42px;font-size:18px;max-width:330px;line-height:1.45">The interface answers like service: one clear choice, immediate context, no theatrical wait.</div></section></div>`;
  if (frame.frameType==='sensory') body=`${nav}<div style="position:absolute;inset:112px 30px 72px;display:grid;grid-template-columns:repeat(6,1fr);gap:10px"><div style="grid-column:1/3;padding:30px 20px 20px 0"><div class="cr-stage">Choice → preparation</div><h1 class="serif" style="font-size:70px;line-height:.9;letter-spacing:-.045em;margin:22px 0">Appetite at<br>human scale.</h1><p style="font-size:15px;line-height:1.5;max-width:300px">Products appear as things being chosen and handed over, not museum objects.</p></div><div style="grid-column:3/7;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;align-items:end"><div style="height:60%;background:#2a1813;color:#f4dfcf;padding:18px;display:flex;align-items:end">01<br>ARRIVE</div><div style="height:82%;background:#e24b31;color:white;padding:18px;display:flex;align-items:end">02<br>CHOOSE</div><div class="tray placeholder" style="height:100%;border-radius:0;display:flex;align-items:flex-end;padding:18px"><span style="background:${theme.bg};padding:8px 10px;font-size:10px">03 · REAL PRODUCT SOURCE</span></div></div></div>`;
  if (frame.frameType==='utility') body=`${nav}<div style="position:absolute;left:30px;right:30px;top:118px;bottom:72px;display:grid;grid-template-columns:40% 60%;border-top:1px solid ${theme.line}"><section style="padding:42px 50px 20px 0"><div class="cr-stage">Handoff</div><h1 class="serif" style="font-size:72px;line-height:.9;letter-spacing:-.045em;margin:24px 0 42px">Useful<br>information,<br>served directly.</h1><p style="font-size:15px;line-height:1.55">No invented opening status. Production data plugs into this service layer when verified.</p></section><section style="border-left:1px solid ${theme.line};padding:42px;display:flex;flex-direction:column;gap:12px"><div style="display:grid;grid-template-columns:130px 1fr auto;gap:18px;padding:24px 0;border-bottom:1px solid ${theme.line}"><span class="cr-stage">Place</span><strong style="font-size:28px">Berlin Mitte</strong><span class="cr-pill">Route</span></div><div style="display:grid;grid-template-columns:130px 1fr auto;gap:18px;padding:24px 0;border-bottom:1px solid ${theme.line}"><span class="cr-stage">Product</span><strong style="font-size:28px">Croissant</strong><span class="cr-pill">Discover</span></div><div style="display:grid;grid-template-columns:130px 1fr auto;gap:18px;padding:24px 0;border-bottom:1px solid ${theme.line}"><span class="cr-stage">Action</span><strong style="font-size:28px">Visit / Shop</strong><span style="background:${theme.accent};color:white;padding:12px 18px;border-radius:999px">Continue</span></div><div style="margin-top:auto;display:flex;align-items:center;gap:18px"><div class="tray placeholder" style="width:120px;height:120px"></div><div><div class="cr-stage">Preparation cue</div><div style="font-size:18px;margin-top:8px">Real product imagery enters here when available.</div></div></div></section></div>`;
  if (frame.frameType==='transition') body=`${nav}<div style="position:absolute;inset:112px 30px 72px"><div class="cr-stage">Preparation → handoff → return</div><div style="position:absolute;left:0;right:0;top:48%;height:2px;background:${theme.ink}"></div><div style="position:absolute;left:4%;top:38%;width:72px;height:72px;border-radius:50%;background:${theme.ink};color:${theme.bg};display:grid;place-items:center;font-size:10px;letter-spacing:.1em">CHOOSE</div><div style="position:absolute;left:35%;top:31%;width:170px;height:170px" class="tray placeholder"></div><div style="position:absolute;right:7%;top:37%;width:96px;height:96px;border-radius:50%;background:${theme.accent};color:white;display:grid;place-items:center;font-size:10px;letter-spacing:.1em">HANDOFF</div><div class="serif" style="position:absolute;left:0;bottom:0;font-size:105px;letter-spacing:-.055em;line-height:.8">A website with<br>service rhythm.</div></div>`;
  if (frame.frameType==='mobile') body=`<div style="padding:18px 16px 70px;height:100%"><div style="display:flex;justify-content:space-between;font-size:9px;letter-spacing:.12em;text-transform:uppercase"><strong>DU BONHEUR</strong><span>Counter Ritual</span></div><div class="cr-stage" style="margin-top:54px">Arrival</div><h1 class="serif" style="font-size:58px;line-height:.86;letter-spacing:-.05em;margin:18px 0 26px">What do you<br>need now?</h1><div style="display:grid;gap:8px"><div class="cr-pill" style="display:flex;justify-content:space-between"><span>Discover pastry</span><span>01</span></div><div class="cr-pill" style="display:flex;justify-content:space-between;background:${theme.accent};color:white;border-color:${theme.accent}"><span>Plan a visit</span><span>02</span></div><div class="cr-pill" style="display:flex;justify-content:space-between"><span>Find the shop</span><span>03</span></div></div><div style="margin-top:28px;padding-top:20px;border-top:1px solid ${theme.line};display:grid;grid-template-columns:1fr 108px;gap:18px"><div><div class="cr-stage">Place</div><div style="font-size:20px;margin-top:7px">Berlin Mitte</div><div style="font-size:13px;line-height:1.45;margin-top:10px">Verified service information belongs above decorative content.</div></div><div class="tray placeholder" style="width:108px;height:108px"></div></div></div>`;
  return shell(body,theme,world,frame);
}

function proofSheet(world, frame) {
  const theme={
    bg:'#f1efe7',ink:'#151515',muted:'#6e6c65',accent:'#e94d2f',line:'rgba(21,21,21,.23)',
    extra:`
      .ps-nav{position:absolute;left:24px;right:24px;top:20px;display:grid;grid-template-columns:1fr 1fr 1fr;font-size:10px;letter-spacing:.13em;text-transform:uppercase}.ps-nav span:nth-child(2){text-align:center}.ps-nav span:last-child{text-align:right}
      .ps-index{font-family:'Courier New',monospace;font-size:10px;letter-spacing:.12em;color:#6e6c65;text-transform:uppercase}
      .ps-box{border:1px solid rgba(21,21,21,.25);background:rgba(255,255,255,.14)}
      .ps-image{background:linear-gradient(145deg,#d6d1c7,#8d8a84 42%,#ddd7cb 43% 58%,#54524f 59%);filter:grayscale(.35)}
      .ps-note{font-family:'Courier New',monospace;font-size:10px;line-height:1.45;letter-spacing:.04em}
    `
  };
  const nav=`<div class="ps-nav"><strong>DU BONHEUR / PROOF 001</strong><span>French craft × Berlin record</span><span>Berlin Mitte</span></div>`;
  let body='';
  if(frame.frameType==='opening') body=`${nav}<div style="position:absolute;inset:74px 24px 62px;display:grid;grid-template-columns:1.15fr .85fr;gap:12px"><section class="ps-box" style="padding:30px;display:flex;flex-direction:column;justify-content:space-between"><div><div class="ps-index">Evidence field / 001</div><div class="serif" style="font-size:116px;line-height:.78;letter-spacing:-.07em;margin-top:40px">DU<br>BONHEUR</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><p style="font-size:15px;line-height:1.45">Pastry craft presented as evidence, not luxury theater.</p><p class="ps-note">SOURCE TRUTHS<br>01 real pâtisserie<br>02 real products<br>03 Berlin Mitte</p></div></section><section style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1.2fr .8fr;gap:12px"><div class="ps-box ps-image placeholder" style="grid-column:1/3"><span style="position:absolute;top:12px;left:12px;background:${theme.bg};padding:7px 9px" class="ps-index">REAL SOURCE IMAGE / REQUIRED</span></div><div class="ps-box" style="padding:18px"><div class="ps-index">Process fragment</div><div style="font-size:50px;margin-top:24px">01→04</div></div><div style="background:${theme.accent};color:white;padding:18px;display:flex;flex-direction:column;justify-content:space-between"><div class="ps-index" style="color:white">Sensory break</div><div class="serif" style="font-size:40px;line-height:.9">Pleasure interrupts the grid.</div></div></section></div>`;
  if(frame.frameType==='sensory') body=`${nav}<div style="position:absolute;inset:76px 24px 62px;display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(8,1fr);gap:8px"><div class="ps-box ps-image placeholder" style="grid-column:1/8;grid-row:1/9"><div style="position:absolute;left:18px;top:18px;background:${theme.bg};padding:9px" class="ps-index">PRODUCT MACRO / SOURCE REQUIRED</div><div style="position:absolute;left:42%;top:0;bottom:0;width:2px;background:${theme.accent}"></div><div style="position:absolute;top:56%;left:0;right:0;height:1px;background:${theme.ink}"></div></div><div class="ps-box" style="grid-column:8/13;grid-row:1/4;padding:20px"><div class="ps-index">Observation</div><div class="serif" style="font-size:58px;line-height:.9;letter-spacing:-.04em;margin-top:26px">Texture becomes evidence.</div></div><div class="ps-box" style="grid-column:8/11;grid-row:4/7;padding:18px"><div class="ps-index">Crop note</div><p class="ps-note" style="margin-top:28px">show lamination<br>retain imperfections<br>no synthetic signature product</p></div><div style="grid-column:11/13;grid-row:4/7;background:${theme.accent};padding:16px;color:white"><div class="ps-index" style="color:white">Scale</div><div style="font-size:54px;margin-top:24px">×8</div></div><div class="ps-box" style="grid-column:8/13;grid-row:7/9;padding:16px;display:flex;align-items:center;justify-content:space-between"><span class="ps-index">Product: croissant</span><span class="ps-note">truthful asset only</span></div></div>`;
  if(frame.frameType==='utility') body=`${nav}<div style="position:absolute;inset:76px 24px 62px"><div style="display:grid;grid-template-columns:140px 1fr 1fr 180px;border-top:1px solid ${theme.ink};border-bottom:1px solid ${theme.ink}"><div class="ps-index" style="padding:18px 0">FIELD</div><div class="ps-index" style="padding:18px">VALUE</div><div class="ps-index" style="padding:18px">EVIDENCE</div><div class="ps-index" style="padding:18px">ACTION</div></div>${[['PLACE','Berlin Mitte','business truth','ROUTE'],['PRODUCT','Croissant','real source required','DISCOVER'],['PURPOSE','Visit / understand / reach shop','brief truth','CONTINUE']].map((r,i)=>`<div style="display:grid;grid-template-columns:140px 1fr 1fr 180px;border-bottom:1px solid ${theme.line};min-height:118px;align-items:center"><div class="ps-index">0${i+1} ${r[0]}</div><div style="font-size:30px;padding:18px">${r[1]}</div><div class="ps-note" style="padding:18px">${r[2]}</div><div style="padding:18px"><span style="display:inline-block;border:1px solid ${theme.ink};padding:12px 16px">${r[3]}</span></div></div>`).join('')}<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px"><div class="ps-box" style="padding:22px"><div class="ps-index">Proof note</div><div class="serif" style="font-size:48px;line-height:.94;margin-top:18px">Utility should increase credibility, not break art direction.</div></div><div class="ps-box ps-image placeholder" style="min-height:210px"></div></div></div>`;
  if(frame.frameType==='transition') body=`${nav}<div style="position:absolute;inset:76px 24px 62px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px"><div class="ps-box" style="padding:22px;position:relative"><div class="ps-index">Evidence / align</div><div style="position:absolute;left:22px;right:22px;top:44%;height:1px;background:${theme.ink}"></div><div style="position:absolute;left:22px;top:30%;width:54px;height:54px;border:1px solid ${theme.ink}"></div><div style="position:absolute;right:22px;top:50%;width:54px;height:54px;background:${theme.ink}"></div></div><div style="background:${theme.accent};color:white;padding:22px;display:flex;flex-direction:column;justify-content:space-between"><div class="ps-index" style="color:white">Sensory interruption</div><div class="serif" style="font-size:78px;line-height:.83;letter-spacing:-.055em">BREAK<br>SCALE</div><div class="ps-note">one moment of excess<br>inside disciplined evidence</div></div><div class="ps-box" style="padding:22px;display:flex;flex-direction:column;justify-content:space-between"><div class="ps-index">Resolve / action</div><div class="serif" style="font-size:60px;line-height:.9">From evidence<br>to visit.</div><div class="ps-note">Transition logic: assemble → interrupt → resolve.</div></div></div>`;
  if(frame.frameType==='mobile') body=`<div style="padding:16px 14px 70px;height:100%"><div style="display:flex;justify-content:space-between" class="ps-index"><strong>DB / 001</strong><span>Berlin Mitte</span></div><div style="margin-top:38px;border-top:1px solid ${theme.ink};padding-top:12px" class="ps-index">Berlin Proof Sheet</div><div class="serif" style="font-size:62px;line-height:.84;letter-spacing:-.055em;margin-top:22px">Craft,<br>with receipts.</div><div class="ps-image placeholder" style="height:245px;margin-top:24px"><span class="ps-index" style="position:absolute;top:10px;left:10px;background:${theme.bg};padding:6px">REAL SOURCE</span></div><div style="display:grid;grid-template-columns:70px 1fr;gap:8px;margin-top:12px;border-top:1px solid ${theme.line};padding-top:12px"><div class="ps-index">01 Place</div><div style="font-size:18px">Berlin Mitte</div><div class="ps-index">02 Product</div><div style="font-size:18px">Croissant</div><div class="ps-index">03 Action</div><div style="font-size:18px">Route / Shop</div></div><div style="margin-top:16px;background:${theme.accent};color:white;padding:14px;display:flex;justify-content:space-between"><span class="ps-index" style="color:white">Sensory break</span><strong>OPEN DETAIL</strong></div></div>`;
  return shell(body,theme,world,frame);
}

function renderFrame(world, frame) {
  if (world.id === 'laminated-craft') return laminated(world, frame);
  if (world.id === 'counter-ritual') return counter(world, frame);
  if (world.id === 'berlin-proof-sheet') return proofSheet(world, frame);
  throw new Error(`No renderer for Creative World ${world.id}`);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function dataUri(buffer) {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

function comparisonHtml(frameType, items) {
  const mobile = frameType === 'mobile';
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#111;color:#eee;font-family:Arial,sans-serif}.board{padding:26px 28px 34px}.head{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px}.head h1{margin:0;font-size:30px;letter-spacing:-.03em}.head span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#999}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.card{background:#1a1a1a;border:1px solid #333;padding:10px}.label{display:flex;justify-content:space-between;padding:5px 3px 11px;font-size:11px;letter-spacing:.1em;text-transform:uppercase}.shot{background:#000;display:grid;place-items:center;overflow:hidden;height:${mobile ? '760px' : '520px'}}.shot img{display:block;max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 12px 35px rgba(0,0,0,.32)}</style></head><body><div class="board"><div class="head"><h1>${esc(frameType)} comparison</h1><span>Same moment · three worlds · no winner selected</span></div><div class="grid">${items.map((item)=>`<div class="card"><div class="label"><strong>${esc(item.worldLabel)}</strong><span>${esc(item.frameLabel)}</span></div><div class="shot"><img src="${item.src}"></div></div>`).join('')}</div></div></body></html>`;
}

function overviewHtml(worldLabel, items) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#111;color:#eee;font-family:Arial,sans-serif}.board{padding:28px}.head{display:flex;justify-content:space-between;margin-bottom:18px}.head h1{margin:0;font-size:32px}.head span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#999}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.card{border:1px solid #333;background:#191919;padding:9px}.card.mobile{grid-column:1/3}.label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#aaa;padding:4px 2px 9px}.shot{height:470px;background:#050505;display:grid;place-items:center;overflow:hidden}.mobile .shot{height:600px}.shot img{max-width:100%;max-height:100%;object-fit:contain}</style></head><body><div class="board"><div class="head"><h1>${esc(worldLabel)}</h1><span>Five proof moments · browser-rendered</span></div><div class="grid">${items.map((item)=>`<div class="card ${item.frameType==='mobile'?'mobile':''}"><div class="label">${esc(item.frameLabel)}</div><div class="shot"><img src="${item.src}"></div></div>`).join('')}</div></div></body></html>`;
}

const browser = await chromium.launch({ headless: true });
const records = [];
try {
  const page = await browser.newPage();
  for (const frame of plan.frames) {
    const world = runtime.creativeWorldExploration.worlds.find((item) => item.id === frame.worldId);
    const html = renderFrame(world, frame);
    const htmlPath = path.join(sourceRoot, `${frame.id}.html`);
    const pngPath = path.join(framesRoot, `${frame.id}.png`);
    await fs.writeFile(htmlPath, html, 'utf8');
    await page.setViewportSize({ width: frame.width, height: frame.height });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: pngPath, fullPage: false });
    const buffer = await fs.readFile(pngPath);
    records.push({
      id: frame.id,
      worldId: frame.worldId,
      worldLabel: frame.worldLabel,
      frameType: frame.frameType,
      frameLabel: frame.frameLabel,
      width: frame.width,
      height: frame.height,
      html: path.relative(outputRoot, htmlPath).replaceAll('\\','/'),
      png: path.relative(outputRoot, pngPath).replaceAll('\\','/'),
      sha256: sha256(buffer),
      bytes: buffer.length
    });
  }

  const comparisonRecords = [];
  for (const type of plan.comparisons) {
    const items = records.filter((item) => item.frameType === type.frameType);
    const enriched = await Promise.all(items.map(async (item) => ({ ...item, src: dataUri(await fs.readFile(path.join(outputRoot, item.png))) })));
    const html = comparisonHtml(type.frameType, enriched);
    const htmlPath = path.join(compareRoot, `${type.id}.html`);
    const pngPath = path.join(compareRoot, `${type.id}.png`);
    await fs.writeFile(htmlPath, html, 'utf8');
    await page.setViewportSize({ width: 1680, height: type.frameType === 'mobile' ? 900 : 650 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: pngPath, fullPage: true });
    const buffer = await fs.readFile(pngPath);
    comparisonRecords.push({ id:type.id, frameType:type.frameType, png:path.relative(outputRoot,pngPath).replaceAll('\\','/'), html:path.relative(outputRoot,htmlPath).replaceAll('\\','/'), sha256:sha256(buffer), bytes:buffer.length });
  }

  const overviewRecords = [];
  for (const world of runtime.creativeWorldExploration.worlds) {
    const items = records.filter((item) => item.worldId === world.id);
    const enriched = await Promise.all(items.map(async (item) => ({ ...item, src: dataUri(await fs.readFile(path.join(outputRoot, item.png))) })));
    const html = overviewHtml(world.label, enriched);
    const htmlPath = path.join(overviewRoot, `${world.id}.html`);
    const pngPath = path.join(overviewRoot, `${world.id}.png`);
    await fs.writeFile(htmlPath, html, 'utf8');
    await page.setViewportSize({ width: 1640, height: 1600 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: pngPath, fullPage: true });
    const buffer = await fs.readFile(pngPath);
    overviewRecords.push({ worldId:world.id, worldLabel:world.label, png:path.relative(outputRoot,pngPath).replaceAll('\\','/'), html:path.relative(outputRoot,htmlPath).replaceAll('\\','/'), sha256:sha256(buffer), bytes:buffer.length });
  }

  const manifest = {
    schema: 'ai-studio-os/style-frame-proof-evidence@1',
    projectId: benchmark.id,
    status: 'produced-awaiting-human-visual-review',
    creativeThesis: runtime.creativeThesis.governingIdea.statement,
    worldCount: runtime.creativeWorldExploration.worlds.length,
    frameCount: records.length,
    comparisonCount: comparisonRecords.length,
    overviewCount: overviewRecords.length,
    frames: records,
    comparisons: comparisonRecords,
    worldOverviews: overviewRecords,
    truth: {
      browserRendered: true,
      networkIndependent: true,
      usesProxyTypography: true,
      usesDocumentaryProductFabrication: false,
      humanVisualApproval: false,
      humanWorldSelectionConfirmed: false,
      selectedWorldId: null,
      typographyApproved: false,
      productionTechnologyApproved: false,
      productionReady: false
    }
  };
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const links = [
    ...comparisonRecords.map((item)=>`<li><a href="${item.png}">${esc(item.id)}</a></li>`),
    ...overviewRecords.map((item)=>`<li><a href="${item.png}">${esc(item.worldLabel)} overview</a></li>`)
  ].join('');
  const index = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;background:#111;color:#eee}a{color:#ff795f}code{background:#222;padding:2px 5px}li{margin:10px 0}</style></head><body><h1>Du Bonheur · Style Frame Proof v1</h1><p><strong>Status:</strong> produced awaiting human visual review.</p><p>These are exact Chromium rasterizations of the HTML/CSS/SVG proof. Typography is proxy-only and product documentary imagery is not fabricated.</p><ul>${links}</ul><p>No Creative World is selected by this evidence.</p></body></html>`;
  await fs.writeFile(path.join(outputRoot, 'index.html'), index, 'utf8');

  console.log(`Du Bonheur style-frame proof produced: ${records.length} frames, ${comparisonRecords.length} comparisons, ${overviewRecords.length} world overviews -> ${outputRoot}`);
} finally {
  await browser.close();
}
