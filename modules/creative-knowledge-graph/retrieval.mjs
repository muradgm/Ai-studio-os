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

function authorityClaims(object = {}) {
  const known = [
    'selected', 'approved', 'canonical', 'authorityGranted', 'humanApproved',
    'humanSelected', 'creativeDirectionSelected', 'creativeDirectionApproved',
    'productionApproved', 'technicalPlanningAuthorized'
  ];
  const claims = known.filter((key) => object?.[key] === true || object?.truth?.[key] === true);
  const status = text(object?.status).toLowerCase();
  if (['approved', 'selected', 'canonical', 'authoritative', 'production-ready', 'production-approved'].includes(status)) claims.push(`status:${status}`);
  return [...new Set(claims)];
}

function tokens(value) {
  return [...new Set(text(value).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2))];
}

function searchableText(node = {}) {
  const entry = node.entry ?? {};
  return [
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
  ].map(text).filter(Boolean).join(' ').toLowerCase();
}

function termMatchCount(node, queryTerms) {
  if (!queryTerms.length) return 0;
  const haystack = searchableText(node);
  return queryTerms.filter((term) => haystack.includes(term)).length;
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

function graphBinding(graphReview, graph = {}) {
  const binding = {
    schema: 'ai-studio-os/creative-knowledge-retrieval-graph-binding@1',
    graphSnapshotFingerprint: text(graphReview.computedFingerprint),
    graphSourceBindingFingerprint: creativeKnowledgeGraphSourceBindingFingerprint(graph?.sourceBinding ?? {}),
    foundationSnapshotFingerprint: text(graph?.sourceBinding?.foundationSnapshotFingerprint),
    sourceGraphReviewReady: graphReview.reviewReady === true
  };
  return {
    ...binding,
    bindingFingerprint: fingerprintCreativeValue(binding)
  };
}

function itemContract(item = {}) {
  return {
    schema: item.schema,
    knowledgeId: item.knowledgeId,
    knowledgeFingerprint: item.knowledgeFingerprint,
    entry: item.entry,
    annotation: item.annotation,
    rank: item.rank,
    termMatches: item.termMatches,
    matchReasons: item.matchReasons,
    visibleConflictIds: item.visibleConflictIds,
    conflictsWithPrimaryIds: item.conflictsWithPrimaryIds,
    includedAsConflictContext: item.includedAsConflictContext === true,
    truth: item.truth
  };
}

function retrievalFingerprint({ query, graphBinding: binding, results, conflictContext, stats }) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-retrieval@1',
    query,
    graphBindingFingerprint: text(binding?.bindingFingerprint),
    results: results.map(itemContract),
    conflictContext: conflictContext.map(itemContract),
    stats
  });
}

function retrievalItem(node, { rank = null, termMatches = 0, matchReasons = [], visibleConflictIds = [], conflictsWithPrimaryIds = [], conflictContext = false } = {}) {
  return {
    schema: 'ai-studio-os/creative-knowledge-retrieval-item@1',
    knowledgeId: node.id,
    knowledgeFingerprint: node.knowledgeFingerprint,
    entry: node.entry,
    annotation: node.annotation,
    rank,
    termMatches,
    matchReasons: list(matchReasons),
    visibleConflictIds: list(visibleConflictIds),
    conflictsWithPrimaryIds: list(conflictsWithPrimaryIds),
    includedAsConflictContext: conflictContext,
    truth: {
      retrievedEvidenceOnly: true,
      retrievalRankIsCreativeAuthority: false,
      creativeDirectionSelected: false,
      productionApproved: false
    }
  };
}

function conflictCounterpart(edge, nodeId) {
  if (edge.type !== 'conflicts-with') return null;
  if (edge.fromId === nodeId) return edge.toId;
  if (edge.toId === nodeId) return edge.fromId;
  return null;
}

function queryEligible(node, query, asOfMs) {
  if (!visibleInProject(node, query.projectId)) return { eligible: false, reason: 'project-scope-mismatch', termMatches: 0 };
  if (!usableStatus(node)) return { eligible: false, reason: `status:${node?.annotation?.status ?? 'unknown'}`, termMatches: 0 };
  const fresh = freshness(node, asOfMs);
  if (!fresh.usable) return { eligible: false, reason: fresh.reason, termMatches: 0 };
  if (query.domains.length && !query.domains.includes(node.entry.domain)) return { eligible: false, reason: 'domain-filter', termMatches: 0 };
  if (query.kinds.length && !query.kinds.includes(node.entry.kind)) return { eligible: false, reason: 'kind-filter', termMatches: 0 };
  const matches = termMatchCount(node, query.terms);
  if (query.terms.length && matches === 0) return { eligible: false, reason: 'term-filter', termMatches: 0 };
  return { eligible: true, reason: null, termMatches: matches };
}

function conflictEligible(node, query, asOfMs) {
  if (!visibleInProject(node, query.projectId)) return { eligible: false, reason: 'project-scope-mismatch' };
  if (!usableStatus(node)) return { eligible: false, reason: `status:${node?.annotation?.status ?? 'unknown'}` };
  const fresh = freshness(node, asOfMs);
  return fresh.usable ? { eligible: true, reason: null } : { eligible: false, reason: fresh.reason };
}

function stablePrimarySort(left, right) {
  const leftStatus = left.node.annotation.status === 'active' ? 0 : 1;
  const rightStatus = right.node.annotation.status === 'active' ? 0 : 1;
  if (leftStatus !== rightStatus) return leftStatus - rightStatus;
  if (left.termMatches !== right.termMatches) return right.termMatches - left.termMatches;
  return left.node.id.localeCompare(right.node.id);
}

export function reviewCreativeKnowledgeRetrieval(retrieval = {}) {
  const findings = [];
  const query = normalizeQuery(retrieval?.query ?? {});
  const asOfMs = parseInstant(query.asOf);
  const binding = retrieval?.graphBinding && typeof retrieval.graphBinding === 'object' ? retrieval.graphBinding : {};
  const results = Array.isArray(retrieval?.results) ? retrieval.results : [];
  const conflictContext = Array.isArray(retrieval?.conflictContext) ? retrieval.conflictContext : [];
  const stats = retrieval?.stats && typeof retrieval.stats === 'object' ? retrieval.stats : {};
  const computedFingerprint = retrievalFingerprint({ query, graphBinding: binding, results, conflictContext, stats });
  const resultIds = results.map((item) => text(item?.knowledgeId));
  const conflictIds = conflictContext.map((item) => text(item?.knowledgeId));

  if (retrieval?.schema !== 'ai-studio-os/creative-knowledge-retrieval@1') findings.push(finding('blocker', 'creative-knowledge-retrieval-schema-invalid', 'Creative Knowledge retrieval requires creative-knowledge-retrieval@1.'));
  if (!query.projectId) findings.push(finding('blocker', 'creative-knowledge-retrieval-project-missing', 'Retrieval must be bound to a project identity.'));
  if (asOfMs === null) findings.push(finding('blocker', 'creative-knowledge-retrieval-as-of-invalid', 'Retrieval requires an explicit timezone-qualified asOf timestamp so freshness is deterministic.'));
  if (!query.purpose) findings.push(finding('major', 'creative-knowledge-retrieval-purpose-missing', 'Retrieval should state the project reasoning purpose it is serving.'));
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
  if (text(retrieval?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-knowledge-retrieval-fingerprint-mismatch', 'Retrieval snapshot fingerprint must bind the exact query and isolated evidence payload.', { expected: computedFingerprint, actual: retrieval?.snapshotFingerprint ?? null }));
  if (new Set(resultIds).size !== resultIds.length || resultIds.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-retrieval-result-id-invalid', 'Primary retrieval result IDs must be non-empty and unique.', { resultIds }));
  if (new Set(conflictIds).size !== conflictIds.length || conflictIds.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-retrieval-conflict-id-invalid', 'Conflict-context result IDs must be non-empty and unique.', { conflictIds }));
  if (conflictIds.some((id) => resultIds.includes(id))) findings.push(finding('blocker', 'creative-knowledge-retrieval-primary-conflict-duplicate', 'A knowledge item cannot appear in both primary results and conflict context.', { resultIds, conflictIds }));

  const inspectItem = (item, index, isConflict) => {
    if (item?.schema !== 'ai-studio-os/creative-knowledge-retrieval-item@1') findings.push(finding('blocker', 'creative-knowledge-retrieval-item-schema-invalid', 'Retrieval items require creative-knowledge-retrieval-item@1.', { knowledgeId: item?.knowledgeId ?? null }));
    const knowledgeReview = reviewCreativeKnowledgeEntry(item?.entry ?? {});
    if (!knowledgeReview.reviewReady) findings.push(finding(knowledgeReview.pass ? 'major' : 'blocker', 'creative-knowledge-retrieval-item-knowledge-not-ready', 'Every retrieved item must carry freshly reviewable Creative Knowledge.', { knowledgeId: item?.knowledgeId ?? null, findingCodes: knowledgeReview.findings.map((entry) => entry.code) }));
    if (text(item?.knowledgeId) !== text(knowledgeReview.normalizedEntry?.id)) findings.push(finding('blocker', 'creative-knowledge-retrieval-item-id-drift', 'Retrieval item ID must match its exact embedded knowledge contract.', { knowledgeId: item?.knowledgeId ?? null }));
    if (!visibleInProject({ entry: knowledgeReview.normalizedEntry }, query.projectId)) findings.push(finding('blocker', 'creative-knowledge-retrieval-project-scope-leak', 'Project retrieval payload cannot contain knowledge scoped to a different project.', { knowledgeId: item?.knowledgeId ?? null }));
    if (!['active', 'disputed'].includes(item?.annotation?.status)) findings.push(finding('blocker', 'creative-knowledge-retrieval-status-invalid', 'Retrieved evidence must be active or disputed; superseded/deprecated evidence stays out of project payloads.', { knowledgeId: item?.knowledgeId ?? null, status: item?.annotation?.status ?? null }));
    if (asOfMs !== null) {
      const fresh = freshness({ entry: knowledgeReview.normalizedEntry, annotation: item?.annotation ?? {} }, asOfMs);
      if (!fresh.usable) findings.push(finding('blocker', 'creative-knowledge-retrieval-stale-evidence', 'Retrieved evidence must satisfy the explicit asOf freshness boundary.', { knowledgeId: item?.knowledgeId ?? null, reason: fresh.reason }));
    }
    if (!isConflict) {
      if (item?.rank !== index + 1) findings.push(finding('major', 'creative-knowledge-retrieval-rank-gap', 'Primary retrieval ranks must be contiguous and deterministic.', { knowledgeId: item?.knowledgeId ?? null, expected: index + 1, actual: item?.rank ?? null }));
      if (query.domains.length && !query.domains.includes(knowledgeReview.normalizedEntry?.domain)) findings.push(finding('blocker', 'creative-knowledge-retrieval-domain-filter-drift', 'Primary result violates the declared domain filter.', { knowledgeId: item?.knowledgeId ?? null }));
      if (query.kinds.length && !query.kinds.includes(knowledgeReview.normalizedEntry?.kind)) findings.push(finding('blocker', 'creative-knowledge-retrieval-kind-filter-drift', 'Primary result violates the declared kind filter.', { knowledgeId: item?.knowledgeId ?? null }));
      if (query.terms.length && termMatchCount({ entry: knowledgeReview.normalizedEntry }, query.terms) === 0) findings.push(finding('blocker', 'creative-knowledge-retrieval-term-filter-drift', 'Primary result does not match any declared retrieval term.', { knowledgeId: item?.knowledgeId ?? null }));
    } else {
      if (item?.rank !== null) findings.push(finding('major', 'creative-knowledge-retrieval-conflict-ranked', 'Conflict context is preserved evidence, not a ranked primary result.', { knowledgeId: item?.knowledgeId ?? null }));
      const linkedPrimary = list(item?.conflictsWithPrimaryIds);
      if (!linkedPrimary.length || linkedPrimary.some((id) => !resultIds.includes(id))) findings.push(finding('blocker', 'creative-knowledge-retrieval-conflict-primary-ref-invalid', 'Conflict context must identify at least one visible primary result it conflicts with.', { knowledgeId: item?.knowledgeId ?? null, conflictsWithPrimaryIds: linkedPrimary }));
    }
    const claims = authorityClaims(item);
    if (claims.length) findings.push(finding('blocker', 'creative-knowledge-retrieval-item-authority-fabricated', 'Retrieved evidence and rank cannot declare creative or production authority.', { knowledgeId: item?.knowledgeId ?? null, claims }));
  };

  results.forEach((item, index) => inspectItem(item, index, false));
  conflictContext.forEach((item, index) => inspectItem(item, index, true));

  const claims = authorityClaims(retrieval);
  if (claims.length) findings.push(finding('blocker', 'creative-knowledge-retrieval-authority-fabricated', 'Retrieval output is advisory evidence and cannot select Creative Direction or production.', { claims }));

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
      explicitAsOfRequired: true,
      staleTrendEvidenceExcluded: true,
      crossProjectEvidenceExcluded: true,
      conflictContextIsUnranked: true,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeKnowledgeRetrieval({
  graph,
  projectId,
  asOf,
  purpose,
  domains = [],
  kinds = [],
  terms = [],
  limit = 10
} = {}) {
  const graphReview = reviewCreativeKnowledgeGraph(graph ?? {});
  const query = normalizeQuery({ projectId, asOf, purpose, domains, kinds, terms, limit });
  const asOfMs = parseInstant(query.asOf);
  const nodes = graphReview.nodes ?? [];
  const edges = graphReview.edges ?? [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const exclusionCounts = {};
  const candidates = [];
  for (const node of nodes) {
    const eligibility = queryEligible(node, query, asOfMs);
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
  const conflictContextById = new Map();
  let redactedConflictCount = 0;
  let unavailableConflictCount = 0;

  for (const selectedItem of selected) {
    const primaryId = selectedItem.node.id;
    const visibleIds = new Set();
    for (const edge of edges) {
      const counterpartId = conflictCounterpart(edge, primaryId);
      if (!counterpartId) continue;
      const counterpart = nodeById.get(counterpartId);
      if (!counterpart) continue;
      const eligibility = conflictEligible(counterpart, query, asOfMs);
      if (!eligibility.eligible) {
        if (eligibility.reason === 'project-scope-mismatch') redactedConflictCount += 1;
        else unavailableConflictCount += 1;
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
    visibleConflictIds: visibleConflictsByPrimary.get(selectedItem.node.id) ?? []
  }));

  const conflictContext = [...conflictContextById.values()]
    .sort((a, b) => a.node.id.localeCompare(b.node.id))
    .map((item) => retrievalItem(item.node, {
      rank: null,
      conflictsWithPrimaryIds: [...item.primaryIds].sort(),
      conflictContext: true,
      matchReasons: ['explicit-conflict-context']
    }));

  const stats = {
    graphNodeCount: nodes.length,
    primaryResultCount: results.length,
    conflictContextCount: conflictContext.length,
    excludedCounts: Object.fromEntries(Object.entries(exclusionCounts).sort(([a], [b]) => a.localeCompare(b))),
    redactedConflictCount,
    unavailableConflictCount
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
    truth: {
      knowledgeOnly: true,
      retrievalRankIsCreativeAuthority: false,
      conflictEvidencePreserved: true,
      crossProjectEvidenceRedactedBeforePayload: true,
      productionApproved: false
    }
  };
  const review = reviewCreativeKnowledgeRetrieval(retrieval);
  const findings = [...review.findings];
  if (!graphReview.reviewReady) findings.push(finding('blocker', 'creative-knowledge-retrieval-graph-not-ready', 'Retrieval requires a structurally review-ready Creative Knowledge Graph.', { findingCodes: graphReview.findings.map((item) => item.code) }));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    ...retrieval,
    review: { ...review, findings },
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-advisory-retrieval',
    findings,
    truth: { ...retrieval.truth, ...review.truth }
  };
}

export function creativeKnowledgeRetrievalFingerprint(retrieval = {}) {
  return retrievalFingerprint({
    query: normalizeQuery(retrieval.query ?? {}),
    graphBinding: retrieval.graphBinding ?? {},
    results: Array.isArray(retrieval.results) ? retrieval.results : [],
    conflictContext: Array.isArray(retrieval.conflictContext) ? retrieval.conflictContext : [],
    stats: retrieval.stats ?? {}
  });
}

export function creativeKnowledgeRetrievalContract(retrieval = {}) {
  return {
    schema: retrieval.schema,
    query: normalizeQuery(retrieval.query ?? {}),
    graphBinding: retrieval.graphBinding,
    results: (retrieval.results ?? []).map(itemContract),
    conflictContext: (retrieval.conflictContext ?? []).map(itemContract),
    stats: retrieval.stats,
    snapshotFingerprint: retrieval.snapshotFingerprint,
    truth: retrieval.truth
  };
}
