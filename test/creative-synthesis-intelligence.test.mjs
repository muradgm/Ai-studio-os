import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrieval } from '../modules/creative-knowledge-graph/retrieval.mjs';
import {
  buildCreativeTransferBrief,
  buildCreativeTransferHypothesis
} from '../modules/creative-transfer-intelligence/runtime.mjs';
import { buildCreativeTransferCandidate } from '../modules/creative-transfer-intelligence/candidate.mjs';
import {
  buildCreativeSynthesisBrief,
  buildCreativeSynthesisSet,
  reviewCreativeSynthesisBriefProvenance,
  reviewCreativeSynthesisSet,
  reviewCreativeSynthesisSetProvenance
} from '../modules/creative-synthesis-intelligence/runtime.mjs';
import {
  buildCreativeSynthesisCandidateSet,
  reviewCreativeSynthesisCandidateSet
} from '../modules/creative-synthesis-intelligence/candidate.mjs';

function knowledgeEntry({ id, domain, term, principle, surface, strip, rule, risk }) {
  return {
    id,
    kind: 'principle',
    domain,
    title: `${term} synthesis source`,
    definition: `${term} can organize attention or progression when its causal role is explicit rather than decorative.`,
    causalRationale: `${term} changes how a person detects priority, transition, or sequence because it alters competition between simultaneous or successive cues.`,
    perceptualEffects: [`clear ${term} relationship`, 'directed attention'],
    worksWhen: ['one relationship must become legible before optional detail'],
    failsWhen: ['all elements require equal simultaneous weight'],
    creativeVariables: ['contrast', 'sequence', 'density'],
    crossDomainApplications: ['product experience', 'interaction systems'],
    failureModes: [`decorative ${term} without causal purpose`],
    counterexamples: ['a neutral comparison surface where parity is the primary task'],
    diagnostics: [`remove decorative styling and verify the ${term} relationship still changes comprehension`],
    relationships: [],
    provenance: {
      sourceId: `source-${id}`,
      sourceType: 'curated-principle',
      sourceRef: `internal://${id}`,
      capturedAt: '2026-08-01T00:00:00Z'
    },
    confidence: 0.9,
    confidenceBasis: 'Qualified causal principle with explicit boundary conditions.',
    scope: 'general',
    transferability: 'Transfer the causal principle only and rebuild expression for the target project.',
    transfer: {
      transferablePrinciples: [principle],
      surfaceSignature: [surface],
      mustStrip: [strip],
      adaptationRules: [rule],
      copyRisks: [risk]
    }
  };
}

const SOURCE_CONFIGS = {
  editorial: {
    id: 'source-editorial',
    domain: 'editorial-composition',
    term: 'hierarchy',
    principle: 'concentrate perceptual priority before releasing secondary detail',
    surface: 'oversized red serif headline on a cream field',
    strip: 'oversized red serif headline',
    rule: 're-express hierarchy through target-domain variables rather than source styling',
    risk: 'reproducing the editorial costume',
    transferClaim: 'Concentrate one primary interaction state before secondary options enter.',
    causalBridge: 'Unequal editorial emphasis becomes unequal interaction emphasis: one consequential state receives stronger timing and spatial priority while secondary controls remain quiet.',
    targetConsequence: 'The primary decision should register before optional detail competes for attention.',
    adaptationAction: 'Reserve the strongest timing and spatial change for the primary decision state.'
  },
  architecture: {
    id: 'source-architecture',
    domain: 'architecture',
    term: 'threshold',
    principle: 'use a threshold to make a change of state perceptible before entering the next condition',
    surface: 'brutalist concrete portal with a narrow vertical slit',
    strip: 'brutalist concrete portal',
    rule: 'translate spatial threshold logic into product-state transition logic',
    risk: 'copying monumental architectural styling',
    transferClaim: 'Make consequential product-state changes behave like deliberate crossings rather than instantaneous swaps.',
    causalBridge: 'A spatial threshold makes a boundary perceptible before entry; in product interaction the analogous mechanism is a staged state boundary that signals leaving one condition and entering another.',
    targetConsequence: 'Users should understand when an interaction has crossed into a materially different state.',
    adaptationAction: 'Give consequential state changes a clear before-boundary-after sequence without literal architectural imagery.'
  },
  music: {
    id: 'source-music',
    domain: 'music',
    term: 'rhythm',
    principle: 'alternate tension and release so progression remains perceptible across time',
    surface: 'staccato brass motif over a marching snare pattern',
    strip: 'staccato brass motif',
    rule: 'translate rhythmic tension and release into non-musical temporal behavior',
    risk: 'turning the interface into a literal musical visualization',
    transferClaim: 'Alternate held moments and release moments so multi-step progression has a perceptible cadence.',
    causalBridge: 'Musical tension and release make progression legible by varying temporal expectation; product interaction can use restrained pauses and releases to clarify sequence without constant animation.',
    targetConsequence: 'Multi-step flows should feel paced and legible rather than uniformly mechanical.',
    adaptationAction: 'Use brief holds before meaningful reveals and quieter timing between them.'
  }
};

function makeTransferSource(config, { projectId = 'project-a', id = config.id } = {}) {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [knowledgeEntry(config)] });
  assert.equal(foundation.reviewReady, true);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  assert.equal(graph.reviewReady, true);
  const retrieval = buildCreativeKnowledgeRetrieval({
    graph,
    projectId,
    asOf: '2026-08-28T12:00:00+02:00',
    purpose: 'Retrieve one qualified source for Creative Transfer before Synthesis.',
    terms: [config.term]
  });
  assert.equal(retrieval.reviewReady, true);
  assert.deepEqual(retrieval.results.map((item) => item.knowledgeId), [config.id]);

  const brief = buildCreativeTransferBrief({
    retrieval,
    graph,
    foundation,
    target: {
      domain: 'product-experience',
      problem: 'Make consequential state changes clear and authored without decorative theatre.',
      desiredEffect: 'A deliberate experience that communicates priority and progression.'
    },
    projectTruths: [{ id: 'transfer-truth-1', statement: 'The product must make consequential state changes understandable.' }],
    constraints: ['Do not reproduce recognizable source styling.']
  });
  assert.equal(brief.reviewReady, true);
  assert.equal(brief.provenanceReady, true);

  const hypothesis = buildCreativeTransferHypothesis({
    brief,
    retrieval,
    graph,
    foundation,
    sourceKnowledgeIds: [config.id],
    projectTruthRefs: ['transfer-truth-1'],
    counterevidenceKnowledgeIds: [],
    hiddenCounterevidenceAcknowledged: false,
    transferClaim: config.transferClaim,
    causalBridge: config.causalBridge,
    targetConsequence: config.targetConsequence,
    adaptationActions: [config.adaptationAction],
    strippedSurfaceSignatures: [config.strip],
    adaptationRuleResponses: [{
      rule: config.rule,
      action: `Apply the causal ${config.term} relationship through product timing, state, hierarchy, and interaction rather than source appearance.`
    }],
    copyRiskMitigations: [{
      risk: config.risk,
      mitigation: `Reject any concept that imports recognizable ${config.domain} surface styling into the product.`
    }],
    uncertainty: `The ${config.term} transfer may become over-emphasized if it slows routine interaction.`,
    falsifier: `Reject this transfer if the ${config.term} mechanism reduces comprehension or becomes recognizable source imitation.`
  });
  assert.equal(hypothesis.reviewReady, true);
  assert.equal(hypothesis.provenanceReady, true);

  const candidateArtifact = buildCreativeTransferCandidate({ hypothesis, brief, retrieval, graph, foundation });
  assert.equal(candidateArtifact.reviewReady, true);
  assert.ok(candidateArtifact.candidate);
  return { id, candidateArtifact, hypothesis, brief, retrieval, graph, foundation };
}

function sourceSet() {
  return [
    makeTransferSource(SOURCE_CONFIGS.editorial),
    makeTransferSource(SOURCE_CONFIGS.architecture),
    makeTransferSource(SOURCE_CONFIGS.music)
  ];
}

function buildSynthesisBrief(sources = sourceSet()) {
  return buildCreativeSynthesisBrief({
    projectId: 'project-a',
    target: {
      domain: 'product-experience',
      problem: 'Turn complex state changes into one authored interaction language without sacrificing clarity.',
      desiredEffect: 'A memorable but restrained sense of progression, boundary and priority.'
    },
    projectTruths: [
      { id: 'truth-1', statement: 'The product must make one consequential choice understandable before exposing optional depth.' },
      { id: 'truth-2', statement: 'The experience should feel authored and distinctive without becoming theatrical.' }
    ],
    contradictions: [
      { id: 'contradiction-1', statement: 'Users need immediate clarity, but the experience should not feel flat or mechanically obvious.' },
      { id: 'contradiction-2', statement: 'The interface must feel authored, but recognizable source styling cannot become the identity.' }
    ],
    constraints: ['No literal source styling.', 'Do not invent human approval or Creative Thesis selection.'],
    sources
  });
}

function validHypotheses(overrides = {}) {
  const hypotheses = [
    {
      id: 'hypothesis-threshold-priority',
      strategy: 'reinforcement',
      sourceCandidateIds: ['source-architecture', 'source-editorial'],
      sourceContributions: [
        { sourceCandidateId: 'source-architecture', contribution: 'Contributes an explicit before/after boundary for consequential state change.' },
        { sourceCandidateId: 'source-editorial', contribution: 'Contributes asymmetric emphasis so the boundary has one unmistakable primary consequence.' }
      ],
      projectTruthRefs: ['truth-1', 'truth-2'],
      contradictionRefs: ['contradiction-1'],
      governingIdea: 'Make consequential decisions feel like crossing a deliberate boundary toward one dominant next state.',
      productiveTension: 'Immediate comprehension × deliberate transition.',
      combinationMechanism: 'Boundary staging defines when state changes; asymmetric emphasis defines what matters most after the crossing.',
      experientialConsequences: ['The user senses a meaningful crossing and lands on one dominant next action before optional depth appears.'],
      antiGenericClaims: ['Reject instant panel swaps and equal-weight control reveals as the default interaction language.'],
      ownabilityRisk: 'The idea becomes generic if every state change receives the same ceremonial treatment.',
      competitorTransferTest: {
        question: 'Could a competitor apply the same boundary behavior without the product truth about consequential choice?',
        failureCondition: 'Reject the idea if removing the consequential-choice truth leaves the experience essentially unchanged.'
      },
      failureModes: ['Routine interactions become over-ceremonial.'],
      uncertainty: 'The boundary may need different intensity across high- and low-consequence actions.',
      falsifier: 'Reject if users take longer to understand the next state or if routine actions feel slowed for spectacle.',
      critique: ['The concept risks confusing deliberate transition with unnecessary friction.']
    },
    {
      id: 'hypothesis-held-release',
      strategy: 'productive-contradiction',
      sourceCandidateIds: ['source-architecture', 'source-music'],
      sourceContributions: [
        { sourceCandidateId: 'source-architecture', contribution: 'Contributes a legible state boundary that prevents temporal pacing from becoming vague ambience.' },
        { sourceCandidateId: 'source-music', contribution: 'Contributes alternating hold and release so progression has authored cadence without continuous motion.' }
      ],
      projectTruthRefs: ['truth-1', 'truth-2'],
      contradictionRefs: ['contradiction-1', 'contradiction-2'],
      governingIdea: 'Let important flows alternate between brief containment and decisive release, while ordinary actions remain nearly silent.',
      productiveTension: 'Restraint × momentum.',
      combinationMechanism: 'State boundaries create contained moments; temporal release makes only meaningful progression events perceptible.',
      experientialConsequences: ['Complex flows gain rhythm without turning every interaction into animation.'],
      antiGenericClaims: ['Reject constant ambient movement and uniformly timed transitions.'],
      ownabilityRisk: 'The idea becomes a fashionable motion rhythm if holds are detached from actual product consequence.',
      competitorTransferTest: {
        question: 'Would the cadence still make sense if copied into a product with no meaningful state boundaries?',
        failureCondition: 'Reject the idea if the pacing remains equally persuasive when product consequence and state boundaries are removed.'
      },
      failureModes: ['Pauses become decorative latency rather than useful anticipation.'],
      uncertainty: 'The correct amount of temporal restraint may differ by task frequency and user expertise.',
      falsifier: 'Reject if expert users experience the cadence as delay or if motion no longer corresponds to meaningful progression.',
      critique: ['Cadence can become mannerism unless consequence, not aesthetics, determines timing.']
    },
    {
      id: 'hypothesis-quiet-counterpoint',
      strategy: 'counterpoint',
      sourceCandidateIds: ['source-editorial', 'source-music'],
      sourceContributions: [
        { sourceCandidateId: 'source-editorial', contribution: 'Contributes one dominant emphasis channel that keeps the product hierarchy unmistakable.' },
        { sourceCandidateId: 'source-music', contribution: 'Contributes secondary temporal counterpoint that can reveal depth without competing with the dominant state.' }
      ],
      projectTruthRefs: ['truth-1', 'truth-2'],
      contradictionRefs: ['contradiction-2'],
      governingIdea: 'Pair one visually dominant state with a quieter temporal counterpoint that reveals optional depth only after priority is understood.',
      productiveTension: 'Dominance × quiet discovery.',
      combinationMechanism: 'Persistent hierarchy establishes the primary state while restrained temporal counterpoint introduces optional information later.',
      experientialConsequences: ['The interface feels layered and authored while preserving a clear first read.'],
      antiGenericClaims: ['Reject dashboards where every module enters with equal emphasis and identical motion.'],
      ownabilityRisk: 'The idea becomes transferable if the primary state is not tied to project-specific consequence.',
      competitorTransferTest: {
        question: 'Could the same dominance/counterpoint pattern be reused unchanged for any dashboard?',
        failureCondition: 'Reject the idea if the hierarchy remains convincing without the project truth that defines which choice is consequential.'
      },
      failureModes: ['Secondary counterpoint steals attention from the primary state.'],
      uncertainty: 'Some surfaces may require simultaneous comparison and therefore resist delayed optional depth.',
      falsifier: 'Reject on surfaces where delayed depth harms comparison or where secondary motion wins the first fixation.',
      critique: ['The pattern must not become a universal layout recipe; parity-critical surfaces need a different expression.']
    }
  ];
  return hypotheses.map((item, index) => ({ ...item, ...(overrides[index] ?? {}) }));
}

function baseline() {
  const sources = sourceSet();
  const brief = buildSynthesisBrief(sources);
  assert.equal(brief.reviewReady, true);
  assert.equal(brief.provenanceReady, true);
  assert.equal(brief.sourceCandidates.length, 3);
  const synthesis = buildCreativeSynthesisSet({ brief, sources, hypotheses: validHypotheses() });
  return { sources, brief, synthesis };
}

test('valid Creative Synthesis combines multiple verified Transfer candidates without producing a winner or authority', () => {
  const { sources, brief, synthesis } = baseline();
  assert.equal(synthesis.reviewReady, true);
  assert.equal(synthesis.provenanceReady, true);
  assert.equal(synthesis.hypotheses.length, 3);
  assert.equal(synthesis.truth.noWinnerOrRecommendationProduced, true);
  assert.equal(synthesis.truth.semanticDivergenceVerified, false);
  assert.equal(synthesis.truth.semanticSynthesisVerified, false);
  assert.equal(synthesis.truth.creativeThesisSelected, false);
  assert.equal(synthesis.truth.productionApproved, false);

  const provenance = reviewCreativeSynthesisSetProvenance({ synthesis, brief, sources });
  assert.equal(provenance.reviewReady, true);
  assert.equal(provenance.truth.semanticSynthesisVerified, false);

  const egress = buildCreativeSynthesisCandidateSet({ synthesis, brief, sources });
  assert.equal(egress.reviewReady, true);
  assert.equal(egress.candidates.length, 3);
  assert.equal(egress.truth.noWinnerOrRecommendationProduced, true);
  assert.equal(egress.truth.creativeThesisSelected, false);
  assert.equal(egress.truth.productionApproved, false);
  const egressReview = reviewCreativeSynthesisCandidateSet(egress, { synthesis, brief, sources });
  assert.equal(egressReview.reviewReady, true);
});

test('one forged Transfer provenance chain invalidates the entire Synthesis Brief instead of silently using the remaining sources', () => {
  const sources = sourceSet();
  const tampered = structuredClone(sources);
  const leakedClaim = tampered[0].candidateArtifact.candidate.transferClaim;
  tampered[1].foundation.knowledgeLibrary.entries[0].definition = 'TAMPERED ARCHITECTURE FOUNDATION';
  tampered[1].candidateArtifact.reviewReady = true;

  const brief = buildSynthesisBrief(tampered);
  assert.equal(brief.reviewReady, false);
  assert.equal(brief.provenanceReady, false);
  assert.deepEqual(brief.sourceCandidates, []);
  assert.equal(JSON.stringify(brief).includes(leakedClaim), false);
  assert.ok(brief.findings.some((item) => item.code === 'creative-synthesis-brief-source-provenance-blocked'));

  const provenance = reviewCreativeSynthesisBriefProvenance({ brief, sources: tampered });
  assert.equal(provenance.reviewReady, false);
});

test('cross-project Transfer candidate injection fails closed with no partial source content', () => {
  const sources = [
    makeTransferSource(SOURCE_CONFIGS.editorial),
    makeTransferSource(SOURCE_CONFIGS.architecture, { projectId: 'project-b' }),
    makeTransferSource(SOURCE_CONFIGS.music)
  ];
  const brief = buildSynthesisBrief(sources);
  assert.equal(brief.reviewReady, false);
  assert.deepEqual(brief.sourceCandidates, []);
  assert.equal(brief.sourceBinding.allSourcesVerified, false);

  const provenance = reviewCreativeSynthesisBriefProvenance({ brief, sources });
  assert.equal(provenance.reviewReady, false);
  assert.ok(provenance.findings.some((item) => item.code === 'creative-synthesis-brief-provenance-project-drift'));
});

test('the same Transfer candidate cannot be aliased twice to manufacture source multiplicity', () => {
  const original = makeTransferSource(SOURCE_CONFIGS.editorial);
  const alias = structuredClone(original);
  alias.id = 'source-editorial-alias';
  const brief = buildSynthesisBrief([original, alias]);
  assert.equal(brief.reviewReady, false);
  assert.deepEqual(brief.sourceCandidates, []);
  const provenance = reviewCreativeSynthesisBriefProvenance({ brief, sources: [original, alias] });
  assert.equal(provenance.reviewReady, false);
  assert.ok(provenance.findings.some((item) => item.code === 'creative-synthesis-brief-provenance-candidate-duplicate'));
});

test('Synthesis requires at least three hypotheses and three distinct structural strategies', () => {
  const sources = sourceSet();
  const brief = buildSynthesisBrief(sources);
  const onlyTwo = buildCreativeSynthesisSet({ brief, sources, hypotheses: validHypotheses().slice(0, 2) });
  assert.equal(onlyTwo.reviewReady, false);
  assert.ok(onlyTwo.findings.some((item) => item.code === 'creative-synthesis-hypothesis-count-thin'));
  assert.ok(onlyTwo.findings.some((item) => item.code === 'creative-synthesis-strategy-divergence-thin'));

  const sameStrategy = buildCreativeSynthesisSet({
    brief,
    sources,
    hypotheses: validHypotheses({
      1: { strategy: 'reinforcement' },
      2: { strategy: 'reinforcement' }
    })
  });
  assert.equal(sameStrategy.reviewReady, false);
  assert.ok(sameStrategy.findings.some((item) => item.code === 'creative-synthesis-strategy-divergence-thin'));
  assert.equal(sameStrategy.truth.semanticDivergenceVerified, false);
});

test('renaming one identical hypothesis payload does not count as divergence', () => {
  const sources = sourceSet();
  const brief = buildSynthesisBrief(sources);
  const hypotheses = validHypotheses();
  hypotheses[1] = structuredClone(hypotheses[0]);
  hypotheses[1].id = 'renamed-copy';
  const synthesis = buildCreativeSynthesisSet({ brief, sources, hypotheses });
  assert.equal(synthesis.reviewReady, false);
  assert.ok(synthesis.findings.some((item) => item.code === 'creative-synthesis-hypothesis-payload-duplicate'));
});

test('each hypothesis must account exactly for every Transfer source it claims to synthesize', () => {
  const sources = sourceSet();
  const brief = buildSynthesisBrief(sources);
  const hypotheses = validHypotheses();
  hypotheses[0].sourceContributions = hypotheses[0].sourceContributions.slice(0, 1);
  const synthesis = buildCreativeSynthesisSet({ brief, sources, hypotheses });
  assert.equal(synthesis.reviewReady, false);
  assert.ok(synthesis.findings.some((item) => item.code === 'creative-synthesis-source-contribution-set-drift'));
});

test('complete literal restatement of a Transfer candidate is blocked and downstream egress redacts all candidates', () => {
  const sources = sourceSet();
  const brief = buildSynthesisBrief(sources);
  const copiedPhrase = sources[0].candidateArtifact.candidate.transferClaim;
  const hypotheses = validHypotheses();
  hypotheses[0].governingIdea = copiedPhrase;
  const synthesis = buildCreativeSynthesisSet({ brief, sources, hypotheses });
  assert.equal(synthesis.reviewReady, false);
  assert.ok(synthesis.findings.some((item) => item.code === 'creative-synthesis-source-restatement-detected'));

  const egress = buildCreativeSynthesisCandidateSet({ synthesis, brief, sources });
  assert.equal(egress.reviewReady, false);
  assert.equal(egress.candidates, null);
  assert.equal(JSON.stringify(egress.findings).includes(copiedPhrase), false);
});

test('zero-width format characters cannot smuggle a literal Transfer phrase through Synthesis', () => {
  const sources = sourceSet();
  const brief = buildSynthesisBrief(sources);
  const copiedPhrase = sources[1].candidateArtifact.candidate.transferClaim;
  const smuggled = copiedPhrase.replace('consequential', 'conse\u200Bquential');
  const hypotheses = validHypotheses();
  hypotheses[1].governingIdea = smuggled;
  const synthesis = buildCreativeSynthesisSet({ brief, sources, hypotheses });
  assert.equal(synthesis.reviewReady, false);
  assert.ok(synthesis.findings.some((item) => item.code === 'creative-synthesis-source-restatement-detected'));
  const egress = buildCreativeSynthesisCandidateSet({ synthesis, brief, sources });
  assert.equal(egress.candidates, null);
});

test('unused productive contradictions keep the Synthesis set provisional', () => {
  const sources = sourceSet();
  const brief = buildSynthesisBrief(sources);
  const hypotheses = validHypotheses().map((item) => ({ ...item, contradictionRefs: ['contradiction-1'] }));
  const synthesis = buildCreativeSynthesisSet({ brief, sources, hypotheses });
  assert.equal(synthesis.reviewReady, false);
  assert.equal(synthesis.status, 'provisional');
  assert.ok(synthesis.findings.some((item) => item.code === 'creative-synthesis-contradiction-coverage-thin'));
});

test('winner, score, selection and approval fields are outside the Synthesis contract', () => {
  const { brief, synthesis } = baseline();
  const tampered = structuredClone(synthesis);
  tampered.winner = 'hypothesis-threshold-priority';
  tampered.score = 9.9;
  tampered.truth.creativeThesisSelected = true;
  const review = reviewCreativeSynthesisSet(tampered, { brief });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-synthesis-set-shape-invalid'));
  assert.ok(review.findings.some((item) => item.code === 'creative-synthesis-set-truth-drift'));
  assert.ok(review.findings.some((item) => item.code === 'creative-synthesis-set-authority-fabricated'));
});

test('forged cached Synthesis provenance cannot make downstream candidates survive a tampered Transfer source', () => {
  const { sources, brief, synthesis } = baseline();
  const tamperedSources = structuredClone(sources);
  tamperedSources[2].foundation.knowledgeLibrary.entries[0].causalRationale = 'FORGED SOURCE CAUSALITY';
  const forgedSynthesis = structuredClone(synthesis);
  forgedSynthesis.provenanceReady = true;
  forgedSynthesis.reviewReady = true;

  const egress = buildCreativeSynthesisCandidateSet({ synthesis: forgedSynthesis, brief, sources: tamperedSources });
  assert.equal(egress.reviewReady, false);
  assert.equal(egress.candidates, null);
  assert.ok(egress.findings.some((item) => item.code === 'creative-synthesis-candidate-set-source-provenance-blocked'));
});
