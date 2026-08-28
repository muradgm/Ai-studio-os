import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import {
  creativeKnowledgeRetrievalContract,
  creativeKnowledgeRetrievalFingerprint,
  reviewCreativeKnowledgeRetrieval
} from '../creative-knowledge-graph/retrieval.mjs';
import { reviewCreativeKnowledgeRetrievalProvenance } from '../creative-knowledge-graph/provenance.mjs';

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

const KNOWN_AUTHORITY_KEYS = Object.freeze([
  'selected', 'approved', 'canonical', 'authorityGranted', 'creativeAuthorityGranted',
  'humanApproved', 'humanSelected', 'creativeDirectionSelected', 'creativeDirectionApproved',
  'productionApproved', 'technicalPlanningAuthorized'
]);
const UNKNOWN_AUTHORITY_KEY = /(can.*(approve|select|authoriz)|(?:is|has).*(approved|selected|canonical|authorized)|creative.*authority|production.*approved|technicalplanning.*authorized)/i;

function authorityClaims(object = {}) {
  const claims = [];
  for (const key of KNOWN_AUTHORITY_KEYS) {
    if (object?.[key] === true || object?.truth?.[key] === true) claims.push(key);
  }
  for (const [key, value] of Object.entries(object && typeof object === 'object' ? object : {})) {
    if (key !== 'truth' && value === true && UNKNOWN_AUTHORITY_KEY.test(key)) claims.push(key);
  }
  for (const [key, value] of Object.entries(object?.truth && typeof object.truth === 'object' ? object.truth : {})) {
    if (value === true && UNKNOWN_AUTHORITY_KEY.test(key)) claims.push(`truth.${key}`);
  }
  const status = text(object?.status).toLowerCase();
  if (['approved', 'selected', 'canonical', 'authoritative', 'production-ready', 'production-approved'].includes(status)) claims.push(`status:${status}`);
  return [...new Set(claims)];
}

function normalizeProjectTruth(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    id: text(source.id),
    statement: text(source.statement)
  };
}

function normalizeResponse(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    rule: text(source.rule),
    action: text(source.action)
  };
}

function normalizeRiskMitigation(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    risk: text(source.risk),
    mitigation: text(source.mitigation)
  };
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

const BRIEF_KEYS = Object.freeze([
  'schema', 'stage', 'projectId', 'target', 'projectTruths', 'constraints', 'sourceBinding',
  'primaryEvidence', 'conflictEvidence', 'transferFirewall', 'snapshotFingerprint', 'truth',
  'findings', 'pass', 'reviewReady', 'status', 'provenanceReceipt', 'provenanceReady'
]);
const TARGET_KEYS = Object.freeze(['domain', 'problem', 'desiredEffect']);
const PROJECT_TRUTH_KEYS = Object.freeze(['id', 'statement']);
const SOURCE_BINDING_KEYS = Object.freeze([
  'schema', 'retrievalSnapshotFingerprint', 'retrievalContractFingerprint', 'graphSnapshotFingerprint',
  'foundationSnapshotFingerprint', 'retrievalProvenanceReceiptFingerprint',
  'sourceRetrievalProvenanceReady', 'bindingFingerprint'
]);
const EVIDENCE_KEYS = Object.freeze([
  'schema', 'knowledgeId', 'knowledgeFingerprint', 'kind', 'sourceDomain', 'definition',
  'causalRationale', 'worksWhen', 'failsWhen', 'failureModes', 'counterexamples', 'diagnostics',
  'transferability', 'transferablePrinciples', 'surfaceSignature', 'mustStrip', 'adaptationRules',
  'copyRisks', 'visibleConflictIds', 'withheldConflictPresent', 'retrievalRank',
  'includedAsConflictContext', 'status', 'truth'
]);
const FIREWALL_KEYS = Object.freeze([
  'sourceSurfaceSignatures', 'requiredStripSignatures', 'adaptationRules', 'copyRisks'
]);
const BRIEF_RECEIPT_KEYS = Object.freeze([
  'schema', 'briefSnapshotFingerprint', 'retrievalSnapshotFingerprint', 'graphSnapshotFingerprint',
  'foundationSnapshotFingerprint', 'reviewReady', 'truth'
]);

function canonicalBriefTruth() {
  return {
    transferEvidenceOnly: true,
    retrievalRankIsTransferAuthority: false,
    sourceSurfaceSignatureIsDirection: false,
    semanticOriginalityVerified: false,
    transferIsCreativeAuthority: false,
    creativeDirectionSelected: false,
    productionApproved: false
  };
}

function canonicalEvidenceTruth() {
  return {
    sourceEvidenceOnly: true,
    surfaceSignatureMustNotTransferByDefault: true,
    retrievalRankIsTransferAuthority: false,
    creativeDirectionSelected: false,
    productionApproved: false
  };
}

function normalizeTarget(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    domain: text(source.domain),
    problem: text(source.problem),
    desiredEffect: text(source.desiredEffect)
  };
}

function evidenceProjection(item = {}, conflictContext = false) {
  const entry = item?.entry ?? {};
  const transfer = entry?.transfer ?? {};
  return {
    schema: 'ai-studio-os/creative-transfer-evidence@1',
    knowledgeId: text(item.knowledgeId),
    knowledgeFingerprint: text(item.knowledgeFingerprint),
    kind: text(entry.kind),
    sourceDomain: text(entry.domain),
    definition: text(entry.definition),
    causalRationale: text(entry.causalRationale),
    worksWhen: list(entry.worksWhen),
    failsWhen: list(entry.failsWhen),
    failureModes: list(entry.failureModes),
    counterexamples: list(entry.counterexamples),
    diagnostics: list(entry.diagnostics),
    transferability: text(entry.transferability),
    transferablePrinciples: list(transfer.transferablePrinciples),
    surfaceSignature: list(transfer.surfaceSignature),
    mustStrip: list(transfer.mustStrip),
    adaptationRules: list(transfer.adaptationRules),
    copyRisks: list(transfer.copyRisks),
    visibleConflictIds: sortedList(item.visibleConflictIds),
    withheldConflictPresent: item.withheldConflictPresent === true,
    retrievalRank: conflictContext ? null : Number(item.rank),
    includedAsConflictContext: conflictContext,
    status: text(item?.annotation?.status),
    truth: canonicalEvidenceTruth()
  };
}

function evidenceContract(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    schema: 'ai-studio-os/creative-transfer-evidence@1',
    knowledgeId: text(source.knowledgeId),
    knowledgeFingerprint: text(source.knowledgeFingerprint),
    kind: text(source.kind),
    sourceDomain: text(source.sourceDomain),
    definition: text(source.definition),
    causalRationale: text(source.causalRationale),
    worksWhen: list(source.worksWhen),
    failsWhen: list(source.failsWhen),
    failureModes: list(source.failureModes),
    counterexamples: list(source.counterexamples),
    diagnostics: list(source.diagnostics),
    transferability: text(source.transferability),
    transferablePrinciples: list(source.transferablePrinciples),
    surfaceSignature: list(source.surfaceSignature),
    mustStrip: list(source.mustStrip),
    adaptationRules: list(source.adaptationRules),
    copyRisks: list(source.copyRisks),
    visibleConflictIds: sortedList(source.visibleConflictIds),
    withheldConflictPresent: source.withheldConflictPresent === true,
    retrievalRank: source.retrievalRank === null ? null : Number(source.retrievalRank),
    includedAsConflictContext: source.includedAsConflictContext === true,
    status: text(source.status),
    truth: canonicalEvidenceTruth()
  };
}

function mergeEvidenceLists(evidence, key) {
  return sortedList(evidence.flatMap((item) => Array.isArray(item?.[key]) ? item[key] : []));
}

function transferFirewall(primaryEvidence = [], conflictEvidence = []) {
  const evidence = [...primaryEvidence, ...conflictEvidence];
  return {
    sourceSurfaceSignatures: mergeEvidenceLists(evidence, 'surfaceSignature'),
    requiredStripSignatures: mergeEvidenceLists(evidence, 'mustStrip'),
    adaptationRules: mergeEvidenceLists(evidence, 'adaptationRules'),
    copyRisks: mergeEvidenceLists(evidence, 'copyRisks')
  };
}

function sourceBindingFingerprint(binding = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-transfer-source-binding@1',
    retrievalSnapshotFingerprint: text(binding.retrievalSnapshotFingerprint),
    retrievalContractFingerprint: text(binding.retrievalContractFingerprint),
    graphSnapshotFingerprint: text(binding.graphSnapshotFingerprint),
    foundationSnapshotFingerprint: text(binding.foundationSnapshotFingerprint),
    retrievalProvenanceReceiptFingerprint: text(binding.retrievalProvenanceReceiptFingerprint),
    sourceRetrievalProvenanceReady: binding.sourceRetrievalProvenanceReady === true
  });
}

function buildSourceBinding(retrieval, retrievalProvenanceReview) {
  const receipt = retrievalProvenanceReview?.sourceReceipt ?? {};
  const binding = {
    schema: 'ai-studio-os/creative-transfer-source-binding@1',
    retrievalSnapshotFingerprint: text(retrieval?.snapshotFingerprint),
    retrievalContractFingerprint: fingerprintCreativeValue(creativeKnowledgeRetrievalContract(retrieval ?? {})),
    graphSnapshotFingerprint: text(receipt.graphSnapshotFingerprint),
    foundationSnapshotFingerprint: text(receipt.foundationSnapshotFingerprint),
    retrievalProvenanceReceiptFingerprint: fingerprintCreativeValue(receipt),
    sourceRetrievalProvenanceReady: retrievalProvenanceReview?.reviewReady === true
  };
  return { ...binding, bindingFingerprint: sourceBindingFingerprint(binding) };
}

function briefFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-transfer-brief@1',
    projectId: text(value.projectId),
    target: normalizeTarget(value.target),
    projectTruths: (Array.isArray(value.projectTruths) ? value.projectTruths : []).map(normalizeProjectTruth),
    constraints: list(value.constraints),
    sourceBindingFingerprint: text(value?.sourceBinding?.bindingFingerprint),
    primaryEvidence: (Array.isArray(value.primaryEvidence) ? value.primaryEvidence : []).map(evidenceContract),
    conflictEvidence: (Array.isArray(value.conflictEvidence) ? value.conflictEvidence : []).map(evidenceContract),
    transferFirewall: {
      sourceSurfaceSignatures: sortedList(value?.transferFirewall?.sourceSurfaceSignatures),
      requiredStripSignatures: sortedList(value?.transferFirewall?.requiredStripSignatures),
      adaptationRules: sortedList(value?.transferFirewall?.adaptationRules),
      copyRisks: sortedList(value?.transferFirewall?.copyRisks)
    }
  });
}

function briefReceipt(brief, retrievalProvenanceReview) {
  return {
    schema: 'ai-studio-os/creative-transfer-brief-provenance-receipt@1',
    briefSnapshotFingerprint: text(brief.snapshotFingerprint),
    retrievalSnapshotFingerprint: text(retrievalProvenanceReview?.sourceReceipt?.retrievalSnapshotFingerprint) || text(brief?.sourceBinding?.retrievalSnapshotFingerprint),
    graphSnapshotFingerprint: text(retrievalProvenanceReview?.sourceReceipt?.graphSnapshotFingerprint),
    foundationSnapshotFingerprint: text(retrievalProvenanceReview?.sourceReceipt?.foundationSnapshotFingerprint),
    reviewReady: retrievalProvenanceReview?.reviewReady === true,
    truth: {
      receiptContainsSourceKnowledge: false,
      hashIsSignature: false,
      transferAuthorityGranted: false,
      productionApproved: false
    }
  };
}

function canonicalBriefCore({ retrieval, graph, foundation, target, projectTruths, constraints }) {
  const retrievalProvenanceReview = reviewCreativeKnowledgeRetrievalProvenance({ retrieval, graph, foundation });
  const sourceBinding = buildSourceBinding(retrieval ?? {}, retrievalProvenanceReview);
  const retrievalReady = retrievalProvenanceReview.reviewReady === true;
  const primaryEvidence = retrievalReady
    ? (Array.isArray(retrieval?.results) ? retrieval.results : []).map((item) => evidenceProjection(item, false))
    : [];
  const conflictEvidence = retrievalReady
    ? (Array.isArray(retrieval?.conflictContext) ? retrieval.conflictContext : []).map((item) => evidenceProjection(item, true))
    : [];
  const brief = {
    schema: 'ai-studio-os/creative-transfer-brief@1',
    stage: 'creative-transfer-brief',
    projectId: text(retrieval?.query?.projectId),
    target: normalizeTarget(target),
    projectTruths: (Array.isArray(projectTruths) ? projectTruths : []).map(normalizeProjectTruth),
    constraints: list(constraints),
    sourceBinding,
    primaryEvidence,
    conflictEvidence,
    transferFirewall: transferFirewall(primaryEvidence, conflictEvidence),
    truth: canonicalBriefTruth()
  };
  brief.snapshotFingerprint = briefFingerprint(brief);
  return { brief, retrievalProvenanceReview };
}

export function reviewCreativeTransferBrief(brief = {}) {
  const findings = [];
  const target = normalizeTarget(brief.target);
  const projectTruths = (Array.isArray(brief.projectTruths) ? brief.projectTruths : []).map(normalizeProjectTruth);
  const constraints = list(brief.constraints);
  const sourceBinding = brief?.sourceBinding && typeof brief.sourceBinding === 'object' ? brief.sourceBinding : {};
  const primaryEvidence = (Array.isArray(brief.primaryEvidence) ? brief.primaryEvidence : []).map(evidenceContract);
  const conflictEvidence = (Array.isArray(brief.conflictEvidence) ? brief.conflictEvidence : []).map(evidenceContract);
  const allEvidence = [...primaryEvidence, ...conflictEvidence];
  const expectedFirewall = transferFirewall(primaryEvidence, conflictEvidence);
  const computedFingerprint = briefFingerprint({ ...brief, target, projectTruths, constraints, primaryEvidence, conflictEvidence, transferFirewall: expectedFirewall });

  if (brief?.schema !== 'ai-studio-os/creative-transfer-brief@1') findings.push(finding('blocker', 'creative-transfer-brief-schema-invalid', 'Creative Transfer Brief requires creative-transfer-brief@1.'));
  if (brief?.stage !== 'creative-transfer-brief') findings.push(finding('blocker', 'creative-transfer-brief-stage-invalid', 'Creative Transfer Brief requires the canonical transfer-brief stage.'));
  const unknownTop = unknownKeys(brief, BRIEF_KEYS);
  if (unknownTop.length) findings.push(finding('blocker', 'creative-transfer-brief-shape-invalid', 'Creative Transfer Brief may contain only canonical artifact and derived review fields.', { unknownKeys: unknownTop }));
  if (!text(brief.projectId)) findings.push(finding('blocker', 'creative-transfer-brief-project-missing', 'Creative Transfer Brief requires one project identity.'));

  const targetUnknown = unknownKeys(brief?.target, TARGET_KEYS);
  if (targetUnknown.length || !sameValue(brief?.target ?? {}, target)) findings.push(finding('blocker', 'creative-transfer-target-contract-drift', 'Transfer target must equal the canonical target contract.', { unknownKeys: targetUnknown }));
  if (!target.domain) findings.push(finding('blocker', 'creative-transfer-target-domain-missing', 'Transfer requires an explicit target domain.'));
  if (!target.problem) findings.push(finding('major', 'creative-transfer-target-problem-missing', 'Transfer should state the target problem it is trying to solve.'));
  if (!target.desiredEffect) findings.push(finding('major', 'creative-transfer-target-effect-missing', 'Transfer should state the desired experiential or creative effect.'));

  const truthIds = projectTruths.map((item) => item.id);
  const rawProjectTruths = Array.isArray(brief.projectTruths) ? brief.projectTruths : [];
  rawProjectTruths.forEach((raw, index) => {
    const unknown = unknownKeys(raw, PROJECT_TRUTH_KEYS);
    if (unknown.length || !sameValue(raw ?? {}, projectTruths[index])) findings.push(finding('blocker', 'creative-transfer-project-truth-contract-drift', 'Project truths must use the exact canonical truth-reference shape.', { index, unknownKeys: unknown }));
  });
  if (!projectTruths.length) findings.push(finding('blocker', 'creative-transfer-project-truth-missing', 'Transfer must remain grounded in at least one explicit project truth.'));
  if (truthIds.some((id) => !id) || new Set(truthIds).size !== truthIds.length || projectTruths.some((item) => !item.statement)) findings.push(finding('blocker', 'creative-transfer-project-truth-invalid', 'Project truths require unique IDs and non-empty statements.'));
  if (!sameValue(brief?.constraints ?? [], constraints)) findings.push(finding('blocker', 'creative-transfer-constraints-contract-drift', 'Transfer constraints must equal the canonical normalized constraint list.'));

  const bindingUnknown = unknownKeys(sourceBinding, SOURCE_BINDING_KEYS);
  if (bindingUnknown.length) findings.push(finding('blocker', 'creative-transfer-source-binding-shape-invalid', 'Transfer source binding may contain only the canonical provenance receipt fields.', { unknownKeys: bindingUnknown }));
  if (sourceBinding?.schema !== 'ai-studio-os/creative-transfer-source-binding@1') findings.push(finding('blocker', 'creative-transfer-source-binding-schema-invalid', 'Transfer Brief requires the canonical Graph retrieval binding.'));
  for (const key of ['retrievalSnapshotFingerprint', 'retrievalContractFingerprint', 'graphSnapshotFingerprint', 'foundationSnapshotFingerprint', 'retrievalProvenanceReceiptFingerprint']) {
    if (!isSha256(sourceBinding?.[key])) findings.push(finding('blocker', 'creative-transfer-source-binding-fingerprint-invalid', 'Transfer source binding requires exact SHA-256 drift fingerprints.', { key }));
  }
  if (sourceBinding?.sourceRetrievalProvenanceReady !== true) findings.push(finding('blocker', 'creative-transfer-source-provenance-not-ready', 'Transfer cannot use retrieval evidence whose Graph + Foundation provenance is not independently ready.'));
  if (text(sourceBinding?.bindingFingerprint) !== sourceBindingFingerprint(sourceBinding)) findings.push(finding('blocker', 'creative-transfer-source-binding-drift', 'Transfer source binding fingerprint must match its exact compact receipt.'));

  const inspectEvidence = (raw, canonical, conflictContext) => {
    const knowledgeId = text(canonical.knowledgeId);
    const unknown = unknownKeys(raw, EVIDENCE_KEYS);
    if (unknown.length || !sameValue(raw, canonical)) findings.push(finding('blocker', 'creative-transfer-evidence-contract-drift', 'Transfer evidence must equal its exact project-safe canonical projection.', { knowledgeId: knowledgeId || null, unknownKeys: unknown }));
    if (!knowledgeId || !isSha256(canonical.knowledgeFingerprint)) findings.push(finding('blocker', 'creative-transfer-evidence-identity-invalid', 'Transfer evidence requires stable knowledge identity and source knowledge fingerprint.', { knowledgeId: knowledgeId || null }));
    if (!canonical.sourceDomain || !canonical.definition || !canonical.causalRationale) findings.push(finding('major', 'creative-transfer-evidence-causal-kernel-thin', 'Transfer evidence should preserve source domain, definition and causal rationale.', { knowledgeId }));
    if (!sameValue(raw?.truth ?? {}, canonicalEvidenceTruth())) findings.push(finding('blocker', 'creative-transfer-evidence-truth-drift', 'Transfer evidence truth is fixed and cannot grant direction or production authority.', { knowledgeId }));
    if (conflictContext) {
      if (canonical.retrievalRank !== null || canonical.includedAsConflictContext !== true) findings.push(finding('blocker', 'creative-transfer-conflict-evidence-role-invalid', 'Conflict evidence remains explicitly unranked context.', { knowledgeId }));
    } else if (!Number.isInteger(canonical.retrievalRank) || canonical.retrievalRank < 1 || canonical.includedAsConflictContext === true) {
      findings.push(finding('blocker', 'creative-transfer-primary-evidence-role-invalid', 'Primary transfer evidence must preserve a valid retrieval rank without treating rank as authority.', { knowledgeId }));
    }
  };

  (Array.isArray(brief.primaryEvidence) ? brief.primaryEvidence : []).forEach((raw, index) => inspectEvidence(raw, primaryEvidence[index], false));
  (Array.isArray(brief.conflictEvidence) ? brief.conflictEvidence : []).forEach((raw, index) => inspectEvidence(raw, conflictEvidence[index], true));
  const evidenceIds = allEvidence.map((item) => item.knowledgeId);
  if (new Set(evidenceIds).size !== evidenceIds.length || evidenceIds.some((id) => !id)) findings.push(finding('blocker', 'creative-transfer-evidence-id-invalid', 'Transfer Brief evidence IDs must be non-empty and unique across primary and conflict evidence.', { evidenceIds }));
  if (!primaryEvidence.length) findings.push(finding('major', 'creative-transfer-primary-evidence-empty', 'Transfer Brief has no eligible primary evidence to transfer.'));

  const firewallUnknown = unknownKeys(brief?.transferFirewall, FIREWALL_KEYS);
  if (firewallUnknown.length || !sameValue(brief?.transferFirewall ?? {}, expectedFirewall)) findings.push(finding('blocker', 'creative-transfer-firewall-drift', 'Transfer firewall must be derived exactly from the isolated source evidence.', { unknownKeys: firewallUnknown }));

  if (text(brief?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-transfer-brief-fingerprint-mismatch', 'Transfer Brief fingerprint must bind target, project truth, source provenance and exact evidence projection.', { expected: computedFingerprint, actual: brief?.snapshotFingerprint ?? null }));
  if (!sameValue(brief?.truth ?? {}, canonicalBriefTruth())) findings.push(finding('blocker', 'creative-transfer-brief-truth-drift', 'Transfer Brief truth boundary is fixed and non-authoritative.'));
  const claims = authorityClaims(brief);
  if (claims.length) findings.push(finding('blocker', 'creative-transfer-brief-authority-fabricated', 'Transfer Brief is advisory evidence infrastructure and cannot declare creative or production authority.', { claims }));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const coreMajors = findings.filter((item) => item.severity === 'major');
  const expectedPass = coreBlockers.length === 0;
  const expectedReady = coreBlockers.length === 0 && coreMajors.length === 0;
  const expectedStatus = coreBlockers.length ? 'blocked' : coreMajors.length ? 'provisional' : 'ready-for-transfer-hypotheses';
  if (Object.hasOwn(brief, 'pass') && brief.pass !== expectedPass) findings.push(finding('blocker', 'creative-transfer-brief-pass-claim-drift', 'Cached Transfer Brief pass flag must match fresh review.'));
  if (Object.hasOwn(brief, 'reviewReady') && brief.reviewReady !== expectedReady) findings.push(finding('blocker', 'creative-transfer-brief-ready-claim-drift', 'Cached Transfer Brief reviewReady flag must match fresh review.'));
  if (Object.hasOwn(brief, 'status') && brief.status !== expectedStatus) findings.push(finding('blocker', 'creative-transfer-brief-status-claim-drift', 'Cached Transfer Brief status must match fresh review.', { expected: expectedStatus, actual: brief.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-transfer-brief-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-transfer-hypotheses',
    findings,
    computedFingerprint,
    truth: {
      graphRetrievalProvenanceRequired: true,
      projectTruthGroundingRequired: true,
      surfaceCopyFirewallRequired: true,
      semanticOriginalityVerified: false,
      transferAuthorityGranted: false,
      productionApproved: false
    }
  };
}

export function reviewCreativeTransferBriefProvenance({ brief, retrieval, graph, foundation } = {}) {
  const findings = [];
  const briefReview = reviewCreativeTransferBrief(brief ?? {});
  const retrievalReview = reviewCreativeKnowledgeRetrieval(retrieval ?? {});
  const retrievalProvenanceReview = reviewCreativeKnowledgeRetrievalProvenance({ retrieval, graph, foundation });

  if (!briefReview.reviewReady) findings.push(finding('blocker', 'creative-transfer-brief-provenance-brief-not-ready', 'Independent Transfer Brief provenance requires a structurally review-ready brief.', { findingCodes: briefReview.findings.map((item) => item.code) }));
  if (!retrievalReview.reviewReady) findings.push(finding('blocker', 'creative-transfer-brief-provenance-retrieval-not-ready', 'Transfer Brief provenance requires the exact source retrieval to pass fresh structural review.', { findingCodes: retrievalReview.findings.map((item) => item.code) }));
  if (!retrievalProvenanceReview.reviewReady) findings.push(finding('blocker', 'creative-transfer-brief-provenance-source-not-verified', 'Transfer Brief provenance requires independent retrieval → Graph → Foundation verification.', { findingCodes: retrievalProvenanceReview.findings.map((item) => item.code) }));

  const expectedBinding = buildSourceBinding(retrieval ?? {}, retrievalProvenanceReview);
  if (!sameValue(brief?.sourceBinding ?? {}, expectedBinding)) findings.push(finding('blocker', 'creative-transfer-brief-provenance-binding-drift', 'Transfer Brief must bind the exact independently verified retrieval provenance receipt.'));
  if (text(brief?.projectId) !== text(retrieval?.query?.projectId)) findings.push(finding('blocker', 'creative-transfer-brief-provenance-project-drift', 'Transfer Brief project identity must match the source retrieval project identity.'));
  if (text(brief?.sourceBinding?.retrievalSnapshotFingerprint) !== creativeKnowledgeRetrievalFingerprint(retrieval ?? {})) findings.push(finding('blocker', 'creative-transfer-brief-provenance-retrieval-fingerprint-drift', 'Transfer Brief retrieval fingerprint must match the exact supplied retrieval contract.'));

  const rebuilt = canonicalBriefCore({
    retrieval,
    graph,
    foundation,
    target: brief?.target,
    projectTruths: brief?.projectTruths,
    constraints: brief?.constraints
  }).brief;
  if (!sameValue({
    projectId: brief?.projectId,
    target: brief?.target,
    projectTruths: brief?.projectTruths,
    constraints: brief?.constraints,
    sourceBinding: brief?.sourceBinding,
    primaryEvidence: brief?.primaryEvidence,
    conflictEvidence: brief?.conflictEvidence,
    transferFirewall: brief?.transferFirewall,
    snapshotFingerprint: brief?.snapshotFingerprint,
    truth: brief?.truth
  }, {
    projectId: rebuilt.projectId,
    target: rebuilt.target,
    projectTruths: rebuilt.projectTruths,
    constraints: rebuilt.constraints,
    sourceBinding: rebuilt.sourceBinding,
    primaryEvidence: rebuilt.primaryEvidence,
    conflictEvidence: rebuilt.conflictEvidence,
    transferFirewall: rebuilt.transferFirewall,
    snapshotFingerprint: rebuilt.snapshotFingerprint,
    truth: rebuilt.truth
  })) findings.push(finding('blocker', 'creative-transfer-brief-provenance-rebuild-drift', 'Transfer Brief differs from the deterministic brief rebuilt from the supplied retrieval, Graph and Foundation.'));

  const expectedReceipt = briefReceipt(brief ?? {}, retrievalProvenanceReview);
  if (Object.hasOwn(brief ?? {}, 'provenanceReceipt') && !sameValue(brief.provenanceReceipt, expectedReceipt)) findings.push(finding('blocker', 'creative-transfer-brief-provenance-receipt-drift', 'Attached Transfer Brief provenance receipt must equal the independently recomputed compact receipt.'));
  if (Object.hasOwn(brief ?? {}, 'provenanceReady') && brief.provenanceReady !== (briefReview.reviewReady && retrievalProvenanceReview.reviewReady)) findings.push(finding('blocker', 'creative-transfer-brief-provenance-ready-drift', 'Attached Transfer Brief provenanceReady flag must equal fresh independent verification.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const receipt = briefReceipt(brief ?? {}, retrievalProvenanceReview);
  return {
    schema: 'ai-studio-os/creative-transfer-brief-provenance-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'verified-transfer-brief-provenance',
    findings,
    sourceReceipt: receipt,
    truth: {
      retrievalGraphFoundationSuppliedSeparately: true,
      deterministicBriefRecomputed: true,
      sourceKnowledgeExcludedFromReceipt: true,
      hashIsSignature: false,
      transferAuthorityGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeTransferBrief({ retrieval, graph, foundation, target, projectTruths = [], constraints = [] } = {}) {
  const { brief, retrievalProvenanceReview } = canonicalBriefCore({ retrieval, graph, foundation, target, projectTruths, constraints });
  const review = reviewCreativeTransferBrief(brief);
  const provenanceReady = review.reviewReady && retrievalProvenanceReview.reviewReady;
  const receipt = briefReceipt(brief, retrievalProvenanceReview);
  const findings = [...review.findings];
  if (!retrievalProvenanceReview.reviewReady) findings.push(finding('blocker', 'creative-transfer-brief-source-provenance-blocked', 'Transfer Brief source retrieval failed independent Graph + Foundation provenance. No source evidence was emitted.', { findingCodes: retrievalProvenanceReview.findings.map((item) => item.code) }));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    ...brief,
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-transfer-hypotheses',
    provenanceReceipt: receipt,
    provenanceReady,
    truth: { ...brief.truth, sourceRetrievalProvenanceSatisfied: provenanceReady, productionApproved: false }
  };
}

const HYPOTHESIS_KEYS = Object.freeze([
  'schema', 'stage', 'briefBinding', 'sourceKnowledgeIds', 'sourcePrinciples', 'projectTruthRefs',
  'counterevidenceKnowledgeIds', 'hiddenCounterevidenceAcknowledged', 'transferClaim', 'causalBridge',
  'targetConsequence', 'adaptationActions', 'strippedSurfaceSignatures', 'adaptationRuleResponses',
  'copyRiskMitigations', 'uncertainty', 'falsifier', 'copyFirewallAssessment', 'snapshotFingerprint',
  'truth', 'findings', 'pass', 'reviewReady', 'status', 'provenanceReceipt', 'provenanceReady'
]);
const HYPOTHESIS_BINDING_KEYS = Object.freeze([
  'schema', 'briefSnapshotFingerprint', 'retrievalSnapshotFingerprint', 'projectId', 'targetDomain',
  'briefProvenanceReceiptFingerprint', 'sourceBriefProvenanceReady', 'bindingFingerprint'
]);
const SOURCE_PRINCIPLE_KEYS = Object.freeze(['knowledgeId', 'principles']);
const COPY_ASSESSMENT_KEYS = Object.freeze([
  'requiredStripSignatures', 'copyProbeSignatures', 'requiredAdaptationRules', 'requiredCopyRisks',
  'requiredVisibleCounterevidenceIds', 'sourceHasWithheldCounterevidence', 'exactSurfaceCopyHits'
]);
const HYPOTHESIS_RECEIPT_KEYS = Object.freeze([
  'schema', 'hypothesisSnapshotFingerprint', 'briefSnapshotFingerprint', 'retrievalSnapshotFingerprint',
  'graphSnapshotFingerprint', 'foundationSnapshotFingerprint', 'reviewReady', 'truth'
]);

function canonicalHypothesisTruth() {
  return {
    transferHypothesisOnly: true,
    exactSurfaceCopyBlocked: true,
    semanticOriginalityVerified: false,
    causalAlignmentSemanticallyVerified: false,
    sourceBriefRankIsCreativeAuthority: false,
    transferIsCreativeAuthority: false,
    creativeDirectionSelected: false,
    productionApproved: false
  };
}

function hypothesisBindingFingerprint(binding = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-transfer-hypothesis-binding@1',
    briefSnapshotFingerprint: text(binding.briefSnapshotFingerprint),
    retrievalSnapshotFingerprint: text(binding.retrievalSnapshotFingerprint),
    projectId: text(binding.projectId),
    targetDomain: text(binding.targetDomain),
    briefProvenanceReceiptFingerprint: text(binding.briefProvenanceReceiptFingerprint),
    sourceBriefProvenanceReady: binding.sourceBriefProvenanceReady === true
  });
}

function buildHypothesisBinding(brief = {}) {
  const binding = {
    schema: 'ai-studio-os/creative-transfer-hypothesis-binding@1',
    briefSnapshotFingerprint: text(brief.snapshotFingerprint),
    retrievalSnapshotFingerprint: text(brief?.sourceBinding?.retrievalSnapshotFingerprint),
    projectId: text(brief.projectId),
    targetDomain: text(brief?.target?.domain),
    briefProvenanceReceiptFingerprint: fingerprintCreativeValue(brief?.provenanceReceipt ?? {}),
    sourceBriefProvenanceReady: brief?.provenanceReady === true
  };
  return { ...binding, bindingFingerprint: hypothesisBindingFingerprint(binding) };
}

function evidenceById(brief = {}) {
  const all = [...(Array.isArray(brief.primaryEvidence) ? brief.primaryEvidence : []), ...(Array.isArray(brief.conflictEvidence) ? brief.conflictEvidence : [])];
  return new Map(all.map((item) => [text(item.knowledgeId), evidenceContract(item)]));
}

function sourcePrinciplesFor(ids, byId) {
  return ids.map((knowledgeId) => {
    const evidence = byId.get(knowledgeId) ?? {};
    const principles = evidence.transferablePrinciples?.length ? evidence.transferablePrinciples : [evidence.definition].filter(Boolean);
    return { knowledgeId, principles: list(principles) };
  });
}

function requirementsFor(ids, byId) {
  const selected = ids.map((id) => byId.get(id)).filter(Boolean);
  return {
    requiredStripSignatures: mergeEvidenceLists(selected, 'mustStrip'),
    copyProbeSignatures: sortedList([
      ...selected.flatMap((item) => item.surfaceSignature ?? []),
      ...selected.flatMap((item) => item.mustStrip ?? [])
    ]),
    requiredAdaptationRules: mergeEvidenceLists(selected, 'adaptationRules'),
    requiredCopyRisks: mergeEvidenceLists(selected, 'copyRisks'),
    requiredVisibleCounterevidenceIds: sortedList(selected.flatMap((item) => item.visibleConflictIds ?? [])),
    sourceHasWithheldCounterevidence: selected.some((item) => item.withheldConflictPresent === true)
  };
}

function candidateCorpus(value = {}) {
  return [
    value.transferClaim,
    value.causalBridge,
    value.targetConsequence,
    ...(Array.isArray(value.adaptationActions) ? value.adaptationActions : [])
  ].map(text).filter(Boolean).join(' ');
}

function copyAssessment(value, requirements) {
  const corpus = candidateCorpus(value);
  return {
    ...requirements,
    exactSurfaceCopyHits: requirements.copyProbeSignatures.filter((signature) => includesNormalizedPhrase(corpus, signature)).sort(compareText)
  };
}

function hypothesisFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-transfer-hypothesis@1',
    briefBindingFingerprint: text(value?.briefBinding?.bindingFingerprint),
    sourceKnowledgeIds: sortedList(value.sourceKnowledgeIds),
    sourcePrinciples: (Array.isArray(value.sourcePrinciples) ? value.sourcePrinciples : []).map((item) => ({ knowledgeId: text(item?.knowledgeId), principles: list(item?.principles) })),
    projectTruthRefs: sortedList(value.projectTruthRefs),
    counterevidenceKnowledgeIds: sortedList(value.counterevidenceKnowledgeIds),
    hiddenCounterevidenceAcknowledged: value.hiddenCounterevidenceAcknowledged === true,
    transferClaim: text(value.transferClaim),
    causalBridge: text(value.causalBridge),
    targetConsequence: text(value.targetConsequence),
    adaptationActions: list(value.adaptationActions),
    strippedSurfaceSignatures: sortedList(value.strippedSurfaceSignatures),
    adaptationRuleResponses: (Array.isArray(value.adaptationRuleResponses) ? value.adaptationRuleResponses : []).map(normalizeResponse),
    copyRiskMitigations: (Array.isArray(value.copyRiskMitigations) ? value.copyRiskMitigations : []).map(normalizeRiskMitigation),
    uncertainty: text(value.uncertainty),
    falsifier: text(value.falsifier),
    copyFirewallAssessment: value.copyFirewallAssessment
  });
}

function hypothesisReceipt(hypothesis, briefProvenanceReview) {
  return {
    schema: 'ai-studio-os/creative-transfer-hypothesis-provenance-receipt@1',
    hypothesisSnapshotFingerprint: text(hypothesis?.snapshotFingerprint),
    briefSnapshotFingerprint: text(briefProvenanceReview?.sourceReceipt?.briefSnapshotFingerprint),
    retrievalSnapshotFingerprint: text(briefProvenanceReview?.sourceReceipt?.retrievalSnapshotFingerprint),
    graphSnapshotFingerprint: text(briefProvenanceReview?.sourceReceipt?.graphSnapshotFingerprint),
    foundationSnapshotFingerprint: text(briefProvenanceReview?.sourceReceipt?.foundationSnapshotFingerprint),
    reviewReady: briefProvenanceReview?.reviewReady === true,
    truth: {
      receiptContainsSourceKnowledge: false,
      semanticOriginalityVerified: false,
      transferAuthorityGranted: false,
      productionApproved: false
    }
  };
}

export function reviewCreativeTransferHypothesis(hypothesis = {}, { brief } = {}) {
  const findings = [];
  const briefReview = reviewCreativeTransferBrief(brief ?? {});
  const byId = evidenceById(brief ?? {});
  const sourceKnowledgeIds = sortedList(hypothesis.sourceKnowledgeIds);
  const projectTruthRefs = sortedList(hypothesis.projectTruthRefs);
  const counterevidenceKnowledgeIds = sortedList(hypothesis.counterevidenceKnowledgeIds);
  const sourcePrinciples = sourcePrinciplesFor(sourceKnowledgeIds, byId);
  const requirements = requirementsFor(sourceKnowledgeIds, byId);
  const expectedAssessment = copyAssessment(hypothesis, requirements);
  const computedFingerprint = hypothesisFingerprint({ ...hypothesis, sourceKnowledgeIds, sourcePrinciples, projectTruthRefs, counterevidenceKnowledgeIds, copyFirewallAssessment: expectedAssessment });

  if (hypothesis?.schema !== 'ai-studio-os/creative-transfer-hypothesis@1') findings.push(finding('blocker', 'creative-transfer-hypothesis-schema-invalid', 'Creative Transfer Hypothesis requires creative-transfer-hypothesis@1.'));
  if (hypothesis?.stage !== 'creative-transfer-hypothesis') findings.push(finding('blocker', 'creative-transfer-hypothesis-stage-invalid', 'Creative Transfer Hypothesis requires the canonical hypothesis stage.'));
  const unknownTop = unknownKeys(hypothesis, HYPOTHESIS_KEYS);
  if (unknownTop.length) findings.push(finding('blocker', 'creative-transfer-hypothesis-shape-invalid', 'Transfer Hypothesis may contain only canonical artifact and derived review fields.', { unknownKeys: unknownTop }));
  if (!briefReview.reviewReady) findings.push(finding('blocker', 'creative-transfer-hypothesis-brief-not-ready', 'Transfer Hypothesis requires a structurally review-ready Transfer Brief.', { findingCodes: briefReview.findings.map((item) => item.code) }));
  if (brief?.provenanceReady !== true) findings.push(finding('blocker', 'creative-transfer-hypothesis-brief-provenance-not-ready', 'Transfer Hypothesis cannot use a brief whose source provenance is not ready.'));

  const binding = hypothesis?.briefBinding && typeof hypothesis.briefBinding === 'object' ? hypothesis.briefBinding : {};
  const bindingUnknown = unknownKeys(binding, HYPOTHESIS_BINDING_KEYS);
  const expectedBinding = buildHypothesisBinding(brief ?? {});
  if (bindingUnknown.length || !sameValue(binding, expectedBinding)) findings.push(finding('blocker', 'creative-transfer-hypothesis-binding-drift', 'Transfer Hypothesis must bind the exact source brief and its compact provenance receipt.', { unknownKeys: bindingUnknown }));
  if (text(binding?.bindingFingerprint) !== hypothesisBindingFingerprint(binding)) findings.push(finding('blocker', 'creative-transfer-hypothesis-binding-fingerprint-drift', 'Transfer Hypothesis binding fingerprint must match its exact compact receipt.'));

  if (!sourceKnowledgeIds.length) findings.push(finding('blocker', 'creative-transfer-source-evidence-missing', 'Transfer Hypothesis requires at least one explicit source knowledge item.'));
  const unknownSourceIds = sourceKnowledgeIds.filter((id) => !byId.has(id));
  if (unknownSourceIds.length) findings.push(finding('blocker', 'creative-transfer-source-evidence-invalid', 'Transfer Hypothesis may cite only evidence present in its bound project-safe brief.', { unknownSourceIds }));
  if (!sameValue(hypothesis?.sourceKnowledgeIds ?? [], sourceKnowledgeIds)) findings.push(finding('blocker', 'creative-transfer-source-id-order-drift', 'Transfer source IDs must use canonical locale-independent ordering.'));

  const rawSourcePrinciples = Array.isArray(hypothesis.sourcePrinciples) ? hypothesis.sourcePrinciples : [];
  rawSourcePrinciples.forEach((raw, index) => {
    const unknown = unknownKeys(raw, SOURCE_PRINCIPLE_KEYS);
    if (unknown.length) findings.push(finding('blocker', 'creative-transfer-source-principle-shape-invalid', 'Source principle records may contain only knowledgeId and principles.', { index, unknownKeys: unknown }));
  });
  if (!sameValue(rawSourcePrinciples, sourcePrinciples)) findings.push(finding('blocker', 'creative-transfer-source-principle-drift', 'Transfer source principles are derived evidence and cannot be rewritten by the hypothesis.'));

  const truthIds = new Set((brief?.projectTruths ?? []).map((item) => text(item.id)));
  if (!projectTruthRefs.length) findings.push(finding('blocker', 'creative-transfer-project-grounding-missing', 'Transfer Hypothesis must cite at least one explicit project truth.'));
  const unknownTruthRefs = projectTruthRefs.filter((id) => !truthIds.has(id));
  if (unknownTruthRefs.length) findings.push(finding('blocker', 'creative-transfer-project-grounding-invalid', 'Transfer Hypothesis may cite only project truths present in its bound brief.', { unknownTruthRefs }));
  if (!sameValue(hypothesis?.projectTruthRefs ?? [], projectTruthRefs)) findings.push(finding('blocker', 'creative-transfer-project-truth-ref-order-drift', 'Project truth references must use canonical ordering.'));

  const selectedEvidence = sourceKnowledgeIds.map((id) => byId.get(id)).filter(Boolean);
  if (selectedEvidence.length && selectedEvidence.every((item) => item.sourceDomain === text(brief?.target?.domain))) findings.push(finding('blocker', 'creative-transfer-cross-domain-source-missing', 'Creative Transfer requires at least one source whose domain differs from the target domain; same-domain application is not treated as cross-domain transfer.'));

  const payloadEvidenceIds = new Set(byId.keys());
  const invalidCounterevidence = counterevidenceKnowledgeIds.filter((id) => !payloadEvidenceIds.has(id));
  if (invalidCounterevidence.length) findings.push(finding('blocker', 'creative-transfer-counterevidence-invalid', 'Counterevidence may reference only visible evidence present in the bound brief.', { invalidCounterevidence }));
  const missingCounterevidence = requirements.requiredVisibleCounterevidenceIds.filter((id) => !counterevidenceKnowledgeIds.includes(id));
  if (missingCounterevidence.length) findings.push(finding('blocker', 'creative-transfer-visible-counterevidence-omitted', 'Transfer cannot silently omit visible conflicts attached to the selected source evidence.', { missingCounterevidence }));
  if (!sameValue(hypothesis?.counterevidenceKnowledgeIds ?? [], counterevidenceKnowledgeIds)) findings.push(finding('blocker', 'creative-transfer-counterevidence-order-drift', 'Counterevidence IDs must use canonical ordering.'));
  if (requirements.sourceHasWithheldCounterevidence && hypothesis?.hiddenCounterevidenceAcknowledged !== true) findings.push(finding('blocker', 'creative-transfer-hidden-counterevidence-unacknowledged', 'Transfer must explicitly acknowledge when selected evidence has a withheld cross-scope conflict.'));

  if (!text(hypothesis.transferClaim)) findings.push(finding('major', 'creative-transfer-claim-missing', 'Transfer Hypothesis requires a concrete target-domain claim.'));
  if (!text(hypothesis.causalBridge)) findings.push(finding('blocker', 'creative-transfer-causal-bridge-missing', 'Transfer Hypothesis must explain how the source causal principle maps into the target domain.'));
  if (!text(hypothesis.targetConsequence)) findings.push(finding('major', 'creative-transfer-target-consequence-missing', 'Transfer Hypothesis should state the intended target-domain consequence.'));
  if (!list(hypothesis.adaptationActions).length) findings.push(finding('major', 'creative-transfer-adaptation-actions-missing', 'Transfer Hypothesis should specify project-grounded adaptation actions rather than only naming a source principle.'));
  if (!text(hypothesis.uncertainty)) findings.push(finding('major', 'creative-transfer-uncertainty-missing', 'Transfer Hypothesis must keep meaningful uncertainty explicit.'));
  if (!text(hypothesis.falsifier)) findings.push(finding('blocker', 'creative-transfer-falsifier-missing', 'Transfer Hypothesis requires an explicit falsifier or rejection condition.'));

  const stripped = sortedList(hypothesis.strippedSurfaceSignatures);
  const missingStrips = requirements.requiredStripSignatures.filter((rule) => !stripped.includes(rule));
  if (missingStrips.length) findings.push(finding('blocker', 'creative-transfer-required-strip-omitted', 'Transfer Hypothesis must explicitly acknowledge every source mustStrip rule used by selected evidence.', { missingStrips }));
  if (!sameValue(hypothesis?.strippedSurfaceSignatures ?? [], stripped)) findings.push(finding('blocker', 'creative-transfer-strip-order-drift', 'Stripped surface-signature list must use canonical ordering.'));

  const ruleResponses = (Array.isArray(hypothesis.adaptationRuleResponses) ? hypothesis.adaptationRuleResponses : []).map(normalizeResponse);
  const responseRuleSet = new Set(ruleResponses.filter((item) => item.action).map((item) => item.rule));
  const missingRuleResponses = requirements.requiredAdaptationRules.filter((rule) => !responseRuleSet.has(rule));
  if (missingRuleResponses.length) findings.push(finding('blocker', 'creative-transfer-adaptation-rule-unanswered', 'Every selected source adaptation rule requires an explicit target-domain response.', { missingRuleResponses }));
  if (!sameValue(hypothesis?.adaptationRuleResponses ?? [], ruleResponses)) findings.push(finding('blocker', 'creative-transfer-adaptation-response-contract-drift', 'Adaptation-rule responses must use the exact canonical rule/action contract.'));

  const riskMitigations = (Array.isArray(hypothesis.copyRiskMitigations) ? hypothesis.copyRiskMitigations : []).map(normalizeRiskMitigation);
  const mitigationRiskSet = new Set(riskMitigations.filter((item) => item.mitigation).map((item) => item.risk));
  const missingRiskMitigations = requirements.requiredCopyRisks.filter((risk) => !mitigationRiskSet.has(risk));
  if (missingRiskMitigations.length) findings.push(finding('blocker', 'creative-transfer-copy-risk-unmitigated', 'Every selected source copy risk requires an explicit mitigation.', { missingRiskMitigations }));
  if (!sameValue(hypothesis?.copyRiskMitigations ?? [], riskMitigations)) findings.push(finding('blocker', 'creative-transfer-copy-risk-contract-drift', 'Copy-risk mitigations must use the exact canonical risk/mitigation contract.'));

  const assessmentUnknown = unknownKeys(hypothesis?.copyFirewallAssessment, COPY_ASSESSMENT_KEYS);
  if (assessmentUnknown.length || !sameValue(hypothesis?.copyFirewallAssessment ?? {}, expectedAssessment)) findings.push(finding('blocker', 'creative-transfer-copy-firewall-assessment-drift', 'Copy-firewall assessment must be derived exactly from selected source evidence and target-facing hypothesis text.', { unknownKeys: assessmentUnknown }));
  if (expectedAssessment.exactSurfaceCopyHits.length) findings.push(finding('blocker', 'creative-transfer-exact-surface-copy-detected', 'Target-facing transfer text reproduces a selected source surface signature or mustStrip phrase.', { exactSurfaceCopyHits: expectedAssessment.exactSurfaceCopyHits }));

  if (text(hypothesis?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-transfer-hypothesis-fingerprint-mismatch', 'Transfer Hypothesis fingerprint must bind exact source evidence, project grounding, firewall and adaptation claim.', { expected: computedFingerprint, actual: hypothesis?.snapshotFingerprint ?? null }));
  if (!sameValue(hypothesis?.truth ?? {}, canonicalHypothesisTruth())) findings.push(finding('blocker', 'creative-transfer-hypothesis-truth-drift', 'Transfer Hypothesis truth boundary is fixed; structural validity does not prove semantic originality or creative selection.'));
  const claims = authorityClaims(hypothesis);
  if (claims.length) findings.push(finding('blocker', 'creative-transfer-hypothesis-authority-fabricated', 'Transfer Hypothesis cannot select Creative Direction, authorize technical planning or approve production.', { claims }));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const coreMajors = findings.filter((item) => item.severity === 'major');
  const expectedPass = coreBlockers.length === 0;
  const expectedReady = coreBlockers.length === 0 && coreMajors.length === 0;
  const expectedStatus = coreBlockers.length ? 'blocked' : coreMajors.length ? 'provisional' : 'ready-as-advisory-transfer-hypothesis';
  if (Object.hasOwn(hypothesis, 'pass') && hypothesis.pass !== expectedPass) findings.push(finding('blocker', 'creative-transfer-hypothesis-pass-claim-drift', 'Cached Transfer Hypothesis pass flag must match fresh review.'));
  if (Object.hasOwn(hypothesis, 'reviewReady') && hypothesis.reviewReady !== expectedReady) findings.push(finding('blocker', 'creative-transfer-hypothesis-ready-claim-drift', 'Cached Transfer Hypothesis reviewReady flag must match fresh review.'));
  if (Object.hasOwn(hypothesis, 'status') && hypothesis.status !== expectedStatus) findings.push(finding('blocker', 'creative-transfer-hypothesis-status-claim-drift', 'Cached Transfer Hypothesis status must match fresh review.', { expected: expectedStatus, actual: hypothesis.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-transfer-hypothesis-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-advisory-transfer-hypothesis',
    findings,
    computedFingerprint,
    truth: {
      projectGroundingRequired: true,
      visibleCounterevidenceRequired: true,
      surfaceCopyFirewallRequired: true,
      semanticOriginalityVerified: false,
      transferAuthorityGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeTransferHypothesis({
  brief,
  sourceKnowledgeIds = [],
  projectTruthRefs = [],
  counterevidenceKnowledgeIds = [],
  hiddenCounterevidenceAcknowledged = false,
  transferClaim,
  causalBridge,
  targetConsequence,
  adaptationActions = [],
  strippedSurfaceSignatures = [],
  adaptationRuleResponses = [],
  copyRiskMitigations = [],
  uncertainty,
  falsifier
} = {}) {
  const byId = evidenceById(brief ?? {});
  const normalizedSourceIds = sortedList(sourceKnowledgeIds);
  const sourcePrinciples = sourcePrinciplesFor(normalizedSourceIds, byId);
  const requirements = requirementsFor(normalizedSourceIds, byId);
  const hypothesis = {
    schema: 'ai-studio-os/creative-transfer-hypothesis@1',
    stage: 'creative-transfer-hypothesis',
    briefBinding: buildHypothesisBinding(brief ?? {}),
    sourceKnowledgeIds: normalizedSourceIds,
    sourcePrinciples,
    projectTruthRefs: sortedList(projectTruthRefs),
    counterevidenceKnowledgeIds: sortedList(counterevidenceKnowledgeIds),
    hiddenCounterevidenceAcknowledged: hiddenCounterevidenceAcknowledged === true,
    transferClaim: text(transferClaim),
    causalBridge: text(causalBridge),
    targetConsequence: text(targetConsequence),
    adaptationActions: list(adaptationActions),
    strippedSurfaceSignatures: sortedList(strippedSurfaceSignatures),
    adaptationRuleResponses: (Array.isArray(adaptationRuleResponses) ? adaptationRuleResponses : []).map(normalizeResponse),
    copyRiskMitigations: (Array.isArray(copyRiskMitigations) ? copyRiskMitigations : []).map(normalizeRiskMitigation),
    uncertainty: text(uncertainty),
    falsifier: text(falsifier),
    copyFirewallAssessment: null,
    truth: canonicalHypothesisTruth()
  };
  hypothesis.copyFirewallAssessment = copyAssessment(hypothesis, requirements);
  hypothesis.snapshotFingerprint = hypothesisFingerprint(hypothesis);
  const review = reviewCreativeTransferHypothesis(hypothesis, { brief });
  return {
    ...hypothesis,
    findings: review.findings,
    pass: review.pass,
    reviewReady: review.reviewReady,
    status: review.status
  };
}

export function reviewCreativeTransferHypothesisProvenance({ hypothesis, brief, retrieval, graph, foundation } = {}) {
  const findings = [];
  const briefProvenanceReview = reviewCreativeTransferBriefProvenance({ brief, retrieval, graph, foundation });
  const hypothesisReview = reviewCreativeTransferHypothesis(hypothesis ?? {}, { brief });
  if (!briefProvenanceReview.reviewReady) findings.push(finding('blocker', 'creative-transfer-hypothesis-provenance-brief-not-verified', 'Transfer Hypothesis provenance requires the bound Transfer Brief to be independently verified to its retrieval, Graph and Foundation.', { findingCodes: briefProvenanceReview.findings.map((item) => item.code) }));
  if (!hypothesisReview.reviewReady) findings.push(finding('blocker', 'creative-transfer-hypothesis-provenance-hypothesis-not-ready', 'Transfer Hypothesis must pass fresh structural review before provenance can be established.', { findingCodes: hypothesisReview.findings.map((item) => item.code) }));
  const expectedBinding = buildHypothesisBinding(brief ?? {});
  if (!sameValue(hypothesis?.briefBinding ?? {}, expectedBinding)) findings.push(finding('blocker', 'creative-transfer-hypothesis-provenance-binding-drift', 'Transfer Hypothesis must bind the exact independently supplied Transfer Brief.'));
  const expectedReceipt = hypothesisReceipt(hypothesis ?? {}, briefProvenanceReview);
  if (Object.hasOwn(hypothesis ?? {}, 'provenanceReceipt') && !sameValue(hypothesis.provenanceReceipt, expectedReceipt)) findings.push(finding('blocker', 'creative-transfer-hypothesis-provenance-receipt-drift', 'Attached hypothesis provenance receipt must equal the independently recomputed compact receipt.'));
  if (Object.hasOwn(hypothesis ?? {}, 'provenanceReady') && hypothesis.provenanceReady !== (briefProvenanceReview.reviewReady && hypothesisReview.reviewReady)) findings.push(finding('blocker', 'creative-transfer-hypothesis-provenance-ready-drift', 'Attached hypothesis provenanceReady flag must equal fresh independent verification.'));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-transfer-hypothesis-provenance-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'verified-transfer-hypothesis-provenance',
    findings,
    sourceReceipt: expectedReceipt,
    truth: {
      briefRetrievalGraphFoundationSuppliedSeparately: true,
      structuralTransferRecomputed: true,
      semanticOriginalityVerified: false,
      transferAuthorityGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeTransferHypothesisWithProvenance(input = {}) {
  const hypothesis = buildCreativeTransferHypothesis(input);
  const provenanceReview = reviewCreativeTransferHypothesisProvenance({
    hypothesis,
    brief: input.brief,
    retrieval: input.retrieval,
    graph: input.graph,
    foundation: input.foundation
  });
  const provenanceReady = hypothesis.reviewReady && provenanceReview.reviewReady;
  return {
    ...hypothesis,
    provenanceReceipt: provenanceReview.sourceReceipt,
    provenanceReady,
    truth: { ...hypothesis.truth, independentSourceProvenanceSatisfied: provenanceReady, productionApproved: false }
  };
}

export function creativeTransferBriefFingerprint(brief = {}) {
  return briefFingerprint(brief);
}

export function creativeTransferHypothesisFingerprint(hypothesis = {}) {
  return hypothesisFingerprint(hypothesis);
}
