import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { buildMotionProofEvidence } from '../modules/motion-creative-intelligence/proof.mjs';
import { buildMotionProofFixture, renderedMotionStudiesFromPlan } from '../fixtures/motion-creative-authority-fixture.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const WEBM_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function rel(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}

function forgedBrowserArtifacts(plan) {
  const study = plan.studies[0];
  const root = path.join(repoRoot, 'artifacts', '.motion-proof-browser-authenticity-test', `${process.pid}-${Date.now()}`);
  fs.mkdirSync(root, { recursive: true });

  const source = `<!doctype html><main data-study="${study.id}"><button data-interaction-target>run</button></main><script>
const study=${JSON.stringify(study)};
const proof=window.__motionCreativeProof={studyId:study.id,sourceStudyId:study.id,done:false,startedAt:null,completedAt:null,frameCount:0,trace:[],reducedMotionMedia:false,appliedCreativeIntent:structuredClone(study.creativeIntent)};
let counting=true;const tick=()=>{if(counting){proof.frameCount++;requestAnimationFrame(tick)}};requestAnimationFrame(tick);
async function run(){if(proof.startedAt!==null)return;proof.startedAt=performance.now();proof.trace.push({event:'start',at:performance.now()});await new Promise(r=>setTimeout(r,120));proof.completedAt=performance.now();counting=false;proof.done=true;proof.trace.push({event:'complete',at:performance.now()});}
window.__startMotionCreativeProof=run;setTimeout(run,20);
</script>`;
  const timelineObject = {
    schema: 'ai-studio-os/motion-proof-browser-timeline@1',
    studyId: study.id,
    viewport: { width: 1100, height: 720 },
    input: study.input,
    reducedMotionMedia: false,
    appliedCreativeIntent: study.creativeIntent,
    trace: [{ event: 'start', at: 1 }, { event: 'complete', at: 121 }],
    durationMs: 120,
    animationFrameCount: 8
  };
  const timeline = JSON.stringify(timelineObject, null, 2);
  const video = Buffer.concat([WEBM_HEADER, Buffer.from([0x00])]);
  const capture = Buffer.concat([PNG_HEADER, Buffer.from([0x00])]);
  const paths = {
    source: path.join(root, 'study.html'),
    timeline: path.join(root, 'timeline.json'),
    video: path.join(root, 'study.webm'),
    capture: path.join(root, 'end.png')
  };
  fs.writeFileSync(paths.source, source);
  fs.writeFileSync(paths.timeline, timeline);
  fs.writeFileSync(paths.video, video);
  fs.writeFileSync(paths.capture, capture);

  return {
    studyId: study.id,
    hypothesisId: study.hypothesisId,
    momentId: study.momentId,
    videoRef: rel(paths.video),
    captureRef: rel(paths.capture),
    sourceRef: rel(paths.source),
    timelineRef: rel(paths.timeline),
    sourceSha256: digest(source),
    timelineSha256: digest(timeline),
    videoSha256: digest(video),
    captureSha256: digest(capture),
    viewport: study.viewport,
    input: study.input,
    durationMs: timelineObject.durationMs,
    frameCount: timelineObject.animationFrameCount,
    browserRendered: true,
    exactSourceRendered: true
  };
}

test('header-shaped media plus self-authored source/timeline cannot become exact browser proof', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan);
  rendered[0] = forgedBrowserArtifacts(plan);

  const evidence = buildMotionProofEvidence({
    plan,
    renderedStudies: rendered,
    comparisonRefs: ['fixture://motion/compare.html']
  });

  assert.equal(evidence.reviewReady, false);
  assert.equal(evidence.truth.exactBrowserTemporalEvidence, false);
  assert.equal(evidence.truth.independentBrowserReplayVerified, false);
  assert.ok(evidence.findings.some((item) => item.code.startsWith('motion-proof-independent-')));
});
