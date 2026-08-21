import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildInspirationPacket } from '../modules/inspiration/runtime.mjs';
import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../modules/creative-world/runtime.mjs';
import { buildArtDirectionExploration } from '../modules/art-direction-exploration/runtime.mjs';

const lock = JSON.parse(fs.readFileSync(new URL('../projects/du-bonheur/counter-ritual-v2/EXPERIENCE_THESIS_LOCK.json', import.meta.url)));
const authored = JSON.parse(fs.readFileSync(new URL('../projects/du-bonheur/counter-ritual-v2/art-directions.json', import.meta.url))).directions;
const benchmark = JSON.parse(fs.readFileSync(new URL('../benchmarks/001-du-bonheur/input.json', import.meta.url)));

function canonicalSelection() {
  const inspiration = buildInspirationPacket(benchmark.inspiration);
  const thesis = buildCreativeThesis({
    projectId: benchmark.id,
    intent: benchmark.intent,
    businessTruths: benchmark.businessTruths,
    inspiration,
    traits: benchmark.creativeTraits,
    antiPrinciples: benchmark.antiPrinciples,
    authoredCandidate: benchmark.creativeThesisCandidate
  });
  const exploration = buildCreativeWorldExploration({ creativeThesis: thesis, authoredWorlds: benchmark.creativeWorldCandidates });
  return selectCreativeWorld(exploration, {
    worldId: 'counter-ritual',
    humanConfirmed: true,
    rationale: lock.selectionRationale
  });
}

test('Counter Ritual experience thesis is human-selected while current art direction remains unapproved', () => {
  assert.equal(lock.worldId, 'counter-ritual');
  assert.equal(lock.truth.humanExperienceThesisSelectionConfirmed, true);
  assert.equal(lock.truth.currentArtDirectionApproved, false);
  assert.equal(lock.truth.productionReady, false);
  assert.deepEqual(lock.lockedSequence, ['arrival','attention','choice','preparation','handoff','return']);
});

test('experience thesis lock is traceable to the canonical Counter Ritual Creative World', () => {
  const selected = canonicalSelection();
  assert.equal(selected.truth.humanWorldSelectionConfirmed, true);
  assert.equal(selected.selectedWorld.id, lock.worldId);
  assert.equal(selected.selectedWorld.worldIdea, lock.lockedExperienceIdea);
  assert.equal(selected.selectedWorld.truth.humanCreativeSelectionConfirmed, true);
  assert.equal(selected.selectedWorld.truth.styleFrameReviewComplete, false);
});

test('three authored Counter Ritual directions are structurally review-ready', () => {
  const output = buildArtDirectionExploration({ experienceLock: lock, authoredDirections: authored });
  assert.equal(output.status, 'ready-for-visual-proof');
  assert.equal(output.reviewReady, true);
  assert.equal(output.directions.length, 3);
  assert.ok(output.divergence.every((pair) => pair.pass === true));
  assert.ok(output.divergence.every((pair) => pair.differenceCount >= 5));
});

test('art direction candidates preserve the locked service sequence while freeing visual form', () => {
  const output = buildArtDirectionExploration({ experienceLock: lock, authoredDirections: authored });
  for (const direction of output.directions) {
    assert.deepEqual(direction.experienceThesisRef.lockedSequence, lock.lockedSequence);
    assert.equal(direction.experienceThesisRef.worldId, 'counter-ritual');
    assert.equal(direction.truth.humanVisualApproval, false);
    assert.equal(direction.truth.productionTechnologyApproved, false);
  }
  assert.equal(new Set(output.directions.map((direction) => direction.colorBehavior)).size, 3);
  assert.equal(new Set(output.directions.map((direction) => direction.typographicBehavior)).size, 3);
});

test('unconfirmed experience thesis blocks art direction exploration', () => {
  const badLock = structuredClone(lock);
  badLock.truth.humanExperienceThesisSelectionConfirmed = false;
  const output = buildArtDirectionExploration({ experienceLock: badLock, authoredDirections: authored });
  assert.equal(output.status, 'blocked');
  assert.ok(output.findings.some((item) => item.code === 'art-direction-experience-lock-unconfirmed'));
});

test('cosmetic copies fail the divergence gate', () => {
  const copies = authored.map((direction, index) => ({ ...structuredClone(authored[0]), id: `copy-${index}`, label: `Copy ${index}` }));
  const output = buildArtDirectionExploration({ experienceLock: lock, authoredDirections: copies });
  assert.equal(output.reviewReady, false);
  assert.ok(output.findings.some((item) => item.code === 'art-direction-cosmetic-variation'));
});
