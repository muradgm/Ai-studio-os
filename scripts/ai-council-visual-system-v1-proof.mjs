import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildVisualSystem } from '../modules/visual-system/runtime.mjs';
import { buildVisualSystemProofEvidence } from '../modules/visual-system/proof.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const hybridRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'hybrid-v1-head-to-head-proof');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'visual-system-v1-proof');
const canonicalRoot = path.join(outputRoot, 'canonical');
const stressRoot = path.join(outputRoot, 'stress');
const sourceRoot = path.join(outputRoot, 'source-html');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const architecture = buildProductUXArchitecture(await readJson(path.join(projectRoot, 'product-ux-architecture.json')));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await readJson(path.join(projectRoot, 'canonical-ux-fixture.json')), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const selection = await readJson(path.join(projectRoot, 'hybrid-v1-selection.json'));
const visualInput = await readJson(path.join(projectRoot, 'visual-system-v1.json'));
const system = buildVisualSystem(visualInput, { selection, architectureRef, fixtureRef });

if (!system.reviewReady) throw new Error(`Visual System V1 is not proof-ready: ${system.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [canonicalRoot, stressRoot, sourceRoot]) await fs.mkdir(dir, { recursive: true });

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
}
function semanticSource(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*fonts\.googleapis[^>]*>/gi, '')
    .replace(/<link[^>]*fonts\.gstatic[^>]*>/gi, '')
    .replace(/\sdata-visual-system="[^"]*"/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const fontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,400..600&display=swap" rel="stylesheet">`;

const VS_CSS = `
:root{
  --bg:#F2F4F1!important;--surface:#FAFBF9!important;--raised:#FFFFFF!important;--ink:#151A16!important;--muted:#667069!important;--line:#D4DAD4!important;
  --lineage:#2F684E!important;--evidence:#5D527B!important;--consequence:#D84A34!important;--focus:#245BDB!important;
  --display:'Newsreader',Georgia,serif!important;--body:'Inter',Arial,sans-serif!important;--mono:'IBM Plex Mono',monospace!important;
}
body{font-family:var(--body)!important;background:var(--bg)!important;color:var(--ink)!important}
.shell{grid-template-columns:202px minmax(0,1fr) 272px!important}
.side{background:color-mix(in srgb,var(--surface) 82%,transparent)!important;border-right:1px solid var(--line)!important;padding:20px 16px!important}
.side .brand{font-family:var(--body)!important;font-size:15px!important;font-weight:650!important;letter-spacing:-.025em!important}
.side h6{color:var(--muted)!important;letter-spacing:.08em!important}.nav{font-family:var(--body)!important;font-size:12px!important;padding:8px 6px!important}.nav.active:before{background:var(--lineage)!important;width:2px!important}
.top{height:62px!important;margin:0 30px!important;border-bottom:1px solid var(--line)!important}.top .path{font-family:var(--body)!important;font-size:12px!important}
.center{inset:62px 0 0!important}.context{background:color-mix(in srgb,var(--surface) 72%,transparent)!important;border-left:1px solid var(--line)!important;padding:22px 20px!important}.context .small,.context .clean li{font-size:11px!important;line-height:1.5!important;color:var(--muted)!important}
.content{padding:34px 40px!important}.eyebrow{font-family:var(--body)!important;color:var(--lineage)!important;font-weight:600!important;letter-spacing:.06em!important}.hero{font-family:var(--display)!important;font-weight:470!important;font-size:clamp(38px,3.2vw,52px)!important;line-height:1.01!important;letter-spacing:-.035em!important;max-width:820px}
.bodycopy{font-family:var(--body)!important;font-size:14.5px!important;line-height:1.62!important;max-width:72ch}.small{font-size:11px!important}.micro,.section-label{font-family:var(--body)!important;letter-spacing:.06em!important;text-transform:uppercase!important;font-size:9px!important}
.card,.assistant-panel,.memory-item{background:transparent!important;border:0!important;border-top:1px solid var(--line)!important;padding:14px 0!important;box-shadow:none!important;margin-left:0!important}.card:before,.assistant-panel:before,.memory-item:before{display:none!important}.card.emphasis{border-top:2px solid var(--lineage)!important}.card.secondary{border-top:2px solid var(--evidence)!important}.card h3,.memory-item h3{font-family:var(--body)!important;font-size:17px!important;font-weight:600!important;line-height:1.25!important}
.status-row{font-family:var(--body)!important;font-size:10px!important;padding:7px 0!important}.button{font-family:var(--body)!important;text-transform:none!important;letter-spacing:0!important;font-size:11px!important;border:1px solid color-mix(in srgb,var(--ink) 70%,transparent)!important;border-radius:8px!important;padding:9px 12px!important}.button.primary{background:var(--ink)!important;color:var(--surface)!important}.pill{font-family:var(--body)!important;text-transform:none!important;letter-spacing:0!important;border-radius:999px!important;font-size:10px!important}
.composer{background:var(--raised)!important;border:1px solid var(--line)!important;border-radius:15px!important;box-shadow:0 9px 32px rgba(20,30,22,.055)!important}.send{background:var(--ink)!important;color:var(--surface)!important;border-radius:50%!important}
body[data-proof-screen='conversation'] .assistant-panel,body[data-proof-screen='structured-response'] .assistant-panel,body[data-proof-screen='evidence-context'] .assistant-panel{border-top:1px solid color-mix(in srgb,var(--ink) 72%,transparent)!important;padding-top:18px!important}
body[data-proof-screen='conversation'] .assistant-panel .bodycopy,body[data-proof-screen='structured-response'] .assistant-panel .bodycopy,body[data-proof-screen='evidence-context'] .assistant-panel .bodycopy{font-family:var(--body)!important;font-size:15.5px!important;line-height:1.58!important;max-width:68ch!important}
body[data-proof-screen='structured-response'] .assistant-panel .bodycopy:first-of-type{font-family:var(--display)!important;font-size:22px!important;line-height:1.32!important;max-width:50ch!important}
body[data-proof-screen='project-home'] .card.emphasis{border-left:2px solid var(--lineage)!important;border-top:1px solid var(--line)!important;padding-left:18px!important}
body[data-proof-screen='decision-detail'] .decision-grid{position:relative;padding-left:22px!important}body[data-proof-screen='decision-detail'] .decision-grid:before{content:'';position:absolute;left:5px;top:5px;bottom:6px;width:1px;background:var(--lineage)}
body[data-proof-screen='decision-detail'] .card.emphasis,body[data-proof-screen='decision-detail'] .card.secondary{padding-left:14px!important;position:relative}body[data-proof-screen='decision-detail'] .card.emphasis:after,body[data-proof-screen='decision-detail'] .card.secondary:after{content:'';position:absolute;left:-21px;top:18px;width:7px;height:7px;border:1.5px solid var(--lineage);background:var(--bg);border-radius:50%}
body[data-proof-screen='project-memory'] .memory-grid{gap:22px!important}.removal-note{background:color-mix(in srgb,var(--surface) 76%,transparent)!important;border-left:2px solid var(--lineage)!important}
body[data-proof-screen='approval']{--accent:var(--consequence)!important}body[data-proof-screen='approval'] .content{border-top:6px solid var(--consequence)!important;padding-top:27px!important}body[data-proof-screen='approval'] .eyebrow{color:var(--consequence)!important;font-weight:700!important}body[data-proof-screen='approval'] .button.primary{background:var(--consequence)!important;border-color:var(--consequence)!important;color:white!important}body[data-proof-screen='approval'] .card.emphasis{border-top-color:var(--consequence)!important}
body[data-proof-screen='mobile-conversation'] .mobile-top{background:var(--surface)!important}body[data-proof-screen='mobile-conversation'] .mobile-top b{font-family:var(--body)!important;font-weight:650!important}body[data-proof-screen='mobile-conversation'] .assistant-panel{border-top:1px solid var(--line)!important;padding-top:14px!important}body[data-proof-screen='mobile-conversation'] .assistant-panel .bodycopy{font-family:var(--body)!important;font-size:15px!important;line-height:1.58!important}body[data-proof-screen='mobile-conversation'] .mobile-card{background:transparent!important;border:0!important;border-top:1px solid var(--line)!important;padding:10px 0 0!important}
code,pre,.code{font-family:var(--mono)!important}
:focus-visible{outline:2px solid var(--focus)!important;outline-offset:2px}
`;

function applyVisualSystem(html) {
  const withFonts = html.replace('</head>', `${fontLinks}<style data-visual-system-v1>${VS_CSS}</style></head>`);
  return withFonts.replace(/<body([^>]*)>/i, (_match, attrs) => `<body${attrs} data-visual-system="visual-system-v1">`);
}

const C = fixture.conversation;
const D = fixture.decision;
const P = fixture.projectState;
const sourceRow = (i, kind='Repository') => `<div class="source-row"><div><b>${kind} ${i}</b><div class="meta">packages/ai-core/example-${i}.ts · 23 Aug 2026</div></div><p>Relevant evidence excerpt ${i}: contract behavior, validation state, and why Council used this source for the current decision.</p><span>Inspect</span></div>`;
const memoryRow = (i) => `<div class="memory-row"><div><b>${i % 3 === 0 ? 'Decision' : i % 3 === 1 ? 'Constraint' : 'Assumption'}</b><span>${i % 5 === 0 ? 'Proposed' : 'Confirmed'}</span></div><p>${i % 2 ? 'Routing remains advisory until the reliability benchmark passes.' : 'Preserve deterministic contract validation before model-authored strategy claims.'}</p><small>Updated 23 Aug · Edit · ${i % 5 === 0 ? 'Confirm · Reject' : 'Supersede · Remove from active memory'}</small></div>`;

function stressContent(id) {
  if (id === 'short-answer') return `<div class="userq">Should we start Routing Intelligence now?</div><article class="answer"><div class="kicker">AI Council</div><h1>Not yet.</h1><p>Finish the reliability benchmark first. Routing authority should remain advisory until the benchmark clears the agreed threshold.</p><div class="inline-actions">Evidence <b>4 sources</b> · Authority <b>Advisory</b></div></article>`;
  if (id === 'long-answer') return `<div class="userq">Review the current architecture and tell me what should happen next.</div><article class="answer long"><div class="kicker">AI Council · considered judgment</div><h1>Keep the control plane stable and finish the reliability gate before expanding authority.</h1>${Array.from({length:8},(_,i)=>`<section><h2>${i+1}. ${['Current position','Why the bottleneck is not language','Reliability evidence','Routing consequences','Memory authority','Execution safety','What remains uncertain','Recommended next move'][i]}</h2><p>The repository evidence points to decision quality, contract consistency, explicit authority boundaries, and verification as the critical constraints. Rewriting implementation language would create migration cost without addressing the governing reliability question. The next move should preserve reversibility and make success criteria observable.</p><ul><li>Preserve current source-of-truth contracts.</li><li>Keep routing advisory until evidence is sufficient.</li><li>Record the decision and remaining uncertainty.</li></ul></section>`).join('')}</article>`;
  if (id === 'code-heavy-answer') return `<article class="answer"><div class="kicker">AI Council · implementation review</div><h1>Keep the boundary explicit in code.</h1><p>Use the existing TypeScript control plane and make authority a typed contract rather than an implicit router side effect.</p>${[1,2,3].map((n)=>`<div class="codeblock"><div>packages/ai-core/routing-${n}.ts</div><pre><code>export function authorizeRouting(input: RoutingInput) {\n  const evidence = validateEvidence(input.evidence);\n  if (!evidence.pass) return { status: 'advisory' as const };\n  return { status: input.approved ? 'authorized' : 'approval-required' as const };\n}</code></pre></div><p>Keep validation and model claims separate so the UI can explain why authority is withheld.</p>`).join('')}</article>`;
  if (id === 'dense-evidence') return `<article class="answer"><div class="kicker">Evidence · 8 sources</div><h1>Evidence used for this recommendation</h1><div class="source-list">${Array.from({length:8},(_,i)=>sourceRow(i+1,i%3===0?'Conversation':i%3===1?'Repository':'Decision')).join('')}</div></article>`;
  if (id === 'ten-plus-sources') return `<article class="answer"><div class="kicker">Evidence · 12 sources</div><h1>Source set</h1><div class="source-list compact">${Array.from({length:12},(_,i)=>sourceRow(i+1,i%2?'Repository':'Project memory')).join('')}</div></article>`;
  if (id === 'multi-stage-recommendation') return `<article class="answer"><div class="kicker">Structured recommendation</div><h1>${esc(C.recommendation)}</h1><div class="recommend-sections"><section><h2>Why</h2><p>${esc(C.why)}</p></section><section><h2>Alternatives</h2><ul>${D.alternatives.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section><section><h2>Constraints</h2><p>Reliability remains advisory. Hard contracts cannot be traded for aesthetic simplicity.</p></section><section><h2>Risks</h2><p>A rewrite creates migration surface while leaving decision reliability unresolved.</p></section><section><h2>Remaining uncertainty</h2><p>${esc(D.remainingUncertainty)}</p></section><section class="next"><h2>Next move</h2><p>${esc(C.nextAction)}</p></section></div></article>`;
  if (id === 'tool-execution') return `<article class="answer"><div class="kicker">Approved action · execution</div><h1>Create branch and prepare the routing slice.</h1><div class="execution">${['Plan approved','Branch created','12 files inspected','Implementation running','Tests running','Verification pending'].map((x,i)=>`<div class="exec-row ${i<4?'done':i===4?'running':''}"><span>${i<4?'✓':i===4?'→':'○'}</span><b>${x}</b><small>${i<4?'complete':i===4?'in progress':'waiting'}</small></div>`).join('')}</div><div class="toolnote">Raw tool payloads and logs remain inspectable, not permanently expanded.</div></article>`;
  if (id === 'error-state') return `<article class="answer"><div class="kicker error-kicker">Execution failed · no mainline change</div><h1>The branch was created, but validation failed.</h1><div class="errorbox"><b>Browser proof failed on mobile evidence overflow.</b><p>Impact: the proposed changes are not merge-ready. Main remains unchanged.</p><div>Recovery · Fix overflow → rerun validation → review changed proof</div></div><h2>What remains valid</h2><p>The selected world, project context, and decision record are unchanged. Council will not retry external mutation without a valid next action.</p></article>`;
  if (id === 'streaming-state') return `<article class="answer"><div class="workstate"><span class="marks">› › ›</span><div><b>Reviewing project context</b><small>Using current project memory and repository evidence</small></div></div><div class="userq">What should we do next?</div><div class="streaming"><div class="kicker">AI Council</div><p>Finish the reliability benchmark before changing routing authority. The current evidence suggests…</p><span class="stream-caret"></span></div><div class="state-note">High-level lifecycle state only · no hidden chain-of-thought telemetry</div></article>`;
  if (id === 'very-long-project-memory') return `<article class="answer memory-stress"><div class="kicker">Project Memory · 30 records</div><h1>What Council currently believes remains relevant</h1><div class="memory-filters">Decisions · Constraints · Assumptions · Superseded · Proposed</div><div class="memory-list">${Array.from({length:30},(_,i)=>memoryRow(i+1)).join('')}</div></article>`;
  throw new Error(`Unknown stress state ${id}`);
}

function stressHtml(id) {
  return `<!doctype html><html><head><meta charset="utf-8">${fontLinks}<style>${VS_CSS}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink)}body{min-width:1180px}.stress-shell{display:grid;grid-template-columns:202px minmax(0,1fr) 272px;min-height:100vh}.stress-side{padding:22px 16px;border-right:1px solid var(--line);background:var(--surface)}.stress-side strong{font-size:15px}.stress-side h6{margin:28px 0 8px;color:var(--muted);font-size:9px;text-transform:uppercase}.stress-side div{font-size:12px;padding:7px 0}.stress-main{padding:28px 42px 80px;max-width:960px}.stress-context{padding:22px 18px;border-left:1px solid var(--line);background:color-mix(in srgb,var(--surface) 70%,transparent)}.stress-context h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em}.stress-context p{font-size:11px;color:var(--muted);line-height:1.55}.userq{margin:18px 0 30px auto;max-width:580px;padding:12px 14px;background:var(--raised);border:1px solid var(--line);border-radius:12px;font-size:14px}.answer{border-top:1px solid var(--ink);padding-top:18px}.answer h1{font-family:var(--display);font-size:40px;line-height:1.07;font-weight:480;letter-spacing:-.03em;max-width:25ch;margin:8px 0 20px}.answer h2{font-size:14px;margin:28px 0 8px}.answer p,.answer li{font-size:14.5px;line-height:1.62;max-width:72ch}.answer.long h1{font-size:34px}.answer.long h2{font-family:var(--display);font-size:22px;font-weight:500}.kicker{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--lineage);font-weight:650}.inline-actions,.state-note,.toolnote,.memory-filters{font-size:11px;color:var(--muted);margin-top:20px}.codeblock{margin:20px 0;border-top:1px solid var(--line);padding-top:8px}.codeblock>div{font-size:10px;color:var(--muted);margin-bottom:7px}.codeblock pre{margin:0;background:#E8ECE7;padding:16px;overflow:auto;border-radius:8px;font:13px/1.58 var(--mono)}.source-row{display:grid;grid-template-columns:180px minmax(0,1fr) 54px;gap:16px;padding:12px 0;border-top:1px solid var(--line);align-items:start}.source-row b{font-size:11px}.source-row p{font-size:11px;line-height:1.48;margin:0}.source-row span{font-size:10px;color:var(--evidence)}.meta{font-size:9px;color:var(--muted);margin-top:3px}.source-list.compact .source-row{padding:8px 0}.recommend-sections{display:grid;grid-template-columns:1fr 1fr;gap:0 28px}.recommend-sections section{border-top:1px solid var(--line)}.recommend-sections .next{border-top:2px solid var(--lineage)}.execution{margin-top:24px}.exec-row{display:grid;grid-template-columns:22px 1fr 100px;padding:11px 0;border-top:1px solid var(--line);font-size:12px}.exec-row small{text-align:right;color:var(--muted)}.exec-row.done span{color:var(--lineage)}.exec-row.running{border-top-color:var(--evidence)}.error-kicker{color:var(--consequence)}.errorbox{border-top:4px solid var(--consequence);padding:16px 0;margin:20px 0}.errorbox b{font-size:16px}.workstate{display:flex;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line);font-size:12px}.workstate small{display:block;color:var(--muted);margin-top:3px}.marks{color:var(--lineage);letter-spacing:3px}.streaming{margin-top:20px}.streaming p{font-size:15.5px}.stream-caret{display:inline-block;width:14px;height:1px;background:var(--lineage)}.memory-list{margin-top:18px}.memory-row{display:grid;grid-template-columns:190px minmax(0,1fr) 260px;gap:14px;padding:9px 0;border-top:1px solid var(--line);align-items:start}.memory-row div{display:flex;justify-content:space-between;gap:10px;font-size:10px}.memory-row p{font-size:11px;line-height:1.45;margin:0}.memory-row small{font-size:9px;color:var(--muted)}
</style></head><body data-visual-system="visual-system-v1" data-stress="${esc(id)}"><div class="stress-shell"><aside class="stress-side"><strong>AI Council</strong><h6>Project</h6><div>AI Council</div><h6>Conversations</h6><div>Architecture</div><div>Cognitive Reliability</div><div>Routing Intelligence</div><div>Memory Architecture</div></aside><main class="stress-main">${stressContent(id)}</main><aside class="stress-context"><h3>Current context</h3><p>${esc(fixture.currentContext.label)}</p><p>${esc(fixture.currentContext.goal)}</p><h3>Project</h3><p>${esc(P.currentFocus)} · ${P.activeTasks} active tasks · ${P.blockers} blockers</p></aside></div></body></html>`;
}

async function loadFonts(page) {
  await page.waitForFunction(async () => { await document.fonts.ready; return document.fonts.check('16px Inter') && document.fonts.check('16px Newsreader') && document.fonts.check('13px "IBM Plex Mono"'); }, null, { timeout: 20_000 });
}
async function render(page, sourcePath, imagePath, { fullPage = false } = {}) {
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'networkidle' });
  await loadFonts(page);
  await page.screenshot({ path: imagePath, fullPage });
}
async function board(browser, title, subtitle, items, outputName, width = 1540) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#DDE1DC;font-family:Arial;padding:22px;color:#151A16}h1{font-size:24px;margin:0 0 5px}p{font-size:12px;color:#626762;margin:0 0 16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;background:white;border:1px solid #BDC4BD;padding:7px}img{width:100%;display:block}figcaption{font-size:11px;font-weight:700;padding:7px 2px}</style></head><body><h1>${esc(title)}</h1><p>${esc(subtitle)}</p><div class="grid">${items.map(x=>`<figure><img src="${pathToFileURL(x.image).href}"><figcaption>${esc(x.label)}</figcaption></figure>`).join('')}</div></body></html>`;
  const source = path.join(outputRoot, `${outputName}.html`); const image = path.join(outputRoot, `${outputName}.png`); await fs.writeFile(source, html);
  const page = await browser.newPage({ viewport: { width, height: 3400 }, deviceScaleFactor: 1 }); await page.goto(pathToFileURL(source).href,{waitUntil:'load'}); await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:10000}); await page.screenshot({path:image,fullPage:true}); await page.close(); return path.relative(repoRoot,image).split(path.sep).join('/');
}

const browser = await chromium.launch({ headless: true });
const canonicalFrames = []; const stressFrames = [];
try {
  for (const screenId of system.canonicalScreenIds) {
    const basePath = path.join(hybridRoot, 'source-html', `decision-spine-counterpoint-hybrid-v1-${screenId}.html`);
    const baseHtml = await fs.readFile(basePath, 'utf8');
    const semanticFingerprint = hash(semanticSource(baseHtml));
    const html = applyVisualSystem(baseHtml);
    if (hash(semanticSource(html)) !== semanticFingerprint) throw new Error(`Visual System changed canonical semantic markup for ${screenId}`);
    const sourcePath = path.join(sourceRoot, `canonical-${screenId}.html`); const imagePath = path.join(canonicalRoot, `${screenId}.png`); await fs.writeFile(sourcePath, html);
    const viewport = screenId === 'mobile-conversation' ? fixture.viewports.mobile : fixture.viewports.desktop;
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 }); await render(page, sourcePath, imagePath); await page.close();
    canonicalFrames.push({ screenId, imageRef:path.relative(repoRoot,imagePath).split(path.sep).join('/'), sourceRef:path.relative(repoRoot,sourcePath).split(path.sep).join('/'), semanticFingerprint, semanticFixtureInvariant:true });
  }

  for (const stress of system.stressTests) {
    const sourcePath = path.join(sourceRoot, `stress-${stress.id}.html`); const imagePath = path.join(stressRoot, `${stress.id}.png`); await fs.writeFile(sourcePath, stressHtml(stress.id));
    const page = await browser.newPage({ viewport:{width:1440,height:1000}, deviceScaleFactor:1 }); await render(page,sourcePath,imagePath,{fullPage:true}); await page.close();
    stressFrames.push({ stressId:stress.id, imageRef:path.relative(repoRoot,imagePath).split(path.sep).join('/'), sourceRef:path.relative(repoRoot,sourcePath).split(path.sep).join('/') });
  }

  const canonicalOverview = await board(browser,'AI Council Visual System V1 · canonical screens','Human-selected Hybrid V1 · Newsreader + Inter · semantic lineage · rare consequence state',canonicalFrames.map(x=>({image:path.join(repoRoot,x.imageRef),label:x.screenId})),'canonical-overview');
  const stressOverview = await board(browser,'AI Council Visual System V1 · stress states','Dense and edge cases are part of the visual-system gate, not late QA.',stressFrames.map(x=>({image:path.join(repoRoot,x.imageRef),label:x.stressId})),'stress-overview');
  const proof = buildVisualSystemProofEvidence({ system, canonicalFrames, stressFrames, overviewRefs:[canonicalOverview,stressOverview] });
  if (!proof.reviewReady) throw new Error(`Visual System proof incomplete: ${proof.findings.map(x=>x.code).join(', ')}`);
  await fs.writeFile(path.join(outputRoot,'manifest.json'),JSON.stringify({ ...proof, tokens:{typography:system.typography,color:system.color,spacingDensity:system.spacingDensity,iconography:system.iconography,motion:system.motion,responsive:system.responsive}, truth:{...proof.truth,humanVisualApproval:false,finalVisualSystemApproved:false}},null,2));
  console.log(`Rendered ${canonicalFrames.length} canonical Visual System frames and ${stressFrames.length} stress frames.`);
} finally { await browser.close(); }
