import test from 'node:test';
import assert from 'node:assert/strict';

import { reviewMotionCreativeExploration } from '../modules/motion-creative-intelligence/runtime.mjs';
import { buildMotionCriticBrief } from '../modules/motion-creative-intelligence/critic.mjs';
import { buildMotionProofFixture } from '../fixtures/motion-creative-authority-fixture.mjs';

test('Motion Critic accepts the exact exploration embedded in the reviewed proof plan', () => {
  const proof = buildMotionProofFixture();
  const brief = buildMotionCriticBrief({ exploration: proof.exploration, proofEvidence: proof.evidence });

  assert.equal(brief.reviewReady, true);
  assert.equal(brief.truth.exactRenderedExplorationContractRequired, true);
});

test('Motion Critic rejects a separately review-ready exploration with matching IDs but unrendered motion language', () => {
  const proof = buildMotionProofFixture();
  const drifted = structuredClone(proof.exploration);
  const editorial = drifted.hypotheses.find((item) => item.id === 'editorial');
  editorial.language.motionThesis = 'A different but structurally valid motion thesis that was never part of the rendered proof.';

  const explorationReview = reviewMotionCreativeExploration(drifted);
  assert.equal(explorationReview.reviewReady, true);
  assert.deepEqual(drifted.hypotheses.map((item) => item.id), proof.exploration.hypotheses.map((item) => item.id));

  const brief = buildMotionCriticBrief({ exploration: drifted, proofEvidence: proof.evidence });
  assert.equal(brief.reviewReady, false);
  assert.ok(brief.findings.some((item) => item.code === 'motion-critic-rendered-exploration-contract-drift'));
});
