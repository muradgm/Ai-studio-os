import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTraderFrameSelectedIcon, traderFrameCreativeLoopIcons } from '../projects/traderframe/icon-creative-loop-v1/runtime.mjs';
import { applyTraderFrameIconPatch, buildTraderFrameIconPatchPlan } from '../projects/traderframe/icon-visual-review-patch-v1/runtime.mjs';
import { reviewTraderFrameIconVisualsV2 } from '../projects/traderframe/icon-visual-review-patch-v1/review-v2.mjs';

const baseline = Object.fromEntries(traderFrameCreativeLoopIcons.map(([id]) => [id, renderTraderFrameSelectedIcon(id)]));

function metrics({ learningInk = 0.23 } = {}) {
  const result = {};
  for (const [id] of traderFrameCreativeLoopIcons) {
    result[id] = {
      16: { occupancy: 0.42, inkCoverage: id === 'learning-event' ? learningInk : 0.16, centerX: 0.5, centerY: 0.5 },
      20: { occupancy: 0.42, inkCoverage: id === 'learning-event' ? learningInk : 0.16, centerX: 0.5, centerY: 0.5 },
      24: { occupancy: 0.42, inkCoverage: id === 'learning-event' ? learningInk : 0.16, centerX: 0.5, centerY: 0.5 },
      32: { occupancy: 0.42, inkCoverage: id === 'learning-event' ? learningInk : 0.16, centerX: 0.5, centerY: 0.5 }
    };
  }
  return result;
}

test('ink-density reviewer catches Learning Event even when bbox occupancy is normal', () => {
  const review = reviewTraderFrameIconVisualsV2(baseline, metrics());
  const density = review.findings.find((item) => item.code === 'traderframe-icon-optical-density-outlier');
  assert.ok(density);
  assert.equal(density.icon, 'learning-event');
  assert.equal(density.reviewer, 'optical-reviewer');
  assert.equal(density.evidence.targetSize, 24);
  assert.ok(density.evidence.ratio > 1.25);
  const plan = buildTraderFrameIconPatchPlan(review);
  assert.ok(plan.icons.includes('learning-event'));
});

test('density finding clears after the Learning Event patch normalizes rendered ink', () => {
  const before = reviewTraderFrameIconVisualsV2(baseline, metrics());
  const plan = buildTraderFrameIconPatchPlan(before);
  const patched = applyTraderFrameIconPatch(baseline, plan, 1);
  const after = reviewTraderFrameIconVisualsV2(patched, metrics({ learningInk: 0.145 }));
  assert.equal(after.findings.some((item) => item.code === 'traderframe-icon-optical-density-outlier'), false);
});
