import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrieval } from '../modules/creative-knowledge-graph/retrieval.mjs';
import {
  buildCreativeTransferBrief,
  buildCreativeTransferHypothesis
} from '../modules/creative-transfer-intelligence/runtime.mjs';
import {
  buildCreativeTransferCandidate,
  reviewCreativeTransferCandidate
} from '../modules/creative-transfer-intelligence/candidate.mjs';

function referenceEntry() {
  return {
    id: 'ref-a',
    kind: 'historical-precedent',
    domain: 'editorial-composition',
    title: 'Concentrated editorial hierarchy',
    definition: 'Concentrated asymmetry can create a strong first fixation while leaving surrounding information quieter.',
    causalRationale: 'Uneven visual mass changes fixation competition and creates a deliberate reading sequence when secondary material remains restrained.',
    perceptualEffects: ['strong first fixation'],
    worksWhen: ['one priority must dominate before supporting detail'],
    failsWhen: ['all content needs equal comparison weight'],
    creativeVariables: ['scale contrast', 'negative space'],
    crossDomainApplications: ['motion choreography'],
    failureModes: ['decorative asymmetry without hierarchy'],
    counterexamples: ['a comparison matrix where parity is required'],
    diagnostics: ['squint test preserves one first fixation'],
    relationships: [],
    provenance: {
      sourceId: 'source-ref-a',
      sourceType: 'curated-historical-reference',
      sourceRef: 'archive://ref-a',
      capturedAt: '2026-08-01T00:00:00Z'
    },
    confidence: 0.9,
    confidenceBasis: 'Repeated perceptual pattern with explicit boundary conditions.',
    scope: 'general',
    transferability: 'Transfer causal hierarchy logic only.',
    transfer: {
      transferablePrinciples: ['concentrate perceptual priority before releasing secondary detail'],
      surfaceSignature: ['oversized red serif headline on a cream field'],
      mustStrip: ['oversized red serif headline'],
      adaptationRules: ['re-express hierarchy through target-domain variables rather than source styling'],
      copyRisks: ['reproducing the reference editorial costume']
    }
  };
}

function baseline() {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [referenceEntry()] });
  assert.equal(foundation.reviewReady, true);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  assert.equal(graph.reviewReady, true);
  const retrieval = buildCreativeKnowledgeRetrieval({
    graph,
    projectId: 'project-a',
    asOf: '2026-08-28T12:00:00+02:00',
    purpose: 'Transfer a qualified hierarchy principle into motion.',
    terms: ['concentrated']
  });
  assert.equal(retrieval.reviewReady, true);
  const brief = buildCreativeTransferBrief({
    retrieval,
    graph,
    foundation,
    target: {
      domain: 'motion',
      problem: 'Make one state transition dominant without motion theatre.',
      desiredEffect: 'Primary transition first, calm secondary disclosure second.'
    },
    projectTruths: [{
      id: 'truth-1',
      statement: 'The product must communicate one primary state change before exposing secondary controls.'
    }],
    constraints: ['Do not imitate recognizable editorial styling.']
  });
  assert.equal(brief.reviewReady, true);
  assert.equal(brief.provenanceReady, true);
  return { foundation, graph, retrieval, brief };
}

function hypothesisInput(brief, overrides = {}) {
  return {
    brief,
    sourceKnowledgeIds: ['ref-a'],
    projectTruthRefs: ['truth-1'],
    counterevidenceKnowledgeIds: [],
    transferClaim: 'Stage one dominant state transition, then reveal supporting controls with lower temporal emphasis.',
    causalBridge: 'Unequal temporal salience can reproduce the source causal hierarchy mechanism without carrying its editorial styling.',
    targetConsequence: 'Users should identify the primary state change before attending to secondary controls.',
    adaptationActions: ['Reserve the strongest timing contrast for the primary transition.'],
    strippedSurfaceSignatures: ['oversized red serif headline'],
    adaptationRuleResponses: [{
      rule: 're-express hierarchy through target-domain variables rather than source styling',
      action: 'Use timing, stillness and displacement as the target-domain hierarchy variables.'
    }],
    copyRiskMitigations: [{
      risk: 'reproducing the reference editorial costume',
      mitigation: 'Keep source typography and color composition outside the target concept.'
    }],
    uncertainty: 'The analogy may become too theatrical if temporal contrast is over-amplified.',
    falsifier: 'Reject if secondary comprehension slows or the target begins to feel stylistically derivative.',
    ...overrides
  };
}

test('safe Transfer hypothesis emits a provenance-bound downstream candidate', () => {
  const value = baseline();
  const hypothesis = buildCreativeTransferHypothesis({
    ...hypothesisInput(value.brief),
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: value.foundation
  });
  assert.equal(hypothesis.reviewReady, true);
  assert.equal(hypothesis.provenanceReady, true);

  const candidate = buildCreativeTransferCandidate({
    hypothesis,
    brief: value.brief,
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: value.foundation
  });

  assert.equal(candidate.reviewReady, true);
  assert.notEqual(candidate.candidate, null);
  assert.equal(candidate.truth.everyDownstreamFreeformFieldLiteralCopyChecked, true);
  assert.equal(candidate.truth.semanticOriginalityVerified, false);
  assert.equal(candidate.truth.creativeDirectionSelected, false);
  assert.equal(candidate.truth.productionApproved, false);

  const review = reviewCreativeTransferCandidate(candidate, {
    hypothesis,
    brief: value.brief,
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: value.foundation
  });
  assert.equal(review.reviewReady, true);
});

test('surface copy smuggled through adaptation-rule action is redacted at downstream egress', () => {
  const value = baseline();
  const hypothesis = buildCreativeTransferHypothesis({
    ...hypothesisInput(value.brief, {
      adaptationRuleResponses: [{
        rule: 're-express hierarchy through target-domain variables rather than source styling',
        action: 'Build the motion around an oversized red serif headline.'
      }]
    }),
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: value.foundation
  });

  // Structural Transfer review intentionally treats rule responses as audit metadata.
  // The downstream egress gate is the stronger all-freeform safety boundary.
  assert.equal(hypothesis.reviewReady, true);

  const candidate = buildCreativeTransferCandidate({
    hypothesis,
    brief: value.brief,
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: value.foundation
  });

  assert.equal(candidate.reviewReady, false);
  assert.equal(candidate.candidate, null);
  assert.ok(candidate.findings.some((item) => item.code === 'creative-transfer-candidate-literal-copy-blocked'));
  assert.equal(JSON.stringify(candidate).includes('oversized red serif headline'), false);
});

test('surface copy in mitigation, uncertainty or falsifier cannot reach downstream candidate payload', () => {
  const value = baseline();
  const hypothesis = buildCreativeTransferHypothesis({
    ...hypothesisInput(value.brief, {
      copyRiskMitigations: [{
        risk: 'reproducing the reference editorial costume',
        mitigation: 'Keep the oversized red serif headline but alter its timing.'
      }]
    }),
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: value.foundation
  });
  assert.equal(hypothesis.reviewReady, true);

  const candidate = buildCreativeTransferCandidate({
    hypothesis,
    brief: value.brief,
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: value.foundation
  });
  assert.equal(candidate.reviewReady, false);
  assert.equal(candidate.candidate, null);
  assert.ok(candidate.findings.some((item) => item.code === 'creative-transfer-candidate-literal-copy-blocked'));
});

test('candidate egress fails closed when hypothesis provenance is no longer valid', () => {
  const value = baseline();
  const hypothesis = buildCreativeTransferHypothesis({
    ...hypothesisInput(value.brief),
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: value.foundation
  });
  assert.equal(hypothesis.provenanceReady, true);

  const tamperedFoundation = structuredClone(value.foundation);
  tamperedFoundation.knowledgeLibrary.entries[0].definition = 'TAMPERED SOURCE';
  const candidate = buildCreativeTransferCandidate({
    hypothesis,
    brief: value.brief,
    retrieval: value.retrieval,
    graph: value.graph,
    foundation: tamperedFoundation
  });

  assert.equal(candidate.reviewReady, false);
  assert.equal(candidate.candidate, null);
  assert.ok(candidate.findings.some((item) => item.code === 'creative-transfer-candidate-source-provenance-blocked'));
});
