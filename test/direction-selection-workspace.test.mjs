import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDirectionSelectionState, directionCandidates } from '../apps/creative-agency/src/direction-state.js';

test('Direction Selection Workspace exposes exactly three structurally different candidates', () => {
  assert.equal(directionCandidates.length, 3);
  assert.deepEqual(directionCandidates.map((item) => item.id), ['the-counter', 'the-conversation', 'the-handoff']);
  assert.equal(new Set(directionCandidates.map((item) => item.premise)).size, 3);
  assert.equal(new Set(directionCandidates.map((item) => item.spatialModel)).size, 3);
  assert.ok(directionCandidates.every((item) => item.mobile && item.interaction && item.risk));
});

test('direction selection blocks execution until a human choice is locked', () => {
  const pending = createDirectionSelectionState();
  assert.equal(pending.status, 'selection-required');
  assert.equal(pending.canExecute, false);
  assert.equal(pending.selected, null);

  const locked = createDirectionSelectionState({ selectedId: 'the-counter' });
  assert.equal(locked.status, 'locked');
  assert.equal(locked.canExecute, true);
  assert.equal(locked.selected.label, 'The Counter');
  assert.equal(locked.nextLayer, 'typography-layout-motion');
});

test('Command Center gates Build and Run Review behind direction selection', () => {
  const source = fs.readFileSync(new URL('../apps/creative-agency/src/main.js', import.meta.url), 'utf8');
  assert.match(source, /!directionState\.canExecute/);
  assert.match(source, /Select a direction first/);
  assert.match(source, /selectedDirectionId: directionState\.selectedId/);
});

