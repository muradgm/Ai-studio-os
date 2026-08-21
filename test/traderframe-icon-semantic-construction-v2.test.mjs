import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CANDIDATES,
  ICONS,
  SELECTED,
  SEMANTIC_BRIEFS,
  buildBlindReviewProtocol,
  renderSelectedSemanticIcon,
  renderSemanticCandidate,
  reviewSemanticConstruction
} from '../projects/traderframe/icon-semantic-construction-v2/spec.mjs';

test('every TraderFrame semantic begins with recognition anchors before geometry', () => {
  assert.equal(ICONS.length, 8);
  for (const [iconId] of ICONS) {
    const brief = SEMANTIC_BRIEFS[iconId];
    assert.ok(brief);
    assert.ok(brief.literalMeaning.length > 20);
    assert.ok(brief.recognitionAnchors.length >= 3);
    assert.ok(brief.prohibitedDefaults.length >= 3);
    assert.ok(brief.transformationRule.length > 40);
    assert.notEqual(brief.transformationRule, brief.literalMeaning);
    assert.equal(
      brief.recognitionAnchors.some((anchor) => brief.prohibitedDefaults.includes(anchor)),
      false
    );
  }
});

test('semantic construction explores exactly three candidates per icon and selects one explicitly', () => {
  for (const [iconId] of ICONS) {
    assert.equal(CANDIDATES[iconId].length, 3);
    assert.ok(CANDIDATES[iconId].some((candidate) => candidate.id === SELECTED[iconId]));
    const scores = CANDIDATES[iconId].map((candidate) => candidate.heuristicScore);
    assert.equal(Math.max(...scores), CANDIDATES[iconId].find((candidate) => candidate.id === SELECTED[iconId]).heuristicScore);
  }
});

test('selected semantic candidates are construction-ready but do not claim human recognizability', () => {
  const review = reviewSemanticConstruction();
  assert.equal(review.pass, true, JSON.stringify(review.findings));
  assert.equal(review.status, 'construction-ready-awaiting-human-recognition-test');
  assert.equal(review.approval, 'blind-human-recognition-and-independent-vector-review-required');
  assert.match(review.note, /not human recognizability measurements/i);
  assert.equal(review.findings.filter((item) => ['blocker', 'major'].includes(item.severity)).length, 0);
});

test('all candidate SVGs preserve the mechanical family contract', () => {
  for (const [iconId] of ICONS) {
    for (const candidate of CANDIDATES[iconId]) {
      const svg = renderSemanticCandidate(iconId, candidate.id);
      assert.match(svg, /data-system="traderframe-semantic-construction-v2"/);
      assert.match(svg, /viewBox="0 0 24 24"/);
      assert.match(svg, /stroke-width="1\.5"/);
      assert.match(svg, /stroke-linecap="square"/);
      assert.match(svg, /stroke-linejoin="miter"/);
      assert.match(svg, /currentColor/);
      assert.equal((svg.match(/data-layer="event"/g) ?? []).length, 1);
      assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}/);
      assert.doesNotMatch(svg, /<text|<image|<script|<foreignObject/i);
    }
  }
});

test('selected family uses unique primary recognition anchors to reduce semantic collisions', () => {
  const anchors = ICONS.map(([iconId]) => CANDIDATES[iconId].find((candidate) => candidate.id === SELECTED[iconId]).primaryAnchor);
  assert.equal(new Set(anchors).size, ICONS.length);
  for (const [iconId] of ICONS) assert.equal(renderSelectedSemanticIcon(iconId), renderSemanticCandidate(iconId, SELECTED[iconId]));
});

test('blind recognition protocol hides labels from the response form and keeps a separate answer key', () => {
  const protocol = buildBlindReviewProtocol();
  assert.equal(protocol.order.length, ICONS.length);
  assert.equal(protocol.responseTemplate.length, ICONS.length);
  assert.equal(protocol.answerKey.length, ICONS.length);
  assert.ok(protocol.responseTemplate.every((item) => !('iconId' in item) && !('label' in item)));
  assert.ok(protocol.answerKey.every((item) => item.iconId && item.label && item.selectedConcept));
  assert.notDeepEqual(protocol.order.map((item) => item.iconId), ICONS.map(([id]) => id));
});
