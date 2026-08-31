import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeThesisDeliberation, authoredCandidateFromDeliberation } from '../modules/creative-thesis/intelligence.mjs';
import { buildCreativeThesisHumanDecision, reviewCreativeThesisAuthority } from '../modules/creative-thesis/authority.mjs';
import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';

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
  const thesis = buildCreativeThesis({
    projectId: delib.projectId,
    intent: 'Create a distinctive digital experience rooted in the physical service ritual.',
    businessTruths: delib.sourceTruths,
    inspiration: { opportunityGaps: delib.sourceOpportunities },
    antiPrinciples: ['generic premium storytelling', 'decorative luxury coding'],
    audience: 'Customers choosing and ordering crafted products',
    commercialObjective: 'Increase product understanding and ordering confidence',
    authoredCandidate: candidate
  });
  return {
    ...thesis,
    ...overrides
  };
}

function decisionFor(delib, thesis, overrides = {}) {
  return buildCreativeThesisHumanDecision({
    deliberation: delib,
    thesis,
    decision: 'approve-recommendation',
    sourceCandidateId: delib.selection.hypothesisId,
    rationale: 'The human approves the reviewed recommendation.',
    humanConfirmed: true,
    decidedAt: '2026-08-31T10:00:00.000Z',
    evidenceRef: 'decision://creative-thesis/project-a',
    ...overrides
  });
}

test('canonical thesis authority requires deliberation provenance plus human approval', () => {
  const delib = deliberation();
  assert.equal(delib.reviewReady, true);
  const thesis = thesisFrom(delib);
  const result = reviewCreativeThesisAuthority({ deliberation: delib, thesis, humanDecision: decisionFor(delib, thesis) });
  assert.equal(result.pass, true);
  assert.equal(result.status, 'authoritative');
  assert.equal(result.authority.kind, 'canonical-creative-thesis');
  assert.equal(result.authority.projectId, 'project-a');
  assert.equal(result.authority.governingIdea, 'Make service thresholds the architecture of the experience.');
  assert.equal(result.truth.deliberationRecomputedAtAuthorityBoundary, true);
  assert.equal(result.truth.thesisRecomputedAtAuthorityBoundary, true);
  assert.equal(result.truth.deliberationProjectIdentityRequired, true);
});

test('human refinement, alternative selection, and human-authored Thesis remain explicit decision modes', () => {
  const delib = deliberation();
  const refined = thesisFrom(delib, { governingIdea: { statement: 'Let material craft make each service decision visibly consequential without turning ritual into theatre.' } });
  const refinement = reviewCreativeThesisAuthority({ deliberation: delib, thesis: refined, humanDecision: decisionFor(delib, refined, { decision: 'refine-candidate', refinementSummary: 'Generalize thresholds into material craft and consequential service behavior.' }) });
  assert.equal(refinement.pass, true);
  assert.equal(refinement.authority.humanRefined, true);

  const alternative = thesisFrom(delib, { governingIdea: { statement: delib.hypotheses[1].statement }, creativeTension: { label: delib.hypotheses[1].tension } });
  const selectedAlternative = reviewCreativeThesisAuthority({ deliberation: delib, thesis: alternative, humanDecision: decisionFor(delib, alternative, { decision: 'select-alternative', sourceCandidateId: 'material', rationale: 'The human selects the reviewed material candidate.' }) });
  assert.equal(selectedAlternative.pass, true);

  const authored = thesisFrom(delib, { governingIdea: { statement: 'Make the physical service ritual legible through deliberate material evidence and calm utility.' } });
  const humanAuthored = reviewCreativeThesisAuthority({ deliberation: delib, thesis: authored, humanDecision: decisionFor(delib, authored, { decision: 'human-authored-after-deliberation', sourceCandidateId: '', rationale: 'The human authors a new Thesis after considering the reviewed deliberation.' }) });
  assert.equal(humanAuthored.pass, true);
});

test('canonical thesis authority rejects fabricated deliberation reviewReady flags', () => {
  const delib = deliberation();
  delib.hypotheses = delib.hypotheses.slice(0, 1);
  delib.reviewReady = true;
  delib.pass = true;
  const thesis = thesisFrom(deliberation());
  const result = reviewCreativeThesisAuthority({ deliberation: delib, thesis, humanDecision: decisionFor(deliberation(), thesis) });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-deliberation-not-ready'));
});

test('canonical thesis authority rejects fabricated thesis reviewReady flags', () => {
  const delib = deliberation();
  const thesis = thesisFrom(delib);
  thesis.intent = '';
  thesis.reviewReady = true;
  thesis.pass = true;
  const result = reviewCreativeThesisAuthority({ deliberation: delib, thesis, humanDecision: decisionFor(delib, thesis) });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-thesis-not-ready'));
});

test('canonical thesis authority requires deliberation project identity', () => {
  const delib = deliberation();
  delete delib.projectId;
  const thesis = thesisFrom(deliberation());
  const result = reviewCreativeThesisAuthority({ deliberation: delib, thesis, humanDecision: decisionFor(deliberation(), thesis) });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-project-identity-missing'));
});

test('canonical thesis authority rejects deliberation and thesis from different projects', () => {
  const delib = deliberation();
  const thesis = thesisFrom(delib, { projectId: 'project-b' });
  const result = reviewCreativeThesisAuthority({ deliberation: delib, thesis, humanDecision: decisionFor(deliberation(), thesis) });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-project-drift'));
});

test('canonical thesis authority fails on governing-idea drift', () => {
  const delib = deliberation();
  const result = reviewCreativeThesisAuthority({
    deliberation: delib,
    thesis: thesisFrom(delib, { governingIdea: { statement: 'A convenient but unrelated idea.' } }),
    humanDecision: decisionFor(delib, thesisFrom(delib, { governingIdea: { statement: 'A convenient but unrelated idea.' } }))
  });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-governing-idea-drift'));
});

test('canonical thesis authority fails on creative-tension drift', () => {
  const delib = deliberation();
  const result = reviewCreativeThesisAuthority({
    deliberation: delib,
    thesis: thesisFrom(delib, { creativeTension: { label: 'unrelated × tension' } }),
    humanDecision: decisionFor(delib, thesisFrom(delib, { creativeTension: { label: 'unrelated × tension' } }))
  });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-authority-tension-drift'));
});

test('canonical thesis authority rejects unbound flags and human-decision provenance drift', () => {
  const delib = deliberation();
  const thesis = thesisFrom(delib);
  thesis.truth.humanCreativeApproval = true;
  const result = reviewCreativeThesisAuthority({ deliberation: delib, thesis });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'creative-thesis-human-decision-schema-invalid'));

  const decision = decisionFor(delib, thesis, { decision: 'refine-candidate', sourceCandidateId: 'missing', refinementSummary: 'Attempted unsupported refinement.' });
  const drift = reviewCreativeThesisAuthority({ deliberation: delib, thesis, humanDecision: decision });
  assert.equal(drift.pass, false);
  assert.ok(drift.findings.some((item) => item.code === 'creative-thesis-human-decision-source-candidate-drift'));
});

test('human Thesis decisions fail closed on confirmation, project, deliberation, Thesis, source, and structural drift', () => {
  const delib = deliberation();
  const thesis = thesisFrom(delib);
  const refresh = (decision) => ({ ...decision, decisionFingerprint: fingerprintCreativeValue(Object.fromEntries(Object.entries(decision).filter(([key]) => key !== 'decisionFingerprint'))) });
  const cases = [
    ['confirmation', { humanConfirmed: false }, 'creative-thesis-human-decision-confirmation-missing'],
    ['project', { projectId: 'project-b' }, 'creative-thesis-human-decision-project-drift'],
    ['deliberation', { sourceDeliberationFingerprint: 'd'.repeat(64) }, 'creative-thesis-human-decision-deliberation-drift'],
    ['source candidate', { sourceCandidateFingerprint: 'c'.repeat(64) }, 'creative-thesis-human-decision-source-candidate-drift']
  ];
  for (const [, mutation, code] of cases) {
    const result = reviewCreativeThesisAuthority({ deliberation: delib, thesis, humanDecision: refresh({ ...decisionFor(delib, thesis), ...mutation }) });
    assert.equal(result.pass, false);
    assert.ok(result.findings.some((item) => item.code === code));
  }

  const approved = decisionFor(delib, thesis);
  const changedThesis = { ...thesis, governingIdea: { statement: 'Changed after approval.' } };
  const thesisDrift = reviewCreativeThesisAuthority({ deliberation: delib, thesis: changedThesis, humanDecision: approved });
  assert.equal(thesisDrift.pass, false);
  assert.ok(thesisDrift.findings.some((item) => item.code === 'creative-thesis-human-decision-thesis-drift'));

  const structurallyInvalid = { ...thesis, intent: '' };
  const invalidDecision = decisionFor(delib, structurallyInvalid);
  const structural = reviewCreativeThesisAuthority({ deliberation: delib, thesis: structurallyInvalid, humanDecision: invalidDecision });
  assert.equal(structural.pass, false);
  assert.ok(structural.findings.some((item) => item.code === 'creative-thesis-authority-thesis-not-ready'));
});
