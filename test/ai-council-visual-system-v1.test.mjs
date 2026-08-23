import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildMotionSystem } from '../modules/motion-system/runtime.mjs';
import { buildVisualSystem, REQUIRED_STRESS_STATES, REQUIRED_COMPONENTS } from '../modules/visual-system/runtime.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));

const architecture = buildProductUXArchitecture(await read('product-ux-architecture.json'));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await read('canonical-ux-fixture.json'), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const selection = await read('hybrid-v1-selection.json');
const visualInput = await read('visual-system-v1.json');
const motionInput = await read('motion-system-v1.json');
const motionTaxonomy = await read('motion-event-taxonomy-v1.json');
const motionSystem = buildMotionSystem(motionInput, {
  selection,
  visualSystemId: visualInput.id,
  architectureRef,
  fixtureRef,
  taxonomy: motionTaxonomy
});

function build(options = {}) {
  return buildVisualSystem(visualInput, {
    selection: options.selection ?? selection,
    architectureRef,
    fixtureRef,
    motionSystem: options.motionSystem ?? motionSystem
  });
}

test('AI Council Visual System V1 is bound to human-selected Hybrid, frozen fixture, and formal Motion System V1', () => {
  const system = build();
  assert.equal(motionSystem.reviewReady, true, JSON.stringify(motionSystem.findings, null, 2));
  assert.equal(system.reviewReady, true, JSON.stringify(system.findings, null, 2));
  assert.equal(system.status, 'ready-for-visual-system-browser-proof');
  assert.equal(system.selectedWorldRef.id, 'decision-spine-counterpoint-hybrid-v1');
  assert.equal(system.motionSystemRef.id, 'hybrid-v1-motion-system-v1');
  assert.equal(system.motionSystemFingerprint, motionSystem.motionSystemFingerprint);
  assert.deepEqual(system.canonicalScreenIds, fixtureRef.screenIds);
  assert.equal(system.truth.creativeWorldSelected, true);
  assert.equal(system.truth.creativeWorldExplorationClosed, true);
  assert.equal(system.truth.formalMotionSystemBound, true);
  assert.equal(system.truth.runtimeMotionAdaptersImplemented, false);
  assert.equal(system.truth.humanVisualApproval, false);
  assert.equal(system.truth.finalVisualSystemApproved, false);
});

test('Visual System V1 contains the complete dense-state stress harness and component grammar', () => {
  const stressIds = visualInput.stressTests.map((item) => item.id);
  for (const id of REQUIRED_STRESS_STATES) assert.ok(stressIds.includes(id), `missing stress state ${id}`);
  const componentIds = visualInput.componentGrammar.components.map((item) => item.id);
  for (const id of REQUIRED_COMPONENTS) assert.ok(componentIds.includes(id), `missing component ${id}`);
});

test('Visual System consumes approved Motion System as source of truth without claiming production readiness', () => {
  assert.equal(visualInput.motionSystemRef.schema, 'ai-studio-os/motion-system@1');
  assert.equal(visualInput.motionSystemRef.id, 'hybrid-v1-motion-system-v1');
  assert.equal(visualInput.motion.sourceOfTruth, visualInput.motionSystemRef.sourceRef);
  assert.equal(visualInput.motion.humanApproved, true);
  assert.equal(
    visualInput.motion.humanApprovalSourceRef,
    'projects/ai-council/motion-system-v1-human-approval.json'
  );
  assert.equal(
    visualInput.motion.eventTaxonomySourceRef,
    'projects/ai-council/motion-event-taxonomy-v1.json'
  );
  assert.equal(visualInput.motion.productionReady, false);
  assert.match(visualInput.motion.consumptionRule, /may not invent/i);
});

test('Visual System keeps Threshold consequence language out of ordinary conversation and navigation', () => {
  assert.equal(visualInput.color.consequencePolicy.ordinaryConversationAllowed, false);
  assert.equal(visualInput.color.consequencePolicy.permanentNavigationAllowed, false);
  assert.equal(visualInput.color.consequencePolicy.approvalAllowed, true);
  assert.match(visualInput.surfaces.lineageRule, /actual provenance|chronology|decision/i);
  assert.ok(visualInput.antiPatterns.includes('consequence red as general accent'));
});

test('Typography density rules explicitly protect long and code-heavy Council responses', () => {
  assert.equal(visualInput.typography.readingFamily, 'Newsreader');
  assert.equal(visualInput.typography.interfaceFamily, 'Inter');
  assert.equal(visualInput.typography.technicalFamily, 'IBM Plex Mono');
  assert.ok(visualInput.typography.densityRules.some((rule) => /450 words|continuous prose/i.test(rule)));
  assert.ok(visualInput.typography.densityRules.some((rule) => /Code-heavy|tables|source lists/i.test(rule)));
  assert.ok(visualInput.typography.rules.some((rule) => /Never use monospace as atmosphere/i.test(rule)));
});

test('Visual System cannot proceed if selected-world authority, canonical proof, or Motion System authority drifts', () => {
  const staleSelection = structuredClone(selection);
  staleSelection.proofRef.canonicalFixtureFingerprint = 'stale-fixture';
  const stale = build({ selection: staleSelection });
  assert.equal(stale.reviewReady, false);
  assert.ok(stale.findings.some((item) => item.code === 'visual-system-product-proof-stale'));

  const noHuman = structuredClone(selection);
  noHuman.truth.humanWorldSelectionConfirmed = false;
  const blocked = build({ selection: noHuman });
  assert.equal(blocked.reviewReady, false);
  assert.ok(blocked.findings.some((item) => item.code === 'visual-system-selected-world-not-authoritative'));

  const badMotion = structuredClone(motionSystem);
  badMotion.reviewReady = false;
  const noMotion = build({ motionSystem: badMotion });
  assert.equal(noMotion.reviewReady, false);
  assert.ok(noMotion.findings.some((item) => item.code === 'visual-system-motion-system-not-ready'));
});
