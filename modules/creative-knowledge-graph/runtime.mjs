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

function authorityClaims(object = {}) {
  const known = [
    'selected', 'approved', 'canonical', 'authorityGranted', 'humanApproved',
    'humanSelected', 'creativeDirectionSelected', 'creativeDirectionApproved',
    'productionApproved', 'technicalPlanningAuthorized'
  ];
  const claims = known.filter((key) => object?.[key] === true || object?.truth?.[key] === true);
  const status = text(object?.status).toLowerCase();
  if (['approved', 'selected', 'canonical', 'authoritative', 'production-ready', 'production-approved'].includes(status)) {
    claims.push(`status:${status}`);
  }
  return [...new Set(claims)];
}

export const CREATIVE_GRAPH_NODE_STATUSES = Object.freeze([
  'active',
  'disputed',
  'superseded',
  'deprecated'
]);

export const CREATIVE_GRAPH_EDGE_TYPES = Object.freeze([
  ...CREATIVE_RELATIONSHIP_TYPES,
  'supersedes'
]);

const NODE_STATUS_SET = new Set(CREATIVE_GRAPH_NODE_STATUSES);
const FOUNDATION_EDGE_TYPE_SET = new Set(CREATIVE_RELATIONSHIP_TYPES);
const GRAPH_EDGE_TYPE_SET = new Set(CREATIVE_GRAPH_EDGE_TYPES);

function normalizeAnnotation(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    status: text(source.status) || 'active',
    statusReason: text(source.statusReason),
    freshUntil: text(source.freshUntil) || null,
    supersededBy: text(source.supersededBy) || null,
    representationNotes: list(source.representationNotes)
  };
}

function normalizeSupplementalEdge(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    id: text(source.id),
    type: text(source.type),
    fromId: text(source.fromId),
    toId: text(source.toId),
    rationale: text(source.rationale),
    evidenceRefs: list(source.evidenceRefs),
    origin: 'representation-lineage'
  };
}

function entryContract(entry = {}) {
  const review = reviewCreativeKnowledgeEntry(entry);
  return review.normalizedEntry ?? null;
}

function knowledgeFingerprint(entry) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-entry@1',
    entry
  });
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
    truth: {
      knowledgeOnly: true,
      retrievalCandidateOnly: true,
      creativeAuthorityGranted: false,
      productionApproved: false
    }
  };
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
        truth: {
          relationIsAdvisory: true,
          creativeAuthorityGranted: false,
          productionApproved: false
        }
      });
    }
  }
  return edges;
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
    truth: {
      relationIsAdvisory: true,
      creativeAuthorityGranted: false,
      productionApproved: false
    }
  };
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

function sourceBindingFingerprint(binding = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-graph-source-binding@1',
    foundationSnapshotFingerprint: text(binding.foundationSnapshotFingerprint),
    knowledgeLibraryFingerprint: text(binding.knowledgeLibraryFingerprint),
    sourceFoundationReviewReady: binding.sourceFoundationReviewReady === true
  });
}

function graphFingerprint({ sourceBinding, nodes, edges }) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-knowledge-graph@1',
    sourceBindingFingerprint: sourceBindingFingerprint(sourceBinding),
    nodes: nodes.map(nodeContract),
    edges: edges.map(edgeContract)
  });
}

function sameValue(left, right) {
  return fingerprintCreativeValue(left) === fingerprintCreativeValue(right);
}

function expectedFoundationEdges(nodes) {
  return foundationEdges(nodes).map(normalizeEdge).sort((a, b) => a.id.localeCompare(b.id));
}

export function reviewCreativeKnowledgeGraph(graph = {}) {
  const findings = [];
  const nodes = (Array.isArray(graph?.nodes) ? graph.nodes : []).map((node) => ({
    ...nodeContract(node),
    entry: entryContract(node?.entry),
    annotation: normalizeAnnotation(node?.annotation)
  }));
  const edges = (Array.isArray(graph?.edges) ? graph.edges : []).map(normalizeEdge);
  const nodeIds = nodes.map((node) => node.id);
  const edgeIds = edges.map((edge) => edge.id);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const sourceBinding = graph?.sourceBinding && typeof graph.sourceBinding === 'object' ? graph.sourceBinding : {};
  const computedFingerprint = graphFingerprint({ sourceBinding, nodes, edges });

  if (graph?.schema !== 'ai-studio-os/creative-knowledge-graph@1') {
    findings.push(finding('blocker', 'creative-knowledge-graph-schema-invalid', 'Creative Knowledge Graph requires creative-knowledge-graph@1.'));
  }
  if (!nodes.length) findings.push(finding('major', 'creative-knowledge-graph-empty', 'Creative Knowledge Graph requires at least one qualified node.'));
  if (nodeIds.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-graph-node-id-missing', 'Every graph node requires a stable knowledge ID.'));
  if (new Set(nodeIds).size !== nodeIds.length) findings.push(finding('blocker', 'creative-knowledge-graph-node-id-duplicate', 'Graph node IDs must be unique.', { nodeIds }));
  if (edgeIds.some((id) => !id)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-id-missing', 'Every graph edge requires a stable ID.'));
  if (new Set(edgeIds).size !== edgeIds.length) findings.push(finding('blocker', 'creative-knowledge-graph-edge-id-duplicate', 'Graph edge IDs must be unique.', { edgeIds }));

  if (sourceBinding?.schema !== 'ai-studio-os/creative-knowledge-graph-source-binding@1') {
    findings.push(finding('blocker', 'creative-knowledge-graph-source-binding-schema-invalid', 'Graph requires a canonical Foundation source binding.'));
  }
  if (!isSha256(sourceBinding?.foundationSnapshotFingerprint) || !isSha256(sourceBinding?.knowledgeLibraryFingerprint)) {
    findings.push(finding('blocker', 'creative-knowledge-graph-source-fingerprint-invalid', 'Graph source binding requires Foundation and knowledge-library SHA-256 fingerprints.'));
  }
  if (sourceBinding?.sourceFoundationReviewReady !== true) {
    findings.push(finding('blocker', 'creative-knowledge-graph-source-not-ready', 'Graph cannot be built from a Foundation that failed fresh source review.'));
  }
  if (text(sourceBinding?.bindingFingerprint) !== sourceBindingFingerprint(sourceBinding)) {
    findings.push(finding('blocker', 'creative-knowledge-graph-source-binding-drift', 'Graph source binding fingerprint must match its exact source receipt.'));
  }
  if (text(graph?.snapshotFingerprint) !== computedFingerprint) {
    findings.push(finding('blocker', 'creative-knowledge-graph-fingerprint-mismatch', 'Graph snapshot fingerprint must bind exact nodes, edges and source binding.', { expected: computedFingerprint, actual: graph?.snapshotFingerprint ?? null }));
  }

  for (const node of nodes) {
    if (!node.entry) {
      findings.push(finding('blocker', 'creative-knowledge-graph-node-entry-invalid', 'Graph node must contain a valid normalized Creative Knowledge entry.', { nodeId: node.id }));
      continue;
    }
    const knowledgeReview = reviewCreativeKnowledgeEntry(node.entry);
    if (!knowledgeReview.reviewReady) {
      findings.push(finding(knowledgeReview.pass ? 'major' : 'blocker', 'creative-knowledge-graph-node-entry-not-ready', 'Every graph node must carry a freshly reviewable knowledge contract.', { nodeId: node.id, findingCodes: knowledgeReview.findings.map((item) => item.code) }));
    }
    const expectedKnowledgeFingerprint = knowledgeFingerprint(node.entry);
    if (text(node.knowledgeFingerprint) !== expectedKnowledgeFingerprint) {
      findings.push(finding('blocker', 'creative-knowledge-graph-node-fingerprint-mismatch', 'Node knowledge fingerprint must bind the exact embedded knowledge contract.', { nodeId: node.id }));
    }
    if (!NODE_STATUS_SET.has(node.annotation.status)) {
      findings.push(finding('blocker', 'creative-knowledge-graph-node-status-invalid', 'Graph node requires a supported representation status.', { nodeId: node.id, status: node.annotation.status }));
    }
    if (node.annotation.status !== 'active' && !node.annotation.statusReason) {
      findings.push(finding('major', 'creative-knowledge-graph-node-status-reason-missing', 'Non-active graph nodes require an explicit status reason.', { nodeId: node.id, status: node.annotation.status }));
    }
    if (node.annotation.status === 'superseded' && !node.annotation.supersededBy) {
      findings.push(finding('blocker', 'creative-knowledge-graph-superseded-target-missing', 'Superseded nodes must identify the replacement knowledge ID.', { nodeId: node.id }));
    }
    if (node.annotation.supersededBy && !nodeById.has(node.annotation.supersededBy)) {
      findings.push(finding('blocker', 'creative-knowledge-graph-superseded-target-invalid', 'supersededBy must resolve to a node in the same graph snapshot.', { nodeId: node.id, supersededBy: node.annotation.supersededBy }));
    }

    if (node.entry.kind === 'current-trend') {
      const capturedAt = parseInstant(node.entry.provenance?.capturedAt);
      const freshUntil = parseInstant(node.annotation.freshUntil);
      if (capturedAt === null) findings.push(finding('blocker', 'creative-knowledge-graph-trend-captured-at-missing', 'Current-trend knowledge requires an explicit timezone-qualified provenance capturedAt timestamp.', { nodeId: node.id }));
      if (freshUntil === null) findings.push(finding('blocker', 'creative-knowledge-graph-trend-fresh-until-missing', 'Current-trend graph nodes require an explicit timezone-qualified freshUntil boundary.', { nodeId: node.id }));
      if (capturedAt !== null && freshUntil !== null && freshUntil < capturedAt) {
        findings.push(finding('blocker', 'creative-knowledge-graph-trend-freshness-window-invalid', 'Current-trend freshUntil cannot precede provenance capturedAt.', { nodeId: node.id }));
      }
    }

    const claims = authorityClaims(node);
    if (claims.length) findings.push(finding('blocker', 'creative-knowledge-graph-node-authority-fabricated', 'Graph nodes are knowledge representation, not creative authority.', { nodeId: node.id, claims }));
  }

  for (const edge of edges) {
    if (edge.schema !== 'ai-studio-os/creative-knowledge-graph-edge@1') findings.push(finding('blocker', 'creative-knowledge-graph-edge-schema-invalid', 'Graph edges require creative-knowledge-graph-edge@1.', { edgeId: edge.id }));
    if (!GRAPH_EDGE_TYPE_SET.has(edge.type)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-type-invalid', 'Graph edge uses an unsupported relation type.', { edgeId: edge.id, type: edge.type }));
    if (!nodeById.has(edge.fromId) || !nodeById.has(edge.toId)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-target-invalid', 'Every graph edge endpoint must resolve in the same snapshot.', { edgeId: edge.id, fromId: edge.fromId, toId: edge.toId }));
    if (edge.fromId && edge.fromId === edge.toId) findings.push(finding('major', 'creative-knowledge-graph-self-edge', 'Graph edges should not relate a knowledge node to itself.', { edgeId: edge.id }));
    if (!edge.rationale) findings.push(finding('major', 'creative-knowledge-graph-edge-rationale-missing', 'Every graph relation requires an explicit rationale.', { edgeId: edge.id }));
    if (!['foundation-relationship', 'representation-lineage'].includes(edge.origin)) findings.push(finding('blocker', 'creative-knowledge-graph-edge-origin-invalid', 'Graph edge must declare whether it came from Foundation knowledge or representation lineage.', { edgeId: edge.id, origin: edge.origin }));
    if (edge.origin === 'representation-lineage' && edge.type !== 'supersedes') findings.push(finding('blocker', 'creative-knowledge-graph-lineage-edge-type-invalid', 'V1 representation-lineage edges are limited to supersedes so graph storage cannot invent arbitrary creative relationships.', { edgeId: edge.id, type: edge.type }));
    if (edge.origin === 'representation-lineage' && !edge.evidenceRefs.length) findings.push(finding('major', 'creative-knowledge-graph-lineage-evidence-missing', 'Supersession lineage requires at least one provenance/evidence reference.', { edgeId: edge.id }));
    const claims = authorityClaims(edge);
    if (claims.length) findings.push(finding('blocker', 'creative-knowledge-graph-edge-authority-fabricated', 'Graph relations are advisory evidence, not creative authority.', { edgeId: edge.id, claims }));
  }

  const claimedFoundationEdges = edges.filter((edge) => edge.origin === 'foundation-relationship').sort((a, b) => a.id.localeCompare(b.id));
  const expectedEdges = expectedFoundationEdges(nodes);
  if (!sameValue(claimedFoundationEdges, expectedEdges)) {
    findings.push(finding('blocker', 'creative-knowledge-graph-foundation-edge-drift', 'Foundation relationship edges must be exactly reconstructed from embedded knowledge contracts; graph storage cannot add, omit or rewrite them.'));
  }

  for (const node of nodes.filter((item) => item.annotation.status === 'superseded')) {
    const lineage = edges.find((edge) => edge.origin === 'representation-lineage' && edge.type === 'supersedes' && edge.fromId === node.annotation.supersededBy && edge.toId === node.id);
    if (!lineage) findings.push(finding('blocker', 'creative-knowledge-graph-supersession-edge-missing', 'Every superseded node must have a matching replacement -> superseded lineage edge.', { nodeId: node.id, supersededBy: node.annotation.supersededBy }));
  }

  const claims = authorityClaims(graph);
  if (claims.length) findings.push(finding('blocker', 'creative-knowledge-graph-authority-fabricated', 'Creative Knowledge Graph is advisory representation and cannot declare creative or production authority.', { claims }));

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
      foundationRelationshipsRecomputed: sameValue(claimedFoundationEdges, expectedEdges),
      currentTrendFreshnessBounded: true,
      conflictsRemainExplicitRelations: true,
      rankingAuthorityGranted: false,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeKnowledgeGraph({
  foundation,
  nodeAnnotations = {},
  supplementalEdges = []
} = {}) {
  const foundationReview = reviewCreativeIntelligenceFoundation(foundation ?? {});
  const sourceEntries = foundationReview.libraryReview?.entries ?? [];
  const annotations = nodeAnnotations && typeof nodeAnnotations === 'object' ? nodeAnnotations : {};
  const nodes = sourceEntries.map((entry) => normalizeNode(entry, annotations[entry.id]));
  const sourceBinding = {
    schema: 'ai-studio-os/creative-knowledge-graph-source-binding@1',
    foundationSnapshotFingerprint: foundationReview.computedFingerprint ?? '',
    knowledgeLibraryFingerprint: foundationReview.libraryReview?.computedFingerprint ?? '',
    sourceFoundationReviewReady: foundationReview.reviewReady === true
  };
  sourceBinding.bindingFingerprint = sourceBindingFingerprint(sourceBinding);

  const baseEdges = foundationEdges(nodes).map(normalizeEdge);
  const lineageEdges = (Array.isArray(supplementalEdges) ? supplementalEdges : [])
    .map(normalizeSupplementalEdge)
    .map(normalizeEdge);
  const edges = [...baseEdges, ...lineageEdges];

  const unknownAnnotationIds = Object.keys(annotations).filter((id) => !nodes.some((node) => node.id === id));
  const graph = {
    schema: 'ai-studio-os/creative-knowledge-graph@1',
    stage: 'creative-knowledge-representation',
    sourceBinding,
    nodes,
    edges,
    buildDiagnostics: {
      unknownAnnotationIds
    },
    snapshotFingerprint: graphFingerprint({ sourceBinding, nodes, edges }),
    truth: {
      knowledgeOnly: true,
      graphIsCreativeAuthority: false,
      retrievalRankIsCreativeAuthority: false,
      productionApproved: false
    }
  };
  const review = reviewCreativeKnowledgeGraph(graph);
  const findings = [...review.findings];
  if (unknownAnnotationIds.length) {
    findings.push(finding('blocker', 'creative-knowledge-graph-annotation-node-missing', 'Graph annotations may target only knowledge IDs present in the source Foundation.', { unknownAnnotationIds }));
  }
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    ...graph,
    review: { ...review, findings },
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-as-advisory-knowledge-graph',
    findings,
    truth: { ...graph.truth, ...review.truth }
  };
}

export function creativeKnowledgeGraphSourceBindingFingerprint(binding = {}) {
  return sourceBindingFingerprint(binding);
}

export function creativeKnowledgeGraphFingerprint(graph = {}) {
  const nodes = (Array.isArray(graph.nodes) ? graph.nodes : []).map((node) => ({
    ...nodeContract(node),
    entry: entryContract(node.entry),
    annotation: normalizeAnnotation(node.annotation)
  }));
  const edges = (Array.isArray(graph.edges) ? graph.edges : []).map(normalizeEdge);
  return graphFingerprint({ sourceBinding: graph.sourceBinding ?? {}, nodes, edges });
}
