import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { verifyIndependentMotionProofBrowserArtifacts } from '../modules/motion-creative-intelligence/browser-proof-verifier.mjs';
import {
  comparisonArtifactSnapshotsEqual,
  snapshotComparisonArtifacts
} from '../modules/motion-creative-intelligence/comparison-artifact-authority.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function controlledSource(planned) {
  const states = ['#c33', '#3c6', '#36c', '#db3', '#3bd', '#b3d', '#fff'];
  return `<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#111}main{width:100vw;height:100vh;background:#111}</style></head><body><main data-study="${planned.id}"></main><script>
const study=${JSON.stringify(planned)};const states=${JSON.stringify(states)};
const proof=window.__motionCreativeProof={studyId:study.id,sourceStudyId:study.id,done:false,startedAt:null,completedAt:null,frameCount:0,trace:[],reducedMotionMedia:false,appliedCreativeIntent:structuredClone(study.creativeIntent)};
let counting=true;const tick=()=>{if(counting){proof.frameCount++;requestAnimationFrame(tick)}};requestAnimationFrame(tick);
async function run(){if(proof.startedAt!==null)return;proof.startedAt=performance.now();proof.trace.push({event:'start',at:proof.startedAt});for(const color of states){document.querySelector('main').style.background=color;await new Promise(r=>setTimeout(r,100));}proof.completedAt=performance.now();proof.trace.push({event:'complete',at:proof.completedAt});counting=false;proof.done=true;}
setTimeout(run,40);
</script></body></html>`;
}

async function buildMontageAttack(root, planned) {
  const viewport = { width: 1100, height: 720 };
  const sourcePath = path.join(root, 'study.html');
  const capturePath = path.join(root, 'end.png');
  const videoPath = path.join(root, 'montage.webm');
  const timelinePath = path.join(root, 'timeline.json');
  const recordings = path.join(root, 'recordings');
  fs.mkdirSync(recordings, { recursive: true });
  fs.writeFileSync(sourcePath, controlledSource(planned));

  const browser = await chromium.launch({ headless: true });
  let replay;
  try {
    const sourceContext = await browser.newContext({ viewport });
    const sourcePage = await sourceContext.newPage();
    await sourcePage.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
    await sourcePage.waitForFunction(() => window.__motionCreativeProof?.done === true);
    replay = await sourcePage.evaluate(() => structuredClone(window.__motionCreativeProof));
    await sourcePage.screenshot({ path: capturePath, type: 'png' });
    await sourceContext.close();

    const videoContext = await browser.newContext({ viewport, recordVideo: { dir: recordings, size: viewport } });
    const videoPage = await videoContext.newPage();
    await videoPage.setContent('<!doctype html><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}</style>', { waitUntil: 'load' });
    const video = videoPage.video();
    const genuineStates = ['#c33', '#3c6', '#36c', '#db3', '#3bd', '#b3d'];
    await videoPage.waitForTimeout(40);
    for (const color of genuineStates) {
      await videoPage.evaluate((value) => { document.body.style.background = value; }, color);
      await videoPage.waitForTimeout(40);
      await videoPage.evaluate(() => { document.body.style.background = '#000'; });
      await videoPage.waitForTimeout(60);
    }
    await videoPage.evaluate(() => { document.body.style.background = '#fff'; });
    await videoPage.waitForTimeout(650);
    await videoContext.close();
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
    trace: replay.trace,
    durationMs: replay.completedAt - replay.startedAt,
    animationFrameCount: replay.frameCount
  };
  fs.writeFileSync(timelinePath, JSON.stringify(timelineContract, null, 2));
  return { sourcePath, capturePath, videoPath, timelinePath, timelineContract };
}

test('sparse authentic-frame montage cannot satisfy dense temporal authority', async (t) => {
  const executable = chromium.executablePath();
  if (!executable || !fs.existsSync(executable)) {
    t.skip('Playwright Chromium is not installed for this unit-test phase.');
    return;
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-dense-montage-authority-'));
  const planned = {
    id: 'dense-montage-binding',
    viewport: 'desktop',
    input: 'passive',
    creativeIntent: {
      motionThesis: 'A controlled sequence must remain authentic across the entire authored duration.',
      signatureMotionBehavior: 'Full-field chapter color progression.'
    }
  };
  const artifacts = await buildMontageAttack(root, planned);
  const review = verifyIndependentMotionProofBrowserArtifacts([{ planned, ...artifacts }]);
  assert.equal(review.verified, false);
  assert.ok(
    review.findings.some((item) => item.code === 'motion-proof-dense-video-timeline-mismatch'),
    `montage exploit must fail dense temporal authority; findings: ${JSON.stringify(review.findings)}`
  );
});

test('comparison artifact snapshots change when exact board bytes change', () => {
  const rootRel = `artifacts/.motion-comparison-digest-test/${process.pid}-${Date.now()}`;
  const root = path.join(repoRoot, rootRel);
  fs.mkdirSync(root, { recursive: true });
  const board = path.join(root, 'comparison.html');
  fs.writeFileSync(board, '<!doctype html><h1>Original comparison order</h1>');
  const ref = path.relative(repoRoot, board).split(path.sep).join('/');
  const first = snapshotComparisonArtifacts([ref]);
  fs.writeFileSync(board, '<!doctype html><h1>Relabeled/reordered comparison</h1>');
  const second = snapshotComparisonArtifacts([ref]);
  assert.equal(first[0].readable, true);
  assert.equal(second[0].readable, true);
  assert.notEqual(first[0].sha256, second[0].sha256);
  assert.equal(comparisonArtifactSnapshotsEqual(first, second), false);
});