import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import {
  buildMotionSystem,
  validateMotionPresentation,
  deriveWorkingStatus,
  REQUIRED_MOTION_PRIMITIVES,
  REQUIRED_STATE_CLASSES
} from '../modules/motion-system/runtime.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const architecture = buildProductUXArchitecture(await read('product-ux-architecture.json'));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await read('canonical-ux-fixture.json'), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const selection = await read('hybrid-v1-selection.json');
const motionInput = await read('motion-system-v1.json');

function build() {
  return buildMotionSystem(motionInput, {
    selection,
    visualSystemId: 'hybrid-v1-visual-system-v1',
    architectureRef,
    fixtureRef
  });
}

test('AI Council Motion System V1 is bound to selected Hybrid and frozen canonical screens', () => {
  const system = build();
  assert.equal(system.reviewReady, true, JSON.stringify(system.findings, null, 2));
  assert.equal(system.status, 'ready-for-motion-browser-proof');
  assert.equal(system.selectedWorldRef.id, 'decision-spine-counterpoint-hybrid-v1');
  assert.equal(system.visualSystemCandidateRef.id, 'hybrid-v1-visual-system-v1');
  assert.deepEqual(system.canonicalScreenBindings.map((item) => item.screenId), fixtureRef.screenIds);
  assert.equal(system.truth.humanMotionApproval, false);
  assert.equal(system.truth.runtimeEventAdaptersImplemented, false);
  assert.equal(system.truth.finalVisualSystemApproved, false);
});

test('Motion System defines the four distinct runtime state classes and complete primitive set', () => {
  const system = build();
  for (const stateClass of REQUIRED_STATE_CLASSES) assert.ok(system.stateClasses[stateClass], `missing ${stateClass}`);
  const ids = system.primitives.map((item) => item.id);
  for (const id of REQUIRED_MOTION_PRIMITIVES) assert.ok(ids.includes(id), `missing primitive ${id}`);
  assert.ok(system.primitives.find((item) => item.id === 'approval-boundary').owner === 'threshold');
  assert.ok(system.primitives.find((item) => item.id === 'decision-lineage').owner === 'decision-spine');
  assert.ok(system.primitives.find((item) => item.id === 'structured-answer-reveal').owner === 'counterpoint');
});

test('Motion status claims fail closed without matching runtime evidence', () => {
  const system = build();
  const missing = validateMotionPresentation(system, 'project-context-loading', []);
  assert.equal(missing.pass, false);
  assert.ok(missing.findings.some((item) => item.code === 'motion-presentation-runtime-evidence-missing'));

  const proven = validateMotionPresentation(system, 'project-context-loading', [
    { id: 'project-context-load-started', status: 'active', sequence: 1 }
  ]);
  assert.equal(proven.pass, true, JSON.stringify(proven.findings, null, 2));
});

test('Working status is derived from runtime events rather than authored fake thought copy', () => {
  const system = build();
  const status = deriveWorkingStatus(system, [
    { id: 'task-understanding-started', status: 'completed', completed: true, sequence: 1 },
    { id: 'project-context-load-started', status: 'active', sequence: 2 }
  ]);
  assert.equal(status.status, 'active');
  assert.equal(status.current.eventId, 'project-context-load-started');
  assert.equal(status.current.copy, 'Checking project context…');
  assert.ok(status.completed.some((item) => item.eventId === 'task-understanding-started'));
});

test('Motion System bans fake percentages, hidden thought, and simulated agent dialogue', () => {
  const system = build();
  assert.equal(system.runtimeEvidencePolicy.unknownProgressUsesPercentage, false);
  assert.equal(system.runtimeEvidencePolicy.percentAllowedOnlyWhenDeterministic, true);
  assert.equal(system.runtimeEvidencePolicy.rawChainOfThoughtAllowed, false);
  assert.equal(system.runtimeEvidencePolicy.simulatedAgentDialogueAllowed, false);
  assert.equal(system.runtimeEvidencePolicy.simulatedInternalThoughtAllowed, false);
  assert.ok(system.antiPatterns.some((item) => /fake percentage/i.test(item)));
  assert.ok(system.antiPatterns.some((item) => /simulated agent conversations/i.test(item)));
});

test('Motion System preserves calmer mobile motion and reduced-motion equivalence', () => {
  const system = build();
  const mobile = system.canonicalScreenBindings.find((item) => item.screenId === 'mobile-conversation');
  assert.equal(mobile.motionLevel, 'extra-quiet');
  assert.ok(mobile.primitiveIds.includes('mobile-navigation'));
  assert.ok(mobile.primitiveIds.includes('reduced-motion'));
  assert.ok(system.proofScenarios.some((scenario) => scenario.reducedMotion === true));
  assert.ok(system.primitives.find((item) => item.id === 'reduced-motion').screenBindings.length === 8);
});

test('Motion System blocks stale product proof or absent human world selection', () => {
  const stale = structuredClone(selection);
  stale.proofRef.architectureFingerprint = 'stale';
  const staleSystem = buildMotionSystem(motionInput, {
    selection: stale,
    visualSystemId: 'hybrid-v1-visual-system-v1',
    architectureRef,
    fixtureRef
  });
  assert.equal(staleSystem.reviewReady, false);
  assert.ok(staleSystem.findings.some((item) => item.code === 'motion-system-product-proof-stale'));

  const noHuman = structuredClone(selection);
  noHuman.truth.humanWorldSelectionConfirmed = false;
  const blocked = buildMotionSystem(motionInput, {
    selection: noHuman,
    visualSystemId: 'hybrid-v1-visual-system-v1',
    architectureRef,
    fixtureRef
  });
  assert.equal(blocked.reviewReady, false);
  assert.ok(blocked.findings.some((item) => item.code === 'motion-system-selected-world-not-authoritative'));
});
