import { buildProvenMotionDirection, reviewMotionCritique } from './critic.mjs';
import { reviewMotionProofEvidence } from './proof.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  }
  return value;
}

function sameContract(left, right) {
  return JSON.stringify(canonicalValue(left)) === JSON.stringify(canonicalValue(right));
}

function selectedHypothesis(exploration = {}, id = '') {
  return (Array.isArray(exploration?.hypotheses) ? exploration.hypotheses : []).find((item) => item?.id === id) ?? null;
}

function directionContract(direction = {}) {
  return {
    schema: direction.schema ?? null,
    status: direction.status ?? null,
    projectId: direction.projectId ?? null,
    creativeWorldId: direction.creativeWorldId ?? null,
    creativeWorldAuthority: direction.creativeWorldAuthority ?? null,
    hypothesisId: direction.hypothesisId ?? null,
    title: direction.title ?? null,
    interpretation: direction.interpretation ?? null,
    language: direction.language ?? null,
    motionMoments: direction.motionMoments ?? [],
    stillMoments: direction.stillMoments ?? [],
    hierarchyConsequences: direction.hierarchyConsequences ?? [],
    responsiveConsequences: direction.responsiveConsequences ?? [],
    antiPatterns: direction.antiPatterns ?? [],
    technicalOptions: direction.technicalOptions ?? [],
    specialistHandoffs: direction.specialistHandoffs ?? null,
    critic: direction.critic ?? null,
    truth: {
      humanCreativeSelectionConfirmed: direction.truth?.humanCreativeSelectionConfirmed === true,
      renderedMotionProofReviewed: direction.truth?.renderedMotionProofReviewed === true,
      motionCriticReviewed: direction.truth?.motionCriticReviewed === true,
      criticRecommendationIsAdvisory: direction.truth?.criticRecommendationIsAdvisory === true,
      technicalPlanningAuthorized: direction.truth?.technicalPlanningAuthorized === true,
      productionApproved: direction.truth?.productionApproved === true
    }
  };
}

function proofAuthorityFromCriticReview(criticReview = {}) {
  const proofEvidence = criticReview.authoritativeBrief?.authorityInputs?.proofEvidence ?? null;
  const proofReview = reviewMotionProofEvidence(proofEvidence ?? {});
  return {
    proofEvidence,
    proofReview,
    exactBrowserTemporalEvidence: proofReview.reviewReady === true && proofReview.truth?.exactBrowserTemporalEvidence === true,
    artifactDigestsRecomputed: proofReview.reviewReady === true && proofReview.truth?.artifactDigestsRecomputed === true,
    testFixtureEvidenceOnly: proofReview.truth?.testFixtureEvidenceOnly === true
  };
}

export function buildAuthoritativeMotionDirection({
  exploration = null,
  critique,
  hypothesisId,
  humanConfirmed = false,
  rationale = '',
  reviewedEvidenceRefs = []
} = {}) {
  const criticReview = reviewMotionCritique(critique ?? {});
  if (!criticReview.reviewReady) return null;

  const proofAuthority = proofAuthorityFromCriticReview(criticReview);
  if (!proofAuthority.exactBrowserTemporalEvidence || !proofAuthority.artifactDigestsRecomputed || proofAuthority.testFixtureEvidenceOnly) return null;

  const authoritativeExploration = criticReview.authoritativeBrief?.authorityInputs?.exploration ?? null;
  const id = text(hypothesisId);
  if (!authoritativeExploration || !id) return null;

  const authoritativeHypothesis = selectedHypothesis(authoritativeExploration, id);
  if (!authoritativeHypothesis) return null;

  if (exploration) {
    if (exploration?.projectId !== authoritativeExploration?.projectId || exploration?.creativeWorldId !== authoritativeExploration?.creativeWorldId) return null;
    const callerHypothesis = selectedHypothesis(exploration, id);
    if (!callerHypothesis || !sameContract(callerHypothesis, authoritativeHypothesis)) return null;
  }

  const reviewedRefs = list(reviewedEvidenceRefs);
  const direction = buildProvenMotionDirection({
    exploration: authoritativeExploration,
    critique,
    hypothesisId: id,
    humanConfirmed,
    rationale,
    reviewedEvidenceRefs: reviewedRefs
  });
  if (!direction) return null;

  return {
    ...direction,
    schema: 'ai-studio-os/motion-direction@1',
    status: 'proven-awaiting-technical-planning',
    authorityInputs: {
      critique,
      hypothesisId: id,
      humanConfirmed: humanConfirmed === true,
      rationale: text(rationale),
      reviewedEvidenceRefs: reviewedRefs
    },
    truth: {
      ...(direction.truth ?? {}),
      directionBuiltFromCriticAuthoritativeExploration: true,
      exactProvenHypothesisContractRequired: true,
      exactBrowserTemporalEvidenceRequired: true,
      proofAuthorityRecomputedForDirection: true,
      referencedArtifactDigestsRecomputed: proofAuthority.artifactDigestsRecomputed,
      testFixtureEvidenceRejectedForTechnicalAuthority: true,
      directionAuthorityRecomputable: true,
      finalMotionDirectionAuthorityRequired: false,
      finalMotionDirectionAuthoritySatisfied: true,
      shallowTechnicalPlanningFlagAccepted: false,
      technicalPlanningAuthorized: true,
      productionApproved: false
    }
  };
}

export function reviewMotionDirectionAuthority(direction = {}) {
  const findings = [];
  if (direction?.schema !== 'ai-studio-os/motion-direction@1') {
    findings.push(finding('blocker', 'motion-direction-schema-invalid', 'Technical planning requires motion-direction@1.'));
  }
  if (direction?.status !== 'proven-awaiting-technical-planning') {
    findings.push(finding('blocker', 'motion-direction-status-invalid', 'Motion Direction must be proven and awaiting technical planning.', { status: direction?.status ?? null }));
  }

  const inputs = direction?.authorityInputs ?? {};
  const rebuilt = buildAuthoritativeMotionDirection({
    critique: inputs.critique,
    hypothesisId: inputs.hypothesisId,
    humanConfirmed: inputs.humanConfirmed,
    rationale: inputs.rationale,
    reviewedEvidenceRefs: inputs.reviewedEvidenceRefs
  });
  if (!rebuilt) {
    findings.push(finding('blocker', 'motion-direction-authority-recompute-failed', 'Motion Direction authority could not be reconstructed from independently verified browser proof, Critic review and explicit human evidence review.'));
  } else if (!sameContract(directionContract(direction), directionContract(rebuilt))) {
    findings.push(finding('blocker', 'motion-direction-authority-drift', 'Claimed Motion Direction drifted from the exact direction reconstructed from its proof and Critic authority.', {
      claimedHypothesisId: direction?.hypothesisId ?? null,
      rebuiltHypothesisId: rebuilt?.hypothesisId ?? null
    }));
  }

  if (direction?.truth?.technicalPlanningAuthorized !== true) {
    findings.push(finding('blocker', 'motion-direction-technical-planning-not-authorized', 'Motion Direction has not completed the proof, Critic and human-selection gates required for technical planning.'));
  }
  if (direction?.truth?.productionApproved === true) {
    findings.push(finding('blocker', 'motion-direction-production-approval-fabricated', 'Motion Direction may authorize technical planning, not production approval.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/motion-direction-authority-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'authoritative-for-technical-planning',
    findings,
    authority: blockers.length ? null : {
      projectId: rebuilt.projectId,
      creativeWorldId: rebuilt.creativeWorldId,
      hypothesisId: rebuilt.hypothesisId,
      reviewedEvidenceRefs: list(rebuilt.critic?.reviewedEvidenceRefs)
    },
    truth: {
      motionDirectionRecomputedFromAuthorityInputs: true,
      exactProvenHypothesisContractRequired: true,
      exactBrowserTemporalEvidenceRequired: true,
      proofAuthorityRecomputedForDirection: true,
      testFixtureEvidenceRejectedForTechnicalAuthority: true,
      renderedMotionProofReviewed: rebuilt?.truth?.renderedMotionProofReviewed === true,
      motionCriticReviewed: rebuilt?.truth?.motionCriticReviewed === true,
      humanMotionSelectionConfirmed: rebuilt?.truth?.humanCreativeSelectionConfirmed === true,
      shallowTechnicalPlanningFlagAccepted: false,
      productionApproved: false
    }
  };
}
