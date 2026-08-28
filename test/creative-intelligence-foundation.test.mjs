import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CREATIVE_INTELLIGENCE_CONSTITUTION,
  buildCreativeIntelligenceContext,
  buildCreativeIntelligenceFoundation,
  buildCreativeKnowledgeEntry,
  buildCreativeReasoningFrame,
  reviewCreativeIntelligenceContext,
  reviewCreativeIntelligenceFoundation,
  reviewCreativeKnowledgeEntry,
  reviewCreativeKnowledgeLibrary,
  reviewCreativeReasoningFrame
} from '../modules/creative-intelligence-foundation/runtime.mjs';

function principle(overrides = {}) {
  return {
    schema: 'ai-studio-os/creative-knowledge-entry@1',
    id: 'hierarchy-through-contrast',
    kind: 'principle',
    domain: 'composition',
    title: 'Hierarchy through controlled contrast',
    definition: 'Relative contrast can establish reading order when contrast is concentrated rather than distributed evenly.',
    causalRationale: 'The visual system gives limited attention to competing signals; concentrating contrast creates a stronger first fixation and clearer subsequent reading order.',
    perceptualEffects: ['clearer first fixation', 'stronger reading order'],
    worksWhen: ['the interface has several competing information levels', 'contrast can remain semantically concentrated'],
    failsWhen: ['every element receives maximum contrast', 'contrast conflicts with accessibility or semantic state'],
    creativeVariables: ['scale', 'weight', 'value contrast', 'spacing'],
    crossDomainApplications: ['editorial layout', 'wayfinding', 'cinematography'],
    failureModes: ['visual shouting', 'false hierarchy'],
    counterexamples: ['a deliberately egalitarian comparison matrix where equal prominence is the task'],
    diagnostics: ['squint test reveals one intended first fixation', 'secondary content remains legible without competing with the focal element'],
    relationships: [],
    provenance: {
      sourceId: 'foundation-composition-principles-v1',
      sourceType: 'curated-principle',
      sourceRef: 'internal://creative-intelligence/composition/hierarchy-contrast'
    },
    confidence: 0.92,
    confidenceBasis: 'Stable perceptual/design principle with broad cross-domain evidence; exact expression remains context dependent.',
    scope: 'general',
    transferability: 'Broad, but expression must be adapted to task, semantics, accessibility and medium.',
    ...overrides
  };
}

function historicalPrecedent(overrides = {}) {
  return {
    schema: 'ai-studio-os/creative-knowledge-entry@1',
    id: 'editorial-sequencing-precedent',
    kind: 'historical-precedent',
    domain: 'editorial-design',
    title: 'Editorial sequencing precedent',
    definition: 'A precedent where changing scale, cropping and whitespace create temporal-feeling reading rhythm in a static sequence.',
    causalRationale: 'Alternating density and release changes expectation and attention, creating rhythm without requiring ornamental motion.',
    perceptualEffects: ['paced reading', 'controlled tension and release'],
    worksWhen: ['content has meaningful hierarchy and sequence'],
    failsWhen: ['the surface signature is copied without the underlying information structure'],
    creativeVariables: ['crop', 'scale', 'white space', 'sequence'],
    crossDomainApplications: ['motion storyboards', 'product onboarding', 'presentation systems'],
    failureModes: ['reference cosplay', 'decorative editorialism'],
    counterexamples: ['dense operational tables where stable alignment is more important than expressive pacing'],
    diagnostics: ['remove the reference styling and verify the sequencing principle still explains the proposed hierarchy'],
    relationships: [],
    provenance: {
      sourceId: 'editorial-sequence-study-001',
      sourceType: 'historical-reference',
      sourceRef: 'archive://editorial-sequence-study-001'
    },
    confidence: 0.78,
    confidenceBasis: 'Observed causal principle is plausible and transferable, but cultural and content context constrain application.',
    scope: 'general',
    transferability: 'Transfer the sequencing logic, not the recognizable composition or styling.',
    transfer: {
      transferablePrinciples: ['alternate density and release to pace attention'],
      surfaceSignature: ['specific typeface', 'specific crop ratios', 'recognizable grid proportions'],
      mustStrip: ['specific typeface', 'recognizable grid proportions'],
      adaptationRules: ['rebuild rhythm from the current project information hierarchy'],
      copyRisks: ['surface imitation can reproduce the precedent instead of generating project-specific structure']
    },
    ...overrides
  };
}

function projectObservation(projectId, overrides = {}) {
  return principle({
    id: `project-observation-${projectId}`,
    kind: 'project-observation',
    domain: 'product-experience',
    title: `Observation for ${projectId}`,
    definition: 'Users need consequential state changes to remain visually legible after temporary activity disappears.',
    causalRationale: 'Durable state supports orientation because users can inspect what changed after the transient action has ended.',
    perceptualEffects: ['continuity', 'clear consequence'],
    worksWhen: ['actions materially change project state'],
    failsWhen: ['transient feedback is incorrectly promoted into permanent product state'],
    failureModes: ['activity theater', 'durable clutter'],
    counterexamples: ['purely ephemeral hover feedback'],
    diagnostics: ['after motion stops, the user can still identify the consequential change'],
    provenance: {
      sourceId: `project-study-${projectId}`,
      sourceType: 'project-observation',
      sourceRef: `project://${projectId}/observation`
    },
    confidence: 0.88,
    confidenceBasis: 'Project-specific product and UX evidence.',
    scope: 'project',
    projectId,
    transferability: 'Project-scoped until recurrent evidence establishes a broader rule.',
    ...overrides
  });
}

function entryRef(knowledgeId, overrides = {}) {
  return {
    knowledgeId,
    role: 'supporting-principle',
    relevance: 'Directly informs how hierarchy and consequence should be reasoned about.',
    projectFit: 'The principle is adapted to the current project truth rather than imported as direction.',
    caution: 'Do not treat the evidence as approval or a finished visual solution.',
    ...overrides
  };
}

test('a richly qualified creative principle becomes usable evidence without gaining authority', () => {
  const entry = buildCreativeKnowledgeEntry(principle());
  assert.equal(entry.reviewReady, true);
  assert.equal(entry.status, 'usable-as-creative-evidence');
  assert.equal(entry.truth.knowledgeIsAuthority, false);
  assert.equal(entry.truth.productionApproved, false);
});

test('thin labels are not accepted as Creative Intelligence knowledge', () => {
  const entry = buildCreativeKnowledgeEntry({
    id: 'thin',
    kind: 'principle',
    domain: 'color',
    definition: 'Use contrast.',
    provenance: { sourceId: 'thin-source', sourceType: 'note' },
    confidence: 0.5,
    scope: 'general'
  });
  assert.equal(entry.reviewReady, false);
  assert.ok(entry.findings.some((item) => item.code === 'creative-knowledge-causal-rationale-missing'));
  assert.ok(entry.findings.some((item) => item.code === 'creative-knowledge-counterexample-missing'));
  assert.ok(entry.findings.some((item) => item.code === 'creative-knowledge-diagnostics-missing'));
});

test('reference-like knowledge must separate transferable principle from surface signature', () => {
  const incomplete = historicalPrecedent({
    transfer: {
      transferablePrinciples: [],
      surfaceSignature: [],
      mustStrip: [],
      adaptationRules: [],
      copyRisks: []
    }
  });
  const review = reviewCreativeKnowledgeEntry(incomplete);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-reference-transfer-principle-missing'));
  assert.ok(review.findings.some((item) => item.code === 'creative-reference-surface-signature-missing'));
  assert.ok(review.findings.some((item) => item.code === 'creative-reference-strip-rule-missing'));
  assert.ok(review.findings.some((item) => item.code === 'creative-reference-copy-risk-missing'));

  const complete = buildCreativeKnowledgeEntry(historicalPrecedent());
  assert.equal(complete.reviewReady, true);
});

test('raw claimed schema and cached authority flags are checked before normalization can erase them', () => {
  const forged = {
    ...principle(),
    schema: 'ai-studio-os/creative-direction@1',
    status: 'canonical',
    truth: {
      reviewReady: true,
      selected: true,
      productionApproved: true
    }
  };
  const review = reviewCreativeKnowledgeEntry(forged);
  assert.equal(review.pass, false);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-schema-invalid'));
  const authorityFinding = review.findings.find((item) => item.code === 'creative-knowledge-authority-fabricated');
  assert.ok(authorityFinding);
  assert.ok(authorityFinding.evidence.claims.includes('selected'));
  assert.ok(authorityFinding.evidence.claims.includes('productionApproved'));
  assert.ok(authorityFinding.evidence.claims.includes('status:canonical'));
});

test('knowledge relationships must resolve inside the bound library snapshot', () => {
  const withMissingTarget = principle({
    relationships: [{
      type: 'conflicts-with',
      targetId: 'missing-principle',
      rationale: 'The two principles compete under dense operational conditions.'
    }]
  });
  const review = reviewCreativeKnowledgeLibrary({
    schema: 'ai-studio-os/creative-knowledge-library@1',
    entries: [withMissingTarget]
  });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-knowledge-relationship-target-missing'));
});

test('Foundation constitution cannot be weakened by caller-controlled truth or policy', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  assert.equal(foundation.reviewReady, true);
  assert.deepEqual(foundation.constitution, CREATIVE_INTELLIGENCE_CONSTITUTION);

  const forged = structuredClone(foundation);
  forged.constitution.knowledgeIsAuthority = true;
  forged.status = 'authoritative';
  forged.truth.productionApproved = true;

  const review = reviewCreativeIntelligenceFoundation(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-constitution-drift'));
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-foundation-authority-fabricated'));
});

test('shared foundation may contain several project scopes while context selects only matching project knowledge', () => {
  const foundation = buildCreativeIntelligenceFoundation({
    entries: [
      principle(),
      projectObservation('project-a'),
      projectObservation('project-b')
    ]
  });
  assert.equal(foundation.reviewReady, true);

  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Reason about durable consequence in the project interface.',
    projectTruths: ['Meaningful actions change durable project state.'],
    foundation,
    entryRefs: [
      entryRef('hierarchy-through-contrast'),
      entryRef('project-observation-project-a')
    ]
  });
  assert.equal(context.reviewReady, true);

  const crossProject = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Attempt to import another project observation.',
    projectTruths: ['Meaningful actions change durable project state.'],
    foundation,
    entryRefs: [entryRef('project-observation-project-b')]
  });
  assert.equal(crossProject.reviewReady, false);
  assert.ok(crossProject.findings.some((item) => item.code === 'creative-intelligence-project-knowledge-drift'));
});

test('context rejects unselected or fabricated authority while preserving project truth as the grounding layer', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle(), historicalPrecedent()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Explore a hierarchy strategy.',
    projectTruths: ['The product must keep recommendation evidence readable.'],
    foundation,
    entryRefs: [entryRef('hierarchy-through-contrast')]
  });
  assert.equal(context.reviewReady, true);
  assert.equal(context.truth.projectTruthDominatesRetrievedKnowledge, true);

  const forged = structuredClone(context);
  forged.truth.productionApproved = true;
  const review = reviewCreativeIntelligenceContext(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-intelligence-context-authority-fabricated'));
});

test('a valid reasoning frame exposes causal mechanism, project grounding, uncertainty and falsifiers', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle(), historicalPrecedent()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Develop an advisory hierarchy hypothesis without selecting a Creative Direction.',
    projectTruths: ['Evidence must stay readable while consequence remains visually clear.'],
    foundation,
    entryRefs: [entryRef('hierarchy-through-contrast'), entryRef('editorial-sequencing-precedent')]
  });
  assert.equal(context.reviewReady, true);

  const frame = buildCreativeReasoningFrame({
    context,
    moves: [
      {
        id: 'causal-hierarchy',
        type: 'causal',
        claim: 'Concentrating contrast on consequential state should clarify first fixation without making every surface loud.',
        causalExplanation: 'Concentrated contrast reduces competition between simultaneous signals and establishes an intended reading order.',
        knowledgeRefs: ['hierarchy-through-contrast'],
        projectTruthRefs: ['Evidence must stay readable while consequence remains visually clear.'],
        consequence: 'Keep ordinary evidence surfaces quieter and reserve stronger contrast for actual consequence.',
        uncertainty: 'Exact contrast magnitude still needs visual proof in the selected Creative World.'
      },
      {
        id: 'transfer-editorial-rhythm',
        type: 'transfer',
        claim: 'Editorial density-and-release may transfer into temporal hierarchy without copying the precedent layout.',
        knowledgeRefs: ['editorial-sequencing-precedent'],
        projectTruthRefs: ['Evidence must stay readable while consequence remains visually clear.'],
        consequence: 'Test rhythm through information sequencing rather than importing the reference grid or typography.',
        uncertainty: 'The transfer may become too editorial for dense operational states.',
        falsifier: 'Reject the transfer if it weakens scan speed or causes the product to resemble the precedent surface signature.'
      }
    ]
  });

  assert.equal(frame.reviewReady, true);
  assert.equal(frame.status, 'ready-as-advisory-creative-reasoning');
  assert.equal(frame.truth.generatedDirectionIsCanonical, false);
  assert.equal(frame.truth.productionApproved, false);
});

test('transfer and synthesis cannot become attractive ungrounded reference logic', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [historicalPrecedent()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Test transfer discipline.',
    projectTruths: ['The product is operational rather than editorial-first.'],
    foundation,
    entryRefs: [entryRef('editorial-sequencing-precedent')]
  });

  const frame = buildCreativeReasoningFrame({
    context,
    moves: [{
      id: 'bad-transfer',
      type: 'transfer',
      claim: 'Use the editorial rhythm.',
      knowledgeRefs: ['editorial-sequencing-precedent'],
      projectTruthRefs: [],
      consequence: 'Adopt a more editorial sequence.',
      uncertainty: 'Fit is unknown.'
    }]
  });

  assert.equal(frame.reviewReady, false);
  assert.ok(frame.findings.some((item) => item.code === 'creative-reasoning-transfer-project-grounding-missing'));
  assert.ok(frame.findings.some((item) => item.code === 'creative-reasoning-transfer-falsifier-missing'));
});

test('reasoning may cite only knowledge explicitly selected into the current project context', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle(), historicalPrecedent()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Test evidence binding.',
    projectTruths: ['The product needs clear hierarchy.'],
    foundation,
    entryRefs: [entryRef('hierarchy-through-contrast')]
  });

  const frame = buildCreativeReasoningFrame({
    context,
    moves: [{
      id: 'inject-unselected-reference',
      type: 'analogy',
      claim: 'Import editorial sequencing despite it not being selected into context.',
      knowledgeRefs: ['editorial-sequencing-precedent'],
      projectTruthRefs: ['The product needs clear hierarchy.'],
      consequence: 'Change the hierarchy language.',
      uncertainty: 'Unreviewed in this context.'
    }]
  });

  assert.equal(frame.pass, false);
  assert.ok(frame.findings.some((item) => item.code === 'creative-reasoning-knowledge-ref-invalid'));
});

test('reasoning frame cannot manufacture downstream approval from cached truth flags', () => {
  const foundation = buildCreativeIntelligenceFoundation({ entries: [principle()] });
  const context = buildCreativeIntelligenceContext({
    projectId: 'project-a',
    purpose: 'Test advisory boundary.',
    projectTruths: ['The project needs a clear first fixation.'],
    foundation,
    entryRefs: [entryRef('hierarchy-through-contrast')]
  });
  const frame = buildCreativeReasoningFrame({
    context,
    moves: [{
      id: 'appropriateness-check',
      type: 'appropriateness',
      claim: 'Controlled contrast is plausible for the current hierarchy problem.',
      knowledgeRefs: ['hierarchy-through-contrast'],
      projectTruthRefs: ['The project needs a clear first fixation.'],
      consequence: 'Advance the idea only as a candidate for downstream creative exploration.',
      uncertainty: 'Visual proof is still required.'
    }]
  });
  assert.equal(frame.reviewReady, true);

  const forged = structuredClone(frame);
  forged.status = 'canonical';
  forged.truth.productionApproved = true;
  forged.truth.creativeDirectionSelected = true;
  const review = reviewCreativeReasoningFrame(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'creative-reasoning-authority-fabricated'));
});
