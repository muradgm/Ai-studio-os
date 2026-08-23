import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildMotionSystem } from '../modules/motion-system/runtime.mjs';
import { resolveMotionSystemHumanApproval } from '../modules/motion-system/approval.mjs';
import { resolveVisualSystemHumanApproval } from '../modules/visual-system/approval.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const architecture = buildProductUXArchitecture(await read('product-ux-architecture.json'));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await read('canonical-ux-fixture.json'), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const selection = await read('hybrid-v1-selection.json');
const visualSystem = await read('visual-system-v1.json');
const visualApproval = await read('visual-system-v1-human-approval.json');
const taxonomy = await read('motion-event-taxonomy-v1.json');
const motionInput = await read('motion-system-v1.json');
const motionApproval = await read('motion-system-v1-human-approval.json');

function resolutions(approval = motionApproval, taxonomyInput = taxonomy) {
  const visualResolution = resolveVisualSystemHumanApproval(visualApproval, { visualSystem, selection });
  const motionSystem = buildMotionSystem(motionInput, {
    selection,
    visualSystemId: visualSystem.id,
    architectureRef,
    fixtureRef,
    taxonomy: taxonomyInput
  });
  const motionResolution = resolveMotionSystemHumanApproval(approval, {
    motionSystem,
    taxonomy: taxonomyInput,
    visualSystemApprovalResolution: visualResolution
  });
  return { visualResolution, motionSystem, motionResolution };
}

test('AI Council Motion System V1 records the human motion-language approval without final-system overclaim', () => {
  const { visualResolution, motionSystem, motionResolution } = resolutions();
  assert.equal(visualResolution.approved, true, JSON.stringify(visualResolution.findings, null, 2));
  assert.equal(motionSystem.reviewReady, true, JSON.stringify(motionSystem.findings, null, 2));
  assert.equal(motionResolution.approved, true, JSON.stringify(motionResolution.findings, null, 2));
  assert.equal(motionResolution.status, 'human-motion-language-approved');
  assert.equal(motionResolution.truth.humanVisualApproval, true);
  assert.equal(motionResolution.truth.humanMotionApproval, true);
  assert.equal(motionResolution.truth.motionCreativeDirectionFrozen, true);
  assert.equal(motionResolution.truth.motionRuntimeTaxonomyResolved, true);
  assert.equal(motionResolution.truth.motionProductionReady, false);
  assert.equal(motionResolution.truth.runtimeEventAdaptersImplemented, false);
  assert.equal(motionResolution.truth.productionInteractionProofComplete, false);
  assert.equal(motionResolution.truth.finalVisualSystemApproved, false);
});

test('Motion approval is bound to the approved Motion System and corrected taxonomy', () => {
  const wrongId = structuredClone(motionApproval);
  wrongId.motionSystemRef.id = 'different-motion-system';
  const wrongIdResolution = resolutions(wrongId).motionResolution;
  assert.equal(wrongIdResolution.approved, false);
  assert.ok(wrongIdResolution.findings.some((item) => item.code === 'motion-system-approval-candidate-mismatch'));

  const brokenTaxonomy = structuredClone(taxonomy);
  brokenTaxonomy.truth.motionRuntimeTaxonomyResolved = false;
  const broken = resolutions(motionApproval, brokenTaxonomy).motionResolution;
  assert.equal(broken.approved, false);
  assert.ok(broken.findings.some((item) => item.code === 'motion-system-approval-taxonomy-unresolved'));
});

test('Motion creative approval cannot claim production implementation or final Visual System approval', () => {
  for (const [field, value] of [
    ['motionProductionReady', true],
    ['runtimeEventAdaptersImplemented', true],
    ['productionInteractionProofComplete', true],
    ['finalVisualSystemApproved', true]
  ]) {
    const overclaim = structuredClone(motionApproval);
    overclaim.truth[field] = value;
    const resolution = resolutions(overclaim).motionResolution;
    assert.equal(resolution.approved, false, `${field} should block approval resolution`);
    assert.ok(resolution.findings.some((item) => item.code === 'motion-system-production-readiness-overclaimed'));
  }
});

test('Motion approval requires the dated explicit human decision', () => {
  const missingEvent = structuredClone(motionApproval);
  missingEvent.approvalEvent.decision = 'recommend-motion-language';
  const resolution = resolutions(missingEvent).motionResolution;
  assert.equal(resolution.approved, false);
  assert.ok(resolution.findings.some((item) => item.code === 'motion-system-approval-event-incomplete'));
});
