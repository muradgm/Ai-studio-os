import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildMotionSystem, validateMotionPresentation } from '../modules/motion-system/runtime.mjs';
import { buildMotionSystemProofEvidence } from '../modules/motion-system/proof.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const visualProofRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'visual-system-v1-proof');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'motion-system-v1-proof');
const canonicalRoot = path.join(outputRoot, 'canonical-clips');
const scenarioRoot = path.join(outputRoot, 'scenario-clips');
const sourceRoot = path.join(outputRoot, 'source-html');
const endFrameRoot = path.join(outputRoot, 'end-frames');
const tempVideoRoot = path.join(outputRoot, '.video-temp');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const architecture = buildProductUXArchitecture(await readJson(path.join(projectRoot, 'product-ux-architecture.json')));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await readJson(path.join(projectRoot, 'canonical-ux-fixture.json')), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const selection = await readJson(path.join(projectRoot, 'hybrid-v1-selection.json'));
const visualInput = await readJson(path.join(projectRoot, 'visual-system-v1.json'));
const motionInput = await readJson(path.join(projectRoot, 'motion-system-v1.json'));
const system = buildMotionSystem(motionInput, {
  selection,
  visualSystemId: visualInput.id,
  architectureRef,
  fixtureRef
});
if (!system.reviewReady) throw new Error(`Motion System V1 is not proof-ready: ${system.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [canonicalRoot, scenarioRoot, sourceRoot, endFrameRoot, tempVideoRoot]) await fs.mkdir(dir, { recursive: true });

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}
function rel(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}
function eventSpec(id) {
  return system.eventVocabulary.find((event) => event.id === id) ?? { id, copy: id, class: 'working' };
}
function proofEvent(id, sequence = 0) {
  const spec = eventSpec(id);
  const event = { id, sequence, status: 'active', copy: spec.copy, stateClass: spec.class };
  if (spec.dynamicParticipant) event.participant = sequence % 2 ? 'Security' : 'Architecture';
  if (spec.dynamicOperation) {
    event.operationId = `proof-operation-${sequence + 1}`;
    event.label = sequence % 2 ? 'Running validation' : 'Applying repository changes';
  }
  return event;
}

const motionCss = `
<style data-motion-system-v1>
  .motion-proof-tag{position:fixed;right:14px;bottom:12px;z-index:99999;font:600 9px/1.2 Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#667069;background:rgba(250,251,249,.94);border:1px solid #D4DAD4;border-radius:999px;padding:6px 9px;pointer-events:none}
  .motion-runtime-status{position:fixed;left:50%;top:76px;transform:translateX(-50%);z-index:99998;display:flex;align-items:center;gap:10px;min-width:260px;max-width:min(560px,70vw);padding:9px 12px;border:1px solid #D4DAD4;border-radius:10px;background:rgba(250,251,249,.96);box-shadow:0 8px 24px rgba(20,30,22,.06);font:500 11px/1.35 Inter,Arial,sans-serif;color:#151A16;opacity:0}
  .motion-runtime-status[data-state='reasoning-status']{border-color:rgba(93,82,123,.38)}
  .motion-runtime-status[data-state='execution-progress']{border-color:rgba(216,74,52,.5)}
  .motion-track{position:relative;width:42px;height:1px;background:#D4DAD4;overflow:hidden;flex:0 0 42px}
  .motion-tick{position:absolute;top:-1px;left:-14px;width:14px;height:3px;background:#2F684E;transform:translateX(0)}
  .motion-runtime-status[data-state='reasoning-status'] .motion-tick{background:#5D527B}
  .motion-runtime-status[data-state='execution-progress'] .motion-tick{background:#D84A34}
  .motion-runtime-status.is-active{opacity:1;transition:opacity 180ms ease}
  body[data-motion-event='approval-required'] .content{animation:authoritySettle 540ms cubic-bezier(.2,.72,.2,1) both}
  body[data-motion-event='decision-lineage-loaded'] .decision-grid{animation:lineageSettle 420ms ease-out both}
  body[data-motion-event='memory-superseded'] .memory-item:first-child{animation:memoryRecede 420ms ease-out both}
  @keyframes authoritySettle{0%{transform:translateY(-5px);filter:saturate(.72)}100%{transform:none;filter:none}}
  @keyframes lineageSettle{0%{opacity:.72;transform:translateY(4px)}100%{opacity:1;transform:none}}
  @keyframes memoryRecede{0%{opacity:1}100%{opacity:.62}}
  @media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}.motion-tick{display:none!important}.motion-runtime-status{transform:translateX(-50%)!important}}
</style>`;

function canonicalSequence(screenId) {
  const byScreen = {
    'project-home': ['project-context-load-started', 'project-context-load-completed', 'execution-completed'],
    'conversation': ['task-understanding-started', 'project-context-load-started', 'response-section-ready'],
    'structured-response': ['council-review-started', 'strategy-comparison-started', 'strategy-comparison-completed', 'response-section-ready'],
    'evidence-context': ['project-context-load-started', 'evidence-search-started', 'evidence-source-added', 'evidence-search-completed'],
    'approval': ['verification-completed', 'approval-required'],
    'decision-detail': ['decision-lineage-loaded', 'verification-completed'],
    'project-memory': ['memory-superseded', 'memory-activated'],
    'mobile-conversation': ['ui-project-navigation-opened', 'task-understanding-started', 'response-section-ready']
  };
  return byScreen[screenId] ?? [];
}

function animationScript(events, { screenId = null, reducedMotion = false } = {}) {
  const dwell = reducedMotion ? 180 : Math.max(system.speedHierarchy.workingMessageMinDwellMs, 1200);
  return `<script>
  const proofEvents=${JSON.stringify(events)};
  const status=document.querySelector('.motion-runtime-status');
  const statusText=status.querySelector('.motion-status-text');
  const tick=status.querySelector('.motion-tick');
  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
  const animateTarget=(eventId)=>{
    const body=document.body; body.dataset.motionEvent=eventId;
    const map={
      'task-understanding-started':'.assistant-panel,.composer',
      'project-context-load-started':'.context,.card',
      'project-context-load-completed':'.context',
      'evidence-search-started':'.context,.source-row,.card',
      'evidence-source-added':'.context .clean li,.card.secondary',
      'council-review-started':'.assistant-panel',
      'strategy-comparison-started':'.recommend-grid,.assistant-panel',
      'strategy-comparison-completed':'.recommend-grid .card,.assistant-panel',
      'response-section-ready':'.assistant-panel,.card,.mobile-card',
      'verification-completed':'.status-row,.card.emphasis',
      'approval-required':'.content,.approval-grid,.button.primary',
      'decision-lineage-loaded':'.decision-grid,.card.emphasis,.card.secondary',
      'memory-superseded':'.memory-item',
      'memory-activated':'.memory-item.emphasis,.removal-note',
      'ui-project-navigation-opened':'.mobile-top,.mobile-card',
      'execution-completed':'.card.emphasis,.status-row'
    };
    const els=[...document.querySelectorAll(map[eventId]||'.content')].slice(0,5);
    els.forEach((el,i)=>el.animate([{opacity:.68,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:${reducedMotion ? 1 : 240}+i*20,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'}));
  };
  window.__motionProof={done:false,events:[],screenId:${JSON.stringify(screenId)},reducedMotion:${reducedMotion}};
  (async()=>{
    await sleep(${reducedMotion ? 80 : 260});
    for(const event of proofEvents){
      status.dataset.state=event.stateClass;
      statusText.textContent=(event.participant?event.participant+' · ':'')+(event.label||event.copy);
      status.classList.add('is-active');
      if(tick && getComputedStyle(tick).display!=='none') tick.animate([{transform:'translateX(0)'},{transform:'translateX(56px)'}],{duration:${reducedMotion ? 1 : 760},easing:'cubic-bezier(.2,.7,.25,1)'});
      animateTarget(event.id);
      window.__motionProof.events.push({...event,shownAt:performance.now()});
      await sleep(${dwell});
    }
    status.classList.remove('is-active');
    await sleep(${reducedMotion ? 40 : 260});
    window.__motionProof.runningAnimations=document.getAnimations().filter(a=>a.playState==='running').length;
    window.__motionProof.done=true;
  })();
</script>`;
}

function injectCanonicalMotion(html, screenId, events) {
  const ui = `<div class="motion-proof-tag">Proof fixture · runtime event choreography</div><div class="motion-runtime-status" role="status" aria-live="polite"><span class="motion-track" aria-hidden="true"><span class="motion-tick"></span></span><span class="motion-status-text">Ready</span></div>`;
  return html.replace('</head>', `${motionCss}</head>`).replace('</body>', `${ui}${animationScript(events, { screenId })}</body>`);
}

function scenarioHtml(scenario, events, { reducedMotion = false } = {}) {
  const title = scenario.id.replaceAll('-', ' ');
  const rows = events.map((event, index) => `<li data-event-row="${esc(event.id)}"><span class="state-dot"></span><div><b>${esc(event.participant ? `${event.participant} · ${event.label || event.copy}` : event.label || event.copy)}</b><small>${esc(event.id)} · proof fixture event ${index + 1}</small></div></li>`).join('');
  const consequence = events.some((event) => ['approval-required','action-authorized','execution-step-started','validation-started','action-failed'].includes(event.id));
  const lineage = events.some((event) => ['decision-lineage-loaded','memory-superseded','memory-activated'].includes(event.id));
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}body{margin:0;background:#F2F4F1;color:#151A16;font-family:Arial,sans-serif}.lab{min-height:100vh;padding:34px 40px}.tag{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#667069}.head{max-width:760px;margin:54px auto 0}.head h1{font-family:Georgia,serif;font-weight:400;font-size:42px;line-height:1;margin:8px 0 14px}.head p{color:#667069;line-height:1.55}.surface{max-width:760px;margin:30px auto;background:#FAFBF9;border:1px solid #D4DAD4;border-radius:14px;padding:22px 24px;position:relative;overflow:hidden}.surface:before{content:'';display:${consequence ? 'block' : 'none'};position:absolute;left:0;top:0;bottom:0;width:4px;background:#D84A34;transform:scaleY(0);transform-origin:top}.surface.authority:before{animation:boundary 520ms cubic-bezier(.2,.72,.2,1) forwards}.status{display:flex;align-items:center;gap:10px;min-height:32px;padding-bottom:14px;border-bottom:1px solid #D4DAD4;font-size:12px;font-weight:600}.track{width:54px;height:1px;background:#D4DAD4;position:relative;overflow:hidden}.tick{position:absolute;width:16px;height:3px;top:-1px;left:-16px;background:#2F684E}.status[data-class='reasoning-status'] .tick{background:#5D527B}.status[data-class='execution-progress'] .tick{background:#D84A34}.steps{list-style:none;padding:0;margin:14px 0 0}.steps li{display:grid;grid-template-columns:16px 1fr;gap:10px;padding:11px 0;border-bottom:1px solid #E2E6E2;opacity:.38;transform:translateY(2px)}.steps li.current{opacity:1;transform:none}.steps li.complete{opacity:.72}.state-dot{width:7px;height:7px;border-radius:50%;border:1.5px solid #88918B;margin-top:4px}.current .state-dot{border-color:#2F684E;background:#2F684E}.complete .state-dot{border-color:#317255;background:#317255}.steps b{font-size:12px}.steps small{display:block;color:#7A837D;margin-top:3px;font-size:9px}.lineage{display:${lineage ? 'flex' : 'none'};gap:0;margin-top:20px;align-items:center}.lineage span{font-size:11px;border:1px solid #C7CEC8;padding:8px 10px;border-radius:8px;background:#fff}.lineage i{width:0;height:1px;background:#2F684E;display:block}.lineage.active i{animation:line 420ms ease-out forwards}@keyframes line{to{width:42px}}@keyframes boundary{to{transform:scaleY(1)}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}.tick{display:none!important}.steps li{transform:none!important}.lineage i{width:42px!important}}
  </style></head><body><main class="lab"><div class="tag">Motion System V1 · proof fixture · not production telemetry</div><section class="head"><div class="tag">${esc(scenario.screenId)} · ${reducedMotion ? 'reduced motion' : 'runtime state'}</div><h1>${esc(title)}</h1><p>Only event-backed state is animated. This proof uses labeled fixture events to validate choreography before production runtime adapters exist.</p></section><section class="surface" id="surface"><div class="status" id="status"><span class="track"><span class="tick" id="tick"></span></span><span id="statusText">Waiting for fixture event…</span></div><ol class="steps" id="steps">${rows}</ol><div class="lineage" id="lineage"><span>Evidence</span><i></i><span>Decision</span><i></i><span>Outcome</span></div></section></main>${animationScript(events, { screenId: scenario.screenId, reducedMotion }).replace("const status=document.querySelector('.motion-runtime-status');", "const status=document.getElementById('status');").replace("const statusText=status.querySelector('.motion-status-text');", "const statusText=document.getElementById('statusText');").replace("const tick=status.querySelector('.motion-tick');", "const tick=document.getElementById('tick');").replace("status.classList.add('is-active');", "status.classList.add('is-active'); const rows=[...document.querySelectorAll('[data-event-row]')]; const row=rows.find(r=>r.dataset.eventRow===event.id); rows.filter(r=>r.classList.contains('current')).forEach(r=>{r.classList.remove('current');r.classList.add('complete')}); if(row) row.classList.add('current'); if(event.id==='approval-required') document.getElementById('surface').classList.add('authority'); if(['decision-lineage-loaded','memory-superseded'].includes(event.id)) document.getElementById('lineage').classList.add('active');").replace("status.classList.remove('is-active');", "const current=document.querySelector('.steps li.current'); if(current){current.classList.remove('current');current.classList.add('complete')}")}</body></html>`;
}

async function recordHtml(browser, sourcePath, videoPath, endFramePath, { viewport, reducedMotion = 'no-preference', timeoutMs = 30_000 } = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion,
    recordVideo: { dir: tempVideoRoot, size: viewport }
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__motionProof?.done === true, null, { timeout: timeoutMs });
  const proofState = await page.evaluate(() => ({
    ...window.__motionProof,
    reducedMotionMedia: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }));
  await page.screenshot({ path: endFramePath, fullPage: false });
  const video = page.video();
  await page.close();
  await context.close();
  if (!video) throw new Error(`No Playwright video produced for ${sourcePath}`);
  await video.saveAs(videoPath);
  return proofState;
}

const primitiveChecks = system.primitives.map((primitive, index) => {
  const eventId = primitive.runtimeEvidence?.eventIds?.[0] ?? null;
  const events = eventId ? [proofEvent(eventId, index)] : [];
  const result = validateMotionPresentation(system, primitive.id, events);
  return {
    primitiveId: primitive.id,
    pass: result.pass,
    evidenceEventIds: result.matchedEvents.map((event) => event.id),
    proofEvidenceMode: 'proof-fixture'
  };
});
if (primitiveChecks.some((check) => !check.pass)) throw new Error(`Motion primitive truth validation failed: ${primitiveChecks.filter((check) => !check.pass).map((check) => check.primitiveId).join(', ')}`);

const browser = await chromium.launch({ headless: true });
const canonicalClips = [];
const scenarioClips = [];
let reducedMotionCheck = null;
try {
  for (const screenId of fixtureRef.screenIds) {
    const inputPath = path.join(visualProofRoot, 'source-html', `canonical-${screenId}.html`);
    await fs.access(inputPath);
    const baseHtml = await fs.readFile(inputPath, 'utf8');
    const events = canonicalSequence(screenId).map((id, index) => proofEvent(id, index));
    const html = injectCanonicalMotion(baseHtml, screenId, events);
    const sourcePath = path.join(sourceRoot, `canonical-${screenId}-motion.html`);
    const videoPath = path.join(canonicalRoot, `${screenId}.webm`);
    const endFramePath = path.join(endFrameRoot, `canonical-${screenId}.png`);
    await fs.writeFile(sourcePath, html);
    const viewport = screenId === 'mobile-conversation' ? fixture.viewports.mobile : fixture.viewports.desktop;
    const proofState = await recordHtml(browser, sourcePath, videoPath, endFramePath, { viewport, timeoutMs: 25_000 });
    canonicalClips.push({
      screenId,
      videoRef: rel(videoPath),
      sourceRef: rel(sourcePath),
      endFrameRef: rel(endFramePath),
      eventEvidenceMode: 'proof-fixture',
      eventTrace: proofState.events,
      reducedMotion: false
    });
  }

  for (const scenario of system.proofScenarios) {
    const events = scenario.events.map((id, index) => proofEvent(id, index));
    const html = scenarioHtml(scenario, events, { reducedMotion: scenario.reducedMotion === true });
    const sourcePath = path.join(sourceRoot, `scenario-${scenario.id}.html`);
    const videoPath = path.join(scenarioRoot, `${scenario.id}.webm`);
    const endFramePath = path.join(endFrameRoot, `scenario-${scenario.id}.png`);
    await fs.writeFile(sourcePath, html);
    const viewport = scenario.screenId === 'mobile-conversation' ? fixture.viewports.mobile : { width: 960, height: 620 };
    const preference = scenario.reducedMotion === true ? 'reduce' : 'no-preference';
    const timeoutMs = Math.max(20_000, events.length * system.speedHierarchy.workingMessageMinDwellMs + 8_000);
    const proofState = await recordHtml(browser, sourcePath, videoPath, endFramePath, { viewport, reducedMotion: preference, timeoutMs });
    const clip = {
      scenarioId: scenario.id,
      screenId: scenario.screenId,
      videoRef: rel(videoPath),
      sourceRef: rel(sourcePath),
      endFrameRef: rel(endFramePath),
      eventEvidenceMode: 'proof-fixture',
      eventTrace: proofState.events,
      reducedMotion: scenario.reducedMotion === true
    };
    scenarioClips.push(clip);
    if (scenario.reducedMotion === true) {
      reducedMotionCheck = {
        pass: proofState.reducedMotionMedia === true && proofState.runningAnimations === 0,
        motionPreference: proofState.reducedMotionMedia ? 'reduce' : 'no-preference',
        runningAnimationsAtCompletion: proofState.runningAnimations,
        scenarioId: scenario.id,
        videoRef: rel(videoPath)
      };
    }
  }

  const proof = buildMotionSystemProofEvidence({ system, canonicalClips, scenarioClips, primitiveChecks, reducedMotionCheck });
  if (!proof.reviewReady) throw new Error(`Motion System browser proof failed: ${proof.findings.map((item) => item.code).join(', ')}`);

  const manifest = {
    ...proof,
    governingIdea: system.governingIdea,
    coreRule: system.coreRule,
    stateClasses: system.stateClasses,
    speedHierarchy: system.speedHierarchy,
    runtimeEvidencePolicy: system.runtimeEvidencePolicy,
    selectedWorldRef: system.selectedWorldRef,
    visualSystemCandidateRef: system.visualSystemCandidateRef,
    architectureRef: system.architectureRef,
    canonicalFixtureRef: system.canonicalFixtureRef,
    sourceResponsibilities: system.sourceResponsibilities,
    productionIntegration: {
      status: system.runtimeEvidencePolicy.productionAdapterStatus,
      note: 'Browser proof validates choreography with labeled fixture events. Production status messages remain blocked from claiming these stages until real runtime event adapters are implemented.'
    },
    truth: {
      ...proof.truth,
      humanMotionApproval: false,
      humanVisualApproval: false,
      finalVisualSystemApproved: false
    }
  };
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`AI Council Motion System V1: ${canonicalClips.length} canonical clips, ${scenarioClips.length} runtime-state clips, ${primitiveChecks.length} primitive truth checks.`);
} finally {
  await browser.close();
  await fs.rm(tempVideoRoot, { recursive: true, force: true });
}
