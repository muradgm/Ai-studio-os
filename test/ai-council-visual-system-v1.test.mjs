import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildVisualSystem, REQUIRED_STRESS_STATES, REQUIRED_MOTION_STATES, REQUIRED_COMPONENTS } from '../modules/visual-system/runtime.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));

const architecture = buildProductUXArchitecture(await read('product-ux-architecture.json'));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await read('canonical-ux-fixture.json'), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const selection = await read('hybrid-v1-selection.json');
const visualInput = await read('visual-system-v1.json');

test('AI Council Visual System V1 is bound to the human-selected Hybrid and frozen product fixture', () => {
  const system = buildVisualSystem(visualInput, { selection, architectureRef, fixtureRef });
  assert.equal(system.reviewReady, true, JSON.stringify(system.findings, null, 2));
  assert.equal(system.status, 'ready-for-visual-system-browser-proof');
  assert.equal(system.selectedWorldRef.id, 'decision-spine-counterpoint-hybrid-v1');
  assert.deepEqual(system.canonicalScreenIds, fixtureRef.screenIds);
  assert.equal(system.truth.creativeWorldSelected, true);
  assert.equal(system.truth.creativeWorldExplorationClosed, true);
  assert.equal(system.truth.humanVisualApproval, false);
  assert.equal(system.truth.finalVisualSystemApproved, false);
});

test('Visual System V1 contains the complete dense-state stress harness', () => {
  const stressIds = visualInput.stressTests.map((item) => item.id);
  for (const id of REQUIRED_STRESS_STATES) assert.ok(stressIds.includes(id), `missing stress state ${id}`);
  const motionIds = visualInput.motion.states.map((item) => item.id);
  for (const id of REQUIRED_MOTION_STATES) assert.ok(motionIds.includes(id), `missing motion state ${id}`);
  const componentIds = visualInput.componentGrammar.components.map((item) => item.id);
  for (const id of REQUIRED_COMPONENTS) assert.ok(componentIds.includes(id), `missing component ${id}`);
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

test('Visual System cannot proceed if selected-world authority or canonical proof fingerprints drift', () => {
  const staleSelection = structuredClone(selection);
  staleSelection.proofRef.canonicalFixtureFingerprint = 'stale-fixture';
  const system = buildVisualSystem(visualInput, { selection: staleSelection, architectureRef, fixtureRef });
  assert.equal(system.reviewReady, false);
  assert.ok(system.findings.some((item) => item.code === 'visual-system-product-proof-stale'));

  const noHuman = structuredClone(selection);
  noHuman.truth.humanWorldSelectionConfirmed = false;
  const blocked = buildVisualSystem(visualInput, { selection: noHuman, architectureRef, fixtureRef });
  assert.equal(blocked.reviewReady, false);
  assert.ok(blocked.findings.some((item) => item.code === 'visual-system-selected-world-not-authoritative'));
});
