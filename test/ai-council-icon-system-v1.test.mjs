import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import {
  buildIconSemanticInventory,
  buildIconWorldExploration,
  buildIconCalibrationProofEvidence,
  buildIndependentIconWorldReview,
  auditIconDisplayPolicy,
  shouldDisplayIcon,
  REQUIRED_ICON_WORLDS,
  REQUIRED_CALIBRATION_ICONS,
  REQUIRED_SIZE_MATRIX,
  REQUIRED_CONFUSING_PAIRS,
  REQUIRED_LABEL_BLIND_PAIRS
} from '../modules/icon-system/runtime.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const visualApproval = await read('visual-system-v1-human-approval.json');
const inventoryInput = await read('icon-semantic-inventory-v1.json');
const explorationInput = await read('icon-world-exploration-v1.json');
const independentReviewInput = await read('icon-world-independent-review-v1.json');

function build() {
  const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: visualApproval });
  const exploration = buildIconWorldExploration(explorationInput, { inventory });
  return { inventory, exploration };
}

function evidenceSet() {
  const { exploration } = build();
  const worldEvidence = REQUIRED_ICON_WORLDS.map((worldId) => ({
    worldId,
    calibrationCoverage: '10/10',
    sizeMatrixCoverage: '7/7',
    specimenRef: `${worldId}-specimen.png`,
    interfaceRef: `${worldId}-interface.png`,
    svgIntegrityPass: true,
    exactBrowserProof: true
  }));
  const semanticComparisons = REQUIRED_CALIBRATION_ICONS.map((iconId) => ({ iconId, imageRef: `${iconId}.png` }));
  const interfaceEvidence = REQUIRED_ICON_WORLDS.map((worldId) => ({ worldId, imageRef: `${worldId}-interface.png`, exactBrowserProof: true }));
  const denseEvidence = REQUIRED_ICON_WORLDS.map((worldId) => ({ worldId, imageRef: `${worldId}-dense.png`, exactBrowserProof: true }));
  const mobileEvidence = REQUIRED_ICON_WORLDS.map((worldId) => ({ worldId, imageRef: `${worldId}-mobile.png`, exactBrowserProof: true }));
  const labelBlindEvidence = REQUIRED_ICON_WORLDS.map((worldId) => ({ worldId, imageRef: `${worldId}-blind.png`, exactBrowserProof: true }));
  const displayPolicyAudit = { pass: true, findings: [], decisions: [] };
  const confusingPairsRef = { imageRef: 'confusing-pairs.png', exactBrowserProof: true };
  return { exploration, worldEvidence, semanticComparisons, interfaceEvidence, denseEvidence, mobileEvidence, labelBlindEvidence, displayPolicyAudit, confusingPairsRef };
}

test('AI Council Icon semantic inventory is Visual-System-bound and display-policy-ready', () => {
  const { inventory } = build();
  assert.equal(inventory.reviewReady, true, JSON.stringify(inventory.findings, null, 2));
  assert.equal(inventory.status, 'ready-for-icon-world-exploration');
  assert.equal(inventory.icons.length, 26);
  assert.deepEqual(inventory.calibrationSet, REQUIRED_CALIBRATION_ICONS);
  assert.ok(inventory.inventoryFingerprint);
  assert.equal(inventory.displayPolicy.suppressWhenRedundant, true);
  assert.equal(inventory.displayPolicy.optionalDefaultsSuppressedInDenseSurfaces, true);
  for (const icon of inventory.icons) {
    assert.ok(['essential','conditional','optional'].includes(icon.displayPriority), icon.id);
    assert.ok(icon.displayRule, icon.id);
  }
  assert.equal(inventory.truth.iconSemanticInventoryAuthored, true);
  assert.equal(inventory.truth.iconWorldHumanSelected, false);
  assert.equal(inventory.truth.iconSystemHumanApproved, false);
});

test('Icon inventory separates brand-semantic concepts from convention-dominant controls', () => {
  const { inventory } = build();
  const byId = new Map(inventory.icons.map((icon) => [icon.id, icon]));
  for (const id of ['council','evidence','decision','memory','provenance','supersede','authority','verification']) {
    assert.equal(byId.get(id)?.semanticClass, 'brand-semantic', `${id} should be brand-semantic`);
  }
  for (const id of ['search','settings','attach','send','edit','retry','back']) {
    assert.equal(byId.get(id)?.semanticClass, 'convention-dominant', `${id} should preserve convention`);
  }
});

test('displayPriority suppresses redundant repetition while preserving semantic safety and icon-only controls', () => {
  const { inventory } = build();
  const byId = new Map(inventory.icons.map((icon) => [icon.id, icon]));
  assert.equal(shouldDisplayIcon(byId.get('memory'), { repetitive: true, addsInformation: false }), false);
  assert.equal(shouldDisplayIcon(byId.get('evidence'), { repetitive: true, addsInformation: false }), false);
  assert.equal(shouldDisplayIcon(byId.get('evidence'), { repetitive: true, addsInformation: true }), true);
  assert.equal(shouldDisplayIcon(byId.get('authority'), { semanticSafety: true }), true);
  assert.equal(shouldDisplayIcon(byId.get('attach'), { iconOnlyControl: true }), true);

  const good = auditIconDisplayPolicy({ inventory, opportunities: [
    { id:'m1', iconId:'memory', repetitive:true, addsInformation:false, rendered:false },
    { id:'e1', iconId:'evidence', repetitive:true, addsInformation:true, rendered:true },
    { id:'a1', iconId:'authority', semanticSafety:true, rendered:true }
  ] });
  assert.equal(good.pass, true);
  const bad = auditIconDisplayPolicy({ inventory, opportunities: [
    { id:'m1', iconId:'memory', repetitive:true, addsInformation:false, rendered:true }
  ] });
  assert.equal(bad.pass, false);
  assert.ok(bad.findings.some((item) => item.code === 'icon-display-policy-violation'));
});

test('Three controlled Icon Worlds require the expanded hardening contract and remain unselected', () => {
  const { exploration } = build();
  assert.equal(exploration.reviewReady, true, JSON.stringify(exploration.findings, null, 2));
  assert.equal(exploration.status, 'ready-for-calibration-hardening-browser-proof');
  assert.deepEqual(exploration.worlds.map((world) => world.id), REQUIRED_ICON_WORLDS);
  assert.equal(exploration.quiverLineAuthority, 'hypothesis-only');
  assert.equal(exploration.selection, null);
  assert.equal(exploration.selectedWorld, null);
  assert.equal(exploration.proofRequirements.hybridRecommendationAllowed, false);
  assert.equal(exploration.proofRequirements.denseSystemProof, true);
  assert.equal(exploration.proofRequirements.mobileComposerProof, true);
  assert.equal(exploration.proofRequirements.labelBlindRecognitionProof, true);
  for (const pair of REQUIRED_CONFUSING_PAIRS) assert.ok(exploration.proofRequirements.confusingPairs.some((item) => JSON.stringify(item) === JSON.stringify(pair)));
  for (const pair of REQUIRED_LABEL_BLIND_PAIRS) assert.ok(exploration.proofRequirements.labelBlindPairs.some((item) => JSON.stringify(item) === JSON.stringify(pair)));
  for (const world of exploration.worlds) {
    assert.deepEqual(world.geometrySpec.targetSizes, REQUIRED_SIZE_MATRIX);
    assert.equal(world.selected, false);
    assert.equal(world.humanSelected, false);
  }
});

test('Icon World exploration rejects accidental Quiver authority, automatic selection, or hybrid recommendation', () => {
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

  const hybrid = structuredClone(explorationInput);
  hybrid.proofRequirements.hybridRecommendationAllowed = true;
  const hybridResult = buildIconWorldExploration(hybrid, { inventory });
  assert.equal(hybridResult.reviewReady, false);
  assert.ok(hybridResult.findings.some((item) => item.code === 'icon-world-hybrid-review-leak'));
});

test('Hardening proof fails closed without dense, mobile, label-blind, collision, and display-policy evidence', () => {
  const { exploration, worldEvidence, semanticComparisons, interfaceEvidence } = evidenceSet();
  const blocked = buildIconCalibrationProofEvidence({ exploration, worldEvidence, semanticComparisons, interfaceEvidence });
  assert.equal(blocked.reviewReady, false);
  assert.ok(blocked.findings.some((item) => item.code === 'icon-proof-dense-system-incomplete'));
  assert.ok(blocked.findings.some((item) => item.code === 'icon-proof-mobile-composer-incomplete'));
  assert.ok(blocked.findings.some((item) => item.code === 'icon-proof-label-blind-recognition-incomplete'));
  assert.ok(blocked.findings.some((item) => item.code === 'icon-proof-display-policy-invalid'));
});

test('Hardened proof becomes ready only for independent Icon World review, never selection', () => {
  const evidence = evidenceSet();
  const ready = buildIconCalibrationProofEvidence(evidence);
  assert.equal(ready.reviewReady, true, JSON.stringify(ready.findings, null, 2));
  assert.equal(ready.status, 'ready-for-independent-icon-world-review');
  assert.equal(ready.truth.iconWorldExplorationComplete, true);
  assert.equal(ready.truth.semanticCollisionReviewComplete, true);
  assert.equal(ready.truth.denseIconProofComplete, true);
  assert.equal(ready.truth.mobileIconProofComplete, true);
  assert.equal(ready.truth.labelBlindRecognitionProofComplete, true);
  assert.equal(ready.truth.independentIconWorldReviewComplete, false);
  assert.equal(ready.truth.iconWorldHumanSelected, false);
  assert.equal(ready.truth.iconSystemHumanApproved, false);
});

test('Independent Icon World review may rank but cannot hybridize or fabricate human selection', () => {
  const proof = buildIconCalibrationProofEvidence(evidenceSet());
  const input = {
    schema: 'ai-studio-os/icon-world-independent-review@1',
    projectId: 'ai-council',
    id: 'test-independent-review',
    proofRef: { explorationFingerprint: proof.explorationFingerprint },
    hybridRecommendationAllowed: false,
    selectedWorld: null,
    iconWorldHumanSelected: false,
    worldAssessments: REQUIRED_ICON_WORLDS.map((worldId) => ({
      worldId,
      semanticAssessment: 'inspected',
      opticalAssessment: 'inspected',
      densityAssessment: 'inspected',
      mobileAssessment: 'inspected',
      verdict: 'reviewed'
    }))
  };
  const ready = buildIndependentIconWorldReview(input, { proof });
  assert.equal(ready.reviewReady, true, JSON.stringify(ready.findings, null, 2));
  assert.equal(ready.status, 'ready-for-human-icon-world-selection');
  assert.equal(ready.truth.independentIconWorldReviewComplete, true);
  assert.equal(ready.truth.iconWorldHumanSelected, false);

  const selected = structuredClone(input);
  selected.selectedWorld = 'provenance-glyph';
  selected.iconWorldHumanSelected = true;
  const blocked = buildIndependentIconWorldReview(selected, { proof });
  assert.equal(blocked.reviewReady, false);
  assert.ok(blocked.findings.some((item) => item.code === 'icon-independent-review-selection-fabricated'));
});

test('Committed AI Council independent review binds the hardened proof and stops before human selection', () => {
  const proof = buildIconCalibrationProofEvidence(evidenceSet());
  assert.equal(independentReviewInput.proofRef.explorationFingerprint, proof.explorationFingerprint);
  const review = buildIndependentIconWorldReview(independentReviewInput, { proof });
  assert.equal(review.reviewReady, true, JSON.stringify(review.findings, null, 2));
  assert.equal(review.status, 'ready-for-human-icon-world-selection');
  assert.equal(review.hybridRecommendationAllowed, false);
  assert.deepEqual(review.ranking, ['provenance-glyph','editorial-sign','quiver-construct']);
  assert.equal(review.recommendation.worldId, 'provenance-glyph');
  assert.equal(review.selectedWorld, null);
  assert.equal(review.truth.independentIconWorldReviewComplete, true);
  assert.equal(review.truth.iconWorldHumanSelected, false);
  assert.equal(review.truth.iconSystemHumanApproved, false);
  assert.equal(review.truth.finalVisualSystemApproved, false);
});

test('Icon exploration fails closed without human Visual System approval', () => {
  const unapproved = structuredClone(visualApproval);
  unapproved.truth.humanVisualApproval = false;
  const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: unapproved });
  assert.equal(inventory.reviewReady, false);
  assert.ok(inventory.findings.some((item) => item.code === 'icon-inventory-visual-authority-missing'));
});
