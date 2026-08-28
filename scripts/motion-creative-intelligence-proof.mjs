import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { buildMotionProofPlan, buildMotionProofEvidence } from '../modules/motion-creative-intelligence/proof.mjs';
import { buildMotionExplorationFixture } from '../fixtures/motion-creative-authority-fixture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const outputRoot = path.join(repoRoot, 'artifacts', 'motion-creative-intelligence', 'proof-v1');
const sourceRoot = path.join(outputRoot, 'source-html');
const videoRoot = path.join(outputRoot, 'videos');
const endFrameRoot = path.join(outputRoot, 'end-frames');
const timelineRoot = path.join(outputRoot, 'timelines');
const tempVideoRoot = path.join(outputRoot, '.video-temp');
const rel = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
const outputRootRef = rel(outputRoot);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

function artifactHref(repoRelativeRef) {
  const relative = path.posix.relative(outputRootRef, repoRelativeRef);
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function studyHtml(study) {
  const reduced = study.input === 'reduced-motion';
  const title = study.hypothesisId === 'continuity' ? 'Persistent Continuity' : study.hypothesisId === 'editorial' ? 'Editorial Rhythm' : 'Tactile Materiality';
  const behavior = study.hypothesisId;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111411;color:#eef2ed;font-family:Arial,sans-serif}.stage{position:relative;width:100%;height:100%;padding:clamp(24px,5vw,72px);display:grid;grid-template-rows:auto 1fr auto;gap:24px}.meta{display:flex;justify-content:space-between;gap:20px;font:600 10px/1.2 monospace;letter-spacing:.08em;text-transform:uppercase;color:#8d9a8f}.scene{position:relative;display:grid;place-items:center;min-height:0}.card{position:relative;width:min(620px,86vw);min-height:260px;border:1px solid #465049;background:#1a1f1b;padding:clamp(26px,5vw,54px);display:grid;align-content:center;gap:18px;overflow:hidden;transform-origin:center}.eyebrow{font:600 10px/1.2 monospace;letter-spacing:.1em;text-transform:uppercase;color:#9baa9d}.title{font:400 clamp(32px,6vw,72px)/.95 Georgia,serif;letter-spacing:-.04em;max-width:9ch}.copy{max-width:52ch;color:#aeb9b0;line-height:1.55;font-size:13px}.anchor{position:absolute;width:72px;height:72px;border-radius:50%;border:1px solid #78917f;background:radial-gradient(circle at 35% 30%,#d9e6dc 0 6%,#5b7462 7% 25%,#243029 26% 100%);box-shadow:0 18px 60px rgba(0,0,0,.35)}.interaction{position:absolute;right:22px;bottom:20px;border:1px solid #718078;background:#232a25;color:#f3f6f3;padding:10px 14px;font:600 10px/1 monospace;letter-spacing:.06em;text-transform:uppercase}.footer{font-size:11px;color:#758079;max-width:70ch}.chapter-mask{position:absolute;inset:0;background:#dfe7e1;transform:translateX(-101%);pointer-events:none}.pressure{position:absolute;inset:18px;border:1px solid #56635a;pointer-events:none}.done{opacity:.82}@media(max-width:520px){.stage{padding:24px 18px;gap:16px}.card{width:100%;min-height:300px;padding:34px 24px}.interaction{right:14px;bottom:14px}.title{font-size:44px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
  </style></head><body><main class="stage" data-study="${esc(study.id)}"><div class="meta"><span>Motion Creative Proof · ${esc(study.momentId)}</span><span>${esc(study.viewport)} · ${esc(study.input)}</span></div><section class="scene"><div class="anchor"></div><article class="card"><div class="chapter-mask"></div><div class="pressure"></div><div class="eyebrow">${esc(title)}</div><div class="title">Motion earns attention.</div><p class="copy">${esc(study.purpose)}</p><button class="interaction" data-interaction-target>Apply change</button></article></section><div class="footer">CI proof fixture. Browser evidence demonstrates temporal rendering and provenance; it does not approve a production motion direction.</div></main><script>
    const study=${JSON.stringify(study)};
    const reduced=${JSON.stringify(reduced)} || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const proof=window.__motionCreativeProof={studyId:study.id,sourceStudyId:study.id,done:false,startedAt:null,completedAt:null,frameCount:0,trace:[],reducedMotionMedia:matchMedia('(prefers-reduced-motion: reduce)').matches,appliedCreativeIntent:structuredClone(study.creativeIntent)};
    let counting=true;const tick=()=>{if(counting){proof.frameCount++;requestAnimationFrame(tick)}};requestAnimationFrame(tick);
    const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));const log=(event,details={})=>proof.trace.push({event,at:performance.now(),...details});
    async function run(){
      if(proof.startedAt!==null)return;
      proof.startedAt=performance.now();log('start');
      const card=document.querySelector('.card');const anchor=document.querySelector('.anchor');const mask=document.querySelector('.chapter-mask');const pressure=document.querySelector('.pressure');const eyebrow=document.querySelector('.eyebrow');const heading=document.querySelector('.title');const copy=document.querySelector('.copy');
      const responsiveIntent=Array.isArray(study.creativeIntent?.responsiveConsequences)?study.creativeIntent.responsiveConsequences:[];
      const reducedIntent=study.creativeIntent?.reducedMotionInterpretation||'';

      if(reduced){
        if(!reducedIntent)throw new Error('Reduced-motion study is missing its authored interpretation.');
        log('reduced-intent-applied',{intent:reducedIntent,hypothesisId:study.hypothesisId});
        if(${JSON.stringify(behavior)}==='continuity'){
          anchor.style.transform='translate(48px,-18px)';anchor.style.opacity='.92';card.style.borderColor='#8ca393';copy.style.opacity='.7';await sleep(110);card.style.background='#202720';heading.style.opacity='1';await sleep(150);
        } else if(${JSON.stringify(behavior)}==='editorial'){
          mask.style.display='none';heading.style.opacity='0';eyebrow.textContent='Chapter boundary';card.style.borderColor='#aebcb1';card.style.background='#232923';await sleep(80);heading.textContent='Chapter resolved.';heading.style.opacity='1';await sleep(90);copy.style.opacity='.62';await sleep(90);
        } else {
          card.style.borderColor='#a8b6ab';card.style.background='#222a24';pressure.style.borderColor='#9aad9e';pressure.style.opacity='1';anchor.style.opacity='.74';copy.style.opacity='.78';await sleep(260);
        }
      } else if(study.momentId==='mobile-recomposition'){
        if(!responsiveIntent.length)throw new Error('Mobile study is missing authored responsive consequences.');
        log('responsive-intent-applied',{intent:responsiveIntent,hypothesisId:study.hypothesisId});
        if(${JSON.stringify(behavior)}==='continuity'){
          anchor.animate([{transform:'translate(-28px,12px) scale(.94)'},{transform:'translate(36px,-16px) scale(1)'}],{duration:520,easing:'cubic-bezier(.22,.72,.18,1)',fill:'forwards'});card.animate([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(0)'}],{duration:520,easing:'cubic-bezier(.22,.72,.18,1)',fill:'forwards'});await sleep(620);
        } else if(${JSON.stringify(behavior)}==='editorial'){
          mask.style.transform='translateY(-101%)';mask.animate([{transform:'translateY(-101%)'},{transform:'translateY(0)'},{transform:'translateY(101%)'}],{duration:380,easing:'cubic-bezier(.7,0,.25,1)',fill:'forwards'});heading.animate([{opacity:0},{opacity:1}],{delay:150,duration:170,easing:'linear',fill:'both'});copy.animate([{opacity:.25},{opacity:1}],{delay:230,duration:150,easing:'linear',fill:'both'});log('editorial-mobile-vertical-replacement');await sleep(520);
        } else {
          card.animate([{transform:'scale(1)'},{transform:'scale(.985) translateY(2px)'},{transform:'scale(1)'}],{duration:460,easing:'cubic-bezier(.2,.8,.25,1)',fill:'forwards'});pressure.animate([{inset:'18px',opacity:.55},{inset:'13px',opacity:1},{inset:'18px',opacity:.65}],{duration:460,easing:'cubic-bezier(.2,.8,.25,1)',fill:'forwards'});log('tactile-mobile-compact-compression');await sleep(560);
        }
      } else if(${JSON.stringify(behavior)}==='continuity'){
        if(study.momentId==='entry'){
          anchor.animate([{transform:'translate(-150px,28px) scale(.82)',opacity:.45},{transform:'translate(-42px,-8px) scale(1)',opacity:1}],{duration:1050,easing:'cubic-bezier(.22,.72,.18,1)',fill:'forwards'});card.animate([{transform:'translateY(12px)',opacity:.72},{transform:'translateY(0)',opacity:1}],{duration:880,easing:'cubic-bezier(.22,.72,.18,1)',fill:'forwards'});
        } else {
          anchor.animate([{transform:'translate(-42px,-8px)'},{transform:'translate(132px,-58px) scale(.9)'},{transform:'translate(116px,-44px) scale(1)'}],{duration:1180,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});card.animate([{transform:'translateX(0)'},{transform:'translateX(-18px)'},{transform:'translateX(-10px)'}],{duration:1180,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
        }
        log('continuity-transition');await sleep(1280);
      } else if(${JSON.stringify(behavior)}==='editorial'){
        mask.animate([{transform:'translateX(-101%)'},{transform:'translateX(0)'},{transform:'translateX(101%)'}],{duration:620,easing:'cubic-bezier(.7,0,.25,1)',fill:'forwards'});heading.animate([{opacity:0,clipPath:'inset(0 0 100% 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{delay:300,duration:360,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});log('editorial-cut');await sleep(820);
      } else {
        card.animate([{transform:'scale(1)'},{transform:'scale(.965) translateY(5px)'},{transform:'scale(1.012) translateY(-2px)'},{transform:'scale(1)'}],{duration:760,easing:'cubic-bezier(.2,.8,.25,1)',fill:'forwards'});pressure.animate([{inset:'18px',opacity:.5},{inset:'8px',opacity:1},{inset:'18px',opacity:.6}],{duration:760,easing:'cubic-bezier(.2,.8,.25,1)',fill:'forwards'});anchor.animate([{transform:'scale(1)'},{transform:'scale(.82)'},{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:760,easing:'cubic-bezier(.2,.8,.25,1)',fill:'forwards'});log('tactile-response');await sleep(900);
      }
      document.querySelector('.stage').classList.add('done');await sleep(100);proof.completedAt=performance.now();counting=false;proof.runningAnimations=document.getAnimations().filter(a=>a.playState==='running').length;proof.done=true;log('complete');
    }
    window.__startMotionCreativeProof=run;
    if(study.input==='pointer'||study.input==='touch')document.querySelector('[data-interaction-target]').addEventListener('click',run,{once:true});else setTimeout(run,80);
  </script></body></html>`;
}

async function recordStudy(browser, study, sourcePath, videoPath, endFramePath, timelinePath) {
  const viewport = study.viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1100, height: 720 };
  const context = await browser.newContext({
    viewport,
    hasTouch: study.input === 'touch',
    isMobile: study.viewport === 'mobile',
    reducedMotion: study.input === 'reduced-motion' ? 'reduce' : 'no-preference',
    recordVideo: { dir: tempVideoRoot, size: viewport }
  });
  const page = await context.newPage();
  const sourceUrl = pathToFileURL(sourcePath).href;
  await page.goto(sourceUrl, { waitUntil: 'load' });
  if (study.input === 'pointer') await page.click('[data-interaction-target]');
  if (study.input === 'touch') await page.tap('[data-interaction-target]');
  await page.waitForFunction(() => window.__motionCreativeProof?.done === true, null, { timeout: 15_000 });
  const state = await page.evaluate(() => structuredClone(window.__motionCreativeProof));
  const renderedUrl = page.url();
  await page.screenshot({ path: endFramePath });
  const video = page.video();
  await page.close();
  await context.close();
  if (!video) throw new Error(`No browser video generated for ${study.id}`);
  await video.saveAs(videoPath);

  const timeline = {
    schema: 'ai-studio-os/motion-proof-browser-timeline@1',
    studyId: study.id,
    sourceUrl,
    viewport,
    input: study.input,
    reducedMotionMedia: state.reducedMotionMedia,
    appliedCreativeIntent: state.appliedCreativeIntent,
    trace: state.trace,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    durationMs: state.completedAt - state.startedAt,
    animationFrameCount: state.frameCount,
    runningAnimationsAtCompletion: state.runningAnimations
  };
  const timelineText = JSON.stringify(timeline, null, 2);
  await fs.writeFile(timelinePath, timelineText);

  const [sourceText, emittedTimelineText, videoBytes, captureBytes] = await Promise.all([
    fs.readFile(sourcePath, 'utf8'),
    fs.readFile(timelinePath, 'utf8'),
    fs.readFile(videoPath),
    fs.readFile(endFramePath)
  ]);
  if (!videoBytes.length || !captureBytes.length) throw new Error(`Motion proof capture files are missing or empty for ${study.id}`);

  return {
    studyId: study.id,
    hypothesisId: study.hypothesisId,
    momentId: study.momentId,
    videoRef: rel(videoPath),
    captureRef: rel(endFramePath),
    sourceRef: rel(sourcePath),
    timelineRef: rel(timelinePath),
    viewport: study.viewport,
    input: study.input,
    durationMs: Math.max(1, Math.round(timeline.durationMs)),
    frameCount: Math.max(2, timeline.animationFrameCount),
    browserRendered: true,
    exactSourceRendered: renderedUrl === sourceUrl && state.sourceStudyId === study.id,
    sourceSha256: digest(sourceText),
    timelineSha256: digest(emittedTimelineText),
    videoSha256: digest(videoBytes),
    captureSha256: digest(captureBytes)
  };
}

function comparisonBoard(plan, renderedStudies) {
  const byHypothesis = new Map(plan.hypotheses.map((hypothesis) => [hypothesis.id, []]));
  for (const study of renderedStudies) byHypothesis.get(study.hypothesisId)?.push(study);
  const sections = plan.hypotheses.map((hypothesis) => `<section><h2>${esc(hypothesis.title)}</h2><p>${esc(hypothesis.interpretation)}</p><div class="grid">${(byHypothesis.get(hypothesis.id) ?? []).map((study) => `<article><div class="k">${esc(study.momentId)} · ${esc(study.viewport)} · ${esc(study.input)}</div><video src="${esc(artifactHref(study.videoRef))}" controls muted loop playsinline></video><div class="refs">${esc(study.sourceRef)}<br>${esc(study.timelineRef)}</div></article>`).join('')}</div></section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#0f1210;color:#edf1ed;font-family:Arial,sans-serif;padding:40px}h1{font:400 48px/1 Georgia,serif}h2{margin:0 0 8px;font-size:22px}p{color:#9ca89f;max-width:70ch}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:18px 0 44px}article{border:1px solid #303a33;background:#171c18;padding:12px}.k,.refs{font:600 9px/1.4 monospace;color:#849087;word-break:break-all}.k{text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}video{width:100%;aspect-ratio:16/10;background:#0b0d0b;object-fit:cover;margin-bottom:8px}</style></head><body><h1>Motion Creative Intelligence · Temporal Proof V1</h1><p>Side-by-side CI evidence for competing motion hypotheses. This board supports critique; it does not select or approve a winner.</p>${sections}</body></html>`;
}

const { canonical, exploration: motionExploration } = buildMotionExplorationFixture();
if (!motionExploration.reviewReady) throw new Error(`Motion Creative exploration is not proof-ready: ${motionExploration.findings.map((item) => item.code).join(', ')}`);
const plan = buildMotionProofPlan({ exploration: motionExploration });
if (!plan.reviewReady) throw new Error(`Motion proof plan is not browser-ready: ${plan.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [sourceRoot, videoRoot, endFrameRoot, timelineRoot, tempVideoRoot]) await fs.mkdir(dir, { recursive: true });

const renderedStudies = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const study of plan.studies) {
    const sourcePath = path.join(sourceRoot, `${study.id}.html`);
    const videoPath = path.join(videoRoot, `${study.id}.webm`);
    const endFramePath = path.join(endFrameRoot, `${study.id}.png`);
    const timelinePath = path.join(timelineRoot, `${study.id}.json`);
    await fs.writeFile(sourcePath, studyHtml(study));
    renderedStudies.push(await recordStudy(browser, study, sourcePath, videoPath, endFramePath, timelinePath));
  }
} finally {
  await browser.close();
}

const comparisonPath = path.join(outputRoot, 'comparison-board.html');
const comparisonHtml = comparisonBoard(plan, renderedStudies);
if (comparisonHtml.includes('../../../../')) throw new Error('Motion comparison board contains non-portable repository-relative video traversal.');
await fs.writeFile(comparisonPath, comparisonHtml);

const evidence = buildMotionProofEvidence({ plan, renderedStudies, comparisonRefs: [rel(comparisonPath)] });
if (!evidence.reviewReady) throw new Error(`Rendered Motion Creative evidence failed: ${evidence.findings.map((item) => item.code).join(', ')}`);
if (evidence.truth.exactBrowserTemporalEvidence !== true || evidence.truth.artifactDigestsRecomputed !== true) throw new Error('Motion proof did not independently revalidate exact browser artifact bytes.');

const manifest = {
  ...evidence,
  fixture: {
    mode: 'ci-proof-fixture',
    productionAuthority: false,
    canonicalCreativeHandoffSchema: motionExploration.worldAuthority?.canonicalHandoff?.schema ?? null,
    canonicalCreativeHandoffPassed: motionExploration.worldAuthority?.canonicalHandoff?.pass === true,
    creativeThesisAuthorityValid: motionExploration.worldAuthority?.canonicalHandoff?.truth?.creativeThesisAuthorityValid === true,
    renderedVisualProofEvidenceValid: motionExploration.worldAuthority?.canonicalHandoff?.truth?.renderedVisualProofEvidenceValid === true,
    canonicalCreativeWorldExplorationSchema: canonical.creativeWorldExploration?.schema ?? null,
    selectedCreativeWorldId: canonical.selectedCreativeWorld?.id ?? null,
    canonicalHumanWorldSelectionConfirmed: canonical.creativeWorldExploration?.truth?.humanWorldSelectionConfirmed === true,
    motionHypothesisSelectionConfirmed: false
  },
  truth: {
    ...evidence.truth,
    fullCanonicalCreativeAuthorityExercisedByFixture: true,
    actualPlaywrightTemporalArtifactsProduced: true,
    hypothesisSpecificReducedMotionRendered: true,
    hypothesisSpecificMobileRecompositionRendered: true,
    portableComparisonArtifact: true,
    motionCriticStillRequired: true,
    humanMotionSelectionConfirmed: false,
    productionApproved: false
  }
};
await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
await fs.rm(tempVideoRoot, { recursive: true, force: true });
console.log(`Motion Creative Intelligence temporal proof: ${renderedStudies.length} browser studies across ${plan.hypotheses.length} hypotheses × ${plan.moments.length} moments. Evidence status: ${evidence.status}.`);