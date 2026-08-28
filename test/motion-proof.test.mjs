import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { reviewMotionCreativeExploration, selectedMotionDirection } from '../modules/motion-creative-intelligence/runtime.mjs';
import {
  buildMotionProofPlan,
  buildMotionProofEvidence,
  reviewMotionProofPlan,
  reviewMotionProofEvidence
} from '../modules/motion-creative-intelligence/proof.mjs';
import {
  buildMotionExplorationFixture,
  buildMotionProofFixture,
  renderedMotionStudiesFromPlan
} from '../fixtures/motion-creative-authority-fixture.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const WEBM_HEADER = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
let artifactCounter = 0;

const preference = {
  hypothesisId: 'editorial',
  humanConfirmed: true,
  rationale: 'The current human preference favors the clearest hierarchy and strongest restraint.'
};

function writeArtifactStudy(plan, index = 0, overrides = {}) {
  const study = plan.studies[index];
  const rootRel = `artifacts/.motion-proof-test/${process.pid}-${artifactCounter++}-${study.id}`;
  const root = path.join(repoRoot, rootRel);
  fs.mkdirSync(root, { recursive: true });
  const source = overrides.source ?? `<!doctype html><script>const study=${JSON.stringify(study)};</script>`;
  const timelineObject = overrides.timeline ?? {
    schema: 'ai-studio-os/motion-proof-browser-timeline@1',
    studyId: study.id,
    input: study.input,
    appliedCreativeIntent: study.creativeIntent,
    durationMs: 900 + index,
    animationFrameCount: 48 + index
  };
  const timeline = JSON.stringify(timelineObject, null, 2);
  const video = overrides.video ?? Buffer.concat([WEBM_HEADER, Buffer.from(`test-webm-${study.id}`)]);
  const capture = overrides.capture ?? Buffer.concat([PNG_HEADER, Buffer.from(`test-png-${study.id}`)]);
  const paths = {
    source: path.join(root, 'study.html'),
    timeline: path.join(root, 'timeline.json'),
    video: path.join(root, 'study.webm'),
    capture: path.join(root, 'end.png')
  };
  fs.writeFileSync(paths.source, source);
  fs.writeFileSync(paths.timeline, timeline);
  if (overrides.omitVideo !== true) fs.writeFileSync(paths.video, video);
  fs.writeFileSync(paths.capture, capture);
  const rel = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
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
    durationMs: Math.round(timelineObject.durationMs ?? 900),
    frameCount: timelineObject.animationFrameCount ?? 48,
    browserRendered: true,
    exactSourceRendered: true
  };
}

test('motion exploration becomes proof-ready before any authoritative winner is selected', () => {
  const { exploration } = buildMotionExplorationFixture();
  const review = reviewMotionCreativeExploration(exploration);

  assert.equal(review.reviewReady, true);
  assert.equal(review.status, 'ready-for-motion-proof');
  assert.equal(review.truth.proofPrecedesAuthoritativeHumanMotionSelection, true);
  assert.equal(review.worldAuthority.pass, true);
  assert.equal(selectedMotionDirection(exploration), null);
});

test('motion proof plan covers every hypothesis against every temporal proof moment', () => {
  const { exploration } = buildMotionExplorationFixture();
  const plan = buildMotionProofPlan({ exploration });

  assert.equal(plan.reviewReady, true);
  assert.equal(plan.hypotheses.length, 3);
  assert.ok(plan.moments.some((moment) => moment.viewport === 'mobile'));
  assert.ok(plan.moments.some((moment) => moment.input === 'reduced-motion'));
  assert.equal(plan.studies.length, plan.hypotheses.length * plan.moments.length);
  assert.ok(plan.studies.filter((study) => study.viewport === 'mobile').every((study) => study.creativeIntent.responsiveConsequences.length > 0));
  assert.ok(plan.studies.filter((study) => study.input === 'reduced-motion').every((study) => Boolean(study.creativeIntent.reducedMotionInterpretation)));
  assert.equal(new Set(plan.studies.filter((study) => study.input === 'reduced-motion').map((study) => study.creativeIntent.reducedMotionInterpretation)).size, 3);
  assert.equal(plan.truth.proofPlanIsNotRenderedEvidence, true);
  assert.equal(plan.truth.responsiveConsequencesBoundIntoMobileStudies, true);
  assert.equal(plan.review.truth.explorationAuthorityRecomputed, true);
  assert.equal(plan.review.truth.cachedExplorationReviewTrusted, false);
});

test('cached exploration review flags cannot authorize a hand-shaped proof plan', () => {
  const { plan } = buildMotionProofFixture();
  const forged = structuredClone(plan);
  forged.reviewReady = true;
  forged.explorationReview = { reviewReady: true, status: 'ready-for-motion-proof' };
  forged.authorityInputs = {};

  const review = reviewMotionProofPlan(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-proof-exploration-not-ready'));
  assert.equal(review.truth.cachedExplorationReviewTrusted, false);
});

test('post-exploration mutation of a proof hypothesis is rejected before browser rendering', () => {
  const { plan } = buildMotionProofFixture();
  const drifted = structuredClone(plan);
  drifted.hypotheses[0].motionThesis = 'A replacement thesis that was never authored in the authoritative Motion exploration.';

  const review = reviewMotionProofPlan(drifted);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-proof-hypothesis-contract-drift'));
});

test('post-plan mutation of a study creative intent is rejected before browser rendering', () => {
  const { plan } = buildMotionProofFixture();
  const drifted = structuredClone(plan);
  drifted.studies[0].creativeIntent.motionThesis = 'A replacement study intent that does not match the authoritative hypothesis.';

  const review = reviewMotionProofPlan(drifted);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-proof-study-contract-drift'));
});

test('test fixture evidence can exercise Critic contracts but does not claim exact browser artifact verification', () => {
  const { evidence } = buildMotionProofFixture();

  assert.equal(evidence.reviewReady, true);
  assert.equal(evidence.status, 'ready-for-motion-critic');
  assert.equal(evidence.truth.exactBrowserTemporalEvidence, false);
  assert.equal(evidence.truth.referencedArtifactBytesReopened, false);
  assert.equal(evidence.truth.artifactDigestsRecomputed, false);
  assert.equal(evidence.truth.testFixtureEvidenceOnly, true);
  assert.equal(evidence.truth.temporalVideoRequired, true);
  assert.equal(evidence.truth.proofPlanAuthorityRecomputed, true);
  assert.equal(evidence.truth.cachedPlanReviewTrusted, false);
  assert.equal(evidence.truth.proofDoesNotSelectWinner, true);
  assert.equal(evidence.truth.humanMotionSelectionConfirmed, false);
  assert.equal(evidence.truth.productionApproved, false);
});

test('rendered evidence re-reviews the proof plan instead of trusting plan reviewReady', () => {
  const { evidence } = buildMotionProofFixture();
  const forged = structuredClone(evidence);
  forged.plan.reviewReady = true;
  forged.plan.review = { reviewReady: true };
  forged.plan.authorityInputs = {};

  const review = reviewMotionProofEvidence(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-proof-plan-not-ready'));
  assert.equal(review.truth.cachedPlanReviewTrusted, false);
});

test('PNG-only evidence cannot masquerade as temporal motion proof', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan);
  rendered[0] = { ...rendered[0], videoRef: '' };

  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['fixture://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-temporal-video-missing'));
});

test('proof plan or static-only references cannot masquerade as rendered motion evidence', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan);
  rendered[0] = {
    ...rendered[0],
    videoRef: '',
    captureRef: '',
    durationMs: 0,
    frameCount: 1
  };

  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['fixture://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-temporal-video-missing'));
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-end-frame-missing'));
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-temporal-metrics-invalid'));
});

test('source and timeline provenance must carry valid SHA-256 digests', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan);
  rendered[0].sourceSha256 = 'claimed';

  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['fixture://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-provenance-digest-missing'));
});

test('real artifact references are rehashed instead of trusting a forged valid-looking digest', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan);
  rendered[0] = writeArtifactStudy(plan, 0);
  rendered[0].sourceSha256 = 'a'.repeat(64);

  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['fixture://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-artifact-digest-mismatch'));
});

test('missing real video artifact blocks evidence even when the caller asserts browser success', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan);
  rendered[0] = writeArtifactStudy(plan, 0, { omitVideo: true });

  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['fixture://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-artifact-unreadable' && item.evidence.kind === 'video'));
});

test('timeline identity and applied creative intent are independently checked against the planned study', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan);
  const study = plan.studies[0];
  rendered[0] = writeArtifactStudy(plan, 0, {
    timeline: {
      schema: 'ai-studio-os/motion-proof-browser-timeline@1',
      studyId: 'forged-study-id',
      input: study.input,
      appliedCreativeIntent: { ...study.creativeIntent, motionThesis: 'forged after render' },
      durationMs: 900,
      animationFrameCount: 48
    }
  });

  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['fixture://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-timeline-identity-mismatch'));
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-timeline-creative-intent-mismatch'));
});

test('one missing hypothesis/moment render keeps the proof blocked', () => {
  const { plan } = buildMotionProofFixture();
  const rendered = renderedMotionStudiesFromPlan(plan).slice(1);

  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['fixture://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-render-missing'));
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-render-count-mismatch'));
});

test('pre-proof human preference produces only a direction candidate', () => {
  const { exploration: withoutSelection } = buildMotionExplorationFixture();
  assert.equal(selectedMotionDirection(withoutSelection), null);

  const { exploration: withSelection } = buildMotionExplorationFixture({ selection: preference });
  const candidate = selectedMotionDirection(withSelection);

  assert.equal(candidate?.schema, 'ai-studio-os/motion-direction-candidate@1');
  assert.equal(candidate?.hypothesisId, 'editorial');
  assert.equal(candidate?.truth.renderedMotionProofStillRequired, true);
  assert.equal(candidate?.truth.motionCriticStillRequired, true);
  assert.equal(candidate?.truth.technicalPlanningAuthorized, false);
});