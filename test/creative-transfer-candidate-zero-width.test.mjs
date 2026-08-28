import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeIntelligenceFoundation } from '../modules/creative-intelligence-foundation/runtime.mjs';
import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrieval } from '../modules/creative-knowledge-graph/retrieval.mjs';
import { buildCreativeTransferBrief, buildCreativeTransferHypothesis } from '../modules/creative-transfer-intelligence/runtime.mjs';
import { buildCreativeTransferCandidate } from '../modules/creative-transfer-intelligence/candidate.mjs';

function sourceEntry() {
  return {
    id: 'ref-a',
    kind: 'historical-precedent',
    domain: 'editorial-composition',
    title: 'Reference',
    definition: 'Concentrated hierarchy can create a deliberate first fixation.',
    causalRationale: 'Unequal visual mass changes fixation competition.',
    perceptualEffects: ['first fixation'],
    worksWhen: ['one priority dominates'],
    failsWhen: ['parity is required'],
    creativeVariables: ['scale'],
    crossDomainApplications: ['motion'],
    failureModes: ['decorative hierarchy'],
    counterexamples: ['equal-weight comparison matrix'],
    diagnostics: ['squint test'],
    relationships: [],
    provenance: { sourceId: 'source-ref-a', sourceType: 'historical-reference', sourceRef: 'archive://ref-a' },
    confidence: 0.9,
    confidenceBasis: 'Qualified reference evidence.',
    scope: 'general',
    transferability: 'Transfer mechanism only.',
    transfer: {
      transferablePrinciples: ['concentrate priority before secondary detail'],
      surfaceSignature: ['oversized red serif headline'],
      mustStrip: ['oversized red serif headline'],
      adaptationRules: ['use target-domain variables'],
      copyRisks: ['copying source styling']
    }
  };
}

test('candidate egress removes Unicode format characters before literal copy comparison', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [sourceEntry()] });
  assert.equal(foundation.reviewReady, true);
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = buildCreativeKnowledgeRetrieval({
    graph,
    projectId: 'project-a',
    asOf: '2026-08-28T12:00:00+02:00',
    purpose: 'Transfer hierarchy into motion.',
    terms: ['concentrated']
  });
  const brief = buildCreativeTransferBrief({
    retrieval,
    graph,
    foundation,
    target: { domain: 'motion', problem: 'Clarify state transition.', desiredEffect: 'One strong transition.' },
    projectTruths: [{ id: 'truth-1', statement: 'One state change must dominate.' }]
  });
  assert.equal(brief.provenanceReady, true);

  const zeroWidthCopy = 'over\u200Bsized red serif headline';
  const hypothesis = buildCreativeTransferHypothesis({
    brief,
    retrieval,
    graph,
    foundation,
    sourceKnowledgeIds: ['ref-a'],
    projectTruthRefs: ['truth-1'],
    transferClaim: 'Use one dominant transition.',
    causalBridge: 'Temporal contrast transfers the hierarchy mechanism.',
    targetConsequence: 'The state change reads first.',
    adaptationActions: ['Reserve the strongest motion for the state change.'],
    strippedSurfaceSignatures: ['oversized red serif headline'],
    adaptationRuleResponses: [{ rule: 'use target-domain variables', action: `Use ${zeroWidthCopy} as the motion motif.` }],
    copyRiskMitigations: [{ risk: 'copying source styling', mitigation: 'Keep source styling out of the candidate.' }],
    uncertainty: 'The motion may become too strong.',
    falsifier: 'Reject if hierarchy becomes theatrical.'
  });
  assert.equal(hypothesis.reviewReady, true);

  const candidate = buildCreativeTransferCandidate({ hypothesis, brief, retrieval, graph, foundation });
  assert.equal(candidate.reviewReady, false);
  assert.equal(candidate.candidate, null);
  assert.ok(candidate.findings.some((item) => item.code === 'creative-transfer-candidate-literal-copy-blocked'));
  assert.equal(JSON.stringify(candidate).includes(zeroWidthCopy), false);
});
