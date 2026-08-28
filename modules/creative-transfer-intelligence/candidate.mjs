import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeTransferHypothesisProvenance } from './runtime.mjs';

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

function normalizedCopyText(value) {
  return text(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function includesNormalizedPhrase(corpus, phrase) {
  const haystack = normalizedCopyText(corpus);
  const needle = normalizedCopyText(phrase);
  return Boolean(needle) && haystack.includes(needle);
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
  'schema', 'stage', 'hypothesisSnapshotFingerprint', 'hypothesisProvenanceReceiptFingerprint',
  'candidate', 'snapshotFingerprint', 'truth', 'findings', 'pass', 'reviewReady', 'status'
]);
const CANDIDATE_KEYS = Object.freeze([
  'sourceKnowledgeIds', 'projectTruthRefs', 'counterevidenceKnowledgeIds',
  'hiddenCounterevidenceAcknowledged', 'transferClaim', 'causalBridge', 'targetConsequence',
  'adaptationActions', 'adaptationRuleActions', 'copyRiskMitigations', 'uncertainty', 'falsifier'
]);

function canonicalTruth() {
  return {
    downstreamTransferCandidateOnly: true,
    everyDownstreamFreeformFieldLiteralCopyChecked: true,
    blockedCandidateContentRedacted: true,
    semanticOriginalityVerified: false,
    causalAlignmentSemanticallyVerified: false,
    transferIsCreativeAuthority: false,
    creativeDirectionSelected: false,
    productionApproved: false
  };
}

function projectionFromHypothesis(hypothesis = {}) {
  return {
    sourceKnowledgeIds: sortedList(hypothesis.sourceKnowledgeIds),
    projectTruthRefs: sortedList(hypothesis.projectTruthRefs),
    counterevidenceKnowledgeIds: sortedList(hypothesis.counterevidenceKnowledgeIds),
    hiddenCounterevidenceAcknowledged: hypothesis.hiddenCounterevidenceAcknowledged === true,
    transferClaim: text(hypothesis.transferClaim),
    causalBridge: text(hypothesis.causalBridge),
    targetConsequence: text(hypothesis.targetConsequence),
    adaptationActions: list(hypothesis.adaptationActions),
    adaptationRuleActions: (Array.isArray(hypothesis.adaptationRuleResponses) ? hypothesis.adaptationRuleResponses : [])
      .map((item) => text(item?.action)).filter(Boolean),
    copyRiskMitigations: (Array.isArray(hypothesis.copyRiskMitigations) ? hypothesis.copyRiskMitigations : [])
      .map((item) => text(item?.mitigation)).filter(Boolean),
    uncertainty: text(hypothesis.uncertainty),
    falsifier: text(hypothesis.falsifier)
  };
}

function candidateCorpus(projection = {}) {
  return [
    projection.transferClaim,
    projection.causalBridge,
    projection.targetConsequence,
    ...(projection.adaptationActions ?? []),
    ...(projection.adaptationRuleActions ?? []),
    ...(projection.copyRiskMitigations ?? []),
    projection.uncertainty,
    projection.falsifier
  ].map(text).filter(Boolean).join(' ');
}

function sourceProbeSignatures(brief = {}, hypothesis = {}) {
  const selected = new Set(sortedList(hypothesis.sourceKnowledgeIds));
  const primaryEvidence = Array.isArray(brief.primaryEvidence) ? brief.primaryEvidence : [];
  return sortedList(primaryEvidence
    .filter((item) => selected.has(text(item?.knowledgeId)))
    .flatMap((item) => [
      ...(Array.isArray(item?.surfaceSignature) ? item.surfaceSignature : []),
      ...(Array.isArray(item?.mustStrip) ? item.mustStrip : [])
    ]));
}

function exactCopyHits(brief, hypothesis, projection) {
  const corpus = candidateCorpus(projection);
  return sourceProbeSignatures(brief, hypothesis)
    .filter((signature) => includesNormalizedPhrase(corpus, signature))
    .sort(compareText);
}

function candidateFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-transfer-candidate@1',
    hypothesisSnapshotFingerprint: text(value.hypothesisSnapshotFingerprint),
    hypothesisProvenanceReceiptFingerprint: text(value.hypothesisProvenanceReceiptFingerprint),
    candidate: value.candidate ?? null,
    truth: value.truth
  });
}

function canonicalCore({ hypothesis, brief, retrieval, graph, foundation } = {}) {
  const provenance = reviewCreativeTransferHypothesisProvenance({
    hypothesis,
    brief,
    retrieval,
    graph,
    foundation
  });
  const projection = projectionFromHypothesis(hypothesis ?? {});
  const hits = exactCopyHits(brief ?? {}, hypothesis ?? {}, projection);
  const ready = provenance.reviewReady === true && hits.length === 0;
  const core = {
    schema: 'ai-studio-os/creative-transfer-candidate@1',
    stage: 'creative-transfer-candidate-egress',
    hypothesisSnapshotFingerprint: text(hypothesis?.snapshotFingerprint),
    hypothesisProvenanceReceiptFingerprint: fingerprintCreativeValue(provenance.sourceReceipt ?? {}),
    candidate: ready ? projection : null,
    truth: canonicalTruth()
  };
  core.snapshotFingerprint = candidateFingerprint(core);
  return { core, provenance, hits };
}

export function reviewCreativeTransferCandidate(candidateArtifact = {}, { hypothesis, brief, retrieval, graph, foundation } = {}) {
  const findings = [];
  const { core: expected, provenance, hits } = canonicalCore({ hypothesis, brief, retrieval, graph, foundation });

  if (candidateArtifact?.schema !== 'ai-studio-os/creative-transfer-candidate@1') findings.push(finding('blocker', 'creative-transfer-candidate-schema-invalid', 'Transfer candidate egress requires creative-transfer-candidate@1.'));
  if (candidateArtifact?.stage !== 'creative-transfer-candidate-egress') findings.push(finding('blocker', 'creative-transfer-candidate-stage-invalid', 'Transfer candidate requires the canonical egress stage.'));
  const unknownTop = unknownKeys(candidateArtifact, TOP_LEVEL_KEYS);
  if (unknownTop.length) findings.push(finding('blocker', 'creative-transfer-candidate-shape-invalid', 'Transfer candidate artifact may contain only canonical egress and derived review fields.', { unknownKeys: unknownTop }));

  if (!provenance.reviewReady) findings.push(finding('blocker', 'creative-transfer-candidate-source-provenance-blocked', 'Downstream candidate emission requires independent Hypothesis → Brief → Retrieval → Graph → Foundation provenance.', { findingCodes: provenance.findings.map((item) => item.code) }));
  if (hits.length) findings.push(finding('blocker', 'creative-transfer-candidate-literal-copy-blocked', 'Downstream candidate emission is redacted because a selected-source surface signature appears in a freeform field.', { hitCount: hits.length }));

  if (text(candidateArtifact?.hypothesisSnapshotFingerprint) !== text(expected.hypothesisSnapshotFingerprint)) findings.push(finding('blocker', 'creative-transfer-candidate-hypothesis-binding-drift', 'Transfer candidate must bind the exact supplied hypothesis snapshot.'));
  if (text(candidateArtifact?.hypothesisProvenanceReceiptFingerprint) !== text(expected.hypothesisProvenanceReceiptFingerprint)) findings.push(finding('blocker', 'creative-transfer-candidate-provenance-binding-drift', 'Transfer candidate must bind the independently recomputed hypothesis provenance receipt.'));

  if (candidateArtifact?.candidate !== null) {
    const unknownCandidate = unknownKeys(candidateArtifact.candidate, CANDIDATE_KEYS);
    if (unknownCandidate.length) findings.push(finding('blocker', 'creative-transfer-candidate-payload-shape-invalid', 'Downstream Transfer candidate may contain only canonical candidate fields.', { unknownKeys: unknownCandidate }));
  }
  if (!sameValue(candidateArtifact?.candidate ?? null, expected.candidate)) findings.push(finding('blocker', 'creative-transfer-candidate-payload-drift', 'Downstream Transfer candidate must equal the independently rebuilt safe projection.'));
  if (!sameValue(candidateArtifact?.truth ?? {}, canonicalTruth())) findings.push(finding('blocker', 'creative-transfer-candidate-truth-drift', 'Transfer candidate truth boundary is fixed and non-authoritative.'));
  if (text(candidateArtifact?.snapshotFingerprint) !== candidateFingerprint(expected)) findings.push(finding('blocker', 'creative-transfer-candidate-fingerprint-mismatch', 'Transfer candidate fingerprint must bind exact provenance, egress payload and truth state.'));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const expectedReady = coreBlockers.length === 0;
  const expectedStatus = expectedReady ? 'ready-as-downstream-advisory-transfer-candidate' : 'blocked';
  if (Object.hasOwn(candidateArtifact, 'pass') && candidateArtifact.pass !== expectedReady) findings.push(finding('blocker', 'creative-transfer-candidate-pass-claim-drift', 'Cached candidate pass flag must match fresh egress review.'));
  if (Object.hasOwn(candidateArtifact, 'reviewReady') && candidateArtifact.reviewReady !== expectedReady) findings.push(finding('blocker', 'creative-transfer-candidate-ready-claim-drift', 'Cached candidate reviewReady flag must match fresh egress review.'));
  if (Object.hasOwn(candidateArtifact, 'status') && candidateArtifact.status !== expectedStatus) findings.push(finding('blocker', 'creative-transfer-candidate-status-claim-drift', 'Cached candidate status must match fresh egress review.', { expected: expectedStatus, actual: candidateArtifact.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-transfer-candidate-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-as-downstream-advisory-transfer-candidate',
    findings,
    computedFingerprint: candidateFingerprint(expected),
    truth: canonicalTruth()
  };
}

export function buildCreativeTransferCandidate({ hypothesis, brief, retrieval, graph, foundation } = {}) {
  const { core, provenance, hits } = canonicalCore({ hypothesis, brief, retrieval, graph, foundation });
  const findings = [];
  if (!provenance.reviewReady) findings.push(finding('blocker', 'creative-transfer-candidate-source-provenance-blocked', 'Downstream candidate emission requires independent Hypothesis → Brief → Retrieval → Graph → Foundation provenance.', { findingCodes: provenance.findings.map((item) => item.code) }));
  if (hits.length) findings.push(finding('blocker', 'creative-transfer-candidate-literal-copy-blocked', 'Downstream candidate emission is redacted because a selected-source surface signature appears in a freeform field.', { hitCount: hits.length }));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    ...core,
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-as-downstream-advisory-transfer-candidate'
  };
}
