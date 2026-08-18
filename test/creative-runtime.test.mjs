import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildInspirationPacket } from '../modules/inspiration/runtime.mjs';
import { routeImageAsset } from '../modules/image/runtime.mjs';
import { buildMotionPacket } from '../modules/motion/runtime.mjs';
import { evaluateCreative } from '../modules/evals/runtime.mjs';
import { classifyLearning } from '../modules/learning/runtime.mjs';
import { runCreativeRuntime, validateBenchmark } from '../lib/creative-runtime.mjs';

const input = JSON.parse(fs.readFileSync(new URL('../benchmarks/001-du-bonheur/input.json', import.meta.url)));
const expected = JSON.parse(fs.readFileSync(new URL('../benchmarks/001-du-bonheur/expected.json', import.meta.url)));

test('inspiration packet requires all five calibration lanes', () => {
  const packet = buildInspirationPacket(input.inspiration);
  assert.equal(packet.status, 'ready-for-research');
  assert.equal(packet.evidenceReady, false);
  assert.deepEqual(packet.missingLanes, []);
  assert.ok(packet.opportunityGaps.length >= 1);
});

test('real image with photographic correction routes to retouch', () => {
  const result = routeImageAsset({ real: true, usable: true, representsRealProduct: true, needs: ['crop', 'grade'] });
  assert.equal(result.action, 'retouch');
});

test('missing truthful product image requires capture', () => {
  const result = routeImageAsset({ real: false, usable: false, representsRealProduct: true, needs: [] });
  assert.equal(result.action, 'capture-required');
});

test('unusable real truth-sensitive asset requires capture', () => {
  const result = routeImageAsset({ real: true, usable: false, representsRealProduct: false, needs: [] });
  assert.equal(result.action, 'capture-required');
});

test('supporting synthetic imagery may be generated', () => {
  const result = routeImageAsset({ real: false, usable: false, representsRealProduct: false, needs: [] });
  assert.equal(result.action, 'generate-supporting');
});

test('every motion packet requires a reduced-motion fallback', () => {
  const motion = buildMotionPacket({ traits: ['tactile'], intensity: 6 });
  assert.equal(motion.reducedMotion.required, true);
  assert.ok(motion.reducedMotion.fallback.length > 20);
});

test('motion inherits creative traits when no motion-specific traits are supplied', () => {
  const direction = { directionStatement: 'Shared direction', traits: ['editorial', 'warm'], antiPrinciples: [] };
  const motion = buildMotionPacket({ direction });
  assert.deepEqual(motion.personality, ['editorial', 'warm']);
  assert.equal(motion.directionContext.statement, direction.directionStatement);
});

test('critical creative eval failure blocks approval despite strong average', () => {
  const result = evaluateCreative({
    businessClarity: 9,
    brandFit: 9,
    distinctiveness: 9,
    visualHierarchy: 9,
    imageAuthenticity: 4,
    motionPurpose: 9,
    accessibility: 9,
    aiGenericRisk: 2
  });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((f) => f.key === 'imageAuthenticity' && f.severity === 'blocker'));
});

test('cross-project recurring evidence can be promoted', () => {
  const result = classifyLearning({ recurrence: 3, scope: 'cross-project', evidence: 'strong' });
  assert.equal(result.classification, 'general-principle');
  assert.equal(result.promote, true);
});

test('creative runtime keeps design, image, and motion under one direction', () => {
  const output = runCreativeRuntime(input);
  assert.equal(output.design.direction.directionStatement, output.creativeDirection.directionStatement);
  assert.equal(output.image.directionContext.statement, output.creativeDirection.directionStatement);
  assert.equal(output.motion.directionContext.statement, output.creativeDirection.directionStatement);
  assert.match(output.creativeDirection.directionStatement, /tactile × editorial/);
});

test('Du Bonheur benchmark passes creative runtime invariants', () => {
  const output = runCreativeRuntime(input);
  const result = validateBenchmark(output, expected);
  assert.equal(result.pass, true, result.failures.join('\n'));
  assert.ok(output.creativeDirection.nonNegotiables.length >= 2);
  assert.equal(output.motion.signatureBehavior, 'laminated-layer-reveal');
  assert.equal(output.status, 'provisional');
});
