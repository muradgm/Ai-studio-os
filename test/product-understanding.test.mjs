import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildProductUnderstanding, reviewProductUnderstanding } from '../modules/product-understanding/runtime.mjs';
import { runCreativeRuntime } from '../lib/creative-runtime.mjs';

const aiCouncilInput = JSON.parse(fs.readFileSync(new URL('../projects/ai-council/product-understanding.json', import.meta.url), 'utf8'));
const duBonheurInput = JSON.parse(fs.readFileSync(new URL('../benchmarks/001-du-bonheur/input.json', import.meta.url), 'utf8'));

test('AI Council dogfood report becomes review-ready from concrete repository evidence', () => {
  const output = buildProductUnderstanding(aiCouncilInput);
  assert.equal(output.pass, true, JSON.stringify(output.findings));
  assert.equal(output.reviewReady, true, JSON.stringify(output.findings));
  assert.equal(output.status, 'ready-for-creative-thesis');
  assert.ok(output.confidence >= 0.75);
  assert.equal(output.evidenceCoverage.missing.length, 0);
  assert.equal(output.truth.creativeWorkAuthorized, true);
  assert.ok(output.differentiators.some((item) => /trusted technical judgment/i.test(item)));
  assert.ok(output.categoryCliches.some((item) => /neon|node|avatar|command-center/i.test(item)));
});

test('Product Understanding blocks creative work when product mechanics and evidence are missing', () => {
  const output = buildProductUnderstanding({
    projectId: 'thin-product',
    productDefinition: 'An AI app.',
    problem: 'Help users.',
    primaryUsers: ['users'],
    primaryJobs: ['use AI'],
    authorship: { mode: 'authored-from-evidence' }
  });

  assert.equal(output.reviewReady, false);
  assert.equal(output.status, 'blocked');
  assert.equal(output.truth.creativeWorkAuthorized, false);
  assert.ok(output.findings.some((item) => item.code === 'product-understanding-mechanics-thin'));
  assert.ok(output.findings.some((item) => item.code === 'product-understanding-evidence-thin'));
});

test('Product Understanding rejects deterministic scaffolding as creative authorization', () => {
  const report = buildProductUnderstanding({
    ...aiCouncilInput,
    authorship: { mode: 'deterministic-normalization' }
  });
  const review = reviewProductUnderstanding(report);

  assert.equal(review.reviewReady, false);
  assert.equal(review.status, 'provisional');
  assert.ok(review.findings.some((item) => item.code === 'product-understanding-authorship-required'));
});

test('Creative Runtime stops before inspiration and thesis when Product Understanding is not ready', () => {
  const output = runCreativeRuntime({
    id: 'unknown-product',
    taskType: 'landing-page',
    intent: 'Make an award-caliber website.',
    businessTruths: ['There is a product.'],
    inspiration: { directIndustry: ['AI'], antiReferences: ['generic'] }
  });

  assert.equal(output.status, 'blocked');
  assert.deepEqual(output.stages, ['product-understanding']);
  assert.equal(output.inspiration, null);
  assert.equal(output.creativeThesis, null);
  assert.equal(output.creativeDirection, null);
  assert.ok(output.findings.some((item) => item.code === 'creative-runtime-product-understanding-not-ready'));
});

test('Du Bonheur Creative Runtime passes Product Understanding before Creative Thesis', () => {
  const output = runCreativeRuntime(duBonheurInput);
  assert.equal(output.productUnderstanding.reviewReady, true, JSON.stringify(output.productUnderstanding.findings));
  assert.equal(output.stages[0], 'product-understanding');
  assert.ok(output.stages.indexOf('product-understanding') < output.stages.indexOf('creative-thesis'));
  assert.notEqual(output.creativeThesis, null);
});

test('brand-defining routes place Product Understanding before research, exploration, and Creative Thesis', () => {
  const routes = JSON.parse(fs.readFileSync(new URL('../kernel/routes.json', import.meta.url), 'utf8'));
  for (const routeName of ['landing-page', 'product-film', 'brand-identity', 'logo-identity', 'creative-production']) {
    const route = routes[routeName];
    const productIndex = route.indexOf('product-understanding');
    assert.ok(productIndex > -1, `${routeName}: missing product-understanding`);
    for (const later of ['research', 'inspiration', 'explore', 'creative-thesis']) {
      const laterIndex = route.indexOf(later);
      if (laterIndex > -1) assert.ok(productIndex < laterIndex, `${routeName}: product-understanding must precede ${later}`);
    }
  }
});
