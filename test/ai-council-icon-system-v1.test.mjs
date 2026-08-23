import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import {
  buildIconSemanticInventory,
  buildIconWorldExploration,
  buildIconCalibrationProofEvidence,
  REQUIRED_ICON_WORLDS,
  REQUIRED_CALIBRATION_ICONS,
  REQUIRED_SIZE_MATRIX
} from '../modules/icon-system/runtime.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));

const visualApproval = await read('visual-system-v1-human-approval.json');
const inventoryInput = await read('icon-semantic-inventory-v1.json');
const explorationInput = await read('icon-world-exploration-v1.json');

function build() {
  const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: visualApproval });
  const exploration = buildIconWorldExploration(explorationInput, { inventory });
  return { inventory, exploration };
}

test('AI Council Icon semantic inventory is human-Visual-System-bound and calibration-ready', () => {
  const { inventory } = build();
  assert.equal(inventory.reviewReady, true, JSON.stringify(inventory.findings, null, 2));
  assert.equal(inventory.status, 'ready-for-icon-world-exploration');
  assert.equal(inventory.icons.length, 25);
  assert.deepEqual(inventory.calibrationSet, REQUIRED_CALIBRATION_ICONS);
  assert.ok(inventory.inventoryFingerprint);
  assert.equal(inventory.truth.iconSemanticInventoryAuthored, true);
  assert.equal(inventory.truth.iconWorldHumanSelected, false);
  assert.equal(inventory.truth.iconSystemHumanApproved, false);
  assert.equal(inventory.truth.finalVisualSystemApproved, false);
});

test('Icon inventory separates brand-semantic concepts from convention-dominant controls', () => {
  const { inventory } = build();
  const byId = new Map(inventory.icons.map((icon) => [icon.id, icon]));
  for (const id of ['council', 'evidence', 'decision', 'memory', 'provenance', 'supersede', 'authority', 'verification']) {
    assert.equal(byId.get(id)?.semanticClass, 'brand-semantic', `${id} should be brand-semantic`);
  }
  for (const id of ['search', 'settings', 'attach', 'send', 'edit', 'retry']) {
    assert.equal(byId.get(id)?.semanticClass, 'convention-dominant', `${id} should preserve convention`);
  }
});

test('Three controlled Icon Worlds remain unselected and use the existing Vector Geometry contract', () => {
  const { exploration } = build();
  assert.equal(exploration.reviewReady, true, JSON.stringify(exploration.findings, null, 2));
  assert.equal(exploration.status, 'ready-for-calibration-browser-proof');
  assert.deepEqual(exploration.worlds.map((world) => world.id), REQUIRED_ICON_WORLDS);
  assert.equal(exploration.quiverLineAuthority, 'hypothesis-only');
  assert.equal(exploration.selection, null);
  assert.equal(exploration.selectedWorld, null);
  assert.ok(exploration.inventoryRef.fingerprint);
  for (const world of exploration.worlds) {
    assert.deepEqual(world.geometrySpec.targetSizes, REQUIRED_SIZE_MATRIX);
    assert.equal(world.selected, false);
    assert.equal(world.humanSelected, false);
  }
  assert.equal(exploration.truth.quiverLineSelected, false);
  assert.equal(exploration.truth.iconWorldHumanSelected, false);
});

test('Icon World exploration rejects accidental Quiver authority or automatic selection', () => {
  const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: visualApproval });

  const quiverSelected = structuredClone(explorationInput);
  quiverSelected.quiverLineAuthority = 'selected';
  quiverSelected.worlds[0].selected = true;
  const quiverResult = buildIconWorldExploration(quiverSelected, { inventory });
  assert.equal(quiverResult.reviewReady, false);
  assert.ok(quiverResult.findings.some((item) => item.code === 'quiver-line-authority-overclaimed'));
  assert.ok(quiverResult.findings.some((item) => item.code === 'icon-world-selection-fabricated'));

  const autoSelection = structuredClone(explorationInput);
  autoSelection.selection = { worldId: 'provenance-glyph', method: 'automatic' };
  autoSelection.selectedWorld = 'provenance-glyph';
  const selectedResult = buildIconWorldExploration(autoSelection, { inventory });
  assert.equal(selectedResult.reviewReady, false);
  assert.ok(selectedResult.findings.some((item) => item.code === 'icon-world-selection-present'));
});

test('Icon calibration proof requires all three worlds, all ten concepts, and real interface evidence', () => {
  const { exploration } = build();
  const blocked = buildIconCalibrationProofEvidence({ exploration });
  assert.equal(blocked.reviewReady, false);
  assert.ok(blocked.findings.some((item) => item.code === 'icon-proof-world-missing'));

  const worldEvidence = REQUIRED_ICON_WORLDS.map((worldId) => ({
    worldId,
    calibrationCoverage: '10/10',
    sizeMatrixCoverage: '7/7',
    specimenRef: `artifacts/ai-council/icon-system-v1-calibration/${worldId}-specimen.png`,
    interfaceRef: `artifacts/ai-council/icon-system-v1-calibration/${worldId}-interface.png`,
    svgIntegrityPass: true,
    exactBrowserProof: true
  }));
  const semanticComparisons = REQUIRED_CALIBRATION_ICONS.map((iconId) => ({ iconId, imageRef: `${iconId}.png` }));
  const interfaceEvidence = REQUIRED_ICON_WORLDS.map((worldId) => ({ worldId, imageRef: `${worldId}-interface.png` }));
  const ready = buildIconCalibrationProofEvidence({ exploration, worldEvidence, semanticComparisons, interfaceEvidence });
  assert.equal(ready.reviewReady, true, JSON.stringify(ready.findings, null, 2));
  assert.equal(ready.status, 'ready-for-human-icon-world-review');
  assert.equal(ready.truth.iconWorldExplorationComplete, true);
  assert.equal(ready.truth.iconWorldHumanSelected, false);
  assert.equal(ready.truth.iconSystemHumanApproved, false);
});

test('Icon exploration fails closed without human Visual System approval', () => {
  const unapproved = structuredClone(visualApproval);
  unapproved.truth.humanVisualApproval = false;
  const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: unapproved });
  assert.equal(inventory.reviewReady, false);
  assert.ok(inventory.findings.some((item) => item.code === 'icon-inventory-visual-authority-missing'));
});
