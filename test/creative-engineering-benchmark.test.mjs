import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCreativeEngineeringRuntime, validateCreativeEngineeringBenchmark } from '../lib/creative-engineering-runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/007-creative-engineering/input.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/007-creative-engineering/expected.json'), 'utf8'));

test('Benchmark 007 validates the v1.3 production-ready fixture', () => {
  const result = runCreativeEngineeringRuntime(input);
  assert.equal(result.runtime, 'creative-engineering-v1.3');
  assert.equal(result.pass, true);
  assert.equal(result.productionReady, true);
  const validation = validateCreativeEngineeringBenchmark(result, expected);
  assert.deepEqual(validation, { pass: true, findings: [] });
});
