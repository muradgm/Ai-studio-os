import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildInspirationPacket } from '../modules/inspiration/runtime.mjs';
import { buildCreativeThesis, reviewCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { runCreativeRuntime, validateBenchmark } from '../lib/creative-runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

function inspirationFixture() {
  return buildInspirationPacket({
    directIndustry: ['artisan bakery'],
    bestInClass: ['editorial food commerce'],
    adjacentIndustries: ['independent magazines'],
    trends: ['visible craft'],
    antiReferences: ['generic centered serif hero', 'beige luxury template'],
    opportunityGaps: ['make pastry texture and process tactile online'],
    unresolvedUnknowns: ['primary commercial goal still needs confirmation']
  });
}

test('Creative Thesis produces one truth-anchored, technology-neutral governing idea', () => {
  const thesis = buildCreativeThesis({
    projectId: 'du-bonheur',
    intent: 'Create a distinctive digital experience for a real French pâtisserie in Berlin.',
    businessTruths: [
      'Du Bonheur is a real French pâtisserie in Berlin Mitte.',
      'The site must represent real products truthfully.'
    ],
    inspiration: inspirationFixture(),
    traits: ['tactile', 'editorial', 'precise'],
    antiPrinciples: ['Do not default to generic beige luxury.', 'Do not use decorative Paris clichés.']
  });

  assert.equal(thesis.pass, true, JSON.stringify(thesis.findings));
  assert.equal(thesis.governingIdea.singular, true);
  assert.equal(thesis.sourceTruths.length, 2);
  assert.equal(thesis.sourceOpportunity.value, 'make pastry texture and process tactile online');
  assert.match(thesis.governingIdea.statement, /pastry texture and process tactile online/i);
  assert.match(thesis.technologyPolicy, /tools serve the governing idea/i);
  assert.doesNotMatch(thesis.governingIdea.statement, /three\.js|webgl|gsap|rive|shader/i);
  assert.ok(thesis.categoryRejections.includes('generic centered serif hero'));
  assert.ok(thesis.competitorTransferTest.evidenceRefs.includes('truth-1'));
  assert.equal(thesis.truth.humanCreativeApproval, false);
  assert.equal(thesis.truth.creativeThesisFrozen, false);
});

test('Creative Thesis blocks when real project truth is missing', () => {
  const thesis = buildCreativeThesis({
    intent: 'Make a premium immersive website.',
    inspiration: inspirationFixture(),
    traits: ['premium', 'immersive'],
    antiPrinciples: ['Do not be generic.', 'Do not copy references.']
  });

  assert.equal(thesis.pass, false);
  assert.equal(thesis.status, 'blocked');
  assert.ok(thesis.findings.some((item) => item.code === 'creative-thesis-truth-anchor-missing'));
});

test('Creative Thesis keeps a missing opportunity gap visible instead of inventing one', () => {
  const inspiration = inspirationFixture();
  inspiration.opportunityGaps = [];
  const thesis = buildCreativeThesis({
    intent: 'Create a distinct experience.',
    businessTruths: ['This is a real business.'],
    inspiration,
    traits: ['precise', 'warm'],
    antiPrinciples: ['No generic luxury.', 'No trend collage.']
  });

  assert.equal(thesis.pass, true);
  assert.equal(thesis.status, 'provisional');
  assert.equal(thesis.sourceOpportunity, null);
  assert.ok(thesis.findings.some((item) => item.code === 'creative-thesis-opportunity-gap-missing'));
});

test('Creative Thesis review rejects implementation technology as the governing concept', () => {
  const thesis = buildCreativeThesis({
    intent: 'Create a distinct experience.',
    businessTruths: ['This is a real business.'],
    inspiration: inspirationFixture(),
    traits: ['precise', 'warm'],
    antiPrinciples: ['No generic luxury.', 'No trend collage.']
  });
  const corrupted = {
    ...thesis,
    governingIdea: { ...thesis.governingIdea, statement: 'Build the experience around WebGL and Three.js.' }
  };
  const review = reviewCreativeThesis(corrupted);

  assert.equal(review.pass, false);
  assert.equal(review.status, 'blocked');
  assert.ok(review.findings.some((item) => item.code === 'creative-thesis-technology-became-concept'));
});

test('Du Bonheur Creative Runtime binds downstream direction to Creative Thesis without inventing approval', () => {
  const input = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/001-du-bonheur/input.json'), 'utf8'));
  const expected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/001-du-bonheur/expected.json'), 'utf8'));
  const output = runCreativeRuntime(input);
  const benchmark = validateBenchmark(output, expected);

  assert.equal(benchmark.pass, true, JSON.stringify(benchmark.failures));
  assert.ok(output.stages.includes('creative-thesis'));
  assert.equal(output.creativeDirection.thesisContext.statement, output.creativeThesis.statement);
  assert.equal(output.creativeDirection.directionStatement, output.creativeThesis.statement);
  assert.equal(output.creativeThesis.truth.humanCreativeApproval, false);
  assert.equal(output.creativeThesis.truth.creativeThesisFrozen, false);
});
