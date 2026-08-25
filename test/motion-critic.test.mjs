import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MOTION_CRITIC_DIMENSIONS,
  buildMotionCriticBrief,
  buildMotionCritique,
  buildProvenMotionDirection,
  reviewMotionCritique
} from '../modules/motion-creative-intelligence/critic.mjs';
import { buildMotionProofFixture } from '../fixtures/motion-creative-authority-fixture.mjs';

function refsFor(hypothesis, momentId) {
  return hypothesis.momentEvidence?.[momentId] ?? [];
}

function firstMatching(refs, pattern) {
  return refs.find((ref) => pattern.test(ref)) ?? refs[0];
}

function authoredReview(hypothesis, overrides = {}) {
  const generalRef = firstMatching(hypothesis.evidenceRefs, /\.webm$|\.png$/i);
  const mobileRef = firstMatching(refsFor(hypothesis, 'mobile-recomposition'), /\.webm$|\.png$/i);
  const reducedRef = firstMatching(refsFor(hypothesis, 'reduced-motion'), /\.webm$|\.png$/i);
  const timelineRef = firstMatching(hypothesis.evidenceRefs, /timeline|\.json$/i);
  const dimensions = Object.fromEntries(MOTION_CRITIC_DIMENSIONS.map((key) => [key, {
    judgment: key === 'genericResistance' ? 'strong' : 'sound',
    rationale: `${hypothesis.title} is judged on ${key} from rendered temporal evidence, not from prose or implementation prestige.`,
    evidenceRefs: [generalRef]
  }]));
  dimensions.responsiveness.evidenceRefs = [mobileRef];
  dimensions.responsiveness.rationale = `${hypothesis.title} reinterprets the motion study at the mobile recomposition moment.`;
  dimensions.accessibility.evidenceRefs = [reducedRef];
  dimensions.accessibility.rationale = `${hypothesis.title} preserves hierarchy and state meaning in the reduced-motion study.`;
  dimensions.performance.evidenceRefs = [timelineRef];
  dimensions.performance.rationale = `${hypothesis.title} has bounded browser timing and frame evidence in the temporal trace.`;

  return {
    hypothesisId: hypothesis.id,
    dimensions: { ...dimensions, ...(overrides.dimensions ?? {}) },
    strengths: overrides.strengths ?? [`${hypothesis.title} has a distinct temporal point of view.`],
    risks: overrides.risks ?? [`${hypothesis.title} could become mannered if applied beyond earned moments.`],
    killCriteria: overrides.killCriteria ?? [`Reject ${hypothesis.title} if proof shows hierarchy or interaction clarity becoming weaker.`]
  };
}

function validCritiqueFixture() {
  const { exploration, evidence } = buildMotionProofFixture();
  const brief = buildMotionCriticBrief({ exploration, proofEvidence: evidence });
  assert.equal(brief.reviewReady, true);
  const hypothesisReviews = brief.hypotheses.map((hypothesis) => authoredReview(hypothesis));
  const critique = buildMotionCritique({
    brief,
    hypothesisReviews,
    comparativeJudgment: {
      recommendedHypothesisId: 'editorial',
      rationale: 'Editorial Rhythm best balances concept fidelity, hierarchy, restraint and generic resistance across the rendered comparison.',
      rejectedAlternatives: [
        { hypothesisId: 'continuity', rationale: 'Continuity is coherent but gives minor transitions more temporal weight than this proof needs.' },
        { hypothesisId: 'tactile', rationale: 'Tactile response is expressive but risks making the intelligence workflow feel more playful than authoritative.' }
      ]
    }
  });
  return { exploration, evidence, brief, hypothesisReviews, critique };
}

test('Motion Critic brief requires the exact rendered proof and recomputes upstream Motion authority', () => {
  const { exploration, evidence } = buildMotionProofFixture();
  const brief = buildMotionCriticBrief({ exploration, proofEvidence: evidence });

  assert.equal(brief.reviewReady, true);
  assert.equal(brief.status, 'ready-for-authored-motion-critique');
  assert.equal(brief.truth.criticBriefAuthorityRecomputedFromInputs, true);
  assert.equal(brief.truth.numericAverageCannotSelectWinner, true);
  assert.equal(brief.hypotheses.length, 3);
  assert.ok(brief.hypotheses.every((hypothesis) => hypothesis.evidenceRefs.length > 0));
  assert.ok(brief.hypotheses.every((hypothesis) => refsFor(hypothesis, 'mobile-recomposition').length > 0));
  assert.ok(brief.hypotheses.every((hypothesis) => refsFor(hypothesis, 'reduced-motion').length > 0));
});

test('complete comparative critique becomes ready for human selection but remains advisory', () => {
  const { critique } = validCritiqueFixture();

  assert.equal(critique.reviewReady, true);
  assert.equal(critique.status, 'ready-for-human-motion-selection');
  assert.equal(critique.truth.renderedEvidenceReviewed, true);
  assert.equal(critique.truth.criticRecommendationIsAdvisory, true);
  assert.equal(critique.truth.humanMotionSelectionConfirmed, false);
  assert.equal(critique.truth.numericAverageSelectedWinner, false);
  assert.equal(critique.truth.productionApproved, false);
});

test('Critic cannot trust forged brief reviewReady flags when underlying proof authority is invalid', () => {
  const { brief, hypothesisReviews } = validCritiqueFixture();
  const forgedBrief = structuredClone(brief);
  forgedBrief.reviewReady = true;
  forgedBrief.authorityInputs.proofEvidence.renderedStudies = forgedBrief.authorityInputs.proofEvidence.renderedStudies.slice(1);

  const result = reviewMotionCritique({
    schema: 'ai-studio-os/motion-critic-review@1',
    brief: forgedBrief,
    hypothesisReviews,
    comparativeJudgment: {
      recommendedHypothesisId: 'editorial',
      rationale: 'Forged caller claim.',
      rejectedAlternatives: [
        { hypothesisId: 'continuity', rationale: 'Alternative.' },
        { hypothesisId: 'tactile', rationale: 'Alternative.' }
      ]
    }
  });

  assert.equal(result.reviewReady, false);
  assert.ok(result.findings.some((item) => item.code === 'motion-critic-brief-invalid'));
  assert.equal(result.truth.criticBriefAuthorityRecomputed, true);
});

test('responsive, accessibility and performance judgments must cite the correct rendered evidence classes', () => {
  const { critique } = validCritiqueFixture();
  const corrupted = structuredClone(critique);
  const first = corrupted.hypothesisReviews[0];
  const genericRef = corrupted.brief.hypotheses[0].evidenceRefs.find((ref) => /\.webm$/i.test(ref));
  first.dimensions.responsiveness.evidenceRefs = [genericRef];
  first.dimensions.accessibility.evidenceRefs = [genericRef];
  first.dimensions.performance.evidenceRefs = [genericRef];

  const result = reviewMotionCritique(corrupted);
  assert.equal(result.reviewReady, false);
  assert.ok(result.findings.some((item) => item.code === 'motion-critic-mobile-evidence-missing'));
  assert.ok(result.findings.some((item) => item.code === 'motion-critic-reduced-motion-evidence-missing'));
  assert.ok(result.findings.some((item) => item.code === 'motion-critic-performance-timeline-missing'));
});

test('Critic must explain every alternative and cannot recommend a hypothesis it marks blocker', () => {
  const { brief } = validCritiqueFixture();
  const reviews = brief.hypotheses.map((hypothesis) => authoredReview(hypothesis));
  const editorial = reviews.find((item) => item.hypothesisId === 'editorial');
  editorial.dimensions.conceptFidelity = {
    ...editorial.dimensions.conceptFidelity,
    judgment: 'blocker',
    rationale: 'Rendered motion introduces a competing concept and therefore cannot survive review.'
  };

  const critique = buildMotionCritique({
    brief,
    hypothesisReviews: reviews,
    comparativeJudgment: {
      recommendedHypothesisId: 'editorial',
      rationale: 'This recommendation should be rejected because its own review contains a blocker.',
      rejectedAlternatives: [{ hypothesisId: 'continuity', rationale: 'Only one alternative explained.' }]
    }
  });

  assert.equal(critique.reviewReady, false);
  assert.ok(critique.findings.some((item) => item.code === 'motion-critic-recommended-hypothesis-blocked'));
  assert.ok(critique.findings.some((item) => item.code === 'motion-critic-alternative-rejections-incomplete'));
});

test('proof plus Critic still cannot create motion-direction@1 without explicit human confirmation and reviewed evidence', () => {
  const { exploration, critique, brief } = validCritiqueFixture();
  const selected = brief.hypotheses.find((item) => item.id === 'editorial');

  assert.equal(buildProvenMotionDirection({
    exploration,
    critique,
    hypothesisId: 'editorial',
    humanConfirmed: false,
    rationale: 'Human has not confirmed.',
    reviewedEvidenceRefs: selected.requiredSelectionEvidenceRefs
  }), null);

  assert.equal(buildProvenMotionDirection({
    exploration,
    critique,
    hypothesisId: 'editorial',
    humanConfirmed: true,
    rationale: 'Human confirms after comparison.',
    reviewedEvidenceRefs: selected.requiredSelectionEvidenceRefs.slice(1)
  }), null);
});

test('human may overrule the advisory Critic recommendation when the chosen hypothesis evidence was explicitly reviewed', () => {
  const { exploration, critique, brief } = validCritiqueFixture();
  const tactile = brief.hypotheses.find((item) => item.id === 'tactile');
  const direction = buildProvenMotionDirection({
    exploration,
    critique,
    hypothesisId: 'tactile',
    humanConfirmed: true,
    rationale: 'Human review prefers the tactile interpretation for its stronger sense of consequence despite the Critic recommending Editorial Rhythm.',
    reviewedEvidenceRefs: tactile.requiredSelectionEvidenceRefs
  });

  assert.ok(direction);
  assert.equal(direction.schema, 'ai-studio-os/motion-direction@1');
  assert.equal(direction.status, 'proven-awaiting-technical-planning');
  assert.equal(direction.hypothesisId, 'tactile');
  assert.equal(direction.critic.recommendationFollowed, false);
  assert.equal(direction.truth.renderedMotionProofReviewed, true);
  assert.equal(direction.truth.motionCriticReviewed, true);
  assert.equal(direction.truth.humanCreativeSelectionConfirmed, true);
  assert.equal(direction.truth.technicalPlanningAuthorized, true);
  assert.equal(direction.truth.productionApproved, false);
});
