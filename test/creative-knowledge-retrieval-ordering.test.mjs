import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrieval } from '../modules/creative-knowledge-graph/retrieval.mjs';

function principle(id, overrides = {}) {
  return {
    id,
    kind: 'principle',
    domain: 'composition',
    title: `Principle ${id}`,
    definition: 'Relative visual signal can clarify hierarchy when the surrounding field stays quieter.',
    causalRationale: 'Signal contrast changes fixation competition and therefore likely attention order.',
    perceptualEffects: ['clearer hierarchy'],
    worksWhen: ['a meaningful priority exists'],
    failsWhen: ['all elements require equal emphasis'],
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
    confidenceBasis: 'Broadly evidenced but project dependent.',
    scope: 'general',
    transferability: 'Broad with project adaptation.',
    ...overrides
  };
}

function graphFrom(entries) {
  const foundation = buildCreativeIntelligenceFoundation({ entries });
  assert.equal(foundation.reviewReady, true);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  assert.equal(graph.reviewReady, true);
  return graph;
}

function retrieve(graph, overrides = {}) {
  const retrieval = buildCreativeKnowledgeRetrieval({
    graph,
    projectId: 'ordering-proof',
    asOf: '2026-08-28T12:00:00Z',
    purpose: 'Prove locale-independent canonical retrieval ordering.',
    ...overrides
  });
  assert.equal(retrieval.reviewReady, true);
  return retrieval;
}

test('primary retrieval tie-break uses locale-independent code-unit order', () => {
  // Default locale collation commonly places ä near a, while deterministic
  // JavaScript code-unit order places z before ä. The canonical contract must
  // not depend on the host locale.
  const graph = graphFrom([
    principle('ä'),
    principle('z')
  ]);

  const retrieval = retrieve(graph);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['z', 'ä']);
});

test('unranked visible conflict context uses the same canonical ID order', () => {
  const primary = principle('primary', {
    title: 'Primary focused hierarchy',
    relationships: [
      {
        type: 'conflicts-with',
        targetId: 'ä',
        rationale: 'The alternative rejects concentrated hierarchy.'
      },
      {
        type: 'conflicts-with',
        targetId: 'z',
        rationale: 'The alternative rejects concentrated hierarchy.'
      }
    ]
  });
  const graph = graphFrom([
    primary,
    principle('ä', { title: 'Alternative umlaut' }),
    principle('z', { title: 'Alternative zed' })
  ]);

  const retrieval = retrieve(graph, { terms: ['focused'] });
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['primary']);
  assert.deepEqual(retrieval.conflictContext.map((item) => item.knowledgeId), ['z', 'ä']);
});
