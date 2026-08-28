import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import {
  buildCreativeKnowledgeGraph,
  reviewCreativeKnowledgeGraph
} from '../modules/creative-knowledge-graph/runtime.mjs';

function entry(id, overrides = {}) {
  return {
    id,
    kind: 'principle',
    domain: 'composition',
    title: `Boundary ${id}`,
    definition: 'A controlled signal can establish hierarchy when surrounding signals remain quieter.',
    causalRationale: 'Relative signal strength changes attention competition and likely reading order.',
    perceptualEffects: ['clearer hierarchy'],
    worksWhen: ['meaningful priority exists'],
    failsWhen: ['all surfaces receive equal emphasis'],
    creativeVariables: ['contrast', 'scale'],
    crossDomainApplications: ['editorial design'],
    failureModes: ['false hierarchy'],
    counterexamples: ['an intentionally egalitarian matrix'],
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
    transferability: 'Broad with project adaptation.',
    ...overrides
  };
}

test('graph top-level shape and truth cannot carry unhashed hidden payload', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [entry('a')] });
  assert.equal(foundation.reviewReady, true);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  assert.equal(graph.reviewReady, true);

  const hiddenField = structuredClone(graph);
  hiddenField.foreignProjectPayload = 'must-not-ride-beside-a-valid-fingerprint';
  let review = reviewCreativeKnowledgeGraph(hiddenField);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-shape-invalid'));

  const hiddenTruth = structuredClone(graph);
  hiddenTruth.truth.foreignProjectPayloadPresent = false;
  review = reviewCreativeKnowledgeGraph(hiddenTruth);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-truth-drift'));
});

test('invalid Foundation emits no Foundation-derived graph knowledge', () => {
  const secret = 'INVALID-FOUNDATION-CONTENT-MUST-NOT-ENTER-GRAPH-NODES';
  const foundation = buildCreativeIntelligenceFoundation({
    entries: [entry('unsafe', {
      definition: secret,
      confidence: null
    })]
  });
  assert.equal(foundation.reviewReady, false);

  const graph = buildCreativeKnowledgeGraph({ foundation });
  assert.equal(graph.reviewReady, false);
  assert.deepEqual(graph.nodes, []);
  assert.deepEqual(graph.edges, []);
  assert.equal(JSON.stringify(graph.nodes).includes(secret), false);
  assert.ok(graph.findings.some((item) => item.code === 'creative-knowledge-graph-foundation-not-ready'));

  const review = reviewCreativeKnowledgeGraph(graph);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-source-not-ready'));
});
