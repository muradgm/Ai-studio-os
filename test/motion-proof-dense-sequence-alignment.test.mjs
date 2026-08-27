import test from 'node:test';
import assert from 'node:assert/strict';

import { findOptimalMonotonicMatches } from '../modules/motion-creative-intelligence/temporal-sequence.mjs';

test('dense temporal alignment finds the maximum monotonic correspondence instead of a greedy local match', () => {
  const candidates = [
    { left: 0, right: 0, drift: 0.04, distance: { meanDelta: 1, outlierShare: 0 } },
    { left: 1, right: 0, drift: 0, distance: { meanDelta: 0.1, outlierShare: 0 } },
    { left: 1, right: 1, drift: 0.04, distance: { meanDelta: 1, outlierShare: 0 } },
    { left: 2, right: 2, drift: 0, distance: { meanDelta: 0.1, outlierShare: 0 } }
  ];

  const matches = findOptimalMonotonicMatches(3, 3, candidates);
  assert.deepEqual(matches.map(({ left, right }) => [left, right]), [[0, 0], [1, 1], [2, 2]]);
});

test('dense temporal alignment cannot authorize a reordered crossing sequence', () => {
  const candidates = [
    { left: 0, right: 1, drift: 0, distance: { meanDelta: 0.1, outlierShare: 0 } },
    { left: 1, right: 0, drift: 0, distance: { meanDelta: 0.1, outlierShare: 0 } }
  ];

  const matches = findOptimalMonotonicMatches(2, 2, candidates);
  assert.equal(matches.length, 1);
});
