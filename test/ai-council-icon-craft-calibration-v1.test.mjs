import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import {
  buildIconSemanticInventory,
  buildIconWorldExploration
} from '../modules/icon-system/runtime.mjs';
import {
  ICON_CRAFT_WORLDS,
  ICON_CRAFT_SIZES,
  ICON_CRAFT_IDS,
  ICON_CRAFT_CONTROLS,
  buildIconCraftCalibrationPlan,
  auditRegistrationBudget,
  auditConventionalControlPurity,
  auditOpticalWeight,
  buildIconCraftCalibrationEvidence
} from '../modules/icon-system/craft-calibration.mjs';
import { renderCraftGlyphSvg } from '../modules/icon-system/craft-glyphs.mjs';
import { validateCalibrationSvg } from '../modules/icon-system/calibration-glyphs.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const visualApproval = await read('visual-system-v1-human-approval.json');
const inventoryInput = await read('icon-semantic-inventory-v1.json');
const explorationInput = await read('icon-world-exploration-v1.json');
const independentReview = await read('icon-world-independent-review-v1.json');
const craftInput = await read('icon-world-craft-calibration-v1.json');

function build() {
  const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: visualApproval });
  const exploration = buildIconWorldExploration(explorationInput, { inventory });
  const plan = buildIconCraftCalibrationPlan(craftInput, { exploration, independentReview });
  return { inventory, exploration, plan };
}

test('Icon World Craft Calibration V1 preserves the hardened baseline and forbids selection/hybridization', () => {
  const { plan } = build();
  assert.equal(plan.reviewReady, true, JSON.stringify(plan.findings, null, 2));
  assert.equal(plan.status, 'ready-for-craft-browser-proof');
  assert.equal(plan.baseline.preserveBaselineGlyphs, true);
  assert.deepEqual(plan.opticalVariants.sizes, ICON_CRAFT_SIZES);
  assert.deepEqual(plan.beforeAfterProof.iconIds, ICON_CRAFT_IDS);
  assert.deepEqual(plan.conventionalControlFirewall.controls, ICON_CRAFT_CONTROLS);
  assert.equal(plan.forbidden.newWorlds, true);
  assert.equal(plan.forbidden.hybridization, true);
  assert.equal(plan.forbidden.productionFamilyExpansion, true);
  assert.equal(plan.forbidden.appIconWork, true);
  assert.equal(plan.forbidden.automaticWinner, true);
  assert.equal(plan.selection, null);
  assert.equal(plan.selectedWorld, null);
  assert.equal(plan.truth.iconWorldHumanSelected, false);
  assert.equal(plan.truth.iconSystemHumanApproved, false);
});

test('Provenance Glyph craft variants obey the explicit registration-node budget', () => {
  const samples = [];
  for (const iconId of ICON_CRAFT_IDS) {
    for (const size of ICON_CRAFT_SIZES) {
      const result = renderCraftGlyphSvg('provenance-glyph', iconId, { size });
      assert.equal(validateCalibrationSvg(result.svg).pass, true, `${iconId}@${size}`);
      samples.push({ worldId: 'provenance-glyph', iconId, size, registrationNodeCount: result.registrationNodeCount });
    }
  }
  const audit = auditRegistrationBudget(samples, craftInput.registrationNodeBudget.limits);
  assert.equal(audit.pass, true, JSON.stringify(audit.violations, null, 2));
});

test('Convention-dominant controls have a strict no-signature-node firewall in every world', () => {
  const samples = [];
  for (const worldId of ICON_CRAFT_WORLDS) {
    for (const iconId of ICON_CRAFT_CONTROLS) {
      for (const size of ICON_CRAFT_SIZES) {
        const result = renderCraftGlyphSvg(worldId, iconId, { size });
        assert.equal(validateCalibrationSvg(result.svg).pass, true, `${worldId}:${iconId}@${size}`);
        assert.equal(result.signatureNodeCount, 0, `${worldId}:${iconId}@${size} must not carry signature nodes`);
        samples.push({ worldId, iconId, size, signatureNodeCount: result.signatureNodeCount });
      }
    }
  }
  assert.equal(auditConventionalControlPurity(samples).pass, true);
});

test('Craft variants exist for all ten calibration concepts at 14/16/18/24 without changing world identity', () => {
  for (const worldId of ICON_CRAFT_WORLDS) {
    for (const iconId of ICON_CRAFT_IDS) {
      for (const size of ICON_CRAFT_SIZES) {
        const result = renderCraftGlyphSvg(worldId, iconId, { size });
        assert.equal(validateCalibrationSvg(result.svg).pass, true, `${worldId}:${iconId}@${size}`);
        assert.notEqual(result.variant, 'baseline-fallback', `${worldId}:${iconId}@${size} should be intentionally craft-authored`);
      }
    }
  }
});

test('Optical weight audit is a bounded mechanical gate rather than a world-selection score', () => {
  const measurements = [];
  for (const worldId of ICON_CRAFT_WORLDS) {
    for (const size of [14, 16, 18]) {
      ICON_CRAFT_IDS.forEach((iconId, index) => measurements.push({
        worldId,
        iconId,
        size,
        boundsOccupancy: 0.42 + (index % 3) * 0.04,
        inkCoverage: 0.12 + (index % 4) * 0.008
      }));
    }
  }
  const audit = auditOpticalWeight(measurements, craftInput.opticalWeight);
  assert.equal(audit.pass, true, JSON.stringify(audit.violations, null, 2));
  assert.equal(Object.hasOwn(audit, 'winner'), false);
  assert.equal(Object.hasOwn(audit, 'selectionScore'), false);
});

test('Craft proof cannot become review-ready without complete before/after, control, optical and audit evidence', () => {
  const { plan } = build();
  const blocked = buildIconCraftCalibrationEvidence({ plan });
  assert.equal(blocked.reviewReady, false);
  assert.ok(blocked.findings.some((item) => item.code === 'icon-craft-world-evidence-missing'));
  assert.ok(blocked.findings.some((item) => item.code === 'icon-craft-before-after-incomplete'));
  assert.ok(blocked.findings.some((item) => item.code === 'icon-craft-control-proof-incomplete'));
  assert.ok(blocked.findings.some((item) => item.code === 'icon-craft-optical-variants-incomplete'));
});

test('Complete craft evidence reaches the human-selection gate without selecting a world', () => {
  const { plan } = build();
  const worldEvidence = ICON_CRAFT_WORLDS.map((worldId) => ({ worldId, overviewRef: `${worldId}.png`, exactBrowserProof: true }));
  const beforeAfterEvidence = ICON_CRAFT_WORLDS.flatMap((worldId) => ICON_CRAFT_IDS.map((iconId) => ({ worldId, iconId, imageRef: `${worldId}-${iconId}.png`, sizes: ICON_CRAFT_SIZES })));
  const controlEvidence = ICON_CRAFT_WORLDS.map((worldId) => ({ worldId, imageRef: `${worldId}-controls.png` }));
  const opticalVariantEvidence = ICON_CRAFT_WORLDS.flatMap((worldId) => ICON_CRAFT_IDS.flatMap((iconId) => ICON_CRAFT_SIZES.map((size) => ({ worldId, iconId, size }))));
  const similarityWarnings = ICON_CRAFT_WORLDS.flatMap((worldId) => plan.similarityWarnings.pairs.flatMap((pair) => plan.similarityWarnings.sizes.map((size) => ({ worldId, pair, size, similarity: 0.5, similarityWarning: false }))));
  const ready = buildIconCraftCalibrationEvidence({
    plan,
    worldEvidence,
    beforeAfterEvidence,
    controlEvidence,
    opticalVariantEvidence,
    registrationBudgetAudit: { pass: true, violations: [] },
    conventionalControlAudit: { pass: true, violations: [] },
    opticalWeightAudit: { pass: true, groups: [], violations: [] },
    similarityWarnings
  });
  assert.equal(ready.reviewReady, true, JSON.stringify(ready.findings, null, 2));
  assert.equal(ready.status, 'ready-for-human-icon-world-selection');
  assert.equal(ready.truth.iconCraftCalibrationComplete, true);
  assert.equal(ready.truth.opticalVariantsReviewed, true);
  assert.equal(ready.truth.conventionalControlPurityReviewed, true);
  assert.equal(ready.truth.registrationBudgetValidated, true);
  assert.equal(ready.truth.opticalWeightNormalized, true);
  assert.equal(ready.selection, null);
  assert.equal(ready.selectedWorld, null);
  assert.equal(ready.truth.iconWorldHumanSelected, false);
  assert.equal(ready.truth.iconSystemHumanApproved, false);
});

test('Similarity telemetry fails closed if it attempts semantic or selection authority', () => {
  const { plan } = build();
  const worldEvidence = ICON_CRAFT_WORLDS.map((worldId) => ({ worldId, overviewRef: `${worldId}.png`, exactBrowserProof: true }));
  const beforeAfterEvidence = ICON_CRAFT_WORLDS.flatMap((worldId) => ICON_CRAFT_IDS.map((iconId) => ({ worldId, iconId, imageRef: `${worldId}-${iconId}.png`, sizes: ICON_CRAFT_SIZES })));
  const controlEvidence = ICON_CRAFT_WORLDS.map((worldId) => ({ worldId, imageRef: `${worldId}-controls.png` }));
  const opticalVariantEvidence = ICON_CRAFT_WORLDS.flatMap((worldId) => ICON_CRAFT_IDS.flatMap((iconId) => ICON_CRAFT_SIZES.map((size) => ({ worldId, iconId, size }))));
  const similarityWarnings = ICON_CRAFT_WORLDS.flatMap((worldId) => plan.similarityWarnings.pairs.flatMap((pair) => plan.similarityWarnings.sizes.map((size) => ({ worldId, pair, size, similarity: 0.95, similarityWarning: true, semanticPass: true }))));
  const result = buildIconCraftCalibrationEvidence({
    plan,
    worldEvidence,
    beforeAfterEvidence,
    controlEvidence,
    opticalVariantEvidence,
    registrationBudgetAudit: { pass: true, violations: [] },
    conventionalControlAudit: { pass: true, violations: [] },
    opticalWeightAudit: { pass: true, groups: [], violations: [] },
    similarityWarnings
  });
  assert.equal(result.reviewReady, false);
  assert.ok(result.findings.some((item) => item.code === 'icon-craft-similarity-authority-overclaimed'));
});
