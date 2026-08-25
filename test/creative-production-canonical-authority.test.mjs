import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { runCreativeProductionRuntime } from '../lib/creative-production-runtime.mjs';

const baseInput = JSON.parse(fs.readFileSync(new URL('../benchmarks/005-du-bonheur-creative-production/input.json', import.meta.url)));

function canonicalInput(overrides = {}) {
  const legacy = runCreativeProductionRuntime(baseInput);
  const thesisStatement = 'Service ritual becomes the organizing experience, not decorative patisserie nostalgia.';
  const thesis = {
    schema: 'ai-studio-os/creative-thesis@1',
    id: 'du-bonheur-thesis',
    projectId: baseInput.id,
    statement: thesisStatement,
    governingIdea: { statement: thesisStatement },
    reviewReady: true,
    pass: true
  };
  const world = {
    schema: 'ai-studio-os/creative-world@1',
    id: 'counter-ritual',
    worldIdea: 'Counter service becomes a contemporary editorial ritual.',
    interpretationOfThesis: 'The service sequence carries the brand character without nostalgic patisserie tropes.',
    signatureBehavior: 'The interface advances through measured counter-like thresholds.',
    worldClass: 'counter-ritual',
    narrativeModel: 'service-sequence',
    compositionModel: 'asymmetric-counter-grid',
    typographyIntent: { statement: 'Editorial craft with restrained contemporary utility.' },
    imageLanguage: 'close product and material studies with generous negative space',
    materialLanguage: 'paper, pastry texture, glass and restrained metal',
    motionLanguage: 'measured threshold transitions with object continuity',
    interactionModel: 'direct contextual reveals tied to service actions',
    responsiveStrategy: 'preserve ritual sequence while recomposing hierarchy per viewport',
    antiPatterns: ['Parisian nostalgia', 'generic luxury card grid'],
    thesisRef: {
      schema: thesis.schema,
      projectId: thesis.projectId,
      governingIdea: thesis.governingIdea.statement
    },
    findings: [],
    reviewReady: true,
    selected: true,
    truth: {
      humanCreativeSelectionConfirmed: true,
      visualWorldProofReviewed: true
    }
  };

  return {
    ...structuredClone(baseInput),
    canonicalCreativeAuthority: true,
    creativeThesis: thesis,
    selectedCreativeWorld: world,
    creativeWorldExploration: {
      selectedWorld: world,
      selection: {
        worldId: world.id,
        humanConfirmed: true,
        visualReviewConfirmed: true,
        visualEvidenceRefs: ['counter-opening']
      },
      truth: { humanWorldSelectionConfirmed: true },
      findings: []
    },
    styleFrameProof: {
      reviewReady: true,
      truth: { humanVisualApproval: false },
      frames: [{ id: 'counter-opening', worldId: world.id }],
      findings: []
    },
    creativeDirection: {
      ...legacy.creativeDirection,
      directionStatement: 'Canonical Counter Ritual direction',
      provisional: false,
      worldContext: { id: world.id },
      thesisContext: { statement: thesisStatement },
      findings: []
    },
    ...overrides
  };
}

test('canonical Creative World is the sole world-level production authority', () => {
  const output = runCreativeProductionRuntime(canonicalInput());

  assert.equal(output.status, 'production-plan-ready');
  assert.equal(output.canonicalHandoff?.pass, true);
  assert.equal(output.canonicalHandoff?.truth.creativeSelectionProvenanceValid, true);
  assert.equal(output.canonicalHandoff?.truth.creativeWorldProductionContractComplete, true);
  assert.equal(output.selectionAuthority, 'canonical-creative-world');
  assert.equal(output.exploration, undefined);
  assert.equal(output.selection, undefined);
  assert.equal(output.legacyCalibration, undefined);
  assert.ok(output.stages.includes('canonical-creative-authority'));
  assert.ok(!output.stages.includes('explore'));
  assert.ok(!output.stages.includes('concept-selection'));
  assert.equal(output.creativeDirection.directionStatement, 'Canonical Counter Ritual direction');
  assert.equal(output.creativeDirection.calibration.selectedConceptId, null);
  assert.equal(output.creativeDirection.calibration.legacyConceptSelectionAuthority, 'retired');

  for (const entry of output.registry.entries ?? []) {
    assert.equal(entry.directionRef, 'Canonical Counter Ritual direction');
  }
});

test('canonical production fails closed before tool routing when selected world loses human authority', () => {
  const input = canonicalInput();
  input.selectedCreativeWorld.truth.humanCreativeSelectionConfirmed = false;
  input.creativeWorldExploration.selectedWorld = input.selectedCreativeWorld;

  const output = runCreativeProductionRuntime(input);

  assert.equal(output.status, 'blocked');
  assert.equal(output.canonicalHandoff?.pass, false);
  assert.equal(output.selectionAuthority, 'canonical-creative-world');
  assert.equal(output.exploration, undefined);
  assert.equal(output.selection, undefined);
  assert.equal(output.gateway, undefined);
  assert.ok(output.canonicalHandoff.findings.some((item) => item.code === 'canonical-world-not-authoritative'));
});

test('canonical production fails closed when selected world is incomplete even if selected by a human', () => {
  const input = canonicalInput();
  input.selectedCreativeWorld.interactionModel = '';
  input.creativeWorldExploration.selectedWorld = input.selectedCreativeWorld;

  const output = runCreativeProductionRuntime(input);

  assert.equal(output.status, 'blocked');
  assert.equal(output.exploration, undefined);
  assert.equal(output.selection, undefined);
  assert.equal(output.gateway, undefined);
  assert.ok(output.canonicalHandoff.findings.some((item) => item.code === 'canonical-world-production-contract-incomplete'));
});

test('legacy creative-production path remains authoritative when canonical inputs are absent', () => {
  const output = runCreativeProductionRuntime(baseInput);
  assert.equal(output.status, 'production-plan-ready');
  assert.equal(output.selectionAuthority, 'legacy-concept-selection');
  assert.equal(output.canonicalHandoff, undefined);
  assert.ok(output.exploration);
  assert.ok(output.selection);
  assert.ok(output.stages.includes('concept-selection'));
});
