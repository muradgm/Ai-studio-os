import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runAwardCaliberWebRuntime, validateAwardCaliberWebBenchmark } from '../lib/award-caliber-web-runtime.mjs';

const input = JSON.parse(fs.readFileSync(new URL('../benchmarks/010-award-caliber-web/input.json', import.meta.url)));
const expected = JSON.parse(fs.readFileSync(new URL('../benchmarks/010-award-caliber-web/expected.json', import.meta.url)));

test('Award-Caliber Web benchmark passes without making award claims', () => {
  const output = runAwardCaliberWebRuntime(input);
  const result = validateAwardCaliberWebBenchmark(output, expected);
  assert.equal(result.pass, true, result.failures.join('\n'));
  assert.equal(output.verdict.status, 'candidate');
  assert.equal(output.verdict.awardClaim, false);
});

test('Award-Caliber Web runtime blocks unsupported award claims', () => {
  const claimed = structuredClone(input);
  claimed.finalClaims.awardReady = true;
  const output = runAwardCaliberWebRuntime(claimed);
  assert.equal(output.pass, false);
  assert.equal(output.verdict.status, 'blocked');
  assert.ok(output.findings.some((item) => item.code === 'unsupported-award-claim'));
});

test('Award-Caliber Web runtime rejects cosmetic-only creative worlds', () => {
  const cosmetic = structuredClone(input);
  cosmetic.creativeWorlds[1] = { ...cosmetic.creativeWorlds[0], id: 'same-world-renamed' };
  const output = runAwardCaliberWebRuntime(cosmetic);
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'creative-worlds-cosmetic-only'));
});

test('Award-Caliber Web runtime requires human-selected rendered proof', () => {
  const missingProof = structuredClone(input);
  missingProof.styleFrames = [];
  const output = runAwardCaliberWebRuntime(missingProof);
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'selected-world-rendered-proof-missing'));
});
