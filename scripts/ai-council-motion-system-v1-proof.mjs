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
const taxonomy = await readJson(path.join(projectRoot, 'motion-event-taxonomy-v1.json'));
const system = buildMotionSystem(motionInput, {
  selection,
  visualSystemId: visualInput.id,
  architectureRef,
  fixtureRef,
  taxonomy
});
if (!system.reviewReady) throw new Error(`Motion System V1 is not proof-ready: ${system.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [canonicalRoot, scenarioRoot, sourceRoot, endFrameRoot, tempVideoRoot]) await fs.mkdir(dir, { recursive: true });

const rel = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const vocabulary = new Map(system.eventVocabulary.map((event) => [event.id, event]));

function proofEvent(id, sequence = 0) {
  const spec = vocabulary.get(id);
  if (!spec) throw new Error(`Unknown motion event: ${id}`);
  const event = {
    id,
    sequence,
    status: 'active',
    copy: spec.copy,
    operationalState: spec.operationalState,
    motionRole: spec.motionRole
  };
  if (spec.dynamicParticipant) event.participant = sequence % 2 ? 'Security' : 'Architecture';
  if (spec.dynamicOperation) {
    event.operationId = `proof-operation-${sequence + 1}`;
    event.label = sequence % 2 ? 'Running validation' : 'Applying repository changes';
  }
  return event;
}

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

const proofCss = `
<style data-motion-taxonomy-proof>
  .motion-taxonomy-proof{position:fixed;right:12px;bottom:10px;z-index:99999;display:flex;gap:6px;align-items:center;padding:6px 8px;border:1px solid #D4DAD4;background:rgba(250,251,249,.94);border-radius:999px;font:600 8px/1.2 Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#667069}
  .motion-taxonomy-proof b{color:#151A16}.motion-taxonomy-proof i{width:5px;height:5px;border-radius:50%;background:#2F684E}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
</style>`;

function injectCanonical(html, screenId, events, reducedMotion = false) {
  const script = `<script>
    const events=${JSON.stringify(events)};
    const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
    window.__motionProof={done:false,events:[],screenId:${JSON.stringify(screenId)},reducedMotion:${reducedMotion}};
    (async()=>{
      await sleep(${reducedMotion ? 30 : 120});
      const label=document.querySelector('.motion-taxonomy-proof b');
      const meta=document.querySelector('.motion-taxonomy-proof span');
      for(const event of events){
        label.textContent=event.copy;
        meta.textContent=(event.operationalState==='none'?'no operation':event.operationalState)+' · '+event.motionRole;
        const target=document.querySelector('.content,.assistant-panel,.context,.mobile-card');
        if(target && !matchMedia('(prefers-reduced-motion: reduce)').matches){
          target.animate([{opacity:.86},{opacity:1}],{duration:180,easing:'ease-out'});
        }
        window.__motionProof.events.push({...event,shownAt:performance.now()});
        await sleep(${reducedMotion ? 50 : 520});
      }
      await sleep(${reducedMotion ? 20 : 100});
      window.__motionProof.runningAnimations=document.getAnimations().filter(a=>a.playState==='running').length;
      window.__motionProof.done=true;
    })();
  </script>`;
  const ui = `<div class="motion-taxonomy-proof"><i></i><b>Motion ready</b><span>taxonomy proof</span></div>`;
  return html.replace('</head>', `${proofCss}</head>`).replace('</body>', `${ui}${script}</body>`);
}

function scenarioHtml(scenario, events, reducedMotion = false) {
  const rows = events.map((event) => `<li><strong>${esc(event.copy)}</strong><span>${esc(event.operationalState)}</span><span>${esc(event.motionRole)}</span></li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}body{margin:0;background:#F2F4F1;color:#151A16;font-family:Arial,sans-serif;padding:38px}.wrap{max-width:760px;margin:0 auto}.k{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#667069}.title{font-family:Georgia,serif;font-size:38px;font-weight:400;margin:12px 0 8px}.sub{color:#667069;line-height:1.5;margin-bottom:24px}.rowhead,.events li{display:grid;grid-template-columns:1.5fr .8fr 1fr;gap:12px;align-items:center}.rowhead{padding:8px 10px;color:#667069;font-size:9px;text-transform:uppercase;letter-spacing:.06em}.events{list-style:none;padding:0;margin:0;border-top:1px solid #D4DAD4}.events li{padding:12px 10px;border-bottom:1px solid #D4DAD4;opacity:.36}.events li.current{opacity:1;background:#FAFBF9}.events strong{font-size:12px}.events span{font:500 10px/1.3 monospace;color:#667069}.note{margin-top:18px;padding:12px;border-left:3px solid #2F684E;background:#FAFBF9;font-size:11px;line-height:1.45}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}}
  </style></head><body><main class="wrap"><div class="k">Motion System V1 · semantic proof fixture</div><h1 class="title">${esc(scenario.id.replaceAll('-', ' '))}</h1><p class="sub">Operational state and motion role are independent. A transition can be meaningful without pretending an operation is active.</p><div class="rowhead"><span>Event</span><span>Operational state</span><span>Motion role</span></div><ol class="events">${rows}</ol><div class="note">Fixture telemetry only. Production adapters remain unimplemented.</div></main><script>
    const events=${JSON.stringify(events)};const rows=[...document.querySelectorAll('.events li')];const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));window.__motionProof={done:false,events:[],screenId:${JSON.stringify(scenario.screenId)},reducedMotion:${reducedMotion}};(async()=>{for(let i=0;i<events.length;i++){rows.forEach((row,j)=>row.classList.toggle('current',i===j));window.__motionProof.events.push({...events[i],shownAt:performance.now()});await sleep(${reducedMotion ? 40 : 460});}rows.forEach(row=>row.classList.remove('current'));await sleep(${reducedMotion ? 10 : 80});window.__motionProof.runningAnimations=document.getAnimations().filter(a=>a.playState==='running').length;window.__motionProof.done=true})()
  </script></body></html>`;
}

async function record(browser, sourcePath, videoPath, endFramePath, { viewport, reducedMotion = 'no-preference', timeoutMs = 20_000 }) {
  const context = await browser.newContext({ viewport, reducedMotion, recordVideo: { dir: tempVideoRoot, size: viewport } });
  const page = await context.newPage();
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__motionProof?.done === true, null, { timeout: timeoutMs });
  const proofState = await page.evaluate(() => ({ ...window.__motionProof, reducedMotionMedia: matchMedia('(prefers-reduced-motion: reduce)').matches }));
  await page.screenshot({ path: endFramePath });
  const video = page.video();
  await page.close();
  await context.close();
  if (!video) throw new Error(`No video generated for ${sourcePath}`);
  await video.saveAs(videoPath);
  return proofState;
}

const primitiveChecks = system.primitives.map((primitive, index) => {
  const eventId = primitive.runtimeEvidence?.eventIds?.[0] ?? null;
  const events = eventId ? [proofEvent(eventId, index)] : [];
  const result = validateMotionPresentation(system, primitive.id, events);
  return { primitiveId: primitive.id, pass: result.pass, evidenceEventIds: result.matchedEvents.map((event) => event.id), proofEvidenceMode: 'proof-fixture' };
});
if (primitiveChecks.some((check) => !check.pass)) throw new Error(`Motion primitive truth validation failed: ${primitiveChecks.filter((check) => !check.pass).map((check) => check.primitiveId).join(', ')}`);

const canonicalClips = [];
const scenarioClips = [];
let reducedMotionCheck = null;
const browser = await chromium.launch({ headless: true });
try {
  for (const screenId of fixtureRef.screenIds) {
    const inputPath = path.join(visualProofRoot, 'source-html', `canonical-${screenId}.html`);
    const sourcePath = path.join(sourceRoot, `canonical-${screenId}-motion.html`);
    const videoPath = path.join(canonicalRoot, `${screenId}.webm`);
    const endFramePath = path.join(endFrameRoot, `canonical-${screenId}.png`);
    const events = canonicalSequence(screenId).map((id, index) => proofEvent(id, index));
    await fs.writeFile(sourcePath, injectCanonical(await fs.readFile(inputPath, 'utf8'), screenId, events));
    const viewport = screenId === 'mobile-conversation' ? fixture.viewports.mobile : fixture.viewports.desktop;
    const state = await record(browser, sourcePath, videoPath, endFramePath, { viewport });
    canonicalClips.push({ screenId, videoRef: rel(videoPath), sourceRef: rel(sourcePath), endFrameRef: rel(endFramePath), eventEvidenceMode: 'proof-fixture', eventTrace: state.events, reducedMotion: false });
  }

  for (const scenario of system.proofScenarios) {
    const events = scenario.events.map((id, index) => proofEvent(id, index));
    const reduced = scenario.reducedMotion === true;
    const sourcePath = path.join(sourceRoot, `scenario-${scenario.id}.html`);
    const videoPath = path.join(scenarioRoot, `${scenario.id}.webm`);
    const endFramePath = path.join(endFrameRoot, `scenario-${scenario.id}.png`);
    await fs.writeFile(sourcePath, scenarioHtml(scenario, events, reduced));
    const viewport = scenario.screenId === 'mobile-conversation' ? fixture.viewports.mobile : { width: 960, height: 620 };
    const state = await record(browser, sourcePath, videoPath, endFramePath, { viewport, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    scenarioClips.push({ scenarioId: scenario.id, screenId: scenario.screenId, videoRef: rel(videoPath), sourceRef: rel(sourcePath), endFrameRef: rel(endFramePath), eventEvidenceMode: 'proof-fixture', eventTrace: state.events, reducedMotion: reduced });
    if (reduced) reducedMotionCheck = { pass: state.reducedMotionMedia === true && state.runningAnimations === 0, motionPreference: state.reducedMotionMedia ? 'reduce' : 'no-preference', runningAnimationsAtCompletion: state.runningAnimations, scenarioId: scenario.id, videoRef: rel(videoPath) };
  }

  const proof = buildMotionSystemProofEvidence({ system, canonicalClips, scenarioClips, primitiveChecks, reducedMotionCheck });
  if (!proof.reviewReady) throw new Error(`Motion System browser proof failed: ${proof.findings.map((item) => item.code).join(', ')}`);
  const manifest = {
    ...proof,
    governingIdea: system.governingIdea,
    coreRule: system.coreRule,
    operationalStates: system.stateClasses,
    eventTaxonomyRef: system.eventTaxonomyRef,
    eventVocabulary: system.eventVocabulary,
    speedHierarchy: system.speedHierarchy,
    runtimeEvidencePolicy: system.runtimeEvidencePolicy,
    selectedWorldRef: system.selectedWorldRef,
    visualSystemCandidateRef: system.visualSystemCandidateRef,
    architectureRef: system.architectureRef,
    canonicalFixtureRef: system.canonicalFixtureRef,
    productionIntegration: {
      status: system.runtimeEvidencePolicy.productionAdapterStatus,
      note: 'Browser proof validates taxonomy and choreography with labeled fixture events. Production UI may not claim these states until real AI Council runtime adapters emit canonical events.'
    },
    truth: {
      ...proof.truth,
      motionRuntimeTaxonomyResolved: true,
      humanMotionApproval: false,
      humanVisualApproval: true,
      finalVisualSystemApproved: false
    }
  };
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`AI Council Motion System V1: ${canonicalClips.length} canonical clips, ${scenarioClips.length} scenarios, ${primitiveChecks.length} primitive checks, taxonomy ${system.eventTaxonomyRef.fingerprint}.`);
} finally {
  await browser.close();
  await fs.rm(tempVideoRoot, { recursive: true, force: true });
}
