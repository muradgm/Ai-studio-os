import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeThesisDeliberation, authoredCandidateFromDeliberation } from '../modules/creative-thesis/intelligence.mjs';
import { reviewCreativeThesisAuthority } from '../modules/creative-thesis/authority.mjs';

function deliberation() {
  return buildCreativeThesisDeliberation({
    projectId: 'project-a',
    businessTruths: ['Physical service ritual', 'Material product craft'],
    opportunityGaps: ['Turn service truth into a distinctive experience'],
    contradictions: ['speed × ceremony', 'precision × pleasure'],
    hypotheses: [
      {
        id: 'ritual',
        statement: 'Make service thresholds the architecture of the experience.',
        tension: 'speed × ceremony',
        truthRefs: ['Physical service ritual'],
        opportunityRefs: ['Turn service truth into a distinctive experience'],
        crossDomainConnections: ['service × choreography'],
        experientialConsequences: ['Navigation follows service thresholds.'],
        commercialConsequences: ['Ordering clarity remains structural.'],
        antiGenericClaims: ['Reject generic premium storytelling.'],
        critique: ['Could become theatrical if utility weakens.']
      },
      {
        id: 'material',
        statement: 'Make material transformation the evidence of craft.',
        tension: 'precision × impermanence',
        truthRefs: ['Material product craft'],
        opportunityRefs: ['Turn service truth into a distinctive experience'],
        crossDomainConnections: ['craft × material science'],
        experientialConsequences: ['Detail views expose transformation.'],
        commercialConsequences: ['Product evidence carries premium value.'],
        antiGenericClaims: ['Reject decorative luxury codes.'],
        critique: ['Needs stronger service connection.']
      },
      {
        id: 'restraint',
        statement: 'Use restraint to amplify moments of sensory intensity.',
        tension: 'control × pleasure',
        truthRefs: ['Material product craft'],
        opportunityRefs: ['Turn service truth into a distinctive experience'],
        crossDomainConnections: ['editorial pacing × sensory contrast'],
        experientialConsequences: ['Pacing creates contrast around product reveals.'],
        commercialConsequences: ['Product richness remains the premium signal.'],
        antiGenericClaims: ['Reject ornamental abundance.'],
        critique: ['Could transfer to competitors unless anchored to service.']
      }
    ],
    selection: {
      hypothesisId: 'ritual',
      rationale: 'It converts the most project-specific operational truth into experience structure.',
      competitorTransferJudgment: 'A competitor without the same service thresholds cannot reuse it unchanged.',
      strategicRelevanceJudgment: 'It differentiates through an existing business behavior.',
      experientialPotentialJudgment: 'It can govern navigation, motion, hierarchy and responsive sequencing.'
    }
  });
}

function thesisFrom(delib, overrides = {}) {
  const candidate = authoredCandidateFromDeliberation(delib);
  return {
    schema: 'ai-studio-os/creative-thesis@1',
    projectId: delib.projectId,
    pass: true,
    reviewReady: true,
    governingIdea: { statement: candidate.governingIdea, singular: true },
    creativeTension: { label: candidate.creativeTension, traits: [] },
    truth: { humanCreativeApproval: true },
    ...overrides
  };
}

test('canonical thesis authority requires deliberation provenance plus human approval', () => {
  const delib = deliberation();
  assert.equal(delib.reviewReady, true);
  const result = reviewCreativeThesisAuthority({ deliberation: delib, thesis: thesisFrom(delib) });
  assert.equal(result.pass, true);
  assert.equal(result.status, 'authoritative');
  assert.equal(result.authority.kind, 'canonical-creative-thesis');
  assert.equal(result.authority.governingIdea, 'Make service thresholds the architecture of the experience.');
});

test('canonical thesis authority fails on governing-idea drift', () => {
  const delib = deliberation();
  const result = reviewCreativeThesisAuthority({
    deliberation: delib,
    thesis: thesisFrom(delib, { governingIdea: { statement: 'A convenient but unrelated idea.' } })
  });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-governing-idea-drift'));
});

test('canonical thesis authority fails on creative-tension drift', () => {
  const delib = deliberation();
  const result = reviewCreativeThesisAuthority({
    deliberation: delib,
    thesis: thesisFrom(delib, { creativeTension: { label: 'unrelated × tension' } })
  });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-tension-drift'));
});

test('canonical thesis authority cannot be self-approved by deliberation', () => {
  const delib = deliberation();
  const result = reviewCreativeThesisAuthority({
    deliberation: delib,
    thesis: thesisFrom(delib, { truth: { humanCreativeApproval: false } })
  });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-human-approval-missing'));
});
