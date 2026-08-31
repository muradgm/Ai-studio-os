import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { APPROVED_THESIS_FINGERPRINT, HISTORICAL_FRICTION_INDEX_FINGERPRINT, buildAfterMatterCreativeWorldRecovery } from '../benchmarks/011-creative-motion-capability-dogfood/canonical-world-recovery/world-recovery.mjs';

const thesisPacket = JSON.parse(fs.readFileSync('benchmarks/011-creative-motion-capability-dogfood/canonical-authority-recovery/creative-thesis-review-packet.json', 'utf8'));
const historicalSelection = JSON.parse(fs.readFileSync('benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/selection.json', 'utf8'));
const recovery = () => buildAfterMatterCreativeWorldRecovery({ thesisPacket, historicalSelection });

test('After Matter Creative World recovery requires the exact freshly reviewed canonical Thesis authority', () => {
  const good = recovery();
  assert.equal(good.approvedThesisFingerprint, APPROVED_THESIS_FINGERPRINT);
  assert.equal(good.thesisAuthorityReview.reviewReady, true);
  assert.equal(good.thesisAuthorityReview.authority.humanApproved, true);
  assert.equal(good.thesisAuthorityReview.authority.humanDecisionMode, 'refine-candidate');
  assert.equal(good.thesisAuthorityReview.authority.machineRecommendationWasNotFinalAuthority, true);
  const changed = structuredClone(thesisPacket); changed.proposedCreativeThesis.governingIdea.statement = 'changed after approval';
  const blocked = buildAfterMatterCreativeWorldRecovery({ thesisPacket: changed, historicalSelection });
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.exploration, undefined);
});

test('After Matter recovers the historical three worlds without inheriting selection authority', () => {
  const packet = recovery(); const ids = packet.exploration.worlds.map((world) => world.id);
  assert.deepEqual(ids, ['friction-index', 'repair-ledger', 'pressure-room']);
  assert.ok(!ids.includes('hundred-temporal-portraits'));
  assert.equal(packet.exploration.reviewReady, true);
  assert.equal(packet.exploration.selectedWorld, null);
  assert.equal(packet.truth.humanWorldSelectionConfirmed, false);
  assert.equal(packet.truth.selectedAutomatically, false);
  assert.equal(packet.truth.creativeDirectionAuthorityCreated, false);
  assert.equal(packet.truth.motionAuthorityCreated, false);
  assert.equal(packet.truth.productionApproved, false);
  assert.equal(packet.truth.geminiGenerationUsed, false);
});

test('Friction Index preserves historical authored decisions but records an independently bound canonical fingerprint', () => {
  const packet = recovery(); const friction = packet.exploration.worlds[0]; const record = packet.recoveryProvenance[0];
  assert.equal(friction.worldIdea, historicalSelection.selectedWorld.worldIdea);
  assert.equal(friction.signatureBehavior, historicalSelection.selectedWorld.signatureBehavior);
  assert.equal(friction.thesisRef.governingIdea, packet.approvedThesis.governingIdea.statement);
  assert.equal(record.historicalPhase0WorldFingerprint, HISTORICAL_FRICTION_INDEX_FINGERPRINT);
  assert.equal(record.canonicalRecoveredWorldFingerprint, fingerprintCreativeValue(friction));
  assert.notEqual(record.canonicalRecoveredWorldFingerprint, HISTORICAL_FRICTION_INDEX_FINGERPRINT);
});

test('newly authored Repair Ledger and Pressure Room are explicit, structurally divergent recoveries', () => {
  const packet = recovery();
  for (const record of packet.recoveryProvenance.filter((item) => item.worldId !== 'friction-index')) assert.equal(record.recoveryAuthorship, 'new-canonical-recovery-authorship');
  assert.equal(packet.structuralReview.divergence.length, 3);
  for (const pair of packet.structuralReview.divergence) { assert.equal(pair.heuristicPass, true); assert.ok(pair.differenceCount >= 4); }
  assert.equal(packet.exploration.worlds.every((world) => world.reviewReady), true);
  for (const world of packet.exploration.worlds) {
    const concept = [world.worldIdea, world.interpretationOfThesis, world.signatureBehavior, world.worldClass, world.narrativeModel, world.compositionModel].join(' ');
    assert.doesNotMatch(concept, /\b(three\.js|webgl|webgpu|gsap|rive|blender|houdini|shader|scrolltrigger)\b/i);
  }
});

test('Style Frame plan is complete, comparable and pre-selection only', () => {
  const packet = recovery(); const plan = packet.styleFramePlan;
  assert.equal(plan.reviewReady, true); assert.equal(plan.moments.length, 5); assert.equal(plan.frames.length, 15);
  assert.deepEqual(plan.moments.map((moment) => moment.id), ['exhibition-entry', 'object-detail-history', 'curatorial-reading', 'visit-ticketing', 'mobile-interpretation']);
  assert.equal(plan.frames.every((frame) => frame.productState), true);
  assert.equal(plan.frames.filter((frame) => frame.viewport === 'mobile').length, 3);
  assert.equal(plan.frames.every((frame) => frame.proofPolicy.typography === 'proxy-only-not-approved-family'), true);
  assert.equal(plan.frames.every((frame) => frame.truth.worldSelected === false), true);
});

test('persisted After Matter browser proof binds every planned frame and keeps placeholder imagery non-documentary', () => {
  const packet = JSON.parse(fs.readFileSync('benchmarks/011-creative-motion-capability-dogfood/canonical-world-recovery/creative-world-review-packet.json', 'utf8'));
  assert.equal(packet.visualProofEvidence.schema, 'ai-studio-os/style-frame-proof-evidence@2');
  assert.equal(packet.visualProofEvidence.reviewReady, true);
  assert.equal(packet.visualProofEvidence.truth.exactBrowserRaster, true);
  assert.equal(packet.renderedFrames.length, 15);
  assert.equal(packet.comparisonRefs.length, 5);
  assert.equal(packet.renderedFrames.every((frame) => fs.existsSync(frame.imageRef) && fs.existsSync(frame.sourceRef)), true);
  assert.equal(packet.exploration.worlds.every((world) => world.imageLanguage.includes('explicitly')), true);
  assert.equal(packet.truth.humanWorldSelectionConfirmed, false);
  assert.equal(packet.selectedWorld, null);
});
