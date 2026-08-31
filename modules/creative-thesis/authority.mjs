import { authoredCandidateFromDeliberation, reviewCreativeThesisDeliberation } from './intelligence.mjs';
import { reviewCreativeThesis } from './runtime.mjs';
import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';

const HUMAN_DECISION_MODES = new Set([
  'approve-recommendation',
  'select-alternative',
  'refine-candidate',
  'human-authored-after-deliberation'
]);

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function thesisGoverningIdea(thesis = {}) {
  return clean(thesis?.governingIdea?.statement ?? thesis?.governingIdea);
}

function thesisCreativeTension(thesis = {}) {
  return clean(thesis?.creativeTension?.label ?? thesis?.creativeTension);
}

function decisionCore(value = {}) {
  return {
    schema: clean(value?.schema),
    projectId: clean(value?.projectId),
    decision: clean(value?.decision),
    sourceDeliberationFingerprint: clean(value?.sourceDeliberationFingerprint),
    sourceCandidateId: clean(value?.sourceCandidateId),
    sourceCandidateFingerprint: clean(value?.sourceCandidateFingerprint),
    approvedThesisFingerprint: clean(value?.approvedThesisFingerprint),
    rationale: clean(value?.rationale),
    refinementSummary: clean(value?.refinementSummary),
    humanConfirmed: value?.humanConfirmed === true,
    decidedAt: clean(value?.decidedAt),
    evidenceRef: clean(value?.evidenceRef)
  };
}

function candidateFor(deliberation = {}, candidateId = '') {
  return (deliberation?.hypotheses ?? []).find((item) => clean(item?.id) === clean(candidateId)) ?? null;
}

export function buildCreativeThesisHumanDecision({ deliberation, thesis, decision, sourceCandidateId = '', rationale, refinementSummary = '', humanConfirmed = false, decidedAt, evidenceRef = '' } = {}) {
  const candidate = candidateFor(deliberation, sourceCandidateId);
  const record = {
    schema: 'ai-studio-os/creative-thesis-human-decision@1',
    projectId: clean(thesis?.projectId ?? deliberation?.projectId),
    decision: clean(decision),
    sourceDeliberationFingerprint: fingerprintCreativeValue(deliberation ?? {}),
    sourceCandidateId: clean(sourceCandidateId),
    sourceCandidateFingerprint: candidate ? fingerprintCreativeValue(candidate) : '',
    approvedThesisFingerprint: fingerprintCreativeValue(thesis ?? {}),
    rationale: clean(rationale),
    refinementSummary: clean(refinementSummary),
    humanConfirmed: humanConfirmed === true,
    decidedAt: clean(decidedAt),
    evidenceRef: clean(evidenceRef)
  };
  return { ...record, decisionFingerprint: fingerprintCreativeValue(record) };
}

export function reviewCreativeThesisHumanDecision({ decision, deliberation, thesis } = {}) {
  if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
    return {
      schema: 'ai-studio-os/creative-thesis-human-decision-review@1',
      findings: [finding('blocker', 'creative-thesis-human-decision-missing', 'Creative Thesis authority requires an externally supplied explicit human decision record.')],
      pass: false,
      decision: null
    };
  }
  const findings = [];
  const core = decisionCore(decision);
  const projectId = clean(thesis?.projectId);
  const candidate = candidateFor(deliberation, core.sourceCandidateId);
  if (core.schema !== 'ai-studio-os/creative-thesis-human-decision@1' || !HUMAN_DECISION_MODES.has(core.decision)) findings.push(finding('blocker', 'creative-thesis-human-decision-schema-invalid', 'Creative Thesis authority requires a supported explicit human decision record.'));
  if (!core.projectId || core.projectId !== projectId || core.projectId !== clean(deliberation?.projectId)) findings.push(finding('blocker', 'creative-thesis-human-decision-project-drift', 'Human Thesis decision must bind the same explicit project as the deliberation and final Thesis.'));
  if (core.sourceDeliberationFingerprint !== fingerprintCreativeValue(deliberation ?? {})) findings.push(finding('blocker', 'creative-thesis-human-decision-deliberation-drift', 'Human Thesis decision must bind the exact re-reviewed deliberation snapshot.'));
  if (core.approvedThesisFingerprint !== fingerprintCreativeValue(thesis ?? {})) findings.push(finding('blocker', 'creative-thesis-human-decision-thesis-drift', 'Human Thesis decision must bind the exact final Thesis snapshot.'));
  if (!core.humanConfirmed || !core.rationale || !core.decidedAt) findings.push(finding('blocker', 'creative-thesis-human-decision-confirmation-missing', 'Human Thesis decision requires explicit confirmation, rationale and decision time.'));
  if (clean(decision?.decisionFingerprint) !== fingerprintCreativeValue(core)) findings.push(finding('blocker', 'creative-thesis-human-decision-fingerprint-drift', 'Human Thesis decision fingerprint must bind its exact decision content.'));
  const needsCandidate = ['approve-recommendation', 'select-alternative', 'refine-candidate'].includes(core.decision);
  if (needsCandidate && (!candidate || core.sourceCandidateFingerprint !== fingerprintCreativeValue(candidate))) findings.push(finding('blocker', 'creative-thesis-human-decision-source-candidate-drift', 'Human Thesis decision must bind the exact reviewed source candidate when one is claimed.'));
  if (!needsCandidate && (core.sourceCandidateId || core.sourceCandidateFingerprint || core.refinementSummary)) findings.push(finding('blocker', 'creative-thesis-human-decision-unexpected-source-candidate', 'Human-authored-after-deliberation must not impersonate a reviewed source candidate.'));
  if (core.decision === 'approve-recommendation' && core.sourceCandidateId !== clean(deliberation?.selection?.hypothesisId)) findings.push(finding('blocker', 'creative-thesis-human-decision-recommendation-drift', 'Approval of a recommendation must bind the deliberation’s exact recommended candidate.'));
  if (core.decision === 'refine-candidate' && !core.refinementSummary) findings.push(finding('blocker', 'creative-thesis-human-decision-refinement-summary-missing', 'A human refinement must record what changed from the reviewed candidate.'));
  return { schema: 'ai-studio-os/creative-thesis-human-decision-review@1', findings, pass: findings.every((item) => item.severity !== 'blocker'), decision: core };
}

export function reviewCreativeThesisAuthority({ deliberation, thesis, humanDecision } = {}) {
  const findings = [];

  if (deliberation?.schema !== 'ai-studio-os/creative-thesis-deliberation@1') {
    findings.push(finding('blocker', 'creative-thesis-authority-deliberation-schema-invalid', 'Canonical Creative Thesis authority requires the Creative Thesis deliberation contract.'));
  }
  const recomputedDeliberationReview = reviewCreativeThesisDeliberation(deliberation ?? {});
  if (recomputedDeliberationReview.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-thesis-authority-deliberation-not-ready', 'Canonical Creative Thesis authority requires deliberation that remains review-ready when structurally re-reviewed at the authority boundary.', {
      findingCodes: recomputedDeliberationReview.findings.map((item) => item.code)
    }));
  }

  if (thesis?.schema !== 'ai-studio-os/creative-thesis@1') {
    findings.push(finding('blocker', 'creative-thesis-authority-thesis-schema-invalid', 'Canonical Creative Thesis authority requires creative-thesis@1.'));
  }
  const recomputedThesisReview = reviewCreativeThesis(thesis ?? {});
  if (recomputedThesisReview.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-thesis-authority-thesis-not-ready', 'Canonical Creative Thesis authority requires a thesis that remains review-ready when structurally re-reviewed at the authority boundary.', {
      findingCodes: recomputedThesisReview.findings.map((item) => item.code)
    }));
  }

  const recommendation = recomputedDeliberationReview.reviewReady === true
    ? authoredCandidateFromDeliberation({ ...deliberation, reviewReady: true })
    : null;
  if (!recommendation) {
    findings.push(finding('blocker', 'creative-thesis-authority-candidate-unavailable', 'The re-reviewed deliberation must produce a traceable authored thesis candidate.'));
  }

  const deliberationProjectId = clean(deliberation?.projectId);
  const thesisProjectId = clean(thesis?.projectId);
  if (!deliberationProjectId || !thesisProjectId) {
    findings.push(finding('blocker', 'creative-thesis-authority-project-identity-missing', 'Canonical Creative Thesis authority requires both deliberation and thesis to carry explicit project identity.', {
      deliberationProjectId: deliberationProjectId || null,
      thesisProjectId: thesisProjectId || null
    }));
  } else if (deliberationProjectId !== thesisProjectId) {
    findings.push(finding('blocker', 'creative-thesis-authority-project-drift', 'Deliberation and thesis belong to different projects.', {
      deliberationProjectId,
      thesisProjectId
    }));
  }

  const decisionReview = reviewCreativeThesisHumanDecision({ decision: humanDecision, deliberation, thesis });
  if (!decisionReview.pass) {
    findings.push(...decisionReview.findings);
  } else if (decisionReview.decision.decision === 'approve-recommendation') {
    if (thesisGoverningIdea(thesis) !== clean(recommendation?.governingIdea)) findings.push(finding('blocker', 'creative-thesis-authority-governing-idea-drift', 'An unchanged recommendation approval must retain the exact deliberation-authored governing idea.'));
    if (thesisCreativeTension(thesis) !== clean(recommendation?.creativeTension)) findings.push(finding('blocker', 'creative-thesis-authority-tension-drift', 'An unchanged recommendation approval must retain the exact deliberation-authored creative tension.'));
  } else if (decisionReview.decision.decision === 'select-alternative') {
    const selected = candidateFor(deliberation, decisionReview.decision.sourceCandidateId);
    if (thesisGoverningIdea(thesis) !== clean(selected?.statement) || thesisCreativeTension(thesis) !== clean(selected?.tension)) findings.push(finding('blocker', 'creative-thesis-authority-selected-candidate-drift', 'Selection of another reviewed candidate must retain that candidate’s exact governing idea and creative tension.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-thesis-authority-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'authoritative',
    findings,
    authority: blockers.length ? null : {
      kind: 'canonical-creative-thesis',
      projectId: thesisProjectId,
      governingIdea: thesisGoverningIdea(thesis),
      creativeTension: thesisCreativeTension(thesis),
      deliberationSchema: deliberation.schema,
      thesisSchema: thesis.schema,
      humanApproved: true,
      humanDecisionMode: decisionReview.decision.decision,
      machineRecommendationWasNotFinalAuthority: decisionReview.decision.decision !== 'approve-recommendation',
      humanRefined: decisionReview.decision.decision === 'refine-candidate'
    },
    truth: {
      deliberationRecomputedAtAuthorityBoundary: true,
      thesisRecomputedAtAuthorityBoundary: true,
      deliberationProjectIdentityRequired: true,
      deliberationCanSelfApprove: false,
      humanCreativeApprovalRequired: true,
      humanDecisionRecordRequired: true,
      machineRecommendationWasNotFinalAuthority: decisionReview.decision?.decision !== 'approve-recommendation',
      arbitraryThesisObjectAccepted: false
    }
  };
}
