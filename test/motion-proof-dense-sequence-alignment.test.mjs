import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateDenseTemporalCoverage,
  findOptimalMonotonicMatches,
  matchedTemporalSpanRatio
} from '../modules/motion-creative-intelligence/temporal-sequence.mjs';
import { selectCompleteDenseAttempt } from '../modules/motion-creative-intelligence/dense-attempt-authority.mjs';

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

test('raw directional coverage supports legitimate unequal capture cadence without discarding samples', () => {
  const candidates = [
    { left: 0, right: 0, drift: 0, distance: { meanDelta: 0.1, outlierShare: 0 } },
    { left: 1, right: 1, drift: 0.02, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 1, right: 2, drift: 0.03, distance: { meanDelta: 0.3, outlierShare: 0 } },
    { left: 2, right: 3, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 3, right: 4, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 4, right: 5, drift: 0.02, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 5, right: 6, drift: 0.02, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 6, right: 7, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 6, right: 8, drift: 0.03, distance: { meanDelta: 0.3, outlierShare: 0 } },
    { left: 7, right: 9, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 8, right: 10, drift: 0.02, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 9, right: 11, drift: 0, distance: { meanDelta: 0.1, outlierShare: 0 } }
  ];

  const coverage = evaluateDenseTemporalCoverage(10, 12, candidates);
  assert.equal(coverage.leftCoverage, 1);
  assert.equal(coverage.rightCoverage, 1);
  assert.equal(coverage.monotonicCoverage, 1);
  assert.equal(coverage.leftGap, 0);
  assert.equal(coverage.rightGap, 0);
});

test('cadence normalization cannot hide unmatched raw montage samples', () => {
  // A 9-sample recording versus an 11-sample recording still satisfies the
  // 0.8 active-span ratio. The prior equal-grid resampling could discard right
  // indexes 2 and 7 and then ignore one additional corrupted retained sample,
  // making the normalized grid look >78% covered. Raw directional coverage must
  // retain all 11 samples and expose that only 8/11 are authentic candidates.
  const candidates = [
    { left: 0, right: 0, drift: 0, distance: { meanDelta: 0.1, outlierShare: 0 } },
    { left: 1, right: 1, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 2, right: 3, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 3, right: 4, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 5, right: 6, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 6, right: 8, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 7, right: 9, drift: 0.01, distance: { meanDelta: 0.2, outlierShare: 0 } },
    { left: 8, right: 10, drift: 0, distance: { meanDelta: 0.1, outlierShare: 0 } }
  ];

  const coverage = evaluateDenseTemporalCoverage(9, 11, candidates);
  assert.equal(coverage.leftCoverage, 8 / 9);
  assert.equal(coverage.rightCoverage, 8 / 11);
  assert.equal(coverage.monotonicCoverage, 8 / 9);
  assert.ok(coverage.leftCoverage >= 0.78);
  assert.ok(coverage.monotonicCoverage >= 0.78);
  assert.ok(coverage.rightCoverage < 0.78);
});

test('matched temporal span ignores detector-only window padding when common motion speed agrees', () => {
  const leftSamples = Array.from({ length: 14 }, (_, index) => ({ targetTime: index * 0.04 }));
  const rightSamples = Array.from({ length: 9 }, (_, index) => ({ targetTime: 0.12 + index * 0.04 }));
  const matches = Array.from({ length: 9 }, (_, index) => ({ left: index + 3, right: index }));

  const span = matchedTemporalSpanRatio(leftSamples, rightSamples, matches);
  assert.ok(span.ratio >= 0.8);
  assert.ok(Math.abs(span.leftSpan - span.rightSpan) < 1e-9);
});

test('matched temporal span rejects a time-compressed substitution despite identical ordered states', () => {
  const leftSamples = Array.from({ length: 9 }, (_, index) => ({ targetTime: index * 0.03 }));
  const rightSamples = Array.from({ length: 9 }, (_, index) => ({ targetTime: index * 0.04 }));
  const matches = Array.from({ length: 9 }, (_, index) => ({ left: index, right: index }));

  const span = matchedTemporalSpanRatio(leftSamples, rightSamples, matches);
  assert.equal(span.ratio, 0.75);
  assert.ok(span.ratio < 0.8);
});

test('complementary dense replay failures cannot be aggregated into authority', () => {
  const leftHeavyFailure = {
    verified: false,
    findings: [{
      code: 'motion-proof-dense-video-timeline-mismatch',
      message: 'submitted coverage 90.0%, independent coverage 60.0%, monotonic coverage 80.0%, submitted max raw gap 1, independent max raw gap 3, max terminal-relative drift 0.040, matched-span ratio 90.0%'
    }]
  };
  const rightHeavyFailure = {
    verified: false,
    findings: [{
      code: 'motion-proof-dense-video-timeline-mismatch',
      message: 'submitted coverage 60.0%, independent coverage 90.0%, monotonic coverage 80.0%, submitted max raw gap 3, independent max raw gap 1, max terminal-relative drift 0.040, matched-span ratio 90.0%'
    }]
  };

  const authority = selectCompleteDenseAttempt([leftHeavyFailure, rightHeavyFailure]);
  assert.equal(authority.verified, false);
  assert.equal(authority.retryableOnly, true);
  assert.equal(authority.selectedAttemptIndex, null);
});

test('dense replay authority may select one complete independently passing attempt', () => {
  const cadenceFailure = {
    verified: false,
    findings: [{
      code: 'motion-proof-dense-video-timeline-mismatch',
      message: 'submitted coverage 70.0%, independent coverage 69.0%, monotonic coverage 70.0%, submitted max raw gap 2, independent max raw gap 2, max terminal-relative drift 0.050, matched-span ratio 92.0%'
    }]
  };
  const completePass = { verified: true, findings: [] };

  const authority = selectCompleteDenseAttempt([cadenceFailure, completePass]);
  assert.equal(authority.verified, true);
  assert.equal(authority.selectedAttemptIndex, 1);
});

test('a hard replay binding failure cannot be hidden by another passing attempt', () => {
  const hardBindingFailure = {
    verified: false,
    findings: [{ code: 'motion-proof-dense-source-binding-mismatch', message: 'study identity changed' }]
  };
  const completePass = { verified: true, findings: [] };

  const authority = selectCompleteDenseAttempt([hardBindingFailure, completePass]);
  assert.equal(authority.verified, false);
  assert.equal(authority.hardFailureIndex, 0);
});
