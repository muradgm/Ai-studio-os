import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreativeIntelligenceFoundation
} from '../modules/creative-intelligence-foundation/runtime.mjs';
import {
  buildCreativeIntelligenceContextWithProvenance,
  buildCreativeReasoningFrameWithProvenance,
  reviewCreativeIntelligenceContextProvenance,
  reviewCreativeReasoningFrameProvenance
} from '../modules/creative-intelligence-foundation/provenance.mjs';

function principle(id, definition) {
  return {
    id,
    kind: 'principle',
    domain: 'composition',
    title: id,
    definition,
    causalRationale: 'Relative visual signals influence fixation competition and therefore reading order.',
    perceptualEffects: ['clearer hierarchy'],
    worksWhen: ['the project needs a legible attention order'],
    failsWhen: ['equal prominence is intentionally required'],
    creativeVariables: ['contrast', 'scale', 'spacing'],
    crossDomainApplications: ['editorial design'],
    failureModes: ['false hierarchy'],
    counterexamples: ['an intentionally egalitarian comparison matrix'],
    diagnostics: ['squint test preserves intended priority'],
    relationships: [],
    provenance: {
      sourceId: `source-${id}`,
      sourceType: 'curated-principle',
      sourceRef: `internal://${id}`
    },
    confidence: 0.9,
    confidenceBasis: 'Broadly evidenced but context-dependent.',
    scope: 'general',
    transferability: 'Broad with project-specific adaptation.'
  };
}

function entryRef(id) {
  return {
    knowledgeId: id,
    role: 'supporting-principle',
    relevance: 'Relevant to the hierarchy question.',
    projectFit: 'Must be interpreted through current project truth.',
    caution: 'Evidence is not direction.'
  };
}

function buildContext(foundation) {
  return buildCreativeIntelligenceContextWithProvenance({
    projectId: 'project-a',
    purpose: 'Reason about attention hierarchy.',
    projectTruths: ['The product must make the primary decision unmistakable.'],
    foundation,
    entryRefs: [entryRef('hierarchy-principle')]
  });
}

test('verified project context independently rebinds to the supplied source Foundation', () => {
  const foundation = buildCreativeIntelligenceFoundation({
    entries: [principle('hierarchy-principle', 'Controlled contrast can establish a primary fixation.')]
  });
  const context = buildContext(foundation);

  assert.equal(context.reviewReady, true);
  assert.equal(context.provenanceReady, true);
  assert.equal(context.provenanceReview.truth.hashIsSignature, false);
  assert.equal(context.provenanceReview.truth.provenanceVerificationGrantsCreativeAuthority, false);
});

test('a structurally valid context cannot claim Foundation provenance against another Foundation', () => {
  const foundationA = buildCreativeIntelligenceFoundation({
    entries: [principle('hierarchy-principle', 'Controlled contrast can establish a primary fixation.')]
  });
  const foundationB = buildCreativeIntelligenceFoundation({
    entries: [principle('hierarchy-principle', 'A materially different knowledge contract under the same stable ID.')]
  });
  const context = buildContext(foundationA);

  assert.equal(context.reviewReady, true);
  const review = reviewCreativeIntelligenceContextProvenance({ context, foundation: foundationB });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-provenance-foundation-fingerprint-mismatch'));
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-provenance-library-fingerprint-mismatch'));
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-provenance-selected-evidence-drift'));
});

test('caller-claimed Foundation readiness cannot substitute for supplying and reviewing the source Foundation', () => {
  const foundation = buildCreativeIntelligenceFoundation({
    entries: [principle('hierarchy-principle', 'Controlled contrast can establish a primary fixation.')]
  });
  const context = buildContext(foundation);
  const forged = structuredClone(context);
  forged.foundationBinding.sourceFoundationReviewReady = true;

  const review = reviewCreativeIntelligenceContextProvenance({ context: forged, foundation: null });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-provenance-foundation-not-ready'));
});

test('verified reasoning remains advisory and requires independently verified context provenance', () => {
  const foundation = buildCreativeIntelligenceFoundation({
    entries: [principle('hierarchy-principle', 'Controlled contrast can establish a primary fixation.')]
  });
  const context = buildContext(foundation);
  const frame = buildCreativeReasoningFrameWithProvenance({
    context,
    foundation,
    moves: [{
      id: 'hierarchy-causal-fit',
      type: 'causal',
      claim: 'Controlled contrast is a plausible mechanism for clarifying the primary decision.',
      causalExplanation: 'It changes relative fixation competition rather than merely decorating the interface.',
      knowledgeRefs: ['hierarchy-principle'],
      projectTruthRefs: ['The product must make the primary decision unmistakable.'],
      consequence: 'Advance a hierarchy hypothesis for downstream creative exploration.',
      uncertainty: 'Exact expression still requires project-specific visual proof.'
    }]
  });

  assert.equal(frame.reviewReady, true);
  assert.equal(frame.provenanceReady, true);
  assert.equal(frame.provenanceReview.truth.reasoningRemainsAdvisory, true);
  assert.equal(frame.provenanceReview.truth.provenanceVerificationGrantsCreativeAuthority, false);
  assert.equal(frame.truth.productionApproved, false);
});

test('reasoning provenance fails when a different Foundation is supplied at the verification boundary', () => {
  const foundationA = buildCreativeIntelligenceFoundation({
    entries: [principle('hierarchy-principle', 'Controlled contrast can establish a primary fixation.')]
  });
  const foundationB = buildCreativeIntelligenceFoundation({
    entries: [principle('hierarchy-principle', 'Different knowledge content.')]
  });
  const context = buildContext(foundationA);
  const frame = buildCreativeReasoningFrameWithProvenance({
    context,
    foundation: foundationA,
    moves: [{
      id: 'hierarchy-fit',
      type: 'appropriateness',
      claim: 'The principle is a candidate fit for this project.',
      knowledgeRefs: ['hierarchy-principle'],
      projectTruthRefs: ['The product must make the primary decision unmistakable.'],
      consequence: 'Carry the candidate into creative exploration.',
      uncertainty: 'Visual proof may reject the exact expression.'
    }]
  });

  const review = reviewCreativeReasoningFrameProvenance({ frame, foundation: foundationB });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-reasoning-provenance-context-not-verified'));
});
