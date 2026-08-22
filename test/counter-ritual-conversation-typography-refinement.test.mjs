import test from 'node:test';
import assert from 'node:assert/strict';

import { buildConversationTypographyRefinement } from '../projects/du-bonheur/counter-ritual-v3/typography-refinement.mjs';

test('Conversation typography refinement advances exactly two structurally distinct finalists', () => {
  const output = buildConversationTypographyRefinement();
  assert.equal(output.pass, true, JSON.stringify(output.findings));
  assert.equal(output.status, 'two-finalists-awaiting-human-art-direction-review');
  assert.equal(output.finalists.length, 2);
  assert.deepEqual(output.finalists.map((item) => [item.display, item.body]), [
    ['Bricolage Grotesque', 'DM Sans'],
    ['Instrument Sans', 'Manrope']
  ]);
  assert.equal(new Set(output.finalists.map((item) => item.display)).size, 2);
  assert.equal(new Set(output.finalists.map((item) => item.body)).size, 2);
});

test('finalists remain sourced from Typography Intelligence and utility stays on the body family', () => {
  const output = buildConversationTypographyRefinement();
  for (const finalist of output.finalists) {
    assert.ok(finalist.sourceSystem, finalist.id);
    assert.equal(finalist.sourceSummary.utility, finalist.body);
    assert.equal(finalist.sourceSummary.pairingEvidenceLevel, 'catalog-metadata');
    assert.ok(Number.isFinite(finalist.sourceSummary.systemScore));
    assert.ok(Number.isFinite(finalist.sourceSummary.pairingScore));
  }
});

test('refinement stress-tests English German and French without claiming a winner', () => {
  const output = buildConversationTypographyRefinement();
  assert.deepEqual(output.languageStress.map((item) => item.lang), ['en','de','fr']);
  assert.equal(output.truth.twoFinalistsAdvanced, true);
  assert.equal(output.truth.humanTypographyWinnerSelected, false);
  assert.equal(output.truth.typographyApproved, false);
  assert.equal(output.truth.artDirectionApproved, false);
  assert.equal(output.truth.canonicalTypographyConsumptionProduced, false);
  assert.equal(output.truth.productionReady, false);
});

test('refinement tuning is explicitly an authored hypothesis rather than a measured optimum', () => {
  const output = buildConversationTypographyRefinement();
  assert.match(output.evidencePolicy.tuning, /not measured optima/i);
  for (const finalist of output.finalists) {
    assert.ok(finalist.authoredHypothesis);
    assert.ok(finalist.killCriteria.length >= 3);
    assert.ok(finalist.tuning.desktop.displaySizePx > finalist.tuning.mobile.displaySizePx);
    assert.equal(finalist.tuning.desktop.displayWeight, 600);
  }
});

test('product nomenclature strings are specimens rather than availability claims', () => {
  const output = buildConversationTypographyRefinement();
  assert.ok(output.nomenclatureSpecimens.length >= 4);
  assert.match(output.evidencePolicy.productNames, /not Du Bonheur availability claims/i);
});
