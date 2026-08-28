import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeSynthesisSetProvenance } from './runtime.mjs';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function list(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))];
}

function compareText(left, right) {
  const a = text(left);
  const b = text(right);
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function sortedList(value) {
  return list(value).sort(compareText);
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function sameValue(left, right) {
  return fingerprintCreativeValue(left) === fingerprintCreativeValue(right);
}

function unknownKeys(object, allowed) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return [];
  const allowedSet = new Set(allowed);
  return Object.keys(object).filter((key) => !allowedSet.has(key)).sort(compareText);
}

const TOP_LEVEL_KEYS = Object.freeze([
  'schema', 'stage', 'synthesisSnapshotFingerprint', 'synthesisProvenanceReceiptFingerprint',
  'candidates', 'snapshotFingerprint', 'truth', 'findings', 'pass', 'reviewReady', 'status'
]);
const CANDIDATE_KEYS = Object.freeze([
  'id', 'strategy', 'sourceCandidateIds', 'sourceContributions', 'projectTruthRefs', 'contradictionRefs',
  'governingIdea', 'productiveTension', 'combinationMechanism', 'experientialConsequences',
  'antiGenericClaims', 'ownabilityRisk', 'competitorTransferTest', 'failureModes', 'uncertainty',
  'falsifier', 'critique'
]);
const CONTRIBUTION_KEYS = Object.freeze(['sourceCandidateId', 'contribution']);
const COMPETITOR_TEST_KEYS = Object.freeze(['question', 'failureCondition']);

function canonicalTruth() {
  return {
    downstreamSynthesisCandidatesOnly: true,
    blockedCandidateContentRedacted: true,
    provenanceReverifiedAtEgress: true,
    noWinnerOrRecommendationProduced: true,
    noScoresProduced: true,
    structuralDivergenceOnly: true,
    semanticDivergenceVerified: false,
    semanticSynthesisVerified: false,
    creativeThesisSelected: false,
    creativeDirectionSelected: false,
    humanApprovalGranted: false,
    productionApproved: false
  };
}

function normalizeContribution(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return { sourceCandidateId: text(source.sourceCandidateId), contribution: text(source.contribution) };
}

function normalizeCompetitorTransferTest(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return { question: text(source.question), failureCondition: text(source.failureCondition) };
}

function normalizeCandidate(value = {}, index = 0) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    id: text(source.id) || `synthesis-hypothesis-${index + 1}`,
    strategy: text(source.strategy),
    sourceCandidateIds: sortedList(source.sourceCandidateIds),
    sourceContributions: (Array.isArray(source.sourceContributions) ? source.sourceContributions : [])
      .map(normalizeContribution)
      .sort((left, right) => compareText(left.sourceCandidateId, right.sourceCandidateId)),
    projectTruthRefs: sortedList(source.projectTruthRefs),
    contradictionRefs: sortedList(source.contradictionRefs),
    governingIdea: text(source.governingIdea),
    productiveTension: text(source.productiveTension),
    combinationMechanism: text(source.combinationMechanism),
    experientialConsequences: list(source.experientialConsequences),
    antiGenericClaims: list(source.antiGenericClaims),
    ownabilityRisk: text(source.ownabilityRisk),
    competitorTransferTest: normalizeCompetitorTransferTest(source.competitorTransferTest),
    failureModes: list(source.failureModes),
    uncertainty: text(source.uncertainty),
    falsifier: text(source.falsifier),
    critique: list(source.critique)
  };
}

function candidateSetFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-synthesis-candidate-set@1',
    synthesisSnapshotFingerprint: text(value.synthesisSnapshotFingerprint),
    synthesisProvenanceReceiptFingerprint: text(value.synthesisProvenanceReceiptFingerprint),
    candidates: value.candidates === null
      ? null
      : (Array.isArray(value.candidates) ? value.candidates : []).map(normalizeCandidate),
    truth: value.truth
  });
}

function canonicalCore({ synthesis, brief, sources } = {}) {
  const provenance = reviewCreativeSynthesisSetProvenance({ synthesis, brief, sources });
  const candidates = provenance.reviewReady === true
    ? (Array.isArray(synthesis?.hypotheses) ? synthesis.hypotheses : []).map(normalizeCandidate)
    : null;
  const core = {
    schema: 'ai-studio-os/creative-synthesis-candidate-set@1',
    stage: 'creative-synthesis-candidate-egress',
    synthesisSnapshotFingerprint: text(synthesis?.snapshotFingerprint),
    synthesisProvenanceReceiptFingerprint: fingerprintCreativeValue(provenance.sourceReceipt ?? {}),
    candidates,
    truth: canonicalTruth()
  };
  core.snapshotFingerprint = candidateSetFingerprint(core);
  return { core, provenance };
}

export function reviewCreativeSynthesisCandidateSet(candidateArtifact = {}, { synthesis, brief, sources } = {}) {
  const findings = [];
  const { core: expected, provenance } = canonicalCore({ synthesis, brief, sources });

  if (candidateArtifact?.schema !== 'ai-studio-os/creative-synthesis-candidate-set@1') findings.push(finding('blocker', 'creative-synthesis-candidate-set-schema-invalid', 'Creative Synthesis candidate egress requires creative-synthesis-candidate-set@1.'));
  if (candidateArtifact?.stage !== 'creative-synthesis-candidate-egress') findings.push(finding('blocker', 'creative-synthesis-candidate-set-stage-invalid', 'Creative Synthesis candidate egress requires the canonical egress stage.'));
  const unknownTop = unknownKeys(candidateArtifact, TOP_LEVEL_KEYS);
  if (unknownTop.length) findings.push(finding('blocker', 'creative-synthesis-candidate-set-shape-invalid', 'Synthesis candidate egress may contain only canonical payload and derived review fields.', { unknownKeys: unknownTop }));

  if (!provenance.reviewReady) findings.push(finding('blocker', 'creative-synthesis-candidate-set-source-provenance-blocked', 'Downstream Synthesis candidate emission requires independent Synthesis → Brief → every Transfer Candidate → Hypothesis → Brief → Retrieval → Graph → Foundation verification.', { findingCodes: provenance.findings.map((item) => item.code) }));
  if (text(candidateArtifact?.synthesisSnapshotFingerprint) !== text(expected.synthesisSnapshotFingerprint)) findings.push(finding('blocker', 'creative-synthesis-candidate-set-synthesis-binding-drift', 'Synthesis candidate egress must bind the exact supplied Synthesis snapshot.'));
  if (text(candidateArtifact?.synthesisProvenanceReceiptFingerprint) !== text(expected.synthesisProvenanceReceiptFingerprint)) findings.push(finding('blocker', 'creative-synthesis-candidate-set-provenance-binding-drift', 'Synthesis candidate egress must bind the independently recomputed Synthesis provenance receipt.'));

  if (candidateArtifact?.candidates !== null) {
    const candidates = Array.isArray(candidateArtifact.candidates) ? candidateArtifact.candidates : [];
    candidates.forEach((raw, index) => {
      const canonical = normalizeCandidate(raw, index);
      const unknown = unknownKeys(raw, CANDIDATE_KEYS);
      if (unknown.length || !sameValue(raw ?? {}, canonical)) findings.push(finding('blocker', 'creative-synthesis-candidate-payload-contract-drift', 'Downstream Synthesis candidate must use the exact canonical hypothesis projection.', { candidateId: canonical.id, unknownKeys: unknown }));
      (Array.isArray(raw?.sourceContributions) ? raw.sourceContributions : []).forEach((item, contributionIndex) => {
        const contributionUnknown = unknownKeys(item, CONTRIBUTION_KEYS);
        if (contributionUnknown.length) findings.push(finding('blocker', 'creative-synthesis-candidate-contribution-shape-invalid', 'Downstream Synthesis source contributions may contain only sourceCandidateId and contribution.', { candidateId: canonical.id, contributionIndex, unknownKeys: contributionUnknown }));
      });
      const competitorUnknown = unknownKeys(raw?.competitorTransferTest, COMPETITOR_TEST_KEYS);
      if (competitorUnknown.length) findings.push(finding('blocker', 'creative-synthesis-candidate-competitor-test-shape-invalid', 'Downstream Synthesis competitor-transfer test may contain only question and failureCondition.', { candidateId: canonical.id, unknownKeys: competitorUnknown }));
    });
  }

  if (!sameValue(candidateArtifact?.candidates ?? null, expected.candidates)) findings.push(finding('blocker', 'creative-synthesis-candidate-set-payload-drift', 'Downstream Synthesis candidates must equal the independently rebuilt safe projection.'));
  if (!sameValue(candidateArtifact?.truth ?? {}, canonicalTruth())) findings.push(finding('blocker', 'creative-synthesis-candidate-set-truth-drift', 'Synthesis candidate egress truth boundary is fixed and non-authoritative.'));
  if (text(candidateArtifact?.snapshotFingerprint) !== candidateSetFingerprint(expected)) findings.push(finding('blocker', 'creative-synthesis-candidate-set-fingerprint-mismatch', 'Synthesis candidate egress fingerprint must bind exact provenance, payload and truth state.'));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const expectedReady = coreBlockers.length === 0;
  const expectedStatus = expectedReady ? 'ready-for-creative-thesis-deliberation' : 'blocked';
  if (Object.hasOwn(candidateArtifact, 'pass') && candidateArtifact.pass !== expectedReady) findings.push(finding('blocker', 'creative-synthesis-candidate-set-pass-claim-drift', 'Cached Synthesis candidate pass flag must match fresh egress review.'));
  if (Object.hasOwn(candidateArtifact, 'reviewReady') && candidateArtifact.reviewReady !== expectedReady) findings.push(finding('blocker', 'creative-synthesis-candidate-set-ready-claim-drift', 'Cached Synthesis candidate reviewReady flag must match fresh egress review.'));
  if (Object.hasOwn(candidateArtifact, 'status') && candidateArtifact.status !== expectedStatus) findings.push(finding('blocker', 'creative-synthesis-candidate-set-status-claim-drift', 'Cached Synthesis candidate status must match fresh egress review.', { expected: expectedStatus, actual: candidateArtifact.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-synthesis-candidate-set-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-for-creative-thesis-deliberation',
    findings,
    computedFingerprint: candidateSetFingerprint(expected),
    truth: canonicalTruth()
  };
}

export function buildCreativeSynthesisCandidateSet({ synthesis, brief, sources } = {}) {
  const { core, provenance } = canonicalCore({ synthesis, brief, sources });
  const findings = [];
  if (!provenance.reviewReady) findings.push(finding('blocker', 'creative-synthesis-candidate-set-source-provenance-blocked', 'Downstream Synthesis candidate emission requires independently verified full provenance. Blocked output contains no candidate content.', { findingCodes: provenance.findings.map((item) => item.code) }));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    ...core,
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-for-creative-thesis-deliberation'
  };
}
