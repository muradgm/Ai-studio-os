import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import {
  buildCreativeKnowledgeRetrievalWithProvenance,
  reviewCreativeKnowledgeRetrievalProvenance
} from '../modules/creative-knowledge-graph/provenance.mjs';

function entry() {
  return {
    id: 'receipt-principle',
    kind: 'principle',
    domain: 'composition',
    title: 'Receipt principle',
    definition: 'Focused contrast can establish hierarchy when quieter signals preserve separation.',
    causalRationale: 'Relative signal strength changes fixation competition and likely attention order.',
    perceptualEffects: ['clearer hierarchy'],
    worksWhen: ['meaningful priority exists'],
    failsWhen: ['all elements receive equal emphasis'],
    creativeVariables: ['contrast', 'scale'],
    crossDomainApplications: ['editorial design'],
    failureModes: ['false hierarchy'],
    counterexamples: ['an intentionally egalitarian matrix'],
    diagnostics: ['squint test preserves intended priority'],
    relationships: [],
    provenance: {
      sourceId: 'source-receipt-principle',
      sourceType: 'curated-principle',
      sourceRef: 'internal://receipt-principle'
    },
    confidence: 0.9,
    confidenceBasis: 'Broadly evidenced but project dependent.',
    scope: 'general',
    transferability: 'Broad with project adaptation.'
  };
}

test('attached compact provenance receipt is independently recomputed and exact', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [entry()] });
  assert.equal(foundation.reviewReady, true);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  assert.equal(graph.reviewReady, true);

  const retrieval = buildCreativeKnowledgeRetrievalWithProvenance({
    graph,
    foundation,
    projectId: 'project-a',
    asOf: '2026-08-28T10:00:00Z',
    purpose: 'Verify the compact provenance envelope.'
  });
  assert.equal(retrieval.provenanceReady, true);

  let review = reviewCreativeKnowledgeRetrievalProvenance({ retrieval, graph, foundation });
  assert.equal(review.reviewReady, true);

  const tamperedReceipt = structuredClone(retrieval);
  tamperedReceipt.provenanceReceipt.foreignProjectPayload = 'must-not-hide-inside-receipt';
  review = reviewCreativeKnowledgeRetrievalProvenance({ retrieval: tamperedReceipt, graph, foundation });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-retrieval-provenance-receipt-drift'));

  const tamperedReady = structuredClone(retrieval);
  tamperedReady.provenanceReady = false;
  review = reviewCreativeKnowledgeRetrievalProvenance({ retrieval: tamperedReady, graph, foundation });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-retrieval-provenance-ready-claim-drift'));
});
