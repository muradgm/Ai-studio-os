import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { buildCreativeKnowledgeGeneralistV1Charter, reviewCreativeKnowledgeGeneralistV1Charter } from '../modules/creative-knowledge-generalist-v1/charter.mjs';
import { CREATIVE_KNOWLEDGE_GENERALIST_V1_ENTRIES } from '../modules/creative-knowledge-generalist-v1/knowledge.mjs';
import { buildCreativeKnowledgeGeneralistV1Freeze } from '../scripts/freeze-creative-knowledge-generalist-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceManifest = JSON.parse(fs.readFileSync(path.join(root, 'modules/creative-knowledge-generalist-v1/source-manifest.json'), 'utf8'));
const freezeMetadata = JSON.parse(fs.readFileSync(path.join(root, 'modules/creative-knowledge-generalist-v1/freeze-metadata.json'), 'utf8'));
const forbidden = /benchmark-011|after matter|after-matter|friction-index|condition-d/i;

test('Generalist V1 production corpus satisfies the frozen charter and produces a review-ready Foundation and Graph', () => {
  const charter = buildCreativeKnowledgeGeneralistV1Charter();
  const result = buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata });
  const entries = CREATIVE_KNOWLEDGE_GENERALIST_V1_ENTRIES;

  assert.equal(reviewCreativeKnowledgeGeneralistV1Charter(charter).pass, true);
  assert.equal(entries.length, 24);
  assert.deepEqual(result.freeze.domainCounts, Object.fromEntries(charter.domains.map((domain) => [domain, 3])));
  assert.equal(result.foundation.reviewReady, true);
  assert.equal(result.graph.reviewReady, true);
  assert.equal(result.graph.nodes.length, 24);
  assert.equal(result.freeze.truth.providerGenerationUsed, false);
  assert.equal(result.freeze.truth.benchmark011BlindConfirmatoryUseAllowed, false);
  assert.equal(result.freeze.truth.unseenBenchmarkRequiredForCleanConfirmation, true);

  for (const entry of entries) {
    assert.equal(entry.kind, 'principle');
    assert.equal(entry.scope, 'general');
    assert.equal([0.7, 0.8, 0.9].includes(entry.confidence), true);
    assert.equal(forbidden.test(JSON.stringify(entry)), false);
    assert.equal(entry.transfer.mustStrip.length > 0, true);
    assert.equal(entry.relationships.every((relation) => relation.targetId !== entry.id), true);
  }
  for (const source of sourceManifest.sources) {
    assert.equal(source.sourceRef.startsWith('internal://'), false);
    assert.equal(forbidden.test(JSON.stringify(source)), false);
    assert.equal(Boolean(source.capturedAt), true);
  }
});

test('Generalist V1 freeze detects entry and source metadata drift', () => {
  const baseline = buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata });
  const alteredEntries = CREATIVE_KNOWLEDGE_GENERALIST_V1_ENTRIES.map((entry) => ({ ...entry }));
  alteredEntries[0] = { ...alteredEntries[0], definition: `${alteredEntries[0].definition} Changed.` };
  const changedEntry = buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata, entries: alteredEntries });
  assert.notEqual(changedEntry.freeze.corpusContentFingerprint, baseline.freeze.corpusContentFingerprint);

  const alteredManifest = structuredClone(sourceManifest);
  alteredManifest.sources[0].provenanceNote = `${alteredManifest.sources[0].provenanceNote} Revised.`;
  const changedSource = buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest: alteredManifest, freezeMetadata });
  assert.notEqual(changedSource.freeze.sourceManifestFingerprint, baseline.freeze.sourceManifestFingerprint);
});

test('Generalist V1 rejects detached primary provenance and pre-charter source chronology', () => {
  const alteredEntries = CREATIVE_KNOWLEDGE_GENERALIST_V1_ENTRIES.map((entry) => ({ ...entry, provenance: { ...entry.provenance } }));
  alteredEntries[0].provenance.sourceId = 'lynch-image-city-1960';
  assert.throws(() => buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata, entries: alteredEntries }), /primary-evidence-binding-drift/);

  const staleMetadata = { ...freezeMetadata, preRegistrationBoundary: '2026-08-31T19:00:00Z' };
  assert.throws(() => buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata: staleMetadata }), /source-captured-before-charter/);
});

test('Generalist V1 requires independent strong evidence and an explicit basis for 0.90 confidence', () => {
  const qualified = CREATIVE_KNOWLEDGE_GENERALIST_V1_ENTRIES.map((entry) => ({ ...entry }));
  qualified[0] = { ...qualified[0], confidence: 0.9, confidenceBasis: 'Multiple independent academic sources support this tightly bounded causal claim.' };
  assert.doesNotThrow(() => buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata, entries: qualified }));

  const inflated = qualified.map((entry) => ({ ...entry }));
  inflated[0] = { ...inflated[0], confidenceBasis: 'A bounded claim.' };
  assert.throws(() => buildCreativeKnowledgeGeneralistV1Freeze({ sourceManifest, freezeMetadata, entries: inflated }), /confidence-evidence-insufficient/);
});
