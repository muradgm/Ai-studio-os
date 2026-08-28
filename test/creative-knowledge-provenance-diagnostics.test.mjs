import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import {
  buildCreativeKnowledgeRetrievalWithProvenance,
  reviewCreativeKnowledgeGraphProvenance,
  reviewCreativeKnowledgeRetrievalProvenance
} from '../modules/creative-knowledge-graph/provenance.mjs';

function entry() {
  return {
    id: 'diagnostic-principle',
    kind: 'principle',
    domain: 'composition',
    title: 'Diagnostic principle',
    definition: 'Focused visual signal can clarify priority when surrounding signals remain quieter.',
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
      sourceId: 'source-diagnostic-principle',
      sourceType: 'curated-principle',
      sourceRef: 'internal://diagnostic-principle'
    },
    confidence: 0.9,
    confidenceBasis: 'Broadly evidenced but context dependent.',
    scope: 'general',
    transferability: 'Broad with project adaptation.'
  };
}

test('independent provenance rejects caller-modified graph and retrieval diagnostics', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [entry()] });
  assert.equal(foundation.reviewReady, true);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  assert.equal(graph.reviewReady, true);

  const forgedGraph = structuredClone(graph);
  forgedGraph.findings = [{ severity: 'note', code: 'foreign-project-metadata', message: 'hidden bytes' }];
  let review = reviewCreativeKnowledgeGraphProvenance({ graph: forgedGraph, foundation });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-graph-provenance-diagnostics-drift'));

  const retrieval = buildCreativeKnowledgeRetrievalWithProvenance({
    graph,
    foundation,
    projectId: 'project-a',
    asOf: '2026-08-28T10:00:00Z',
    purpose: 'Verify diagnostic metadata integrity.'
  });
  assert.equal(retrieval.provenanceReady, true);

  const forgedRetrieval = structuredClone(retrieval);
  forgedRetrieval.findings = [{ severity: 'note', code: 'foreign-project-metadata', message: 'hidden bytes' }];
  review = reviewCreativeKnowledgeRetrievalProvenance({ retrieval: forgedRetrieval, graph, foundation });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-retrieval-provenance-diagnostics-drift'));
});
