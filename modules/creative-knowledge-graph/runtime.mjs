import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import {
  CREATIVE_RELATIONSHIP_TYPES,
  reviewCreativeIntelligenceFoundation,
  reviewCreativeKnowledgeEntry
} from '../creative-intelligence-foundation/runtime.mjs';

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

function unknownKeys(object, allowed) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return [];
  const allowedSet = new Set(allowed);
  return Object.keys(object).filter((key) => !allowedSet.has(key)).sort();
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

export const CREATIVE_GRAPH_NODE_STATUSES = Object.freeze([
  'active', 'disputed', 'superseded', 'deprecated'
]);

export const CREATIVE_GRAPH_EDGE_TYPES = Object.freeze([
  ...CREATIVE_RELATIONSHIP_TYPES,
  'supersedes'
]);

const NODE_STATUS_SET = new Set(CREATIVE_GRAPH_NODE_STATUSES);
const GRAPH_EDGE_TYPE_SET = new Set(CREATIVE_GRAPH_EDGE_TYPES);
const ANNOTATION_KEYS = Object.freeze(['status', 'statusReason', 'freshUntil', 'supersededBy', 'representationNotes', 'evidenceRefs']);
const SUPPLEMENTAL_EDGE_KEYS = Object.freeze(['id', 'type', 'fromId', 'toId', 'rationale', 'evidenceRefs']);
const NODE_KEYS = Object.freeze(['schema', 'id', 'knowledgeFingerprint', 'entry', 'annotation', 'truth']);
const EDGE_KEYS = Object.freeze(['schema', 'id', 'type', 'fromId', 'toId', 'rationale', 'evidenceRefs', 'origin', 'truth']);
const SOURCE_BINDING_KEYS = Object.freeze(['schema', 'foundationSnapshotFingerprint', 'knowledgeLibraryFingerprint', 'sourceFoundationReviewReady', 'bindingFingerprint']);
const GRAPH_KEYS = Object.freeze(['schema', 'stage', 'sourceBinding', 'nodes', 'edges', 'snapshotFingerprint', 'truth', 'findings', 'pass', 'reviewReady', 'status']);

function canonicalGraphTruth() {
  return {
    knowledgeOnly: true,
    graphIsCreativeAuthority: false,
    retrievalRankIsCreativeAuthority: false,
    representationProvenanceReferencesRequired: true,
    independentFoundationProvenanceRequired: true,
    productionApproved: false
  };
}

function canonicalNodeTruth() {
  return {
    knowledgeOnly: true,
    retrievalCandidateOnly: true,
    creativeAuthorityGranted: false,
    productionApproved: false
  };
}

function canonicalEdgeTruth() {
  return {
    relationIsAdvisory: true,
    creativeAuthorityGranted: false,
    productionApproved: false
  };
}

function normalizeAnnotation(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    status: text(source.status) || 'active',
    statusReason: text(source.statusReason),
    freshUntil: text(source.freshUntil) || null,
    supersededBy: text(source.supersededBy) || null,
    representationNotes: list(source.representationNotes),
    evidenceRefs: list(source.evidenceRefs)
  };
}

function normalizeSupplementalEdge(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    schema: 'ai-studio-os/creative-knowledge-graph-edge@1',
    id: text(source.id),
    type: text(source.type),
    fromId: text(source.fromId),
    toId: text(source.toId),
    rationale: text(source.rationale),
    evidenceRefs: list(source.evidenceRefs),
    origin: 'representation-lineage',
    truth: canonicalEdgeTruth()
  };
}

function entryContract(entry = {}) {
  const review = reviewCreativeKnowledgeEntry(entry);
  return review.normalizedEntry ?? null;
}

function knowledgeFingerprint(entry) {
  return fingerprintCreativeValue({ schema: 'ai-studio-os/creative-knowledge-entry@1', entry });
}

function normalizeNode(entry, annotation = {}) {
  const normalizedEntry = entryContract(entry);
  if (!normalizedEntry) return null;
  return {
    schema: 'ai-studio-os/creative-knowledge-graph-node@1',
    id: normalizedEntry.id,
    knowledgeFingerprint: knowledgeFingerprint(normalizedEntry),
    entry: normalizedEntry,
    annotation: normalizeAnnotation(annotation),
    truth: canonicalNodeTruth()
  };
}

function normalizedClaimedNode(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    schema: 'ai-studio-os/creative-knowledge-graph-node@1',
    id: text(source.id),
    knowledgeFingerprint: text(source.knowledgeFingerprint),
    entry: entryContract(source.entry),
    annotation: normalizeAnnotation(source.annotation),
    truth: canonicalNodeTruth()
  };
}

function normalizeEdge(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    schema: 'ai-studio-os/creative-knowledge-graph-edge@1',
    id: text(source.id),
    type: text(source.type),
    fromId: text(source.fromId),
    toId: text(source.toId),
    rationale: text(source.rationale),
    evidenceRefs: list(source.evidenceRefs),
    origin: text(source.origin),
    truth: canonicalEdgeTruth()
  };
}

function normalizeSourceBinding(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    schema: 'ai-studio-os/creative-knowledge-graph-source-binding@1',
    foundationSnapshotFingerprint: text(source.foundationSnapshotFingerprint),
    knowledgeLibraryFingerprint: text(source.knowledgeLibraryFingerprint),
    sourceFoundationReviewReady: source.sourceFoundationReviewReady === true,
    bindingFingerprint: text(source.bindingFingerprint)
  };
}

function sourceBindingFingerprint(binding = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-graph-source-binding@1',
    foundationSnapshotFingerprint: text(binding.foundationSnapshotFingerprint),
    knowledgeLibraryFingerprint: text(binding.knowledgeLibraryFingerprint),
    sourceFoundationReviewReady: binding.sourceFoundationReviewReady === true
  });
}

function nodeContract(node = {}) {
  return {
    schema: node.schema,
    id: node.id,
    knowledgeFingerprint: node.knowledgeFingerprint,
    entry: node.entry,
    annotation: node.annotation,
    truth: node.truth
  };
}

function edgeContract(edge = {}) {
  return {
    schema: edge.schema,
    id: edge.id,
    type: edge.type,
    fromId: edge.fromId,
    toId: edge.toId,
    rationale: edge.rationale,
    evidenceRefs: edge.evidenceRefs,
    origin: edge.origin,
    truth: edge.truth
  };
}

function graphFingerprint({ sourceBinding, nodes, edges }) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-graph@1',
    sourceBindingFingerprint: sourceBindingFingerprint(sourceBinding),
    nodes: nodes.map(nodeContract),
    edges: edges.map(edgeContract)
  });
}

function foundationEdgeId(fromId, type, toId) {
  return `foundation:${fromId}:${type}:${toId}`;
}

function foundationEdges(nodes = []) {
  const edges = [];
  for (const node of nodes) {
    for (const relationship of node?.entry?.relationships ?? []) {
      edges.push({
        schema: 'ai-studio-os/creative-knowledge-graph-edge@1',
        id: foundationEdgeId(node.id, relationship.type, relationship.targetId),
        type: relationship.type,
        fromId: node.id,
        toId: relationship.targetId,
        rationale: relationship.rationale,
        evidenceRefs: [node.entry.provenance?.sourceId].filter(Boolean),
        origin: 'foundation-relationship',
        truth: canonicalEdgeTruth()
      });
    }
  }
  return edges;
}

function expectedFoundationEdges(nodes) {
  return foundationEdges(nodes).map(normalizeEdge).sort((a, b) => a.id.localeCompare(b.id));
}

export function reviewCreativeKnowledgeGraph(graph = {}) {
  const findings = [];
  const rawNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const rawEdges = Array.isArray(graph?.edges) ? graph.edges : [];
  const rawSourceBinding = graph?.sourceBinding && typeof graph.sourceBinding === 'object' ? graph.sourceBinding : {};
  const nodes = rawNodes.map(normalizedClaimedNode);
  const edges = rawEdges.map(normalizeEdge);
  const sourceBinding = normalizeSourceBinding(rawSourceBinding);
  const nodeIds = nodes.map((node) => node.id);
  const edgeIds = edges.map((edge) => edge.id);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const computedFingerprint = graphFingerprint({ sourceBinding, nodes, edges });

  if (graph?.schema !== 'ai-studio-os/creative-knowledge-graph@1') findings.push(finding('blocker', 'creative-knowledge-graph-schema-invalid', 'Creative Knowledge Graph requires creative-knowledge-graph@1.'));
  if (graph?.stage !== 'creative-knowledge-representation') findings.push(finding('blocker', 'creative-knowledge-graph-stage-invalid', 'Creative Knowledge Graph requires the canonical representation stage.'));
  const graphUnknownKeys = unknownKeys(graph, GRAPH_KEYS);
  if (graphUnknownKeys.length) findings.push(finding('blocker', 'creative-knowledge-graph-shape-invalid', 'Graph top level may contain only canonical artifact and derived review fields.', { unknownKeys: graphUnknownKeys }));
  if (!sameValue(graph?.truth ?? {}, canonicalGraphTruth())) findings.push(finding('blocker', 'creative-knowledge-graph-truth-drift', 'Graph truth boundary is fixed and cannot carry hidden or permissive fields.'));

  if (!nodes.length) findings.push(finding('major', 'creative-knowledge-graph-empty', 'Creative Knowledge Graph requires at least one qualified node.'));
  if (nodeIds.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-graph-node-id-missing', 'Every graph node requires a stable knowledge ID.'));
  if (new Set(nodeIds).size !== nodeIds.length) findings.push(finding('blocker', 'creative-knowledge-graph-node-id-duplicate', 'Graph node IDs must be unique.', { nodeIds }));
  if (edgeIds.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-id-missing', 'Every graph edge requires a stable ID.'));
  if (new Set(edgeIds).size !== edgeIds.length) findings.push(finding('blocker', 'creative-knowledge-graph-edge-id-duplicate', 'Graph edge IDs must be unique.', { edgeIds }));

  if (rawSourceBinding?.schema !== 'ai-studio-os/creative-knowledge-graph-source-binding@1') findings.push(finding('blocker', 'creative-knowledge-graph-source-binding-schema-invalid', 'Graph requires a canonical Foundation source binding.'));
  const sourceBindingUnknownKeys = unknownKeys(rawSourceBinding, SOURCE_BINDING_KEYS);
  if (sourceBindingUnknownKeys.length) findings.push(finding('blocker', 'creative-knowledge-graph-source-binding-shape-invalid', 'Graph source binding may contain only canonical compact receipt fields.', { unknownKeys: sourceBindingUnknownKeys }));
  if (!isSha256(sourceBinding.foundationSnapshotFingerprint) || !isSha256(sourceBinding.knowledgeLibraryFingerprint)) findings.push(finding('blocker', 'creative-knowledge-graph-source-fingerprint-invalid', 'Graph source binding requires Foundation and knowledge-library SHA-256 fingerprints.'));
  if (sourceBinding.sourceFoundationReviewReady !== true) findings.push(finding('blocker', 'creative-knowledge-graph-source-not-ready', 'Graph cannot use a Foundation that failed fresh source review.'));
  if (sourceBinding.bindingFingerprint !== sourceBindingFingerprint(sourceBinding)) findings.push(finding('blocker', 'creative-knowledge-graph-source-binding-drift', 'Graph source binding fingerprint must match its exact source receipt.'));
  const sourceBindingClaims = authorityClaims(rawSourceBinding);
  if (sourceBindingClaims.length) findings.push(finding('blocker', 'creative-knowledge-graph-source-binding-authority-fabricated', 'Source binding proves no creative authority.', { claims: sourceBindingClaims }));
  if (text(graph?.snapshotFingerprint) !== computedFingerprint) findings.push(finding('blocker', 'creative-knowledge-graph-fingerprint-mismatch', 'Graph snapshot fingerprint must bind exact normalized nodes, edges and source binding.', { expected: computedFingerprint, actual: graph?.snapshotFingerprint ?? null }));

  rawNodes.forEach((rawNode, index) => {
    const node = nodes[index];
    const nodeId = node?.id || text(rawNode?.id) || null;
    if (rawNode?.schema !== 'ai-studio-os/creative-knowledge-graph-node@1') findings.push(finding('blocker', 'creative-knowledge-graph-node-schema-invalid', 'Graph nodes require creative-knowledge-graph-node@1.', { nodeId, schema: rawNode?.schema ?? null }));
    const nodeUnknownKeys = unknownKeys(rawNode, NODE_KEYS);
    if (nodeUnknownKeys.length) findings.push(finding('blocker', 'creative-knowledge-graph-node-shape-invalid', 'Graph node may contain only canonical representation fields.', { nodeId, unknownKeys: nodeUnknownKeys }));
    const annotationUnknownKeys = unknownKeys(rawNode?.annotation, ANNOTATION_KEYS);
    if (annotationUnknownKeys.length) findings.push(finding('blocker', 'creative-knowledge-graph-annotation-shape-invalid', 'Graph annotation may contain only canonical representation fields.', { nodeId, unknownKeys: annotationUnknownKeys }));

    const knowledgeReview = reviewCreativeKnowledgeEntry(rawNode?.entry ?? {});
    if (!knowledgeReview.reviewReady) findings.push(finding(knowledgeReview.pass ? 'major' : 'blocker', 'creative-knowledge-graph-node-entry-not-ready', 'Every graph node must carry a freshly reviewable knowledge contract.', { nodeId, findingCodes: knowledgeReview.findings.map((item) => item.code) }));
    if (!node.entry || !sameValue(rawNode?.entry ?? {}, node.entry)) findings.push(finding('blocker', 'creative-knowledge-graph-node-entry-contract-drift', 'Graph node must carry the exact normalized Creative Knowledge contract with no hidden caller fields.', { nodeId }));
    if (node.id !== node.entry?.id) findings.push(finding('blocker', 'creative-knowledge-graph-node-id-drift', 'Graph node ID must equal its embedded Creative Knowledge ID.', { nodeId, knowledgeId: node.entry?.id ?? null }));
    const expectedKnowledgeFingerprint = node.entry ? knowledgeFingerprint(node.entry) : null;
    if (!expectedKnowledgeFingerprint || text(rawNode?.knowledgeFingerprint) !== expectedKnowledgeFingerprint) findings.push(finding('blocker', 'creative-knowledge-graph-node-fingerprint-mismatch', 'Node knowledge fingerprint must bind exact embedded knowledge.', { nodeId }));
    if (!sameValue(rawNode?.annotation ?? {}, node.annotation)) findings.push(finding('blocker', 'creative-knowledge-graph-annotation-contract-drift', 'Graph annotation must equal its exact normalized contract.', { nodeId }));
    if (!sameValue(rawNode?.truth ?? {}, canonicalNodeTruth())) findings.push(finding('blocker', 'creative-knowledge-graph-node-truth-drift', 'Graph node truth boundary is fixed and cannot be extended or weakened.', { nodeId }));

    if (!NODE_STATUS_SET.has(node.annotation.status)) findings.push(finding('blocker', 'creative-knowledge-graph-node-status-invalid', 'Graph node requires a supported representation status.', { nodeId, status: node.annotation.status }));
    if (node.annotation.status !== 'active' && !node.annotation.statusReason) findings.push(finding('major', 'creative-knowledge-graph-node-status-reason-missing', 'Non-active graph nodes require an explicit status reason.', { nodeId, status: node.annotation.status }));
    if (node.annotation.status !== 'active' && !node.annotation.evidenceRefs.length) findings.push(finding('blocker', 'creative-knowledge-graph-node-status-evidence-missing', 'Non-active representation status must retain at least one evidence/provenance reference.', { nodeId, status: node.annotation.status }));
    if (node.annotation.status === 'superseded' && !node.annotation.supersededBy) findings.push(finding('blocker', 'creative-knowledge-graph-superseded-target-missing', 'Superseded nodes must identify the replacement knowledge ID.', { nodeId }));
    if (node.annotation.supersededBy && !nodeById.has(node.annotation.supersededBy)) findings.push(finding('blocker', 'creative-knowledge-graph-superseded-target-invalid', 'supersededBy must resolve in the same graph snapshot.', { nodeId, supersededBy: node.annotation.supersededBy }));
    if (node.annotation.freshUntil && parseInstant(node.annotation.freshUntil) === null) findings.push(finding('blocker', 'creative-knowledge-graph-fresh-until-invalid', 'freshUntil must be timezone-qualified when supplied.', { nodeId }));
    if (node.annotation.freshUntil && !node.annotation.evidenceRefs.length) findings.push(finding('blocker', 'creative-knowledge-graph-freshness-evidence-missing', 'An explicit freshness boundary must retain at least one evidence/policy reference.', { nodeId }));

    if (node.entry?.kind === 'current-trend') {
      const capturedAt = parseInstant(node.entry.provenance?.capturedAt);
      const freshUntil = parseInstant(node.annotation.freshUntil);
      if (capturedAt === null) findings.push(finding('blocker', 'creative-knowledge-graph-trend-captured-at-missing', 'Current-trend knowledge requires an explicit timezone-qualified provenance capturedAt timestamp.', { nodeId }));
      if (freshUntil === null) findings.push(finding('blocker', 'creative-knowledge-graph-trend-fresh-until-missing', 'Current-trend graph nodes require an explicit timezone-qualified freshUntil boundary.', { nodeId }));
      if (capturedAt !== null && freshUntil !== null && freshUntil < capturedAt) findings.push(finding('blocker', 'creative-knowledge-graph-trend-freshness-window-invalid', 'Current-trend freshUntil cannot precede provenance capturedAt.', { nodeId }));
    }

    const claims = [...authorityClaims(rawNode), ...authorityClaims(rawNode?.entry ?? {}), ...authorityClaims(rawNode?.annotation ?? {})];
    if (claims.length) findings.push(finding('blocker', 'creative-knowledge-graph-node-authority-fabricated', 'Graph nodes and embedded knowledge are advisory representation, not creative authority.', { nodeId, claims: [...new Set(claims)] }));
  });

  rawEdges.forEach((rawEdge, index) => {
    const edge = edges[index];
    const edgeId = edge?.id || text(rawEdge?.id) || null;
    if (rawEdge?.schema !== 'ai-studio-os/creative-knowledge-graph-edge@1') findings.push(finding('blocker', 'creative-knowledge-graph-edge-schema-invalid', 'Graph edges require creative-knowledge-graph-edge@1.', { edgeId, schema: rawEdge?.schema ?? null }));
    const edgeUnknownKeys = unknownKeys(rawEdge, EDGE_KEYS);
    if (edgeUnknownKeys.length) findings.push(finding('blocker', 'creative-knowledge-graph-edge-shape-invalid', 'Graph edge may contain only canonical relation fields.', { edgeId, unknownKeys: edgeUnknownKeys }));
    if (!sameValue(rawEdge, edge)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-contract-drift', 'Graph edge must equal the exact normalized advisory relation contract.', { edgeId }));
    if (!GRAPH_EDGE_TYPE_SET.has(edge.type)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-type-invalid', 'Graph edge uses an unsupported relation type.', { edgeId, type: edge.type }));
    if (!nodeById.has(edge.fromId) || !nodeById.has(edge.toId)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-target-invalid', 'Every graph edge endpoint must resolve in the same snapshot.', { edgeId, fromId: edge.fromId, toId: edge.toId }));
    if (edge.fromId && edge.fromId === edge.toId) findings.push(finding('major', 'creative-knowledge-graph-self-edge', 'Graph edges should not relate a knowledge node to itself.', { edgeId }));
    if (!edge.rationale) findings.push(finding('major', 'creative-knowledge-graph-edge-rationale-missing', 'Every graph relation requires an explicit rationale.', { edgeId }));
    if (!['foundation-relationship', 'representation-lineage'].includes(edge.origin)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-origin-invalid', 'Graph edge must declare its canonical origin.', { edgeId, origin: edge.origin }));
    if (edge.origin === 'representation-lineage' && edge.type !== 'supersedes') findings.push(finding('blocker', 'creative-knowledge-graph-lineage-edge-type-invalid', 'V1 representation-lineage edges are limited to supersedes.', { edgeId, type: edge.type }));
    if (edge.origin === 'representation-lineage' && !edge.evidenceRefs.length) findings.push(finding('major', 'creative-knowledge-graph-lineage-evidence-missing', 'Supersession lineage requires evidence/provenance references.', { edgeId }));
    const claims = authorityClaims(rawEdge);
    if (claims.length) findings.push(finding('blocker', 'creative-knowledge-graph-edge-authority-fabricated', 'Graph relations are advisory evidence, not creative authority.', { edgeId, claims }));
  });

  const claimedFoundationEdges = edges.filter((edge) => edge.origin === 'foundation-relationship').sort((a, b) => a.id.localeCompare(b.id));
  const expectedEdges = expectedFoundationEdges(nodes);
  if (!sameValue(claimedFoundationEdges, expectedEdges)) findings.push(finding('blocker', 'creative-knowledge-graph-foundation-edge-drift', 'Foundation relationship edges must be exactly reconstructed from embedded knowledge.'));

  const lineageByTarget = new Map();
  for (const edge of edges.filter((item) => item.origin === 'representation-lineage' && item.type === 'supersedes')) {
    const target = nodeById.get(edge.toId);
    if (!target || target.annotation.status !== 'superseded' || target.annotation.supersededBy !== edge.fromId) findings.push(finding('blocker', 'creative-knowledge-graph-lineage-status-mismatch', 'A supersedes edge must agree with target status and supersededBy identity.', { edgeId: edge.id }));
    const existing = lineageByTarget.get(edge.toId) ?? [];
    existing.push(edge.id);
    lineageByTarget.set(edge.toId, existing);
  }
  for (const [targetId, edgeList] of lineageByTarget) {
    if (edgeList.length > 1) findings.push(finding('blocker', 'creative-knowledge-graph-lineage-ambiguous', 'A superseded node may have only one canonical replacement edge in V1.', { targetId, edgeIds: edgeList }));
  }
  for (const node of nodes.filter((item) => item.annotation.status === 'superseded')) {
    const lineage = edges.find((edge) => edge.origin === 'representation-lineage' && edge.type === 'supersedes' && edge.fromId === node.annotation.supersededBy && edge.toId === node.id);
    if (!lineage) findings.push(finding('blocker', 'creative-knowledge-graph-supersession-edge-missing', 'Every superseded node must have a matching replacement lineage edge.', { nodeId: node.id, supersededBy: node.annotation.supersededBy }));
  }

  const claims = authorityClaims(graph);
  if (claims.length) findings.push(finding('blocker', 'creative-knowledge-graph-authority-fabricated', 'Creative Knowledge Graph is advisory representation and cannot declare creative or production authority.', { claims }));

  const coreBlockers = findings.filter((item) => item.severity === 'blocker');
  const coreMajors = findings.filter((item) => item.severity === 'major');
  const expectedPass = coreBlockers.length === 0;
  const expectedReviewReady = coreBlockers.length === 0 && coreMajors.length === 0;
  const expectedStatus = coreBlockers.length ? 'blocked' : coreMajors.length ? 'provisional' : 'ready-as-advisory-knowledge-graph';
  if (Object.hasOwn(graph, 'pass') && graph.pass !== expectedPass) findings.push(finding('blocker', 'creative-knowledge-graph-pass-claim-drift', 'Cached graph pass flag must match fresh structural review.'));
  if (Object.hasOwn(graph, 'reviewReady') && graph.reviewReady !== expectedReviewReady) findings.push(finding('blocker', 'creative-knowledge-graph-ready-claim-drift', 'Cached graph reviewReady flag must match fresh structural review.'));
  if (Object.hasOwn(graph, 'status') && graph.status !== expectedStatus) findings.push(finding('blocker', 'creative-knowledge-graph-status-claim-drift', 'Cached graph status must match fresh structural review.', { expected: expectedStatus, actual: graph.status }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-knowledge-graph-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-advisory-knowledge-graph',
    findings,
    nodes,
    edges,
    computedFingerprint,
    truth: {
      graphIsCreativeAuthority: false,
      exactSnapshotBound: text(graph?.snapshotFingerprint) === computedFingerprint,
      topLevelShapeLocked: graphUnknownKeys.length === 0,
      topLevelTruthLocked: sameValue(graph?.truth ?? {}, canonicalGraphTruth()),
      rawContractsReviewedBeforeSanitization: true,
      foundationRelationshipsRecomputed: sameValue(claimedFoundationEdges, expectedEdges),
      representationProvenanceReferencesRequired: true,
      currentTrendFreshnessBounded: true,
      conflictsRemainExplicitRelations: true,
      independentFoundationProvenanceStillRequired: true,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeKnowledgeGraph({ foundation, nodeAnnotations = {}, supplementalEdges = [] } = {}) {
  const foundationReview = reviewCreativeIntelligenceFoundation(foundation ?? {});
  const annotations = nodeAnnotations && typeof nodeAnnotations === 'object' ? nodeAnnotations : {};
  const rawSupplementalEdges = Array.isArray(supplementalEdges) ? supplementalEdges : [];
  const sourceEntries = foundationReview.reviewReady ? (foundationReview.libraryReview?.entries ?? []) : [];
  const nodes = sourceEntries.map((entry) => normalizeNode(entry, annotations[entry.id]));

  const sourceBinding = {
    schema: 'ai-studio-os/creative-knowledge-graph-source-binding@1',
    foundationSnapshotFingerprint: foundationReview.computedFingerprint ?? '',
    knowledgeLibraryFingerprint: foundationReview.libraryReview?.computedFingerprint ?? '',
    sourceFoundationReviewReady: foundationReview.reviewReady === true
  };
  sourceBinding.bindingFingerprint = sourceBindingFingerprint(sourceBinding);

  const annotationInputIssues = [];
  const unknownAnnotationIds = Object.keys(annotations).filter((id) => !nodes.some((node) => node.id === id));
  for (const [id, annotation] of Object.entries(annotations)) {
    const extras = unknownKeys(annotation, ANNOTATION_KEYS);
    const claims = authorityClaims(annotation);
    if (extras.length || claims.length) annotationInputIssues.push({ id, unknownKeys: extras, authorityClaims: claims });
  }

  const supplementalInputIssues = rawSupplementalEdges.map((edge, index) => ({
    index,
    unknownKeys: unknownKeys(edge, SUPPLEMENTAL_EDGE_KEYS),
    authorityClaims: authorityClaims(edge)
  })).filter((issue) => issue.unknownKeys.length || issue.authorityClaims.length);
  const invalidSupplementalIndexes = new Set(supplementalInputIssues.map((issue) => issue.index));

  const baseEdges = foundationEdges(nodes).map(normalizeEdge);
  const lineageEdges = rawSupplementalEdges
    .filter((_, index) => !invalidSupplementalIndexes.has(index))
    .map(normalizeSupplementalEdge)
    .map(normalizeEdge);
  const edges = [...baseEdges, ...lineageEdges];

  const graph = {
    schema: 'ai-studio-os/creative-knowledge-graph@1',
    stage: 'creative-knowledge-representation',
    sourceBinding,
    nodes,
    edges,
    snapshotFingerprint: graphFingerprint({ sourceBinding, nodes, edges }),
    truth: canonicalGraphTruth()
  };

  const review = reviewCreativeKnowledgeGraph(graph);
  const findings = [...review.findings];
  if (!foundationReview.reviewReady) findings.push(finding('blocker', 'creative-knowledge-graph-foundation-not-ready', 'Graph construction requires a freshly review-ready Creative Intelligence Foundation. No Foundation-derived nodes were emitted.', { findingCodes: foundationReview.findings.map((item) => item.code) }));
  if (unknownAnnotationIds.length) findings.push(finding('blocker', 'creative-knowledge-graph-annotation-node-missing', 'Graph annotations may target only knowledge IDs present in the source Foundation.', { unknownAnnotationIds }));
  if (annotationInputIssues.length) findings.push(finding('blocker', 'creative-knowledge-graph-annotation-input-invalid', 'Graph annotation input may not carry unknown fields or authority-shaped claims.', { issues: annotationInputIssues }));
  if (supplementalInputIssues.length) findings.push(finding('blocker', 'creative-knowledge-graph-lineage-input-invalid', 'Supplemental lineage input may not carry unknown fields or authority-shaped claims.', { issues: supplementalInputIssues }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    ...graph,
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-advisory-knowledge-graph'
  };
}

export function creativeKnowledgeGraphSourceBindingFingerprint(binding = {}) {
  return sourceBindingFingerprint(binding);
}

export function creativeKnowledgeGraphFingerprint(graph = {}) {
  const nodes = (Array.isArray(graph.nodes) ? graph.nodes : []).map(normalizedClaimedNode);
  const edges = (Array.isArray(graph.edges) ? graph.edges : []).map(normalizeEdge);
  return graphFingerprint({ sourceBinding: normalizeSourceBinding(graph.sourceBinding ?? {}), nodes, edges });
}
