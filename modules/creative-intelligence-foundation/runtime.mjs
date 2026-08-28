import { fingerprintCreativeValue } from './fingerprint.mjs';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function list(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function finiteConfidence(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : null;
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(text(value));
}

export const CREATIVE_KNOWLEDGE_KINDS = Object.freeze([
  'principle',
  'historical-precedent',
  'current-trend',
  'project-observation',
  'benchmark-learning',
  'human-preference',
  'uncertain-inference'
]);

export const CREATIVE_KNOWLEDGE_SCOPES = Object.freeze([
  'general',
  'project',
  'benchmark',
  'human'
]);

export const CREATIVE_RELATIONSHIP_TYPES = Object.freeze([
  'reinforces',
  'conflicts-with',
  'depends-on',
  'qualifies',
  'counterexample-to',
  'derived-from'
]);

export const CREATIVE_REASONING_MOVE_TYPES = Object.freeze([
  'causal',
  'analogy',
  'abstraction',
  'contradiction',
  'appropriateness',
  'genericity',
  'transfer',
  'synthesis',
  'critique'
]);

export const CREATIVE_INTELLIGENCE_CONSTITUTION = Object.freeze({
  knowledgeIsAuthority: false,
  referenceIsDirection: false,
  patternIsSolution: false,
  trendIsJustification: false,
  technologyIsConcept: false,
  criticScoreIsSelection: false
});

const KNOWLEDGE_KIND_SET = new Set(CREATIVE_KNOWLEDGE_KINDS);
const SCOPE_SET = new Set(CREATIVE_KNOWLEDGE_SCOPES);
const RELATIONSHIP_SET = new Set(CREATIVE_RELATIONSHIP_TYPES);
const REASONING_MOVE_SET = new Set(CREATIVE_REASONING_MOVE_TYPES);
const REFERENCE_LIKE_KINDS = new Set(['historical-precedent', 'current-trend']);
const PROJECT_GROUNDED_MOVE_TYPES = new Set([
  'analogy',
  'contradiction',
  'appropriateness',
  'genericity',
  'transfer',
  'synthesis'
]);

const AUTHORITY_CLAIM_KEYS = Object.freeze([
  'selected',
  'approved',
  'canonical',
  'authorityGranted',
  'humanApproved',
  'humanSelected',
  'creativeDirectionSelected',
  'creativeDirectionApproved',
  'productionApproved',
  'technicalPlanningAuthorized'
]);

const AUTHORITY_STATUS_VALUES = new Set([
  'approved',
  'selected',
  'canonical',
  'authoritative',
  'production-ready',
  'production-approved',
  'ready-for-production',
  'ready-for-technical-planning'
]);

const AUTHORITYISH_KEY = /(approv|authori|select|canonical|production|technicalplanning)/i;

function authorityClaims(object = {}) {
  const claims = [];
  for (const key of AUTHORITY_CLAIM_KEYS) {
    if (object?.[key] === true || object?.truth?.[key] === true) claims.push(key);
  }
  for (const [key, value] of Object.entries(object && typeof object === 'object' ? object : {})) {
    if (key !== 'truth' && value === true && AUTHORITYISH_KEY.test(key)) claims.push(key);
  }
  for (const [key, value] of Object.entries(object?.truth && typeof object.truth === 'object' ? object.truth : {})) {
    if (value === true && AUTHORITYISH_KEY.test(key)) claims.push(`truth.${key}`);
  }
  const status = text(object?.status).toLowerCase();
  if (AUTHORITY_STATUS_VALUES.has(status)) claims.push(`status:${status}`);
  return [...new Set(claims)];
}

function constitutionDiff(constitution = {}) {
  const expected = CREATIVE_INTELLIGENCE_CONSTITUTION;
  const actual = constitution && typeof constitution === 'object' ? constitution : {};
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  const missingKeys = expectedKeys.filter((key) => !Object.hasOwn(actual, key));
  const extraKeys = actualKeys.filter((key) => !Object.hasOwn(expected, key));
  const changedValues = expectedKeys
    .filter((key) => Object.hasOwn(actual, key) && actual[key] !== expected[key])
    .map((key) => ({ key, expected: expected[key], actual: actual[key] }));
  return {
    exact: missingKeys.length === 0 && extraKeys.length === 0 && changedValues.length === 0,
    missingKeys,
    extraKeys,
    changedValues
  };
}

function normalizeProvenance(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    sourceId: text(source.sourceId),
    sourceType: text(source.sourceType),
    sourceRef: text(source.sourceRef),
    capturedAt: text(source.capturedAt),
    author: text(source.author),
    notes: text(source.notes)
  };
}

function normalizeRelationship(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    type: text(source.type),
    targetId: text(source.targetId),
    rationale: text(source.rationale)
  };
}

function normalizeTransfer(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    transferablePrinciples: list(source.transferablePrinciples),
    surfaceSignature: list(source.surfaceSignature),
    mustStrip: list(source.mustStrip),
    adaptationRules: list(source.adaptationRules),
    copyRisks: list(source.copyRisks)
  };
}

function normalizeKnowledgeEntry(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    schema: 'ai-studio-os/creative-knowledge-entry@1',
    id: text(source.id),
    kind: text(source.kind),
    domain: text(source.domain),
    title: text(source.title),
    definition: text(source.definition ?? source.statement),
    causalRationale: text(source.causalRationale ?? source.whyItWorks),
    perceptualEffects: list(source.perceptualEffects),
    worksWhen: list(source.worksWhen),
    failsWhen: list(source.failsWhen),
    creativeVariables: list(source.creativeVariables),
    crossDomainApplications: list(source.crossDomainApplications),
    failureModes: list(source.failureModes),
    counterexamples: list(source.counterexamples),
    diagnostics: list(source.diagnostics),
    relationships: (Array.isArray(source.relationships) ? source.relationships : []).map(normalizeRelationship),
    provenance: normalizeProvenance(source.provenance),
    confidence: finiteConfidence(source.confidence),
    confidenceBasis: text(source.confidenceBasis),
    scope: text(source.scope),
    projectId: text(source.projectId) || null,
    transferability: text(source.transferability),
    transfer: normalizeTransfer(source.transfer),
    notes: list(source.notes),
    truth: {
      knowledgeOnly: true,
      authorityGranted: false,
      creativeDirectionSelected: false,
      humanApprovalRecorded: false,
      productionApproved: false
    }
  };
}

function knowledgeLibraryFingerprint(entries) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-library@1',
    entries
  });
}

function foundationFingerprint(constitution, libraryFingerprint) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-intelligence-foundation@1',
    constitution,
    knowledgeLibraryFingerprint: libraryFingerprint
  });
}

function foundationBindingFingerprint(binding) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-intelligence-foundation-binding@1',
    foundationSnapshotFingerprint: text(binding?.foundationSnapshotFingerprint),
    knowledgeLibraryFingerprint: text(binding?.knowledgeLibraryFingerprint),
    constitution: binding?.constitution && typeof binding.constitution === 'object' ? binding.constitution : {},
    sourceFoundationReviewReady: binding?.sourceFoundationReviewReady === true
  });
}

function normalizeContextEntryRef(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    knowledgeId: text(source.knowledgeId),
    role: text(source.role),
    relevance: text(source.relevance),
    projectFit: text(source.projectFit),
    caution: text(source.caution)
  };
}

function normalizeScopeRejection(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    knowledgeId: text(source.knowledgeId),
    reason: text(source.reason)
  };
}

function contextFingerprint({ projectId, purpose, projectTruths, constraints, entryRefs, selectedEvidence, scopeRejections, foundationBinding }) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-intelligence-context@1',
    projectId,
    purpose,
    projectTruths,
    constraints,
    entryRefs,
    selectedEvidence,
    scopeRejections,
    foundationBindingFingerprint: foundationBindingFingerprint(foundationBinding)
  });
}

function reasoningFrameFingerprint({ projectId, moves }, contextSnapshotFingerprint) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-reasoning-frame@1',
    projectId,
    moves,
    contextSnapshotFingerprint
  });
}

function reviewNormalizedKnowledgeEntry(entry = {}, claimed = entry) {
  const findings = [];

  if (claimed?.schema !== 'ai-studio-os/creative-knowledge-entry@1') {
    findings.push(finding('blocker', 'creative-knowledge-schema-invalid', 'Creative knowledge must use creative-knowledge-entry@1.', { schema: claimed?.schema ?? null }));
  }
  if (!text(entry.id)) findings.push(finding('blocker', 'creative-knowledge-id-missing', 'Creative knowledge requires a caller-authored stable ID; review does not invent provenance identity.'));
  if (!KNOWLEDGE_KIND_SET.has(entry.kind)) findings.push(finding('blocker', 'creative-knowledge-kind-invalid', 'Creative knowledge requires a supported evidence kind.', { kind: entry.kind || null }));
  if (!text(entry.domain)) findings.push(finding('major', 'creative-knowledge-domain-missing', 'Creative knowledge should name the domain in which the principle or evidence applies.'));
  if (!text(entry.definition)) findings.push(finding('major', 'creative-knowledge-definition-missing', 'Creative knowledge requires a clear definition or claim.'));
  if (!text(entry.causalRationale)) findings.push(finding('major', 'creative-knowledge-causal-rationale-missing', 'Creative knowledge must explain why the principle or observation works rather than storing a label alone.'));
  if (!entry.worksWhen.length) findings.push(finding('major', 'creative-knowledge-conditions-missing', 'Creative knowledge must state conditions where it is useful.'));
  if (!entry.failsWhen.length) findings.push(finding('major', 'creative-knowledge-failure-conditions-missing', 'Creative knowledge must state conditions where it fails or becomes inappropriate.'));
  if (!entry.failureModes.length) findings.push(finding('major', 'creative-knowledge-failure-modes-missing', 'Creative knowledge must include at least one failure mode.'));
  if (!entry.counterexamples.length) findings.push(finding('major', 'creative-knowledge-counterexample-missing', 'Creative knowledge must include a counterexample or boundary case.'));
  if (!entry.diagnostics.length) findings.push(finding('major', 'creative-knowledge-diagnostics-missing', 'Creative knowledge needs a way to diagnose whether it applies.'));
  if (!SCOPE_SET.has(entry.scope)) findings.push(finding('blocker', 'creative-knowledge-scope-invalid', 'Creative knowledge requires a supported scope.', { scope: entry.scope || null }));
  if (entry.scope === 'project' && !text(entry.projectId)) findings.push(finding('blocker', 'creative-knowledge-project-scope-unbound', 'Project-scoped knowledge must be bound to a project identity.'));
  if (entry.scope !== 'project' && text(entry.projectId)) findings.push(finding('major', 'creative-knowledge-project-binding-ambiguous', 'Only project-scoped knowledge should carry project identity.'));
  if (entry.confidence === null) findings.push(finding('blocker', 'creative-knowledge-confidence-invalid', 'Creative knowledge confidence must be an explicit finite number from 0 to 1.'));
  if (!text(entry.confidenceBasis)) findings.push(finding('major', 'creative-knowledge-confidence-basis-missing', 'Confidence requires an explicit evidence basis.'));
  if (!text(entry.provenance.sourceId) || !text(entry.provenance.sourceType)) findings.push(finding('blocker', 'creative-knowledge-provenance-missing', 'Creative knowledge requires source identity and source type.'));
  if (REFERENCE_LIKE_KINDS.has(entry.kind) && !text(entry.provenance.sourceRef)) findings.push(finding('major', 'creative-reference-source-ref-missing', 'Historical precedents and current trends should retain a concrete source reference.'));
  if (!text(entry.transferability)) findings.push(finding('major', 'creative-knowledge-transferability-missing', 'Creative knowledge should state how broadly it can transfer.'));

  for (const relationship of entry.relationships) {
    if (!RELATIONSHIP_SET.has(relationship.type) || !relationship.targetId || !relationship.rationale) {
      findings.push(finding('major', 'creative-knowledge-relationship-invalid', 'Knowledge relationships require a supported type, target ID and rationale.', { relationship }));
    }
  }

  if (REFERENCE_LIKE_KINDS.has(entry.kind)) {
    if (!entry.transfer.transferablePrinciples.length) findings.push(finding('major', 'creative-reference-transfer-principle-missing', 'References and trends must be decomposed into transferable principles rather than stored as surface style.'));
    if (!entry.transfer.surfaceSignature.length) findings.push(finding('major', 'creative-reference-surface-signature-missing', 'References and trends must identify their surface signature so it can be separated from transferable logic.'));
    if (!entry.transfer.mustStrip.length) findings.push(finding('major', 'creative-reference-strip-rule-missing', 'References and trends must state which surface signatures may not be copied into a new project.'));
    if (!entry.transfer.copyRisks.length) findings.push(finding('major', 'creative-reference-copy-risk-missing', 'References and trends must identify imitation risk.'));
  }

  const claims = authorityClaims(claimed);
  if (claims.length) findings.push(finding('blocker', 'creative-knowledge-authority-fabricated', 'Knowledge cannot declare creative or production authority.', { claims }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-knowledge-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'usable-as-creative-evidence',
    normalizedEntry: entry,
    findings,
    truth: {
      knowledgeIsAuthority: false,
      provenanceRequired: true,
      stableIdentityRequired: true,
      confidenceQualified: entry.confidence !== null,
      counterexamplesRequired: true,
      failureConditionsRequired: true,
      referenceSurfaceCopyBlocked: true,
      cachedAuthorityClaimsIgnored: true,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function reviewCreativeKnowledgeEntry(entry = {}) {
  return reviewNormalizedKnowledgeEntry(normalizeKnowledgeEntry(entry), entry);
}

export function buildCreativeKnowledgeEntry(input = {}) {
  const entry = normalizeKnowledgeEntry(input);
  const review = reviewNormalizedKnowledgeEntry(entry, entry);
  return {
    ...entry,
    review,
    pass: review.pass,
    reviewReady: review.reviewReady,
    status: review.status,
    findings: review.findings,
    truth: { ...entry.truth, ...review.truth }
  };
}

export function reviewCreativeKnowledgeLibrary(library = {}) {
  const findings = [];
  const rawEntries = Array.isArray(library?.entries) ? library.entries : [];
  const entries = rawEntries.map(normalizeKnowledgeEntry);
  const ids = entries.map((entry) => entry.id);
  const computedFingerprint = knowledgeLibraryFingerprint(entries);

  if (library?.schema !== 'ai-studio-os/creative-knowledge-library@1') findings.push(finding('blocker', 'creative-knowledge-library-schema-invalid', 'Creative knowledge library requires creative-knowledge-library@1.'));
  if (!entries.length) findings.push(finding('major', 'creative-knowledge-library-empty', 'Creative Intelligence requires at least one qualified knowledge entry.'));
  if (ids.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-library-entry-id-missing', 'Every library entry requires a stable ID.'));
  if (new Set(ids).size !== ids.length) findings.push(finding('blocker', 'creative-knowledge-library-id-duplicate', 'Creative knowledge IDs must be unique.', { ids }));
  if (text(library?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-knowledge-library-fingerprint-mismatch', 'Knowledge library snapshot fingerprint must bind the exact normalized entry contracts.', { expected: computedFingerprint, actual: library?.snapshotFingerprint ?? null }));

  entries.forEach((entry, index) => {
    const review = reviewNormalizedKnowledgeEntry(entry, rawEntries[index] ?? entry);
    if (!review.reviewReady) {
      const severity = review.pass ? 'major' : 'blocker';
      findings.push(finding(severity, review.pass ? 'creative-knowledge-library-entry-not-ready' : 'creative-knowledge-library-entry-blocked', 'Every active knowledge entry must pass its own fresh review before the library can be used as a reasoning substrate.', { entryId: entry.id, findingCodes: review.findings.map((item) => item.code) }));
    }
    for (const relationship of entry.relationships) {
      if (relationship.targetId && !ids.includes(relationship.targetId)) findings.push(finding('blocker', 'creative-knowledge-relationship-target-missing', 'Knowledge relationship target must exist in the same library snapshot.', { entryId: entry.id, targetId: relationship.targetId }));
      if (relationship.targetId === entry.id) findings.push(finding('major', 'creative-knowledge-self-relationship', 'Knowledge relationships should not point back to the same entry.', { entryId: entry.id, type: relationship.type }));
    }
  });

  const claims = authorityClaims(library);
  if (claims.length) findings.push(finding('blocker', 'creative-knowledge-library-authority-fabricated', 'A knowledge library cannot become creative authority.', { claims }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-knowledge-library-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-reasoning-evidence',
    entries,
    computedFingerprint,
    findings,
    truth: {
      knowledgeIsAuthority: false,
      exactSnapshotBound: text(library?.snapshotFingerprint) === computedFingerprint,
      allRelationshipsResolve: blockers.every((item) => item.code !== 'creative-knowledge-relationship-target-missing'),
      projectScopesMayCoexistInLibrary: true,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeKnowledgeLibrary({ entries = [] } = {}) {
  const normalizedEntries = (Array.isArray(entries) ? entries : []).map(normalizeKnowledgeEntry);
  const library = {
    schema: 'ai-studio-os/creative-knowledge-library@1',
    stage: 'creative-knowledge-library',
    entries: normalizedEntries,
    snapshotFingerprint: knowledgeLibraryFingerprint(normalizedEntries),
    truth: {
      knowledgeOnly: true,
      authorityGranted: false,
      productionApproved: false
    }
  };
  const review = reviewCreativeKnowledgeLibrary(library);
  return { ...library, ...review, entries: review.entries, truth: { ...library.truth, ...review.truth } };
}

export function reviewCreativeIntelligenceFoundation(foundation = {}) {
  const findings = [];
  const libraryReview = reviewCreativeKnowledgeLibrary(foundation?.knowledgeLibrary ?? {});
  const constitution = foundation?.constitution && typeof foundation.constitution === 'object'
    ? foundation.constitution
    : {};
  const constitutionReview = constitutionDiff(constitution);
  const computedFingerprint = foundationFingerprint(constitution, libraryReview.computedFingerprint);

  if (foundation?.schema !== 'ai-studio-os/creative-intelligence-foundation@1') findings.push(finding('blocker', 'creative-intelligence-foundation-schema-invalid', 'Creative Intelligence Foundation requires creative-intelligence-foundation@1.'));
  if (!libraryReview.reviewReady) findings.push(finding('blocker', 'creative-intelligence-foundation-library-not-ready', 'Foundation requires a review-ready knowledge library.', { findingCodes: libraryReview.findings.map((item) => item.code) }));
  if (text(foundation?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-intelligence-foundation-fingerprint-mismatch', 'Foundation snapshot fingerprint must bind the exact constitution and knowledge-library snapshot.', { expected: computedFingerprint, actual: foundation?.snapshotFingerprint ?? null }));
  if (!constitutionReview.exact) findings.push(finding('blocker', 'creative-intelligence-constitution-drift', 'Creative Intelligence constitution must match the canonical key set and values exactly; callers cannot add permissive rules.', constitutionReview));

  const claims = authorityClaims(foundation);
  if (claims.length) findings.push(finding('blocker', 'creative-intelligence-foundation-authority-fabricated', 'Creative Intelligence Foundation is a reasoning substrate and cannot declare creative or production authority.', { claims }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-intelligence-foundation-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-as-shared-reasoning-substrate',
    computedFingerprint,
    findings,
    libraryReview,
    truth: {
      knowledgeIsAuthority: false,
      exactSnapshotBound: text(foundation?.snapshotFingerprint) === computedFingerprint,
      authorityBoundariesConstitutional: constitutionReview.exact,
      foundationIsSharedSubstrate: true,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeIntelligenceFoundation({ entries = [] } = {}) {
  const knowledgeLibrary = buildCreativeKnowledgeLibrary({ entries });
  const constitution = { ...CREATIVE_INTELLIGENCE_CONSTITUTION };
  const foundation = {
    schema: 'ai-studio-os/creative-intelligence-foundation@1',
    stage: 'creative-intelligence-foundation',
    constitution,
    knowledgeLibrary,
    snapshotFingerprint: foundationFingerprint(constitution, knowledgeLibrary.snapshotFingerprint),
    truth: {
      knowledgeOnly: true,
      authorityGranted: false,
      creativeDirectionSelected: false,
      productionApproved: false
    }
  };
  const review = reviewCreativeIntelligenceFoundation(foundation);
  return {
    ...foundation,
    review,
    pass: review.pass,
    reviewReady: review.reviewReady,
    status: review.status,
    findings: review.findings,
    truth: { ...foundation.truth, ...review.truth }
  };
}

function buildFoundationBinding(foundationReview) {
  const binding = {
    schema: 'ai-studio-os/creative-intelligence-foundation-binding@1',
    foundationSnapshotFingerprint: foundationReview.computedFingerprint,
    knowledgeLibraryFingerprint: foundationReview.libraryReview?.computedFingerprint ?? '',
    constitution: { ...CREATIVE_INTELLIGENCE_CONSTITUTION },
    sourceFoundationReviewReady: foundationReview.reviewReady === true
  };
  return {
    ...binding,
    bindingFingerprint: foundationBindingFingerprint(binding)
  };
}

function reviewFoundationBinding(binding = {}) {
  const findings = [];
  const normalizedConstitution = binding?.constitution && typeof binding.constitution === 'object'
    ? binding.constitution
    : {};
  const constitutionReview = constitutionDiff(normalizedConstitution);
  const computedFingerprint = foundationBindingFingerprint(binding);

  if (binding?.schema !== 'ai-studio-os/creative-intelligence-foundation-binding@1') findings.push(finding('blocker', 'creative-intelligence-foundation-binding-schema-invalid', 'Project reasoning requires a canonical Foundation binding.'));
  if (!isSha256(binding?.foundationSnapshotFingerprint) || !isSha256(binding?.knowledgeLibraryFingerprint)) findings.push(finding('blocker', 'creative-intelligence-foundation-binding-fingerprint-invalid', 'Foundation binding requires SHA-256 fingerprints for the source Foundation and knowledge library.'));
  if (binding?.sourceFoundationReviewReady !== true) findings.push(finding('blocker', 'creative-intelligence-foundation-binding-source-not-ready', 'A project context cannot be authored from a Foundation that failed its source review.'));
  if (text(binding?.bindingFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-intelligence-foundation-binding-drift', 'Foundation binding fingerprint must match the exact source fingerprints and constitutional boundary.', { expected: computedFingerprint, actual: binding?.bindingFingerprint ?? null }));
  if (!constitutionReview.exact) findings.push(finding('blocker', 'creative-intelligence-foundation-binding-constitution-drift', 'Project context Foundation binding must preserve the exact canonical constitution without extra permissive keys.', constitutionReview));
  const claims = authorityClaims(binding);
  if (claims.length) findings.push(finding('blocker', 'creative-intelligence-foundation-binding-authority-fabricated', 'A Foundation binding carries provenance, not creative authority.', { claims }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    computedFingerprint,
    findings,
    truth: {
      bindingIsProvenanceNotAuthority: true,
      exactConstitutionBound: constitutionReview.exact,
      fullSharedFoundationExcludedFromProjectPayload: true
    }
  };
}

export function reviewCreativeIntelligenceContext(context = {}) {
  const findings = [];
  const projectId = text(context?.projectId);
  const purpose = text(context?.purpose);
  const projectTruths = list(context?.projectTruths);
  const constraints = list(context?.constraints);
  const entryRefs = (Array.isArray(context?.entryRefs) ? context.entryRefs : []).map(normalizeContextEntryRef);
  const selectedEvidenceRaw = Array.isArray(context?.selectedEvidence) ? context.selectedEvidence : [];
  const selectedEvidence = selectedEvidenceRaw.map(normalizeKnowledgeEntry);
  const scopeRejections = (Array.isArray(context?.scopeRejections) ? context.scopeRejections : []).map(normalizeScopeRejection);
  const entryIds = entryRefs.map((ref) => ref.knowledgeId);
  const selectedIds = selectedEvidence.map((entry) => entry.id);
  const selectedById = new Map(selectedEvidence.map((entry) => [entry.id, entry]));
  const bindingReview = reviewFoundationBinding(context?.foundationBinding ?? {});
  const normalizedForFingerprint = {
    projectId,
    purpose,
    projectTruths,
    constraints,
    entryRefs,
    selectedEvidence,
    scopeRejections,
    foundationBinding: context?.foundationBinding ?? {}
  };
  const computedFingerprint = contextFingerprint(normalizedForFingerprint);

  if (context?.schema !== 'ai-studio-os/creative-intelligence-context@1') findings.push(finding('blocker', 'creative-intelligence-context-schema-invalid', 'Creative Intelligence context requires creative-intelligence-context@1.'));
  if (!projectId) findings.push(finding('blocker', 'creative-intelligence-project-missing', 'Creative reasoning must be bound to a project.'));
  if (!purpose) findings.push(finding('major', 'creative-intelligence-purpose-missing', 'Creative reasoning requires an explicit purpose or decision question.'));
  if (!projectTruths.length) findings.push(finding('major', 'creative-intelligence-project-truth-missing', 'Creative reasoning must include project truth so retrieved knowledge cannot become the project itself.'));
  if (!bindingReview.reviewReady) findings.push(finding('blocker', 'creative-intelligence-foundation-binding-not-ready', 'Creative reasoning requires a valid source-Foundation binding.', { findingCodes: bindingReview.findings.map((item) => item.code) }));
  if (!entryRefs.length) findings.push(finding('major', 'creative-intelligence-evidence-selection-missing', 'Creative reasoning should explicitly select which knowledge is relevant to the current purpose.'));
  if (entryIds.some((id) => !id)) findings.push(finding('blocker', 'creative-intelligence-evidence-ref-id-missing', 'Every selected evidence reference requires a knowledge ID.'));
  if (new Set(entryIds).size !== entryIds.length) findings.push(finding('blocker', 'creative-intelligence-evidence-ref-duplicate', 'A project context should select each knowledge entry at most once.', { entryIds }));
  if (selectedIds.some((id) => !id)) findings.push(finding('blocker', 'creative-intelligence-selected-evidence-id-missing', 'Every selected evidence snapshot requires a stable knowledge ID.'));
  if (new Set(selectedIds).size !== selectedIds.length) findings.push(finding('blocker', 'creative-intelligence-selected-evidence-duplicate', 'Selected evidence snapshot cannot duplicate knowledge contracts.', { selectedIds }));
  if (text(context?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-intelligence-context-fingerprint-mismatch', 'Creative Intelligence context fingerprint must bind project truth, purpose, constraints, selected evidence and the exact Foundation binding.', { expected: computedFingerprint, actual: context?.snapshotFingerprint ?? null }));

  selectedEvidence.forEach((entry, index) => {
    const review = reviewNormalizedKnowledgeEntry(entry, selectedEvidenceRaw[index] ?? entry);
    if (!review.reviewReady) findings.push(finding(review.pass ? 'major' : 'blocker', 'creative-intelligence-selected-evidence-not-ready', 'Every evidence item entering a project reasoning payload must pass fresh knowledge review.', { knowledgeId: entry.id, findingCodes: review.findings.map((item) => item.code) }));
    if (entry.scope === 'project' && entry.projectId !== projectId) findings.push(finding('blocker', 'creative-intelligence-project-knowledge-drift', 'Project-scoped evidence cannot enter a different project reasoning payload.', { knowledgeId: entry.id }));
  });

  for (const ref of entryRefs) {
    const entry = selectedById.get(ref.knowledgeId);
    const rejected = scopeRejections.find((item) => item.knowledgeId === ref.knowledgeId);
    if (rejected?.reason === 'project-scope-mismatch') findings.push(finding('blocker', 'creative-intelligence-project-knowledge-drift', 'Project-scoped knowledge was rejected before payload construction because it belongs to another project.', { knowledgeId: ref.knowledgeId }));
    if (!entry) findings.push(finding('blocker', 'creative-intelligence-evidence-snapshot-missing', 'Every selected knowledge reference must resolve to an exact evidence snapshot inside the isolated project payload.', { knowledgeId: ref.knowledgeId }));
    if (!ref.role || !ref.relevance || !ref.projectFit) findings.push(finding('major', 'creative-intelligence-evidence-ref-thin', 'Each selected knowledge entry needs a role, relevance and project-fit explanation.', { knowledgeId: ref.knowledgeId }));
  }

  for (const entry of selectedEvidence) {
    if (!entryIds.includes(entry.id)) findings.push(finding('blocker', 'creative-intelligence-unreferenced-evidence-injected', 'Project payload cannot contain evidence that was not explicitly selected by an entry reference.', { knowledgeId: entry.id }));
  }

  const claims = authorityClaims(context);
  if (claims.length) findings.push(finding('blocker', 'creative-intelligence-context-authority-fabricated', 'Creative Intelligence context is evidence substrate, not creative authority.', { claims }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-intelligence-context-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-creative-reasoning',
    computedFingerprint,
    findings,
    bindingReview,
    normalized: { projectId, purpose, projectTruths, constraints, entryRefs, selectedEvidence, scopeRejections },
    truth: {
      knowledgeIsAuthority: false,
      exactSnapshotBound: text(context?.snapshotFingerprint) === computedFingerprint,
      projectTruthDominatesRetrievedKnowledge: true,
      projectPayloadContainsSelectedEvidenceOnly: true,
      fullSharedFoundationExcludedFromProjectPayload: true,
      projectScopedKnowledgeCannotCrossProjects: true,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeIntelligenceContext({
  projectId,
  purpose,
  projectTruths = [],
  constraints = [],
  foundation,
  entryRefs = []
} = {}) {
  const normalizedProjectId = text(projectId) || null;
  const normalizedRefs = (Array.isArray(entryRefs) ? entryRefs : []).map(normalizeContextEntryRef);
  const foundationReview = reviewCreativeIntelligenceFoundation(foundation ?? {});
  const sourceEntries = foundationReview.libraryReview?.entries ?? [];
  const sourceById = new Map(sourceEntries.map((entry) => [entry.id, entry]));
  const selectedEvidence = [];
  const scopeRejections = [];

  for (const ref of normalizedRefs) {
    const entry = sourceById.get(ref.knowledgeId);
    if (!entry) continue;
    if (entry.scope === 'project' && entry.projectId !== normalizedProjectId) {
      scopeRejections.push({ knowledgeId: ref.knowledgeId, reason: 'project-scope-mismatch' });
      continue;
    }
    selectedEvidence.push(normalizeKnowledgeEntry(entry));
  }

  const foundationBinding = buildFoundationBinding(foundationReview);
  const normalized = {
    projectId: normalizedProjectId,
    purpose: text(purpose),
    projectTruths: list(projectTruths),
    constraints: list(constraints),
    entryRefs: normalizedRefs,
    selectedEvidence,
    scopeRejections,
    foundationBinding
  };
  const context = {
    schema: 'ai-studio-os/creative-intelligence-context@1',
    stage: 'creative-intelligence-context',
    ...normalized,
    snapshotFingerprint: contextFingerprint(normalized),
    truth: {
      knowledgeOnly: true,
      authorityGranted: false,
      productionApproved: false
    }
  };
  const review = reviewCreativeIntelligenceContext(context);
  return {
    ...context,
    review,
    pass: review.pass,
    reviewReady: review.reviewReady,
    status: review.status,
    findings: review.findings,
    truth: { ...context.truth, ...review.truth }
  };
}

function normalizeReasoningMove(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    id: text(source.id),
    type: text(source.type),
    claim: text(source.claim),
    causalExplanation: text(source.causalExplanation),
    knowledgeRefs: list(source.knowledgeRefs),
    projectTruthRefs: list(source.projectTruthRefs),
    counterEvidenceRefs: list(source.counterEvidenceRefs),
    consequence: text(source.consequence),
    uncertainty: text(source.uncertainty),
    falsifier: text(source.falsifier),
    rejectedBecause: text(source.rejectedBecause)
  };
}

export function reviewCreativeReasoningFrame(frame = {}) {
  const findings = [];
  const contextReview = reviewCreativeIntelligenceContext(frame?.context ?? {});
  const moves = (Array.isArray(frame?.moves) ? frame.moves : []).map(normalizeReasoningMove);
  const contextKnowledgeIds = new Set(contextReview.normalized?.entryRefs?.map((item) => item.knowledgeId) ?? []);
  const projectTruths = new Set(contextReview.normalized?.projectTruths ?? []);
  const moveIds = moves.map((move) => move.id);
  const frameProjectId = text(frame?.projectId);
  const computedFingerprint = reasoningFrameFingerprint({ projectId: frameProjectId, moves }, contextReview.computedFingerprint);

  if (frame?.schema !== 'ai-studio-os/creative-reasoning-frame@1') findings.push(finding('blocker', 'creative-reasoning-frame-schema-invalid', 'Creative reasoning requires creative-reasoning-frame@1.'));
  if (!contextReview.reviewReady) findings.push(finding('blocker', 'creative-reasoning-context-not-ready', 'Creative reasoning requires a review-ready context.', { findingCodes: contextReview.findings.map((item) => item.code) }));
  if (!frameProjectId || frameProjectId !== contextReview.normalized?.projectId) findings.push(finding('blocker', 'creative-reasoning-project-binding-mismatch', 'Creative reasoning frame project identity must exactly match its reviewed context.', { frameProjectId: frameProjectId || null, contextProjectId: contextReview.normalized?.projectId ?? null }));
  if (!moves.length) findings.push(finding('major', 'creative-reasoning-moves-missing', 'Creative Intelligence should expose the reasoning moves it used.'));
  if (moveIds.some((id) => !id)) findings.push(finding('blocker', 'creative-reasoning-move-id-missing', 'Every reasoning move requires a stable ID.'));
  if (new Set(moveIds).size !== moveIds.length) findings.push(finding('blocker', 'creative-reasoning-move-id-duplicate', 'Creative reasoning move IDs must be unique.', { moveIds }));
  if (text(frame?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-reasoning-frame-fingerprint-mismatch', 'Creative reasoning frame fingerprint must bind the exact project context and reasoning move contracts.', { expected: computedFingerprint, actual: frame?.snapshotFingerprint ?? null }));

  for (const move of moves) {
    if (!REASONING_MOVE_SET.has(move.type)) findings.push(finding('blocker', 'creative-reasoning-move-type-invalid', 'Creative reasoning move uses an unsupported reasoning type.', { moveId: move.id, type: move.type }));
    if (!move.claim) findings.push(finding('major', 'creative-reasoning-claim-missing', 'Each reasoning move requires an explicit claim.', { moveId: move.id }));
    if (!move.knowledgeRefs.length && !move.projectTruthRefs.length) findings.push(finding('major', 'creative-reasoning-evidence-missing', 'Each reasoning move must connect to selected knowledge or project truth.', { moveId: move.id }));
    if (!move.projectTruthRefs.length) findings.push(finding('major', 'creative-reasoning-project-grounding-missing', 'Every project reasoning move must reconnect to at least one current project truth so knowledge cannot become direction by itself.', { moveId: move.id }));
    if (move.knowledgeRefs.some((ref) => !contextKnowledgeIds.has(ref))) findings.push(finding('blocker', 'creative-reasoning-knowledge-ref-invalid', 'Reasoning may cite only knowledge explicitly selected into the current context.', { moveId: move.id, knowledgeRefs: move.knowledgeRefs }));
    if (move.projectTruthRefs.some((ref) => !projectTruths.has(ref))) findings.push(finding('blocker', 'creative-reasoning-project-truth-ref-invalid', 'Reasoning may cite only project truth present in the bound context.', { moveId: move.id, projectTruthRefs: move.projectTruthRefs }));
    if (move.counterEvidenceRefs.some((ref) => !contextKnowledgeIds.has(ref))) findings.push(finding('blocker', 'creative-reasoning-counterevidence-ref-invalid', 'Counterevidence must come from knowledge selected into the current context.', { moveId: move.id, counterEvidenceRefs: move.counterEvidenceRefs }));
    if (move.type === 'causal' && !move.causalExplanation) findings.push(finding('major', 'creative-reasoning-causal-explanation-missing', 'Causal reasoning must explain the mechanism, not merely assert a correlation.', { moveId: move.id }));
    if (PROJECT_GROUNDED_MOVE_TYPES.has(move.type) && !move.projectTruthRefs.length) findings.push(finding('major', 'creative-reasoning-transfer-project-grounding-missing', 'Project-dependent analogy, contradiction, appropriateness, genericity, transfer and synthesis must reconnect to project truth before they influence a project hypothesis.', { moveId: move.id, type: move.type }));
    if (['transfer', 'synthesis'].includes(move.type) && !move.falsifier) findings.push(finding('major', 'creative-reasoning-transfer-falsifier-missing', 'Transfer and synthesis need a falsifier so attractive references do not become unquestioned direction.', { moveId: move.id }));
    if (move.type === 'critique' && !move.rejectedBecause) findings.push(finding('major', 'creative-reasoning-critique-rejection-missing', 'Critique reasoning should state what is rejected and why.', { moveId: move.id }));
    if (!move.consequence) findings.push(finding('major', 'creative-reasoning-consequence-missing', 'Each reasoning move should state the creative consequence if the claim holds.', { moveId: move.id }));
    if (!move.uncertainty) findings.push(finding('major', 'creative-reasoning-uncertainty-missing', 'Creative reasoning should state meaningful uncertainty instead of laundering inference into fact.', { moveId: move.id }));
  }

  const claims = authorityClaims(frame);
  if (claims.length) findings.push(finding('blocker', 'creative-reasoning-authority-fabricated', 'Creative reasoning may produce candidate insight, not canonical creative authority.', { claims }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-reasoning-frame-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-advisory-creative-reasoning',
    computedFingerprint,
    moves,
    findings,
    contextReview,
    truth: {
      reasoningIsAdvisory: true,
      exactSnapshotBound: text(frame?.snapshotFingerprint) === computedFingerprint,
      generatedDirectionIsCanonical: false,
      humanApprovalGranted: false,
      knowledgeIsAuthority: false,
      allProjectReasoningMustGroundInProjectTruth: true,
      transferRequiresProjectGrounding: true,
      uncertaintyMustRemainVisible: true,
      productionApproved: false
    }
  };
}

export function buildCreativeReasoningFrame({ context, moves = [] } = {}) {
  const normalizedMoves = (Array.isArray(moves) ? moves : []).map(normalizeReasoningMove);
  const projectId = text(context?.projectId) || null;
  const contextReview = reviewCreativeIntelligenceContext(context ?? {});
  const frame = {
    schema: 'ai-studio-os/creative-reasoning-frame@1',
    stage: 'creative-reasoning-frame',
    projectId,
    context: context ?? null,
    moves: normalizedMoves,
    snapshotFingerprint: reasoningFrameFingerprint({ projectId, moves: normalizedMoves }, contextReview.computedFingerprint),
    truth: {
      advisoryOnly: true,
      authorityGranted: false,
      creativeDirectionSelected: false,
      productionApproved: false
    }
  };
  const review = reviewCreativeReasoningFrame(frame);
  return {
    ...frame,
    review,
    pass: review.pass,
    reviewReady: review.reviewReady,
    status: review.status,
    findings: review.findings,
    moves: review.moves,
    truth: { ...frame.truth, ...review.truth }
  };
}
