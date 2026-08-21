import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CALIBRATION_ANCHORS,
  EXACT_RASTER_SIZE,
  FORM_DIRECTIONS,
  FORM_REVIEW_CRITERIA,
  buildFormSelectionGate,
  exactRasterPlan,
  renderFormCandidate,
  reviewFormRefinement
} from '../projects/traderframe/icon-form-refinement-v1/spec.mjs';

test('form refinement locks the three strongest v2 semantic anchors before changing geometry', () => {
  assert.deepEqual(CALIBRATION_ANCHORS.map(({ iconId, lockedSemanticConcept }) => [iconId, lockedSemanticConcept]), [
    ['strategy-idea', 'plan-flag'],
    ['operator-decision', 'selected-branch'],
    ['learning-event', 'feedback-return']
  ]);
  assert.ok(CALIBRATION_ANCHORS.every((item) => item.semantic.length > 20 && item.recognitionAnchor.length > 5));
});

test('form refinement explores exactly three materially different formal directions', () => {
  assert.equal(FORM_DIRECTIONS.length, 3);
  assert.deepEqual(FORM_DIRECTIONS.map((item) => item.id), ['linear-architectural', 'compact-symbolic', 'bold-reduced']);
  assert.equal(new Set(FORM_DIRECTIONS.map((item) => item.strokeWidth)).size, 3);
  assert.equal(new Set(FORM_DIRECTIONS.map((item) => item.formClass)).size, 3);
  assert.deepEqual(FORM_DIRECTIONS.map((item) => item.formClass), ['skeletal-open', 'enclosed-compact', 'reduced-gesture']);
  assert.ok(FORM_DIRECTIONS.every((item) => item.intent.length > 30 && item.risks.length >= 2));
  assert.ok(FORM_REVIEW_CRITERIA.length >= 6);
});

test('each locked semantic gets one candidate in every formal direction and geometry is not cosmetic duplication', () => {
  for (const anchor of CALIBRATION_ANCHORS) {
    const markups = FORM_DIRECTIONS.map((direction) => renderFormCandidate(direction.id, anchor.iconId));
    assert.equal(new Set(markups).size, FORM_DIRECTIONS.length);
    const primitiveSets = markups.map((svg) => [...svg.matchAll(/data-primitive="([^"]+)"/g)].map((match) => match[1]).join('|'));
    assert.equal(new Set(primitiveSets).size, FORM_DIRECTIONS.length);
    for (let i = 0; i < FORM_DIRECTIONS.length; i += 1) {
      assert.match(markups[i], new RegExp(`data-direction="${FORM_DIRECTIONS[i].id}"`));
      assert.match(markups[i], new RegExp(`data-form-class="${FORM_DIRECTIONS[i].formClass}"`));
      assert.match(markups[i], new RegExp(`data-source-concept="${anchor.lockedSemanticConcept}"`));
    }
  }
});

test('all form candidates preserve safe vector construction and a single event layer', () => {
  const review = reviewFormRefinement();
  assert.equal(review.pass, true, JSON.stringify(review.findings));
  assert.equal(review.status, 'formal-candidates-ready-for-render-review');
  assert.equal(review.approval, 'human-form-direction-selection-required');
  assert.equal(new Set(review.formClasses.map((item) => item.formClass)).size, 3);
  for (const direction of FORM_DIRECTIONS) {
    for (const anchor of CALIBRATION_ANCHORS) {
      const svg = renderFormCandidate(direction.id, anchor.iconId);
      assert.match(svg, /viewBox="0 0 24 24"/);
      assert.match(svg, /stroke-linecap="square"/);
      assert.match(svg, /stroke-linejoin="miter"/);
      assert.match(svg, /currentColor/);
      assert.equal((svg.match(/data-layer="event"/g) ?? []).length, 1);
      assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}|<text|<image|<script|<foreignObject/i);
    }
  }
});

test('human form selection gate refuses to invent a winner', () => {
  const gate = buildFormSelectionGate();
  assert.equal(gate.required, true);
  assert.equal(gate.completed, false);
  assert.equal(gate.winner, null);
  assert.equal(gate.status, 'awaiting-human-form-direction-selection');
  assert.equal(gate.responseTemplate.length, 3);
  assert.equal(new Set(gate.directions.map((item) => item.formClass)).size, 3);
  assert.match(gate.truth, /No automated metric may mark a formal direction approved/i);
});

test('exact raster plan produces one faithful 512px PNG per formal candidate', () => {
  const plan = exactRasterPlan();
  assert.equal(plan.length, FORM_DIRECTIONS.length * CALIBRATION_ANCHORS.length);
  assert.ok(plan.every((item) => item.size === EXACT_RASTER_SIZE));
  assert.equal(new Set(plan.map((item) => item.outputPath)).size, plan.length);
  assert.ok(plan.every((item) => item.outputPath.endsWith('-512px.png')));
});
