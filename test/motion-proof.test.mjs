import test from 'node:test';
import assert from 'node:assert/strict';

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

const preference = {
  hypothesisId: 'editorial',
  humanConfirmed: true,
  rationale: 'The current human preference favors the clearest hierarchy and strongest restraint.'
};

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
  assert.equal(plan.truth.proofPlanIsNotRenderedEvidence, true);
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

test('complete exact browser temporal evidence becomes ready for Motion Critic but selects no winner', () => {
  const { evidence } = buildMotionProofFixture();

  assert.equal(evidence.reviewReady, true);
  assert.equal(evidence.status, 'ready-for-motion-critic');
  assert.equal(evidence.truth.exactBrowserTemporalEvidence, true);
  assert.equal(evidence.truth.sourceAndTimelineDigestsRequired, true);
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
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-temporal-capture-missing'));
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
