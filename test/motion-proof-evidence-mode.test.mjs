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

function realArtifactStudy(plan, index = 0) {
  const study = plan.studies[index];
  const root = path.join(repoRoot, 'artifacts', '.motion-proof-mode-test', `${process.pid}-${Date.now()}-${study.id}`);
  fs.mkdirSync(root, { recursive: true });
  const source = `<!doctype html><script>const study=${JSON.stringify(study)};</script>`;
  const timelineObject = {
    schema: 'ai-studio-os/motion-proof-browser-timeline@1',
    studyId: study.id,
    input: study.input,
    appliedCreativeIntent: study.creativeIntent,
    durationMs: 900,
    animationFrameCount: 48
  };
  const timeline = JSON.stringify(timelineObject, null, 2);
  const video = Buffer.concat([WEBM_HEADER, Buffer.from(`mode-test-${study.id}`)]);
  const capture = Buffer.concat([PNG_HEADER, Buffer.from(`mode-test-${study.id}`)]);
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

test('fixture and real artifact studies cannot be mixed into browser authority', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan);
  rendered[0] = realArtifactStudy(plan, 0);

  const evidence = buildMotionProofEvidence({
    plan,
    renderedStudies: rendered,
    comparisonRefs: ['fixture://motion/compare.html']
  });

  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-evidence-mode-mixed'));
  assert.equal(evidence.truth.exactBrowserTemporalEvidence, false);
  assert.equal(evidence.truth.independentBrowserReplayVerified, false);
  assert.equal(evidence.truth.testFixtureEvidenceOnly, false);
  assert.equal(evidence.truth.mixedFixtureAndBrowserEvidenceRejected, true);
});
