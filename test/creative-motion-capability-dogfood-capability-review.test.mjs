import test from 'node:test';
import assert from 'node:assert/strict';

import { reviewCreativeMotionDogfoodCapabilityResultsFresh } from '../modules/creative-motion-capability-dogfood/review.mjs';

test('capability interpretation cannot proceed from protocol review alone', () => {
  const result = reviewCreativeMotionDogfoodCapabilityResultsFresh(
    { experimentId: 'dogfood-capability-probe' },
    {},
    { blindSeed: 'probe-seed', reviewers: [] }
  );
  assert.equal(result.pass, false);
  assert.equal(result.reviewReady, false);
  assert.equal(result.status, 'blocked');
  assert.ok(result.findings.some((item) => item.code === 'dogfood-execution-receipt-missing'));
  assert.equal(result.truth.verifiedExecutionRequiredForCapabilityDecision, true);
  assert.equal(result.truth.creativeDirectionSelected, false);
  assert.equal(result.truth.productionApproved, false);
});
