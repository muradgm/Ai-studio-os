import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreativeIntelligenceContext,
  buildCreativeIntelligenceFoundation,
  buildCreativeKnowledgeEntry,
  buildCreativeReasoningFrame,
  reviewCreativeIntelligenceContext,
  reviewCreativeIntelligenceFoundation,
  reviewCreativeReasoningFrame
} from '../modules/creative-intelligence-foundation/runtime.mjs';

function principle(overrides = {}) {
  return {
    id: 'stable-principle',
    kind: 'principle',
    domain: 'composition',
    title: 'Stable principle',
    definition: 'Concentrated contrast can establish reading order when surrounding signals remain quieter.',
    causalRationale: 'Relative signal strength changes fixation competition and therefore alters likely reading order.',
    perceptualEffects: ['clearer first fixation'],
    worksWhen: ['several information levels compete for attention'],
    failsWhen: ['all elements receive equal high contrast'],
    creativeVariables: ['scale', 'weight', 'spacing'],
    crossDomainApplications: ['editorial design'],
    failureModes: ['false hierarchy'],
    counterexamples: ['an egalitarian comparison surface where equal prominence is intentional'],
    diagnostics: ['squint test preserves one intended focal priority'],
    relationships: [],
    provenance: {
      sourceId: 'stable-principle-source',
      sourceType: 'curated-principle',
      sourceRef: 'internal://stable-principle'
    },
    confidence: 0.9,
    confidenceBasis: 'Broadly evidenced principle whose expression remains context dependent.',
    scope: 'general',
    transferability: 'Broad with project-specific adaptation.',
    ...overrides
  };
}

function ref(knowledgeId) {
  return {
    knowledgeId,
    role: 'supporting-principle',
    relevance: 'Relevant to the current hierarchy question.',
    projectFit: 'Applied only through current project truth.',
    caution: 'Evidence is not direction or approval.'
  };
}

test('stable knowledge identity is required rather than invented from list position', () => {
  const entry = buildCreativeKnowledgeEntry(principle({ id: '' }));
  assert.equal(entry.pass, false);
  assert.equal(entry.reviewReady, false);
  assert.ok(entry.findings.some((item) => item.code === 'creative-knowledge-id-missing'));
});

test('confidence accepts only explicit finite numeric values in the 0..1 range', () => {
  for (const confidence of [null, '', '0.8', Number.NaN, Number.POSITIVE_INFINITY, -0.01, 1.01]) {
    const entry = buildCreativeKnowledgeEntry(principle({ confidence }));
    assert.equal(entry.pass, false, `confidence ${String(confidence)} should fail`);
    assert.ok(entry.findings.some((item) => item.code === 'creative-knowledge-confidence-invalid'));
  }

  const zero = buildCreativeKnowledgeEntry(principle({ confidence: 0 }));
  assert.equal(zero.reviewReady, true);
  const one = buildCreativeKnowledgeEntry(principle({ confidence: 1 }));
  assert.equal(one.reviewReady, true);
});

test('same-ID knowledge content drift invalidates the library and Foundation snapshot chain', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  assert.equal(foundation.reviewReady, true);

  const drifted = structuredClone(foundation);
  drifted.knowledgeLibrary.entries[0].definition = 'A different claim under the same knowledge ID.';

  const review = reviewCreativeIntelligenceFoundation(drifted);
  assert.equal(review.reviewReady, false);
  assert.ok(review.libraryReview.findings.some((item) => item.code === 'creative-knowledge-library-fingerprint-mismatch'));
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-foundation-library-not-ready'));
});

test('project-context snapshot binds purpose, project truth, selected evidence and Foundation snapshot', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Reason about hierarchy.',
    projectTruths: ['The product needs a clear first fixation.'],
    constraints: ['Evidence must remain readable.'],
    foundation,
    entryRefs: [ref('stable-principle')]
  });
  assert.equal(context.reviewReady, true);

  const drifted = structuredClone(context);
  drifted.purpose = 'A materially different reasoning purpose.';
  const review = reviewCreativeIntelligenceContext(drifted);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-context-fingerprint-mismatch'));
});

test('duplicate evidence selection is rejected rather than double-counted', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Test duplicate selection.',
    projectTruths: ['The product needs a clear first fixation.'],
    foundation,
    entryRefs: [ref('stable-principle'), ref('stable-principle')]
  });
  assert.equal(context.pass, false);
  assert.ok(context.findings.some((item) => item.code === 'creative-intelligence-evidence-ref-duplicate'));
});

test('reasoning frame binds exact move content and project identity to the reviewed context', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Reason about hierarchy.',
    projectTruths: ['The product needs a clear first fixation.'],
    foundation,
    entryRefs: [ref('stable-principle')]
  });
  const frame = buildCreativeReasoningFrame({
    context,
    moves: [{
      id: 'hierarchy-fit',
      type: 'appropriateness',
      claim: 'Controlled contrast is a plausible candidate principle for this project.',
      knowledgeRefs: ['stable-principle'],
      projectTruthRefs: ['The product needs a clear first fixation.'],
      consequence: 'Advance a hierarchy hypothesis for downstream creative exploration, not selection.',
      uncertainty: 'Exact expression still requires project-specific visual proof.'
    }]
  });
  assert.equal(frame.reviewReady, true);

  const changedMove = structuredClone(frame);
  changedMove.moves[0].claim = 'A replacement reasoning claim under the same move ID.';
  let review = reviewCreativeReasoningFrame(changedMove);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-reasoning-frame-fingerprint-mismatch'));

  const changedProject = structuredClone(frame);
  changedProject.projectId = 'project-b';
  review = reviewCreativeReasoningFrame(changedProject);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-reasoning-project-binding-mismatch'));
});

test('every project reasoning move must reconnect knowledge to current project truth', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Test project grounding.',
    projectTruths: ['The product needs a clear first fixation.'],
    foundation,
    entryRefs: [ref('stable-principle')]
  });
  const frame = buildCreativeReasoningFrame({
    context,
    moves: [{
      id: 'knowledge-only',
      type: 'causal',
      claim: 'Use the general contrast principle.',
      causalExplanation: 'Contrast changes fixation competition.',
      knowledgeRefs: ['stable-principle'],
      projectTruthRefs: [],
      consequence: 'Apply the principle.',
      uncertainty: 'Project fit has not been established.'
    }]
  });
  assert.equal(frame.reviewReady, false);
  assert.ok(frame.findings.some((item) => item.code === 'creative-reasoning-project-grounding-missing'));
});
