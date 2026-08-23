import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { resolveVisualSystemHumanApproval } from '../modules/visual-system/approval.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const visualSystem = await read('visual-system-v1.json');
const selection = await read('hybrid-v1-selection.json');
const approval = await read('visual-system-v1-human-approval.json');

test('AI Council Visual System V1 human approval freezes the visual language but not the final production system', () => {
  const result = resolveVisualSystemHumanApproval(approval, { visualSystem, selection });
  assert.equal(result.approved, true, JSON.stringify(result.findings, null, 2));
  assert.equal(result.status, 'human-visual-language-approved');
  assert.equal(result.truth.humanVisualApproval, true);
  assert.equal(result.truth.visualSystemDirectionFrozen, true);
  assert.equal(result.truth.conceptualVisualSearchClosed, true);
  assert.equal(result.truth.motionHumanApproved, false);
  assert.equal(result.truth.finalVisualSystemApproved, false);
});

test('Visual System approval cannot silently jump to final system approval', () => {
  const overclaim = structuredClone(approval);
  overclaim.truth.finalVisualSystemApproved = true;
  const result = resolveVisualSystemHumanApproval(overclaim, { visualSystem, selection });
  assert.equal(result.approved, false);
  assert.ok(result.findings.some((item) => item.code === 'visual-system-final-approval-overclaimed'));
});

test('Visual System approval is invalid if it points at another world or candidate', () => {
  const wrongWorld = structuredClone(approval);
  wrongWorld.selectedWorldRef.id = 'other-world';
  const worldResult = resolveVisualSystemHumanApproval(wrongWorld, { visualSystem, selection });
  assert.equal(worldResult.approved, false);
  assert.ok(worldResult.findings.some((item) => item.code === 'visual-system-approval-world-mismatch'));

  const wrongCandidate = structuredClone(approval);
  wrongCandidate.visualSystemRef.id = 'other-visual-system';
  const candidateResult = resolveVisualSystemHumanApproval(wrongCandidate, { visualSystem, selection });
  assert.equal(candidateResult.approved, false);
  assert.ok(candidateResult.findings.some((item) => item.code === 'visual-system-approval-candidate-mismatch'));
});
