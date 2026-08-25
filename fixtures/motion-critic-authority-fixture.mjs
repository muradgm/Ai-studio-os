import {
  MOTION_CRITIC_DIMENSIONS,
  buildMotionCriticBrief,
  buildMotionCritique
} from '../modules/motion-creative-intelligence/critic.mjs';
import { buildMotionProofFixture } from './motion-creative-authority-fixture.mjs';

function firstMatching(refs = [], pattern) {
  return refs.find((ref) => pattern.test(ref)) ?? refs[0] ?? null;
}

function authoredReview(hypothesis) {
  const generalRef = firstMatching(hypothesis.evidenceRefs, /\.webm$|\.png$/i);
  const mobileRef = firstMatching(hypothesis.momentEvidence?.['mobile-recomposition'], /\.webm$|\.png$/i);
  const reducedRef = firstMatching(hypothesis.momentEvidence?.['reduced-motion'], /\.webm$|\.png$/i);
  const timelineRef = firstMatching(hypothesis.evidenceRefs, /timeline|\.json$/i);
  const dimensions = Object.fromEntries(MOTION_CRITIC_DIMENSIONS.map((key) => [key, {
    judgment: key === 'genericResistance' ? 'strong' : 'sound',
    rationale: `${hypothesis.title} is judged on ${key} from rendered temporal evidence rather than prose or implementation prestige.`,
    evidenceRefs: [generalRef]
  }]));
  dimensions.responsiveness = {
    judgment: 'sound',
    rationale: `${hypothesis.title} is explicitly reviewed at the mobile recomposition moment.`,
    evidenceRefs: [mobileRef]
  };
  dimensions.accessibility = {
    judgment: 'sound',
    rationale: `${hypothesis.title} preserves hierarchy and state meaning in reduced motion.`,
    evidenceRefs: [reducedRef]
  };
  dimensions.performance = {
    judgment: 'sound',
    rationale: `${hypothesis.title} has bounded browser timing and frame evidence in the temporal trace.`,
    evidenceRefs: [timelineRef]
  };
  return {
    hypothesisId: hypothesis.id,
    dimensions,
    strengths: [`${hypothesis.title} has a distinct temporal point of view.`],
    risks: [`${hypothesis.title} could become mannered if applied beyond earned moments.`],
    killCriteria: [`Reject ${hypothesis.title} if rendered use weakens hierarchy or interaction clarity.`]
  };
}

export function buildMotionCritiqueFixture({ recommendedHypothesisId = 'editorial' } = {}) {
  const proof = buildMotionProofFixture();
  const brief = buildMotionCriticBrief({ exploration: proof.exploration, proofEvidence: proof.evidence });
  if (!brief.reviewReady) throw new Error(`Motion Critic brief fixture failed: ${brief.findings.map((item) => item.code).join(', ')}`);
  const hypothesisReviews = brief.hypotheses.map(authoredReview);
  const rejectedAlternatives = brief.hypotheses
    .filter((item) => item.id !== recommendedHypothesisId)
    .map((item) => ({
      hypothesisId: item.id,
      rationale: `${item.title} remains viable but loses the fixture comparison on the selected balance of hierarchy, restraint and concept fit.`
    }));
  const critique = buildMotionCritique({
    brief,
    hypothesisReviews,
    comparativeJudgment: {
      recommendedHypothesisId,
      rationale: `${brief.hypotheses.find((item) => item.id === recommendedHypothesisId)?.title ?? recommendedHypothesisId} is the advisory Critic recommendation after comparative rendered review.`,
      rejectedAlternatives
    }
  });
  if (!critique.reviewReady) throw new Error(`Motion Critique fixture failed: ${critique.findings.map((item) => item.code).join(', ')}`);
  return { ...proof, brief, hypothesisReviews, critique };
}
