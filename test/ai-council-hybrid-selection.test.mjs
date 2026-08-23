import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildHybridConstitution } from '../modules/interface-world-proof/hybrid.mjs';
import { selectReviewedHybridWorld } from '../modules/interface-world-proof/selection.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));

const architecture = buildProductUXArchitecture(await read('product-ux-architecture.json'));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await read('canonical-ux-fixture.json'), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const constitution = buildHybridConstitution(await read('hybrid-constitution-v1.json'), { architectureRef, fixtureRef });
const assistantReview = await read('hybrid-v1-assistant-review.json');
const persisted = await read('hybrid-v1-selection.json');

test('AI Council human selection closes world exploration without approving final UI', () => {
  const result = selectReviewedHybridWorld({
    constitution,
    assistantReview,
    worldDefinition: persisted.selectedWorld,
    humanConfirmed: persisted.selection.humanConfirmed,
    visualReviewConfirmed: persisted.selection.visualReviewConfirmed,
    visualEvidenceRefs: persisted.selection.visualEvidenceRefs,
    selectedAt: persisted.selection.selectedAt,
    selectionStatement: persisted.selection.selectionStatement,
    selectionSource: persisted.selection.selectionSource
  });

  assert.equal(result.reviewReady, true, JSON.stringify(result.findings, null, 2));
  assert.equal(result.status, 'selected-awaiting-visual-system-v1');
  assert.equal(result.selectedWorld.id, 'decision-spine-counterpoint-hybrid-v1');
  assert.equal(result.selectedWorld.selected, true);
  assert.equal(result.selectedWorld.truth.humanCreativeSelectionConfirmed, true);
  assert.equal(result.selectedWorld.truth.visualWorldProofReviewed, true);
  assert.equal(result.selectedWorld.truth.typographyApproved, false);
  assert.equal(result.truth.creativeWorldExplorationClosed, true);
  assert.equal(result.truth.humanWorldSelectionConfirmed, true);
  assert.equal(result.truth.humanVisualApproval, false);
  assert.equal(result.truth.finalVisualSystemApproved, false);
  assert.equal(result.truth.selectedAutomatically, false);
  assert.equal(result.nextStage, 'visual-system-v1');
  assert.ok(result.freezeBoundary.explicitlyNotFrozen.includes('exact typography'));
  assert.ok(result.freezeBoundary.explicitlyNotFrozen.includes('current colors'));
});

test('Hybrid V1 cannot be selected from assistant review alone', () => {
  const result = selectReviewedHybridWorld({
    constitution,
    assistantReview,
    worldDefinition: persisted.selectedWorld,
    humanConfirmed: false,
    visualReviewConfirmed: true,
    visualEvidenceRefs: persisted.selection.visualEvidenceRefs,
    selectedAt: persisted.selection.selectedAt,
    selectionStatement: persisted.selection.selectionStatement,
    selectionSource: 'human'
  });
  assert.equal(result.reviewReady, false);
  assert.equal(result.truth.humanWorldSelectionConfirmed, false);
  assert.ok(result.findings.some((item) => item.code === 'hybrid-selection-human-confirmation-required'));
});

test('Hybrid V1 selection requires reviewed canonical eight-screen evidence', () => {
  const result = selectReviewedHybridWorld({
    constitution,
    assistantReview,
    worldDefinition: persisted.selectedWorld,
    humanConfirmed: true,
    visualReviewConfirmed: true,
    visualEvidenceRefs: persisted.selection.visualEvidenceRefs.slice(0, 2),
    selectedAt: persisted.selection.selectedAt,
    selectionStatement: persisted.selection.selectionStatement,
    selectionSource: 'human'
  });
  assert.equal(result.reviewReady, false);
  assert.ok(result.findings.some((item) => item.code === 'hybrid-selection-visual-review-required'));
});

test('persisted Hybrid selection keeps creative constitution frozen while leaving visual tokens open', () => {
  assert.equal(persisted.status, 'selected-awaiting-visual-system-v1');
  assert.equal(persisted.selection.humanConfirmed, true);
  assert.equal(persisted.selection.selectedAutomatically, false);
  assert.equal(persisted.truth.creativeWorldExplorationClosed, true);
  assert.equal(persisted.truth.humanVisualApproval, false);
  assert.equal(persisted.truth.finalVisualSystemApproved, false);
  assert.ok(persisted.freezeBoundary.frozen.includes('Decision Spine semantic lineage rule'));
  assert.ok(persisted.freezeBoundary.frozen.includes('Counterpoint reading and judgment role'));
  assert.ok(persisted.freezeBoundary.frozen.includes('Threshold consequence-only role'));
  assert.ok(persisted.freezeBoundary.explicitlyNotFrozen.includes('spacing scale'));
  assert.ok(persisted.freezeBoundary.explicitlyNotFrozen.includes('motion details'));
});
