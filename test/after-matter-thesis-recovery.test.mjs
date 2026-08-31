import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { reviewCreativeThesisDeliberation } from '../modules/creative-thesis/intelligence.mjs';
import { reviewCreativeThesisAuthority } from '../modules/creative-thesis/authority.mjs';
import { buildAfterMatterThesisRecovery } from '../benchmarks/011-creative-motion-capability-dogfood/canonical-authority-recovery/thesis-recovery.mjs';

const brief = JSON.parse(fs.readFileSync('benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/dogfood-brief.json', 'utf8'));
const persistedDecision = JSON.parse(fs.readFileSync('benchmarks/011-creative-motion-capability-dogfood/canonical-authority-recovery/human-thesis-decision.json', 'utf8'));

function refingerprintDecision(decision) {
  const { decisionFingerprint: _fingerprint, provenance: _provenance, ...core } = decision;
  return { ...decision, decisionFingerprint: fingerprintCreativeValue(core) };
}

test('After Matter recovery authors a grounded, divergent Thesis packet without creating human or production authority', () => {
  const packet = buildAfterMatterThesisRecovery(brief);
  const statements = packet.deliberation.hypotheses.map((item) => item.statement);

  assert.equal(packet.status, 'awaiting-human-creative-thesis-approval');
  assert.equal(packet.historicalGrounding.frozenBriefFingerprint, fingerprintCreativeValue(brief));
  assert.equal(packet.historicalGrounding.historicalSelectedWorld.fingerprint, brief.canonicalCreativeWorldFingerprint);
  assert.equal(packet.deliberation.projectId, brief.projectId);
  assert.equal(packet.deliberation.hypotheses.length, 3);
  assert.equal(new Set(statements).size, 3);
  assert.equal(reviewCreativeThesisDeliberation(packet.deliberation).reviewReady, true);
  assert.equal(reviewCreativeThesis(packet.proposedCreativeThesis).reviewReady, true);
  assert.equal(packet.proposedCreativeThesis.truth.humanCreativeApproval, false);
  assert.equal(packet.humanDecision, null);
  assert.equal(packet.truth.humanCreativeApprovalRecordedByDecision, false);
  assert.equal(packet.truth.creativeWorldSelectionAuthorityCreated, false);
  assert.equal(packet.truth.productionApproved, false);
  assert.equal(packet.truth.geminiGenerationUsed, false);
  const rawFlag = structuredClone(packet.proposedCreativeThesis);
  rawFlag.truth.humanCreativeApproval = true;
  const authority = reviewCreativeThesisAuthority({ deliberation: packet.deliberation, thesis: rawFlag });
  assert.equal(authority.reviewReady, false);
  assert.ok(authority.findings.some((item) => item.code === 'creative-thesis-human-decision-missing'));
  assert.equal(packet.proposedCreativeThesis.governingIdea.statement, 'Let accumulated material change become the exhibition’s evidence system, so time is perceived through what the objects have endured rather than through decorative spectacle.');
  const thesisText = JSON.stringify({
    governingIdea: packet.proposedCreativeThesis.governingIdea,
    principles: packet.proposedCreativeThesis.principles,
    expressionTests: packet.proposedCreativeThesis.expressionTests,
    selectionRationale: packet.proposedCreativeThesis.selectionRationale,
    competitorTransferTest: packet.proposedCreativeThesis.competitorTransferTest
  });
  assert.doesNotMatch(thesisText, /each trace opens a route|choose a trace|object -> trace -> history -> return|one consequential trace|trace-as-route/i);
  assert.doesNotMatch(packet.proposedCreativeThesis.governingIdea.statement, /three\.js|webgl|webgpu|gsap|rive|blender|houdini|shader|scrolltrigger/i);
});

test('After Matter applies only an externally supplied, exact human refinement decision', () => {
  const recovery = buildAfterMatterThesisRecovery(brief);
  const approved = buildAfterMatterThesisRecovery(brief, { humanDecision: persistedDecision });
  assert.equal(approved.status, 'human-approved-thesis-awaiting-world-exploration');
  assert.equal(approved.proposedCreativeThesisFingerprint, '03f2924c14696c25fd1724522a434b79a19b8f46a13f0d8447b17732d48d8ca1');
  assert.equal(approved.humanDecision.decision, 'refine-candidate');
  assert.equal(approved.humanDecision.sourceCandidateId, 'trace-as-evidence-system');
  assert.equal(approved.humanDecision.sourceCandidateFingerprint, '61d7104db374256f0d485ef446d98de8f0f3d4794a6fa84dcebf37b9a29eb6b8');
  assert.equal(approved.humanDecision.decidedAt, '2026-08-31T13:35:27Z');
  assert.equal(approved.thesisAuthorityReview.reviewReady, true);
  assert.equal(approved.truth.creativeWorldSelectionAuthorityCreated, false);
  assert.equal(approved.truth.productionApproved, false);

  const changedThesis = structuredClone(recovery.proposedCreativeThesis);
  changedThesis.governingIdea.statement = 'Changed after approval.';
  const thesisDrift = reviewCreativeThesisAuthority({ deliberation: recovery.deliberation, thesis: changedThesis, humanDecision: persistedDecision });
  assert.equal(thesisDrift.reviewReady, false);
  assert.ok(thesisDrift.findings.some((item) => item.code === 'creative-thesis-human-decision-thesis-drift'));

  const changedDeliberation = structuredClone(recovery.deliberation);
  changedDeliberation.hypotheses[0].statement = 'Changed after approval.';
  const deliberationDrift = reviewCreativeThesisAuthority({ deliberation: changedDeliberation, thesis: recovery.proposedCreativeThesis, humanDecision: persistedDecision });
  assert.equal(deliberationDrift.reviewReady, false);
  assert.ok(deliberationDrift.findings.some((item) => item.code === 'creative-thesis-human-decision-deliberation-drift'));

  const sourceCandidateDrift = reviewCreativeThesisAuthority({ deliberation: changedDeliberation, thesis: recovery.proposedCreativeThesis, humanDecision: refingerprintDecision({ ...persistedDecision, sourceDeliberationFingerprint: fingerprintCreativeValue(changedDeliberation) }) });
  assert.equal(sourceCandidateDrift.reviewReady, false);
  assert.ok(sourceCandidateDrift.findings.some((item) => item.code === 'creative-thesis-human-decision-source-candidate-drift'));

  for (const [field, value] of [['decidedAt', '2026-09-01T00:00:00Z'], ['rationale', 'Changed approval rationale.'], ['humanConfirmed', false]]) {
    const mutated = buildAfterMatterThesisRecovery(brief, { humanDecision: { ...persistedDecision, [field]: value } });
    assert.equal(mutated.thesisAuthorityReview.reviewReady, false);
    assert.ok(mutated.thesisAuthorityReview.findings.some((item) => item.code === 'creative-thesis-human-decision-fingerprint-drift'));
  }
});
