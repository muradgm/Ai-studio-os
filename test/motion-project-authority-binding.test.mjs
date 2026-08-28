import test from 'node:test';
import assert from 'node:assert/strict';

import { reviewMotionCreativeExploration, selectedMotionDirection } from '../modules/motion-creative-intelligence/runtime.mjs';
import { buildMotionExplorationFixture } from '../fixtures/motion-creative-authority-fixture.mjs';

test('top-level Motion project identity cannot drift from recomputed Creative World authority', () => {
  const { exploration } = buildMotionExplorationFixture();
  const drifted = structuredClone(exploration);
  drifted.projectId = 'other-project';

  const review = reviewMotionCreativeExploration(drifted);

  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-creative-project-authority-drift'));
  assert.equal(selectedMotionDirection({
    ...drifted,
    selection: {
      hypothesisId: drifted.hypotheses[0].id,
      humanConfirmed: true,
      rationale: 'Attempted selection after top-level project substitution.'
    }
  }), null);
});
