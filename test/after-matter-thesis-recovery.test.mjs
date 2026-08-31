import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { reviewCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { reviewCreativeThesisDeliberation } from '../modules/creative-thesis/intelligence.mjs';
import { buildAfterMatterThesisRecovery } from '../benchmarks/011-creative-motion-capability-dogfood/canonical-authority-recovery/thesis-recovery.mjs';

const brief = JSON.parse(fs.readFileSync('benchmarks/011-creative-motion-capability-dogfood/runs/after-matter-phase0/dogfood-brief.json', 'utf8'));

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
  assert.equal(packet.truth.humanCreativeApproval, false);
  assert.equal(packet.truth.creativeWorldSelectionAuthorityCreated, false);
  assert.equal(packet.truth.productionApproved, false);
  assert.equal(packet.truth.geminiGenerationUsed, false);
  assert.doesNotMatch(packet.proposedCreativeThesis.governingIdea.statement, /three\.js|webgl|webgpu|gsap|rive|blender|houdini|shader|scrolltrigger/i);
});
