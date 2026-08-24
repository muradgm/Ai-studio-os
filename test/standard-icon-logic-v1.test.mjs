import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildStandardIconBenchmark,
  deriveStandardIconTruth
} from '../modules/standard-icon-benchmark/runtime.mjs';
import {
  buildStandardIconVectorArtifact,
  inspectStandardIconSvg
} from '../modules/standard-icon-benchmark/vector-adapter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.join(root, 'projects', 'standard-icon-logic-v1');
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(projectRoot, name), 'utf8'));

const benchmark = await readJson('benchmark-v1.json');
const inventory = await readJson('semantic-inventory-v1.json');
const styleBrief = await readJson('style-constitution-v1.json');
const memory = await readJson('drawing-memory-v1.json');

function build() {
  return buildStandardIconBenchmark({ benchmark, inventory, styleBrief, memory });
}

test('standard icon benchmark authors one style and plans all 16 concepts through Drawing Intelligence', () => {
  const model = build();
  assert.equal(model.pass, true, JSON.stringify(model.findings));
  assert.equal(model.style.constitutionAuthored, true);
  assert.equal(model.style.resolvedStyle.id, 'quiet-cutline-v1');
  assert.equal(model.plans.length, 16);
  assert.equal(model.intents.length, 64);
  assert.ok(model.plans.every((plan) => plan.pass && plan.reviewReady));
  assert.ok(model.plans.every((plan) => plan.recommendedCandidate === null));
  assert.equal(model.humanStandardIconReviewComplete, false);
  assert.equal(model.standardIconSystemApproved, false);
});

test('small optical sizes preserve only the core metaphor while larger sizes may retain secondary detail', () => {
  const model = build();
  for (const conceptId of benchmark.concepts) {
    for (const size of benchmark.targetSizes) {
      const intent = model.intents.find((item) => item.conceptId === conceptId && item.targetSize === size);
      assert.ok(intent, `${conceptId}@${size}`);
      assert.equal(intent.retainedSemanticDevices.length, size <= 16 ? 1 : 2, `${conceptId}@${size}`);
      assert.equal(intent.executionAuthority, 'vector-geometry');
      assert.equal(intent.rawSvgAllowed, false);
      assert.equal(intent.rawPathDataAllowed, false);
    }
  }
});

test('Vector Geometry emits surface-neutral SVG for all 64 benchmark outputs', () => {
  const model = build();
  for (const intent of model.intents) {
    const artifact = buildStandardIconVectorArtifact(intent, model.style);
    assert.equal(artifact.vectorSpecValidation.status, 'ready', `${intent.conceptId}@${intent.targetSize}`);
    assert.equal(artifact.emittedSvgIntegrity.status, 'ready', `${intent.conceptId}@${intent.targetSize}`);
    assert.match(artifact.svg, /^<svg /);
    assert.ok(artifact.svg.includes('currentColor'));
    assert.ok(!artifact.svg.includes('fill="white"'));
    const independent = inspectStandardIconSvg(artifact.svg, { conceptId: intent.conceptId, targetSize: intent.targetSize });
    assert.equal(independent.status, 'ready', `${intent.conceptId}@${intent.targetSize}`);
  }
});

test('proof truth cannot become review-ready when any evidence gate is false', () => {
  const all = {
    inventoryPassed: true,
    styleConstitutionAuthored: true,
    drawingPlansPassed: true,
    sizeBudgetExecutionEnforced: true,
    vectorSpecValidationPassed: true,
    emittedSvgIntegrityPassed: true,
    browserGlyphRenderPassed: true,
    specimenProofComplete: true,
    uiContextProofComplete: true,
    collisionReviewComplete: true,
    labelBlindProofComplete: true,
    textPairingProofComplete: true,
    squintProofComplete: true
  };
  const passing = deriveStandardIconTruth(all);
  assert.equal(passing.pass, true);
  assert.equal(passing.reviewReady, true);
  assert.equal(passing.humanStandardIconReviewComplete, false);
  assert.equal(passing.standardIconSystemApproved, false);

  const blocked = deriveStandardIconTruth({ ...all, emittedSvgIntegrityPassed: false });
  assert.equal(blocked.pass, false);
  assert.equal(blocked.reviewReady, false);
  assert.equal(blocked.status, 'blocked');
});
