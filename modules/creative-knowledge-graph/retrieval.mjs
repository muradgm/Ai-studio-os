import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeKnowledgeEntry } from '../creative-intelligence-foundation/runtime.mjs';
import {
  creativeKnowledgeGraphSourceBindingFingerprint,
  reviewCreativeKnowledgeGraph
} from './runtime.mjs';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function list(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function isSha256(value) {
  return /^[a-f0-9]{64}$/.test(text(value));
}

function parseInstant(value) {
  const raw = text(value);
  if (!raw || !/(?:Z|[+-]\d{2}:\d{2})$/.test(raw)) return null;
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function sameValue(left, right) {
  return fingerprintCreativeValue(left) === fingerprintCreativeValue(right);
}

const KNOWN_AUTHORITY_KEYS = Object.freeze([
  'selected', 'approved', 'canonical', 'authorityGranted', 'creativeAuthorityGranted',
  'humanApproved', 'humanSelected', 'creativeDirectionSelected',
  'creativeDirectionApproved', 'productionApproved', 'technicalPlanningAuthorized'
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

function unknownKeys(object, allowed) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return [];
  const allowedSet = new Set(allowed);
  return Object.keys(object).filter((key) => !allowedSet.has(key)).sort();
}

function tokens(value) {
  return [...new Set(text(value).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 2))];
}

function searchableTokenSet(node = {}) {
  const entry = node.entry ?? {};
  const value = [
    entry.title,
    entry.definition,
    entry.causalRationale,
    ...(entry.perceptualEffects ?? []),
    ...(entry.worksWhen ?? []),
    ...(entry.failsWhen ?? []),
    ...(entry.creativeVariables ?? []),
    ...(entry.crossDomainApplications ?? []),
    ...(entry.failureModes ?? []),
    ...(entry.counterexamples ?? []),
    ...(entry.diagnostics ?? []),
    ...(entry.transfer?.transferablePrinciples ?? []),
    ...(entry.transfer?.adaptationRules ?? [])
  ].map(text).filter(Boolean).join(' ');
  return new Set(tokens(value));
}

function termMatchCount(node, queryTerms) {
  if (!queryTerms.length) return 0;
  const haystack = searchableTokenSet(node);
  return queryTerms.filter((term) => haystack.has(term)).length;
}

function visibleInProject(node, projectId) {
  return node?.entry?.scope !== 'project' || node?.entry?.projectId === projectId;
}

function usableStatus(node) {
  return ['active', 'disputed'].includes(node?.annotation?.status);
}

function freshness(node, asOfMs) {
  if (!Number.isFinite(asOfMs)) return { usable: false, reason: 'query-as-of-invalid' };
  const capturedAt = parseInstant(node?.entry?.provenance?.capturedAt);
  const freshUntil = parseInstant(node?.annotation?.freshUntil);
  if (node?.entry?.kind === 'current-trend') {
    if (capturedAt === null || freshUntil === null) return { usable: false, reason: 'trend-freshness-unqualified' };
    if (asOfMs < capturedAt) return { usable: false, reason: 'trend-not-yet-observed' };
    if (asOfMs > freshUntil) return { usable: false, reason: 'trend-stale' };
  } else if (freshUntil !== null && asOfMs > freshUntil) {
    return { usable: false, reason: 'evidence-expired' };
  }
  return { usable: true, reason: null };
}

const QUERY_KEYS = Object.freeze(['projectId', 'asOf', 'purpose', 'domains', 'kinds', 'terms', 'limit']);
const BINDING_KEYS = Object.freeze(['schema', 'graphSnapshotFingerprint', 'graphSourceBindingFingerprint', 'foundationSnapshotFingerprint', 'sourceGraphReviewReady', 'bindingFingerprint']);
const ITEM_KEYS = Object.freeze(['schema', 'knowledgeId', 'knowledgeFingerprint', 'entryProjectionFingerprint', 'entry', 'annotation', 'rank', 'termMatches', 'matchReasons', 'visibleConflictIds', 'conflictsWithPrimaryIds', 'includedAsConflictContext', 'withheldConflictPresent', 'truth']);
const ANNOTATION_KEYS = Object.freeze(['status', 'statusReason', 'freshUntil', 'supersededBy', 'representationNotes']);
const STATS_KEYS = Object.freeze(['scopeVisibleNodeCount', 'primaryResultCount', 'conflictContextCount', 'excludedCounts', 'unavailableVisibleConflictCount', 'withheldConflictPresent']);
const TOP_LEVEL_KEYS = Object.freeze(['schema', 'stage', 'query', 'graphBinding', 'results', 'conflictContext', 'stats', 'snapshotFingerprint', 'truth', 'pass', 'reviewReady', 'status', 'provenanceReceipt', 'provenanceReady']);
const EXCLUDED_REASON_KEYS = new Set([
  'query-as-of-invalid', 'trend-freshness-unqualified', 'trend-not-yet-observed', 'trend-stale', 'evidence-expired',
  'domain-filter', 'kind-filter', 'term-filter', 'status:active', 'status:disputed', 'status:superseded', 'status:deprecated', 'status:unknown'
]);

function normalizeQuery(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const limit = Number.isInteger(source.limit) && source.limit >= 1 && source.limit <= 50 ? source.limit : 10;
  return {
    projectId: text(source.projectId),
    asOf: text(source.asOf),
    purpose: text(source.purpose),
    domains: list(source.domains),
    kinds: list(source.kinds),
    terms: tokens((Array.isArray(source.terms) ? source.terms : [source.terms]).filter(Boolean).join(' ')),
    limit
  };
}

function normalizeAnnotation(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    status: text(source.status),
    statusReason: text(source.statusReason),
    freshUntil: text(source.freshUntil) || null,
    supersededBy: text(source.supersededBy) || null,
    representationNotes: list(source.representationNotes)
  };
}

function projectEntryProjection(entry = {}) {
  const review = reviewCreativeKnowledgeEntry(entry);
  const normalized = review.normalizedEntry ?? {};
  return {
    ...normalized,
    relationships: []
  };
}

function sourceKnowledgeFingerprint(entry = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-entry@1',
    entry
  });
}

function projectionFingerprint(entry = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-project-projection@1',
    entry
  });
}

function graphBinding(graphReview, graph = {}) {
  const binding = {
    schema: 'ai-studio-os/creative-knowledge-retrieval-graph-binding@1',
    graphSnapshotFingerprint: text(graphReview.computedFingerprint),
    graphSourceBindingFingerprint: creativeKnowledgeGraphSourceBindingFingerprint(graph?.sourceBinding ?? {}),
    foundationSnapshotFingerprint: text(graph?.sourceBinding?.foundationSnapshotFingerprint),
    sourceGraphReviewReady: graphReview.reviewReady === true
  };
  return { ...binding, bindingFingerprint: fingerprintCreativeValue(binding) };
}

function canonicalItemTruth() {
  return {
    retrievedEvidenceOnly: true,
    projectSafeKnowledgeProjection: true,
    sourceRelationshipsStripped: true,
    retrievalRankIsCreativeAuthority: false,
    creativeDirectionSelected: false,
    productionApproved: false
  };
}

function itemContract(item = {}) {
  return {
    schema: 'ai-studio-os/creative-knowledge-retrieval-item@1',
    knowledgeId: text(item.knowledgeId),
    knowledgeFingerprint: text(item.knowledgeFingerprint),
    entryProjectionFingerprint: text(item.entryProjectionFingerprint),
    entry: item.entry,
    annotation: normalizeAnnotation(item.annotation),
    rank: item.rank === null ? null : Number(item.rank),
    termMatches: Number(item.termMatches),
    matchReasons: list(item.matchReasons),
    visibleConflictIds: list(item.visibleConflictIds),
    conflictsWithPrimaryIds: list(item.conflictsWithPrimaryIds),
    includedAsConflictContext: item.includedAsConflictContext === true,
    withheldConflictPresent: item.withheldConflictPresent === true,
    truth: canonicalItemTruth()
  };
}

function normalizeExcludedCounts(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(Object.entries(source)
    .filter(([key, count]) => EXCLUDED_REASON_KEYS.has(key) && Number.isInteger(count) && count >= 0)
    .sort(([a], [b]) => a.localeCompare(b)));
}

function statsContract(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    scopeVisibleNodeCount: Number(source.scopeVisibleNodeCount),
    primaryResultCount: Number(source.primaryResultCount),
    conflictContextCount: Number(source.conflictContextCount),
    excludedCounts: normalizeExcludedCounts(source.excludedCounts),
    unavailableVisibleConflictCount: Number(source.unavailableVisibleConflictCount),
    withheldConflictPresent: source.withheldConflictPresent === true
  };
}

function retrievalFingerprint({ query, graphBinding: binding, results, conflictContext, stats }) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-retrieval@1',
    query,
    graphBindingFingerprint: text(binding?.bindingFingerprint),
    results: results.map(itemContract),
    conflictContext: conflictContext.map(itemContract),
    stats: statsContract(stats)
  });
}

function retrievalItem(node, { rank = null, termMatches = 0, matchReasons = [], visibleConflictIds = [], conflictsWithPrimaryIds = [], conflictContext = false, withheldConflictPresent = false } = {}) {
  const projectedEntry = projectEntryProjection(node.entry);
  return {
    schema: 'ai-studio-os/creative-knowledge-retrieval-item@1',
    knowledgeId: node.id,
    knowledgeFingerprint: node.knowledgeFingerprint,
    entryProjectionFingerprint: projectionFingerprint(projectedEntry),
    entry: projectedEntry,
    annotation: normalizeAnnotation(node.annotation),
    rank,
    termMatches,
    matchReasons: list(matchReasons),
    visibleConflictIds: list(visibleConflictIds),
    conflictsWithPrimaryIds: list(conflictsWithPrimaryIds),
    includedAsConflictContext: conflictContext,
    withheldConflictPresent,
    truth: canonicalItemTruth()
  };
}

function conflictCounterpart(edge, nodeId) {
  if (edge.type !== 'conflicts-with') return null;
  if (edge.fromId === nodeId) return edge.toId;
  if (edge.toId === nodeId) return edge.fromId;
  return null;
}

function visibleEligibility(node, query, asOfMs, applyFilters) {
  if (!visibleInProject(node, query.projectId)) return { visible: false, eligible: false, reason: 'project-scope-mismatch', termMatches: 0 };
  if (!usableStatus(node)) return { visible: true, eligible: false, reason: `status:${node?.annotation?.status ?? 'unknown'}`, termMatches: 0 };
  const fresh = freshness(node, asOfMs);
  if (!fresh.usable) return { visible: true, eligible: false, reason: fresh.reason, termMatches: 0 };
  if (!applyFilters) return { visible: true, eligible: true, reason: null, termMatches: 0 };
  if (query.domains.length && !query.domains.includes(node.entry.domain)) return { visible: true, eligible: false, reason: 'domain-filter', termMatches: 0 };
  if (query.kinds.length && !query.kinds.includes(node.entry.kind)) return { visible: true, eligible: false, reason: 'kind-filter', termMatches: 0 };
  const matches = termMatchCount(node, query.terms);
  if (query.terms.length && matches === 0) return { visible: true, eligible: false, reason: 'term-filter', termMatches: 0 };
  return { visible: true, eligible: true, reason: null, termMatches: matches };
}

function stablePrimarySort(left, right) {
  const leftStatus = left.node.annotation.status === 'active' ? 0 : 1;
  const rightStatus = right.node.annotation.status === 'active' ? 0 : 1;
  if (leftStatus !== rightStatus) return leftStatus - rightStatus;
  if (left.termMatches !== right.termMatches) return right.termMatches - left.termMatches;
  return left.node.id.localeCompare(right.node.id);
}

function canonicalRetrievalTruth() {
  return {
    knowledgeOnly: true,
    projectSafeProjection: true,
    sourceRelationshipsStrippedFromItems: true,
    retrievalIsCreativeAuthority: false,
    retrievalRankIsCreativeAuthority: false,
    conflictEvidencePreserved: true,
    hiddenScopeConflictTargetsWithheld: true,
    explicitAsOfRequired: true,
    staleTrendEvidenceExcluded: true,
    crossProjectEvidenceExcludedBeforePayload: true,
    conflictContextIsUnranked: true,
    humanApprovalGranted: false,
    productionApproved: false
  };
}

export function reviewCreativeKnowledgeRetrieval(retrieval = {}) {
  const findings = [];
  const rawQuery = retrieval?.query && typeof retrieval.query === 'object' ? retrieval.query : {};
  const query = normalizeQuery(rawQuery);
  const asOfMs = parseInstant(query.asOf);
  const binding = retrieval?.graphBinding && typeof retrieval.graphBinding === 'object' ? retrieval.graphBinding : {};
  const results = Array.isArray(retrieval?.results) ? retrieval.results : [];
  const conflictContext = Array.isArray(retrieval?.conflictContext) ? retrieval.conflictContext : [];
  const stats = retrieval?.stats && typeof retrieval.stats === 'object' ? retrieval.stats : {};
  const canonicalStats = statsContract(stats);
  const computedFingerprint = retrievalFingerprint({ query, graphBinding: binding, results, conflictContext, stats: canonicalStats });
  const resultIds = results.map((item) => text(item?.knowledgeId));
  const conflictIds = conflictContext.map((item) => text(item?.knowledgeId));
  const payloadIds = new Set([...resultIds, ...conflictIds]);

  if (retrieval?.schema !== 'ai-studio-os/creative-knowledge-retrieval@1') findings.push(finding('blocker', 'creative-knowledge-retrieval-schema-invalid', 'Creative Knowledge retrieval requires creative-knowledge-retrieval@1.'));
  const topUnknownKeys = unknownKeys(retrieval, TOP_LEVEL_KEYS);
  if (topUnknownKeys.length) findings.push(finding('blocker', 'creative-knowledge-retrieval-shape-invalid', 'Project retrieval payload may contain only canonical fields.', { unknownKeys: topUnknownKeys }));
  const queryUnknownKeys = unknownKeys(rawQuery, QUERY_KEYS);
  if (queryUnknownKeys.length || !sameValue(rawQuery, query)) findings.push(finding('blocker', 'creative-knowledge-retrieval-query-contract-drift', 'Retrieval query must equal the exact normalized deterministic query contract.', { unknownKeys: queryUnknownKeys }));
  if (!query.projectId) findings.push(finding('blocker', 'creative-knowledge-retrieval-project-missing', 'Retrieval must be bound to a project identity.'));
  if (asOfMs === null) findings.push(finding('blocker', 'creative-knowledge-retrieval-as-of-invalid', 'Retrieval requires an explicit timezone-qualified asOf timestamp so freshness is deterministic.'));
  if (!query.purpose) findings.push(finding('major', 'creative-knowledge-retrieval-purpose-missing', 'Retrieval should state the project reasoning purpose it is serving.'));

  const bindingUnknownKeys = unknownKeys(binding, BINDING_KEYS);
  if (bindingUnknownKeys.length) findings.push(finding('blocker', 'creative-knowledge-retrieval-binding-shape-invalid', 'Retrieval graph binding must be a compact canonical receipt.', { unknownKeys: bindingUnknownKeys }));
  if (binding?.schema !== 'ai-studio-os/creative-knowledge-retrieval-graph-binding@1') findings.push(finding('blocker', 'creative-knowledge-retrieval-binding-schema-invalid', 'Retrieval requires a canonical graph binding.'));
  if (!isSha256(binding?.graphSnapshotFingerprint) || !isSha256(binding?.graphSourceBindingFingerprint) || !isSha256(binding?.foundationSnapshotFingerprint)) findings.push(finding('blocker', 'creative-knowledge-retrieval-binding-fingerprint-invalid', 'Retrieval graph binding requires exact graph, graph-source and Foundation fingerprints.'));
  if (binding?.sourceGraphReviewReady !== true) findings.push(finding('blocker', 'creative-knowledge-retrieval-source-graph-not-ready', 'Retrieval cannot claim a structurally invalid graph as its source.'));
  const expectedBindingFingerprint = fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-retrieval-graph-binding@1',
    graphSnapshotFingerprint: text(binding?.graphSnapshotFingerprint),
    graphSourceBindingFingerprint: text(binding?.graphSourceBindingFingerprint),
    foundationSnapshotFingerprint: text(binding?.foundationSnapshotFingerprint),
    sourceGraphReviewReady: binding?.sourceGraphReviewReady === true
  });
  if (text(binding?.bindingFingerprint) !== expectedBindingFingerprint) findings.push(finding('blocker', 'creative-knowledge-retrieval-binding-drift', 'Retrieval graph binding fingerprint must match its exact compact source receipt.'));

  const statsUnknownKeys = unknownKeys(stats, STATS_KEYS);
  const excludedKeys = Object.keys(stats?.excludedCounts && typeof stats.excludedCounts === 'object' ? stats.excludedCounts : {});
  const invalidExcludedKeys = excludedKeys.filter((key) => !EXCLUDED_REASON_KEYS.has(key));
  const invalidExcludedValues = excludedKeys.filter((key) => !Number.isInteger(stats.excludedCounts[key]) || stats.excludedCounts[key] < 0);
  if (statsUnknownKeys.length || invalidExcludedKeys.length || invalidExcludedValues.length || !sameValue(stats, canonicalStats)) findings.push(finding('blocker', 'creative-knowledge-retrieval-stats-contract-drift', 'Retrieval stats are a fixed privacy-safe aggregate contract and cannot carry hidden IDs or arbitrary metadata.', { unknownKeys: statsUnknownKeys, invalidExcludedKeys, invalidExcludedValues }));
  for (const key of ['scopeVisibleNodeCount', 'primaryResultCount', 'conflictContextCount', 'unavailableVisibleConflictCount']) {
    if (!Number.isInteger(canonicalStats[key]) || canonicalStats[key] < 0) findings.push(finding('blocker', 'creative-knowledge-retrieval-stats-value-invalid', 'Retrieval aggregate counts must be non-negative integers.', { key, value: canonicalStats[key] }));
  }
  if (canonicalStats.primaryResultCount !== results.length || canonicalStats.conflictContextCount !== conflictContext.length) findings.push(finding('blocker', 'creative-knowledge-retrieval-stats-count-drift', 'Retrieval aggregate counts must equal the visible payload counts.'));

  if (text(retrieval?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-knowledge-retrieval-fingerprint-mismatch', 'Retrieval snapshot fingerprint must bind the exact query and isolated evidence payload.', { expected: computedFingerprint, actual: retrieval?.snapshotFingerprint ?? null }));
  if (new Set(resultIds).size !== resultIds.length || resultIds.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-retrieval-result-id-invalid', 'Primary retrieval result IDs must be non-empty and unique.', { resultIds }));
  if (new Set(conflictIds).size !== conflictIds.length || conflictIds.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-retrieval-conflict-id-invalid', 'Conflict-context result IDs must be non-empty and unique.', { conflictIds }));
  if (conflictIds.some((id) => resultIds.includes(id))) findings.push(finding('blocker', 'creative-knowledge-retrieval-primary-conflict-duplicate', 'A knowledge item cannot appear in both primary results and conflict context.', { resultIds, conflictIds }));

  const inspectItem = (item, index, isConflict) => {
    const knowledgeId = text(item?.knowledgeId);
    if (item?.schema !== 'ai-studio-os/creative-knowledge-retrieval-item@1') findings.push(finding('blocker', 'creative-knowledge-retrieval-item-schema-invalid', 'Retrieval items require creative-knowledge-retrieval-item@1.', { knowledgeId: knowledgeId || null }));
    const itemUnknownKeys = unknownKeys(item, ITEM_KEYS);
    if (itemUnknownKeys.length) findings.push(finding('blocker', 'creative-knowledge-retrieval-item-shape-invalid', 'Project retrieval items may contain only canonical fields.', { knowledgeId: knowledgeId || null, unknownKeys: itemUnknownKeys }));
    const annotationUnknownKeys = unknownKeys(item?.annotation, ANNOTATION_KEYS);
    if (annotationUnknownKeys.length || !sameValue(item?.annotation ?? {}, normalizeAnnotation(item?.annotation))) findings.push(finding('blocker', 'creative-knowledge-retrieval-annotation-contract-drift', 'Retrieved representation annotation must be exact and cannot carry hidden metadata.', { knowledgeId: knowledgeId || null, unknownKeys: annotationUnknownKeys }));

    const knowledgeReview = reviewCreativeKnowledgeEntry(item?.entry ?? {});
    const normalizedProjection = knowledgeReview.normalizedEntry ?? {};
    if (!knowledgeReview.reviewReady) findings.push(finding(knowledgeReview.pass ? 'major' : 'blocker', 'creative-knowledge-retrieval-item-knowledge-not-ready', 'Every retrieved item must carry freshly reviewable Creative Knowledge.', { knowledgeId: knowledgeId || null, findingCodes: knowledgeReview.findings.map((entry) => entry.code) }));
    if (!sameValue(item?.entry ?? {}, normalizedProjection)) findings.push(finding('blocker', 'creative-knowledge-retrieval-item-entry-contract-drift', 'Retrieved knowledge must be an exact normalized project-safe projection with no hidden fields.', { knowledgeId: knowledgeId || null }));
    if ((normalizedProjection.relationships ?? []).length !== 0) findings.push(finding('blocker', 'creative-knowledge-retrieval-source-relationships-leaked', 'Project retrieval items must strip source graph relationships; visible relations are reintroduced only through scope-safe retrieval metadata.', { knowledgeId: knowledgeId || null }));
    if (knowledgeId !== text(normalizedProjection.id)) findings.push(finding('blocker', 'creative-knowledge-retrieval-item-id-drift', 'Retrieval item ID must match its embedded knowledge projection.', { knowledgeId: knowledgeId || null }));
    const expectedProjectionFingerprint = projectionFingerprint(normalizedProjection);
    if (text(item?.entryProjectionFingerprint) !== expectedProjectionFingerprint) findings.push(finding('blocker', 'creative-knowledge-retrieval-projection-fingerprint-mismatch', 'Project-safe entry projection fingerprint must bind exact embedded knowledge.', { knowledgeId: knowledgeId || null }));
    if (!isSha256(item?.knowledgeFingerprint)) findings.push(finding('blocker', 'creative-knowledge-retrieval-source-knowledge-fingerprint-invalid', 'Retrieved item must retain an opaque source knowledge fingerprint for later independent graph provenance.', { knowledgeId: knowledgeId || null }));
    if (!visibleInProject({ entry: normalizedProjection }, query.projectId)) findings.push(finding('blocker', 'creative-knowledge-retrieval-project-scope-leak', 'Project retrieval payload cannot contain knowledge scoped to a different project.', { knowledgeId: knowledgeId || null }));
    if (!['active', 'disputed'].includes(item?.annotation?.status)) findings.push(finding('blocker', 'creative-knowledge-retrieval-status-invalid', 'Retrieved evidence must be active or disputed; superseded/deprecated evidence stays out of project payloads.', { knowledgeId: knowledgeId || null, status: item?.annotation?.status ?? null }));
    if (asOfMs !== null) {
      const fresh = freshness({ entry: normalizedProjection, annotation: item?.annotation ?? {} }, asOfMs);
      if (!fresh.usable) findings.push(finding('blocker', 'creative-knowledge-retrieval-stale-evidence', 'Retrieved evidence must satisfy the explicit asOf freshness boundary.', { knowledgeId: knowledgeId || null, reason: fresh.reason }));
    }

    const visibleConflictIds = list(item?.visibleConflictIds);
    if (visibleConflictIds.some((id) => id === knowledgeId || !payloadIds.has(id))) findings.push(finding('blocker', 'creative-knowledge-retrieval-visible-conflict-ref-invalid', 'Visible conflict IDs may reference only other items already present in the isolated project payload.', { knowledgeId: knowledgeId || null, visibleConflictIds }));

    if (!isConflict) {
      if (item?.rank !== index + 1) findings.push(finding('major', 'creative-knowledge-retrieval-rank-gap', 'Primary retrieval ranks must be contiguous and deterministic.', { knowledgeId: knowledgeId || null, expected: index + 1, actual: item?.rank ?? null }));
      if (!Number.isInteger(item?.termMatches) || item.termMatches < 0) findings.push(finding('blocker', 'creative-knowledge-retrieval-term-match-count-invalid', 'termMatches must be a non-negative integer.', { knowledgeId: knowledgeId || null, termMatches: item?.termMatches ?? null }));
      const actualMatches = termMatchCount({ entry: normalizedProjection }, query.terms);
      if (item?.termMatches !== actualMatches) findings.push(finding('blocker', 'creative-knowledge-retrieval-term-match-count-drift', 'Primary termMatches must be recomputable from the visible project-safe knowledge projection.', { knowledgeId: knowledgeId || null, expected: actualMatches, actual: item?.termMatches ?? null }));
      if (query.domains.length && !query.domains.includes(normalizedProjection.domain)) findings.push(finding('blocker', 'creative-knowledge-retrieval-domain-filter-drift', 'Primary result violates the declared domain filter.', { knowledgeId: knowledgeId || null }));
      if (query.kinds.length && !query.kinds.includes(normalizedProjection.kind)) findings.push(finding('blocker', 'creative-knowledge-retrieval-kind-filter-drift', 'Primary result violates the declared kind filter.', { knowledgeId: knowledgeId || null }));
      if (query.terms.length && actualMatches === 0) findings.push(finding('blocker', 'creative-knowledge-retrieval-term-filter-drift', 'Primary result does not match any declared retrieval term.', { knowledgeId: knowledgeId || null }));
      const expectedReasons = [
        ...(query.domains.length ? [`domain:${normalizedProjection.domain}`] : []),
        ...(query.kinds.length ? [`kind:${normalizedProjection.kind}`] : []),
        ...(actualMatches ? [`term-matches:${actualMatches}`] : []),
        ...(item?.annotation?.status === 'disputed' ? ['status:disputed'] : ['status:active'])
      ];
      if (!sameValue(list(item?.matchReasons), expectedReasons)) findings.push(finding('blocker', 'creative-knowledge-retrieval-match-reason-drift', 'Primary match reasons must be deterministic and derivable from the visible query/result contract.', { knowledgeId: knowledgeId || null }));
      if (list(item?.conflictsWithPrimaryIds).length) findings.push(finding('blocker', 'creative-knowledge-retrieval-primary-has-conflict-context-refs', 'Primary items use visibleConflictIds; conflictsWithPrimaryIds is reserved for unranked conflict context.', { knowledgeId: knowledgeId || null }));
      if (item?.includedAsConflictContext === true) findings.push(finding('blocker', 'creative-knowledge-retrieval-primary-context-flag-invalid', 'Ranked primary item cannot claim conflict-context status.', { knowledgeId: knowledgeId || null }));
    } else {
      if (item?.rank !== null) findings.push(finding('major', 'creative-knowledge-retrieval-conflict-ranked', 'Conflict context is preserved evidence, not a ranked primary result.', { knowledgeId: knowledgeId || null }));
      if (item?.termMatches !== 0) findings.push(finding('blocker', 'creative-knowledge-retrieval-conflict-term-score-invalid', 'Conflict context is unranked and must not carry term-match ranking score.', { knowledgeId: knowledgeId || null }));
      if (!sameValue(list(item?.matchReasons), ['explicit-conflict-context'])) findings.push(finding('blocker', 'creative-knowledge-retrieval-conflict-reason-drift', 'Conflict context must be explicitly labeled and cannot masquerade as a primary match.', { knowledgeId: knowledgeId || null }));
      const linkedPrimary = list(item?.conflictsWithPrimaryIds);
      if (!linkedPrimary.length || linkedPrimary.some((id) => !resultIds.includes(id))) findings.push(finding('blocker', 'creative-knowledge-retrieval-conflict-primary-ref-invalid', 'Conflict context must identify at least one visible primary result it conflicts with.', { knowledgeId: knowledgeId || null, conflictsWithPrimaryIds: linkedPrimary }));
      if (item?.includedAsConflictContext !== true) findings.push(finding('blocker', 'creative-knowledge-retrieval-conflict-context-flag-missing', 'Unranked conflict evidence must explicitly declare conflict-context status.', { knowledgeId: knowledgeId || null }));
      if (item?.withheldConflictPresent === true) findings.push(finding('blocker', 'creative-knowledge-retrieval-conflict-context-withheld-flag-invalid', 'withheldConflictPresent belongs to primary evidence whose hidden-scope conflict target was withheld.', { knowledgeId: knowledgeId || null }));
    }

    if (!sameValue(item?.truth ?? {}, canonicalItemTruth())) findings.push(finding('blocker', 'creative-knowledge-retrieval-item-truth-drift', 'Retrieval item truth boundary is fixed and cannot be extended or weakened.', { knowledgeId: knowledgeId || null }));
    const itemClaims = [...authorityClaims(item), ...authorityClaims(item?.entry ?? {})];
    if (itemClaims.length) findings.push(finding('blocker', 'creative-knowledge-retrieval-item-authority-fabricated', 'Retrieved evidence and rank cannot declare creative or production authority.', { knowledgeId: knowledgeId || null, claims: [...new Set(itemClaims)] }));
    if (!sameValue(item, itemContract(item))) findings.push(finding('blocker', 'creative-knowledge-retrieval-item-contract-drift', 'Retrieval item must equal its exact canonical privacy-safe contract.', { knowledgeId: knowledgeId || null }));
  };

  results.forEach((item, index) => inspectItem(item, index, false));
  conflictContext.forEach((item, index) => inspectItem(item, index, true));

  if (!sameValue(retrieval?.truth ?? {}, canonicalRetrievalTruth())) findings.push(finding('blocker', 'creative-knowledge-retrieval-truth-drift', 'Retrieval truth boundary is fixed; retrieval, rank and conflict context remain advisory evidence.'));
  const claims = authorityClaims(retrieval);
  if (claims.length) findings.push(finding('blocker', 'creative-knowledge-retrieval-authority-fabricated', 'Retrieval output is advisory evidence and cannot select Creative Direction or production.', { claims }));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const coreMajors = findings.filter((item) => item.severity === 'major');
  const expectedPass = coreBlockers.length === 0;
  const expectedReviewReady = coreBlockers.length === 0 && coreMajors.length === 0;
  const expectedStatus = coreBlockers.length ? 'blocked' : coreMajors.length ? 'provisional' : 'ready-as-advisory-retrieval';
  if (Object.hasOwn(retrieval, 'pass') && retrieval.pass !== expectedPass) findings.push(finding('blocker', 'creative-knowledge-retrieval-pass-claim-drift', 'Cached retrieval pass flag must match fresh review.'));
  if (Object.hasOwn(retrieval, 'reviewReady') && retrieval.reviewReady !== expectedReviewReady) findings.push(finding('blocker', 'creative-knowledge-retrieval-ready-claim-drift', 'Cached retrieval reviewReady flag must match fresh review.'));
  if (Object.hasOwn(retrieval, 'status') && retrieval.status !== expectedStatus) findings.push(finding('blocker', 'creative-knowledge-retrieval-status-claim-drift', 'Cached retrieval status must match fresh review.', { expected: expectedStatus, actual: retrieval.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-knowledge-retrieval-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-advisory-retrieval',
    findings,
    computedFingerprint,
    normalizedQuery: query,
    truth: {
      retrievalIsCreativeAuthority: false,
      retrievalRankIsCreativeAuthority: false,
      exactProjectPayloadShapeRequired: true,
      projectSafeKnowledgeProjectionRequired: true,
      sourceRelationshipsStripped: true,
      explicitAsOfRequired: true,
      staleTrendEvidenceExcluded: true,
      crossProjectEvidenceExcludedBeforePayload: true,
      hiddenScopeConflictTargetsWithheld: true,
      conflictContextIsUnranked: true,
      independentGraphProvenanceStillRequired: true,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeKnowledgeRetrieval({ graph, projectId, asOf, purpose, domains = [], kinds = [], terms = [], limit = 10 } = {}) {
  const graphReview = reviewCreativeKnowledgeGraph(graph ?? {});
  const query = normalizeQuery({ projectId, asOf, purpose, domains, kinds, terms, limit });
  const asOfMs = parseInstant(query.asOf);
  const nodes = graphReview.nodes ?? [];
  const edges = graphReview.edges ?? [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const visibleNodes = nodes.filter((node) => visibleInProject(node, query.projectId));
  const exclusionCounts = {};
  const candidates = [];
  for (const node of visibleNodes) {
    const eligibility = visibleEligibility(node, query, asOfMs, true);
    if (!eligibility.eligible) {
      exclusionCounts[eligibility.reason] = (exclusionCounts[eligibility.reason] ?? 0) + 1;
      continue;
    }
    candidates.push({ node, termMatches: eligibility.termMatches });
  }
  candidates.sort(stablePrimarySort);
  const selected = candidates.slice(0, query.limit);
  const primaryIds = new Set(selected.map((item) => item.node.id));

  const visibleConflictsByPrimary = new Map();
  const withheldConflictByPrimary = new Map();
  const conflictContextById = new Map();
  let unavailableVisibleConflictCount = 0;

  for (const selectedItem of selected) {
    const primaryId = selectedItem.node.id;
    const visibleIds = new Set();
    let withheldConflictPresent = false;
    for (const edge of edges) {
      const counterpartId = conflictCounterpart(edge, primaryId);
      if (!counterpartId) continue;
      const counterpart = nodeById.get(counterpartId);
      if (!counterpart) continue;
      if (!visibleInProject(counterpart, query.projectId)) {
        withheldConflictPresent = true;
        continue;
      }
      const eligibility = visibleEligibility(counterpart, query, asOfMs, false);
      if (!eligibility.eligible) {
        unavailableVisibleConflictCount += 1;
        continue;
      }
      visibleIds.add(counterpartId);
      if (!primaryIds.has(counterpartId)) {
        const existing = conflictContextById.get(counterpartId) ?? { node: counterpart, primaryIds: new Set() };
        existing.primaryIds.add(primaryId);
        conflictContextById.set(counterpartId, existing);
      }
    }
    visibleConflictsByPrimary.set(primaryId, [...visibleIds].sort());
    withheldConflictByPrimary.set(primaryId, withheldConflictPresent);
  }

  const results = selected.map((selectedItem, index) => retrievalItem(selectedItem.node, {
    rank: index + 1,
    termMatches: selectedItem.termMatches,
    matchReasons: [
      ...(query.domains.length ? [`domain:${selectedItem.node.entry.domain}`] : []),
      ...(query.kinds.length ? [`kind:${selectedItem.node.entry.kind}`] : []),
      ...(selectedItem.termMatches ? [`term-matches:${selectedItem.termMatches}`] : []),
      ...(selectedItem.node.annotation.status === 'disputed' ? ['status:disputed'] : ['status:active'])
    ],
    visibleConflictIds: visibleConflictsByPrimary.get(selectedItem.node.id) ?? [],
    withheldConflictPresent: withheldConflictByPrimary.get(selectedItem.node.id) === true
  }));

  const conflictContext = [...conflictContextById.values()]
    .sort((a, b) => a.node.id.localeCompare(b.node.id))
    .map((item) => retrievalItem(item.node, {
      rank: null,
      termMatches: 0,
      conflictsWithPrimaryIds: [...item.primaryIds].sort(),
      conflictContext: true,
      matchReasons: ['explicit-conflict-context']
    }));

  const stats = {
    scopeVisibleNodeCount: visibleNodes.length,
    primaryResultCount: results.length,
    conflictContextCount: conflictContext.length,
    excludedCounts: Object.fromEntries(Object.entries(exclusionCounts).sort(([a], [b]) => a.localeCompare(b))),
    unavailableVisibleConflictCount,
    withheldConflictPresent: [...withheldConflictByPrimary.values()].some(Boolean)
  };
  const binding = graphBinding(graphReview, graph ?? {});
  const retrieval = {
    schema: 'ai-studio-os/creative-knowledge-retrieval@1',
    stage: 'creative-knowledge-retrieval',
    query,
    graphBinding: binding,
    results,
    conflictContext,
    stats,
    snapshotFingerprint: retrievalFingerprint({ query, graphBinding: binding, results, conflictContext, stats }),
    truth: canonicalRetrievalTruth()
  };
  const review = reviewCreativeKnowledgeRetrieval(retrieval);
  const findings = [...review.findings];
  if (!graphReview.reviewReady) findings.push(finding('blocker', 'creative-knowledge-retrieval-graph-not-ready', 'Retrieval requires a structurally review-ready Creative Knowledge Graph.', { findingCodes: graphReview.findings.map((item) => item.code) }));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    ...retrieval,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-advisory-retrieval'
  };
}

export function creativeKnowledgeRetrievalFingerprint(retrieval = {}) {
  return retrievalFingerprint({
    query: normalizeQuery(retrieval.query ?? {}),
    graphBinding: retrieval.graphBinding ?? {},
    results: Array.isArray(retrieval.results) ? retrieval.results : [],
    conflictContext: Array.isArray(retrieval.conflictContext) ? retrieval.conflictContext : [],
    stats: statsContract(retrieval.stats ?? {})
  });
}

export function creativeKnowledgeRetrievalContract(retrieval = {}) {
  return {
    schema: retrieval.schema,
    query: normalizeQuery(retrieval.query ?? {}),
    graphBinding: retrieval.graphBinding,
    results: (retrieval.results ?? []).map(itemContract),
    conflictContext: (retrieval.conflictContext ?? []).map(itemContract),
    stats: statsContract(retrieval.stats ?? {}),
    snapshotFingerprint: retrieval.snapshotFingerprint,
    truth: retrieval.truth
  };
}

export function creativeKnowledgeProjectEntryProjection(entry = {}) {
  return projectEntryProjection(entry);
}

export function creativeKnowledgeProjectProjectionFingerprint(entry = {}) {
  return projectionFingerprint(entry);
}
