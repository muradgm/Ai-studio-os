import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { verifyIndependentMotionProofBrowserArtifacts } from '../modules/motion-creative-intelligence/browser-proof-verifier.mjs';

function reducedMotionSource(planned, durationMs = 220) {
  return `<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;background:#fff}main{width:100vw;height:100vh;background:#fff}</style></head><body><main data-study="${planned.id}"></main><script>
const study=${JSON.stringify(planned)};
const proof=window.__motionCreativeProof={studyId:study.id,sourceStudyId:study.id,done:false,startedAt:null,completedAt:null,frameCount:0,trace:[],reducedMotionMedia:matchMedia('(prefers-reduced-motion: reduce)').matches,appliedCreativeIntent:structuredClone(study.creativeIntent)};
let counting=true;const tick=()=>{if(counting){proof.frameCount++;requestAnimationFrame(tick)}};requestAnimationFrame(tick);
async function run(){if(proof.startedAt!==null)return;proof.startedAt=performance.now();proof.trace.push({event:'start',at:proof.startedAt});await new Promise(r=>setTimeout(r,${durationMs}));proof.completedAt=performance.now();proof.trace.push({event:'complete',at:proof.completedAt});counting=false;proof.done=true;}
setTimeout(run,20);
</script></body></html>`;
}

async function buildReducedMotionAttackArtifacts(root, planned) {
  const viewport = { width: 1100, height: 720 };
  const sourcePath = path.join(root, 'study.html');
  const capturePath = path.join(root, 'end.png');
  const videoPath = path.join(root, 'substituted.webm');
  const timelinePath = path.join(root, 'timeline.json');
  const recordings = path.join(root, 'recordings');
  fs.mkdirSync(recordings, { recursive: true });
  fs.writeFileSync(sourcePath, reducedMotionSource(planned));

  const browser = await chromium.launch({ headless: true });
  let replay;
  try {
    const sourceContext = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const sourcePage = await sourceContext.newPage();
    await sourcePage.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
    await sourcePage.waitForFunction(() => window.__motionCreativeProof?.done === true);
    replay = await sourcePage.evaluate(() => structuredClone(window.__motionCreativeProof));
    await sourcePage.screenshot({ path: capturePath, type: 'png' });
    await sourceContext.close();

    const videoContext = await browser.newContext({ viewport, recordVideo: { dir: recordings, size: viewport } });
    const videoPage = await videoContext.newPage();
    await videoPage.setContent('<!doctype html><style>html,body{margin:0;width:100%;height:100%;background:#000}</style>', { waitUntil: 'load' });
    const video = videoPage.video();
    await videoPage.waitForTimeout(180);
    await videoPage.evaluate(() => { document.body.style.background = '#fff'; });
    await videoPage.waitForTimeout(90);
    await videoPage.evaluate(() => { document.body.style.background = '#000'; });
    await videoPage.waitForTimeout(420);
    await videoContext.close();
    fs.copyFileSync(await video.path(), videoPath);
  } finally {
    await browser.close();
  }

  const timelineContract = {
    schema: 'ai-studio-os/motion-proof-browser-timeline@1',
    studyId: planned.id,
    viewport,
    input: 'reduced-motion',
    reducedMotionMedia: true,
    appliedCreativeIntent: planned.creativeIntent,
    trace: replay.trace,
    durationMs: replay.completedAt - replay.startedAt,
    animationFrameCount: replay.frameCount
  };
  fs.writeFileSync(timelinePath, JSON.stringify(timelineContract, null, 2));
  return { sourcePath, capturePath, videoPath, timelinePath, timelineContract };
}

test('reduced-motion authority rejects substituted media whose terminal state does not match replay', async (t) => {
  const executable = chromium.executablePath();
  if (!executable || !fs.existsSync(executable)) {
    t.skip('Playwright Chromium is not installed for this unit-test phase.');
    return;
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-reduced-terminal-authority-'));
  const planned = {
    id: 'reduced-terminal-binding',
    viewport: 'desktop',
    input: 'reduced-motion',
    creativeIntent: {
      reducedMotionInterpretation: 'Preserve the final white hierarchy immediately without decorative travel.'
    }
  };
  const artifacts = await buildReducedMotionAttackArtifacts(root, planned);
  const review = verifyIndependentMotionProofBrowserArtifacts([{
    planned,
    ...artifacts
  }]);

  assert.equal(review.verified, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-proof-independent-video-replay-mismatch'));
});

test('comparison authority rejects hidden, clipped, off-screen, occluded, probe-reactive, fallback-source, and trivial-pixel videos', async (t) => {
  const executable = chromium.executablePath();
  if (!executable || !fs.existsSync(executable)) {
    t.skip('Playwright Chromium is not installed for this unit-test phase.');
    return;
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-comparison-visibility-authority-'));
  const videoPath = path.join(root, 'study.webm');
  const alternateVideoPath = path.join(root, 'study-alternate.webm');
  fs.writeFileSync(videoPath, 'comparison-path-authority');
  fs.writeFileSync(alternateVideoPath, 'comparison-alternate-path-authority');

  const video = '<video controls width="640" height="360" src="./study.webm" style="display:block;background:#111"></video>';
  const overlay = '<div class="overlay" style="position:fixed;inset:0;background:#fff;z-index:999999"></div>';
  const pointerNoneOverlay = '<div class="overlay" style="position:fixed;inset:0;background:#fff;z-index:999999;pointer-events:none"></div>';
  const styleReactive = `<!doctype html><html><head><style>video[style*="opacity"] + .overlay{display:none!important}</style></head><body>${video}${overlay}</body></html>`;
  const observerReactive = `<!doctype html><html><body>${video}${overlay}<script>
const video=document.querySelector('video');const overlay=document.querySelector('.overlay');
new MutationObserver(()=>{if(video.getAttribute('style')?.includes('opacity'))overlay.style.display='none'}).observe(video,{attributes:true,attributeFilter:['style']});
</script></body></html>`;
  const fallbackSources = '<video controls width="640" height="360" style="display:block;background:#111"><source src="./study.webm" type="video/webm"><source src="./study-alternate.webm" type="video/webm"></video>';
  const tinyHoleOverlay = `<div style="position:absolute;left:0;top:0;width:640px;height:360px;z-index:999999;pointer-events:none">
<div style="position:absolute;left:0;top:0;width:640px;height:179px;background:#fff"></div>
<div style="position:absolute;left:0;top:181px;width:640px;height:179px;background:#fff"></div>
<div style="position:absolute;left:0;top:179px;width:319px;height:2px;background:#fff"></div>
<div style="position:absolute;left:321px;top:179px;width:319px;height:2px;background:#fff"></div>
</div>`;
  const boards = {
    valid: `<!doctype html><html><body>${video}</body></html>`,
    filter: `<!doctype html><html><body><section style="filter:opacity(0)">${video}</section></body></html>`,
    clip: `<!doctype html><html><body><section style="clip-path:inset(50%)">${video}</section></body></html>`,
    overflow: `<!doctype html><html><body><section style="width:0;height:0;overflow:hidden">${video}</section></body></html>`,
    offscreen: `<!doctype html><html><body><section style="position:absolute;left:-5000px;top:-5000px">${video}</section></body></html>`,
    overlay: `<!doctype html><html><body>${video}${overlay}</body></html>`,
    pointerNoneOverlay: `<!doctype html><html><body>${video}${pointerNoneOverlay}</body></html>`,
    styleReactive,
    observerReactive,
    fallbackSources: `<!doctype html><html><body>${fallbackSources}</body></html>`,
    tinyHole: `<!doctype html><html><body style="margin:0"><div style="position:relative;width:640px;height:360px">${video}${tinyHoleOverlay}</div></body></html>`
  };

  const boardPaths = {};
  for (const [name, html] of Object.entries(boards)) {
    boardPaths[name] = path.join(root, `${name}.html`);
    fs.writeFileSync(boardPaths[name], html);
  }

  const validReview = verifyIndependentMotionProofBrowserArtifacts([{
    kind: 'comparison',
    comparisonPaths: [boardPaths.valid],
    expectedVideoPaths: [videoPath]
  }]);
  assert.equal(validReview.verified, true, validReview.findings.map((item) => `${item.code}: ${item.message}`).join('\n'));
  assert.equal(validReview.findings.length, 0);

  for (const name of ['filter', 'clip', 'overflow', 'offscreen', 'overlay', 'pointerNoneOverlay', 'styleReactive', 'observerReactive', 'tinyHole']) {
    const blockedReview = verifyIndependentMotionProofBrowserArtifacts([{
      kind: 'comparison',
      comparisonPaths: [boardPaths[name]],
      expectedVideoPaths: [videoPath]
    }]);
    assert.equal(blockedReview.verified, false, `${name} comparison board must not become authority`);
    assert.ok(blockedReview.findings.some((item) => item.code === 'motion-proof-independent-comparison-visible-video-missing'));
    assert.ok(blockedReview.findings.some((item) => item.code === 'motion-proof-independent-comparison-dom-coverage-mismatch'));
  }

  const fallbackReview = verifyIndependentMotionProofBrowserArtifacts([{
    kind: 'comparison',
    comparisonPaths: [boardPaths.fallbackSources],
    expectedVideoPaths: [videoPath, alternateVideoPath]
  }]);
  assert.equal(fallbackReview.verified, false, 'one visible video with fallback sources cannot prove two independently visible recordings');
  assert.ok(fallbackReview.findings.some((item) => item.code === 'motion-proof-independent-comparison-dom-coverage-mismatch'));
});
