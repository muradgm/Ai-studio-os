import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreativeIntelligenceContext,
  buildCreativeIntelligenceFoundation,
  reviewCreativeIntelligenceContext,
  reviewCreativeIntelligenceFoundation
} from '../modules/creative-intelligence-foundation/runtime.mjs';

function principle() {
  return {
    id: 'constitution-principle',
    kind: 'principle',
    domain: 'composition',
    title: 'Constitution test principle',
    definition: 'Hierarchy should follow project meaning rather than imported style.',
    causalRationale: 'Meaning-aligned hierarchy reduces conflict between product semantics and visual emphasis.',
    perceptualEffects: ['clearer semantic emphasis'],
    worksWhen: ['project truth defines meaningful priority'],
    failsWhen: ['surface style is treated as the priority source'],
    creativeVariables: ['scale', 'contrast'],
    crossDomainApplications: ['editorial design'],
    failureModes: ['style-first hierarchy'],
    counterexamples: ['deliberately neutral system documentation'],
    diagnostics: ['remove the reference and verify the hierarchy still follows project truth'],
    relationships: [],
    provenance: { sourceId: 'constitution-source', sourceType: 'curated-principle' },
    confidence: 0.9,
    confidenceBasis: 'Stable internal design reasoning principle.',
    scope: 'general',
    transferability: 'Broad with project-specific adaptation.'
  };
}

test('Foundation rejects extra permissive constitutional keys, not only changed known values', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  assert.equal(foundation.reviewReady, true);

  const forged = structuredClone(foundation);
  forged.constitution.referencesMaySelectDirection = true;
  const review = reviewCreativeIntelligenceFoundation(forged);

  assert.equal(review.reviewReady, false);
  const drift = review.findings.find((item) => item.code === 'creative-intelligence-constitution-drift');
  assert.ok(drift);
  assert.deepEqual(drift.evidence.extraKeys, ['referencesMaySelectDirection']);
});

test('unknown authority-shaped true flags are rejected even when not in the named authority key list', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  const forged = structuredClone(foundation);
  forged.canApproveCreativeDirection = true;

  const review = reviewCreativeIntelligenceFoundation(forged);
  assert.equal(review.reviewReady, false);
  const authority = review.findings.find((item) => item.code === 'creative-intelligence-foundation-authority-fabricated');
  assert.ok(authority);
  assert.ok(authority.evidence.claims.includes('canApproveCreativeDirection'));
});

test('isolated project Foundation binding preserves the exact constitution', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Test binding constitution.',
    projectTruths: ['Project truth remains upstream of general knowledge.'],
    foundation,
    entryRefs: [{
      knowledgeId: 'constitution-principle',
      role: 'supporting-principle',
      relevance: 'Relevant to hierarchy reasoning.',
      projectFit: 'Used only through project truth.',
      caution: 'Does not select direction.'
    }]
  });
  assert.equal(context.reviewReady, true);

  const forged = structuredClone(context);
  forged.foundationBinding.constitution.referenceCanBecomeDirection = true;
  const review = reviewCreativeIntelligenceContext(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.bindingReview.findings.some((item) => item.code === 'creative-intelligence-foundation-binding-constitution-drift'));
});
