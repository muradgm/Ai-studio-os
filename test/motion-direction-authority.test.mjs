import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProvenMotionDirection } from '../modules/motion-creative-intelligence/critic.mjs';
import {
  buildAuthoritativeMotionDirection,
  reviewMotionDirectionAuthority
} from '../modules/motion-creative-intelligence/direction-authority.mjs';
import { buildMotionTechnicalPlanningHandoff } from '../modules/motion-creative-intelligence/technical-planning.mjs';
import { buildMotionCritiqueFixture } from '../fixtures/motion-critic-authority-fixture.mjs';

function lowerLevelFixtureCandidate(hypothesisId = 'editorial') {
  const fixture = buildMotionCritiqueFixture();
  const hypothesis = fixture.brief.hypotheses.find((item) => item.id === hypothesisId);
  const candidate = buildProvenMotionDirection({
    exploration: fixture.exploration,
    critique: fixture.critique,
    hypothesisId,
    humanConfirmed: true,
    rationale: `Fixture confirms ${hypothesis.title} only for lower-level contract testing.`,
    reviewedEvidenceRefs: hypothesis.requiredSelectionEvidenceRefs
  });
  assert.ok(candidate);
  return { ...fixture, hypothesis, candidate };
}

test('synthetic fixture evidence cannot become authoritative Motion Direction for technical planning', () => {
  const fixture = buildMotionCritiqueFixture();
  const hypothesis = fixture.brief.hypotheses.find((item) => item.id === 'editorial');
  assert.equal(fixture.evidence.truth.testFixtureEvidenceOnly, true);
  assert.equal(fixture.evidence.truth.exactBrowserTemporalEvidence, false);

  const direction = buildAuthoritativeMotionDirection({
    exploration: fixture.exploration,
    critique: fixture.critique,
    hypothesisId: 'editorial',
    humanConfirmed: true,
    rationale: 'Attempt to turn synthetic fixture evidence into real technical authority.',
    reviewedEvidenceRefs: hypothesis.requiredSelectionEvidenceRefs
  });

  assert.equal(direction, null);
});

test('altered caller hypothesis content cannot replace the exact hypothesis that was rendered and critiqued', () => {
  const fixture = buildMotionCritiqueFixture();
  const editorial = fixture.brief.hypotheses.find((item) => item.id === 'editorial');
  const driftedExploration = structuredClone(fixture.exploration);
  const drifted = driftedExploration.hypotheses.find((item) => item.id === 'editorial');
  drifted.language.motionThesis = 'A post-proof replacement motion thesis that was never rendered.';

  const direction = buildAuthoritativeMotionDirection({
    exploration: driftedExploration,
    critique: fixture.critique,
    hypothesisId: 'editorial',
    humanConfirmed: true,
    rationale: 'Attempt to select altered hypothesis content.',
    reviewedEvidenceRefs: editorial.requiredSelectionEvidenceRefs
  });

  assert.equal(direction, null);
});

test('the lower-level motion-direction producer also rejects post-Critic exploration drift', () => {
  const fixture = buildMotionCritiqueFixture();
  const editorial = fixture.brief.hypotheses.find((item) => item.id === 'editorial');
  const driftedExploration = structuredClone(fixture.exploration);
  driftedExploration.hypotheses.find((item) => item.id === 'editorial').language.motionThesis = 'A direct-producer replacement that was never rendered or critiqued.';

  const direction = buildProvenMotionDirection({
    exploration: driftedExploration,
    critique: fixture.critique,
    hypothesisId: 'editorial',
    humanConfirmed: true,
    rationale: 'Attempt to bypass the authority wrapper with altered exploration content.',
    reviewedEvidenceRefs: editorial.requiredSelectionEvidenceRefs
  });

  assert.equal(direction, null);
});

test('lower-level proven candidate cannot claim final Motion Direction or technical-planning authority', () => {
  const { candidate } = lowerLevelFixtureCandidate();

  assert.equal(candidate.schema, 'ai-studio-os/motion-direction-proven-candidate@1');
  assert.equal(candidate.status, 'proven-awaiting-authority-wrap');
  assert.equal(candidate.truth.technicalPlanningAuthorized, false);
  assert.equal(candidate.truth.finalMotionDirectionAuthorityRequired, true);

  const review = reviewMotionDirectionAuthority(candidate);
  const handoff = buildMotionTechnicalPlanningHandoff({ motionDirection: candidate });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-direction-schema-invalid'));
  assert.ok(review.findings.some((item) => item.code === 'motion-direction-authority-recompute-failed'));
  assert.equal(handoff.reviewReady, false);
  assert.equal(handoff.truth.technicalStrategyMayNowBegin, false);
});

test('hand-shaped final Direction cannot bypass independently verified browser evidence', () => {
  const { candidate, critique } = lowerLevelFixtureCandidate();
  const forged = {
    ...candidate,
    schema: 'ai-studio-os/motion-direction@1',
    status: 'proven-awaiting-technical-planning',
    authorityInputs: {
      critique,
      hypothesisId: candidate.hypothesisId,
      humanConfirmed: true,
      rationale: 'Fabricated final wrapper around fixture-only proof.',
      reviewedEvidenceRefs: candidate.critic.reviewedEvidenceRefs
    },
    truth: {
      ...candidate.truth,
      technicalPlanningAuthorized: true,
      productionApproved: false
    }
  };

  const review = reviewMotionDirectionAuthority(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-direction-authority-recompute-failed'));
  assert.equal(review.truth.exactBrowserTemporalEvidenceRequired, true);
  assert.equal(review.truth.testFixtureEvidenceRejectedForTechnicalAuthority, true);
});

test('Motion Direction cannot fabricate production approval at the technical-planning boundary', () => {
  const { candidate, critique } = lowerLevelFixtureCandidate();
  const forged = {
    ...candidate,
    schema: 'ai-studio-os/motion-direction@1',
    status: 'proven-awaiting-technical-planning',
    authorityInputs: {
      critique,
      hypothesisId: candidate.hypothesisId,
      humanConfirmed: true,
      rationale: 'Fabricated final wrapper around fixture-only proof.',
      reviewedEvidenceRefs: candidate.critic.reviewedEvidenceRefs
    },
    truth: {
      ...candidate.truth,
      technicalPlanningAuthorized: true,
      productionApproved: true
    }
  };

  const review = reviewMotionDirectionAuthority(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-direction-authority-recompute-failed'));
  assert.ok(review.findings.some((item) => item.code === 'motion-direction-production-approval-fabricated'));
});

test('technical planning handoff remains blocked for synthetic fixture evidence and selects no implementation technology', () => {
  const fixture = buildMotionCritiqueFixture();
  const hypothesis = fixture.brief.hypotheses.find((item) => item.id === 'editorial');
  const direction = buildAuthoritativeMotionDirection({
    exploration: fixture.exploration,
    critique: fixture.critique,
    hypothesisId: 'editorial',
    humanConfirmed: true,
    rationale: 'Synthetic fixture must not authorize technical strategy.',
    reviewedEvidenceRefs: hypothesis.requiredSelectionEvidenceRefs
  });
  assert.equal(direction, null);

  const handoff = buildMotionTechnicalPlanningHandoff({ motionDirection: direction });
  assert.equal(handoff.reviewReady, false);
  assert.equal(handoff.status, 'blocked');
  assert.equal(handoff.truth.technicalStrategyMayNowBegin, false);
  assert.equal(handoff.truth.implementationTechnologySelected, false);
  assert.equal(handoff.truth.gsapSelected, false);
  assert.equal(handoff.truth.threeJsSelected, false);
  assert.equal(handoff.truth.webglSelected, false);
  assert.equal(handoff.truth.webgpuSelected, false);
  assert.equal(handoff.truth.blenderPipelineSelected, false);
  assert.equal(handoff.truth.physicsEngineSelected, false);
  assert.equal(handoff.truth.shaderImplementationSelected, false);
  assert.equal(handoff.truth.productionApproved, false);
});
