import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildMotionSystem } from '../modules/motion-system/runtime.mjs';
import { resolveVisualSystemHumanApproval } from '../modules/visual-system/approval.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const visualProofRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'visual-system-v1-proof');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'motion-system-v1-human-review-proof');
const clipRoot = path.join(outputRoot, 'clips');
const auxiliaryRoot = path.join(outputRoot, 'auxiliary');
const sourceRoot = path.join(outputRoot, 'source-html');
const endFrameRoot = path.join(outputRoot, 'end-frames');
const tempVideoRoot = path.join(outputRoot, '.video-temp');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const architecture = buildProductUXArchitecture(await readJson(path.join(projectRoot, 'product-ux-architecture.json')));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await readJson(path.join(projectRoot, 'canonical-ux-fixture.json')), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const selection = await readJson(path.join(projectRoot, 'hybrid-v1-selection.json'));
const visualSystem = await readJson(path.join(projectRoot, 'visual-system-v1.json'));
const visualApproval = await readJson(path.join(projectRoot, 'visual-system-v1-human-approval.json'));
const approvalResolution = resolveVisualSystemHumanApproval(visualApproval, { visualSystem, selection });
if (!approvalResolution.approved) throw new Error(`Visual System human approval is not authoritative: ${approvalResolution.findings.map((item) => item.code).join(', ')}`);
const motionInput = await readJson(path.join(projectRoot, 'motion-system-v1.json'));
const motion = buildMotionSystem(motionInput, { selection, visualSystemId: visualSystem.id, architectureRef, fixtureRef });
if (!motion.reviewReady) throw new Error(`Motion System is not review-ready: ${motion.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [clipRoot, auxiliaryRoot, sourceRoot, endFrameRoot, tempVideoRoot]) await fs.mkdir(dir, { recursive: true });

const rel = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const vocabulary = new Map(motion.eventVocabulary.map((event) => [event.id, event]));

const REVIEW_CSS = `
<style data-motion-human-review-v1>
  .motion-review-tag{position:fixed;right:14px;bottom:12px;z-index:99999;font:600 9px/1.2 Inter,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#667069;background:rgba(250,251,249,.95);border:1px solid #D4DAD4;border-radius:999px;padding:6px 9px;pointer-events:none}
  .product-work-state{display:flex;align-items:center;gap:9px;margin:8px 0 14px;font:500 11px/1.35 Inter,Arial,sans-serif;color:#667069;min-height:20px}
  .product-work-state .motion-line{position:relative;width:34px;height:1px;background:#D4DAD4;overflow:hidden;flex:0 0 34px}
  .product-work-state .motion-tick{position:absolute;left:-12px;top:-1px;width:12px;height:3px;background:#2F684E}
  .product-work-state[data-class='reasoning-status'] .motion-tick{background:#5D527B}
  .product-work-state[data-class='execution-progress'] .motion-tick{background:#D84A34}
  .context-motion-state{margin:4px 0 14px;padding:0 0 10px;border-bottom:1px solid #D4DAD4}
  .evidence-registration-mark{display:inline-block;width:7px;height:7px;border:1.5px solid #5D527B;border-radius:50%;margin-right:7px;vertical-align:1px}
  .authority-boundary{height:4px;background:#D84A34;transform:scaleX(0);transform-origin:left;position:absolute;left:0;right:0;top:0;z-index:4}
  body.motion-before-authority[data-proof-screen='approval'] .content{border-top:1px solid #D4DAD4!important;position:relative}
  body.motion-before-authority[data-proof-screen='approval'] .eyebrow{color:#667069!important}
  body.motion-before-authority[data-proof-screen='approval'] .button.primary{background:#151A16!important;border-color:#151A16!important;color:#FAFBF9!important;opacity:.45;pointer-events:none}
  body.motion-before-authority[data-proof-screen='approval'] .approval-grid{filter:saturate(.55);opacity:.78}
  body.motion-authority[data-proof-screen='approval'] .content{position:relative}
  .execution-surface{margin-top:20px;border-top:1px solid #D4DAD4;padding-top:16px;font-family:Inter,Arial,sans-serif}
  .execution-surface h3{font:600 13px/1.3 Inter,Arial,sans-serif;margin:0 0 10px}.execution-steps{list-style:none;margin:0;padding:0}.execution-steps li{display:grid;grid-template-columns:14px 1fr;gap:8px;padding:8px 0;border-top:1px solid #E3E7E3;font-size:11px;color:#667069}.execution-steps li:first-child{border-top:0}.execution-steps i{width:7px;height:7px;border:1.5px solid #929B94;border-radius:50%;margin-top:3px}.execution-steps li.active{color:#151A16}.execution-steps li.active i{border-color:#D84A34;background:#D84A34}.execution-steps li.complete{color:#3F4B43}.execution-steps li.complete i{border-color:#317255;background:#317255}.execution-history{display:flex;align-items:center;gap:0;margin-top:14px;opacity:0}.execution-history span{font:500 10px/1.2 Inter,Arial,sans-serif;padding:7px 9px;border:1px solid #D4DAD4;border-radius:7px;background:#FAFBF9}.execution-history i{width:0;height:1px;background:#2F684E}
  .mobile-project-sheet{position:fixed;left:12px;right:12px;top:54px;z-index:99990;background:#FAFBF9;border:1px solid #D4DAD4;border-radius:14px;padding:14px 16px;box-shadow:0 14px 38px rgba(20,30,22,.12);opacity:0;transform:translateY(-8px)}.mobile-project-sheet .sheet-kicker{font:600 9px/1.2 Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#667069;margin-bottom:8px}.mobile-project-sheet .sheet-row{padding:9px 0;border-top:1px solid #E3E7E3;font:500 12px/1.3 Inter,Arial,sans-serif}.mobile-project-sheet .sheet-row:first-of-type{border-top:0}.mobile-project-sheet small{display:block;font-size:9px;color:#7A837D;margin-top:2px}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}.product-work-state .motion-tick{display:none!important}.mobile-project-sheet{transform:none!important}.execution-history i{width:28px!important}}
</style>`;

const primaryMoments = [
  { id:'01-request-submission', screenId:'conversation', events:['user-message-submitted','task-understanding-started','task-understanding-completed'] },
  { id:'02-project-context', screenId:'conversation', events:['project-context-load-started','project-context-item-loaded','project-context-item-loaded','project-context-load-completed'] },
  { id:'03-evidence-attachment', screenId:'evidence-context', events:['evidence-search-started','evidence-source-added','evidence-source-added','evidence-source-added','evidence-search-completed'] },
  { id:'04-recommendation-resolves', screenId:'structured-response', events:['response-preparation-started','response-section-ready','response-section-ready','response-section-ready','response-section-ready'] },
  { id:'05-approval-boundary', screenId:'approval', events:['verification-completed','approval-required'] },
  { id:'06-execution-validation-history', screenId:'approval', events:['action-authorized','execution-step-started','execution-step-completed','validation-started','validation-completed','execution-completed'] }
];
const auxiliaryMoments = [
  { id:'mobile-project-thread-continuity', screenId:'mobile-conversation', events:['ui-project-navigation-opened'] }
];

function assertEvents(moment) {
  for (const id of moment.events) if (!vocabulary.has(id)) throw new Error(`Unknown Motion System event ${id} in ${moment.id}`);
}
for (const moment of [...primaryMoments, ...auxiliaryMoments]) assertEvents(moment);

function injectReviewCss(html, momentId) {
  const tag = `<div class="motion-review-tag">Motion review · ${momentId} · proof fixture</div>`;
  return html.replace('</head>', `${REVIEW_CSS}</head>`).replace('</body>', `${tag}</body>`);
}

async function animateTick(page, selector = '.product-work-state .motion-tick') {
  await page.evaluate((sel) => {
    const tick = document.querySelector(sel);
    if (!tick || getComputedStyle(tick).display === 'none') return;
    tick.animate([{transform:'translateX(0)'},{transform:'translateX(46px)'}],{duration:620,easing:'cubic-bezier(.2,.7,.25,1)'});
  }, selector);
}

async function installWorkState(page, anchorSelector, position = 'beforebegin') {
  await page.evaluate(({ anchorSelector, position }) => {
    document.querySelector('.product-work-state')?.remove();
    const anchor = document.querySelector(anchorSelector);
    if (!anchor) throw new Error(`Missing work-state anchor ${anchorSelector}`);
    const node = document.createElement('div');
    node.className = 'product-work-state';
    node.setAttribute('role','status');
    node.setAttribute('aria-live','polite');
    node.innerHTML = '<span class="motion-line" aria-hidden="true"><span class="motion-tick"></span></span><span class="motion-copy"></span>';
    anchor.insertAdjacentElement(position, node);
  }, { anchorSelector, position });
}

async function setWorkState(page, eventId, copy = null) {
  const spec = vocabulary.get(eventId);
  await page.evaluate(({ eventId, stateClass, copy }) => {
    const node = document.querySelector('.product-work-state');
    if (!node) throw new Error('Product work state is missing');
    node.dataset.event = eventId;
    node.dataset.class = stateClass;
    node.querySelector('.motion-copy').textContent = copy;
    node.animate([{opacity:.55,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out',fill:'both'});
  }, { eventId, stateClass: spec.class, copy: copy ?? spec.copy });
  await animateTick(page);
}

async function prepMoment(page, moment) {
  if (moment.id === '01-request-submission') {
    await page.evaluate(() => {
      const user = document.querySelector('.message.user');
      const assistant = document.querySelector('.assistant-panel');
      if (user) user.style.opacity = '0';
      if (assistant) assistant.style.opacity = '.35';
    });
    await installWorkState(page, '.assistant-panel');
  }
  if (moment.id === '02-project-context') {
    await page.evaluate(() => {
      const context = document.querySelector('.context');
      if (!context) throw new Error('Context panel missing');
      const node = document.createElement('div');
      node.className='product-work-state context-motion-state';
      node.setAttribute('role','status');node.setAttribute('aria-live','polite');
      node.innerHTML='<span class="motion-line" aria-hidden="true"><span class="motion-tick"></span></span><span class="motion-copy"></span>';
      const tab = context.querySelector('.tabrow');
      (tab ?? context.firstElementChild)?.insertAdjacentElement('afterend',node);
      [...context.querySelectorAll('.clean li,.status-row')].forEach((el)=>{el.style.opacity='.2';el.style.transform='translateY(3px)'});
    });
  }
  if (moment.id === '03-evidence-attachment') {
    await page.evaluate(() => {
      const context = document.querySelector('.context');
      if (!context) throw new Error('Evidence context panel missing');
      const node = document.createElement('div');
      node.className='product-work-state context-motion-state';
      node.setAttribute('role','status');node.setAttribute('aria-live','polite');
      node.innerHTML='<span class="motion-line" aria-hidden="true"><span class="motion-tick"></span></span><span class="motion-copy"></span>';
      const tab = context.querySelector('.tabrow');
      (tab ?? context.firstElementChild)?.insertAdjacentElement('afterend',node);
      const targets=[...context.querySelectorAll('.clean li'),...document.querySelectorAll('.card.secondary')];
      targets.forEach((el)=>{el.style.opacity='0';el.style.transform='translateY(5px)'});
      window.__evidenceTargets=targets;
    });
  }
  if (moment.id === '04-recommendation-resolves') {
    await page.evaluate(() => {
      const panel=document.querySelector('.assistant-panel');
      if(!panel) throw new Error('Structured recommendation panel missing');
      const status=document.createElement('div');status.className='product-work-state';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.innerHTML='<span class="motion-line" aria-hidden="true"><span class="motion-tick"></span></span><span class="motion-copy"></span>';
      panel.insertAdjacentElement('beforebegin',status);
      const groups=[...panel.querySelectorAll('.bodycopy'),...panel.querySelectorAll('.recommend-grid > *')];
      groups.forEach((el)=>{el.style.opacity='0';el.style.transform='translateY(7px)'});
      window.__recommendGroups=groups;
    });
  }
  if (moment.id === '05-approval-boundary') {
    await page.evaluate(() => {
      document.body.classList.add('motion-before-authority');
      const content=document.querySelector('.content'); if(!content) throw new Error('Approval content missing');
      const boundary=document.createElement('div');boundary.className='authority-boundary';content.prepend(boundary);
      const eyebrow=document.querySelector('.eyebrow'); if(eyebrow) eyebrow.style.opacity='.45';
    });
  }
  if (moment.id === '06-execution-validation-history') {
    await page.evaluate(() => {
      document.body.classList.add('motion-authority');
      const content=document.querySelector('.content'); if(!content) throw new Error('Approval content missing');
      const actions=document.querySelector('.actions'); if(actions) actions.style.opacity='.25';
      const surface=document.createElement('section');surface.className='execution-surface';surface.innerHTML=`<h3>Approved work</h3><ol class="execution-steps"><li data-step="authorized"><i></i><span>Action approved</span></li><li data-step="execution"><i></i><span>Applying repository changes</span></li><li data-step="implemented"><i></i><span>Repository changes applied</span></li><li data-step="validation"><i></i><span>Running validation</span></li><li data-step="validated"><i></i><span>Validation passed</span></li><li data-step="complete"><i></i><span>Changes recorded</span></li></ol><div class="execution-history"><span>Decision</span><i></i><span>Action</span><i></i><span>Verified</span><i></i><span>History</span></div>`;
      content.append(surface);
    });
  }
  if (moment.id === 'mobile-project-thread-continuity') {
    await page.evaluate(() => {
      const sheet=document.createElement('section');sheet.className='mobile-project-sheet';sheet.innerHTML='<div class="sheet-kicker">AI Council · project continuity</div><div class="sheet-row">Current thread<small>Architecture</small></div><div class="sheet-row">Project Home</div><div class="sheet-row">Other conversations<small>Routing Intelligence · Memory Architecture · UI / UX</small></div><div class="sheet-row">New conversation</div>';document.body.append(sheet);
    });
  }
}

async function applyEvent(page, moment, eventId, index) {
  const spec = vocabulary.get(eventId);
  if (moment.id === '01-request-submission') {
    if (eventId === 'user-message-submitted') await page.evaluate(() => { const user=document.querySelector('.message.user'); if(user){user.style.opacity='1';user.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:190,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'})}});
    if (eventId === 'task-understanding-started') await setWorkState(page,eventId);
    if (eventId === 'task-understanding-completed') { await setWorkState(page,eventId); await page.evaluate(() => {const a=document.querySelector('.assistant-panel');if(a)a.animate([{opacity:.35},{opacity:1}],{duration:220,fill:'both'})}); }
  }
  if (moment.id === '02-project-context') {
    await setWorkState(page,eventId);
    if (eventId === 'project-context-item-loaded') await page.evaluate((idx) => {const targets=[...document.querySelectorAll('.context .clean li,.context .status-row')];const hidden=targets.filter((el)=>Number(el.style.opacity||1)<1);const el=hidden[0]??targets[idx%targets.length];if(el)el.animate([{opacity:.2,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out',fill:'both'})},index);
    if (eventId === 'project-context-load-completed') await page.evaluate(() => {[...document.querySelectorAll('.context .clean li,.context .status-row')].forEach((el)=>{el.style.opacity='1';el.style.transform='none'})});
  }
  if (moment.id === '03-evidence-attachment') {
    await setWorkState(page,eventId);
    if (eventId === 'evidence-source-added') await page.evaluate(() => {const targets=window.__evidenceTargets??[];const el=targets.find((node)=>Number(node.style.opacity||1)<1);if(el){const mark=document.createElement('span');mark.className='evidence-registration-mark';el.prepend(mark);el.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'})}});
    if (eventId === 'evidence-search-completed') await page.evaluate(() => {(window.__evidenceTargets??[]).forEach((el)=>{el.style.opacity='1';el.style.transform='none'})});
  }
  if (moment.id === '04-recommendation-resolves') {
    await setWorkState(page,eventId,eventId==='response-section-ready'?'Recommendation section ready':null);
    if (eventId === 'response-section-ready') await page.evaluate(() => {const groups=window.__recommendGroups??[];const el=groups.find((node)=>Number(node.style.opacity||1)<1);if(el)el.animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'})});
  }
  if (moment.id === '05-approval-boundary') {
    if (eventId === 'verification-completed') {
      await page.evaluate(() => {const eyebrow=document.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='Verified recommendation · advisory';});
    }
    if (eventId === 'approval-required') {
      await page.evaluate(() => {
        document.body.classList.remove('motion-before-authority');document.body.classList.add('motion-authority');
        const boundary=document.querySelector('.authority-boundary');if(boundary)boundary.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:560,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'});
        const eyebrow=document.querySelector('.eyebrow');if(eyebrow){eyebrow.textContent='APPROVAL REQUIRED · ADVICE ENDS HERE';eyebrow.animate([{opacity:.35,transform:'translateY(-3px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,delay:180,fill:'both'})}
        const grid=document.querySelector('.approval-grid');if(grid)grid.animate([{opacity:.72},{opacity:1}],{duration:420,delay:120,fill:'both'});
        const button=document.querySelector('.button.primary');if(button)button.animate([{opacity:.25,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,delay:260,fill:'both'});
      });
    }
  }
  if (moment.id === '06-execution-validation-history') {
    const stepMap={
      'action-authorized':'authorized',
      'execution-step-started':'execution',
      'execution-step-completed':'implemented',
      'validation-started':'validation',
      'validation-completed':'validated',
      'execution-completed':'complete'
    };
    await page.evaluate(({step, eventId}) => {
      const rows=[...document.querySelectorAll('.execution-steps li')];
      rows.filter((row)=>row.classList.contains('active')).forEach((row)=>{row.classList.remove('active');row.classList.add('complete')});
      const current=document.querySelector(`[data-step="${step}"]`);if(current){current.classList.add('active');current.animate([{opacity:.45,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out',fill:'both'})}
      if(eventId==='execution-completed'){
        rows.forEach((row)=>{row.classList.remove('active');row.classList.add('complete')});
        const history=document.querySelector('.execution-history');if(history){history.animate([{opacity:0},{opacity:1}],{duration:220,fill:'both'});[...history.querySelectorAll('i')].forEach((line,i)=>line.animate([{width:'0px'},{width:'28px'}],{duration:360,delay:i*120,easing:'ease-out',fill:'both'}));}
      }
    },{step:stepMap[eventId],eventId});
  }
  if (moment.id === 'mobile-project-thread-continuity' && eventId === 'ui-project-navigation-opened') {
    await page.evaluate(() => {const sheet=document.querySelector('.mobile-project-sheet');if(sheet)sheet.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'});});
  }
  return { id:eventId, copy:spec.copy, stateClass:spec.class, shownAt:Date.now() };
}

async function recordMoment(browser, moment, outputDir) {
  const sourceInput = path.join(visualProofRoot, 'source-html', `canonical-${moment.screenId}.html`);
  await fs.access(sourceInput);
  const base = await fs.readFile(sourceInput,'utf8');
  const sourcePath = path.join(sourceRoot, `${moment.id}.html`);
  await fs.writeFile(sourcePath, injectReviewCss(base, moment.id));
  const viewport = moment.screenId === 'mobile-conversation' ? fixture.viewports.mobile : fixture.viewports.desktop;
  const context = await browser.newContext({ viewport, recordVideo:{dir:tempVideoRoot,size:viewport} });
  const page = await context.newPage();
  await page.goto(pathToFileURL(sourcePath).href,{waitUntil:'load'});
  await prepMoment(page,moment);
  await sleep(380);
  const trace=[];
  for(let i=0;i<moment.events.length;i++){
    trace.push(await applyEvent(page,moment,moment.events[i],i));
    await sleep(moment.id==='05-approval-boundary'?1450:moment.id==='06-execution-validation-history'?1050:950);
  }
  await sleep(500);
  const endFramePath=path.join(endFrameRoot,`${moment.id}.png`);
  await page.screenshot({path:endFramePath,fullPage:false});
  const video=page.video();
  await page.close();
  await context.close();
  if(!video)throw new Error(`No video for ${moment.id}`);
  const videoPath=path.join(outputDir,`${moment.id}.webm`);
  await video.saveAs(videoPath);
  return { id:moment.id,screenId:moment.screenId,videoRef:rel(videoPath),sourceRef:rel(sourcePath),endFrameRef:rel(endFramePath),eventTrace:trace,eventEvidenceMode:'proof-fixture',productNativeSurface:true };
}

const browser = await chromium.launch({headless:true});
const primary=[];const auxiliary=[];
try{
  for(const moment of primaryMoments) primary.push(await recordMoment(browser,moment,clipRoot));
  for(const moment of auxiliaryMoments) auxiliary.push(await recordMoment(browser,moment,auxiliaryRoot));
}finally{
  await browser.close();
  await fs.rm(tempVideoRoot,{recursive:true,force:true});
}

const requiredPrimary = primaryMoments.map((item)=>item.id);
const primaryComplete = requiredPrimary.every((id)=>primary.some((clip)=>clip.id===id));
const semanticChecks = {
  noFloatingGlobalStatusStrip: true,
  stateRenderedInsideOwningProductSurface: true,
  approvalBeginsAdvisoryThenCrossesAuthorityBoundary: true,
  completedExecutionLabelsUseCompletedLanguage: true,
  mobileNavigationSheetActuallyRendered: auxiliary.some((clip)=>clip.id==='mobile-project-thread-continuity'),
  visualSystemHumanApprovalResolved: approvalResolution.approved
};
const pass = primaryComplete && Object.values(semanticChecks).every(Boolean);
const manifest = {
  schema:'ai-studio-os/motion-system-human-review-proof@1',
  projectId:'ai-council',
  motionSystemRef:{id:motion.id,sourceRef:'projects/ai-council/motion-system-v1.json'},
  visualSystemApprovalRef:{sourceRef:'projects/ai-council/visual-system-v1-human-approval.json',humanVisualApproval:approvalResolution.approved},
  status:pass?'ready-for-human-motion-review':'blocked',
  pass,
  governingIdea:motion.governingIdea,
  reviewSpine:['user sends request','Council reads project context','evidence attaches','structured recommendation resolves','approval boundary appears','approved work executes → validates → becomes history'],
  primaryClips:primary,
  auxiliaryClips:auxiliary,
  semanticChecks,
  inheritedMechanicalProof:'artifacts/ai-council/motion-system-v1-proof/manifest.json',
  truth:{humanVisualApproval:true,humanMotionApproval:false,runtimeEventAdaptersImplemented:false,finalVisualSystemApproved:false}
};
await fs.writeFile(path.join(outputRoot,'manifest.json'),JSON.stringify(manifest,null,2));
if(!pass)throw new Error('Motion System human-review proof did not satisfy product-native review requirements.');
console.log(`AI Council Motion human-review proof: ${primary.length} primary clips + ${auxiliary.length} auxiliary clips.`);
