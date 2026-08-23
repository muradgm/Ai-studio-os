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
  deriveMotionRole,
  deriveMotionPresentationState,
  REQUIRED_MOTION_PRIMITIVES,
  REQUIRED_OPERATIONAL_STATES,
  REQUIRED_MOTION_ROLES
} from '../modules/motion-system/runtime.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const architecture = buildProductUXArchitecture(await read('product-ux-architecture.json'));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await read('canonical-ux-fixture.json'), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const selection = await read('hybrid-v1-selection.json');
const motionInput = await read('motion-system-v1.json');
const taxonomy = await read('motion-event-taxonomy-v1.json');

function build(overrides = {}) {
  return buildMotionSystem(overrides.motionInput ?? motionInput, {
    selection: overrides.selection ?? selection,
    visualSystemId: 'hybrid-v1-visual-system-v1',
    architectureRef,
    fixtureRef,
    taxonomy: overrides.taxonomy ?? taxonomy
  });
}

test('AI Council Motion System V1 is bound to selected Hybrid, frozen screens, and resolved taxonomy', () => {
  const system = build();
  assert.equal(system.reviewReady, true, JSON.stringify(system.findings, null, 2));
  assert.equal(system.status, 'ready-for-motion-browser-proof');
  assert.equal(system.selectedWorldRef.id, 'decision-spine-counterpoint-hybrid-v1');
  assert.equal(system.visualSystemCandidateRef.id, 'hybrid-v1-visual-system-v1');
  assert.deepEqual(system.canonicalScreenBindings.map((item) => item.screenId), fixtureRef.screenIds);
  assert.equal(system.truth.motionRuntimeTaxonomyResolved, true);
  assert.equal(system.truth.humanMotionApproval, false);
  assert.equal(system.truth.runtimeEventAdaptersImplemented, false);
  assert.equal(system.truth.finalVisualSystemApproved, false);
  assert.ok(system.eventTaxonomyRef?.fingerprint);
});

test('Motion System preserves four operational states and separates them from motion roles', () => {
  const system = build();
  for (const state of REQUIRED_OPERATIONAL_STATES) assert.ok(system.stateClasses[state], `missing ${state}`);
  for (const event of system.eventVocabulary) {
    assert.ok(['none', ...REQUIRED_OPERATIONAL_STATES].includes(event.operationalState), `${event.id} operational state invalid`);
    assert.ok(REQUIRED_MOTION_ROLES.includes(event.motionRole), `${event.id} motion role invalid`);
    assert.equal(Object.hasOwn(event, 'class'), false, `${event.id} leaked legacy class`);
  }

  const approval = system.eventVocabulary.find((event) => event.id === 'approval-required');
  assert.deepEqual(
    { operationalState: approval.operationalState, motionRole: approval.motionRole },
    { operationalState: 'none', motionRole: 'authority-transition' }
  );
  const nav = system.eventVocabulary.find((event) => event.id === 'ui-project-navigation-opened');
  assert.deepEqual(
    { operationalState: nav.operationalState, motionRole: nav.motionRole },
    { operationalState: 'none', motionRole: 'navigation-transition' }
  );
  const evidence = system.eventVocabulary.find((event) => event.id === 'evidence-source-added');
  assert.deepEqual(
    { operationalState: evidence.operationalState, motionRole: evidence.motionRole },
    { operationalState: 'working', motionRole: 'evidence-registration' }
  );
  const validation = system.eventVocabulary.find((event) => event.id === 'validation-started');
  assert.deepEqual(
    { operationalState: validation.operationalState, motionRole: validation.motionRole },
    { operationalState: 'execution-progress', motionRole: 'none' }
  );
  const history = system.eventVocabulary.find((event) => event.id === 'execution-completed');
  assert.deepEqual(
    { operationalState: history.operationalState, motionRole: history.motionRole },
    { operationalState: 'none', motionRole: 'lineage-transition' }
  );
});

test('Motion System still defines the complete Hybrid primitive set', () => {
  const system = build();
  const ids = system.primitives.map((item) => item.id);
  for (const id of REQUIRED_MOTION_PRIMITIVES) assert.ok(ids.includes(id), `missing primitive ${id}`);
  assert.equal(system.primitives.find((item) => item.id === 'approval-boundary').owner, 'threshold');
  assert.equal(system.primitives.find((item) => item.id === 'decision-lineage').owner, 'decision-spine');
  assert.equal(system.primitives.find((item) => item.id === 'structured-answer-reveal').owner, 'counterpoint');
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

test('Operational status ignores motion-only transitions', () => {
  const system = build();
  const approvalOnly = deriveWorkingStatus(system, [
    { id: 'approval-required', status: 'active', sequence: 1 }
  ]);
  assert.equal(approvalOnly.status, 'idle');
  assert.equal(approvalOnly.current, null);

  const working = deriveWorkingStatus(system, [
    { id: 'task-understanding-started', status: 'completed', completed: true, sequence: 1 },
    { id: 'project-context-load-started', status: 'active', sequence: 2 },
    { id: 'ui-panel-opened', status: 'active', sequence: 3 }
  ]);
  assert.equal(working.status, 'active');
  assert.equal(working.current.eventId, 'project-context-load-started');
  assert.equal(working.current.operationalState, 'working');
});

test('Motion role is derived independently from operational state', () => {
  const system = build();
  const transition = deriveMotionRole(system, [
    { id: 'validation-started', status: 'active', sequence: 1 },
    { id: 'approval-required', status: 'active', sequence: 2 }
  ]);
  assert.equal(transition.eventId, 'approval-required');
  assert.equal(transition.motionRole, 'authority-transition');

  const presentation = deriveMotionPresentationState(system, [
    { id: 'evidence-search-started', status: 'active', sequence: 1 },
    { id: 'evidence-source-added', status: 'active', sequence: 2 }
  ]);
  assert.equal(presentation.operational.current.operationalState, 'working');
  assert.equal(presentation.transition.motionRole, 'evidence-registration');
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
  assert.equal(system.primitives.find((item) => item.id === 'reduced-motion').screenBindings.length, 8);
});

test('Motion System blocks stale product proof, absent selection, or unresolved taxonomy', () => {
  const stale = structuredClone(selection);
  stale.proofRef.architectureFingerprint = 'stale';
  const staleSystem = build({ selection: stale });
  assert.equal(staleSystem.reviewReady, false);
  assert.ok(staleSystem.findings.some((item) => item.code === 'motion-system-product-proof-stale'));

  const noHuman = structuredClone(selection);
  noHuman.truth.humanWorldSelectionConfirmed = false;
  const blocked = build({ selection: noHuman });
  assert.equal(blocked.reviewReady, false);
  assert.ok(blocked.findings.some((item) => item.code === 'motion-system-selected-world-not-authoritative'));

  const noTaxonomy = buildMotionSystem(motionInput, {
    selection,
    visualSystemId: 'hybrid-v1-visual-system-v1',
    architectureRef,
    fixtureRef,
    taxonomy: null
  });
  assert.equal(noTaxonomy.reviewReady, false);
  assert.ok(noTaxonomy.findings.some((item) => item.code === 'motion-system-taxonomy-schema-invalid'));
});
