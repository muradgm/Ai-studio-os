import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtimeUrl = new URL('../modules/creative-synthesis-intelligence/runtime.mjs', import.meta.url);

async function runtimeSource() {
  return readFile(runtimeUrl, 'utf8');
}

test('conceptual duplicate detection is independent of hypothesis ID and strategy label', async () => {
  const source = await runtimeSource();
  assert.match(
    source,
    /conceptualPayloadFingerprint[\s\S]*fingerprintCreativeValue\(\{\s*\.\.\.normalized,\s*id:\s*null,\s*strategy:\s*null\s*\}\)/,
    'conceptual duplicate fingerprint must exclude both ID and strategy so relabeling cannot manufacture divergence'
  );
});

test('Synthesis source receipts bind both Transfer artifact snapshot and safe candidate payload', async () => {
  const source = await runtimeSource();
  assert.match(source, /transferCandidatePayloadFingerprint:\s*transferPayloadFingerprint\(candidatePayload\)/);
  assert.match(source, /creative-synthesis-source-candidate-payload-fingerprint-drift/);
  assert.match(source, /allSourcesVerified === true[\s\S]*verifiedSourceCount[\s\S]*requestedSourceCount/);
});

test('negative Synthesis invariants are not treated as positive authority fields', async () => {
  const source = await runtimeSource();
  assert.doesNotMatch(source, /AUTHORITY_KEY\s*=\s*\/\([^\n]*winner[^\n]*recommend/);
  assert.match(source, /const POSITIVE_AUTHORITY_KEYS/);
  assert.match(source, /noWinnerOrRecommendationProduced:\s*true/);
  assert.match(source, /noScoresProduced:\s*true/);
});
