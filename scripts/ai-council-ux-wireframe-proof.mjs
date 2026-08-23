import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildProductUnderstanding } from '../modules/product-understanding/runtime.mjs';
import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'ux-wireframe-proof-v1');
const framesRoot = path.join(outputRoot, 'frames');
const sourceRoot = path.join(outputRoot, 'source-html');

const productInput = JSON.parse(await fs.readFile(path.join(projectRoot, 'product-understanding.json'), 'utf8'));
const uxInput = JSON.parse(await fs.readFile(path.join(projectRoot, 'product-ux-architecture.json'), 'utf8'));
const productUnderstanding = buildProductUnderstanding(productInput);
const architecture = buildProductUXArchitecture({
  ...uxInput,
  productUnderstandingRef: {
    schema: productUnderstanding.schema,
    projectId: productUnderstanding.projectId,
    sourceProject: productUnderstanding.sourceProject,
    sourceRevision: productUnderstanding.sourceRevision,
    reviewReady: productUnderstanding.reviewReady
  }
});

if (!architecture.reviewReady) {
  throw new Error(`AI Council Product UX Architecture is not review-ready: ${architecture.findings.map((item) => item.code).join(', ')}`);
}

await fs.rm(outputRoot, { recursive: true, force: true });
await fs.mkdir(framesRoot, { recursive: true });
await fs.mkdir(sourceRoot, { recursive: true });

const screens = [
  { id: 'project-home', label: 'Project Home', width: 1440, height: 900 },
  { id: 'conversation', label: 'Normal Conversation', width: 1440, height: 900 },
  { id: 'structured-response', label: 'Structured Council Recommendation', width: 1440, height: 900 },
  { id: 'evidence-context', label: 'Context + Evidence Inspection', width: 1440, height: 900 },
  { id: 'approval', label: 'Approval Request', width: 1440, height: 900 },
  { id: 'decision-detail', label: 'Decision Detail', width: 1440, height: 900 },
  { id: 'project-memory', label: 'Project Memory', width: 1440, height: 900 },
  { id: 'mobile-conversation', label: 'Mobile Conversation Continuity', width: 390, height: 844 }
];

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

const baseCss = `
  *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f7f7f5;color:#191919}
  body{font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}
  .app{width:100vw;height:100vh;display:flex;background:#f7f7f5}
  .side{width:244px;border-right:1px solid #d7d7d2;padding:18px 14px;display:flex;flex-direction:column;background:#f1f1ee}
  .logo{font-weight:700;font-size:15px;margin:4px 8px 22px}.new{border:1px solid #bdbdb7;border-radius:9px;padding:10px 11px;font-size:12px;background:#fff;margin-bottom:12px}
  .navlabel{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#777;margin:17px 8px 8px}.navitem{padding:8px;border-radius:7px;font-size:12px}.navitem.active{background:#deded9;font-weight:700}.state{float:right;font-size:9px;color:#777}
  .sidebottom{margin-top:auto;border-top:1px solid #d5d5cf;padding-top:12px}.main{flex:1;min-width:0;display:flex;flex-direction:column}.bar{height:58px;border-bottom:1px solid #d7d7d2;display:flex;align-items:center;justify-content:space-between;padding:0 22px;background:#fafaf8}.crumb{font-size:12px}.sys{font-size:10px;color:#777;letter-spacing:.08em;text-transform:uppercase}
  .workspace{flex:1;min-height:0;display:flex}.center{flex:1;min-width:0;position:relative;overflow:hidden}.context{width:300px;border-left:1px solid #d7d7d2;background:#f3f3f0;padding:18px}.tabs{display:flex;gap:12px;border-bottom:1px solid #d7d7d2;padding-bottom:10px;margin-bottom:18px}.tab{font-size:10px;color:#777}.tab.active{color:#111;font-weight:700}
  .content{height:100%;overflow:hidden;padding:30px 36px}.kicker{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#777}.h1{font-size:34px;line-height:1.08;font-weight:600;letter-spacing:-.03em;margin:10px 0 8px}.sub{font-size:14px;line-height:1.5;color:#565656}.grid{display:grid;gap:14px}.card{border:1px solid #d1d1cc;background:#fff;border-radius:10px;padding:16px}.card h3{font-size:13px;margin:0 0 10px}.row{display:flex;justify-content:space-between;gap:18px;border-top:1px solid #e3e3df;padding:9px 0;font-size:12px}.row:first-child{border-top:0}.pill{display:inline-block;border:1px solid #c8c8c3;border-radius:999px;padding:4px 8px;font-size:9px;color:#666}.btn{display:inline-block;border:1px solid #a9a9a4;background:#fff;border-radius:8px;padding:10px 13px;font-size:11px;margin-right:8px}.btn.primary{background:#222;color:#fff;border-color:#222}.muted{color:#777}.small{font-size:11px;line-height:1.45}.tiny{font-size:9px;line-height:1.4;color:#777}
  .chat{max-width:760px;margin:0 auto;height:100%;padding:24px 10px 100px}.msg{margin:18px 0}.who{font-size:10px;font-weight:700;margin-bottom:7px}.bubble{font-size:14px;line-height:1.55}.user .bubble{background:#ecece8;border-radius:15px;padding:12px 14px;max-width:78%;margin-left:auto}.user .who{text-align:right}.answer{border-top:1px solid #dddcd7;padding-top:16px}.composer{position:absolute;left:50%;transform:translateX(-50%);bottom:20px;width:min(760px,calc(100% - 48px));height:62px;border:1px solid #c8c8c3;background:#fff;border-radius:15px;display:flex;align-items:end;padding:12px 14px;box-shadow:0 4px 18px rgba(0,0,0,.04)}.composer span{font-size:13px;color:#777}.send{margin-left:auto;width:28px;height:28px;border-radius:50%;background:#222;color:#fff;display:grid;place-items:center;font-size:12px}
  .proof{position:absolute;right:14px;bottom:8px;font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a84;z-index:20}.sectiontitle{font-size:11px;font-weight:700;margin:18px 0 8px}.divider{height:1px;background:#deded9;margin:16px 0}.meter{height:6px;background:#deded9;border-radius:999px;overflow:hidden}.meter span{display:block;height:100%;width:72%;background:#777}.list{margin:0;padding:0;list-style:none}.list li{font-size:11px;line-height:1.45;padding:6px 0;border-bottom:1px solid #e2e2dd}
  .mobile{width:390px;height:844px;background:#f7f7f5;position:relative}.mbar{height:52px;border-bottom:1px solid #d7d7d2;padding:12px 14px;display:flex;align-items:center;justify-content:space-between}.mcontent{padding:16px 14px 92px;height:792px;overflow:hidden}.mcomposer{position:absolute;left:12px;right:12px;bottom:14px;height:58px;border:1px solid #c8c8c3;border-radius:15px;background:#fff;padding:11px 12px;display:flex;align-items:end}.drawer{border:1px solid #d2d2cd;background:#fff;border-radius:10px;padding:11px;margin:12px 0}
`;

function sidebar(activeConversation = 'UI / UX') {
  return `<aside class="side"><div class="logo">AI Council</div><div class="new">＋ New conversation</div><div class="new">＋ New project</div><div class="navlabel">Projects</div><div class="navitem active">AI Council</div><div class="navitem">AI Studio OS</div><div class="navitem">SignalScout</div><div class="navlabel">AI Council conversations</div>${['Cognitive Reliability','Routing Intelligence','Memory Architecture','UI / UX','OpenClaw Integration'].map((item)=>`<div class="navitem ${item===activeConversation?'active':''}">${item}${item==='Routing Intelligence'?'<span class="state">next</span>':''}</div>`).join('')}<div class="sidebottom">${['Projects','Activity','Approvals','Library','Settings'].map((item)=>`<div class="navitem">${item}</div>`).join('')}</div></aside>`;
}

function bar(label = 'UI / UX') {
  return `<div class="bar"><div class="crumb"><b>AI Council</b> &nbsp;/&nbsp; ${esc(label)}</div><div class="sys">Project active · Council ready</div></div>`;
}

function contextPanel(tab = 'Context') {
  return `<aside class="context"><div class="tabs">${['Context','Project','Evidence','Actions'].map((item)=>`<div class="tab ${item===tab?'active':''}">${item}</div>`).join('')}</div><div class="kicker">Current context</div><h3 style="font-size:14px;margin:8px 0">UI / UX product structure</h3><div class="small">Goal: freeze information architecture before visual design.</div><div class="sectiontitle">Using</div><ul class="list"><li>Project UX brief</li><li>Product Understanding</li><li>Current decisions</li><li>Project memory constraints</li></ul><div class="sectiontitle">Current state</div><div class="row"><span>Authority</span><b>Advisory</b></div><div class="row"><span>Open blockers</span><b>0</b></div></aside>`;
}

function shell(inner, { context = true, activeConversation = 'UI / UX', barLabel = 'UI / UX' } = {}) {
  return `<div class="app">${sidebar(activeConversation)}<main class="main">${bar(barLabel)}<div class="workspace"><section class="center">${inner}</section>${context?contextPanel():''}</div></main><div class="proof">Structural wireframe · no visual direction</div></div>`;
}

function projectHome() {
  return shell(`<div class="content"><div class="kicker">Project home</div><div class="h1">AI Council</div><div class="sub">Project-aware conversational workspace for consequential technical decisions.</div><div style="display:grid;grid-template-columns:1.2fr .8fr;gap:16px;margin-top:24px"><div class="card"><div class="kicker">Current focus</div><h3 style="font-size:20px;margin:8px 0">Cognitive Reliability Benchmark</h3><div class="small muted">Cognitive Core hardening · routing authority remains advisory</div><div style="margin-top:18px"><span class="btn primary">Continue current work</span></div></div><div class="card"><h3>Since your last session</h3><ul class="list"><li>Reliability benchmark updated</li><li>Problem Formulation + Strategy Comparison merged</li><li>Routing authority remains unchanged</li></ul></div></div><div class="grid" style="grid-template-columns:1fr 1fr 1fr;margin-top:14px"><div class="card"><h3>Suggested next steps</h3><ol class="small" style="padding-left:17px;line-height:1.8"><li>Review benchmark threshold</li><li>Resolve reliability question</li><li>Decide routing entry gate</li></ol></div><div class="card"><h3>Active conversations</h3>${['Cognitive Reliability','Routing Intelligence','Memory Architecture','UI / UX'].map((x)=>`<div class="row"><span>${x}</span><span>›</span></div>`).join('')}</div><div class="card"><h3>Project state</h3><div class="row"><span>Tasks</span><b>3 active</b></div><div class="row"><span>Decisions</span><b>12</b></div><div class="row"><span>Open questions</span><b>2</b></div><div class="row"><span>Blocked</span><b>0</b></div></div></div><div class="card" style="margin-top:14px"><h3>Recent decisions</h3><div class="row"><span>Reliability remains advisory</span><span class="pill">Active</span></div><div class="row"><span>Routing authority unchanged</span><span class="pill">Active</span></div><div class="row"><span>Project memory remains user-correctable</span><span class="pill">Confirmed</span></div></div></div>`, { context:false, activeConversation:'' , barLabel:'Overview'});
}

function conversation(structured = false) {
  const response = structured ? `<div class="answer"><div class="who">AI Council</div><div class="bubble"><b>Recommendation</b><br>Keep the current TypeScript control plane. The current architecture benefits more from contract consistency and continuity than from a language rewrite.</div><div class="grid" style="grid-template-columns:1fr 1fr;margin-top:14px"><div class="card"><h3>Why</h3><div class="small">Migration cost is high while the identified reliability risks are architectural rather than language-specific.</div></div><div class="card"><h3>Next action</h3><div class="small">Finish reliability benchmarking before changing routing authority.</div></div></div><div style="margin-top:12px"><span class="pill">▸ Evidence</span> <span class="pill">▸ Alternatives considered</span> <span class="pill">▸ Risks</span> <span class="pill">▸ Council</span></div></div>` : `<div class="answer"><div class="who">AI Council</div><div class="bubble">I recommend keeping the current TypeScript control plane for now. The strongest reason is that the present risks are about decision quality, evidence discipline, and authority boundaries—not the language itself.</div><div style="margin-top:12px"><span class="pill">Evidence available</span> <span class="pill">3 specialists consulted</span></div></div>`;
  return shell(`<div class="chat"><div class="msg user"><div class="who">You</div><div class="bubble">Should we rewrite AI Council in Python?</div></div><div class="msg">${response}</div></div><div class="composer"><span>Ask AI Council…</span><div class="send">↑</div></div>`, { context:true, activeConversation:'UI / UX' });
}

function evidenceContext() {
  const panel = `<aside class="context" style="width:390px"><div class="tabs"><div class="tab active">Context</div><div class="tab">Project</div><div class="tab active">Evidence</div><div class="tab">Actions</div></div><div class="kicker">Evidence used</div><div class="card" style="margin-top:12px"><h3>Product Understanding</h3><div class="tiny">projects/ai-council/product-understanding.json</div><div class="small" style="margin-top:10px">Supports the conclusion that current reliability and governance risks are architectural.</div><div class="divider"></div><div class="tiny">Why used: current repository-grounded product model</div></div><div class="card" style="margin-top:10px"><h3>Architecture discussion</h3><div class="tiny">Conversation · 23 Aug 2026</div><div class="small" style="margin-top:10px">Language choice was evaluated against orchestration and contract consistency.</div></div><div class="sectiontitle">Active constraints</div><ul class="list"><li>Routing remains advisory</li><li>Repository is source of truth</li><li>External actions require approval</li></ul></aside>`;
  return `<div class="app">${sidebar()}<main class="main">${bar()}<div class="workspace"><section class="center"><div class="chat"><div class="msg user"><div class="who">You</div><div class="bubble">Why keep TypeScript?</div></div><div class="msg"><div class="answer"><div class="who">AI Council</div><div class="bubble">Because the current evidence points to reasoning and governance reliability as the bottleneck, not language capability.</div></div></div></div><div class="composer"><span>Ask AI Council…</span><div class="send">↑</div></div></section>${panel}</div></main><div class="proof">Structural wireframe · no visual direction</div></div>`;
}

function approval() {
  return shell(`<div class="content" style="max-width:900px;margin:0 auto"><div class="kicker">Approval required</div><div class="h1">Create branch <span style="font-family:monospace;font-size:.75em">feat/routing-intelligence-v1</span></div><div class="sub">Council is asking permission to modify repository state. Advice has ended; execution has not begun.</div><div class="grid" style="grid-template-columns:1fr 1fr;margin-top:26px"><div class="card"><h3>What will change</h3><ul class="list"><li>Create one Git branch</li><li>Prepare routing-intelligence implementation slice</li><li>Estimated 12 files affected</li></ul></div><div class="card"><h3>Governance</h3><div class="row"><span>Risk</span><b>Medium</b></div><div class="row"><span>Reversible</span><b>Yes</b></div><div class="row"><span>Production impact</span><b>None yet</b></div></div></div><div class="card" style="margin-top:14px"><h3>Why Council proposes this</h3><div class="small">The reliability benchmark is sufficiently mature to begin implementation in a reversible branch while current routing remains authoritative.</div><div class="divider"></div><div class="row"><span>Rollback</span><span>Delete branch; no mainline state changes</span></div><div class="row"><span>Validation</span><span>Unit + browser + routing invariant checks</span></div></div><div style="margin-top:18px"><span class="btn">Review plan</span><span class="btn">Modify plan</span><span class="btn">Reject</span><span class="btn primary">Approve</span></div></div>`, { context:false, barLabel:'Approval' });
}

function decisionDetail() {
  return shell(`<div class="content" style="max-width:960px;margin:0 auto"><div class="kicker">Decision · Active</div><div class="h1">Keep TypeScript as AI Council control plane</div><div class="sub">23 Aug 2026 · High confidence · 8 evidence sources</div><div class="card" style="margin-top:24px"><h3>Rationale</h3><div class="small">Contract consistency, orchestration fit, and migration cost outweigh the speculative benefit of a rewrite. Future ML-heavy services may still justify Python at bounded service boundaries.</div></div><div class="grid" style="grid-template-columns:1fr 1fr;margin-top:14px"><div class="card"><h3>Alternatives considered</h3>${['Rewrite in Python','Hybrid TypeScript / Python','Go control plane','Rust control plane'].map((x)=>`<div class="row"><span>${x}</span><span>rejected</span></div>`).join('')}</div><div class="card"><h3>Decision state</h3><div class="row"><span>Status</span><b>Active</b></div><div class="row"><span>Confidence</span><b>High</b></div><div class="row"><span>Supersedes</span><span>Initial language evaluation</span></div><div class="row"><span>Related task</span><span>Architecture hardening</span></div></div></div><div class="card" style="margin-top:14px"><h3>Evidence</h3><div class="row"><span>Current architecture</span><span>Open ›</span></div><div class="row"><span>Runtime contracts</span><span>Open ›</span></div><div class="row"><span>Migration cost analysis</span><span>Open ›</span></div></div><div style="margin-top:16px"><span class="btn">Ask why</span><span class="btn">Open conversation</span><span class="btn">Supersede decision</span></div></div>`, { context:false, barLabel:'Decision' });
}

function projectMemory() {
  return shell(`<div class="content"><div class="kicker">Project memory</div><div class="h1">What Council believes remains true</div><div class="sub">Structured project knowledge is inspectable and user-correctable. Current response context is not automatically project truth.</div><div style="display:grid;grid-template-columns:180px 1fr;gap:20px;margin-top:24px"><div class="card" style="height:max-content">${['Decisions','Facts','Constraints','Tasks','Questions','Risks','Artifacts','Sessions'].map((x,i)=>`<div class="navitem ${i===0?'active':''}">${x}</div>`).join('')}</div><div><div class="card"><div class="row"><div><b>Use TypeScript as control plane</b><div class="tiny" style="margin-top:4px">Confirmed · 23 Aug · source: Architecture discussion</div></div><span class="pill">Decision</span></div><div style="margin-top:10px"><span class="btn">Edit</span><span class="btn">Confirm</span><span class="btn">Supersede</span><span class="btn">Remove</span></div></div><div class="card" style="margin-top:12px"><div class="row"><div><b>Routing remains advisory until reliability benchmark passes</b><div class="tiny" style="margin-top:4px">Confirmed constraint · source: Cognitive Reliability</div></div><span class="pill">Constraint</span></div><div style="margin-top:10px"><span class="btn">Edit</span><span class="btn">Confirm</span><span class="btn">Supersede</span><span class="btn">Remove</span></div></div><div class="card" style="margin-top:12px"><div class="row"><div><b>When should routing become authoritative?</b><div class="tiny" style="margin-top:4px">Open question · last updated today</div></div><span class="pill">Question</span></div></div></div></div></div>`, { context:false, barLabel:'Memory' });
}

function mobileConversation() {
  return `<div class="mobile"><div class="mbar"><b>AI Council</b><span class="tiny">UI / UX ▾</span></div><div class="mcontent"><div class="tiny">Project context active · Council ready</div><div class="msg user" style="margin-top:24px"><div class="who">You</div><div class="bubble" style="max-width:92%">What should we do next?</div></div><div class="msg"><div class="who">AI Council</div><div class="bubble">Finish the product UX contract before reopening visual direction. The project is not blocked.</div><div class="drawer"><div class="row"><span>Current focus</span><b>UX architecture</b></div><div class="row"><span>Authority</span><b>Advisory</b></div><div class="row"><span>Open blockers</span><b>0</b></div><div style="margin-top:8px"><span class="pill">Context</span> <span class="pill">Evidence</span> <span class="pill">Actions</span></div></div></div></div><div class="mcomposer"><span class="muted" style="font-size:12px">Ask AI Council…</span><div class="send">↑</div></div><div class="proof">Wireframe · no visual direction</div></div>`;
}

function renderScreen(id) {
  if (id === 'project-home') return projectHome();
  if (id === 'conversation') return conversation(false);
  if (id === 'structured-response') return conversation(true);
  if (id === 'evidence-context') return evidenceContext();
  if (id === 'approval') return approval();
  if (id === 'decision-detail') return decisionDetail();
  if (id === 'project-memory') return projectMemory();
  if (id === 'mobile-conversation') return mobileConversation();
  throw new Error(`Unknown wireframe screen ${id}`);
}

function html(screen) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(screen.label)}</title><style>${baseCss}</style></head><body>${renderScreen(screen.id)}</body></html>`;
}

const browser = await chromium.launch({ headless: true });
const rendered = [];
try {
  for (const screen of screens) {
    const source = html(screen);
    const sourcePath = path.join(sourceRoot, `${screen.id}.html`);
    const imagePath = path.join(framesRoot, `${screen.id}.png`);
    await fs.writeFile(sourcePath, source);
    const page = await browser.newPage({ viewport: { width: screen.width, height: screen.height }, deviceScaleFactor: 1 });
    await page.setContent(source, { waitUntil: 'load' });
    await page.screenshot({ path: imagePath, fullPage: false });
    await page.close();
    rendered.push({
      screenId: screen.id,
      label: screen.label,
      imageRef: path.relative(repoRoot, imagePath).replaceAll('\\', '/'),
      sourceRef: path.relative(repoRoot, sourcePath).replaceAll('\\', '/'),
      width: screen.width,
      height: screen.height
    });
  }

  const desktop = rendered.filter((item) => item.screenId !== 'mobile-conversation');
  const cards = desktop.map((item) => `<div class="ov"><img src="../frames/${item.screenId}.png"><div>${esc(item.label)}</div></div>`).join('');
  const overview = `<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;background:#e8e8e4;font-family:Arial;padding:24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.ov{background:#fff;padding:10px;border:1px solid #c5c5c0;font-size:14px}.ov img{width:100%;display:block;margin-bottom:8px}.mobile{margin-top:18px;background:#fff;padding:10px;border:1px solid #c5c5c0;width:390px}.mobile img{width:100%;display:block;margin-bottom:8px}</style></head><body><h1 style="font-size:24px">AI Council · Canonical UX wireframe proof</h1><p>Structural proof only. No Creative World, color system, typography direction, motion direction, or final UI approval.</p><div class="grid">${cards}</div><div class="mobile"><img src="../frames/mobile-conversation.png"><div>Mobile Conversation Continuity</div></div></body></html>`;
  const overviewSource = path.join(outputRoot, 'overview.html');
  const overviewImage = path.join(outputRoot, 'overview.png');
  await fs.writeFile(overviewSource, overview);
  const overviewPage = await browser.newPage({ viewport: { width: 1500, height: 3100 }, deviceScaleFactor: 1 });
  await overviewPage.goto(`file://${overviewSource}`);
  await overviewPage.screenshot({ path: overviewImage, fullPage: true });
  await overviewPage.close();

  const manifest = {
    schema: 'ai-studio-os/ux-wireframe-proof@1',
    projectId: 'ai-council',
    architecture: {
      schema: architecture.schema,
      status: architecture.status,
      reviewReady: architecture.reviewReady,
      screenIds: architecture.screens.map((screen) => screen.id)
    },
    rendered,
    overviewRef: path.relative(repoRoot, overviewImage).replaceAll('\\', '/'),
    truth: {
      informationArchitectureFrozen: true,
      structuralWireframeOnly: true,
      visualDirectionApplied: false,
      creativeWorldSelected: false,
      typographyApproved: false,
      motionApproved: false,
      finalUIApproved: false
    }
  };
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Rendered ${rendered.length} AI Council canonical UX wireframes.`);
} finally {
  await browser.close();
}
