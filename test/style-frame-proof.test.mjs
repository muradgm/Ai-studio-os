import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { buildCreativeWorldExploration } from '../modules/creative-world/runtime.mjs';
import { buildStyleFrameProof, STYLE_FRAME_TYPES } from '../modules/style-frame/runtime.mjs';
import { buildInspirationPacket } from '../modules/inspiration/runtime.mjs';
import { runCreativeRuntime } from '../lib/creative-runtime.mjs';

const input = JSON.parse(fs.readFileSync(new URL('../benchmarks/001-du-bonheur/input.json', import.meta.url)));

function readyExploration() {
  const inspiration = buildInspirationPacket(input.inspiration);
  const thesis = buildCreativeThesis({
    projectId: input.id,
    intent: input.intent,
    businessTruths: input.businessTruths,
    inspiration,
    traits: input.creativeTraits,
    antiPrinciples: input.antiPrinciples,
    authoredCandidate: input.creativeThesisCandidate
  });
  return buildCreativeWorldExploration({ creativeThesis: thesis, authoredWorlds: input.creativeWorldCandidates });
}

test('style-frame proof plans five comparable moments for every Creative World', () => {
  const proof = buildStyleFrameProof({ exploration: readyExploration() });
  assert.equal(proof.status, 'ready-for-browser-proof');
  assert.equal(proof.reviewReady, true);
  assert.equal(proof.frames.length, input.creativeWorldCandidates.length * STYLE_FRAME_TYPES.length);
  for (const world of input.creativeWorldCandidates) {
    const frames = proof.frames.filter((frame) => frame.worldId === world.id);
    assert.deepEqual(new Set(frames.map((frame) => frame.frameType)), new Set(STYLE_FRAME_TYPES.map((frame) => frame.id)));
  }
});

test('pre-selection proof cannot claim typography approval, documentary synthesis, or human selection', () => {
  const proof = buildStyleFrameProof({ exploration: readyExploration() });
  for (const frame of proof.frames) {
    assert.equal(frame.proofPolicy.typography, 'proxy-only-not-approved-family');
    assert.equal(frame.proofPolicy.syntheticProductClaim, false);
    assert.equal(frame.truth.humanVisualApproval, false);
    assert.equal(frame.truth.worldSelected, false);
    assert.equal(frame.truth.typographyApproved, false);
  }
  assert.equal(proof.truth.worldSelectedAutomatically, false);
  assert.equal(proof.selection, null);
});

test('style-frame proof blocks when Creative World Exploration is not review-ready', () => {
  const bad = buildCreativeWorldExploration({ creativeThesis: null, authoredWorlds: [] });
  const proof = buildStyleFrameProof({ exploration: bad });
  assert.equal(proof.status, 'blocked');
  assert.equal(proof.reviewReady, false);
  assert.ok(proof.findings.some((finding) => finding.code === 'style-frame-world-exploration-not-ready'));
});

test('Du Bonheur Creative Runtime exposes visual proof before any world is selected', () => {
  const output = runCreativeRuntime(input);
  assert.ok(output.stages.includes('style-frame-proof'));
  assert.equal(output.styleFrameProof.reviewReady, true);
  assert.equal(output.styleFrameProof.frames.length, 15);
  assert.equal(output.selectedCreativeWorld, null);
  assert.equal(output.styleFrameProof.truth.worldSelectedAutomatically, false);
  assert.equal(output.status, 'provisional');
});
