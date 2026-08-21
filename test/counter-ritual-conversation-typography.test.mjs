import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildConversationTypographyExploration } from '../projects/du-bonheur/counter-ritual-v3/runtime.mjs';

const sourceLock = JSON.parse(fs.readFileSync(new URL('../projects/du-bonheur/counter-ritual-v2/EXPERIENCE_THESIS_LOCK.json', import.meta.url)));
const integrationLock = JSON.parse(fs.readFileSync(new URL('../projects/du-bonheur/counter-ritual-v3/EXPERIENCE_THESIS_LOCK.json', import.meta.url)));

test('Conversation integration preserves the canonical Counter Ritual experience lock', () => {
  assert.equal(integrationLock.worldId, sourceLock.worldId);
  assert.equal(integrationLock.lockedExperienceIdea, sourceLock.lockedExperienceIdea);
  assert.deepEqual(integrationLock.lockedSequence, sourceLock.lockedSequence);
  assert.equal(integrationLock.truth.humanExperienceThesisSelectionConfirmed, true);
  assert.equal(integrationLock.truth.currentArtDirectionApproved, false);
});

test('selected Counter Ritual world is authoritative but The Conversation remains only a lead hypothesis', () => {
  const output = buildConversationTypographyExploration();
  assert.equal(output.pass, true, JSON.stringify(output.findings));
  assert.equal(output.selectedCreativeWorld.id, 'counter-ritual');
  assert.equal(output.selectedCreativeWorld.selected, true);
  assert.equal(output.selectedCreativeWorld.reviewReady, true);
  assert.equal(output.truth.theConversationLeadHypothesis, true);
  assert.equal(output.truth.humanArtDirectionSelectionConfirmed, false);
});

test('Typography Intelligence receives Creative Thesis, selected Creative World, and explicit art-direction authority', () => {
  const output = buildConversationTypographyExploration();
  assert.equal(output.typographyIntent.authority, 'typography-art-direction');
  assert.equal(output.typographyIntent.provenance.creativeWorldAuthoritative, true);
  assert.deepEqual(output.typographyIntent.provenance.layers, ['creative-thesis','selected-creative-world','typography-art-direction']);
  assert.equal(output.typographyIntent.provenance.fieldAuthority.preferredCategories, 'typography-art-direction');
  assert.ok(output.typographyIntent.provenance.overrideFields.includes('preferredCategories'));
  assert.ok(output.typographyIntent.antiPatterns.some((item) => /chatbot/i.test(item)));
});

test('Typography Intelligence proposes multiple systems but refuses canonical selection before visual review', () => {
  const output = buildConversationTypographyExploration();
  assert.equal(output.status, 'typography-candidates-awaiting-visual-review');
  assert.ok(output.systems.length >= 3);
  assert.equal(output.typographyRuntime.pass, false);
  assert.equal(output.typographyRuntime.findings[0].code, 'typography-art-direction-review-required');
  assert.equal(output.typographyRuntime.selection, null);
  assert.equal(output.typographyRuntime.production, null);
  assert.equal(output.truth.typographySystemSelected, false);
  assert.equal(output.truth.typographyApproved, false);
  assert.equal(output.truth.canonicalTypographyConsumptionProduced, false);
});

test('Typography art-direction shortlist preserves materially different display voices', () => {
  const output = buildConversationTypographyExploration();
  const displays = output.systems.map((system) => system.display.font.family);
  assert.ok(displays.length >= 3);
  assert.equal(new Set(displays).size, displays.length, `display shortlist collapsed to repeated families: ${displays.join(', ')}`);
  assert.equal(output.shortlistPolicy.mode, 'ranked-quality-plus-display-voice-diversity');
  assert.equal(output.shortlistPolicy.automaticWinner, false);
});

test('Conversation utility role reuses body family instead of introducing automatic monospace styling', () => {
  const output = buildConversationTypographyExploration();
  for (const system of output.systems) {
    assert.equal(system.utility.font.family, system.body.font.family, `utility drift in ${system.systemId}`);
    assert.notEqual(system.utility.font.category, 'monospace');
  }
});

test('CI candidate fixture does not pretend catalog metadata is measured structural evidence', () => {
  const output = buildConversationTypographyExploration();
  assert.equal(output.sourceEvidence.structuralEvidence, 'not-claimed-in-ci-fixture');
  assert.equal(output.sourceEvidence.liveCatalogCacheUsed, false);
  for (const system of output.systemSummaries) assert.equal(system.pairingEvidenceLevel, 'catalog-metadata');
});
