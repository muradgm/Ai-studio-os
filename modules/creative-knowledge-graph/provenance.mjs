import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeIntelligenceFoundation } from '../creative-intelligence-foundation/runtime.mjs';
import {
  creativeKnowledgeGraphSourceBindingFingerprint,
  reviewCreativeKnowledgeGraph
} from './runtime.mjs';
import {
  buildCreativeKnowledgeRetrieval,
  reviewCreativeKnowledgeRetrieval
} from './retrieval.mjs';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function sameValue(left, right) {
  return fingerprintCreativeValue(left) === fingerprintCreativeValue(right);
}

function graphReceipt(graphReview, foundationReview) {
  return {
    schema: 'ai-studio-os/creative-knowledge-graph-provenance-receipt@1',
    reviewReady: graphReview.reviewReady === true && foundationReview.reviewReady === true,
    graphSnapshotFingerprint: text(graphReview.computedFingerprint) || null,
    foundationSnapshotFingerprint: text(foundationReview.computedFingerprint) || null,
    knowledgeLibraryFingerprint: text(foundationReview.libraryReview?.computedFingerprint) || null,
    nodeCount: graphReview.nodes?.length ?? 0,
    edgeCount: graphReview.edges?.length ?? 0,
    truth: {
      receiptContainsFoundationKnowledge: false,
      receiptContainsGraphKnowledge: false,
      hashIsSignature: false,
      provenanceGrantsCreativeAuthority: false,
      productionApproved: false
    }
  };
}

export function reviewCreativeKnowledgeGraphProvenance({ graph, foundation } = {}) {
  const findings = [];
  const graphReview = reviewCreativeKnowledgeGraph(graph ?? {});
  const foundationReview = reviewCreativeIntelligenceFoundation(foundation ?? {});

  if (!graphReview.reviewReady) {
    findings.push(finding('blocker', 'creative-knowledge-graph-provenance-graph-not-ready', 'Independent graph provenance requires a structurally review-ready graph.', { findingCodes: graphReview.findings.map((item) => item.code) }));
  }
  if (!foundationReview.reviewReady) {
    findings.push(finding('blocker', 'creative-knowledge-graph-provenance-foundation-not-ready', 'Independent graph provenance requires the source Foundation to pass a fresh review.', { findingCodes: foundationReview.findings.map((item) => item.code) }));
  }

  const sourceBinding = graph?.sourceBinding ?? {};
  if (text(sourceBinding.foundationSnapshotFingerprint) !== text(foundationReview.computedFingerprint)) {
    findings.push(finding('blocker', 'creative-knowledge-graph-provenance-foundation-fingerprint-mismatch', 'Graph must bind the exact independently supplied Foundation snapshot.', {
      graphFoundationFingerprint: sourceBinding.foundationSnapshotFingerprint ?? null,
      suppliedFoundationFingerprint: foundationReview.computedFingerprint ?? null
    }));
  }
  if (text(sourceBinding.knowledgeLibraryFingerprint) !== text(foundationReview.libraryReview?.computedFingerprint)) {
    findings.push(finding('blocker', 'creative-knowledge-graph-provenance-library-fingerprint-mismatch', 'Graph must bind the exact knowledge-library snapshot of the independently supplied Foundation.', {
      graphLibraryFingerprint: sourceBinding.knowledgeLibraryFingerprint ?? null,
      suppliedLibraryFingerprint: foundationReview.libraryReview?.computedFingerprint ?? null
    }));
  }
  if (text(sourceBinding.bindingFingerprint) !== creativeKnowledgeGraphSourceBindingFingerprint(sourceBinding)) {
    findings.push(finding('blocker', 'creative-knowledge-graph-provenance-source-binding-drift', 'Graph source binding must remain internally exact before external provenance can be established.'));
  }

  const sourceEntries = foundationReview.libraryReview?.entries ?? [];
  const graphNodes = graphReview.nodes ?? [];
  const sourceById = new Map(sourceEntries.map((entry) => [entry.id, entry]));
  const graphById = new Map(graphNodes.map((node) => [node.id, node]));
  const sourceIds = [...sourceById.keys()].sort();
  const graphIds = [...graphById.keys()].sort();
  if (!sameValue(sourceIds, graphIds)) {
    findings.push(finding('blocker', 'creative-knowledge-graph-provenance-node-set-drift', 'Graph V1 must represent the exact source Foundation knowledge ID set; missing or injected nodes are not allowed.', { sourceIds, graphIds }));
  }

  for (const sourceEntry of sourceEntries) {
    const node = graphById.get(sourceEntry.id);
    if (!node) continue;
    if (!sameValue(node.entry, sourceEntry)) {
      findings.push(finding('blocker', 'creative-knowledge-graph-provenance-node-content-drift', 'Graph node content must exactly match the corresponding independently supplied Foundation knowledge contract.', { knowledgeId: sourceEntry.id }));
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-knowledge-graph-provenance-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'verified-advisory-graph-provenance',
    findings,
    sourceReceipt: graphReceipt(graphReview, foundationReview),
    truth: {
      sourceFoundationSuppliedSeparately: true,
      sourceFoundationFreshlyReviewed: foundationReview.reviewReady === true,
      exactNodeMembershipRecomputed: true,
      exactNodeContentRecomputed: true,
      hashIsSignature: false,
      provenanceGrantsCreativeAuthority: false,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

function retrievalPayload(retrieval = {}) {
  return {
    schema: retrieval.schema,
    query: retrieval.query,
    graphBinding: retrieval.graphBinding,
    results: retrieval.results,
    conflictContext: retrieval.conflictContext,
    stats: retrieval.stats,
    snapshotFingerprint: retrieval.snapshotFingerprint
  };
}

function retrievalReceipt(retrievalReview, graphProvenanceReview) {
  return {
    schema: 'ai-studio-os/creative-knowledge-retrieval-provenance-receipt@1',
    reviewReady: retrievalReview.reviewReady === true && graphProvenanceReview.reviewReady === true,
    retrievalSnapshotFingerprint: text(retrievalReview.computedFingerprint) || null,
    graphSnapshotFingerprint: graphProvenanceReview.sourceReceipt?.graphSnapshotFingerprint ?? null,
    foundationSnapshotFingerprint: graphProvenanceReview.sourceReceipt?.foundationSnapshotFingerprint ?? null,
    primaryResultCount: 0,
    conflictContextCount: 0,
    truth: {
      receiptContainsGraphKnowledge: false,
      receiptContainsFoundationKnowledge: false,
      retrievalRankIsCreativeAuthority: false,
      productionApproved: false
    }
  };
}

export function reviewCreativeKnowledgeRetrievalProvenance({ retrieval, graph, foundation } = {}) {
  const findings = [];
  const retrievalReview = reviewCreativeKnowledgeRetrieval(retrieval ?? {});
  const graphProvenanceReview = reviewCreativeKnowledgeGraphProvenance({ graph, foundation });

  if (!retrievalReview.reviewReady) {
    findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-retrieval-not-ready', 'Independent retrieval provenance requires a structurally review-ready isolated retrieval payload.', { findingCodes: retrievalReview.findings.map((item) => item.code) }));
  }
  if (!graphProvenanceReview.reviewReady) {
    findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-graph-not-verified', 'Retrieval provenance requires the source graph to be independently rebound to its supplied Foundation.', { findingCodes: graphProvenanceReview.findings.map((item) => item.code) }));
  }

  const binding = retrieval?.graphBinding ?? {};
  const graphReview = reviewCreativeKnowledgeGraph(graph ?? {});
  if (text(binding.graphSnapshotFingerprint) !== text(graphReview.computedFingerprint)) {
    findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-graph-fingerprint-mismatch', 'Retrieval must bind the exact graph supplied at the verification boundary.', {
      retrievalGraphFingerprint: binding.graphSnapshotFingerprint ?? null,
      suppliedGraphFingerprint: graphReview.computedFingerprint ?? null
    }));
  }
  if (text(binding.foundationSnapshotFingerprint) !== text(graph?.sourceBinding?.foundationSnapshotFingerprint)) {
    findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-foundation-binding-mismatch', 'Retrieval graph binding must preserve the graph source Foundation fingerprint.'));
  }

  const query = retrievalReview.normalizedQuery ?? {};
  const rebuilt = buildCreativeKnowledgeRetrieval({
    graph,
    projectId: query.projectId,
    asOf: query.asOf,
    purpose: query.purpose,
    domains: query.domains,
    kinds: query.kinds,
    terms: query.terms,
    limit: query.limit
  });
  if (!rebuilt.reviewReady) {
    findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-rebuild-not-ready', 'Retrieval could not be independently reconstructed from the supplied graph and exact query contract.', { findingCodes: rebuilt.findings.map((item) => item.code) }));
  } else if (!sameValue(retrievalPayload(retrieval), retrievalPayload(rebuilt))) {
    findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-result-drift', 'Claimed retrieval payload differs from the exact deterministic result rebuilt from the supplied graph and query.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const receipt = retrievalReceipt(retrievalReview, graphProvenanceReview);
  receipt.primaryResultCount = Array.isArray(retrieval?.results) ? retrieval.results.length : 0;
  receipt.conflictContextCount = Array.isArray(retrieval?.conflictContext) ? retrieval.conflictContext.length : 0;
  return {
    schema: 'ai-studio-os/creative-knowledge-retrieval-provenance-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'verified-advisory-retrieval-provenance',
    findings,
    sourceReceipt: receipt,
    truth: {
      deterministicRetrievalRecomputed: true,
      graphAndFoundationSuppliedSeparately: true,
      fullGraphExcludedFromReceipt: true,
      fullFoundationExcludedFromReceipt: true,
      retrievalRankIsCreativeAuthority: false,
      provenanceGrantsCreativeAuthority: false,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

export function buildCreativeKnowledgeRetrievalWithProvenance(input = {}) {
  const retrieval = buildCreativeKnowledgeRetrieval(input);
  const provenanceReview = reviewCreativeKnowledgeRetrievalProvenance({
    retrieval,
    graph: input.graph,
    foundation: input.foundation
  });
  return {
    ...retrieval,
    provenanceReview,
    provenanceReady: provenanceReview.reviewReady,
    truth: {
      ...(retrieval.truth ?? {}),
      independentGraphAndFoundationProvenanceRequired: true,
      independentGraphAndFoundationProvenanceSatisfied: provenanceReview.reviewReady,
      productionApproved: false
    }
  };
}
