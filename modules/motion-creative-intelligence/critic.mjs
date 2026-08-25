import { reviewMotionCreativeExploration, selectedMotionDirection } from './runtime.mjs';
import { reviewMotionProofEvidence } from './proof.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

export const MOTION_CRITIC_DIMENSIONS = Object.freeze([
  'conceptFidelity',
  'hierarchy',
  'restraint',
  'rhythm',
  'continuity',
  'genericResistance',
  'responsiveness',
  'accessibility',
  'performance'
]);

const JUDGMENTS = new Set(['strong', 'sound', 'mixed', 'weak', 'blocker']);

function sameIds(left = [], right = []) {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function uniqueRefsForStudies(studies = []) {
  return list(studies.flatMap((study) => [study.videoRef, study.captureRef, study.sourceRef, study.timelineRef]));
}

function evidenceRefsByMoment(studies = [], momentId) {
  return uniqueRefsForStudies(studies.filter((study) => study.momentId === momentId));
}

export function buildMotionCriticBrief({ exploration, proofEvidence } = {}) {
  const findings = [];
  const explorationReview = reviewMotionCreativeExploration(exploration ?? {});
  const proofReview = reviewMotionProofEvidence(proofEvidence ?? {});
  if (!explorationReview.reviewReady) findings.push(finding('blocker', 'motion-critic-exploration-not-ready', 'Motion Critic requires a creatively review-ready Motion exploration.', { findingCodes: explorationReview.findings.map((item) => item.code) }));
  if (!proofReview.reviewReady) findings.push(finding('blocker', 'motion-critic-proof-not-ready', 'Motion Critic requires review-ready rendered temporal evidence.', { findingCodes: proofReview.findings.map((item) => item.code) }));
  if (exploration?.projectId !== proofEvidence?.projectId || exploration?.creativeWorldId !== proofEvidence?.creativeWorldId) findings.push(finding('blocker', 'motion-critic-proof-binding-drift', 'Motion Critic proof must remain bound to the same project and Creative World as the exploration.'));

  const explorationIds = (exploration?.hypotheses ?? []).map((item) => item.id);
  const proofIds = (proofEvidence?.plan?.hypotheses ?? []).map((item) => item.id);
  if (!sameIds(explorationIds, proofIds)) findings.push(finding('blocker', 'motion-critic-hypothesis-set-drift', 'Motion Critic must compare the exact hypothesis set that was rendered.', { explorationIds, proofIds }));

  const renderedStudies = Array.isArray(proofEvidence?.renderedStudies) ? proofEvidence.renderedStudies : [];
  const hypotheses = (exploration?.hypotheses ?? []).map((hypothesis) => {
    const studies = renderedStudies.filter((study) => study.hypothesisId === hypothesis.id);
    return {
      id: hypothesis.id,
      title: hypothesis.title,
      interpretation: hypothesis.interpretation,
      motionThesis: hypothesis.language?.motionThesis ?? null,
      signatureMotionBehavior: hypothesis.language?.signatureMotionBehavior ?? null,
      stillnessPolicy: hypothesis.language?.stillnessPolicy ?? null,
      evidenceRefs: uniqueRefsForStudies(studies),
      requiredSelectionEvidenceRefs: list(studies.map((study) => study.videoRef || study.captureRef)),
      momentEvidence: Object.fromEntries((proofEvidence?.plan?.moments ?? []).map((moment) => [moment.id, evidenceRefsByMoment(studies, moment.id)]))
    };
  });

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/motion-critic-brief@1',
    stage: 'motion-critic-brief',
    projectId: exploration?.projectId ?? null,
    creativeWorldId: exploration?.creativeWorldId ?? null,
    authorityInputs: { exploration: exploration ?? null, proofEvidence: proofEvidence ?? null },
    explorationRef: { schema: exploration?.schema ?? null, hypothesisIds: explorationIds },
    proofRef: {
      schema: proofEvidence?.schema ?? null,
      status: proofEvidence?.status ?? null,
      studyIds: (proofEvidence?.renderedStudies ?? []).map((study) => study.studyId),
      comparisonRefs: list(proofEvidence?.comparisonRefs)
    },
    hypotheses,
    dimensions: [...MOTION_CRITIC_DIMENSIONS],
    guidance: {
      conceptFidelity: 'Does motion strengthen the selected Creative World rather than introduce a competing concept?',
      hierarchy: 'Does motion clarify what matters first, second and not at all?',
      restraint: 'Does movement earn attention, with stillness used deliberately?',
      rhythm: 'Do timing, holds, transitions and recovery create an intentional temporal composition?',
      continuity: 'Are spatial and semantic relationships preserved or deliberately cut when the concept requires it?',
      genericResistance: 'Does the work resist generic premium-web motion habits and express project-specific character?',
      responsiveness: 'Is motion reinterpreted for mobile/touch rather than mechanically scaled down?',
      accessibility: 'Does reduced-motion preserve hierarchy, meaning and interaction equivalence?',
      performance: 'Does the temporal behavior remain bounded and technically plausible without letting feasibility substitute for taste?'
    },
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-for-authored-motion-critique',
    truth: {
      renderedProofIsEvidenceNotCritique: true,
      criticBriefAuthorityRecomputedFromInputs: true,
      criticMustJudgeComparatively: true,
      criticRecommendationIsAdvisory: true,
      humanMotionSelectionRequired: true,
      numericAverageCannotSelectWinner: true,
      productionApproved: false
    }
  };
}

function normalizeDimension(value = {}) {
  return {
    judgment: text(value.judgment).toLowerCase(),
    rationale: text(value.rationale),
    evidenceRefs: list(value.evidenceRefs)
  };
}

function normalizeHypothesisReview(value = {}) {
  const dimensions = value.dimensions && typeof value.dimensions === 'object' ? value.dimensions : {};
  return {
    hypothesisId: text(value.hypothesisId),
    dimensions: Object.fromEntries(MOTION_CRITIC_DIMENSIONS.map((key) => [key, normalizeDimension(dimensions[key] ?? {})])),
    strengths: list(value.strengths),
    risks: list(value.risks),
    killCriteria: list(value.killCriteria)
  };
}

function recomputeBrief(claimedBrief = {}) {
  return buildMotionCriticBrief({
    exploration: claimedBrief?.authorityInputs?.exploration,
    proofEvidence: claimedBrief?.authorityInputs?.proofEvidence
  });
}

export function reviewMotionCritique(critique = {}) {
  const findings = [];
  const claimedBrief = critique?.brief ?? {};
  const brief = recomputeBrief(claimedBrief);
  if (critique?.schema !== 'ai-studio-os/motion-critic-review@1') findings.push(finding('blocker', 'motion-critic-schema-invalid', 'Motion Critic review requires motion-critic-review@1.'));
  if (claimedBrief?.schema !== 'ai-studio-os/motion-critic-brief@1') findings.push(finding('blocker', 'motion-critic-brief-schema-invalid', 'Motion Critic requires motion-critic-brief@1.'));
  if (!brief.reviewReady) findings.push(finding('blocker', 'motion-critic-brief-invalid', 'Motion Critic brief authority failed recomputation from its underlying exploration and rendered proof.', { findingCodes: brief.findings.map((item) => item.code) }));
  if (claimedBrief?.projectId !== brief.projectId || claimedBrief?.creativeWorldId !== brief.creativeWorldId || !sameIds(claimedBrief?.hypotheses?.map((item) => item.id) ?? [], brief.hypotheses.map((item) => item.id))) findings.push(finding('blocker', 'motion-critic-brief-drift', 'Claimed critic brief identity or hypothesis set drifted from recomputed authority.'));

  const expectedIds = brief.hypotheses.map((item) => item.id);
  const hypothesisReviews = Array.isArray(critique?.hypothesisReviews) ? critique.hypothesisReviews : [];
  const normalizedReviews = hypothesisReviews.map(normalizeHypothesisReview);
  const reviewIds = normalizedReviews.map((item) => item.hypothesisId);
  if (!sameIds(expectedIds, reviewIds)) findings.push(finding('blocker', 'motion-critic-review-coverage-invalid', 'Critic must review every rendered hypothesis exactly once.', { expectedIds, reviewIds }));

  for (const review of normalizedReviews) {
    const hypothesis = brief.hypotheses.find((item) => item.id === review.hypothesisId);
    if (!hypothesis) continue;
    const allowedRefs = new Set(hypothesis.evidenceRefs ?? []);
    for (const key of MOTION_CRITIC_DIMENSIONS) {
      const dimension = review.dimensions[key];
      if (!JUDGMENTS.has(dimension.judgment)) findings.push(finding('major', 'motion-critic-judgment-invalid', `Critic dimension ${key} requires one supported qualitative judgment.`, { hypothesisId: review.hypothesisId, dimension: key, judgment: dimension.judgment || null }));
      if (!dimension.rationale) findings.push(finding('major', 'motion-critic-rationale-missing', `Critic dimension ${key} requires explicit rationale.`, { hypothesisId: review.hypothesisId, dimension: key }));
      if (!dimension.evidenceRefs.length || dimension.evidenceRefs.some((ref) => !allowedRefs.has(ref))) findings.push(finding('major', 'motion-critic-evidence-invalid', `Critic dimension ${key} must cite rendered evidence for the same hypothesis.`, { hypothesisId: review.hypothesisId, dimension: key, evidenceRefs: dimension.evidenceRefs }));
    }
    const responsiveRefs = new Set(hypothesis.momentEvidence?.['mobile-recomposition'] ?? []);
    if (!review.dimensions.responsiveness.evidenceRefs.some((ref) => responsiveRefs.has(ref))) findings.push(finding('major', 'motion-critic-mobile-evidence-missing', 'Responsiveness judgment must cite mobile-recomposition evidence.', { hypothesisId: review.hypothesisId }));
    const reducedRefs = new Set(hypothesis.momentEvidence?.['reduced-motion'] ?? []);
    if (!review.dimensions.accessibility.evidenceRefs.some((ref) => reducedRefs.has(ref))) findings.push(finding('major', 'motion-critic-reduced-motion-evidence-missing', 'Accessibility judgment must cite reduced-motion evidence.', { hypothesisId: review.hypothesisId }));
    const timelineRefs = new Set((hypothesis.evidenceRefs ?? []).filter((ref) => /timeline|\.json$/i.test(ref)));
    if (!review.dimensions.performance.evidenceRefs.some((ref) => timelineRefs.has(ref))) findings.push(finding('major', 'motion-critic-performance-timeline-missing', 'Performance judgment must cite browser timeline evidence.', { hypothesisId: review.hypothesisId }));
    if (!review.strengths.length || !review.risks.length || !review.killCriteria.length) findings.push(finding('major', 'motion-critic-adversarial-review-thin', 'Each hypothesis needs strengths, risks and kill criteria before comparative recommendation.', { hypothesisId: review.hypothesisId }));
  }

  const comparative = critique?.comparativeJudgment ?? {};
  const recommendedId = text(comparative.recommendedHypothesisId);
  if (!expectedIds.includes(recommendedId)) findings.push(finding('blocker', 'motion-critic-recommendation-invalid', 'Critic recommendation must reference one reviewed hypothesis.', { recommendedHypothesisId: recommendedId || null }));
  if (!text(comparative.rationale)) findings.push(finding('major', 'motion-critic-comparative-rationale-missing', 'Critic recommendation requires comparative rationale.'));
  const rejections = Array.isArray(comparative.rejectedAlternatives) ? comparative.rejectedAlternatives : [];
  const rejectedIds = rejections.map((item) => text(item?.hypothesisId)).filter(Boolean);
  const expectedRejected = expectedIds.filter((id) => id !== recommendedId);
  if (!sameIds(expectedRejected, rejectedIds) || rejections.some((item) => !text(item?.rationale))) findings.push(finding('major', 'motion-critic-alternative-rejections-incomplete', 'Critic must explain why every non-recommended hypothesis loses comparatively.', { expectedRejected, rejectedIds }));
  const recommendedReview = normalizedReviews.find((item) => item.hypothesisId === recommendedId);
  if (recommendedReview && Object.values(recommendedReview.dimensions).some((dimension) => dimension.judgment === 'blocker')) findings.push(finding('blocker', 'motion-critic-recommended-hypothesis-blocked', 'Critic cannot recommend a hypothesis that it also marks with a blocker judgment.', { hypothesisId: recommendedId }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/motion-critic-review-result@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-human-motion-selection',
    findings,
    normalizedReviews,
    authoritativeBrief: brief,
    truth: {
      criticBriefAuthorityRecomputed: true,
      renderedEvidenceReviewed: blockers.length === 0 && majors.length === 0,
      criticRecommendationIsAdvisory: true,
      humanMotionSelectionConfirmed: false,
      numericAverageSelectedWinner: false,
      productionApproved: false
    }
  };
}

export function buildMotionCritique({ brief, hypothesisReviews = [], comparativeJudgment = {} } = {}) {
  const critique = {
    schema: 'ai-studio-os/motion-critic-review@1',
    stage: 'motion-critic',
    projectId: brief?.projectId ?? null,
    creativeWorldId: brief?.creativeWorldId ?? null,
    brief,
    hypothesisReviews: hypothesisReviews.map(normalizeHypothesisReview),
    comparativeJudgment: {
      recommendedHypothesisId: text(comparativeJudgment.recommendedHypothesisId),
      rationale: text(comparativeJudgment.rationale),
      rejectedAlternatives: (Array.isArray(comparativeJudgment.rejectedAlternatives) ? comparativeJudgment.rejectedAlternatives : []).map((item) => ({ hypothesisId: text(item?.hypothesisId), rationale: text(item?.rationale) }))
    },
    truth: {
      recommendationOnly: true,
      humanMotionSelectionConfirmed: false,
      technicalPlanningAuthorized: false,
      productionApproved: false
    }
  };
  const review = reviewMotionCritique(critique);
  return { ...critique, review, pass: review.pass, reviewReady: review.reviewReady, status: review.status, findings: review.findings, truth: { ...critique.truth, ...review.truth } };
}

export function buildProvenMotionDirection({ exploration, critique, hypothesisId, humanConfirmed = false, rationale = '', reviewedEvidenceRefs = [] } = {}) {
  const criticReview = reviewMotionCritique(critique ?? {});
  if (!criticReview.reviewReady) return null;
  const authoritativeBrief = criticReview.authoritativeBrief;
  const id = text(hypothesisId);
  const selectedHypothesis = (exploration?.hypotheses ?? []).find((item) => item.id === id);
  if (!selectedHypothesis || humanConfirmed !== true || !text(rationale)) return null;
  if (critique?.projectId !== exploration?.projectId || critique?.creativeWorldId !== exploration?.creativeWorldId) return null;
  if (authoritativeBrief.projectId !== exploration?.projectId || authoritativeBrief.creativeWorldId !== exploration?.creativeWorldId) return null;

  const criticHypothesis = authoritativeBrief.hypotheses.find((item) => item.id === id);
  if (!criticHypothesis) return null;
  const reviewedRefs = list(reviewedEvidenceRefs);
  const allowedRefs = new Set(criticHypothesis.evidenceRefs ?? []);
  const requiredRefs = list(criticHypothesis.requiredSelectionEvidenceRefs);
  if (!requiredRefs.length || requiredRefs.some((ref) => !reviewedRefs.includes(ref)) || reviewedRefs.some((ref) => !allowedRefs.has(ref))) return null;

  const candidate = selectedMotionDirection({
    ...exploration,
    selection: { hypothesisId: id, humanConfirmed: true, rationale: text(rationale) }
  });
  if (!candidate) return null;

  return {
    ...candidate,
    schema: 'ai-studio-os/motion-direction@1',
    status: 'proven-awaiting-technical-planning',
    critic: {
      schema: critique.schema,
      recommendedHypothesisId: critique.comparativeJudgment?.recommendedHypothesisId ?? null,
      recommendationFollowed: critique.comparativeJudgment?.recommendedHypothesisId === id,
      reviewedEvidenceRefs: reviewedRefs
    },
    truth: {
      ...candidate.truth,
      humanCreativePreferenceRecorded: true,
      humanCreativeSelectionConfirmed: true,
      renderedMotionProofStillRequired: false,
      motionCriticStillRequired: false,
      renderedMotionProofReviewed: true,
      motionCriticReviewed: true,
      criticRecommendationIsAdvisory: true,
      technicalPlanningAuthorized: true,
      productionApproved: false
    }
  };
}
