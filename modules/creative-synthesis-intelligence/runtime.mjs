import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeTransferCandidate } from '../creative-transfer-intelligence/candidate.mjs';

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

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(text(value));
}

function unknownKeys(object, allowed) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return [];
  const allowedSet = new Set(allowed);
  return Object.keys(object).filter((key) => !allowedSet.has(key)).sort(compareText);
}

function normalizedCopyText(value) {
  return text(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\p{Cf}+/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function includesNormalizedPhrase(corpus, phrase) {
  const haystack = normalizedCopyText(corpus);
  const needle = normalizedCopyText(phrase);
  return Boolean(needle) && haystack.includes(needle);
}

const POSITIVE_AUTHORITY_KEYS = Object.freeze([
  'winner', 'recommended', 'recommendation', 'selected', 'selection', 'score', 'approved',
  'canonical', 'canonicalDirection', 'authorityGranted', 'creativeAuthorityGranted',
  'creativeThesisSelected', 'creativeDirectionSelected', 'humanApprovalGranted',
  'productionApproved', 'technicalPlanningAuthorized'
]);

function authorityClaims(object = {}) {
  const claims = [];
  const inspect = (source, prefix = '') => {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;
    for (const key of POSITIVE_AUTHORITY_KEYS) {
      if (!Object.hasOwn(source, key)) continue;
      const value = source[key];
      const asserted = typeof value === 'boolean' ? value === true : value !== null && value !== undefined && value !== '';
      if (asserted) claims.push(`${prefix}${key}`);
    }
  };
  inspect(object);
  inspect(object?.truth, 'truth.');
  const status = text(object?.status).toLowerCase();
  if (['selected', 'recommended', 'winner', 'approved', 'canonical', 'authoritative', 'production-ready', 'production-approved'].includes(status)) claims.push(`status:${status}`);
  return [...new Set(claims)];
}

function normalizeTarget(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return { domain: text(source.domain), problem: text(source.problem), desiredEffect: text(source.desiredEffect) };
}

function normalizeIdStatement(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return { id: text(source.id), statement: text(source.statement) };
}

function normalizeContribution(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return { sourceCandidateId: text(source.sourceCandidateId), contribution: text(source.contribution) };
}

function normalizeCompetitorTransferTest(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return { question: text(source.question), failureCondition: text(source.failureCondition) };
}

function normalizeTransferCandidatePayload(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    sourceKnowledgeIds: sortedList(source.sourceKnowledgeIds),
    projectTruthRefs: sortedList(source.projectTruthRefs),
    counterevidenceKnowledgeIds: sortedList(source.counterevidenceKnowledgeIds),
    hiddenCounterevidenceAcknowledged: source.hiddenCounterevidenceAcknowledged === true,
    transferClaim: text(source.transferClaim),
    causalBridge: text(source.causalBridge),
    targetConsequence: text(source.targetConsequence),
    adaptationActions: list(source.adaptationActions),
    adaptationRuleActions: list(source.adaptationRuleActions),
    copyRiskMitigations: list(source.copyRiskMitigations),
    uncertainty: text(source.uncertainty),
    falsifier: text(source.falsifier)
  };
}

function transferPayloadFingerprint(value = {}) {
  return fingerprintCreativeValue(normalizeTransferCandidatePayload(value));
}

const TARGET_KEYS = Object.freeze(['domain', 'problem', 'desiredEffect']);
const ID_STATEMENT_KEYS = Object.freeze(['id', 'statement']);
const SOURCE_RECEIPT_KEYS = Object.freeze([
  'sourceCandidateId', 'sourceProjectId', 'sourceTargetDomain', 'transferCandidateSnapshotFingerprint',
  'transferCandidatePayloadFingerprint', 'transferHypothesisSnapshotFingerprint', 'transferBriefSnapshotFingerprint'
]);
const SOURCE_BINDING_KEYS = Object.freeze([
  'schema', 'requestedSourceIds', 'requestedSourceCount', 'verifiedSourceCount', 'allSourcesVerified',
  'sourceReceipts', 'bindingFingerprint'
]);
const SOURCE_CANDIDATE_KEYS = Object.freeze([
  'schema', 'sourceCandidateId', 'sourceProjectId', 'sourceTargetDomain',
  'transferCandidateSnapshotFingerprint', 'transferCandidatePayloadFingerprint',
  'transferHypothesisSnapshotFingerprint', 'transferBriefSnapshotFingerprint', 'candidate', 'truth'
]);
const TRANSFER_CANDIDATE_PAYLOAD_KEYS = Object.freeze([
  'sourceKnowledgeIds', 'projectTruthRefs', 'counterevidenceKnowledgeIds', 'hiddenCounterevidenceAcknowledged',
  'transferClaim', 'causalBridge', 'targetConsequence', 'adaptationActions', 'adaptationRuleActions',
  'copyRiskMitigations', 'uncertainty', 'falsifier'
]);
const BRIEF_KEYS = Object.freeze([
  'schema', 'stage', 'projectId', 'target', 'projectTruths', 'contradictions', 'constraints',
  'sourceBinding', 'sourceCandidates', 'snapshotFingerprint', 'truth', 'findings', 'pass',
  'reviewReady', 'status', 'provenanceReceipt', 'provenanceReady'
]);

function canonicalBriefTruth() {
  return {
    synthesisEvidenceOnly: true,
    multipleVerifiedTransferCandidatesRequired: true,
    duplicateSourceMultiplicityBlocked: true,
    partialSourceFallbackBlocked: true,
    hypothesesAreCandidatesOnly: true,
    noWinnerOrRecommendationProduced: true,
    structuralDivergenceOnly: true,
    semanticDivergenceVerified: false,
    semanticSynthesisVerified: false,
    creativeThesisSelected: false,
    creativeDirectionSelected: false,
    humanApprovalGranted: false,
    productionApproved: false
  };
}

function canonicalSourceTruth() {
  return {
    transferCandidateOnly: true,
    retrievalRankIsSynthesisAuthority: false,
    sourceCandidateIsCreativeDirection: false,
    creativeThesisSelected: false,
    productionApproved: false
  };
}

function sourceBundleId(source, index) {
  return text(source?.id) || `transfer-source-${index + 1}`;
}

function sourceReview(source = {}) {
  return reviewCreativeTransferCandidate(source.candidateArtifact ?? {}, {
    hypothesis: source.hypothesis,
    brief: source.brief,
    retrieval: source.retrieval,
    graph: source.graph,
    foundation: source.foundation
  });
}

function sourceReceipt(source = {}, index = 0) {
  const candidatePayload = normalizeTransferCandidatePayload(source?.candidateArtifact?.candidate ?? {});
  return {
    sourceCandidateId: sourceBundleId(source, index),
    sourceProjectId: text(source?.brief?.projectId),
    sourceTargetDomain: text(source?.brief?.target?.domain),
    transferCandidateSnapshotFingerprint: text(source?.candidateArtifact?.snapshotFingerprint),
    transferCandidatePayloadFingerprint: transferPayloadFingerprint(candidatePayload),
    transferHypothesisSnapshotFingerprint: text(source?.hypothesis?.snapshotFingerprint),
    transferBriefSnapshotFingerprint: text(source?.brief?.snapshotFingerprint)
  };
}

function sourceProjection(source = {}, index = 0) {
  const receipt = sourceReceipt(source, index);
  return {
    schema: 'ai-studio-os/creative-synthesis-source-candidate@1',
    ...receipt,
    candidate: normalizeTransferCandidatePayload(source?.candidateArtifact?.candidate ?? {}),
    truth: canonicalSourceTruth()
  };
}

function normalizeReceipt(value = {}) {
  return {
    sourceCandidateId: text(value.sourceCandidateId),
    sourceProjectId: text(value.sourceProjectId),
    sourceTargetDomain: text(value.sourceTargetDomain),
    transferCandidateSnapshotFingerprint: text(value.transferCandidateSnapshotFingerprint),
    transferCandidatePayloadFingerprint: text(value.transferCandidatePayloadFingerprint),
    transferHypothesisSnapshotFingerprint: text(value.transferHypothesisSnapshotFingerprint),
    transferBriefSnapshotFingerprint: text(value.transferBriefSnapshotFingerprint)
  };
}

function sourceBindingFingerprint(binding = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-synthesis-source-binding@1',
    requestedSourceIds: sortedList(binding.requestedSourceIds),
    requestedSourceCount: Number(binding.requestedSourceCount) || 0,
    verifiedSourceCount: Number(binding.verifiedSourceCount) || 0,
    allSourcesVerified: binding.allSourcesVerified === true,
    sourceReceipts: (Array.isArray(binding.sourceReceipts) ? binding.sourceReceipts : [])
      .map(normalizeReceipt)
      .sort((left, right) => compareText(left.sourceCandidateId, right.sourceCandidateId))
  });
}

function buildSourceBinding(sources, projectId, targetDomain) {
  const sourceList = Array.isArray(sources) ? sources : [];
  const records = sourceList.map((source, index) => ({
    source,
    index,
    id: sourceBundleId(source, index),
    review: sourceReview(source),
    receipt: sourceReceipt(source, index)
  })).sort((left, right) => compareText(left.id, right.id));
  const ids = records.map((item) => item.id);
  const snapshots = records.map((item) => item.receipt.transferCandidateSnapshotFingerprint).filter(Boolean);
  const payloads = records.map((item) => item.receipt.transferCandidatePayloadFingerprint).filter(Boolean);
  const duplicateIds = new Set(ids).size !== ids.length;
  const duplicateCandidates = new Set(snapshots).size !== snapshots.length || new Set(payloads).size !== payloads.length;
  const validReceipts = records.every((item) => item.review.reviewReady === true
    && item.source?.candidateArtifact?.candidate !== null
    && isSha256(item.receipt.transferCandidateSnapshotFingerprint)
    && isSha256(item.receipt.transferCandidatePayloadFingerprint)
    && isSha256(item.receipt.transferHypothesisSnapshotFingerprint)
    && isSha256(item.receipt.transferBriefSnapshotFingerprint));
  const projectAligned = records.every((item) => item.receipt.sourceProjectId === text(projectId));
  const targetAligned = records.every((item) => item.receipt.sourceTargetDomain === text(targetDomain));
  const allSourcesVerified = records.length >= 2 && !duplicateIds && !duplicateCandidates && validReceipts && projectAligned && targetAligned;
  const binding = {
    schema: 'ai-studio-os/creative-synthesis-source-binding@1',
    requestedSourceIds: [...ids].sort(compareText),
    requestedSourceCount: records.length,
    verifiedSourceCount: records.filter((item) => item.review.reviewReady === true).length,
    allSourcesVerified,
    sourceReceipts: records.map((item) => item.receipt)
  };
  return {
    ...binding,
    bindingFingerprint: sourceBindingFingerprint(binding),
    records,
    duplicateIds,
    duplicateCandidates,
    validReceipts,
    projectAligned,
    targetAligned
  };
}

function briefFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-synthesis-brief@1',
    projectId: text(value.projectId),
    target: normalizeTarget(value.target),
    projectTruths: (Array.isArray(value.projectTruths) ? value.projectTruths : []).map(normalizeIdStatement),
    contradictions: (Array.isArray(value.contradictions) ? value.contradictions : []).map(normalizeIdStatement),
    constraints: list(value.constraints),
    sourceBindingFingerprint: text(value?.sourceBinding?.bindingFingerprint),
    sourceCandidates: (Array.isArray(value.sourceCandidates) ? value.sourceCandidates : []).map((item) => ({
      schema: 'ai-studio-os/creative-synthesis-source-candidate@1',
      ...normalizeReceipt(item),
      candidate: normalizeTransferCandidatePayload(item?.candidate ?? {}),
      truth: canonicalSourceTruth()
    }))
  });
}

function briefReceipt(brief, sourceBinding, reviewReady) {
  return {
    schema: 'ai-studio-os/creative-synthesis-brief-provenance-receipt@1',
    briefSnapshotFingerprint: text(brief?.snapshotFingerprint),
    sourceBindingFingerprint: text(sourceBinding?.bindingFingerprint),
    sourceCount: Number(sourceBinding?.requestedSourceCount) || 0,
    reviewReady: reviewReady === true && sourceBinding?.allSourcesVerified === true,
    truth: {
      receiptContainsSourceCandidateContent: false,
      hashesAreDriftDetectionNotSignatures: true,
      synthesisAuthorityGranted: false,
      creativeThesisSelected: false,
      productionApproved: false
    }
  };
}

function canonicalBriefCore({ projectId, target, projectTruths, contradictions, constraints, sources } = {}) {
  const normalizedTarget = normalizeTarget(target);
  const sourceBinding = buildSourceBinding(sources, projectId, normalizedTarget.domain);
  const sourceCandidates = sourceBinding.allSourcesVerified
    ? sourceBinding.records.map((item) => sourceProjection(item.source, item.index)).sort((a, b) => compareText(a.sourceCandidateId, b.sourceCandidateId))
    : [];
  const brief = {
    schema: 'ai-studio-os/creative-synthesis-brief@1',
    stage: 'creative-synthesis-brief',
    projectId: text(projectId),
    target: normalizedTarget,
    projectTruths: (Array.isArray(projectTruths) ? projectTruths : []).map(normalizeIdStatement),
    contradictions: (Array.isArray(contradictions) ? contradictions : []).map(normalizeIdStatement),
    constraints: list(constraints),
    sourceBinding: {
      schema: sourceBinding.schema,
      requestedSourceIds: sourceBinding.requestedSourceIds,
      requestedSourceCount: sourceBinding.requestedSourceCount,
      verifiedSourceCount: sourceBinding.verifiedSourceCount,
      allSourcesVerified: sourceBinding.allSourcesVerified,
      sourceReceipts: sourceBinding.sourceReceipts,
      bindingFingerprint: sourceBinding.bindingFingerprint
    },
    sourceCandidates,
    truth: canonicalBriefTruth()
  };
  brief.snapshotFingerprint = briefFingerprint(brief);
  return { brief, sourceBinding };
}

export function reviewCreativeSynthesisBrief(brief = {}) {
  const findings = [];
  const target = normalizeTarget(brief.target);
  const truths = (Array.isArray(brief.projectTruths) ? brief.projectTruths : []).map(normalizeIdStatement);
  const contradictions = (Array.isArray(brief.contradictions) ? brief.contradictions : []).map(normalizeIdStatement);
  const constraints = list(brief.constraints);
  const binding = brief?.sourceBinding && typeof brief.sourceBinding === 'object' ? brief.sourceBinding : {};
  const sourceCandidates = Array.isArray(brief.sourceCandidates) ? brief.sourceCandidates : [];

  if (brief?.schema !== 'ai-studio-os/creative-synthesis-brief@1') findings.push(finding('blocker', 'creative-synthesis-brief-schema-invalid', 'Creative Synthesis Brief requires creative-synthesis-brief@1.'));
  if (brief?.stage !== 'creative-synthesis-brief') findings.push(finding('blocker', 'creative-synthesis-brief-stage-invalid', 'Creative Synthesis Brief requires the canonical synthesis-brief stage.'));
  const unknownTop = unknownKeys(brief, BRIEF_KEYS);
  if (unknownTop.length) findings.push(finding('blocker', 'creative-synthesis-brief-shape-invalid', 'Creative Synthesis Brief may contain only canonical artifact and derived review fields.', { unknownKeys: unknownTop }));
  if (!text(brief.projectId)) findings.push(finding('blocker', 'creative-synthesis-project-missing', 'Creative Synthesis requires an explicit project identity.'));

  const targetUnknown = unknownKeys(brief?.target, TARGET_KEYS);
  if (targetUnknown.length || !sameValue(brief?.target ?? {}, target)) findings.push(finding('blocker', 'creative-synthesis-target-contract-drift', 'Synthesis target must equal the canonical target contract.', { unknownKeys: targetUnknown }));
  if (!target.domain) findings.push(finding('blocker', 'creative-synthesis-target-domain-missing', 'Creative Synthesis requires an explicit target domain.'));
  if (!target.problem) findings.push(finding('major', 'creative-synthesis-target-problem-missing', 'Creative Synthesis should name the target problem being resolved.'));
  if (!target.desiredEffect) findings.push(finding('major', 'creative-synthesis-target-effect-missing', 'Creative Synthesis should name the intended experiential effect.'));

  const inspectIdStatement = (rawList, normalizedList, label, missingSeverity) => {
    rawList.forEach((raw, index) => {
      const unknown = unknownKeys(raw, ID_STATEMENT_KEYS);
      if (unknown.length || !sameValue(raw ?? {}, normalizedList[index])) findings.push(finding('blocker', `creative-synthesis-${label}-contract-drift`, `${label} records must use the canonical id/statement shape.`, { index, unknownKeys: unknown }));
    });
    const ids = normalizedList.map((item) => item.id);
    if (normalizedList.length < missingSeverity.count) findings.push(finding(missingSeverity.severity, missingSeverity.code, missingSeverity.message, { count: normalizedList.length }));
    if (ids.some((id) => !id) || new Set(ids).size !== ids.length || normalizedList.some((item) => !item.statement)) findings.push(finding('blocker', `creative-synthesis-${label}-invalid`, `${label} records require unique IDs and non-empty statements.`));
    return ids;
  };

  inspectIdStatement(Array.isArray(brief.projectTruths) ? brief.projectTruths : [], truths, 'project-truth', {
    count: 1, severity: 'blocker', code: 'creative-synthesis-project-truth-missing', message: 'Creative Synthesis requires explicit project truth grounding.'
  });
  inspectIdStatement(Array.isArray(brief.contradictions) ? brief.contradictions : [], contradictions, 'contradiction', {
    count: 2, severity: 'major', code: 'creative-synthesis-contradiction-mining-thin', message: 'Creative Synthesis should expose at least two productive project contradictions before combining sources.'
  });
  if (!sameValue(brief?.constraints ?? [], constraints)) findings.push(finding('blocker', 'creative-synthesis-constraints-contract-drift', 'Synthesis constraints must equal the canonical normalized constraint list.'));

  const bindingUnknown = unknownKeys(binding, SOURCE_BINDING_KEYS);
  if (bindingUnknown.length) findings.push(finding('blocker', 'creative-synthesis-source-binding-shape-invalid', 'Synthesis source binding may contain only canonical provenance metadata.', { unknownKeys: bindingUnknown }));
  if (binding?.schema !== 'ai-studio-os/creative-synthesis-source-binding@1') findings.push(finding('blocker', 'creative-synthesis-source-binding-schema-invalid', 'Creative Synthesis Brief requires the canonical Transfer-source binding.'));
  if (Number(binding?.requestedSourceCount) < 2) findings.push(finding('blocker', 'creative-synthesis-source-count-insufficient', 'Creative Synthesis requires at least two distinct verified Transfer candidates.'));
  if (binding?.allSourcesVerified !== true) findings.push(finding('blocker', 'creative-synthesis-source-provenance-not-ready', 'Creative Synthesis fails closed unless every requested Transfer source is independently verified, project-aligned and target-domain aligned.'));
  if (text(binding?.bindingFingerprint) !== sourceBindingFingerprint(binding)) findings.push(finding('blocker', 'creative-synthesis-source-binding-fingerprint-drift', 'Synthesis source binding fingerprint must match the exact compact source receipt.'));

  const receipts = Array.isArray(binding.sourceReceipts) ? binding.sourceReceipts : [];
  receipts.forEach((raw, index) => {
    const unknown = unknownKeys(raw, SOURCE_RECEIPT_KEYS);
    if (unknown.length || !sameValue(raw, normalizeReceipt(raw))) findings.push(finding('blocker', 'creative-synthesis-source-receipt-shape-invalid', 'Synthesis source receipts may contain only canonical provenance fields.', { index, unknownKeys: unknown }));
    for (const key of ['transferCandidateSnapshotFingerprint', 'transferCandidatePayloadFingerprint', 'transferHypothesisSnapshotFingerprint', 'transferBriefSnapshotFingerprint']) {
      if (!isSha256(raw?.[key])) findings.push(finding('blocker', 'creative-synthesis-source-receipt-fingerprint-invalid', 'Synthesis source receipts require SHA-256 drift fingerprints.', { index, key }));
    }
    if (text(raw?.sourceProjectId) !== text(brief.projectId)) findings.push(finding('blocker', 'creative-synthesis-source-receipt-project-drift', 'Every Synthesis source receipt must belong to the brief project.', { index }));
    if (text(raw?.sourceTargetDomain) !== target.domain) findings.push(finding('blocker', 'creative-synthesis-source-receipt-target-domain-drift', 'Every Synthesis source receipt must target the brief domain.', { index }));
  });
  const receiptIds = receipts.map((item) => text(item.sourceCandidateId));
  const receiptSnapshots = receipts.map((item) => text(item.transferCandidateSnapshotFingerprint));
  const receiptPayloads = receipts.map((item) => text(item.transferCandidatePayloadFingerprint));
  if (new Set(receiptIds).size !== receiptIds.length || receiptIds.some((id) => !id)) findings.push(finding('blocker', 'creative-synthesis-source-receipt-id-invalid', 'Synthesis source receipt IDs must be unique and non-empty.'));
  if (new Set(receiptSnapshots).size !== receiptSnapshots.length || new Set(receiptPayloads).size !== receiptPayloads.length) findings.push(finding('blocker', 'creative-synthesis-duplicate-source-candidate', 'The same Transfer candidate cannot be counted multiple times as independent Synthesis evidence.'));
  const canonicalReceiptIds = [...receiptIds].sort(compareText);
  if (!sameValue(binding?.requestedSourceIds ?? [], canonicalReceiptIds)) findings.push(finding('blocker', 'creative-synthesis-requested-source-set-drift', 'Requested Synthesis source IDs must exactly equal the canonically ordered bound source receipt IDs.'));
  if (Number(binding?.requestedSourceCount) !== receipts.length) findings.push(finding('blocker', 'creative-synthesis-requested-source-count-drift', 'Requested Synthesis source count must equal the bound source receipt count.'));
  if (Number(binding?.verifiedSourceCount) > Number(binding?.requestedSourceCount)) findings.push(finding('blocker', 'creative-synthesis-verified-source-count-invalid', 'Verified Synthesis source count cannot exceed requested source count.'));
  if (binding?.allSourcesVerified === true && Number(binding?.verifiedSourceCount) !== Number(binding?.requestedSourceCount)) findings.push(finding('blocker', 'creative-synthesis-verified-source-count-drift', 'allSourcesVerified requires every requested source to be verified.'));

  if (binding?.allSourcesVerified === true && sourceCandidates.length !== receipts.length) findings.push(finding('blocker', 'creative-synthesis-source-candidate-count-drift', 'Verified Synthesis Brief must expose exactly one safe source candidate projection per bound source receipt.'));
  if (binding?.allSourcesVerified !== true && sourceCandidates.length) findings.push(finding('blocker', 'creative-synthesis-partial-source-leak', 'A blocked Synthesis Brief must expose no partial source candidate content.'));

  const receiptById = new Map(receipts.map((item) => [text(item.sourceCandidateId), normalizeReceipt(item)]));
  sourceCandidates.forEach((raw, index) => {
    const unknown = unknownKeys(raw, SOURCE_CANDIDATE_KEYS);
    if (unknown.length) findings.push(finding('blocker', 'creative-synthesis-source-candidate-shape-invalid', 'Synthesis source candidate projections may contain only canonical fields.', { index, unknownKeys: unknown }));
    if (raw?.schema !== 'ai-studio-os/creative-synthesis-source-candidate@1') findings.push(finding('blocker', 'creative-synthesis-source-candidate-schema-invalid', 'Synthesis source candidate projection requires the canonical schema.', { index }));
    const receipt = receiptById.get(text(raw?.sourceCandidateId));
    if (!receipt) {
      findings.push(finding('blocker', 'creative-synthesis-source-candidate-receipt-missing', 'Every safe Synthesis source candidate must bind one exact source receipt.', { index }));
    } else if (!sameValue(normalizeReceipt(raw), receipt)) {
      findings.push(finding('blocker', 'creative-synthesis-source-candidate-receipt-drift', 'Safe Synthesis source candidate provenance metadata must exactly equal its bound receipt.', { index }));
    }
    const candidateUnknown = unknownKeys(raw?.candidate, TRANSFER_CANDIDATE_PAYLOAD_KEYS);
    const normalizedCandidate = normalizeTransferCandidatePayload(raw?.candidate ?? {});
    if (candidateUnknown.length || !sameValue(raw?.candidate ?? {}, normalizedCandidate)) findings.push(finding('blocker', 'creative-synthesis-source-candidate-payload-drift', 'Synthesis source candidate must preserve the canonical safe Transfer candidate projection.', { index, unknownKeys: candidateUnknown }));
    if (receipt && transferPayloadFingerprint(normalizedCandidate) !== receipt.transferCandidatePayloadFingerprint) findings.push(finding('blocker', 'creative-synthesis-source-candidate-payload-fingerprint-drift', 'Synthesis source candidate payload must match the payload fingerprint bound by its source receipt.', { index }));
    if (!sameValue(raw?.truth ?? {}, canonicalSourceTruth())) findings.push(finding('blocker', 'creative-synthesis-source-candidate-truth-drift', 'Synthesis source candidate truth is fixed and non-authoritative.', { index }));
  });
  const sourceIds = sourceCandidates.map((item) => text(item?.sourceCandidateId));
  if (new Set(sourceIds).size !== sourceIds.length || sourceIds.some((id) => !id)) findings.push(finding('blocker', 'creative-synthesis-source-candidate-id-invalid', 'Synthesis source candidate IDs must be unique and non-empty.'));

  const computedFingerprint = briefFingerprint({ ...brief, target, projectTruths: truths, contradictions, constraints });
  if (text(brief?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-synthesis-brief-fingerprint-mismatch', 'Synthesis Brief fingerprint must bind project truth, contradictions, target and exact verified Transfer candidate projections.', { expected: computedFingerprint, actual: brief?.snapshotFingerprint ?? null }));
  if (!sameValue(brief?.truth ?? {}, canonicalBriefTruth())) findings.push(finding('blocker', 'creative-synthesis-brief-truth-drift', 'Creative Synthesis Brief truth boundary is fixed and non-authoritative.'));
  const claims = authorityClaims(brief);
  if (claims.length) findings.push(finding('blocker', 'creative-synthesis-brief-authority-fabricated', 'Creative Synthesis Brief cannot recommend, select, score, approve or grant production authority.', { claims }));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const coreMajors = findings.filter((item) => item.severity === 'major');
  const expectedPass = coreBlockers.length === 0;
  const expectedReady = coreBlockers.length === 0 && coreMajors.length === 0;
  const expectedStatus = coreBlockers.length ? 'blocked' : coreMajors.length ? 'provisional' : 'ready-for-synthesis-hypotheses';
  if (Object.hasOwn(brief, 'pass') && brief.pass !== expectedPass) findings.push(finding('blocker', 'creative-synthesis-brief-pass-claim-drift', 'Cached Synthesis Brief pass flag must match fresh review.'));
  if (Object.hasOwn(brief, 'reviewReady') && brief.reviewReady !== expectedReady) findings.push(finding('blocker', 'creative-synthesis-brief-ready-claim-drift', 'Cached Synthesis Brief reviewReady flag must match fresh review.'));
  if (Object.hasOwn(brief, 'status') && brief.status !== expectedStatus) findings.push(finding('blocker', 'creative-synthesis-brief-status-claim-drift', 'Cached Synthesis Brief status must match fresh review.', { expected: expectedStatus, actual: brief.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-synthesis-brief-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-synthesis-hypotheses',
    findings,
    computedFingerprint,
    truth: canonicalBriefTruth()
  };
}

export function reviewCreativeSynthesisBriefProvenance({ brief, sources } = {}) {
  const findings = [];
  const briefReview = reviewCreativeSynthesisBrief(brief ?? {});
  const rebuilt = canonicalBriefCore({
    projectId: brief?.projectId,
    target: brief?.target,
    projectTruths: brief?.projectTruths,
    contradictions: brief?.contradictions,
    constraints: brief?.constraints,
    sources
  });
  if (!briefReview.reviewReady) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-brief-not-ready', 'Independent Synthesis Brief provenance requires a structurally review-ready brief.', { findingCodes: briefReview.findings.map((item) => item.code) }));
  if (!rebuilt.sourceBinding.allSourcesVerified) {
    const invalidSourceIds = rebuilt.sourceBinding.records.filter((item) => item.review.reviewReady !== true).map((item) => item.id);
    findings.push(finding('blocker', 'creative-synthesis-brief-provenance-source-not-verified', 'Synthesis Brief provenance requires every Transfer Candidate to independently pass Candidate → Hypothesis → Brief → Retrieval → Graph → Foundation verification.', { invalidSourceIds }));
  }
  if (rebuilt.sourceBinding.duplicateIds) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-source-id-duplicate', 'Synthesis source IDs must be unique.'));
  if (rebuilt.sourceBinding.duplicateCandidates) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-candidate-duplicate', 'Duplicate Transfer Candidate snapshots or safe payloads cannot manufacture source multiplicity.'));
  if (!rebuilt.sourceBinding.projectAligned) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-project-drift', 'Every Transfer source must belong to the exact Synthesis project.'));
  if (!rebuilt.sourceBinding.targetAligned) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-target-domain-drift', 'Every Transfer source must target the same domain as the Synthesis Brief.'));

  const payload = (value) => ({
    projectId: value?.projectId,
    target: value?.target,
    projectTruths: value?.projectTruths,
    contradictions: value?.contradictions,
    constraints: value?.constraints,
    sourceBinding: value?.sourceBinding,
    sourceCandidates: value?.sourceCandidates,
    snapshotFingerprint: value?.snapshotFingerprint,
    truth: value?.truth
  });
  if (!sameValue(payload(brief), payload(rebuilt.brief))) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-rebuild-drift', 'Synthesis Brief differs from the deterministic brief independently rebuilt from supplied Transfer provenance chains.'));

  const expectedReady = briefReview.reviewReady && rebuilt.sourceBinding.allSourcesVerified === true;
  const expectedReceipt = briefReceipt(brief ?? {}, rebuilt.brief.sourceBinding, briefReview.reviewReady);
  if (Object.hasOwn(brief ?? {}, 'provenanceReceipt') && !sameValue(brief.provenanceReceipt, expectedReceipt)) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-receipt-drift', 'Attached Synthesis Brief provenance receipt must equal the independently recomputed compact receipt.'));
  if (Object.hasOwn(brief ?? {}, 'provenanceReady') && brief.provenanceReady !== expectedReady) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-ready-drift', 'Attached Synthesis Brief provenanceReady flag must equal fresh independent verification.'));
  if (rebuilt.sourceBinding.allSourcesVerified && Object.hasOwn(brief ?? {}, 'findings') && !sameValue(brief.findings, briefReview.findings)) findings.push(finding('blocker', 'creative-synthesis-brief-provenance-findings-drift', 'Attached Synthesis Brief diagnostics must equal fresh structural review when all source provenance is valid.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-synthesis-brief-provenance-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'verified-synthesis-brief-provenance',
    findings,
    sourceReceipt: expectedReceipt,
    truth: {
      everyTransferSourceReverifiedIndependently: true,
      partialSourceFallbackBlocked: true,
      duplicateSourceMultiplicityBlocked: true,
      crossProjectSourceInjectionBlocked: true,
      transferSourceContentExcludedFromReceipt: true,
      synthesisAuthorityGranted: false,
      creativeThesisSelected: false,
      productionApproved: false
    }
  };
}

export function buildCreativeSynthesisBrief({ projectId, target, projectTruths = [], contradictions = [], constraints = [], sources = [] } = {}) {
  const { brief, sourceBinding } = canonicalBriefCore({ projectId, target, projectTruths, contradictions, constraints, sources });
  const review = reviewCreativeSynthesisBrief(brief);
  const findings = [...review.findings];
  if (!sourceBinding.allSourcesVerified) findings.push(finding('blocker', 'creative-synthesis-brief-source-provenance-blocked', 'Default Synthesis Brief construction requires every requested Transfer Candidate to be independently verified and project/target aligned. No partial source candidate content was emitted.'));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  return {
    ...brief,
    findings,
    pass: blockers.length === 0,
    reviewReady,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-synthesis-hypotheses',
    provenanceReceipt: briefReceipt(brief, brief.sourceBinding, reviewReady),
    provenanceReady: reviewReady && sourceBinding.allSourcesVerified === true
  };
}

export const CREATIVE_SYNTHESIS_STRATEGIES = Object.freeze([
  'reinforcement', 'productive-contradiction', 'hierarchical', 'sequential', 'conditional', 'counterpoint'
]);
const STRATEGY_SET = new Set(CREATIVE_SYNTHESIS_STRATEGIES);
const CONTRIBUTION_KEYS = Object.freeze(['sourceCandidateId', 'contribution']);
const COMPETITOR_TEST_KEYS = Object.freeze(['question', 'failureCondition']);
const HYPOTHESIS_KEYS = Object.freeze([
  'id', 'strategy', 'sourceCandidateIds', 'sourceContributions', 'projectTruthRefs', 'contradictionRefs',
  'governingIdea', 'productiveTension', 'combinationMechanism', 'experientialConsequences',
  'antiGenericClaims', 'ownabilityRisk', 'competitorTransferTest', 'failureModes', 'uncertainty', 'falsifier', 'critique'
]);
const SET_KEYS = Object.freeze([
  'schema', 'stage', 'briefBinding', 'hypotheses', 'snapshotFingerprint', 'truth', 'findings',
  'pass', 'reviewReady', 'status', 'provenanceReceipt', 'provenanceReady'
]);
const BRIEF_BINDING_KEYS = Object.freeze([
  'schema', 'briefSnapshotFingerprint', 'sourceBindingFingerprint', 'projectId', 'targetDomain',
  'briefProvenanceReceiptFingerprint', 'sourceBriefProvenanceReady', 'bindingFingerprint'
]);

function canonicalSetTruth() {
  return {
    hypothesesAreCandidatesOnly: true,
    noWinnerOrRecommendationProduced: true,
    noScoresProduced: true,
    minimumThreeHypothesesRequired: true,
    minimumThreeStrategiesRequired: true,
    eachHypothesisCombinesMultipleSources: true,
    contradictionsMustRemainVisible: true,
    sourceRestatementFirewallRequired: true,
    structuralDivergenceOnly: true,
    semanticDivergenceVerified: false,
    semanticSynthesisVerified: false,
    sourceCandidateRankIsCreativeAuthority: false,
    creativeThesisSelected: false,
    creativeDirectionSelected: false,
    humanApprovalGranted: false,
    productionApproved: false
  };
}

function normalizeHypothesis(value = {}, index = 0) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    id: text(source.id) || `synthesis-hypothesis-${index + 1}`,
    strategy: text(source.strategy),
    sourceCandidateIds: sortedList(source.sourceCandidateIds),
    sourceContributions: (Array.isArray(source.sourceContributions) ? source.sourceContributions : []).map(normalizeContribution).sort((a, b) => compareText(a.sourceCandidateId, b.sourceCandidateId)),
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

function conceptualPayloadFingerprint(value = {}) {
  const normalized = normalizeHypothesis(value);
  return fingerprintCreativeValue({ ...normalized, id: null, strategy: null });
}

function briefBindingFingerprint(binding = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-synthesis-brief-binding@1',
    briefSnapshotFingerprint: text(binding.briefSnapshotFingerprint),
    sourceBindingFingerprint: text(binding.sourceBindingFingerprint),
    projectId: text(binding.projectId),
    targetDomain: text(binding.targetDomain),
    briefProvenanceReceiptFingerprint: text(binding.briefProvenanceReceiptFingerprint),
    sourceBriefProvenanceReady: binding.sourceBriefProvenanceReady === true
  });
}

function buildBriefBinding(brief = {}, provenanceReady = brief?.provenanceReady === true) {
  const binding = {
    schema: 'ai-studio-os/creative-synthesis-brief-binding@1',
    briefSnapshotFingerprint: text(brief.snapshotFingerprint),
    sourceBindingFingerprint: text(brief?.sourceBinding?.bindingFingerprint),
    projectId: text(brief.projectId),
    targetDomain: text(brief?.target?.domain),
    briefProvenanceReceiptFingerprint: fingerprintCreativeValue(brief?.provenanceReceipt ?? {}),
    sourceBriefProvenanceReady: provenanceReady === true
  };
  return { ...binding, bindingFingerprint: briefBindingFingerprint(binding) };
}

function sourceProbePhrases(brief = {}) {
  const phrases = [];
  for (const source of Array.isArray(brief.sourceCandidates) ? brief.sourceCandidates : []) {
    const candidate = normalizeTransferCandidatePayload(source?.candidate ?? {});
    phrases.push(candidate.transferClaim, candidate.causalBridge, candidate.targetConsequence,
      ...candidate.adaptationActions, ...candidate.adaptationRuleActions, ...candidate.copyRiskMitigations,
      candidate.uncertainty, candidate.falsifier);
  }
  return sortedList(phrases.filter((phrase) => normalizedCopyText(phrase).length >= 24));
}

function synthesisCorpus(hypothesis = {}) {
  return [
    hypothesis.governingIdea, hypothesis.productiveTension, hypothesis.combinationMechanism,
    ...(hypothesis.sourceContributions ?? []).map((item) => item.contribution),
    ...(hypothesis.experientialConsequences ?? []), ...(hypothesis.antiGenericClaims ?? []),
    hypothesis.ownabilityRisk, hypothesis.competitorTransferTest?.question,
    hypothesis.competitorTransferTest?.failureCondition, ...(hypothesis.failureModes ?? []),
    hypothesis.uncertainty, hypothesis.falsifier, ...(hypothesis.critique ?? [])
  ].map(text).filter(Boolean).join(' ');
}

function sourceRestatementHits(hypothesis, brief) {
  const corpus = synthesisCorpus(hypothesis);
  return sourceProbePhrases(brief).filter((phrase) => includesNormalizedPhrase(corpus, phrase));
}

function setFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-synthesis-set@1',
    briefBindingFingerprint: text(value?.briefBinding?.bindingFingerprint),
    hypotheses: (Array.isArray(value.hypotheses) ? value.hypotheses : []).map(normalizeHypothesis),
    truth: value.truth
  });
}

function setReceipt(synthesis, briefProvenanceReview, reviewReady) {
  return {
    schema: 'ai-studio-os/creative-synthesis-set-provenance-receipt@1',
    synthesisSnapshotFingerprint: text(synthesis?.snapshotFingerprint),
    briefSnapshotFingerprint: text(briefProvenanceReview?.sourceReceipt?.briefSnapshotFingerprint),
    sourceBindingFingerprint: text(briefProvenanceReview?.sourceReceipt?.sourceBindingFingerprint),
    reviewReady: reviewReady === true && briefProvenanceReview?.reviewReady === true,
    truth: {
      receiptContainsSynthesisHypothesisContent: false,
      semanticSynthesisVerified: false,
      creativeThesisSelected: false,
      productionApproved: false
    }
  };
}

export function reviewCreativeSynthesisSet(synthesis = {}, { brief } = {}) {
  const findings = [];
  const briefReview = reviewCreativeSynthesisBrief(brief ?? {});
  const rawHypotheses = Array.isArray(synthesis.hypotheses) ? synthesis.hypotheses : [];
  const hypotheses = rawHypotheses.map(normalizeHypothesis);
  const sourceIds = new Set((brief?.sourceCandidates ?? []).map((item) => text(item?.sourceCandidateId)));
  const truthIds = new Set((brief?.projectTruths ?? []).map((item) => text(item?.id)));
  const contradictionIds = new Set((brief?.contradictions ?? []).map((item) => text(item?.id)));

  if (synthesis?.schema !== 'ai-studio-os/creative-synthesis-set@1') findings.push(finding('blocker', 'creative-synthesis-set-schema-invalid', 'Creative Synthesis candidate set requires creative-synthesis-set@1.'));
  if (synthesis?.stage !== 'creative-synthesis-hypothesis-set') findings.push(finding('blocker', 'creative-synthesis-set-stage-invalid', 'Creative Synthesis candidate set requires the canonical hypothesis-set stage.'));
  const unknownTop = unknownKeys(synthesis, SET_KEYS);
  if (unknownTop.length) findings.push(finding('blocker', 'creative-synthesis-set-shape-invalid', 'Creative Synthesis set may contain only canonical candidate-set and derived review fields; winner, recommendation, score and selection fields are not allowed.', { unknownKeys: unknownTop }));
  if (!briefReview.reviewReady) findings.push(finding('blocker', 'creative-synthesis-set-brief-not-ready', 'Creative Synthesis hypotheses require a structurally review-ready Synthesis Brief.', { findingCodes: briefReview.findings.map((item) => item.code) }));
  if (brief?.provenanceReady !== true) findings.push(finding('blocker', 'creative-synthesis-set-brief-provenance-not-ready', 'Creative Synthesis hypotheses cannot consume a brief whose Transfer-source provenance is not ready.'));

  const binding = synthesis?.briefBinding && typeof synthesis.briefBinding === 'object' ? synthesis.briefBinding : {};
  const bindingUnknown = unknownKeys(binding, BRIEF_BINDING_KEYS);
  const expectedBinding = buildBriefBinding(brief ?? {});
  if (bindingUnknown.length || !sameValue(binding, expectedBinding)) findings.push(finding('blocker', 'creative-synthesis-set-brief-binding-drift', 'Creative Synthesis set must bind the exact source brief and compact provenance receipt.', { unknownKeys: bindingUnknown }));
  if (text(binding?.bindingFingerprint) !== briefBindingFingerprint(binding)) findings.push(finding('blocker', 'creative-synthesis-set-binding-fingerprint-drift', 'Creative Synthesis set binding fingerprint must match its exact compact receipt.'));

  if (hypotheses.length < 3) findings.push(finding('major', 'creative-synthesis-hypothesis-count-thin', 'Creative Synthesis requires at least three hypotheses before Creative Thesis deliberation.', { count: hypotheses.length }));
  const ids = hypotheses.map((item) => item.id);
  if (new Set(ids).size !== ids.length || ids.some((id) => !id)) findings.push(finding('blocker', 'creative-synthesis-hypothesis-id-invalid', 'Synthesis hypothesis IDs must be unique and non-empty.'));
  const strategies = new Set(hypotheses.map((item) => item.strategy).filter(Boolean));
  if (strategies.size < 3) findings.push(finding('major', 'creative-synthesis-strategy-divergence-thin', 'Creative Synthesis requires at least three distinct structural combination strategies before downstream deliberation.', { strategies: [...strategies].sort(compareText) }));
  const conceptualFingerprints = hypotheses.map(conceptualPayloadFingerprint);
  if (new Set(conceptualFingerprints).size !== conceptualFingerprints.length) findings.push(finding('blocker', 'creative-synthesis-hypothesis-payload-duplicate', 'Renaming the same conceptual Synthesis payload or changing only its strategy label does not create a divergent hypothesis.'));

  const usedSources = new Set();
  const usedContradictions = new Set();
  rawHypotheses.forEach((raw, index) => {
    const hypothesis = hypotheses[index];
    const unknown = unknownKeys(raw, HYPOTHESIS_KEYS);
    if (unknown.length || !sameValue(raw ?? {}, hypothesis)) findings.push(finding('blocker', 'creative-synthesis-hypothesis-contract-drift', 'Synthesis hypotheses must use the exact canonical shape and ordering.', { hypothesisId: hypothesis.id, unknownKeys: unknown }));
    if (!STRATEGY_SET.has(hypothesis.strategy)) findings.push(finding('blocker', 'creative-synthesis-strategy-invalid', 'Synthesis hypothesis strategy must use one canonical structural combination strategy.', { hypothesisId: hypothesis.id, strategy: hypothesis.strategy }));
    if (hypothesis.sourceCandidateIds.length < 2) findings.push(finding('blocker', 'creative-synthesis-source-combination-thin', 'Each Synthesis hypothesis must combine at least two distinct verified Transfer candidates.', { hypothesisId: hypothesis.id }));
    const invalidSourceIds = hypothesis.sourceCandidateIds.filter((id) => !sourceIds.has(id));
    if (invalidSourceIds.length) findings.push(finding('blocker', 'creative-synthesis-source-ref-invalid', 'Synthesis hypothesis may cite only Transfer candidates present in its bound brief.', { hypothesisId: hypothesis.id, invalidSourceIds }));
    hypothesis.sourceCandidateIds.forEach((id) => usedSources.add(id));

    const contributionIds = hypothesis.sourceContributions.map((item) => item.sourceCandidateId);
    if (new Set(contributionIds).size !== contributionIds.length || hypothesis.sourceContributions.some((item) => !item.sourceCandidateId || !item.contribution)) findings.push(finding('blocker', 'creative-synthesis-source-contribution-invalid', 'Each source contribution requires one unique sourceCandidateId and a non-empty causal contribution statement.', { hypothesisId: hypothesis.id }));
    if (!sameValue([...contributionIds].sort(compareText), hypothesis.sourceCandidateIds)) findings.push(finding('blocker', 'creative-synthesis-source-contribution-set-drift', 'Source contributions must cover exactly the Transfer candidates claimed by the hypothesis.', { hypothesisId: hypothesis.id }));
    (Array.isArray(raw?.sourceContributions) ? raw.sourceContributions : []).forEach((contribution, contributionIndex) => {
      const contributionUnknown = unknownKeys(contribution, CONTRIBUTION_KEYS);
      if (contributionUnknown.length) findings.push(finding('blocker', 'creative-synthesis-source-contribution-shape-invalid', 'Source contributions may contain only sourceCandidateId and contribution.', { hypothesisId: hypothesis.id, contributionIndex, unknownKeys: contributionUnknown }));
    });

    if (!hypothesis.projectTruthRefs.length) findings.push(finding('major', 'creative-synthesis-project-grounding-missing', 'Each Synthesis hypothesis must cite explicit project truth.', { hypothesisId: hypothesis.id }));
    const invalidTruthRefs = hypothesis.projectTruthRefs.filter((id) => !truthIds.has(id));
    if (invalidTruthRefs.length) findings.push(finding('blocker', 'creative-synthesis-project-grounding-invalid', 'Synthesis hypothesis may cite only project truths in its bound brief.', { hypothesisId: hypothesis.id, invalidTruthRefs }));

    if (!hypothesis.contradictionRefs.length) findings.push(finding('major', 'creative-synthesis-contradiction-use-missing', 'Each Synthesis hypothesis should use at least one explicit productive contradiction.', { hypothesisId: hypothesis.id }));
    const invalidContradictionRefs = hypothesis.contradictionRefs.filter((id) => !contradictionIds.has(id));
    if (invalidContradictionRefs.length) findings.push(finding('blocker', 'creative-synthesis-contradiction-ref-invalid', 'Synthesis hypothesis may cite only contradictions present in its bound brief.', { hypothesisId: hypothesis.id, invalidContradictionRefs }));
    hypothesis.contradictionRefs.forEach((id) => usedContradictions.add(id));

    if (!hypothesis.governingIdea) findings.push(finding('major', 'creative-synthesis-governing-idea-missing', 'Each Synthesis hypothesis requires one governing idea candidate.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.productiveTension) findings.push(finding('major', 'creative-synthesis-productive-tension-missing', 'Each Synthesis hypothesis should state the productive tension it preserves.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.combinationMechanism) findings.push(finding('blocker', 'creative-synthesis-combination-mechanism-missing', 'Each Synthesis hypothesis must explain how its sources interact causally rather than merely listing them.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.experientialConsequences.length) findings.push(finding('major', 'creative-synthesis-experiential-consequence-missing', 'Each Synthesis hypothesis must state how the synthesis changes the experience.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.antiGenericClaims.length) findings.push(finding('major', 'creative-synthesis-anti-generic-missing', 'Each Synthesis hypothesis must identify category/default behavior it resists.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.ownabilityRisk) findings.push(finding('major', 'creative-synthesis-ownability-risk-missing', 'Each Synthesis hypothesis must name its main genericity/competitor-transfer risk.', { hypothesisId: hypothesis.id }));
    const competitorUnknown = unknownKeys(raw?.competitorTransferTest, COMPETITOR_TEST_KEYS);
    if (competitorUnknown.length || !sameValue(raw?.competitorTransferTest ?? {}, hypothesis.competitorTransferTest)) findings.push(finding('blocker', 'creative-synthesis-competitor-test-contract-drift', 'Competitor-transfer test must use the canonical question/failureCondition shape.', { hypothesisId: hypothesis.id, unknownKeys: competitorUnknown }));
    if (!hypothesis.competitorTransferTest.question || !hypothesis.competitorTransferTest.failureCondition) findings.push(finding('major', 'creative-synthesis-competitor-transfer-test-missing', 'Each Synthesis hypothesis requires an explicit competitor-transfer/ownability test.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.failureModes.length) findings.push(finding('major', 'creative-synthesis-failure-mode-missing', 'Each Synthesis hypothesis should state at least one failure mode.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.uncertainty) findings.push(finding('blocker', 'creative-synthesis-uncertainty-missing', 'Each Synthesis hypothesis must preserve meaningful uncertainty.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.falsifier) findings.push(finding('blocker', 'creative-synthesis-falsifier-missing', 'Each Synthesis hypothesis requires an explicit rejection condition.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.critique.length) findings.push(finding('major', 'creative-synthesis-adversarial-critique-missing', 'Each Synthesis hypothesis must survive explicit adversarial critique before downstream deliberation.', { hypothesisId: hypothesis.id }));

    const hits = sourceRestatementHits(hypothesis, brief ?? {});
    if (hits.length) findings.push(finding('blocker', 'creative-synthesis-source-restatement-detected', 'Synthesis hypothesis reproduces a complete freeform phrase from a Transfer candidate instead of transforming multiple source logics into a new project-grounded proposition.', { hypothesisId: hypothesis.id, hitCount: hits.length }));
  });

  const unusedContradictions = [...contradictionIds].filter((id) => !usedContradictions.has(id)).sort(compareText);
  if (unusedContradictions.length) findings.push(finding('major', 'creative-synthesis-contradiction-coverage-thin', 'At least one project contradiction is not exercised by any Synthesis hypothesis.', { unusedContradictionIds: unusedContradictions }));
  const unusedSources = [...sourceIds].filter((id) => !usedSources.has(id)).sort(compareText);
  if (unusedSources.length) findings.push(finding('major', 'creative-synthesis-source-coverage-thin', 'At least one verified Transfer candidate is not exercised by any Synthesis hypothesis.', { unusedSourceIds: unusedSources }));

  const computedFingerprint = setFingerprint({ ...synthesis, hypotheses, truth: canonicalSetTruth() });
  if (text(synthesis?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-synthesis-set-fingerprint-mismatch', 'Creative Synthesis set fingerprint must bind exact brief provenance, hypotheses and truth state.', { expected: computedFingerprint, actual: synthesis?.snapshotFingerprint ?? null }));
  if (!sameValue(synthesis?.truth ?? {}, canonicalSetTruth())) findings.push(finding('blocker', 'creative-synthesis-set-truth-drift', 'Creative Synthesis set truth boundary is fixed: structural validity cannot select a thesis, prove semantic divergence or grant production authority.'));
  const claims = authorityClaims(synthesis);
  if (claims.length) findings.push(finding('blocker', 'creative-synthesis-set-authority-fabricated', 'Creative Synthesis cannot produce a winner, recommendation, score, selected thesis, approval or production authority.', { claims }));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const coreMajors = findings.filter((item) => item.severity === 'major');
  const expectedPass = coreBlockers.length === 0;
  const expectedReady = coreBlockers.length === 0 && coreMajors.length === 0;
  const expectedStatus = coreBlockers.length ? 'blocked' : coreMajors.length ? 'provisional' : 'ready-for-creative-thesis-deliberation';
  if (Object.hasOwn(synthesis, 'pass') && synthesis.pass !== expectedPass) findings.push(finding('blocker', 'creative-synthesis-set-pass-claim-drift', 'Cached Synthesis pass flag must match fresh review.'));
  if (Object.hasOwn(synthesis, 'reviewReady') && synthesis.reviewReady !== expectedReady) findings.push(finding('blocker', 'creative-synthesis-set-ready-claim-drift', 'Cached Synthesis reviewReady flag must match fresh review.'));
  if (Object.hasOwn(synthesis, 'status') && synthesis.status !== expectedStatus) findings.push(finding('blocker', 'creative-synthesis-set-status-claim-drift', 'Cached Synthesis status must match fresh review.', { expected: expectedStatus, actual: synthesis.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-synthesis-set-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-creative-thesis-deliberation',
    findings,
    computedFingerprint,
    truth: canonicalSetTruth()
  };
}

export function reviewCreativeSynthesisSetProvenance({ synthesis, brief, sources } = {}) {
  const findings = [];
  const briefProvenanceReview = reviewCreativeSynthesisBriefProvenance({ brief, sources });
  const synthesisReview = reviewCreativeSynthesisSet(synthesis ?? {}, { brief });
  if (!briefProvenanceReview.reviewReady) findings.push(finding('blocker', 'creative-synthesis-set-provenance-brief-not-verified', 'Synthesis set provenance requires the bound Synthesis Brief to be independently verified back through every Transfer Candidate source chain.', { findingCodes: briefProvenanceReview.findings.map((item) => item.code) }));
  if (!synthesisReview.reviewReady) findings.push(finding('blocker', 'creative-synthesis-set-provenance-set-not-ready', 'Synthesis set must pass fresh structural review before provenance can be established.', { findingCodes: synthesisReview.findings.map((item) => item.code) }));
  const expectedBinding = buildBriefBinding(brief ?? {}, briefProvenanceReview.reviewReady);
  if (!sameValue(synthesis?.briefBinding ?? {}, expectedBinding)) findings.push(finding('blocker', 'creative-synthesis-set-provenance-binding-drift', 'Synthesis set must bind the exact independently verified Synthesis Brief.'));
  const expectedReady = briefProvenanceReview.reviewReady && synthesisReview.reviewReady;
  const expectedReceipt = setReceipt(synthesis ?? {}, briefProvenanceReview, synthesisReview.reviewReady);
  if (Object.hasOwn(synthesis ?? {}, 'provenanceReceipt') && !sameValue(synthesis.provenanceReceipt, expectedReceipt)) findings.push(finding('blocker', 'creative-synthesis-set-provenance-receipt-drift', 'Attached Synthesis provenance receipt must equal the independently recomputed compact receipt.'));
  if (Object.hasOwn(synthesis ?? {}, 'provenanceReady') && synthesis.provenanceReady !== expectedReady) findings.push(finding('blocker', 'creative-synthesis-set-provenance-ready-drift', 'Attached Synthesis provenanceReady flag must equal fresh independent verification.'));
  if (briefProvenanceReview.reviewReady && Object.hasOwn(synthesis ?? {}, 'findings') && !sameValue(synthesis.findings, synthesisReview.findings)) findings.push(finding('blocker', 'creative-synthesis-set-provenance-findings-drift', 'Attached Synthesis diagnostics must equal fresh structural review when source provenance is valid.'));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-synthesis-set-provenance-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'verified-synthesis-set-provenance',
    findings,
    sourceReceipt: expectedReceipt,
    truth: {
      synthesisBriefReverified: true,
      everyTransferSourceChainReverified: true,
      structuralSynthesisRecomputed: true,
      semanticSynthesisVerified: false,
      creativeThesisSelected: false,
      productionApproved: false
    }
  };
}

export function buildCreativeSynthesisSet({ brief, sources, hypotheses = [] } = {}) {
  const briefProvenanceReview = reviewCreativeSynthesisBriefProvenance({ brief, sources });
  const sourceReady = briefProvenanceReview.reviewReady === true;
  const normalizedHypotheses = sourceReady ? (Array.isArray(hypotheses) ? hypotheses : []).map(normalizeHypothesis) : [];
  const synthesis = {
    schema: 'ai-studio-os/creative-synthesis-set@1',
    stage: 'creative-synthesis-hypothesis-set',
    briefBinding: buildBriefBinding(brief ?? {}, sourceReady),
    hypotheses: normalizedHypotheses,
    truth: canonicalSetTruth()
  };
  synthesis.snapshotFingerprint = setFingerprint(synthesis);
  const review = reviewCreativeSynthesisSet(synthesis, { brief });
  const findings = [...review.findings];
  if (!sourceReady) findings.push(finding('blocker', 'creative-synthesis-set-source-provenance-blocked', 'Default Synthesis construction requires independently verified Synthesis Brief → every Transfer Candidate → Hypothesis → Brief → Retrieval → Graph → Foundation provenance. No Synthesis hypotheses were consumed.', { findingCodes: briefProvenanceReview.findings.map((item) => item.code) }));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;
  return {
    ...synthesis,
    findings,
    pass: blockers.length === 0,
    reviewReady,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-creative-thesis-deliberation',
    provenanceReceipt: setReceipt(synthesis, briefProvenanceReview, reviewReady),
    provenanceReady: reviewReady && briefProvenanceReview.reviewReady
  };
}

export function creativeSynthesisBriefFingerprint(brief = {}) {
  return briefFingerprint(brief);
}

export function creativeSynthesisSetFingerprint(synthesis = {}) {
  return setFingerprint(synthesis);
}
