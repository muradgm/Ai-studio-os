import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrieval } from '../modules/creative-knowledge-graph/retrieval.mjs';
import {
  buildCreativeTransferBrief,
  buildCreativeTransferHypothesis,
  reviewCreativeTransferBriefProvenance,
  reviewCreativeTransferHypothesis,
  reviewCreativeTransferHypothesisProvenance
} from '../modules/creative-transfer-intelligence/runtime.mjs';

function referenceEntry(id, overrides = {}) {
  return {
    id,
    kind: 'historical-precedent',
    domain: 'editorial-composition',
    title: `Reference ${id}`,
    definition: 'Concentrated asymmetry can create a strong first fixation while leaving surrounding information quieter.',
    causalRationale: 'Uneven visual mass changes fixation competition and creates a deliberate reading sequence when secondary material remains restrained.',
    perceptualEffects: ['strong first fixation', 'directed reading sequence'],
    worksWhen: ['one priority must dominate before supporting detail'],
    failsWhen: ['all content needs equal comparison weight'],
    creativeVariables: ['scale contrast', 'negative space', 'density'],
    crossDomainApplications: ['motion choreography', 'spatial sequencing'],
    failureModes: ['decorative asymmetry without hierarchy'],
    counterexamples: ['a comparison matrix where parity is the product requirement'],
    diagnostics: ['squint test preserves one unmistakable first fixation'],
    relationships: [],
    provenance: {
      sourceId: `source-${id}`,
      sourceType: 'curated-historical-reference',
      sourceRef: `archive://${id}`,
      capturedAt: '2026-08-01T00:00:00Z'
    },
    confidence: 0.9,
    confidenceBasis: 'Repeated perceptual pattern with explicit boundary conditions.',
    scope: 'general',
    transferability: 'Transfer causal hierarchy logic only; rebuild form for the target domain.',
    transfer: {
      transferablePrinciples: ['concentrate perceptual priority before releasing secondary detail'],
      surfaceSignature: ['oversized red serif headline on a cream field'],
      mustStrip: ['oversized red serif headline'],
      adaptationRules: ['re-express hierarchy through target-domain variables rather than source styling'],
      copyRisks: ['reproducing the reference editorial costume']
    },
    ...overrides
  };
}

function principleEntry(id, overrides = {}) {
  return {
    id,
    kind: 'principle',
    domain: 'motion',
    title: `Principle ${id}`,
    definition: 'Temporal contrast can clarify state change when stillness is preserved around meaningful transitions.',
    causalRationale: 'A sparse change field increases event salience because motion is not competing everywhere at once.',
    perceptualEffects: ['clear state change'],
    worksWhen: ['motion is reserved for meaningful transitions'],
    failsWhen: ['everything moves continuously'],
    creativeVariables: ['duration', 'stillness', 'spatial displacement'],
    crossDomainApplications: ['interaction design'],
    failureModes: ['ambient motion noise'],
    counterexamples: ['an intentionally continuous generative artwork'],
    diagnostics: ['pause the sequence and verify moving elements correspond to state change'],
    relationships: [],
    provenance: {
      sourceId: `source-${id}`,
      sourceType: 'curated-principle',
      sourceRef: `internal://${id}`
    },
    confidence: 0.88,
    confidenceBasis: 'Strong general evidence with project-dependent application.',
    scope: 'general',
    transferability: 'Broad with project adaptation.',
    transfer: {
      transferablePrinciples: [],
      surfaceSignature: [],
      mustStrip: [],
      adaptationRules: [],
      copyRisks: []
    },
    ...overrides
  };
}

function foundation(entries) {
  const result = buildCreativeIntelligenceFoundation({ entries });
  assert.equal(result.reviewReady, true);
  return result;
}

function retrievalFor(graph, overrides = {}) {
  return buildCreativeKnowledgeRetrieval({
    graph,
    projectId: 'project-a',
    asOf: '2026-08-28T12:00:00+02:00',
    purpose: 'Find qualified evidence for a cross-domain transfer hypothesis.',
    terms: ['concentrated'],
    ...overrides
  });
}

function transferBrief({ sourceFoundation, graph, retrieval, targetDomain = 'motion', projectTruths, constraints } = {}) {
  return buildCreativeTransferBrief({
    retrieval,
    graph,
    foundation: sourceFoundation,
    target: {
      domain: targetDomain,
      problem: 'Make the first meaningful transition unmistakable without turning the whole interface into motion theatre.',
      desiredEffect: 'One dominant transition followed by calm supporting disclosure.'
    },
    projectTruths: projectTruths ?? [
      { id: 'truth-1', statement: 'The product must communicate one primary state change before exposing secondary controls.' }
    ],
    constraints: constraints ?? ['Do not imitate recognizable editorial styling.']
  });
}

function validHypothesisInput(brief, overrides = {}) {
  return {
    brief,
    sourceKnowledgeIds: ['ref-a'],
    projectTruthRefs: ['truth-1'],
    counterevidenceKnowledgeIds: [],
    hiddenCounterevidenceAcknowledged: false,
    transferClaim: 'Stage one dominant state transition, then reveal supporting controls with substantially lower temporal emphasis.',
    causalBridge: 'The source principle concentrates perceptual priority through unequal visual mass; in motion, the analogous mechanism is unequal temporal salience created by one stronger transition surrounded by stillness.',
    targetConsequence: 'Users should identify the primary state change before attending to secondary controls.',
    adaptationActions: [
      'Reserve the largest displacement and timing contrast for the primary state transition.',
      'Keep secondary controls still until the primary transition settles.'
    ],
    strippedSurfaceSignatures: ['oversized red serif headline'],
    adaptationRuleResponses: [{
      rule: 're-express hierarchy through target-domain variables rather than source styling',
      action: 'Use timing, stillness and displacement as the hierarchy variables instead of editorial typography or color.'
    }],
    copyRiskMitigations: [{
      risk: 'reproducing the reference editorial costume',
      mitigation: 'Ban source typography/color composition from the motion concept and evaluate only temporal hierarchy.'
    }],
    uncertainty: 'The temporal analogy may become too theatrical if the primary transition is over-amplified.',
    falsifier: 'Reject the transfer if secondary comprehension slows or if the result begins to resemble the source reference stylistically.',
    ...overrides
  };
}

function buildBaseline() {
  const sourceFoundation = foundation([referenceEntry('ref-a')]);
  const graph = buildCreativeKnowledgeGraph({ foundation: sourceFoundation });
  assert.equal(graph.reviewReady, true);
  const retrieval = retrievalFor(graph);
  assert.equal(retrieval.reviewReady, true);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['ref-a']);
  const brief = transferBrief({ sourceFoundation, graph, retrieval });
  assert.equal(brief.reviewReady, true);
  assert.equal(brief.provenanceReady, true);
  return { sourceFoundation, graph, retrieval, brief };
}

test('valid cross-domain transfer keeps reference surface out and remains explicitly non-authoritative', () => {
  const baseline = buildBaseline();
  const hypothesis = buildCreativeTransferHypothesis({
    ...validHypothesisInput(baseline.brief),
    retrieval: baseline.retrieval,
    graph: baseline.graph,
    foundation: baseline.sourceFoundation
  });

  assert.equal(hypothesis.reviewReady, true);
  assert.equal(hypothesis.provenanceReady, true);
  assert.deepEqual(hypothesis.sourcePrinciples, [{
    knowledgeId: 'ref-a',
    principles: ['concentrate perceptual priority before releasing secondary detail']
  }]);
  assert.deepEqual(hypothesis.copyFirewallAssessment.exactSurfaceCopyHits, []);
  assert.equal(hypothesis.truth.semanticOriginalityVerified, false);
  assert.equal(hypothesis.truth.causalAlignmentSemanticallyVerified, false);
  assert.equal(hypothesis.truth.creativeDirectionSelected, false);
  assert.equal(hypothesis.truth.productionApproved, false);

  const provenance = reviewCreativeTransferHypothesisProvenance({
    hypothesis,
    brief: baseline.brief,
    retrieval: baseline.retrieval,
    graph: baseline.graph,
    foundation: baseline.sourceFoundation
  });
  assert.equal(provenance.reviewReady, true);
  assert.equal(provenance.truth.semanticOriginalityVerified, false);
  assert.equal(provenance.truth.transferAuthorityGranted, false);
});

test('literal normalized reproduction of a source surface signature blocks the hypothesis', () => {
  const baseline = buildBaseline();
  const hypothesis = buildCreativeTransferHypothesis({
    ...validHypothesisInput(baseline.brief, {
      transferClaim: 'Use an oversized red serif headline as the dominant transition motif.'
    }),
    retrieval: baseline.retrieval,
    graph: baseline.graph,
    foundation: baseline.sourceFoundation
  });

  assert.equal(hypothesis.reviewReady, false);
  assert.ok(hypothesis.findings.some((item) => item.code === 'creative-transfer-exact-surface-copy-detected'));
  assert.ok(hypothesis.copyFirewallAssessment.exactSurfaceCopyHits.includes('oversized red serif headline'));
});

test('unranked conflict context cannot be promoted into primary transfer source evidence', () => {
  const ref = referenceEntry('ref-a', {
    relationships: [{
      type: 'conflicts-with',
      targetId: 'counter-b',
      rationale: 'The counterexample favors parity over concentrated hierarchy.'
    }]
  });
  const counter = principleEntry('counter-b', {
    domain: 'editorial-composition',
    definition: 'Uniform emphasis can outperform hierarchy when direct comparison is the primary task.'
  });
  const sourceFoundation = foundation([ref, counter]);
  const graph = buildCreativeKnowledgeGraph({ foundation: sourceFoundation });
  const retrieval = retrievalFor(graph);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), ['ref-a']);
  assert.deepEqual(retrieval.conflictContext.map((item) => item.knowledgeId), ['counter-b']);
  const brief = transferBrief({ sourceFoundation, graph, retrieval });

  const hypothesis = buildCreativeTransferHypothesis({
    ...validHypothesisInput(brief, {
      sourceKnowledgeIds: ['counter-b'],
      strippedSurfaceSignatures: [],
      adaptationRuleResponses: [],
      copyRiskMitigations: []
    }),
    retrieval,
    graph,
    foundation: sourceFoundation
  });

  assert.equal(hypothesis.reviewReady, false);
  assert.ok(hypothesis.findings.some((item) => item.code === 'creative-transfer-source-evidence-invalid'));
});

test('visible conflict attached to selected source evidence cannot be silently omitted', () => {
  const ref = referenceEntry('ref-a', {
    relationships: [{
      type: 'conflicts-with',
      targetId: 'counter-b',
      rationale: 'The counterexample favors parity over concentrated hierarchy.'
    }]
  });
  const counter = principleEntry('counter-b', {
    domain: 'editorial-composition',
    definition: 'Uniform emphasis can outperform hierarchy when direct comparison is the primary task.'
  });
  const sourceFoundation = foundation([ref, counter]);
  const graph = buildCreativeKnowledgeGraph({ foundation: sourceFoundation });
  const retrieval = retrievalFor(graph);
  const brief = transferBrief({ sourceFoundation, graph, retrieval });

  const omitted = buildCreativeTransferHypothesis({
    ...validHypothesisInput(brief),
    retrieval,
    graph,
    foundation: sourceFoundation
  });
  assert.equal(omitted.reviewReady, false);
  assert.ok(omitted.findings.some((item) => item.code === 'creative-transfer-visible-counterevidence-omitted'));

  const acknowledged = buildCreativeTransferHypothesis({
    ...validHypothesisInput(brief, { counterevidenceKnowledgeIds: ['counter-b'] }),
    retrieval,
    graph,
    foundation: sourceFoundation
  });
  assert.equal(acknowledged.reviewReady, true);
});

test('withheld cross-project conflict requires explicit acknowledgment without leaking the foreign target', () => {
  const refA = referenceEntry('ref-a', {
    scope: 'project',
    projectId: 'project-a',
    relationships: [{
      type: 'conflicts-with',
      targetId: 'private-b',
      rationale: 'A foreign project observation contradicts this transfer premise.'
    }]
  });
  const privateText = 'PROJECT-B-TRANSFER-COUNTEREVIDENCE-MUST-NOT-LEAK';
  const privateB = principleEntry('private-b', {
    scope: 'project',
    projectId: 'project-b',
    domain: 'product-experience',
    definition: privateText,
    provenance: {
      sourceId: 'source-private-b',
      sourceType: 'project-observation',
      sourceRef: 'project://project-b/private'
    }
  });
  const sourceFoundation = foundation([refA, privateB]);
  const graph = buildCreativeKnowledgeGraph({ foundation: sourceFoundation });
  const retrieval = retrievalFor(graph);
  assert.equal(retrieval.results[0].withheldConflictPresent, true);
  assert.equal(JSON.stringify(retrieval).includes('private-b'), false);
  assert.equal(JSON.stringify(retrieval).includes(privateText), false);
  const brief = transferBrief({ sourceFoundation, graph, retrieval });
  assert.equal(JSON.stringify(brief).includes('private-b'), false);
  assert.equal(JSON.stringify(brief).includes(privateText), false);

  const missingAck = buildCreativeTransferHypothesis({
    ...validHypothesisInput(brief),
    retrieval,
    graph,
    foundation: sourceFoundation
  });
  assert.equal(missingAck.reviewReady, false);
  assert.ok(missingAck.findings.some((item) => item.code === 'creative-transfer-hidden-counterevidence-unacknowledged'));

  const acknowledged = buildCreativeTransferHypothesis({
    ...validHypothesisInput(brief, { hiddenCounterevidenceAcknowledged: true }),
    retrieval,
    graph,
    foundation: sourceFoundation
  });
  assert.equal(acknowledged.reviewReady, true);
  assert.equal(JSON.stringify(acknowledged).includes('private-b'), false);
  assert.equal(JSON.stringify(acknowledged).includes(privateText), false);
});

test('same-domain application cannot masquerade as cross-domain Creative Transfer', () => {
  const baseline = buildBaseline();
  const sameDomainBrief = transferBrief({
    sourceFoundation: baseline.sourceFoundation,
    graph: baseline.graph,
    retrieval: baseline.retrieval,
    targetDomain: 'editorial-composition'
  });
  assert.equal(sameDomainBrief.reviewReady, true);

  const hypothesis = buildCreativeTransferHypothesis({
    ...validHypothesisInput(sameDomainBrief),
    retrieval: baseline.retrieval,
    graph: baseline.graph,
    foundation: baseline.sourceFoundation
  });
  assert.equal(hypothesis.reviewReady, false);
  assert.ok(hypothesis.findings.some((item) => item.code === 'creative-transfer-cross-domain-source-missing'));
});

test('default hypothesis construction rejects forged cached provenance and consumes no source evidence', () => {
  const baseline = buildBaseline();
  const tamperedFoundation = structuredClone(baseline.sourceFoundation);
  tamperedFoundation.knowledgeLibrary.entries[0].definition = 'TAMPERED FOUNDATION SOURCE CONTENT';

  const forgedBrief = structuredClone(baseline.brief);
  forgedBrief.provenanceReady = true;

  const hypothesis = buildCreativeTransferHypothesis({
    ...validHypothesisInput(forgedBrief),
    retrieval: baseline.retrieval,
    graph: baseline.graph,
    foundation: tamperedFoundation
  });

  assert.equal(hypothesis.reviewReady, false);
  assert.deepEqual(hypothesis.sourceKnowledgeIds, []);
  assert.deepEqual(hypothesis.sourcePrinciples, []);
  assert.ok(hypothesis.findings.some((item) => item.code === 'creative-transfer-hypothesis-source-provenance-blocked'));

  const briefProvenance = reviewCreativeTransferBriefProvenance({
    brief: forgedBrief,
    retrieval: baseline.retrieval,
    graph: baseline.graph,
    foundation: tamperedFoundation
  });
  assert.equal(briefProvenance.reviewReady, false);
});

test('transfer artifacts cannot fabricate creative or production authority', () => {
  const baseline = buildBaseline();
  const hypothesis = buildCreativeTransferHypothesis({
    ...validHypothesisInput(baseline.brief),
    retrieval: baseline.retrieval,
    graph: baseline.graph,
    foundation: baseline.sourceFoundation
  });
  assert.equal(hypothesis.reviewReady, true);

  const forged = structuredClone(hypothesis);
  forged.creativeDirectionSelected = true;
  forged.productionApproved = true;
  const review = reviewCreativeTransferHypothesis(forged, { brief: baseline.brief });

  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-transfer-hypothesis-authority-fabricated'));
});
