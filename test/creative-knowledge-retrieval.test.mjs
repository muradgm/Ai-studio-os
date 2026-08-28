import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import {
  buildCreativeKnowledgeRetrieval,
  reviewCreativeKnowledgeRetrieval
} from '../modules/creative-knowledge-graph/retrieval.mjs';
import {
  buildCreativeKnowledgeRetrievalWithProvenance,
  reviewCreativeKnowledgeRetrievalProvenance
} from '../modules/creative-knowledge-graph/provenance.mjs';

function baseEntry(id, overrides = {}) {
  return {
    id,
    kind: 'principle',
    domain: 'composition',
    title: `Knowledge ${id}`,
    definition: 'Focused contrast can clarify meaningful hierarchy without making every surface loud.',
    causalRationale: 'Relative signal strength changes fixation competition and therefore attention order.',
    perceptualEffects: ['clearer hierarchy'],
    worksWhen: ['meaningful priority exists'],
    failsWhen: ['everything receives equal emphasis'],
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

function trend(id) {
  return baseEntry(id, {
    kind: 'current-trend',
    domain: 'motion',
    title: 'Current kinetic typography trend',
    definition: 'Kinetic typography is appearing frequently in current launch experiences.',
    causalRationale: 'This describes current practice and familiarity, not a reason to adopt it.',
    worksWhen: ['used as market context'],
    failsWhen: ['trend status substitutes for project rationale'],
    failureModes: ['trend chasing'],
    counterexamples: ['a project that benefits from deliberate stillness'],
    diagnostics: ['verify the observation is still fresh at query time'],
    provenance: {
      sourceId: `source-${id}`,
      sourceType: 'trend-observation',
      sourceRef: `web://${id}`,
      capturedAt: '2026-08-01T00:00:00Z'
    },
    confidence: 0.75,
    confidenceBasis: 'Bounded current observation.',
    transferability: 'Context only.',
    transfer: {
      transferablePrinciples: ['understand current audience familiarity'],
      surfaceSignature: ['recognizable kinetic type treatment'],
      mustStrip: ['recognizable kinetic type treatment'],
      adaptationRules: ['derive any motion from project truth'],
      copyRisks: ['trend imitation']
    }
  });
}

function projectEntry(projectId, privateText) {
  return baseEntry(`project-${projectId}`, {
    kind: 'project-observation',
    domain: 'product-experience',
    title: `Scoped ${projectId}`,
    definition: privateText,
    causalRationale: 'This observation is grounded only in the project evidence that produced it.',
    worksWhen: ['used inside the same project'],
    failsWhen: ['copied into a different project'],
    failureModes: ['cross-project leakage'],
    counterexamples: ['another product with different truth'],
    diagnostics: ['verify project identity'],
    provenance: {
      sourceId: `source-project-${projectId}`,
      sourceType: 'project-observation',
      sourceRef: `project://${projectId}/private`
    },
    confidence: 0.88,
    confidenceBasis: 'Direct project evidence only.',
    scope: 'project',
    projectId,
    transferability: 'Project-scoped.'
  });
}

function makeFoundation(entries) {
  const value = buildCreativeIntelligenceFoundation({ entries });
  assert.equal(value.reviewReady, true);
  return value;
}

function query(graph, overrides = {}) {
  return buildCreativeKnowledgeRetrieval({
    graph,
    projectId: 'project-a',
    asOf: '2026-08-28T12:00:00+02:00',
    purpose: 'Find qualified evidence for hierarchy and motion reasoning.',
    terms: [],
    ...overrides
  });
}

test('retrieval is deterministic, project-bound and explicitly non-authoritative', () => {
  const foundation = makeFoundation([baseEntry('b'), baseEntry('a')]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = query(graph);

  assert.equal(retrieval.reviewReady, true);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['a', 'b']);
  assert.deepEqual(retrieval.results.map((item) => item.rank), [1, 2]);
  assert.equal(retrieval.truth.retrievalRankIsCreativeAuthority, false);
  assert.equal(retrieval.truth.productionApproved, false);
});

test('current trend is included while fresh and excluded after explicit freshUntil', () => {
  const foundation = makeFoundation([trend('trend-a')]);
  const graph = buildCreativeKnowledgeGraph({
    foundation,
    nodeAnnotations: {
      'trend-a': {
        freshUntil: '2026-09-01T00:00:00Z',
        evidenceRefs: ['policy://trend-freshness-v1']
      }
    }
  });
  assert.equal(graph.reviewReady, true);

  const fresh = query(graph, { asOf: '2026-08-28T10:00:00Z', kinds: ['current-trend'] });
  assert.equal(fresh.reviewReady, true);
  assert.deepEqual(fresh.results.map((item) => item.knowledgeId), ['trend-a']);

  const stale = query(graph, { asOf: '2026-09-03T10:00:00Z', kinds: ['current-trend'] });
  assert.equal(stale.reviewReady, true);
  assert.equal(stale.results.length, 0);
  assert.equal(stale.stats.excludedCounts['trend-stale'], 1);
});

test('retrieval asOf must be explicit and timezone-qualified', () => {
  const foundation = makeFoundation([baseEntry('a')]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = query(graph, { asOf: '2026-08-28T10:00:00' });

  assert.equal(retrieval.reviewReady, false);
  assert.ok(retrieval.findings.some((item) => item.code === 'creative-knowledge-retrieval-as-of-invalid'));
});

test('cross-project knowledge is absent before payload construction and does not affect visible counts', () => {
  const privateB = 'PROJECT-B-PRIVATE-GRAPH-CONTENT-MUST-NOT-LEAK';
  const foundation = makeFoundation([
    projectEntry('a', 'Project A evidence.'),
    projectEntry('b', privateB)
  ]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = query(graph, { projectId: 'a' });

  assert.equal(retrieval.reviewReady, true);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['project-a']);
  assert.equal(retrieval.stats.scopeVisibleNodeCount, 1);
  assert.equal(Object.hasOwn(retrieval.stats.excludedCounts, 'project-scope-mismatch'), false);
  assert.equal(JSON.stringify(retrieval).includes('project-b'), false);
  assert.equal(JSON.stringify(retrieval).includes(privateB), false);
});

test('project-safe projection strips source relationships and preserves same-scope conflict as unranked context', () => {
  const a = baseEntry('a', {
    title: 'Focused contrast hierarchy',
    relationships: [{
      type: 'conflicts-with',
      targetId: 'b',
      rationale: 'The alternative favors uniform visual weight instead of concentrated hierarchy.'
    }]
  });
  const b = baseEntry('b', {
    title: 'Uniform weight system',
    definition: 'Uniform visual weight can reduce hierarchy when comparison parity is the primary task.'
  });
  const foundation = makeFoundation([a, b]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = query(graph, { terms: ['focused'] });

  assert.equal(retrieval.reviewReady, true);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['a']);
  assert.deepEqual(retrieval.results[0].entry.relationships, []);
  assert.deepEqual(retrieval.results[0].visibleConflictIds, ['b']);
  assert.deepEqual(retrieval.conflictContext.map((item) => item.knowledgeId), ['b']);
  assert.equal(retrieval.conflictContext[0].rank, null);
  assert.deepEqual(retrieval.conflictContext[0].entry.relationships, []);
  assert.deepEqual(retrieval.conflictContext[0].conflictsWithPrimaryIds, ['a']);
  assert.equal(retrieval.truth.conflictEvidencePreserved, true);
});

test('cross-project conflict exposes only a withheld boolean, never foreign ID content or count', () => {
  const privateB = 'PROJECT-B-CONFLICT-PRIVATE-CONTENT';
  const a = projectEntry('a', 'Project A scoped evidence.');
  a.relationships = [{
    type: 'conflicts-with',
    targetId: 'project-b',
    rationale: 'The two project observations disagree, but Project B remains private to its scope.'
  }];
  const b = projectEntry('b', privateB);
  const foundation = makeFoundation([a, b]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = query(graph, { projectId: 'a', terms: ['project'] });

  assert.equal(retrieval.reviewReady, true);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['project-a']);
  assert.equal(retrieval.results[0].withheldConflictPresent, true);
  assert.deepEqual(retrieval.results[0].visibleConflictIds, []);
  assert.equal(retrieval.conflictContext.length, 0);
  assert.equal(Object.hasOwn(retrieval.stats, 'redactedConflictCount'), false);
  assert.equal(JSON.stringify(retrieval).includes('project-b'), false);
  assert.equal(JSON.stringify(retrieval).includes(privateB), false);
});

test('disputed evidence stays visible while superseded and deprecated evidence stay out', () => {
  const foundation = makeFoundation([baseEntry('active'), baseEntry('disputed'), baseEntry('old'), baseEntry('deprecated')]);
  const graph = buildCreativeKnowledgeGraph({
    foundation,
    nodeAnnotations: {
      disputed: {
        status: 'disputed',
        statusReason: 'Reliable evidence conflicts.',
        evidenceRefs: ['review://disputed-evidence']
      },
      old: {
        status: 'superseded',
        statusReason: 'Replaced by active knowledge.',
        supersededBy: 'active',
        evidenceRefs: ['benchmark://replacement']
      },
      deprecated: {
        status: 'deprecated',
        statusReason: 'No longer suitable for use.',
        evidenceRefs: ['review://deprecation']
      }
    },
    supplementalEdges: [{
      id: 'lineage:active:old',
      type: 'supersedes',
      fromId: 'active',
      toId: 'old',
      rationale: 'Active knowledge replaces the older representation.',
      evidenceRefs: ['benchmark://replacement']
    }]
  });
  assert.equal(graph.reviewReady, true);

  const retrieval = query(graph);
  assert.equal(retrieval.reviewReady, true);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['active', 'disputed']);
  assert.equal(retrieval.results.find((item) => item.knowledgeId === 'disputed').matchReasons.includes('status:disputed'), true);
  assert.equal(retrieval.stats.excludedCounts['status:superseded'], 1);
  assert.equal(retrieval.stats.excludedCounts['status:deprecated'], 1);
});

test('structurally blocked graph emits zero graph-derived project evidence', () => {
  const secret = 'UNTRUSTED-GRAPH-CONTENT-MUST-NOT-ENTER-RETRIEVAL';
  const foundation = makeFoundation([baseEntry('a', { definition: secret })]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const forged = structuredClone(graph);
  forged.nodes[0].schema = 'attacker/graph-node@1';

  const retrieval = query(forged);
  assert.equal(retrieval.reviewReady, false);
  assert.deepEqual(retrieval.results, []);
  assert.deepEqual(retrieval.conflictContext, []);
  assert.deepEqual(retrieval.stats, {
    scopeVisibleNodeCount: 0,
    primaryResultCount: 0,
    conflictContextCount: 0,
    excludedCounts: {},
    unavailableVisibleConflictCount: 0
  });
  assert.equal(JSON.stringify(retrieval).includes(secret), false);
  assert.ok(retrieval.findings.some((item) => item.code === 'creative-knowledge-retrieval-graph-not-ready'));
});

test('provenance-enabled retrieval reconstructs exact deterministic evidence and returns a compact receipt', () => {
  const foundation = makeFoundation([baseEntry('a'), baseEntry('b')]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = buildCreativeKnowledgeRetrievalWithProvenance({
    graph,
    foundation,
    projectId: 'project-a',
    asOf: '2026-08-28T10:00:00Z',
    purpose: 'Retrieve hierarchy evidence.'
  });

  assert.equal(retrieval.reviewReady, true);
  assert.equal(retrieval.provenanceReady, true);
  assert.equal(retrieval.provenanceReceipt.truth.receiptContainsGraphKnowledge, false);
  assert.equal(retrieval.provenanceReceipt.truth.receiptContainsFoundationKnowledge, false);
  assert.equal(Object.hasOwn(retrieval, 'provenanceReview'), false);
});

test('provenance mismatch redacts all graph-derived project evidence before returning payload', () => {
  const secret = 'GRAPH-A-SOURCE-CONTENT-MUST-BE-REDACTED-ON-PROVENANCE-FAILURE';
  const foundationA = makeFoundation([baseEntry('same-id', { definition: secret })]);
  const graph = buildCreativeKnowledgeGraph({ foundation: foundationA });
  const foundationB = makeFoundation([baseEntry('same-id', {
    definition: 'Different independently supplied Foundation content under the same ID.'
  })]);

  const retrieval = buildCreativeKnowledgeRetrievalWithProvenance({
    graph,
    foundation: foundationB,
    projectId: 'project-a',
    asOf: '2026-08-28T10:00:00Z',
    purpose: 'Attempt retrieval from a provenance-mismatched graph.'
  });

  assert.equal(retrieval.provenanceReady, false);
  assert.deepEqual(retrieval.results, []);
  assert.deepEqual(retrieval.conflictContext, []);
  assert.equal(retrieval.stats.scopeVisibleNodeCount, 0);
  assert.equal(JSON.stringify(retrieval).includes(secret), false);
  assert.equal(Object.hasOwn(retrieval, 'provenanceReview'), false);
});

test('reordered results with repaired ranks fail independent retrieval provenance', () => {
  const foundation = makeFoundation([baseEntry('a'), baseEntry('b')]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = query(graph);
  assert.equal(retrieval.reviewReady, true);

  const forged = structuredClone(retrieval);
  forged.results.reverse();
  forged.results.forEach((item, index) => { item.rank = index + 1; });

  const review = reviewCreativeKnowledgeRetrievalProvenance({ retrieval: forged, graph, foundation });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-retrieval-provenance-result-drift') || review.findings.some((item) => item.code === 'creative-knowledge-retrieval-provenance-retrieval-not-ready'));
});

test('retrieval cannot manufacture approval through rank or cached truth flags', () => {
  const foundation = makeFoundation([baseEntry('a')]);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = query(graph);
  const forged = structuredClone(retrieval);
  forged.truth.productionApproved = true;
  forged.results[0].truth.creativeDirectionSelected = true;

  const review = reviewCreativeKnowledgeRetrieval(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-retrieval-authority-fabricated'));
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-retrieval-item-authority-fabricated'));
});
