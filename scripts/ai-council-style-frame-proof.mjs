import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildStyleFrameProof, buildVisualProofEvidence } from '../modules/style-frame/runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'style-frame-proof-v2');
const framesRoot = path.join(outputRoot, 'frames');
const sourceRoot = path.join(outputRoot, 'source-html');
const compareRoot = path.join(outputRoot, 'comparisons');
const overviewRoot = path.join(outputRoot, 'world-overviews');

const exploration = JSON.parse(await fs.readFile(path.join(projectRoot, 'creative-worlds.json'), 'utf8'));
const momentConfig = JSON.parse(await fs.readFile(path.join(projectRoot, 'style-frame-moments.json'), 'utf8'));
const plan = buildStyleFrameProof({ exploration, moments: momentConfig.moments });

if (!plan.reviewReady) {
  throw new Error(`AI Council Style Frame Proof is not review-ready: ${(plan.findings ?? []).map((item) => item.code).join(', ')}`);
}

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [framesRoot, sourceRoot, compareRoot, overviewRoot]) await fs.mkdir(dir, { recursive: true });

const DEMO = {
  request: 'Should validated cognition start controlling routing authority now?',
  project: 'AI Council · routing-intelligence decision',
  facts: [
    'Problem Formulation + Strategy Comparison V1 are merged.',
    'Routing still receives the original request.',
    'Cognitive reliability calibration is not yet complete.'
  ],
  assumptions: [
    'Better semantic understanding should eventually improve routing.',
    'Provider choice must never weaken privacy or approval boundaries.'
  ],
  blockers: [
    'No shadow-mode comparison against current routing.',
    'No reliability benchmark proving authority transfer is safe.'
  ],
  strategies: [
    { id: 'A', title: 'Keep current routing', note: 'Lowest change risk · preserves current authority boundary', state: 'eligible' },
    { id: 'B', title: 'Shadow cognitive routing', note: 'Compare decisions without granting execution authority', state: 'recommended' },
    { id: 'C', title: 'Transfer authority now', note: 'Fastest path · fails evidence and governance criteria', state: 'ineligible' }
  ],
  decision: 'Run cognitive routing in shadow mode before any authority transfer.',
  objection: 'Shadow mode delays the intended architecture and adds temporary complexity.',
  conditions: ['Preserve current router as authority', 'Capture decision deltas', 'Measure semantic win rate', 'Require human approval before authority transfer'],
  execution: ['Shadow comparison instrumentation added', 'Current routing remains authoritative', 'No provider/tool authority changed'],
  verification: ['Cognitive/core regression suite passed', 'Routing authority invariant passed', 'No private context sent externally'],
  memory: 'Recorded as advisory project decision; promotion to canonical authority change remains blocked.'
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function list(items, className = '') {
  return `<ul class="${className}">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;
}

function proofBadge(world, moment) {
  return `<div class="proof-badge">STYLE-FRAME PROOF · ${esc(world.label)} · ${esc(moment.label)} · SCENARIO DATA, NOT REPO STATE</div>`;
}

function baseCss(theme) {
  return `
    :root{--bg:${theme.bg};--ink:${theme.ink};--muted:${theme.muted};--line:${theme.line};--accent:${theme.accent};--accent2:${theme.accent2};--paper:${theme.paper ?? theme.bg}}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--bg);color:var(--ink)}
    body{font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    .frame{position:relative;width:100vw;height:100vh;overflow:hidden;background:var(--bg)}
    .serif{font-family:Georgia,'Times New Roman',serif}
    .micro{font-size:10px;line-height:1.2;letter-spacing:.15em;text-transform:uppercase;color:var(--muted)}
    .label{font-size:11px;line-height:1.2;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
    .proof-badge{position:absolute;right:22px;bottom:18px;z-index:50;border:1px solid var(--line);padding:7px 10px;background:color-mix(in srgb,var(--bg) 92%,transparent);font-size:8px;letter-spacing:.11em;text-transform:uppercase;color:var(--muted)}
    .topline{position:absolute;left:30px;right:30px;top:24px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:14px;border-bottom:1px solid var(--line);z-index:10}
    .brand{font-weight:700;letter-spacing:-.02em}.topmeta{display:flex;gap:26px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
    .status{display:inline-flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.11em;text-transform:uppercase}.dot{width:7px;height:7px;border-radius:50%;background:var(--accent)}
    ul{margin:0;padding:0;list-style:none}li{position:relative;padding-left:15px}li:before{content:'—';position:absolute;left:0;color:var(--muted)}
  `;
}

function shell({ world, moment, theme, body, extra = '' }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseCss(theme)}${extra}</style></head><body><main class="frame">${body}${proofBadge(world,moment)}</main></body></html>`;
}

function counterpoint(world, moment) {
  const theme = { bg:'#f2eee7', ink:'#171512', muted:'#756e66', line:'rgba(23,21,18,.18)', accent:'#a6372b', accent2:'#173b67', paper:'#faf8f4' };
  const extra = `
    .cp-title{font-family:Georgia,'Times New Roman',serif;font-size:clamp(64px,7vw,108px);line-height:.87;letter-spacing:-.055em;font-weight:400}
    .cp-deck{font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.35}.cp-note{font-size:13px;line-height:1.45;color:#453f39}
    .rule{height:1px;background:var(--line)}.red{color:var(--accent)}.blue{color:var(--accent2)}
    .folio{background:rgba(255,255,255,.28);border-top:1px solid var(--ink);padding-top:12px}.folio h3{font:400 30px/1.05 Georgia,serif;margin:8px 0 14px}.folio p{font-size:13px;line-height:1.5;margin:0}
    .settlement{border-top:2px solid var(--ink);border-bottom:1px solid var(--ink);padding:19px 0}.settlement strong{font:400 34px/1.05 Georgia,serif}
    .margin-note{border-left:2px solid var(--accent);padding-left:13px;font-size:12px;line-height:1.45;color:#514941}
    .cp-chip{display:inline-block;border:1px solid var(--line);padding:8px 10px;font-size:9px;letter-spacing:.1em;text-transform:uppercase;margin-right:6px;background:rgba(255,255,255,.35)}
  `;
  const top = `<div class="topline"><div class="brand">AI Council</div><div class="topmeta"><span>Counterpoint</span><span>${esc(moment.label)}</span><span>Orchestrated Intelligence</span></div></div>`;
  let body = top;

  if (moment.id === 'opening') body += `
    <section style="position:absolute;left:32px;top:112px;width:58%;bottom:70px;display:flex;flex-direction:column;justify-content:space-between">
      <div><div class="micro red">01 · Ambiguity is visible</div><h1 class="cp-title" style="margin:24px 0 28px">What are we<br>actually deciding?</h1><p class="cp-deck" style="max-width:680px">${esc(DEMO.request)}</p></div>
      <div><span class="cp-chip">Context loaded</span><span class="cp-chip">Decision not justified</span><span class="cp-chip">2 blocking gaps</span></div>
    </section>
    <aside style="position:absolute;right:32px;top:112px;width:35%;bottom:78px;border-left:1px solid var(--line);padding-left:28px;display:grid;grid-template-rows:auto 1fr 1fr 1fr;gap:18px">
      <div class="micro">Current reading</div>
      <div class="folio"><div class="label blue">Known</div><h3>Project truth</h3>${list(DEMO.facts,'cp-note')}</div>
      <div class="folio"><div class="label red">Assumed</div><h3>Not evidence yet</h3>${list(DEMO.assumptions,'cp-note')}</div>
      <div class="folio"><div class="label">Missing</div><h3>What blocks commitment</h3>${list(DEMO.blockers,'cp-note')}</div>
    </aside>`;

  if (moment.id === 'formulation') body += `
    <section style="position:absolute;left:32px;right:32px;top:104px;bottom:68px">
      <div style="display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid var(--ink);padding-bottom:18px"><div><div class="micro red">02 · Competing formulations stay legible</div><h1 class="serif" style="font-size:58px;line-height:.98;font-weight:400;letter-spacing:-.04em;margin:12px 0 0">Three strategies. One unresolved authority question.</h1></div><div class="margin-note" style="width:280px">Recommendation pressure is visible, but dissent and ineligible options are not erased.</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px;margin-top:28px;height:430px">
        ${DEMO.strategies.map((s,i)=>`<article class="folio" style="${s.state==='recommended'?'border-top:3px solid var(--accent2);':''}"><div class="micro">Strategy ${esc(s.id)} · ${esc(s.state)}</div><h3 style="font-size:38px">${esc(s.title)}</h3><p class="cp-note">${esc(s.note)}</p><div class="rule" style="margin:26px 0 15px"></div><div class="label">Decision criteria</div><p class="cp-note" style="margin-top:10px">${i===0?'Reversible · evidence-fit medium · preserves authority':i===1?'Reversible · evidence-fit high · measurable before authority':'Low reversibility · evidence-fit low · approval boundary unresolved'}</p></article>`).join('')}
      </div>
      <div class="settlement" style="display:grid;grid-template-columns:1fr 340px;gap:30px"><div><div class="micro blue">Current settlement</div><strong>${esc(DEMO.decision)}</strong></div><div class="margin-note"><b>Strongest counterpoint</b><br>${esc(DEMO.objection)}</div></div>
    </section>`;

  if (moment.id === 'commitment') body += `
    <section style="position:absolute;left:32px;right:32px;top:108px;bottom:72px;display:grid;grid-template-columns:1.35fr .65fr;gap:42px">
      <div style="display:flex;flex-direction:column;justify-content:space-between"><div><div class="micro red">03 · A recommendation is not authority</div><h1 class="cp-title" style="font-size:86px;margin:20px 0 28px">The decision<br>can be argued.<br><span class="blue">Action must be earned.</span></h1><div class="settlement"><div class="micro">Recommendation</div><strong>${esc(DEMO.decision)}</strong></div></div><div class="margin-note" style="max-width:620px"><b>Strongest objection remains attached:</b> ${esc(DEMO.objection)}</div></div>
      <aside style="border-left:1px solid var(--ink);padding-left:28px;display:flex;flex-direction:column;justify-content:space-between"><div><div class="micro">Authority ledger</div><h2 class="serif" style="font-size:42px;font-weight:400;letter-spacing:-.035em;margin:18px 0 26px">Approval required</h2>${list(DEMO.conditions,'cp-note')}</div><div><div class="rule"></div><div style="display:flex;justify-content:space-between;padding-top:16px"><span class="micro">Routing authority</span><span class="status"><span class="dot"></span>unchanged</span></div><div style="display:flex;justify-content:space-between;padding-top:12px"><span class="micro">Reversibility</span><span class="status">high</span></div></div></aside>
    </section>`;

  if (moment.id === 'verification') body += `
    <section style="position:absolute;left:32px;right:32px;top:110px;bottom:70px">
      <div class="micro red">04 · Execution is not proof</div><h1 class="cp-title" style="font-size:94px;margin:18px 0 34px">Attempted ≠ verified.</h1>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;height:390px">
        <article class="folio"><div class="label">Executed</div><h3>What changed</h3>${list(DEMO.execution,'cp-note')}</article>
        <article class="folio" style="border-top:3px solid var(--accent2)"><div class="label blue">Verified</div><h3>What held</h3>${list(DEMO.verification,'cp-note')}</article>
        <article class="folio"><div class="label red">Remembered</div><h3>What becomes project truth</h3><p class="cp-note">${esc(DEMO.memory)}</p></article>
      </div>
      <div class="settlement"><div class="micro blue">Proof loop</div><strong>Decision lineage remains inspectable after action.</strong></div>
    </section>`;

  if (moment.id === 'mobile') body += `
    <section style="position:absolute;inset:18px 16px 46px;display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--ink);padding-bottom:12px"><b>AI Council</b><span class="micro">Counterpoint</span></div><div class="micro red" style="margin-top:32px">Current decision</div><h1 class="serif" style="font-size:43px;line-height:.98;font-weight:400;letter-spacing:-.04em;margin:12px 0 20px">Shadow routing before authority.</h1><div class="settlement" style="padding:14px 0"><div class="label">Why</div><p style="font:20px/1.25 Georgia,serif;margin:8px 0 0">Evidence can improve without silently becoming permission.</p></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px"><div class="folio"><div class="label blue">Support</div><p class="cp-note">Measurable, reversible, preserves current router.</p></div><div class="folio"><div class="label red">Counterpoint</div><p class="cp-note">Adds temporary complexity and delay.</p></div></div><div style="margin-top:auto;border-top:1px solid var(--ink);padding-top:14px;display:flex;justify-content:space-between;align-items:end"><div><div class="micro">Authority</div><b style="font-size:17px">Approval required</b></div><span class="cp-chip">2 blockers</span></div></section>`;

  return shell({ world, moment, theme, body, extra });
}

function threshold(world, moment) {
  const theme = { bg:'#ddd9d1', ink:'#111411', muted:'#64675f', line:'rgba(17,20,17,.22)', accent:'#b64128', accent2:'#5b6253' };
  const extra = `
    .th-display{font-size:clamp(68px,8vw,122px);line-height:.82;letter-spacing:-.065em;font-weight:700}.th-big{font-size:50px;line-height:.95;letter-spacing:-.045em;font-weight:700}
    .plane{position:absolute;background:#171a17;color:#f1eee7}.edge{position:absolute;background:var(--accent)}.ghost{color:#8a8c85}.th-note{font-size:13px;line-height:1.5}
    .metric{display:flex;justify-content:space-between;border-top:1px solid currentColor;padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:.09em}
    .aperture{border:1px solid currentColor;padding:12px 15px;display:inline-flex;align-items:center;gap:9px;font-size:10px;letter-spacing:.12em;text-transform:uppercase}.aperture:before{content:'';width:8px;height:8px;border-radius:50%;background:var(--accent)}
    .band{position:relative;border-top:1px solid var(--ink);padding:14px 0 12px}.band strong{font-size:24px;letter-spacing:-.025em}.band .meter{position:absolute;left:0;bottom:-1px;height:3px;background:var(--accent)}
  `;
  const top = `<div class="topline"><div class="brand">AI Council</div><div class="topmeta"><span>Threshold</span><span>${esc(moment.label)}</span><span>Governed commitment</span></div></div>`;
  let body = top;

  if (moment.id === 'opening') body += `
    <section style="position:absolute;left:32px;top:110px;width:59%;bottom:70px"><div class="micro">01 · Before the boundary</div><h1 class="th-display" style="margin:22px 0 28px">Not ready<br>to cross.</h1><p style="font-size:23px;line-height:1.28;max-width:690px;margin:0">${esc(DEMO.request)}</p><div style="position:absolute;left:0;bottom:12px;width:440px"><div class="metric"><span>Evidence coverage</span><b>3 / 5</b></div><div class="metric"><span>Hard constraints</span><b>preserved</b></div><div class="metric"><span>Blocking gaps</span><b style="color:var(--accent)">2</b></div></div></section>
    <div class="edge" style="left:64%;top:92px;bottom:0;width:3px"></div><aside class="plane" style="right:0;top:92px;bottom:0;width:36%;padding:56px 38px"><div class="micro" style="color:#aaa79f">Beyond this edge</div><div class="th-big" style="margin-top:28px">Routing<br>authority</div><div style="position:absolute;left:38px;right:38px;bottom:90px"><div class="aperture" style="color:#f1eee7">Closed · evidence missing</div><p class="th-note" style="color:#aaa79f;margin-top:18px">The product shows consequence before it offers control.</p></div></aside>`;

  if (moment.id === 'formulation') body += `
    <section style="position:absolute;left:32px;right:32px;top:112px;bottom:70px;display:grid;grid-template-columns:44% 56%;gap:0"><div style="padding-right:42px"><div class="micro">02 · Evidence approaches the edge</div><h1 class="th-display" style="font-size:88px;margin:22px 0 36px">A strategy<br>must qualify.</h1><p class="th-note" style="max-width:480px">The comparison is spatial: each condition moves the decision closer to or farther from the commitment boundary.</p></div><div style="position:relative;border-left:3px solid var(--accent);padding:8px 0 8px 42px">
      <div class="band"><span class="micro">Evidence</span><br><strong>Problem + strategy logic</strong><span class="meter" style="width:82%"></span></div>
      <div class="band"><span class="micro">Constraint</span><br><strong>Current router remains authoritative</strong><span class="meter" style="width:100%;background:#59644f"></span></div>
      <div class="band"><span class="micro">Unknown</span><br><strong>Reliability benchmark</strong><span class="meter" style="width:38%"></span></div>
      <div style="margin-top:36px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px">${DEMO.strategies.map(s=>`<div style="border:1px solid var(--line);padding:14px;min-height:120px;background:${s.state==='recommended'?'rgba(255,255,255,.35)':'transparent'}"><div class="micro">${esc(s.id)} · ${esc(s.state)}</div><b style="display:block;font-size:17px;margin-top:10px">${esc(s.title)}</b></div>`).join('')}</div>
    </div></section>`;

  if (moment.id === 'commitment') body += `
    <section style="position:absolute;inset:108px 32px 64px"><div style="position:absolute;left:0;top:0;width:46%;bottom:0"><div class="micro">03 · Commitment boundary</div><h1 class="th-display" style="font-size:83px;margin:22px 0 26px">Decision<br>ready.</h1><p style="font-size:21px;line-height:1.35;max-width:520px">${esc(DEMO.decision)}</p></div><div class="edge" style="left:50%;top:-16px;bottom:-20px;width:4px"></div><div style="position:absolute;left:50%;top:43%;transform:translate(-50%,-50%);width:160px;height:160px;border-radius:50%;background:var(--bg);border:4px solid var(--accent);display:flex;align-items:center;justify-content:center;text-align:center;font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:20px">Human<br>approval<br>required</div><aside class="plane" style="position:absolute;right:0;top:0;width:45%;bottom:0;padding:42px"><div class="micro" style="color:#aaa79f">Conditions to cross</div><div style="margin-top:30px">${DEMO.conditions.map((x,i)=>`<div class="metric" style="color:#e6e1d8"><span>${esc(x)}</span><b>${i<3?'✓':'pending'}</b></div>`).join('')}</div><div style="position:absolute;left:42px;bottom:38px"><div class="aperture" style="color:#f1eee7">Authority unchanged</div></div></aside></section>`;

  if (moment.id === 'verification') body += `
    <section style="position:absolute;left:32px;right:32px;top:110px;bottom:70px"><div class="micro">04 · Two boundaries, not one</div><div style="display:grid;grid-template-columns:1fr 70px 1fr 70px 1fr;align-items:stretch;height:570px;margin-top:24px"><div style="padding:32px 28px;background:#171a17;color:#f1eee7"><div class="micro" style="color:#aaa79f">Crossed</div><h2 class="th-big" style="margin:24px 0">Executed</h2>${list(DEMO.execution,'th-note')}</div><div style="position:relative"><div class="edge" style="left:33px;top:0;bottom:0;width:3px"></div><div style="position:absolute;left:15px;top:44%;width:38px;height:38px;border-radius:50%;background:var(--bg);border:3px solid var(--accent)"></div></div><div style="padding:32px 28px;border:1px solid var(--ink)"><div class="micro">Must still cross</div><h2 class="th-big" style="margin:24px 0">Verified</h2>${list(DEMO.verification,'th-note')}</div><div style="position:relative"><div class="edge" style="left:33px;top:0;bottom:0;width:3px;background:#59644f"></div><div style="position:absolute;left:15px;top:44%;width:38px;height:38px;border-radius:50%;background:#59644f"></div></div><div style="padding:32px 28px;background:#eeebe4"><div class="micro">Only then</div><h2 class="th-big" style="margin:24px 0">Remembered</h2><p class="th-note">${esc(DEMO.memory)}</p></div></div></section>`;

  if (moment.id === 'mobile') body += `
    <section style="position:absolute;inset:16px 16px 44px"><div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--ink);padding-bottom:11px"><b>AI Council</b><span class="micro">Threshold</span></div><div class="micro" style="margin-top:30px">Current boundary</div><h1 class="th-display" style="font-size:47px;margin:14px 0 22px">Approval<br>required.</h1><p style="font-size:16px;line-height:1.4;margin:0 0 24px">Shadow routing is recommended. Authority transfer is not.</p><div class="band"><span class="micro">Evidence</span><br><strong style="font-size:18px">3 / 5 satisfied</strong><span class="meter" style="width:70%"></span></div><div class="band"><span class="micro">Hard constraints</span><br><strong style="font-size:18px">Preserved</strong><span class="meter" style="width:100%;background:#59644f"></span></div><div class="band"><span class="micro">Blockers</span><br><strong style="font-size:18px">2 remain</strong><span class="meter" style="width:40%"></span></div><div style="position:absolute;left:0;right:0;bottom:0;border-top:3px solid var(--accent);padding-top:14px;display:flex;justify-content:space-between"><span class="micro">Cannot cross</span><b>Review conditions →</b></div></section>`;

  return shell({ world, moment, theme, body, extra });
}

function decisionSpine(world, moment) {
  const theme = { bg:'#e9eceb', ink:'#202522', muted:'#69706c', line:'rgba(32,37,34,.19)', accent:'#7b3f2b', accent2:'#355d57' };
  const extra = `
    .sp-title{font-family:Georgia,'Times New Roman',serif;font-size:clamp(68px,7.3vw,110px);line-height:.88;letter-spacing:-.055em;font-weight:400}.sp-note{font-size:12px;line-height:1.5;color:#4f5752}
    .spine-h{position:absolute;height:2px;background:var(--ink)}.spine-v{position:absolute;width:2px;background:var(--ink)}.node{position:absolute;width:18px;height:18px;border:2px solid var(--ink);background:var(--bg);transform:rotate(45deg)}.node.active{background:var(--accent2);border-color:var(--accent2)}
    .folio-sp{border:1px solid var(--line);background:rgba(255,255,255,.28);padding:15px 17px;box-shadow:7px 7px 0 rgba(32,37,34,.045)}.folio-sp h3{font:400 25px/1.08 Georgia,serif;margin:8px 0}.tab{display:inline-block;padding:5px 8px;background:#202522;color:#e9eceb;font-size:8px;letter-spacing:.12em;text-transform:uppercase}
    .branch{position:absolute;height:1px;background:var(--muted);transform-origin:left center}.stamp{border:2px solid var(--accent2);padding:8px 10px;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent2);transform:rotate(-2deg)}
  `;
  const top = `<div class="topline"><div class="brand">AI Council</div><div class="topmeta"><span>Decision Spine</span><span>${esc(moment.label)}</span><span>Provenance → consequence</span></div></div>`;
  let body = top;

  if (moment.id === 'opening') body += `
    <section style="position:absolute;left:32px;right:32px;top:110px;bottom:70px"><div class="micro">01 · The request enters a living record</div><h1 class="sp-title" style="font-size:88px;margin:20px 0 18px">A decision has<br>a before and after.</h1><p style="font-size:20px;line-height:1.35;max-width:650px">${esc(DEMO.request)}</p><div class="spine-h" style="left:3%;right:3%;bottom:165px"></div><div class="node" style="left:4%;bottom:157px"></div><div class="node" style="left:31%;bottom:157px"></div><div class="node" style="left:58%;bottom:157px"></div><div class="node" style="left:86%;bottom:157px"></div><div style="position:absolute;left:3%;bottom:102px" class="micro">Request</div><div style="position:absolute;left:29%;bottom:102px" class="micro">Evidence</div><div style="position:absolute;left:55%;bottom:102px" class="micro">Decision</div><div style="position:absolute;left:83%;bottom:102px" class="micro">Consequence</div><div style="position:absolute;left:25%;bottom:195px;width:250px" class="folio-sp"><span class="tab">Open</span><h3>2 blockers</h3><p class="sp-note">Reliability benchmark and shadow comparison are missing.</p></div></section>`;

  if (moment.id === 'formulation') body += `
    <section style="position:absolute;inset:112px 32px 68px"><div class="micro">02 · Alternatives branch, provenance stays attached</div><div class="spine-h" style="left:5%;right:5%;top:48%"></div><div class="node" style="left:9%;top:calc(48% - 8px)"></div><div class="node active" style="left:48%;top:calc(48% - 8px)"></div><div class="node" style="left:87%;top:calc(48% - 8px)"></div><div style="position:absolute;left:7%;top:53%" class="micro">Problem</div><div style="position:absolute;left:45%;top:53%" class="micro">Compare</div><div style="position:absolute;left:84%;top:53%" class="micro">Commit</div>
      ${DEMO.strategies.map((s,i)=>{const left=[22,48,70][i];const top=[10,5,19][i];const rot=[18,-90,155][i];return `<div class="branch" style="left:${left}%;top:48%;width:155px;transform:rotate(${rot}deg)"></div><article class="folio-sp" style="position:absolute;left:${i===0?'4%':i===1?'38%':'70%'};top:${i===0?'5%':i===1?'4%':'12%'};width:260px"><span class="tab" style="background:${s.state==='recommended'?'#355d57':'#202522'}">Strategy ${esc(s.id)} · ${esc(s.state)}</span><h3>${esc(s.title)}</h3><p class="sp-note">${esc(s.note)}</p></article>`}).join('')}
      <div class="folio-sp" style="position:absolute;left:38%;bottom:3%;width:430px"><div class="micro">Decision criteria ledger</div><h3>Evidence fit · reversibility · authority boundary</h3><p class="sp-note">The current recommendation can be traced back to criteria rather than model confidence alone.</p></div>
    </section>`;

  if (moment.id === 'commitment') body += `
    <section style="position:absolute;inset:112px 32px 68px"><div class="micro">03 · Commitment becomes a durable anchor</div><div class="spine-h" style="left:2%;right:2%;top:53%"></div><div class="node" style="left:10%;top:calc(53% - 8px)"></div><div class="node" style="left:27%;top:calc(53% - 8px)"></div><div class="node active" style="left:50%;top:calc(53% - 8px);width:28px;height:28px;top:calc(53% - 13px)"></div><div class="node" style="left:73%;top:calc(53% - 8px)"></div><div class="node" style="left:90%;top:calc(53% - 8px)"></div><div style="position:absolute;left:34%;top:9%;width:520px;text-align:center"><div class="micro">Current decision</div><h1 class="serif" style="font-size:53px;line-height:1.02;font-weight:400;letter-spacing:-.045em;margin:16px 0">${esc(DEMO.decision)}</h1><div class="stamp" style="display:inline-block;margin-top:10px">Approval required</div></div><div class="folio-sp" style="position:absolute;left:4%;bottom:5%;width:360px"><div class="micro">Backward</div><h3>Why this exists</h3><p class="sp-note">Evidence gaps, rejected authority transfer, and preserved constraints remain available.</p></div><div class="folio-sp" style="position:absolute;right:4%;bottom:5%;width:360px"><div class="micro">Forward</div><h3>What it may cause</h3><p class="sp-note">Shadow instrumentation, comparison evidence, then a later authority decision.</p></div></section>`;

  if (moment.id === 'verification') body += `
    <section style="position:absolute;inset:112px 32px 70px"><div class="micro">04 · Consequence extends the same spine</div><div class="spine-h" style="left:3%;right:3%;top:45%"></div>${['Decision','Approved','Executed','Verified','Remembered'].map((x,i)=>`<div class="node ${i===3?'active':''}" style="left:${8+i*21}%;top:calc(45% - ${i===3?'13':'8'}px);${i===3?'width:28px;height:28px;':''}"></div><div style="position:absolute;left:${5+i*21}%;top:50%;width:120px;text-align:center" class="micro">${x}</div>`).join('')}<div class="folio-sp" style="position:absolute;left:31%;top:6%;width:310px"><span class="tab">Execution report</span><h3>Attempt recorded</h3><p class="sp-note">${esc(DEMO.execution[0])}</p></div><div class="folio-sp" style="position:absolute;left:58%;bottom:5%;width:330px"><span class="tab" style="background:#355d57">Verification</span><h3>Authority invariant held</h3><p class="sp-note">${esc(DEMO.verification[1])}</p></div><div style="position:absolute;right:3%;top:6%;width:260px"><div class="stamp">Evidence-backed memory only</div><p class="sp-note" style="margin-top:15px">${esc(DEMO.memory)}</p></div></section>`;

  if (moment.id === 'mobile') body += `
    <section style="position:absolute;inset:16px 14px 42px"><div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--ink);padding-bottom:11px"><b>AI Council</b><span class="micro">Decision Spine</span></div><div class="spine-v" style="left:22px;top:72px;bottom:42px"></div><div class="node" style="left:14px;top:94px"></div><div class="node active" style="left:9px;top:285px;width:28px;height:28px"></div><div class="node" style="left:14px;top:553px"></div><div style="margin-left:54px;padding-top:42px"><div class="micro">Before · 2 blockers</div><div class="folio-sp" style="margin-top:10px"><h3 style="font-size:20px">Evidence incomplete</h3><p class="sp-note">Reliability benchmark + shadow comparison.</p></div><div class="micro" style="margin-top:58px">Current decision</div><h1 class="serif" style="font-size:36px;line-height:1;font-weight:400;letter-spacing:-.04em;margin:10px 0">Shadow routing first.</h1><div class="stamp" style="display:inline-block">Approval required</div><div class="micro" style="margin-top:76px">Forward</div><div class="folio-sp" style="margin-top:10px"><h3 style="font-size:20px">Next consequence</h3><p class="sp-note">Instrument comparison. Preserve current routing authority.</p></div></div></section>`;

  return shell({ world, moment, theme, body, extra });
}

function frameHtml(world, moment) {
  if (world.id === 'counterpoint') return counterpoint(world, moment);
  if (world.id === 'threshold') return threshold(world, moment);
  if (world.id === 'decision-spine') return decisionSpine(world, moment);
  throw new Error(`No renderer for Creative World: ${world.id}`);
}

function rel(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}

async function renderHtml(browser, html, { width, height, output }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: output, type: 'png', fullPage: false });
  await page.close();
}

async function dataUri(file) {
  return `data:image/png;base64,${(await fs.readFile(file)).toString('base64')}`;
}

function boardShell(title, subtitle, body, { width = 1800, height = 1120 } = {}) {
  return { width, height, html: `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#121412;color:#ece9e2;font-family:Arial,Helvetica,sans-serif}.board{padding:34px;width:100vw;height:100vh}.head{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid #404440;padding-bottom:18px;margin-bottom:22px}h1{font:400 40px/1 Georgia,serif;margin:0;letter-spacing:-.035em}.sub{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#999f99}.grid{display:grid;gap:18px}.tile{background:#20231f;border:1px solid #343834;padding:10px}.tile img{display:block;width:100%;height:auto}.tile-label{display:flex;justify-content:space-between;gap:16px;margin-bottom:9px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#b4b9b3}.truth{position:absolute;right:34px;bottom:20px;font-size:8px;letter-spacing:.11em;text-transform:uppercase;color:#777d77}</style></head><body><main class="board"><div class="head"><div><h1>${esc(title)}</h1><div class="sub" style="margin-top:9px">${esc(subtitle)}</div></div><div class="sub">AI Studio OS · exact Chromium proof</div></div>${body}<div class="truth">No world selected · proxy typography · scenario data</div></main></body></html>` };
}

const browser = await chromium.launch({ headless: true });
const renderedFrames = [];

try {
  for (const frame of plan.frames) {
    const world = exploration.worlds.find((item) => item.id === frame.worldId);
    const moment = plan.moments.find((item) => item.id === frame.momentId);
    if (!world || !moment) throw new Error(`Missing world/moment for ${frame.id}`);
    const html = frameHtml(world, moment);
    const sourceFile = path.join(sourceRoot, `${frame.id}.html`);
    const imageFile = path.join(framesRoot, `${frame.id}.png`);
    await fs.writeFile(sourceFile, html, 'utf8');
    await renderHtml(browser, html, { width: frame.width, height: frame.height, output: imageFile });
    renderedFrames.push({ frameId: frame.id, worldId: frame.worldId, momentId: frame.momentId, imageRef: rel(imageFile), sourceRef: rel(sourceFile) });
  }

  const comparisonRefs = [];
  for (const moment of plan.moments) {
    const items = [];
    for (const world of exploration.worlds) {
      const imageFile = path.join(framesRoot, `${world.id}-${moment.id}.png`);
      items.push({ world, src: await dataUri(imageFile) });
    }
    const isMobile = moment.viewport === 'mobile';
    const body = `<div class="grid" style="grid-template-columns:repeat(3,1fr);align-items:start">${items.map(({world,src})=>`<div class="tile"><div class="tile-label"><b>${esc(world.label)}</b><span>${esc(world.worldClass)}</span></div><img src="${src}" style="${isMobile?'max-height:830px;object-fit:contain;background:#0d0f0d':'width:100%'}"></div>`).join('')}</div>`;
    const board = boardShell(moment.label, moment.productState, body, { width: 1920, height: isMobile ? 1160 : 760 });
    const out = path.join(compareRoot, `${moment.id}-comparison.png`);
    await renderHtml(browser, board.html, { width: board.width, height: board.height, output: out });
    comparisonRefs.push(rel(out));
  }

  const overviewRefs = [];
  for (const world of exploration.worlds) {
    const tiles = [];
    for (const moment of plan.moments) {
      tiles.push({ moment, src: await dataUri(path.join(framesRoot, `${world.id}-${moment.id}.png`)) });
    }
    const body = `<div class="grid" style="grid-template-columns:1fr 1fr 360px;grid-auto-rows:minmax(0,1fr)">${tiles.map(({moment,src},i)=>`<div class="tile" style="${moment.viewport==='mobile'?'grid-column:3;grid-row:1 / span 2':''}"><div class="tile-label"><b>${esc(moment.label)}</b><span>${esc(moment.viewport)}</span></div><img src="${src}" style="${moment.viewport==='mobile'?'height:820px;object-fit:contain':'width:100%'}"></div>`).join('')}</div>`;
    const board = boardShell(`${world.label} · world overview`, world.worldIdea, body, { width: 1920, height: 1220 });
    const out = path.join(overviewRoot, `${world.id}-overview.png`);
    await renderHtml(browser, board.html, { width: board.width, height: board.height, output: out });
    overviewRefs.push(rel(out));
  }

  const visualProof = buildVisualProofEvidence({ plan, renderedFrames, comparisonRefs });
  if (!visualProof.reviewReady) throw new Error(`Rendered visual proof is incomplete: ${(visualProof.findings ?? []).map((item) => item.code).join(', ')}`);

  const manifest = {
    schema: 'ai-studio-os/ai-council-style-frame-proof-manifest@2',
    projectId: 'ai-council',
    generatedAt: new Date().toISOString(),
    plan: {
      schema: plan.schema,
      status: plan.status,
      worldIds: exploration.worlds.map((world) => world.id),
      momentIds: plan.moments.map((moment) => moment.id),
      frameCount: plan.frames.length
    },
    renderedFrames,
    comparisonRefs,
    overviewRefs,
    visualProof,
    selection: null,
    truth: {
      exactBrowserRaster: true,
      scenarioDataNotRepositoryState: true,
      humanVisualApproval: false,
      humanWorldSelectionConfirmed: false,
      selectedAutomatically: false,
      typographyApproved: false,
      productionTechnologyApproved: false
    }
  };
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`AI Council Style Frame Proof V2: ${renderedFrames.length} frames, ${comparisonRefs.length} comparisons, ${overviewRefs.length} world overviews.`);
  console.log(`Manifest: ${rel(path.join(outputRoot, 'manifest.json'))}`);
} finally {
  await browser.close();
}
