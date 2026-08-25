import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProvenMotionDirection } from '../modules/motion-creative-intelligence/critic.mjs';
import {
  buildAuthoritativeMotionDirection,
  reviewMotionDirectionAuthority
} from '../modules/motion-creative-intelligence/direction-authority.mjs';
import { buildMotionTechnicalPlanningHandoff } from '../modules/motion-creative-intelligence/technical-planning.mjs';
import { buildMotionCritiqueFixture } from '../fixtures/motion-critic-authority-fixture.mjs';

function validDirectionFixture(hypothesisId = 'editorial') {
  const fixture = buildMotionCritiqueFixture();
  const hypothesis = fixture.brief.hypotheses.find((item) => item.id === hypothesisId);
  const direction = buildAuthoritativeMotionDirection({
    exploration: fixture.exploration,
    critique: fixture.critique,
    hypothesisId,
    humanConfirmed: true,
    rationale: `Human confirms ${hypothesis.title} after reviewing all required rendered studies.`,
    reviewedEvidenceRefs: hypothesis.requiredSelectionEvidenceRefs
  });
  assert.ok(direction);
  return { ...fixture, hypothesis, direction };
}

test('authoritative Motion Direction is reconstructed from the exact Critic exploration and rendered evidence', () => {
  const { direction } = validDirectionFixture();
  const review = reviewMotionDirectionAuthority(direction);

  assert.equal(direction.schema, 'ai-studio-os/motion-direction@1');
  assert.equal(direction.truth.directionBuiltFromCriticAuthoritativeExploration, true);
  assert.equal(direction.truth.directionAuthorityRecomputable, true);
  assert.equal(review.reviewReady, true);
  assert.equal(review.status, 'authoritative-for-technical-planning');
  assert.equal(review.truth.renderedMotionProofReviewed, true);
  assert.equal(review.truth.motionCriticReviewed, true);
  assert.equal(review.truth.humanMotionSelectionConfirmed, true);
  assert.equal(review.truth.productionApproved, false);
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

test('raw motion-direction@1 with a true authorization flag is not sufficient for technical planning', () => {
  const fixture = buildMotionCritiqueFixture();
  const editorial = fixture.brief.hypotheses.find((item) => item.id === 'editorial');
  const rawDirection = buildProvenMotionDirection({
    exploration: fixture.exploration,
    critique: fixture.critique,
    hypothesisId: 'editorial',
    humanConfirmed: true,
    rationale: 'Human confirms after rendered comparison.',
    reviewedEvidenceRefs: editorial.requiredSelectionEvidenceRefs
  });
  assert.ok(rawDirection);
  assert.equal(rawDirection.truth.technicalPlanningAuthorized, true);

  const review = reviewMotionDirectionAuthority(rawDirection);
  const handoff = buildMotionTechnicalPlanningHandoff({ motionDirection: rawDirection });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-direction-authority-recompute-failed'));
  assert.equal(handoff.reviewReady, false);
});

test('post-approval mutation of the authoritative Motion Direction is detected before technical planning', () => {
  const { direction } = validDirectionFixture();
  const forged = structuredClone(direction);
  forged.language.motionThesis = 'Use spectacle and continuous ambient animation everywhere.';
  forged.truth.technicalPlanningAuthorized = true;

  const review = reviewMotionDirectionAuthority(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-direction-authority-drift'));
});

test('Motion Direction cannot fabricate production approval at the technical-planning boundary', () => {
  const { direction } = validDirectionFixture();
  const forged = structuredClone(direction);
  forged.truth.productionApproved = true;

  const review = reviewMotionDirectionAuthority(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-direction-production-approval-fabricated'));
});

test('technical planning handoff carries creative constraints but selects no implementation technology', () => {
  const { direction } = validDirectionFixture();
  const handoff = buildMotionTechnicalPlanningHandoff({ motionDirection: direction });

  assert.equal(handoff.reviewReady, true);
  assert.equal(handoff.status, 'ready-for-motion-technical-strategy');
  assert.equal(handoff.truth.technicalStrategyMayNowBegin, true);
  assert.equal(handoff.truth.implementationTechnologySelected, false);
  assert.equal(handoff.truth.gsapSelected, false);
  assert.equal(handoff.truth.threeJsSelected, false);
  assert.equal(handoff.truth.webglSelected, false);
  assert.equal(handoff.truth.webgpuSelected, false);
  assert.equal(handoff.truth.blenderPipelineSelected, false);
  assert.equal(handoff.truth.physicsEngineSelected, false);
  assert.equal(handoff.truth.shaderImplementationSelected, false);
  assert.equal(handoff.truth.productionApproved, false);
  assert.equal(handoff.decisionPolicy.technologyMustBeJustifiedByBehavior, true);
  assert.equal(handoff.decisionPolicy.technicalFeasibilityCannotRewriteCreativeAuthority, true);
});
