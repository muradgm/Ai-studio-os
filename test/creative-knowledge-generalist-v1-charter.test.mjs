import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreativeKnowledgeGeneralistV1Charter,
  reviewCreativeKnowledgeGeneralistV1Charter
} from '../modules/creative-knowledge-generalist-v1/charter.mjs';

test('Generalist V1 charter freezes the neutral 24-entry corpus design', () => {
  const charter = buildCreativeKnowledgeGeneralistV1Charter();
  const review = reviewCreativeKnowledgeGeneralistV1Charter(charter);

  assert.equal(review.pass, true);
  assert.deepEqual(charter.domains, [
    'editorial-and-information-design',
    'architecture-and-spatial-experience',
    'industrial-and-product-design',
    'film-and-cinematography',
    'photography-and-visual-framing',
    'music-and-rhythm',
    'interaction-and-hci',
    'visual-perception-and-cognition'
  ]);
  assert.equal(charter.plannedEntriesPerDomain, 3);
  assert.equal(charter.plannedEntryCount, 24);
  assert.equal(charter.entryContract.kind, 'principle');
  assert.equal(charter.entryContract.scope, 'general');
  assert.equal(charter.entryContract.minimumConfidence, 0.7);
  assert.equal(charter.contaminationFirewall.activeProjectTargetingForbidden, true);
  assert.equal(charter.sourceQuality.forbiddenPrimaryEvidence.includes('ai-studio-os-fixture-or-test'), true);
  assert.equal(charter.retrievalNeutrality.projectSpecificEligibilityMappingForbidden, true);
  assert.equal(charter.truth.populated, false);
});

test('Generalist V1 charter rejects corpus expansion and benchmark targeting drift', () => {
  const expanded = buildCreativeKnowledgeGeneralistV1Charter();
  expanded.plannedEntryCount = 25;
  assert.equal(reviewCreativeKnowledgeGeneralistV1Charter(expanded).pass, false);

  const targeted = buildCreativeKnowledgeGeneralistV1Charter();
  targeted.contaminationFirewall.activeProjectTargetingForbidden = false;
  assert.equal(reviewCreativeKnowledgeGeneralistV1Charter(targeted).pass, false);
});
