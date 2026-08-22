import assert from 'node:assert/strict';
import test from 'node:test';
import { renderTraderFrameSelectedIcon, traderFrameCreativeLoopIcons } from '../projects/traderframe/icon-creative-loop-v1/runtime.mjs';
import {
  applyTraderFrameIconPatch,
  buildTraderFrameIconPatchPlan,
  renderTraderFramePatchedIcon,
  reviewTraderFrameIconVisuals,
  traderFrameIconPatchAttemptCap
} from '../projects/traderframe/icon-visual-review-patch-v1/runtime.mjs';

const baseline = Object.fromEntries(traderFrameCreativeLoopIcons.map(([id]) => [id, renderTraderFrameSelectedIcon(id)]));

function metrics({ learningOccupancy = 0.58 } = {}) {
  const result = {};
  for (const [id] of traderFrameCreativeLoopIcons) {
    result[id] = {
      16: { occupancy: id === 'learning-event' ? learningOccupancy : 0.34, inkCoverage: 0.12, centerX: 0.5, centerY: 0.5 },
      20: { occupancy: id === 'learning-event' ? learningOccupancy : 0.35, inkCoverage: 0.12, centerX: 0.5, centerY: 0.5 },
      24: { occupancy: id === 'learning-event' ? learningOccupancy : 0.36, inkCoverage: 0.12, centerX: 0.5, centerY: 0.5 },
      32: { occupancy: id === 'learning-event' ? learningOccupancy : 0.36, inkCoverage: 0.12, centerX: 0.5, centerY: 0.5 }
    };
  }
  return result;
}

test('visual review catches the validated TraderFrame family weaknesses instead of returning an empty review', () => {
  const review = reviewTraderFrameIconVisuals(baseline, metrics());
  assert.equal(review.pass, false);
  assert.equal(review.status, 'changes-required');
  const codes = new Set(review.findings.map((item) => item.code));
  assert.ok(codes.has('traderframe-icon-semantic-silhouette-collision'));
  assert.ok(codes.has('traderframe-icon-small-size-complexity-risk'));
  assert.ok(codes.has('traderframe-icon-optical-density-outlier'));
  assert.ok(codes.has('traderframe-icon-control-sliders-collision'));
  assert.ok(codes.has('traderframe-icon-outcome-register-integration'));
  assert.equal(review.lenses.length, 4);
});

test('patch plan touches only blocker/major targets and preserves the stronger calibration anchors', () => {
  const review = reviewTraderFrameIconVisuals(baseline, metrics());
  const plan = buildTraderFrameIconPatchPlan(review);
  assert.equal(plan.action, 'patch');
  assert.deepEqual(new Set(plan.icons), new Set(['data-snapshot', 'metric-report', 'backtest', 'risk-review', 'learning-event']));
  assert.deepEqual(new Set(plan.preserveUnchangedIcons), new Set(['strategy-idea', 'operator-decision', 'outcome-logged']));
  assert.equal(plan.maxAttempts, 2);
  assert.equal(traderFrameIconPatchAttemptCap, 2);
});

test('patched candidates preserve the selected mechanical grammar and avoid hard-coded brand paint', () => {
  for (const id of ['data-snapshot', 'metric-report', 'backtest', 'risk-review', 'learning-event']) {
    const svg = renderTraderFramePatchedIcon(id, baseline[id], 1);
    assert.match(svg, /data-direction="gate-decision"/);
    assert.match(svg, /data-patch="visual-review-v1"/);
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /stroke-width="1\.5"/);
    assert.match(svg, /stroke-linecap="square"/);
    assert.match(svg, /stroke-linejoin="miter"/);
    assert.match(svg, /currentColor/);
    assert.equal((svg.match(/data-layer="event"/g) ?? []).length, 1);
    assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}/);
    assert.doesNotMatch(svg, /<text|<image|<script|<foreignObject/i);
  }
});

test('one surgical patch pass clears the encoded major findings when optical evidence normalizes', () => {
  const before = reviewTraderFrameIconVisuals(baseline, metrics());
  const plan = buildTraderFrameIconPatchPlan(before);
  const patched = applyTraderFrameIconPatch(baseline, plan, 1);
  const normalizedMetrics = metrics({ learningOccupancy: 0.39 });
  const after = reviewTraderFrameIconVisuals(patched, normalizedMetrics);
  const majors = after.findings.filter((item) => ['blocker', 'major'].includes(String(item.severity).toLowerCase()));
  assert.equal(majors.length, 0, JSON.stringify(majors));
  assert.equal(after.pass, true);
  assert.equal(after.status, 'review');
  assert.ok(after.findings.some((item) => item.code === 'traderframe-icon-outcome-register-integration'));
});

test('patch application leaves non-targeted icon geometry byte-for-byte unchanged', () => {
  const plan = { icons: ['backtest', 'learning-event'] };
  const patched = applyTraderFrameIconPatch(baseline, plan, 1);
  assert.equal(patched['strategy-idea'], baseline['strategy-idea']);
  assert.equal(patched['operator-decision'], baseline['operator-decision']);
  assert.equal(patched['outcome-logged'], baseline['outcome-logged']);
  assert.notEqual(patched.backtest, baseline.backtest);
  assert.notEqual(patched['learning-event'], baseline['learning-event']);
});
