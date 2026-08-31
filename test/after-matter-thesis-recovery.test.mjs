import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { reviewCreativeThesisDeliberation } from '../modules/creative-thesis/intelligence.mjs';
import { buildCreativeThesisHumanDecision, reviewCreativeThesisAuthority } from '../modules/creative-thesis/authority.mjs';
import { buildAfterMatterThesisRecovery } from '../benchmarks/011-creative-motion-capability-dogfood/canonical-authority-recovery/thesis-recovery.mjs';

const brief = JSON.parse(fs.readFileSync('benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/dogfood-brief.json', 'utf8'));

function approvedDecision(recovery, overrides = {}) {
  return buildCreativeThesisHumanDecision({
    deliberation: recovery.deliberation,
    thesis: recovery.proposedCreativeThesis,
    decision: 'refine-candidate',
    sourceCandidateId: 'trace-as-evidence-system',
    rationale: 'The trace-as-evidence recommendation contained a strong project-specific principle but prematurely promoted Friction Index’s trace-navigation mechanism into Thesis authority. The human refinement preserves accumulated material change as evidence of lived time while leaving the Creative World layer free to determine how that evidence organizes the experience.',
    refinementSummary: 'Generalize the Thesis from trace-navigation into accumulated material change as evidence, preserving the later Creative World decision about how that evidence organizes the experience.',
    humanConfirmed: true,
    decidedAt: '2026-08-31T11:00:00.000Z',
    evidenceRef: 'test://after-matter-human-thesis-decision',
    ...overrides
  });
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
  const decision = approvedDecision(recovery);
  const approved = buildAfterMatterThesisRecovery(brief, { humanDecision: decision });
  assert.equal(approved.status, 'human-approved-thesis-awaiting-world-exploration');
  assert.equal(approved.proposedCreativeThesisFingerprint, '03f2924c14696c25fd1724522a434b79a19b8f46a13f0d8447b17732d48d8ca1');
  assert.equal(approved.humanDecision.decision, 'refine-candidate');
  assert.equal(approved.humanDecision.sourceCandidateId, 'trace-as-evidence-system');
  assert.equal(approved.thesisAuthorityReview.reviewReady, true);
  assert.equal(approved.truth.creativeWorldSelectionAuthorityCreated, false);
  assert.equal(approved.truth.productionApproved, false);

  const changedThesis = structuredClone(recovery.proposedCreativeThesis);
  changedThesis.governingIdea.statement = 'Changed after approval.';
  const thesisDrift = reviewCreativeThesisAuthority({ deliberation: recovery.deliberation, thesis: changedThesis, humanDecision: decision });
  assert.equal(thesisDrift.reviewReady, false);
  assert.ok(thesisDrift.findings.some((item) => item.code === 'creative-thesis-human-decision-thesis-drift'));

  const changedDeliberation = structuredClone(recovery.deliberation);
  changedDeliberation.hypotheses[0].statement = 'Changed after approval.';
  const deliberationDrift = reviewCreativeThesisAuthority({ deliberation: changedDeliberation, thesis: recovery.proposedCreativeThesis, humanDecision: decision });
  assert.equal(deliberationDrift.reviewReady, false);
  assert.ok(deliberationDrift.findings.some((item) => item.code === 'creative-thesis-human-decision-deliberation-drift'));

  const unconfirmed = buildAfterMatterThesisRecovery(brief, { humanDecision: approvedDecision(recovery, { humanConfirmed: false }) });
  assert.equal(unconfirmed.thesisAuthorityReview.reviewReady, false);
  assert.ok(unconfirmed.thesisAuthorityReview.findings.some((item) => item.code === 'creative-thesis-human-decision-confirmation-missing'));
});
