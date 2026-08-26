import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { buildMotionProofEvidence } from '../modules/motion-creative-intelligence/proof.mjs';
import { buildMotionProofFixture } from '../fixtures/motion-creative-authority-fixture.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const WEBM_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
let packageCounter = 0;

function rel(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}

function writeRealProofPackage(plan, { omitBoardVideoIndex = null, missingBoard = false } = {}) {
  const rootRel = `artifacts/.motion-proof-comparison-test/${process.pid}-${packageCounter++}`;
  const root = path.join(repoRoot, rootRel);
  fs.mkdirSync(root, { recursive: true });

  const renderedStudies = plan.studies.map((study, index) => {
    const studyDir = path.join(root, 'studies', study.id);
    fs.mkdirSync(studyDir, { recursive: true });
    const source = `<!doctype html><script>const study=${JSON.stringify(study)};</script>`;
    const timelineObject = {
      schema: 'ai-studio-os/motion-proof-browser-timeline@1',
      studyId: study.id,
      input: study.input,
      appliedCreativeIntent: study.creativeIntent,
      durationMs: 900 + index,
      animationFrameCount: 48 + index
    };
    const timeline = JSON.stringify(timelineObject, null, 2);
    const video = Buffer.concat([WEBM_HEADER, Buffer.from(`comparison-test-webm-${study.id}`)]);
    const capture = Buffer.concat([PNG_HEADER, Buffer.from(`comparison-test-png-${study.id}`)]);
    const paths = {
      source: path.join(studyDir, 'study.html'),
      timeline: path.join(studyDir, 'timeline.json'),
      video: path.join(studyDir, 'study.webm'),
      capture: path.join(studyDir, 'end.png')
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
      durationMs: Math.round(timelineObject.durationMs),
      frameCount: timelineObject.animationFrameCount,
      browserRendered: true,
      exactSourceRendered: true
    };
  });

  const boardPath = path.join(root, 'comparison.html');
  if (!missingBoard) {
    const videos = renderedStudies
      .filter((_, index) => index !== omitBoardVideoIndex)
      .map((study) => {
        const videoAbs = path.join(repoRoot, study.videoRef);
        const videoRel = path.relative(path.dirname(boardPath), videoAbs).split(path.sep).join('/');
        return `<video controls src="${videoRel}"></video>`;
      })
      .join('\n');
    fs.writeFileSync(boardPath, `<!doctype html><html><body>${videos}</body></html>`);
  }

  return {
    renderedStudies,
    comparisonRef: rel(boardPath)
  };
}

test('real comparison HTML is independently verified and covers every rendered temporal video', () => {
  const { plan } = buildMotionProofFixture();
  const pkg = writeRealProofPackage(plan);
  const evidence = buildMotionProofEvidence({
    plan,
    renderedStudies: pkg.renderedStudies,
    comparisonRefs: [pkg.comparisonRef]
  });

  assert.equal(evidence.reviewReady, true);
  assert.equal(evidence.truth.comparisonArtifactsVerified, true);
});

test('missing comparison artifact blocks rendered proof review readiness', () => {
  const { plan } = buildMotionProofFixture();
  const pkg = writeRealProofPackage(plan, { missingBoard: true });
  const evidence = buildMotionProofEvidence({
    plan,
    renderedStudies: pkg.renderedStudies,
    comparisonRefs: [pkg.comparisonRef]
  });

  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-comparison-artifact-unreadable'));
});

test('comparison artifact that omits one rendered video blocks comparative proof authority', () => {
  const { plan } = buildMotionProofFixture();
  const pkg = writeRealProofPackage(plan, { omitBoardVideoIndex: 0 });
  const evidence = buildMotionProofEvidence({
    plan,
    renderedStudies: pkg.renderedStudies,
    comparisonRefs: [pkg.comparisonRef]
  });

  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-comparison-video-coverage-incomplete'));
});
