import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
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
const architectureRef = (await import('../modules/product-ux-architecture/reference.mjs')).buildProductUXArchitectureReference(architecture);
const fixtureInput = JSON.parse(await fs.readFile(path.join(projectRoot, 'canonical-ux-fixture.json'), 'utf8'));
const fixture = buildCanonicalInterfaceFixture(fixtureInput, { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const exploration = JSON.parse(await fs.readFile(path.join(projectRoot, 'creative-worlds.json'), 'utf8'));
const plan = buildInterfaceWorldProofPlan({ architecture, exploration, fixture });

if (!plan.reviewReady) throw new Error(`Canonical interface world proof is not ready: ${plan.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [framesRoot, sourceRoot, comparisonRoot, overviewRoot]) await fs.mkdir(dir, { recursive: true });

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
const P = fixture.projectState;
const C = fixture.conversation;
const E = fixture.evidenceInspection;
const A = fixture.approval;
const D = fixture.decision;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 20);
}

function list(items = [], suffix = '') {
  return `<ul class="clean">${items.map((item) => `<li>${esc(item)}${suffix}</li>`).join('')}</ul>`;
}

function buttons(items = [], primary = null) {
  return `<div class="actions">${items.map((item) => `<span class="button ${item === primary ? 'primary' : ''}">${esc(item)}</span>`).join('')}</div>`;
}

function commonCss(world) {
  const t = world.theme;
  return `
    :root{--bg:${t.bg};--surface:${t.surface};--ink:${t.ink};--muted:${t.muted};--line:${t.line};--accent:${t.accent};--accent2:${t.accent2};--display:${world.display};--body:${world.body}}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--bg);color:var(--ink)}body{font-family:var(--body);-webkit-font-smoothing:antialiased}
    .app{width:100vw;height:100vh;position:relative;background:var(--bg);overflow:hidden}.shell{display:grid;height:100%}.side{position:relative}.brand{font-weight:800;letter-spacing:-.025em}.micro{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}.small{font-size:11px;line-height:1.5}.bodycopy{font-size:14px;line-height:1.55}.display{font-family:var(--display);font-weight:400;letter-spacing:-.045em}.muted{color:var(--muted)}
    .button{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--ink);padding:9px 11px;font-size:9px;letter-spacing:.05em;text-transform:uppercase;background:transparent}.button.primary{background:var(--ink);color:var(--bg)}.actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.pill{display:inline-block;border:1px solid var(--line);padding:5px 8px;font-size:9px;letter-spacing:.05em;text-transform:uppercase}.rule{height:1px;background:var(--line)}
    .main{position:relative;min-width:0}.top{display:flex;align-items:center;justify-content:space-between}.center{position:absolute;overflow:hidden}.context{position:relative}.tabrow{display:flex;gap:12px;font-size:8px;letter-spacing:.1em;text-transform:uppercase}.tabrow b{color:var(--accent)}
    .nav{font-size:10px}.nav.active{font-weight:700}.side h6{font-size:8px;letter-spacing:.13em;text-transform:uppercase}.content{height:100%;overflow:hidden}.eyebrow{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}.hero{font-family:var(--display);font-weight:400;letter-spacing:-.05em;line-height:.94;margin:10px 0 16px}.section-label{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}.cards,.two,.three{display:grid;gap:16px}.two{grid-template-columns:1fr 1fr}.three{grid-template-columns:repeat(3,1fr)}.card{padding:15px 0;border-top:1px solid var(--line)}.card.emphasis{border-top-color:var(--accent);border-top-width:3px}.card.secondary{border-top-color:var(--accent2);border-top-width:3px}.card h3{margin:7px 0 9px;font-size:19px;line-height:1.16}.clean{list-style:none;margin:0;padding:0}.clean li{padding:7px 0;border-top:1px solid var(--line);font-size:11px;line-height:1.35}.clean li:first-child{border-top:0}.status-row{display:flex;justify-content:space-between;gap:18px;padding:8px 0;border-top:1px solid var(--line);font-size:10px}.status-row b{text-align:right}.composer{position:absolute;bottom:18px;height:58px;display:flex;align-items:center;padding:0 14px;border:1px solid var(--line);background:var(--surface);font-size:12px;color:var(--muted);z-index:30}.send{margin-left:auto;width:29px;height:29px;display:grid;place-items:center;background:var(--ink);color:var(--bg)}
    .thread{max-width:780px;margin:0 auto;padding:34px 24px 100px}.message{margin-bottom:26px}.message.user{text-align:right}.bubble{display:inline-block;max-width:620px;padding:12px 15px;border:1px solid var(--line);background:var(--surface);font-size:13px;text-align:left}.assistant-panel{padding:16px 0;border-top:2px solid var(--ink)}.recommend-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:18px}.memory-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.memory-item{min-width:0}.memory-actions{display:flex;flex-wrap:wrap;gap:5px;margin-top:13px}.memory-actions .button{font-size:8px;padding:7px 8px}.removal-note{margin-top:18px;padding:11px 13px;border-left:3px solid var(--accent);font-size:10px;line-height:1.45}.proof{position:absolute;right:13px;bottom:9px;z-index:90;font-size:7px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);background:color-mix(in srgb,var(--bg) 88%,transparent);padding:4px 6px;border:1px solid var(--line)}.worldmark{position:absolute;z-index:60;font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
  `;
}

const COUNTERPOINT_CSS = `
  .shell{grid-template-columns:212px minmax(0,1fr) 286px}.side{border-right:1px solid var(--line);padding:22px 18px;background:color-mix(in srgb,var(--surface) 55%,transparent)}.side .brand{font-family:var(--display);font-size:19px;font-weight:400;margin-bottom:28px}.side h6{margin:20px 0 8px;color:var(--accent)}.nav{padding:7px 0;border-bottom:1px solid transparent}.nav.active{border-bottom-color:var(--ink);font-family:var(--display);font-size:13px}.top{height:66px;border-bottom:1px solid var(--ink);margin:0 28px}.top .path{font-family:var(--display);font-size:14px}.center{inset:66px 0 0}.context{border-left:1px solid var(--ink);padding:22px 20px;background:color-mix(in srgb,var(--surface) 62%,transparent)}.tabrow{border-bottom:1px solid var(--line);padding-bottom:10px}.content{padding:32px 34px}.hero{font-size:54px}.cards{grid-template-columns:1.15fr .85fr}.three{grid-template-columns:repeat(3,1fr)}.assistant-panel{border-top:2px solid var(--ink)}.composer{left:50%;transform:translateX(-50%);width:min(720px,calc(100% - 56px));border-radius:0}.worldmark{left:238px;bottom:10px}.decision-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:28px}.approval-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:24px}
`;

const THRESHOLD_CSS = `
  .shell{grid-template-columns:154px minmax(0,1fr) 260px}.side{background:var(--ink);color:var(--bg);padding:20px 13px}.side .brand{font-size:14px;margin:3px 6px 32px}.side h6{color:color-mix(in srgb,var(--bg) 55%,transparent);margin:22px 6px 9px}.nav{font-size:9px;padding:8px 6px;border-left:1px solid transparent}.nav.active{border-left:4px solid var(--accent);background:rgba(255,255,255,.08)}.top{height:58px;padding:0 24px;border-bottom:1px solid var(--line)}.top .path{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.center{inset:58px 0 0}.context{border-left:1px solid var(--ink);padding:20px 16px;background:var(--surface)}.tabrow{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:18px}.tabrow span,.tabrow b{background:var(--surface);padding:8px}.tabrow b{background:var(--ink);color:var(--bg)}.content{padding:28px 30px}.hero{font-family:var(--body);font-size:62px;font-weight:800;letter-spacing:-.065em;text-transform:uppercase;line-height:.88}.card{border:1px solid var(--ink);padding:16px}.card.emphasis{border-top:7px solid var(--accent)}.card.secondary{border-top:7px solid var(--accent2)}.cards{grid-template-columns:1.2fr .8fr}.three{grid-template-columns:.75fr 1.4fr .85fr}.assistant-panel{border:1px solid var(--ink);border-top:6px solid var(--accent);padding:16px}.recommend-grid{grid-template-columns:1fr 1fr}.recommend-grid .card:last-child{grid-column:1/-1}.composer{left:24px;right:24px;width:auto;border-width:1px 1px 5px}.worldmark{left:178px;bottom:10px}.decision-grid,.approval-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.memory-grid{grid-template-columns:.75fr 1.4fr .85fr}
`;

const SPINE_CSS = `
  .shell{grid-template-columns:196px minmax(0,1fr) 278px}.side{padding:20px 15px;background:var(--surface);border-right:1px solid var(--line)}.side .brand{font-family:var(--display);font-size:17px;font-weight:400;margin:4px 5px 27px}.side h6{color:var(--accent);margin:20px 5px 8px}.nav{padding:8px 6px;position:relative}.nav.active:before{content:'';position:absolute;left:-15px;top:4px;bottom:4px;width:3px;background:var(--accent)}.top{height:62px;margin:0 24px;border-bottom:1px solid var(--line)}.top .path{font-family:var(--display);font-size:13px}.center{inset:62px 0 0}.context{border-left:1px solid var(--line);background:color-mix(in srgb,var(--surface) 74%,transparent);padding:20px}.tabrow b{border-bottom:2px solid var(--accent);padding-bottom:6px}.content{padding:30px 34px}.hero{font-size:52px}.cards{grid-template-columns:1fr .9fr}.card,.assistant-panel,.memory-item{position:relative;padding:14px 14px 14px 20px;border:1px solid var(--line);background:var(--surface)}.card:before,.assistant-panel:before,.memory-item:before{content:'';position:absolute;left:-8px;top:18px;width:11px;height:11px;background:var(--bg);border:2px solid var(--accent);border-radius:50%}.card.emphasis,.assistant-panel{border-left:5px solid var(--accent)}.card.secondary{border-left:3px solid var(--accent2);margin-left:28px}.three,.memory-grid{grid-template-columns:1fr 1fr 1fr}.composer{left:50%;transform:translateX(-50%);width:min(700px,calc(100% - 54px));border-radius:12px}.worldmark{left:220px;bottom:10px}.decision-grid,.approval-grid{display:grid;grid-template-columns:1fr .9fr;gap:24px}
`;

function worldCss(worldId) {
  if (worldId === 'counterpoint') return COUNTERPOINT_CSS;
  if (worldId === 'threshold') return THRESHOLD_CSS;
  return SPINE_CSS;
}

function side() {
  const projects = ['AI Council', 'AI Studio OS', 'SignalScout'];
  const conversations = fixture.projectState.conversations;
  return `<aside class="side"><div class="brand">AI Council</div>${buttons(['＋ New conversation'])}${buttons(['＋ New project'])}<h6>Projects</h6>${projects.map((item, index) => `<div class="nav ${index === 0 ? 'active' : ''}">${esc(item)}</div>`).join('')}<h6>Conversations</h6>${conversations.map((item) => `<div class="nav ${item === fixture.activeThread.label ? 'active' : ''}">${esc(item)}</div>`).join('')}<div style="position:absolute;left:14px;right:14px;bottom:22px"><h6>Global</h6>${['Projects','Activity','Approvals','Library','Settings'].map((item) => `<div class="nav">${item}</div>`).join('')}</div></aside>`;
}

function top(screenId) {
  return `<div class="top"><div class="path"><b>${esc(fixture.activeProject.label)}</b> &nbsp;/&nbsp; ${esc(SCREEN_LABELS[screenId] ?? screenId)}</div><div class="micro">Project active · Council ready</div></div>`;
}

function context(active = 'Context') {
  const tabs = ['Context','Project','Evidence','Actions'];
  return `<aside class="context"><div class="tabrow">${tabs.map((item) => item === active ? `<b>${item}</b>` : `<span>${item}</span>`).join('')}</div><div class="micro">Current context</div><h3 style="font-family:var(--display);font-size:18px;font-weight:400;margin:8px 0">${esc(fixture.currentContext.label)}</h3><p class="small">Goal: ${esc(fixture.currentContext.goal)}</p><div class="rule" style="margin:16px 0"></div><div class="micro">Using</div>${list(fixture.currentContext.using)}<div class="rule" style="margin:16px 0"></div><div class="status-row"><span>Authority</span><b>${esc(D.authority)}</b></div></aside>`;
}

function shell(worldId, screenId, center, { showContext = true } = {}) {
  const world = WORLDS[worldId];
  const collapsed = showContext ? '' : `<style>.shell{grid-template-columns:${worldId === 'threshold' ? '154px' : worldId === 'counterpoint' ? '212px' : '196px'} minmax(0,1fr)!important}.context{display:none}</style>`;
  return `<div class="app" data-world="${esc(worldId)}">${collapsed}<div class="shell">${side()}<main class="main">${top(screenId)}<section class="center">${center}</section></main>${showContext ? context(screenId === 'evidence-context' ? 'Evidence' : 'Context') : ''}</div><div class="worldmark">${esc(world.label)} · canonical UX proof</div><div class="proof">IA ${architectureRef.fingerprint.slice(0,8)} · fixture ${fixtureRef.fingerprint.slice(0,8)} · no selection</div></div>`;
}

function projectHome() {
  return `<div class="content"><div class="eyebrow">Project Home</div><h1 class="hero">Where the project stands</h1><p class="bodycopy" style="max-width:720px">${esc(fixture.activeProject.label)} is in ${esc(P.phase)}. The current focus is ${esc(P.currentFocus)}.</p><div class="cards" style="margin-top:22px"><div class="card emphasis"><div class="section-label">Continue</div><h3>${esc(P.currentFocus)}</h3>${buttons(['Continue current work'], 'Continue current work')}</div><div class="card secondary"><div class="section-label">Since your last session</div>${list(P.recent)}</div></div><div class="three" style="margin-top:20px"><div class="card"><div class="section-label">Suggested next</div>${list(P.suggestedNext)}</div><div class="card"><div class="section-label">Active conversations</div>${list(P.conversations)}</div><div class="card"><div class="section-label">Project state</div><div class="status-row"><span>Active tasks</span><b>${P.activeTasks}</b></div><div class="status-row"><span>Decisions</span><b>${P.decisions}</b></div><div class="status-row"><span>Open questions</span><b>${P.openQuestions}</b></div><div class="status-row"><span>Blockers</span><b>${P.blockers}</b></div></div></div></div>`;
}

function conversation(structured = false) {
  const response = structured
    ? `<div class="eyebrow">Recommendation</div><h2 class="display" style="font-size:28px;margin:8px 0 12px">${esc(C.recommendation)}</h2><p class="bodycopy">${esc(C.answer.replace(`${C.recommendation} `, ''))}</p><div class="recommend-grid"><div class="card secondary"><div class="section-label">Why</div><p class="small">${esc(C.why)}</p></div><div class="card emphasis"><div class="section-label">Next</div><p class="small">${esc(C.nextAction)}</p></div><div class="card"><div class="section-label">Inspect</div><span class="pill">Evidence</span> <span class="pill">Alternatives</span></div></div>`
    : `<p class="bodycopy">${esc(C.answer)}</p><div style="margin-top:12px"><span class="pill">${esc(C.evidenceSummary)}</span> <span class="pill">${esc(C.specialistSummary)}</span></div>`;
  return `<div class="thread"><div class="message user"><div class="micro">You</div><div class="bubble">${esc(C.userQuestion)}</div></div><div class="message"><div class="assistant-panel"><div class="micro">AI Council</div>${response}</div></div></div><div class="composer"><span>Ask AI Council…</span><div class="send">↑</div></div>`;
}

function evidenceContext() {
  return `<div class="thread"><div class="message user"><div class="micro">You</div><div class="bubble">${esc(E.userQuestion)}</div></div><div class="message"><div class="assistant-panel"><div class="micro">AI Council</div><p class="bodycopy">${esc(E.answer)}</p><div style="margin-top:14px"><span class="pill">${esc(E.evidenceSummary)}</span> <span class="pill">${esc(E.constraintSummary)}</span></div></div></div></div><div class="composer"><span>Ask AI Council…</span><div class="send">↑</div></div>`;
}

function approval() {
  return `<div class="content"><div class="eyebrow">${esc(A.eyebrow)}</div><h1 class="hero">${esc(A.proposedAction)}</h1><div class="approval-grid"><div class="card"><div class="section-label">What changes</div>${list(A.changes)}</div><div class="card emphasis"><div class="section-label">Governance</div><div class="status-row"><span>Risk</span><b>${esc(A.risk)}</b></div><div class="status-row"><span>Reversible</span><b>${esc(A.reversible)}</b></div><div class="status-row"><span>Authority</span><b>${esc(A.authority)}</b></div><div class="status-row"><span>Production impact</span><b>${esc(A.productionImpact)}</b></div></div></div><div class="two" style="margin-top:18px"><div class="card secondary"><div class="section-label">Why</div><p class="small">${esc(A.why)}</p></div><div class="card"><div class="section-label">Rollback and validation</div><p class="small"><b>Rollback:</b> ${esc(A.rollback)}</p><p class="small"><b>Validation:</b> ${esc(A.validationPlan)}</p></div></div>${buttons(A.actions, 'Approve')}</div>`;
}

function decisionDetail() {
  return `<div class="content"><div class="eyebrow">Decision Detail · ${esc(D.date)}</div><h1 class="hero">${esc(D.statement)}</h1><div class="three" style="margin:4px 0 18px"><div class="card"><div class="section-label">Decision lifecycle</div><b>${esc(D.lifecycle)}</b></div><div class="card"><div class="section-label">Confidence</div><b>${esc(D.confidence)}</b></div><div class="card"><div class="section-label">Authority</div><b>${esc(D.authority)}</b></div></div><div class="decision-grid"><div><div class="card secondary"><div class="section-label">Rationale</div><p class="bodycopy">${esc(D.rationale)}</p></div><div class="card emphasis" style="margin-top:16px"><div class="section-label">Alternatives considered</div>${list(D.alternatives)}</div></div><div><div class="card"><div class="section-label">Evidence</div>${list(D.evidence)}</div><div class="removal-note"><b>Remaining uncertainty:</b> ${esc(D.remainingUncertainty)}</div></div></div></div>`;
}

function projectMemory() {
  return `<div class="content"><div class="eyebrow">Project Memory · user-correctable knowledge</div><h1 class="hero">What Council believes remains true</h1><div class="memory-grid">${fixture.memory.map((item, index) => `<div class="memory-item card ${index === 0 ? 'secondary' : index === 1 ? 'emphasis' : ''}"><div class="section-label">${esc(item.kind)}</div><h3>${esc(item.statement)}</h3><div class="status-row"><span>Memory verification</span><b>${esc(item.verification)}</b></div><div class="status-row"><span>Decision lifecycle</span><b>${esc(item.lifecycle)}</b></div><div class="small muted">Updated ${esc(item.updated)}</div><div class="memory-actions">${item.actions.map((action) => `<span class="button">${esc(action)}</span>`).join('')}</div></div>`).join('')}</div><div class="removal-note"><b>${esc(fixture.memoryRemovalSemantics.label)}:</b> ${esc(fixture.memoryRemovalSemantics.meaning)}</div></div>`;
}

function mobileConversation() {
  return `<div class="mobile-app"><header class="mobile-top"><b>AI Council</b><span class="thread-trigger">${esc(fixture.mobileNavigation.triggerLabel)} ▾</span></header><main class="mobile-body"><div class="micro">Project context active · Council ready</div><div class="message user" style="margin-top:26px"><div class="micro">You</div><div class="bubble">What should we do next?</div></div><div class="message"><div class="assistant-panel"><div class="micro">AI Council</div><p class="bodycopy">${esc(C.recommendation)} ${esc(C.nextAction)}</p><div class="mobile-card"><div class="status-row"><span>Current focus</span><b>${esc(P.currentFocus)}</b></div><div class="status-row"><span>Authority</span><b>${esc(D.authority)}</b></div><div class="status-row"><span>Open blockers</span><b>${P.blockers}</b></div><div style="margin-top:10px"><span class="pill">Context</span> <span class="pill">Evidence</span> <span class="pill">Actions</span></div></div></div></div></main><div class="composer mobile-composer"><span>Ask AI Council…</span><div class="send">↑</div></div><div class="proof">IA ${architectureRef.fingerprint.slice(0,8)} · fixture ${fixtureRef.fingerprint.slice(0,8)}</div></div>`;
}

function screenMarkup(screenId) {
  if (screenId === 'project-home') return projectHome();
  if (screenId === 'conversation') return conversation(false);
  if (screenId === 'structured-response') return conversation(true);
  if (screenId === 'evidence-context') return evidenceContext();
  if (screenId === 'approval') return approval();
  if (screenId === 'decision-detail') return decisionDetail();
  if (screenId === 'project-memory') return projectMemory();
  if (screenId === 'mobile-conversation') return mobileConversation();
  throw new Error(`Unknown screen ${screenId}`);
}

function mobileCss(worldId) {
  const shared = `.mobile-app{width:100vw;height:100vh;position:relative;background:var(--bg);overflow:hidden}.mobile-top{height:52px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 14px}.mobile-top b{font-family:var(--display)}.thread-trigger{font-size:9px;letter-spacing:.12em;text-transform:uppercase}.mobile-body{padding:18px 14px 90px}.mobile-body .bubble{font-size:12px}.mobile-card{margin-top:12px;padding-top:10px}.mobile-composer{left:12px;right:12px;bottom:14px;width:auto;transform:none}`;
  if (worldId === 'counterpoint') return `${shared}.mobile-top b{font-weight:400}.assistant-panel{border-top:2px solid var(--ink)}.mobile-card{border-top:1px solid var(--ink)}`;
  if (worldId === 'threshold') return `${shared}.assistant-panel{border:1px solid var(--ink);border-top:5px solid var(--accent);padding:11px}.mobile-card{border:1px solid var(--ink);border-top:5px solid var(--ink);padding:11px}.mobile-composer{border-width:1px 1px 5px}`;
  return `${shared}.assistant-panel{border-left:3px solid var(--accent);padding-left:14px}.mobile-card{border-left:3px solid var(--accent);padding:10px 10px 10px 14px;background:var(--surface)}.mobile-composer{border-radius:12px}`;
}

function html(worldId, screenId) {
  const world = WORLDS[worldId];
  const markup = screenMarkup(screenId);
  if (screenId === 'mobile-conversation') return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(world.label)} · ${esc(SCREEN_LABELS[screenId])}</title><style>${commonCss(world)}${mobileCss(worldId)}</style></head><body>${markup}</body></html>`;
  const showContext = ['conversation','structured-response','evidence-context'].includes(screenId);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(world.label)} · ${esc(SCREEN_LABELS[screenId])}</title><style>${commonCss(world)}${worldCss(worldId)}</style></head><body>${shell(worldId, screenId, markup, { showContext })}</body></html>`;
}

async function renderBoard(page, sourcePath, imagePath) {
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil:'load' });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout:10_000 });
  await page.screenshot({ path:imagePath, fullPage:true });
}

const canonicalMarkupFingerprints = Object.fromEntries(plan.screenIds.map((screenId) => [screenId, hash(screenMarkup(screenId))]));
const browser = await chromium.launch({ headless:true });
const renderedFrames = [];
try {
  for (const worldId of plan.explorationRef.worldIds) {
    for (const screenId of plan.screenIds) {
      const frameId = `${worldId}-${screenId}`;
      const isMobile = screenId === 'mobile-conversation';
      const sourcePath = path.join(sourceRoot, `${frameId}.html`);
      const imagePath = path.join(framesRoot, `${frameId}.png`);
      await fs.writeFile(sourcePath, html(worldId, screenId));
      const viewport = isMobile ? fixture.viewports.mobile : fixture.viewports.desktop;
      const page = await browser.newPage({ viewport, deviceScaleFactor:1 });
      await page.goto(pathToFileURL(sourcePath).href, { waitUntil:'load' });
      await page.screenshot({ path:imagePath, fullPage:false });
      await page.close();
      renderedFrames.push({
        frameId,
        worldId,
        screenId,
        imageRef:path.relative(repoRoot,imagePath).replaceAll('\\','/'),
        sourceRef:path.relative(repoRoot,sourcePath).replaceAll('\\','/'),
        interfaceArchitectureFingerprint: architectureRef.fingerprint,
        canonicalFixtureFingerprint: fixtureRef.fingerprint,
        canonicalMarkupFingerprint: canonicalMarkupFingerprints[screenId],
        viewport
      });
    }
  }

  for (const screenId of plan.screenIds) {
    const fingerprints = new Set(renderedFrames.filter((frame) => frame.screenId === screenId).map((frame) => frame.canonicalMarkupFingerprint));
    if (fingerprints.size !== 1) throw new Error(`Canonical copy/DOM drift detected across worlds for ${screenId}`);
  }

  const comparisonRefs=[];
  for (const screenId of plan.screenIds) {
    const isMobile = screenId === 'mobile-conversation';
    const img = (worldId) => pathToFileURL(path.join(framesRoot,`${worldId}-${screenId}.png`)).href;
    const board = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#deded9;font-family:Arial;padding:20px;color:#171717}h1{font-size:22px;margin:0 0 5px}p{font-size:11px;color:#666;margin:0 0 14px}.grid{display:grid;grid-template-columns:${isMobile?'repeat(3,390px)':'repeat(3,1fr)'};gap:12px;align-items:start}figure{margin:0;background:#fff;border:1px solid #bbb;padding:7px}img{width:100%;display:block}figcaption{font-size:12px;font-weight:700;padding:8px 2px 1px}</style></head><body><h1>${esc(SCREEN_LABELS[screenId])} · same canonical screen + fixture</h1><p>Same words, data, priority, functionality, viewport, interaction state, and screen identity. Only Creative World expression varies.</p><div class="grid">${plan.explorationRef.worldIds.map((worldId) => `<figure><img src="${img(worldId)}"><figcaption>${esc(WORLDS[worldId].label)}</figcaption></figure>`).join('')}</div></body></html>`;
    const sourcePath = path.join(comparisonRoot,`${screenId}-comparison.html`);
    const imagePath = path.join(comparisonRoot,`${screenId}-comparison.png`);
    await fs.writeFile(sourcePath,board);
    const page = await browser.newPage({ viewport:{ width:isMobile?1230:1800,height:isMobile?1000:1250 }, deviceScaleFactor:1 });
    await renderBoard(page,sourcePath,imagePath);
    await page.close();
    comparisonRefs.push(path.relative(repoRoot,imagePath).replaceAll('\\','/'));
  }

  const overviewRefs=[];
  for (const worldId of plan.explorationRef.worldIds) {
    const img = (screenId) => pathToFileURL(path.join(framesRoot,`${worldId}-${screenId}.png`)).href;
    const desktopIds = plan.screenIds.filter((id) => id !== 'mobile-conversation');
    const board = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#deded9;font-family:Arial;padding:22px;color:#171717}h1{font-size:24px;margin:0 0 5px}p{font-size:12px;color:#666;margin:0 0 16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;background:white;border:1px solid #bbb;padding:7px}img{width:100%;display:block}figcaption{font-size:11px;font-weight:700;padding:7px 2px}.mobile{width:390px;margin-top:14px}</style></head><body><h1>${esc(WORLDS[worldId].label)} · canonical AI Council UX</h1><p>Eight-screen proof bound to IA ${architectureRef.fingerprint} and fixture ${fixtureRef.fingerprint}. No human selection or final visual approval is implied.</p><div class="grid">${desktopIds.map((screenId) => `<figure><img src="${img(screenId)}"><figcaption>${esc(SCREEN_LABELS[screenId])}</figcaption></figure>`).join('')}</div><figure class="mobile"><img src="${img('mobile-conversation')}"><figcaption>Mobile Conversation Continuity</figcaption></figure></body></html>`;
    const sourcePath = path.join(overviewRoot,`${worldId}-overview.html`);
    const imagePath = path.join(overviewRoot,`${worldId}-overview.png`);
    await fs.writeFile(sourcePath,board);
    const page = await browser.newPage({viewport:{width:1500,height:3400},deviceScaleFactor:1});
    await renderBoard(page,sourcePath,imagePath);
    await page.close();
    overviewRefs.push(path.relative(repoRoot,imagePath).replaceAll('\\','/'));
  }

  const proof = buildInterfaceWorldProofEvidence({ plan, renderedFrames, comparisonRefs, overviewRefs });
  if (!proof.reviewReady) throw new Error(`Rendered canonical proof is incomplete: ${proof.findings.map((item) => item.code).join(', ')}`);
  const manifest = {
    ...proof,
    plan: {
      schema:plan.schema,
      projectId:plan.projectId,
      interfaceArchitectureRef:plan.interfaceArchitectureRef,
      canonicalFixtureRef:plan.canonicalFixtureRef,
      screenIds:plan.screenIds,
      worldIds:plan.explorationRef.worldIds,
      screenModel:plan.screenModel,
      statusTaxonomy:plan.statusTaxonomy,
      mobileNavigation:plan.mobileNavigation
    },
    canonicalMarkupFingerprints,
    renderedFrames,
    selection:null,
    selectedWorld:null,
    truth: {
      ...proof.truth,
      canonicalMarkupSharedAcrossWorlds: true,
      contextContentCoherent: fixture.truth.contextContentCoherent,
      memoryControlsStateAware: fixture.truth.memoryControlsStateAware,
      statusDimensionsSeparated: fixture.truth.statusDimensionsSeparated,
      mobileNavigationDefined: fixture.truth.mobileNavigationDefined,
      historicalMemoryPreservedOnRemoval: fixture.truth.historicalMemoryPreservedOnRemoval,
      humanVisualApproval: false,
      humanWorldSelectionConfirmed: false,
      finalUIApproved: false
    }
  };
  await fs.writeFile(path.join(outputRoot,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log(`Rendered ${renderedFrames.length} canonical AI Council interface-world frames from one shared semantic fixture.`);
} finally {
  await browser.close();
}
