import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { verifyIndependentMotionProofBrowserArtifacts } from '../modules/motion-creative-intelligence/browser-proof-verifier.mjs';

function proofSource(planned, durationMs) {
  return `<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}.stage{width:100vw;height:100vh;background:#000}</style></head><body><main class="stage" data-study="${planned.id}"></main><script>
const study=${JSON.stringify(planned)};
const proof=window.__motionCreativeProof={studyId:study.id,sourceStudyId:study.id,done:false,startedAt:null,completedAt:null,frameCount:0,trace:[],reducedMotionMedia:false,appliedCreativeIntent:structuredClone(study.creativeIntent)};
let counting=true;const tick=()=>{if(counting){proof.frameCount++;requestAnimationFrame(tick)}};requestAnimationFrame(tick);
async function run(){if(proof.startedAt!==null)return;proof.startedAt=performance.now();proof.trace.push({event:'start',at:proof.startedAt});const animation=document.querySelector('.stage').animate([{background:'#000'},{background:'#fff'}],{duration:${durationMs},easing:'linear',fill:'forwards'});await animation.finished;await new Promise(r=>setTimeout(r,100));proof.completedAt=performance.now();proof.trace.push({event:'complete',at:proof.completedAt});counting=false;proof.done=true;}
window.__startMotionCreativeProof=run;setTimeout(run,80);
</script></body></html>`;
}

test('legitimate Motion media remains replay-bound when the submitted recording has a longer terminal tail', async (t) => {
  const executable = chromium.executablePath();
  if (!executable || !fs.existsSync(executable)) {
    t.skip('Playwright Chromium is not installed for this unit-test phase.');
    return;
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-proof-terminal-anchor-'));
  const recordingRoot = path.join(root, 'recordings');
  fs.mkdirSync(recordingRoot, { recursive: true });
  const sourcePath = path.join(root, 'study.html');
  const capturePath = path.join(root, 'end.png');
  const videoPath = path.join(root, 'motion-with-terminal-tail.webm');
  const viewport = { width: 1100, height: 720 };
  const durationMs = 900;
  const planned = {
    id: 'terminal-tail-stability',
    viewport: 'desktop',
    input: 'passive',
    creativeIntent: { motionThesis: 'A real dark-to-light transition must remain verifiable even when browser recording finalization adds a longer terminal tail.' }
  };
  fs.writeFileSync(sourcePath, proofSource(planned, durationMs));

  const browser = await chromium.launch({ headless: true });
  let state;
  try {
    const context = await browser.newContext({ viewport, recordVideo: { dir: recordingRoot, size: viewport } });
    const page = await context.newPage();
    await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__motionCreativeProof?.done === true);
    state = await page.evaluate(() => structuredClone(window.__motionCreativeProof));
    await page.screenshot({ path: capturePath, type: 'png' });

    // Deliberately extend only the submitted recording's stable final-state tail.
    // Independent replay closes as soon as the proof reaches done=true.
    await page.waitForTimeout(700);
    const video = page.video();
    assert.ok(video);
    await context.close();
    fs.copyFileSync(await video.path(), videoPath);
  } finally {
    await browser.close();
  }

  const timelineContract = {
    schema: 'ai-studio-os/motion-proof-browser-timeline@1',
    studyId: planned.id,
    viewport,
    input: planned.input,
    reducedMotionMedia: false,
    appliedCreativeIntent: planned.creativeIntent,
    trace: state.trace,
    durationMs: state.completedAt - state.startedAt,
    animationFrameCount: state.frameCount
  };

  const review = verifyIndependentMotionProofBrowserArtifacts([{
    planned,
    sourcePath,
    timelinePath: path.join(root, 'timeline.json'),
    videoPath,
    capturePath,
    timelineContract
  }]);

  assert.equal(review.verified, true, review.findings.map((item) => `${item.code}: ${item.message}`).join('\n'));
  assert.equal(review.findings.length, 0);
});
