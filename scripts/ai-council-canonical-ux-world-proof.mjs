import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildInterfaceWorldProofPlan, buildInterfaceWorldProofEvidence } from '../modules/interface-world-proof/runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'canonical-interface-world-proof-v1');
const framesRoot = path.join(outputRoot, 'frames');
const sourceRoot = path.join(outputRoot, 'source-html');
const comparisonRoot = path.join(outputRoot, 'comparisons');
const overviewRoot = path.join(outputRoot, 'world-overviews');

const architectureInput = JSON.parse(await fs.readFile(path.join(projectRoot, 'product-ux-architecture.json'), 'utf8'));
const architecture = buildProductUXArchitecture(architectureInput);
const exploration = JSON.parse(await fs.readFile(path.join(projectRoot, 'creative-worlds.json'), 'utf8'));
const plan = buildInterfaceWorldProofPlan({ architecture, exploration });

if (!plan.reviewReady) throw new Error(`Canonical interface world proof is not ready: ${plan.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [framesRoot, sourceRoot, comparisonRoot, overviewRoot]) await fs.mkdir(dir, { recursive: true });

const SCENARIO = {
  project: 'AI Council',
  currentFocus: 'Cognitive Reliability Benchmark',
  phase: 'Cognitive Core hardening',
  conversation: 'UI / UX',
  userQuestion: 'Should we rewrite AI Council in Python?',
  answer: 'Keep the current TypeScript control plane. The strongest risks are decision quality, evidence discipline, and authority boundaries—not language capability.',
  nextAction: 'Finish reliability benchmarking before changing routing authority.',
  currentDecision: 'Keep TypeScript as AI Council control plane',
  decisionDate: '23 Aug 2026',
  alternatives: ['Rewrite in Python', 'Hybrid TypeScript / Python', 'Go control plane', 'Rust control plane'],
  evidence: ['Current architecture', 'Runtime contracts', 'Migration cost analysis'],
  recent: ['Reliability benchmark updated', 'Problem Formulation + Strategy Comparison merged', 'Routing authority remains unchanged'],
  conversations: ['Cognitive Reliability', 'Routing Intelligence', 'Memory Architecture', 'UI / UX'],
  memory: [
    ['Decision', 'Use TypeScript as control plane', 'Confirmed · 23 Aug'],
    ['Constraint', 'Routing remains advisory until reliability benchmark passes', 'Confirmed'],
    ['Question', 'When should routing become authoritative?', 'Open']
  ]
};

const WORLDS = {
  counterpoint: {
    label: 'Counterpoint',
    theme: { bg:'#f2eee7', surface:'#faf8f4', ink:'#171512', muted:'#726a62', line:'rgba(23,21,18,.20)', accent:'#a4382c', accent2:'#173d67' },
    display: "Georgia, 'Times New Roman', serif",
    body: "Arial, Helvetica, sans-serif"
  },
  threshold: {
    label: 'Threshold',
    theme: { bg:'#e9e5dd', surface:'#f7f4ed', ink:'#181816', muted:'#706d66', line:'rgba(24,24,22,.22)', accent:'#e05a2a', accent2:'#394139' },
    display: "Arial, Helvetica, sans-serif",
    body: "Arial, Helvetica, sans-serif"
  },
  'decision-spine': {
    label: 'Decision Spine',
    theme: { bg:'#edf0ec', surface:'#f8faf7', ink:'#172019', muted:'#667067', line:'rgba(23,32,25,.18)', accent:'#2d6650', accent2:'#5d4c78' },
    display: "Georgia, 'Times New Roman', serif",
    body: "Arial, Helvetica, sans-serif"
  }
};

const SCREEN_LABELS = Object.fromEntries(architecture.screens.map((screen) => [screen.id, screen.label]));

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function commonCss(world) {
  const t = world.theme;
  return `
    :root{--bg:${t.bg};--surface:${t.surface};--ink:${t.ink};--muted:${t.muted};--line:${t.line};--accent:${t.accent};--accent2:${t.accent2};--display:${world.display};--body:${world.body}}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--bg);color:var(--ink)}body{font-family:var(--body);-webkit-font-smoothing:antialiased}
    .app{width:100vw;height:100vh;position:relative;background:var(--bg);overflow:hidden}.brand{font-weight:800;letter-spacing:-.025em}.micro{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}.small{font-size:11px;line-height:1.5}.bodycopy{font-size:14px;line-height:1.55}.display{font-family:var(--display);font-weight:400;letter-spacing:-.045em}.muted{color:var(--muted)}
    .pill{display:inline-block;border:1px solid var(--line);padding:5px 8px;font-size:9px;letter-spacing:.06em;text-transform:uppercase}.button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--ink);padding:10px 13px;font-size:10px;letter-spacing:.05em;text-transform:uppercase;background:transparent}.button.primary{background:var(--ink);color:var(--bg)}.rule{height:1px;background:var(--line)}
    .proof{position:absolute;right:13px;bottom:9px;z-index:90;font-size:7px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:color-mix(in srgb,var(--bg) 88%,transparent);padding:4px 6px;border:1px solid var(--line)}
    .composer{position:absolute;bottom:18px;border:1px solid var(--line);background:var(--surface);height:58px;display:flex;align-items:center;padding:0 14px;font-size:12px;color:var(--muted);z-index:30}.send{margin-left:auto;width:29px;height:29px;display:grid;place-items:center;background:var(--ink);color:var(--bg)}
    ul.clean{list-style:none;margin:0;padding:0}.clean li{padding:7px 0;border-top:1px solid var(--line);font-size:11px;line-height:1.35}.clean li:first-child{border-top:0}
    .worldmark{position:absolute;z-index:60;font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
  `;
}

const COUNTERPOINT_CSS = `
  .shell{display:grid;grid-template-columns:212px minmax(0,1fr) 286px;height:100%}.side{border-right:1px solid var(--line);padding:22px 18px;background:color-mix(in srgb,var(--surface) 55%,transparent)}.side .brand{font-family:var(--display);font-size:19px;font-weight:400;margin-bottom:28px}.side h6{margin:20px 0 8px;font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:var(--accent)}.nav{font-size:11px;padding:7px 0;border-bottom:1px solid transparent}.nav.active{border-bottom-color:var(--ink);font-family:var(--display);font-size:13px}.main{position:relative;min-width:0}.top{height:66px;border-bottom:1px solid var(--ink);margin:0 28px;display:flex;align-items:center;justify-content:space-between}.top .path{font-family:var(--display);font-size:14px}.center{position:absolute;inset:66px 0 0;overflow:hidden}.context{border-left:1px solid var(--ink);padding:22px 20px;background:color-mix(in srgb,var(--surface) 62%,transparent)}.context .tabrow{display:flex;gap:14px;font-size:8px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid var(--line);padding-bottom:10px}.context .tabrow b{color:var(--accent)}
  .cp-title{font-family:var(--display);font-size:56px;line-height:.92;font-weight:400;letter-spacing:-.055em}.cp-folio{border-top:1px solid var(--ink);padding-top:11px}.cp-folio.accent{border-top:3px solid var(--accent)}.cp-folio.blue{border-top:3px solid var(--accent2)}.cp-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:28px}.cp-three{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.cp-note{border-left:2px solid var(--accent);padding-left:11px;font-size:11px;line-height:1.45}.cp-settle{border-top:2px solid var(--ink);border-bottom:1px solid var(--ink);padding:15px 0}.composer{left:50%;transform:translateX(-50%);width:min(720px,calc(100% - 56px));border-radius:0}.worldmark{left:238px;bottom:10px}
`;

const THRESHOLD_CSS = `
  .shell{display:grid;grid-template-columns:154px minmax(0,1fr) 260px;height:100%}.side{background:var(--ink);color:var(--bg);padding:20px 13px;position:relative}.side .brand{font-size:14px;margin:3px 6px 32px}.side h6{font-size:7px;letter-spacing:.13em;text-transform:uppercase;color:color-mix(in srgb,var(--bg) 55%,transparent);margin:22px 6px 9px}.nav{font-size:9px;padding:8px 6px;border-left:1px solid transparent}.nav.active{border-left:4px solid var(--accent);background:rgba(255,255,255,.08)}.main{position:relative;min-width:0}.top{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-bottom:1px solid var(--line)}.top .path{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.center{position:absolute;inset:58px 0 0;overflow:hidden}.context{border-left:1px solid var(--ink);padding:20px 16px;background:var(--surface)}.context .tabrow{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:18px}.context .tabrow span{background:var(--surface);padding:8px;font-size:8px;text-transform:uppercase}.context .tabrow b{background:var(--ink);color:var(--bg);padding:8px;font-size:8px;text-transform:uppercase}
  .th-title{font-size:68px;line-height:.86;font-weight:800;letter-spacing:-.065em;text-transform:uppercase}.th-boundary{border-top:5px solid var(--ink);position:relative;padding-top:18px}.th-boundary:before{content:'BOUNDARY';position:absolute;right:0;top:-16px;background:var(--ink);color:var(--bg);font-size:7px;letter-spacing:.15em;padding:4px 6px}.th-panel{border:1px solid var(--ink);padding:16px;background:transparent}.th-panel.signal{border-top:7px solid var(--accent)}.th-panel.verified{border-top:7px solid var(--accent2)}.th-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.th-three{display:grid;grid-template-columns:.75fr 1.4fr .85fr;gap:12px}.th-status{font-size:10px;text-transform:uppercase;letter-spacing:.08em;display:flex;justify-content:space-between;padding:9px 0;border-top:1px solid var(--line)}.composer{left:24px;right:24px;width:auto;border-radius:0;border-width:1px 1px 5px}.worldmark{left:178px;bottom:10px}
`;

const SPINE_CSS = `
  .shell{display:grid;grid-template-columns:196px minmax(0,1fr) 278px;height:100%}.side{padding:20px 15px;background:var(--surface);border-right:1px solid var(--line)}.side .brand{font-family:var(--display);font-size:17px;font-weight:400;margin:4px 5px 27px}.side h6{font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin:20px 5px 8px}.nav{font-size:10px;padding:8px 6px;position:relative}.nav.active:before{content:'';position:absolute;left:-15px;top:4px;bottom:4px;width:3px;background:var(--accent)}.nav.active{font-weight:700}.main{position:relative;min-width:0}.top{height:62px;margin:0 24px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}.top .path{font-family:var(--display);font-size:13px}.center{position:absolute;inset:62px 0 0;overflow:hidden}.context{border-left:1px solid var(--line);background:color-mix(in srgb,var(--surface) 74%,transparent);padding:20px}.context .tabrow{display:flex;gap:12px;font-size:8px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px}.context .tabrow b{color:var(--accent);border-bottom:2px solid var(--accent);padding-bottom:6px}
  .sp-title{font-family:var(--display);font-size:58px;line-height:.92;font-weight:400;letter-spacing:-.05em}.sp-zone{position:relative;padding-left:34px}.sp-zone:before{content:'';position:absolute;left:12px;top:0;bottom:0;width:2px;background:var(--accent)}.sp-node{position:relative;padding:13px 14px 13px 18px;border:1px solid var(--line);background:var(--surface);margin-bottom:10px}.sp-node:before{content:'';position:absolute;left:-27px;top:20px;width:12px;height:12px;border:2px solid var(--accent);background:var(--bg);border-radius:50%}.sp-node.current{border-left:5px solid var(--accent);box-shadow:7px 7px 0 color-mix(in srgb,var(--accent) 12%,transparent)}.sp-node.branch{margin-left:38px;border-left:3px solid var(--accent2)}.sp-grid{display:grid;grid-template-columns:1fr .9fr;gap:24px}.sp-three{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.version{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.composer{left:50%;transform:translateX(-50%);width:min(700px,calc(100% - 54px));border-radius:12px}.worldmark{left:220px;bottom:10px}
`;

function worldCss(worldId) {
  if (worldId === 'counterpoint') return COUNTERPOINT_CSS;
  if (worldId === 'threshold') return THRESHOLD_CSS;
  return SPINE_CSS;
}

function side(worldId, active = 'UI / UX') {
  const projects = ['AI Council','AI Studio OS','SignalScout'];
  const conversations = ['Cognitive Reliability','Routing Intelligence','Memory Architecture','UI / UX'];
  return `<aside class="side"><div class="brand">AI Council</div><div class="button" style="width:100%;margin-bottom:7px">＋ New conversation</div><div class="button" style="width:100%">＋ New project</div><h6>Projects</h6>${projects.map((x,i)=>`<div class="nav ${i===0?'active':''}">${x}</div>`).join('')}<h6>Conversations</h6>${conversations.map((x)=>`<div class="nav ${x===active?'active':''}">${x}</div>`).join('')}<div style="position:absolute;left:14px;right:14px;bottom:22px"><h6>Global</h6>${['Projects','Activity','Approvals','Library','Settings'].map((x)=>`<div class="nav">${x}</div>`).join('')}</div></aside>`;
}

function top(worldId, label) {
  return `<div class="top"><div class="path"><b>AI Council</b> &nbsp;/&nbsp; ${esc(label)}</div><div class="micro">Project active · Council ready</div></div>`;
}

function context(worldId, active='Context') {
  const tabs = ['Context','Project','Evidence','Actions'];
  return `<aside class="context"><div class="tabrow">${tabs.map((x)=>x===active?`<b>${x}</b>`:`<span>${x}</span>`).join('')}</div><div class="micro">Current context</div><h3 style="font-family:var(--display);font-size:18px;font-weight:400;margin:8px 0">UI / UX product structure</h3><p class="small">Goal: freeze product UX before high-fidelity visual direction.</p><div class="rule" style="margin:16px 0"></div><div class="micro">Using</div><ul class="clean"><li>Product UX Architecture</li><li>Product Understanding</li><li>Current decisions</li><li>Project memory constraints</li></ul><div class="rule" style="margin:16px 0"></div><div class="small"><b>Authority</b><span style="float:right">Advisory</span></div></aside>`;
}

function shell(worldId, screenId, center, { showContext=true, active='UI / UX' }={}) {
  const world = WORLDS[worldId];
  const label = SCREEN_LABELS[screenId] ?? screenId;
  const cols = showContext ? '' : `<style>.shell{grid-template-columns:${worldId==='threshold'?'154px':'196px'} minmax(0,1fr)!important}.context{display:none}</style>`;
  return `<div class="app ${worldId}">${cols}<div class="shell">${side(worldId,active)}<main class="main">${top(worldId,label)}<section class="center">${center}</section></main>${showContext?context(worldId,screenId==='evidence-context'?'Evidence':'Context'):''}</div><div class="worldmark">${esc(world.label)} · canonical UX proof</div><div class="proof">Same frozen IA · proxy type · scenario content · no selection</div></div>`;
}

function projectHome(worldId) {
  if (worldId === 'counterpoint') return shell(worldId,'project-home',`<div style="padding:34px 32px;height:100%"><div class="micro" style="color:var(--accent)">Project home · current state</div><div class="cp-grid" style="margin-top:12px"><div><h1 class="cp-title" style="margin:0 0 14px">Where the project<br>actually stands.</h1><p class="bodycopy" style="max-width:620px">${SCENARIO.project} is in ${SCENARIO.phase}. The current focus is ${SCENARIO.currentFocus}.</p><div class="cp-settle" style="margin-top:22px"><div class="micro">Continue</div><h2 class="display" style="font-size:30px;margin:7px 0">${SCENARIO.currentFocus}</h2><span class="button primary">Continue current work</span></div></div><div class="cp-folio blue"><div class="micro" style="color:var(--accent2)">Since your last session</div><ul class="clean">${SCENARIO.recent.map(x=>`<li>${x}</li>`).join('')}</ul></div></div><div class="cp-three" style="margin-top:26px"><div class="cp-folio accent"><div class="micro">Suggested next</div><ol class="small" style="padding-left:16px;line-height:1.8"><li>Review benchmark threshold</li><li>Resolve reliability question</li><li>Decide routing entry gate</li></ol></div><div class="cp-folio"><div class="micro">Active conversations</div><ul class="clean">${SCENARIO.conversations.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="cp-folio"><div class="micro">State</div><div class="small" style="margin-top:12px">3 active tasks<br>12 decisions<br>2 open questions<br>0 blockers</div></div></div></div>`,{showContext:false,active:''});
  if (worldId === 'threshold') return shell(worldId,'project-home',`<div style="padding:28px 26px;height:100%"><div class="micro">Project home</div><div style="display:grid;grid-template-columns:1.2fr .8fr;gap:26px;margin-top:15px"><div><h1 class="th-title" style="margin:0">Current<br>focus.</h1><div class="th-boundary" style="margin-top:30px"><div class="micro">Inside active work</div><h2 style="font-size:28px;margin:8px 0 14px">${SCENARIO.currentFocus}</h2><span class="button primary">Continue current work</span></div></div><div class="th-panel signal"><div class="micro">Changed since last session</div><ul class="clean" style="margin-top:12px">${SCENARIO.recent.map(x=>`<li>${x}</li>`).join('')}</ul></div></div><div class="th-three" style="margin-top:30px"><div class="th-panel"><div class="micro">Tasks</div><div style="font-size:48px;font-weight:800;margin-top:12px">03</div><div class="small">active</div></div><div class="th-panel"><div class="micro">Next boundary</div><h3 style="font-size:22px;margin:16px 0">Decide routing-intelligence entry gate</h3><div class="th-status"><span>Evidence</span><b>pending review</b></div><div class="th-status"><span>Authority</span><b>unchanged</b></div></div><div class="th-panel verified"><div class="micro">Project</div><h3 style="font-size:20px;margin:16px 0">${SCENARIO.phase}</h3><div class="small">No current blockers.</div></div></div></div>`,{showContext:false,active:''});
  return shell(worldId,'project-home',`<div style="padding:30px 30px;height:100%"><div class="micro">Project home · decision continuity</div><div class="sp-grid" style="margin-top:14px"><div><h1 class="sp-title" style="margin:0 0 22px">Resume from the<br>decision spine.</h1><div class="sp-zone"><div class="sp-node"><div class="version">Previous session</div><b>${SCENARIO.recent[1]}</b></div><div class="sp-node current"><div class="version">Current focus</div><h3 style="font-family:var(--display);font-size:24px;font-weight:400;margin:6px 0 12px">${SCENARIO.currentFocus}</h3><span class="button primary">Continue current work</span></div><div class="sp-node branch"><div class="version">Next branch</div><b>Routing Intelligence entry gate</b></div></div></div><div><div class="sp-node"><div class="version">Project state</div><div class="small" style="margin-top:10px">3 active tasks · 12 decisions · 2 questions · 0 blockers</div></div><div class="sp-node"><div class="version">Active conversations</div><ul class="clean">${SCENARIO.conversations.map(x=>`<li>${x}</li>`).join('')}</ul></div></div></div></div>`,{showContext:false,active:''});
}

function conversation(worldId, structured=false) {
  const response = structured ? `<div class="micro" style="color:var(--accent)">Recommendation</div><h2 class="display" style="font-size:${worldId==='threshold'?'28px':'27px'};margin:8px 0 12px">Keep the current TypeScript control plane.</h2><p class="bodycopy">The strongest risks are decision quality, evidence discipline, and authority boundaries—not language capability.</p><div class="${worldId==='counterpoint'?'cp-three':worldId==='threshold'?'th-grid':'sp-three'}" style="margin-top:18px"><div class="${worldId==='counterpoint'?'cp-folio blue':worldId==='threshold'?'th-panel verified':'sp-node'}"><div class="micro">Why</div><p class="small">Current architecture benefits more from contract consistency than a rewrite.</p></div><div class="${worldId==='counterpoint'?'cp-folio accent':worldId==='threshold'?'th-panel signal':'sp-node branch'}"><div class="micro">Next</div><p class="small">${SCENARIO.nextAction}</p></div>${worldId==='counterpoint'?'<div class="cp-folio"><div class="micro">Inspect</div><span class="pill">Evidence</span> <span class="pill">Alternatives</span></div>':''}</div>` : `<p class="bodycopy">${SCENARIO.answer}</p><div style="margin-top:12px"><span class="pill">Evidence available</span> <span class="pill">3 specialists consulted</span></div>`;
  const msgClass = worldId==='counterpoint'?'cp-folio':worldId==='threshold'?'th-panel':'sp-node current';
  const content = `<div style="max-width:${worldId==='threshold'?'850':'760'}px;margin:0 auto;padding:34px 24px 100px"><div style="text-align:right;margin:12px 0 28px"><div class="micro">You</div><div style="display:inline-block;max-width:620px;padding:12px 15px;border:1px solid var(--line);background:var(--surface);font-size:13px">${SCENARIO.userQuestion}</div></div><div class="${msgClass}"><div class="micro">AI Council</div>${response}</div></div><div class="composer"><span>Ask AI Council…</span><div class="send">↑</div></div>`;
  return shell(worldId,structured?'structured-response':'conversation',content,{showContext:true});
}

function evidenceContext(worldId) {
  const center = `<div style="max-width:760px;margin:0 auto;padding:38px 28px 100px"><div style="text-align:right"><div class="micro">You</div><div style="display:inline-block;border:1px solid var(--line);background:var(--surface);padding:12px 14px;font-size:13px">Why keep TypeScript?</div></div><div class="${worldId==='counterpoint'?'cp-folio blue':worldId==='threshold'?'th-boundary':'sp-node current'}" style="margin-top:28px"><div class="micro">AI Council</div><p class="bodycopy">Because the current evidence points to reasoning and governance reliability as the bottleneck, not language capability.</p><div style="margin-top:14px"><span class="pill">3 evidence sources</span> <span class="pill">2 constraints</span></div></div></div><div class="composer"><span>Ask AI Council…</span><div class="send">↑</div></div>`;
  return shell(worldId,'evidence-context',center,{showContext:true});
}

function approval(worldId) {
  let center;
  if (worldId==='counterpoint') center=`<div style="padding:34px 38px"><div class="micro" style="color:var(--accent)">Approval required · advice ends here</div><h1 class="cp-title" style="font-size:50px;margin:10px 0 24px">Create branch<br><span style="font-family:var(--body);font-size:28px">feat/routing-intelligence-v1</span></h1><div class="cp-grid"><div class="cp-folio"><div class="micro">What changes</div><ul class="clean"><li>Create one Git branch</li><li>Prepare routing implementation slice</li><li>Estimated 12 files affected</li></ul></div><div class="cp-folio accent"><div class="micro">Governance</div><p class="small">Medium risk · reversible · no production impact yet.</p></div></div><div class="cp-settle" style="margin-top:24px"><div class="cp-note">Council proposes this because implementation can begin reversibly while current routing remains authoritative.</div><div style="margin-top:16px"><span class="button">Review plan</span> <span class="button">Modify</span> <span class="button">Reject</span> <span class="button primary">Approve</span></div></div></div>`;
  else if (worldId==='threshold') center=`<div style="padding:30px 30px"><div class="micro">Approval boundary</div><h1 class="th-title" style="font-size:62px;margin:12px 0 26px">Action<br>withheld.</h1><div class="th-boundary"><div class="th-three"><div class="th-panel"><div class="micro">Scope</div><h3>Create branch</h3><p class="small">feat/routing-intelligence-v1<br>12 files estimated</p></div><div class="th-panel signal"><div class="micro">Why boundary is closed</div><div class="th-status"><span>Risk</span><b>Medium</b></div><div class="th-status"><span>Reversible</span><b>Yes</b></div><div class="th-status"><span>Human authority</span><b>Required</b></div></div><div class="th-panel"><div class="micro">Rollback</div><p class="small">Delete branch. No mainline state changes.</p></div></div><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:22px"><span class="button">Review plan</span><span class="button">Reject</span><span class="button primary">Approve crossing</span></div></div></div>`;
  else center=`<div style="padding:32px 34px"><div class="micro">Approval · decision consequence</div><h1 class="sp-title" style="font-size:52px;margin:10px 0 24px">The decision is ready<br>to create a consequence.</h1><div class="sp-zone" style="max-width:800px"><div class="sp-node"><div class="version">Decision</div><b>Begin Routing Intelligence implementation</b></div><div class="sp-node current"><div class="version">Proposed consequence</div><h3>Create branch feat/routing-intelligence-v1</h3><p class="small">12 files estimated · medium risk · reversible.</p></div><div class="sp-node branch"><div class="version">Rollback lineage</div><b>Delete branch; no mainline state changed</b></div><div class="sp-node"><div class="version">Authority</div><div style="margin-top:10px"><span class="button">Review plan</span> <span class="button">Reject</span> <span class="button primary">Approve</span></div></div></div></div>`;
  return shell(worldId,'approval',center,{showContext:false});
}

function decisionDetail(worldId) {
  let center;
  if(worldId==='counterpoint') center=`<div style="padding:32px 36px"><div class="micro" style="color:var(--accent)">Decision · active · ${SCENARIO.decisionDate}</div><h1 class="cp-title" style="font-size:54px;margin:12px 0 22px">${SCENARIO.currentDecision}</h1><div class="cp-grid"><div><div class="cp-folio blue"><div class="micro">Rationale</div><p class="bodycopy">Contract consistency, orchestration fit, and migration cost outweigh the speculative benefit of a rewrite.</p></div><div class="cp-folio accent" style="margin-top:18px"><div class="micro">Alternatives considered</div><ul class="clean">${SCENARIO.alternatives.map(x=>`<li>${x}<span style="float:right">rejected</span></li>`).join('')}</ul></div></div><div><div class="cp-folio"><div class="micro">Evidence</div><ul class="clean">${SCENARIO.evidence.map(x=>`<li>${x} <span style="float:right">Open ›</span></li>`).join('')}</ul></div><div class="cp-note" style="margin-top:20px">Remaining uncertainty: future ML-heavy services may justify bounded Python services.</div></div></div></div>`;
  else if(worldId==='threshold') center=`<div style="padding:28px 30px"><div class="micro">Decision state · active</div><h1 class="th-title" style="font-size:58px;margin:12px 0 24px">TypeScript<br>remains<br>authority.</h1><div class="th-boundary"><div class="th-grid"><div class="th-panel verified"><div class="micro">Why it crossed</div><p class="bodycopy">Contract consistency, orchestration fit, and migration cost outweigh a speculative rewrite.</p><div class="th-status"><span>Confidence</span><b>High</b></div><div class="th-status"><span>Status</span><b>Active</b></div></div><div class="th-panel"><div class="micro">Rejected at boundary</div><ul class="clean">${SCENARIO.alternatives.map(x=>`<li>${x}</li>`).join('')}</ul></div></div></div></div>`;
  else center=`<div style="padding:30px 34px"><div class="micro">Decision detail · living record</div><div class="sp-grid" style="margin-top:14px"><div><h1 class="sp-title" style="font-size:52px;margin:0 0 22px">${SCENARIO.currentDecision}</h1><div class="sp-zone"><div class="sp-node branch"><div class="version">Alternatives behind decision</div>${SCENARIO.alternatives.map(x=>`<div class="small" style="padding:5px 0">× ${x}</div>`).join('')}</div><div class="sp-node current"><div class="version">23 Aug 2026 · current</div><p class="bodycopy">Contract consistency, orchestration fit, and migration cost outweigh the speculative benefit of a rewrite.</p></div><div class="sp-node"><div class="version">Forward consequence</div><b>Architecture hardening continues</b></div></div></div><div class="sp-node"><div class="version">Evidence lineage</div><ul class="clean">${SCENARIO.evidence.map(x=>`<li>${x} <span style="float:right">Open ›</span></li>`).join('')}</ul></div></div></div></div>`;
  return shell(worldId,'decision-detail',center,{showContext:false});
}

function projectMemory(worldId) {
  let items = SCENARIO.memory;
  if(worldId==='counterpoint') return shell(worldId,'project-memory',`<div style="padding:32px 34px"><div class="micro" style="color:var(--accent)">Project memory · user-correctable knowledge</div><h1 class="cp-title" style="font-size:50px;margin:12px 0 24px">What Council believes<br>remains true.</h1><div class="cp-three">${items.map(([kind,text,state],i)=>`<div class="cp-folio ${i===0?'blue':i===1?'accent':''}"><div class="micro">${kind}</div><h3 class="display" style="font-size:23px;margin:10px 0">${text}</h3><div class="small muted">${state}</div><div style="margin-top:16px"><span class="pill">Edit</span> <span class="pill">Confirm</span> <span class="pill">Supersede</span> <span class="pill">Remove</span></div></div>`).join('')}</div></div>`,{showContext:false});
  if(worldId==='threshold') return shell(worldId,'project-memory',`<div style="padding:28px 30px"><div class="micro">Project memory · authority states</div><h1 class="th-title" style="font-size:54px;margin:12px 0 22px">Truth is<br>not automatic.</h1><div class="th-boundary"><div class="th-three">${items.map(([kind,text,state],i)=>`<div class="th-panel ${i===0?'verified':i===1?'signal':''}"><div class="micro">${kind}</div><h3 style="font-size:18px;line-height:1.15;margin:12px 0">${text}</h3><div class="th-status"><span>State</span><b>${state}</b></div><div style="margin-top:12px"><span class="pill">Edit</span> <span class="pill">Confirm</span> <span class="pill">Remove</span></div></div>`).join('')}</div></div></div>`,{showContext:false});
  return shell(worldId,'project-memory',`<div style="padding:30px 34px"><div class="micro">Project memory · lineage</div><h1 class="sp-title" style="font-size:50px;margin:10px 0 22px">Persistent truth<br>with a history.</h1><div class="sp-zone" style="max-width:880px">${items.map(([kind,text,state],i)=>`<div class="sp-node ${i===0?'current':i===1?'branch':''}"><div class="version">${kind} · ${state}</div><h3 style="font-family:var(--display);font-size:20px;font-weight:400;margin:8px 0">${text}</h3><span class="pill">Edit</span> <span class="pill">Confirm</span> <span class="pill">Supersede</span> <span class="pill">Remove</span></div>`).join('')}</div></div>`,{showContext:false});
}

function mobileConversation(worldId) {
  const world = WORLDS[worldId];
  const extra = worldId==='counterpoint' ? `.shell{display:block}.proof{bottom:4px}.m-answer{border-top:2px solid var(--ink);padding-top:12px}.m-card{border-top:1px solid var(--ink);padding-top:10px}` : worldId==='threshold' ? `.shell{display:block}.m-answer{border-top:5px solid var(--accent);padding-top:12px}.m-card{border:1px solid var(--ink);border-top:5px solid var(--ink);padding:11px}.proof{bottom:4px}` : `.shell{display:block}.m-answer{border-left:3px solid var(--accent);padding-left:14px;position:relative}.m-answer:before{content:'';position:absolute;left:-8px;top:15px;width:11px;height:11px;background:var(--bg);border:2px solid var(--accent);border-radius:50%}.m-card{border-left:3px solid var(--accent);padding:10px 10px 10px 14px;background:var(--surface)}.proof{bottom:4px}`;
  const source = `<div class="app"><div style="height:52px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 14px"><b style="font-family:var(--display);font-weight:${worldId==='counterpoint'?'400':'700'}">AI Council</b><span class="micro">UI / UX ▾</span></div><div style="padding:18px 14px 88px"><div class="micro">Project context active · Council ready</div><div style="text-align:right;margin-top:26px"><div class="micro">You</div><div style="display:inline-block;background:var(--surface);border:1px solid var(--line);padding:11px 12px;margin-top:7px;font-size:12px">What should we do next?</div></div><div class="m-answer" style="margin-top:24px"><div class="micro">AI Council</div><p style="font-family:${worldId==='counterpoint'?'var(--display)':'var(--body)'};font-size:${worldId==='counterpoint'?'19px':'15px'};line-height:1.35;margin:8px 0 15px">Finish the product UX contract before reopening visual direction. The project is not blocked.</p><div class="m-card"><div class="small"><b>Current focus</b><span style="float:right">UX architecture</span></div><div class="rule" style="margin:9px 0"></div><div class="small"><b>Authority</b><span style="float:right">Advisory</span></div><div class="rule" style="margin:9px 0"></div><div class="small"><b>Open blockers</b><span style="float:right">0</span></div><div style="margin-top:11px"><span class="pill">Context</span> <span class="pill">Evidence</span> <span class="pill">Actions</span></div></div></div></div><div class="composer" style="left:12px;right:12px;bottom:14px;width:auto;transform:none;border-radius:${worldId==='decision-spine'?'12px':'0'}"><span>Ask AI Council…</span><div class="send">↑</div></div><div class="proof">${world.label} · same canonical mobile UX</div></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${commonCss(world)}${extra}</style></head><body>${source}</body></html>`;
}

function renderScreen(worldId, screenId) {
  if(screenId==='project-home') return projectHome(worldId);
  if(screenId==='conversation') return conversation(worldId,false);
  if(screenId==='structured-response') return conversation(worldId,true);
  if(screenId==='evidence-context') return evidenceContext(worldId);
  if(screenId==='approval') return approval(worldId);
  if(screenId==='decision-detail') return decisionDetail(worldId);
  if(screenId==='project-memory') return projectMemory(worldId);
  if(screenId==='mobile-conversation') return mobileConversation(worldId);
  throw new Error(`Unknown screen ${screenId}`);
}

function html(worldId, screenId) {
  if(screenId==='mobile-conversation') return renderScreen(worldId,screenId);
  const world = WORLDS[worldId];
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${world.label} · ${SCREEN_LABELS[screenId]}</title><style>${commonCss(world)}${worldCss(worldId)}</style></head><body>${renderScreen(worldId,screenId)}</body></html>`;
}

async function renderBoard(page, sourcePath, imagePath) {
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil:'load' });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout:10_000 });
  await page.screenshot({ path:imagePath, fullPage:true });
}

const browser = await chromium.launch({ headless:true });
const renderedFrames = [];
try {
  for(const worldId of plan.explorationRef.worldIds) {
    for(const screenId of plan.screenIds) {
      const frameId = `${worldId}-${screenId}`;
      const isMobile = screenId === 'mobile-conversation';
      const sourcePath = path.join(sourceRoot, `${frameId}.html`);
      const imagePath = path.join(framesRoot, `${frameId}.png`);
      await fs.writeFile(sourcePath, html(worldId,screenId));
      const page = await browser.newPage({ viewport: isMobile ? { width:390,height:844 } : { width:1440,height:900 }, deviceScaleFactor:1 });
      await page.goto(pathToFileURL(sourcePath).href, { waitUntil:'load' });
      await page.screenshot({ path:imagePath, fullPage:false });
      await page.close();
      renderedFrames.push({
        frameId,
        worldId,
        screenId,
        imageRef:path.relative(repoRoot,imagePath).replaceAll('\\','/'),
        sourceRef:path.relative(repoRoot,sourcePath).replaceAll('\\','/')
      });
    }
  }

  const comparisonRefs=[];
  for(const screenId of plan.screenIds) {
    const isMobile = screenId==='mobile-conversation';
    const img = (worldId) => pathToFileURL(path.join(framesRoot,`${worldId}-${screenId}.png`)).href;
    const board = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#deded9;font-family:Arial;padding:20px;color:#171717}h1{font-size:22px;margin:0 0 14px}.grid{display:grid;grid-template-columns:${isMobile?'repeat(3,390px)':'repeat(3,1fr)'};gap:12px;align-items:start}figure{margin:0;background:#fff;border:1px solid #bbb;padding:7px}img{width:100%;display:block}figcaption{font-size:12px;font-weight:700;padding:8px 2px 1px}</style></head><body><h1>${esc(SCREEN_LABELS[screenId])} · same canonical screen</h1><div class="grid">${plan.explorationRef.worldIds.map(worldId=>`<figure><img src="${img(worldId)}"><figcaption>${esc(WORLDS[worldId].label)}</figcaption></figure>`).join('')}</div></body></html>`;
    const sourcePath=path.join(comparisonRoot,`${screenId}-comparison.html`); const imagePath=path.join(comparisonRoot,`${screenId}-comparison.png`); await fs.writeFile(sourcePath,board);
    const page=await browser.newPage({ viewport:{ width:isMobile?1230:1800,height:isMobile?1000:1250 },deviceScaleFactor:1 }); await renderBoard(page,sourcePath,imagePath); await page.close(); comparisonRefs.push(path.relative(repoRoot,imagePath).replaceAll('\\','/'));
  }

  const overviewRefs=[];
  for(const worldId of plan.explorationRef.worldIds) {
    const img=(screenId)=>pathToFileURL(path.join(framesRoot,`${worldId}-${screenId}.png`)).href;
    const desktopIds=plan.screenIds.filter(id=>id!=='mobile-conversation');
    const board=`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#deded9;font-family:Arial;padding:22px;color:#171717}h1{font-size:24px;margin:0 0 5px}p{font-size:12px;color:#666;margin:0 0 16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;background:white;border:1px solid #bbb;padding:7px}img{width:100%;display:block}figcaption{font-size:11px;font-weight:700;padding:7px 2px}.mobile{width:390px;margin-top:14px}</style></head><body><h1>${esc(WORLDS[worldId].label)} · canonical AI Council UX</h1><p>Eight-screen comparative proof. Product structure is frozen; world expression varies.</p><div class="grid">${desktopIds.map(screenId=>`<figure><img src="${img(screenId)}"><figcaption>${esc(SCREEN_LABELS[screenId])}</figcaption></figure>`).join('')}</div><figure class="mobile"><img src="${img('mobile-conversation')}"><figcaption>Mobile Conversation Continuity</figcaption></figure></body></html>`;
    const sourcePath=path.join(overviewRoot,`${worldId}-overview.html`);const imagePath=path.join(overviewRoot,`${worldId}-overview.png`);await fs.writeFile(sourcePath,board);const page=await browser.newPage({viewport:{width:1500,height:3400},deviceScaleFactor:1});await renderBoard(page,sourcePath,imagePath);await page.close();overviewRefs.push(path.relative(repoRoot,imagePath).replaceAll('\\','/'));
  }

  const proof=buildInterfaceWorldProofEvidence({ plan, renderedFrames, comparisonRefs, overviewRefs });
  if(!proof.reviewReady) throw new Error(`Rendered canonical proof is incomplete: ${proof.findings.map((item)=>item.code).join(', ')}`);
  const manifest={...proof,plan:{schema:plan.schema,projectId:plan.projectId,interfaceArchitectureRef:plan.interfaceArchitectureRef,screenIds:plan.screenIds,worldIds:plan.explorationRef.worldIds},selection:null,selectedWorld:null};
  await fs.writeFile(path.join(outputRoot,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log(`Rendered ${renderedFrames.length} canonical AI Council interface-world frames.`);
} finally {
  await browser.close();
}
