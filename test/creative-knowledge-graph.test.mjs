import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import {
  buildCreativeKnowledgeGraph,
  reviewCreativeKnowledgeGraph
} from '../modules/creative-knowledge-graph/runtime.mjs';
import { reviewCreativeKnowledgeGraphProvenance } from '../modules/creative-knowledge-graph/provenance.mjs';

function principle(id, overrides = {}) {
  return {
    id,
    kind: 'principle',
    domain: 'composition',
    title: `Principle ${id}`,
    definition: 'Concentrated visual signal can clarify priority when surrounding signals remain quieter.',
    causalRationale: 'Relative signal strength changes fixation competition and therefore likely reading order.',
    perceptualEffects: ['clearer hierarchy'],
    worksWhen: ['the experience needs an explicit attention order'],
    failsWhen: ['every surface receives equal emphasis'],
    creativeVariables: ['contrast', 'scale', 'spacing'],
    crossDomainApplications: ['editorial design'],
    failureModes: ['false hierarchy'],
    counterexamples: ['an intentionally egalitarian comparison matrix'],
    diagnostics: ['squint test preserves intended priority'],
    relationships: [],
    provenance: {
      sourceId: `source-${id}`,
      sourceType: 'curated-principle',
      sourceRef: `internal://${id}`
    },
    confidence: 0.9,
    confidenceBasis: 'Broadly evidenced but context dependent.',
    scope: 'general',
    transferability: 'Broad with project-specific adaptation.',
    ...overrides
  };
}

function currentTrend(id, overrides = {}) {
  return principle(id, {
    kind: 'current-trend',
    domain: 'motion',
    title: `Trend ${id}`,
    definition: 'A current practice is appearing more often in contemporary motion work.',
    causalRationale: 'The observation describes current market practice, not a reason to adopt it.',
    perceptualEffects: ['contextual familiarity'],
    worksWhen: ['used as market context rather than design authority'],
    failsWhen: ['trend status is treated as creative justification'],
    failureModes: ['trend chasing'],
    counterexamples: ['a project whose truth requires rejecting the current convention'],
    diagnostics: ['verify the observation remains current at the explicit query date'],
    provenance: {
      sourceId: `source-${id}`,
      sourceType: 'trend-observation',
      sourceRef: `web://${id}`,
      capturedAt: '2026-08-01T00:00:00Z'
    },
    confidence: 0.72,
    confidenceBasis: 'Current observation with a bounded validity window.',
    transferability: 'Context only; never direction by itself.',
    transfer: {
      transferablePrinciples: ['understand what audiences may currently recognize'],
      surfaceSignature: ['recognizable current treatment'],
      mustStrip: ['recognizable current treatment'],
      adaptationRules: ['re-derive any use from project truth'],
      copyRisks: ['trend imitation']
    },
    ...overrides
  });
}

function projectObservation(projectId, privateDefinition) {
  return principle(`project-${projectId}`, {
    kind: 'project-observation',
    domain: 'product-experience',
    title: `Project ${projectId} observation`,
    definition: privateDefinition,
    causalRationale: 'The observation is meaningful because it comes from this project’s own product evidence.',
    worksWhen: ['used inside the same project'],
    failsWhen: ['silently transferred into another project'],
    failureModes: ['cross-project leakage'],
    counterexamples: ['another product with different truth'],
    diagnostics: ['confirm project identity before use'],
    provenance: {
      sourceId: `source-project-${projectId}`,
      sourceType: 'project-observation',
      sourceRef: `project://${projectId}/observation`
    },
    confidence: 0.88,
    confidenceBasis: 'Direct project evidence only.',
    scope: 'project',
    projectId,
    transferability: 'Project-scoped unless independently promoted later.'
  });
}

function foundation(entries) {
  const built = buildCreativeIntelligenceFoundation({ entries });
  assert.equal(built.reviewReady, true);
  return built;
}

test('graph represents a review-ready Foundation as an exact advisory snapshot', () => {
  const source = foundation([principle('a'), principle('b')]);
  const graph = buildCreativeKnowledgeGraph({ foundation: source });

  assert.equal(graph.reviewReady, true);
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.truth.graphIsCreativeAuthority, false);
  assert.equal(graph.truth.productionApproved, false);
  assert.match(graph.snapshotFingerprint, /^[a-f0-9]{64}$/);
});

test('Foundation relationships become exact graph edges and cannot be silently omitted', () => {
  const a = principle('a', {
    relationships: [{
      type: 'conflicts-with',
      targetId: 'b',
      rationale: 'The principles compete when both demand the same focal priority.'
    }]
  });
  const source = foundation([a, principle('b')]);
  const graph = buildCreativeKnowledgeGraph({ foundation: source });
  assert.equal(graph.reviewReady, true);
  assert.equal(graph.edges.some((edge) => edge.type === 'conflicts-with' && edge.fromId === 'a' && edge.toId === 'b'), true);

  const tampered = structuredClone(graph);
  tampered.edges = [];
  const review = reviewCreativeKnowledgeGraph(tampered);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-fingerprint-mismatch'));
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-foundation-edge-drift'));
});

test('current trends require explicit capturedAt and graph-level freshUntil bounds', () => {
  const source = foundation([currentTrend('trend-a')]);
  const missingFreshness = buildCreativeKnowledgeGraph({ foundation: source });
  assert.equal(missingFreshness.reviewReady, false);
  assert.ok(missingFreshness.findings.some((item) => item.code === 'creative-knowledge-graph-trend-fresh-until-missing'));

  const ready = buildCreativeKnowledgeGraph({
    foundation: source,
    nodeAnnotations: {
      'trend-a': { freshUntil: '2026-09-01T00:00:00Z' }
    }
  });
  assert.equal(ready.reviewReady, true);
});

test('current trend capturedAt must be timezone-qualified and precede freshUntil', () => {
  const source = foundation([currentTrend('trend-a', {
    provenance: {
      sourceId: 'source-trend-a',
      sourceType: 'trend-observation',
      sourceRef: 'web://trend-a',
      capturedAt: '2026-08-15T00:00:00Z'
    }
  })]);
  const graph = buildCreativeKnowledgeGraph({
    foundation: source,
    nodeAnnotations: {
      'trend-a': { freshUntil: '2026-08-01T00:00:00Z' }
    }
  });
  assert.equal(graph.reviewReady, false);
  assert.ok(graph.findings.some((item) => item.code === 'creative-knowledge-graph-trend-freshness-window-invalid'));
});

test('unknown graph annotations cannot invent nodes outside the source Foundation', () => {
  const source = foundation([principle('a')]);
  const graph = buildCreativeKnowledgeGraph({
    foundation: source,
    nodeAnnotations: {
      missing: { status: 'active' }
    }
  });
  assert.equal(graph.reviewReady, false);
  assert.ok(graph.findings.some((item) => item.code === 'creative-knowledge-graph-annotation-node-missing'));
});

test('superseded status requires explicit replacement lineage with evidence', () => {
  const source = foundation([principle('old'), principle('new')]);
  const missingEdge = buildCreativeKnowledgeGraph({
    foundation: source,
    nodeAnnotations: {
      old: { status: 'superseded', statusReason: 'Replaced by stronger evidence.', supersededBy: 'new' }
    }
  });
  assert.equal(missingEdge.reviewReady, false);
  assert.ok(missingEdge.findings.some((item) => item.code === 'creative-knowledge-graph-supersession-edge-missing'));

  const ready = buildCreativeKnowledgeGraph({
    foundation: source,
    nodeAnnotations: {
      old: { status: 'superseded', statusReason: 'Replaced by stronger evidence.', supersededBy: 'new' }
    },
    supplementalEdges: [{
      id: 'lineage:new:old',
      type: 'supersedes',
      fromId: 'new',
      toId: 'old',
      rationale: 'The newer principle is supported by later evidence and replaces the older representation.',
      evidenceRefs: ['benchmark://replacement-evidence']
    }]
  });
  assert.equal(ready.reviewReady, true);
});

test('same-ID Foundation content drift breaks independent graph provenance', () => {
  const sourceA = foundation([principle('a', { definition: 'Original exact claim.' })]);
  const sourceB = foundation([principle('a', { definition: 'Different claim under the same ID.' })]);
  const graph = buildCreativeKnowledgeGraph({ foundation: sourceA });

  const review = reviewCreativeKnowledgeGraphProvenance({ graph, foundation: sourceB });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-provenance-foundation-fingerprint-mismatch'));
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-provenance-node-content-drift'));
});

test('graph provenance succeeds only against the independently supplied exact Foundation', () => {
  const source = foundation([principle('a'), projectObservation('a', 'Project A private graph evidence.')]);
  const graph = buildCreativeKnowledgeGraph({ foundation: source });
  const review = reviewCreativeKnowledgeGraphProvenance({ graph, foundation: source });

  assert.equal(review.reviewReady, true);
  assert.equal(review.sourceReceipt.truth.hashIsSignature, false);
  assert.equal(review.truth.provenanceGrantsCreativeAuthority, false);
});

test('raw edge and embedded knowledge authority fabrication must survive fresh review as blockers', () => {
  const source = foundation([principle('a')]);
  const graph = buildCreativeKnowledgeGraph({ foundation: source });

  const forgedNode = structuredClone(graph);
  forgedNode.nodes[0].entry.truth.productionApproved = true;
  forgedNode.snapshotFingerprint = graph.snapshotFingerprint;
  let review = reviewCreativeKnowledgeGraph(forgedNode);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-node-entry-not-ready'));

  const sourceWithEdge = foundation([
    principle('a', { relationships: [{ type: 'reinforces', targetId: 'b', rationale: 'They support the same attention mechanism.' }] }),
    principle('b')
  ]);
  const graphWithEdge = buildCreativeKnowledgeGraph({ foundation: sourceWithEdge });
  const forgedEdge = structuredClone(graphWithEdge);
  forgedEdge.edges[0].schema = 'ai-studio-os/creative-direction@1';
  forgedEdge.edges[0].truth.productionApproved = true;
  review = reviewCreativeKnowledgeGraph(forgedEdge);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-edge-schema-invalid'));
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-edge-authority-fabricated'));
});
