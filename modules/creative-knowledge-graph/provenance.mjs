import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeIntelligenceFoundation } from '../creative-intelligence-foundation/runtime.mjs';
import {
  creativeKnowledgeGraphSourceBindingFingerprint,
  reviewCreativeKnowledgeGraph
} from './runtime.mjs';
import {
  buildCreativeKnowledgeRetrieval,
  creativeKnowledgeRetrievalContract,
  creativeKnowledgeRetrievalFingerprint,
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

  if (!graphReview.reviewReady) findings.push(finding('blocker', 'creative-knowledge-graph-provenance-graph-not-ready', 'Independent graph provenance requires a structurally review-ready graph.', { findingCodes: graphReview.findings.map((item) => item.code) }));
  if (!foundationReview.reviewReady) findings.push(finding('blocker', 'creative-knowledge-graph-provenance-foundation-not-ready', 'Independent graph provenance requires the source Foundation to pass a fresh review.', { findingCodes: foundationReview.findings.map((item) => item.code) }));

  const sourceBinding = graph?.sourceBinding ?? {};
  if (text(sourceBinding.foundationSnapshotFingerprint) !== text(foundationReview.computedFingerprint)) findings.push(finding('blocker', 'creative-knowledge-graph-provenance-foundation-fingerprint-mismatch', 'Graph must bind the exact independently supplied Foundation snapshot.'));
  if (text(sourceBinding.knowledgeLibraryFingerprint) !== text(foundationReview.libraryReview?.computedFingerprint)) findings.push(finding('blocker', 'creative-knowledge-graph-provenance-library-fingerprint-mismatch', 'Graph must bind the exact knowledge-library snapshot of the independently supplied Foundation.'));
  if (text(sourceBinding.bindingFingerprint) !== creativeKnowledgeGraphSourceBindingFingerprint(sourceBinding)) findings.push(finding('blocker', 'creative-knowledge-graph-provenance-source-binding-drift', 'Graph source binding must remain internally exact before external provenance can be established.'));

  const sourceEntries = foundationReview.libraryReview?.entries ?? [];
  const graphNodes = graphReview.nodes ?? [];
  const sourceById = new Map(sourceEntries.map((entry) => [entry.id, entry]));
  const graphById = new Map(graphNodes.map((node) => [node.id, node]));
  const sourceIds = [...sourceById.keys()].sort();
  const graphIds = [...graphById.keys()].sort();
  if (!sameValue(sourceIds, graphIds)) findings.push(finding('blocker', 'creative-knowledge-graph-provenance-node-set-drift', 'Graph V1 must represent the exact source Foundation knowledge ID set; missing or injected nodes are not allowed.'));

  for (const sourceEntry of sourceEntries) {
    const node = graphById.get(sourceEntry.id);
    if (node && !sameValue(node.entry, sourceEntry)) findings.push(finding('blocker', 'creative-knowledge-graph-provenance-node-content-drift', 'Graph node content must exactly match the corresponding independently supplied Foundation knowledge contract.', { knowledgeId: sourceEntry.id }));
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

function retrievalReceipt(retrievalReview, graphProvenanceReview, reviewReady) {
  return {
    schema: 'ai-studio-os/creative-knowledge-retrieval-provenance-receipt@1',
    reviewReady: reviewReady === true,
    retrievalSnapshotFingerprint: text(retrievalReview.computedFingerprint) || null,
    graphSnapshotFingerprint: graphProvenanceReview.sourceReceipt?.graphSnapshotFingerprint ?? null,
    foundationSnapshotFingerprint: graphProvenanceReview.sourceReceipt?.foundationSnapshotFingerprint ?? null,
    truth: {
      receiptContainsGraphKnowledge: false,
      receiptContainsFoundationKnowledge: false,
      receiptContainsForeignProjectMetadata: false,
      retrievalRankIsCreativeAuthority: false,
      hashIsSignature: false,
      productionApproved: false
    }
  };
}

export function reviewCreativeKnowledgeRetrievalProvenance({ retrieval, graph, foundation } = {}) {
  const findings = [];
  const retrievalReview = reviewCreativeKnowledgeRetrieval(retrieval ?? {});
  const graphProvenanceReview = reviewCreativeKnowledgeGraphProvenance({ graph, foundation });

  if (!retrievalReview.reviewReady) findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-retrieval-not-ready', 'Independent retrieval provenance requires a structurally review-ready isolated retrieval payload.', { findingCodes: retrievalReview.findings.map((item) => item.code) }));
  if (!graphProvenanceReview.reviewReady) findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-graph-not-verified', 'Retrieval provenance requires the source graph to be independently rebound to its separately supplied Foundation.'));

  const binding = retrieval?.graphBinding ?? {};
  const graphReview = reviewCreativeKnowledgeGraph(graph ?? {});
  if (text(binding.graphSnapshotFingerprint) !== text(graphReview.computedFingerprint)) findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-graph-fingerprint-mismatch', 'Retrieval must bind the exact graph supplied at the verification boundary.'));
  if (text(binding.foundationSnapshotFingerprint) !== text(graph?.sourceBinding?.foundationSnapshotFingerprint)) findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-foundation-binding-mismatch', 'Retrieval graph binding must preserve the graph source Foundation fingerprint.'));

  if (graphProvenanceReview.reviewReady) {
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
    } else if (!sameValue(creativeKnowledgeRetrievalContract(retrieval), creativeKnowledgeRetrievalContract(rebuilt))) {
      findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-result-drift', 'Claimed retrieval payload differs from the exact deterministic result rebuilt from the supplied graph and query.'));
    }
  }

  const baseReady = findings.every((item) => item.severity !== 'blocker');
  const expectedClaimReceipt = retrievalReceipt(retrievalReview, graphProvenanceReview, baseReady);
  if (Object.hasOwn(retrieval ?? {}, 'provenanceReceipt') && !sameValue(retrieval.provenanceReceipt, expectedClaimReceipt)) {
    findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-receipt-drift', 'Attached provenance receipt must exactly equal the compact receipt independently recomputed from the supplied graph and Foundation.'));
  }
  if (Object.hasOwn(retrieval ?? {}, 'provenanceReady') && retrieval.provenanceReady !== baseReady) {
    findings.push(finding('blocker', 'creative-knowledge-retrieval-provenance-ready-claim-drift', 'Attached provenanceReady must match independently recomputed provenance state.', { expected: baseReady, actual: retrieval.provenanceReady }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const finalReady = blockers.length === 0;
  const returnedReceipt = retrievalReceipt(retrievalReview, graphProvenanceReview, finalReady);
  return {
    schema: 'ai-studio-os/creative-knowledge-retrieval-provenance-review@1',
    pass: finalReady,
    reviewReady: finalReady,
    status: finalReady ? 'verified-advisory-retrieval-provenance' : 'blocked',
    findings,
    sourceReceipt: returnedReceipt,
    truth: {
      deterministicRetrievalRecomputed: graphProvenanceReview.reviewReady === true,
      graphAndFoundationSuppliedSeparately: true,
      attachedReceiptRecomputedWhenPresent: true,
      provenanceFailureMustRedactProjectEvidence: true,
      fullGraphExcludedFromReceipt: true,
      fullFoundationExcludedFromReceipt: true,
      retrievalRankIsCreativeAuthority: false,
      provenanceGrantsCreativeAuthority: false,
      humanApprovalGranted: false,
      productionApproved: false
    }
  };
}

function zeroRetrievalEvidence(retrieval = {}) {
  const redacted = {
    ...retrieval,
    results: [],
    conflictContext: [],
    stats: {
      scopeVisibleNodeCount: 0,
      primaryResultCount: 0,
      conflictContextCount: 0,
      excludedCounts: {},
      unavailableVisibleConflictCount: 0
    }
  };
  redacted.snapshotFingerprint = creativeKnowledgeRetrievalFingerprint(redacted);
  const structural = reviewCreativeKnowledgeRetrieval(redacted);
  return {
    ...redacted,
    findings: structural.findings,
    pass: structural.pass,
    reviewReady: structural.reviewReady,
    status: structural.status
  };
}

export function buildCreativeKnowledgeRetrievalWithProvenance(input = {}) {
  const graphProvenanceReview = reviewCreativeKnowledgeGraphProvenance({
    graph: input.graph,
    foundation: input.foundation
  });

  const rawRetrieval = buildCreativeKnowledgeRetrieval(input);
  const retrieval = graphProvenanceReview.reviewReady
    ? rawRetrieval
    : zeroRetrievalEvidence(rawRetrieval);

  const provenanceReview = reviewCreativeKnowledgeRetrievalProvenance({
    retrieval,
    graph: input.graph,
    foundation: input.foundation
  });

  return {
    ...retrieval,
    provenanceReceipt: provenanceReview.sourceReceipt,
    provenanceReady: provenanceReview.reviewReady
  };
}
