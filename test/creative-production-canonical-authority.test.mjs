import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { runCreativeProductionRuntime } from '../lib/creative-production-runtime.mjs';

const baseInput = JSON.parse(fs.readFileSync(new URL('../benchmarks/005-du-bonheur-creative-production/input.json', import.meta.url)));

function canonicalInput(overrides = {}) {
  const legacy = runCreativeProductionRuntime(baseInput);
  const thesisStatement = 'Service ritual becomes the organizing experience, not decorative patisserie nostalgia.';
  const world = {
    schema: 'ai-studio-os/creative-world@1',
    id: 'counter-ritual',
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
    creativeThesis: {
      schema: 'ai-studio-os/creative-thesis@1',
      id: 'du-bonheur-thesis',
      projectId: baseInput.id,
      statement: thesisStatement,
      governingIdea: { statement: thesisStatement },
      reviewReady: true,
      pass: true
    },
    selectedCreativeWorld: world,
    creativeWorldExploration: {
      selectedWorld: world,
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

test('canonical Creative World authority replaces legacy concept selection as production authority', () => {
  const output = runCreativeProductionRuntime(canonicalInput());

  assert.equal(output.status, 'production-plan-ready');
  assert.equal(output.canonicalHandoff?.pass, true);
  assert.equal(output.selectionAuthority, 'advisory-only');
  assert.equal(output.legacyCalibration?.authoritative, false);
  assert.ok(output.stages.includes('canonical-creative-authority'));
  assert.ok(!output.stages.includes('concept-selection'));
  assert.equal(output.creativeDirection.directionStatement, 'Canonical Counter Ritual direction');
  assert.equal(output.creativeDirection.calibration.selectedConceptId, null);
  assert.equal(output.creativeDirection.calibration.legacyConceptSelectionAuthority, 'advisory-only');

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
  assert.equal(output.selectionAuthority, 'advisory-only');
  assert.equal(output.gateway, undefined);
  assert.ok(output.canonicalHandoff.findings.some((item) => item.code === 'canonical-world-not-authoritative'));
});

test('legacy creative-production path remains authoritative when canonical inputs are absent', () => {
  const output = runCreativeProductionRuntime(baseInput);
  assert.equal(output.status, 'production-plan-ready');
  assert.equal(output.selectionAuthority, 'legacy-concept-selection');
  assert.equal(output.canonicalHandoff, undefined);
  assert.ok(output.stages.includes('concept-selection'));
});
