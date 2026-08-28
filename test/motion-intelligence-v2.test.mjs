import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrievalWithProvenance } from '../modules/creative-knowledge-graph/provenance.mjs';
import { buildCanonicalMotionAuthorityFixture } from '../fixtures/motion-creative-authority-fixture.mjs';
import { buildMotionIntelligenceV2Foundation, MOTION_INTELLIGENCE_V2_KNOWLEDGE } from '../modules/motion-intelligence-v2/knowledge.mjs';
import {
  buildMotionIntelligenceV2Brief,
  buildMotionIntelligenceV2Set,
  buildMotionIntelligenceV2ExplorationHandoff,
  reviewMotionIntelligenceV2Brief,
  reviewMotionIntelligenceV2Set,
  reviewMotionIntelligenceV2ExplorationHandoff
} from '../modules/motion-intelligence-v2/runtime.mjs';

const PROJECT_ID = 'motion-v2-project';
const AS_OF = '2026-08-28T16:00:00+02:00';

function buildKnowledge(projectId = PROJECT_ID) {
  const foundation = buildMotionIntelligenceV2Foundation();
  assert.equal(MOTION_INTELLIGENCE_V2_KNOWLEDGE.length >= 25, true);
  assert.equal(foundation.reviewReady, true, foundation.findings.map((item) => item.code).join(', '));
  const graph = buildCreativeKnowledgeGraph({ foundation });
  assert.equal(graph.reviewReady, true, graph.findings.map((item) => item.code).join(', '));
  const retrieval = buildCreativeKnowledgeRetrievalWithProvenance({
    graph,
    foundation,
    projectId,
    asOf: AS_OF,
    purpose: 'Provide broad qualified motion-design evidence for deep project-specific Motion Intelligence V2 reasoning.',
    domains: ['motion'],
    limit: 50
  });
  assert.equal(retrieval.reviewReady, true, retrieval.findings.map((item) => item.code).join(', '));
  assert.equal(retrieval.provenanceReady, true);
  assert.equal(retrieval.results.length >= 25, true);
  return { foundation, graph, retrieval };
}

function buildBrief({ projectId = PROJECT_ID, knowledge = buildKnowledge(projectId), canonical = buildCanonicalMotionAuthorityFixture(projectId), synthesis = null } = {}) {
  return buildMotionIntelligenceV2Brief({
    projectId,
    canonicalCreativeAuthority: canonical,
    knowledge,
    synthesis,
    projectTruths: [
      { id: 'truth-consequence', statement: 'Meaningful decisions change visible working state and deserve stronger temporal emphasis than routine navigation.' },
      { id: 'truth-calm', statement: 'The experience should remain calm and inspectable while still making consequence and progression unmistakable.' }
    ],
    constraints: [
      'Motion must remain subordinate to product meaning.',
      'Mobile and reduced-motion modes must preserve semantic hierarchy.',
      'Implementation technology cannot become the creative concept.'
    ]
  });
}

function contributions(ids, purpose) {
  return ids.map((sourceId) => ({ sourceId, contribution: `${purpose} Uses ${sourceId} as a causal constraint rather than a stylistic reference.` }));
}

function continuityHypothesis(worldId) {
  const knowledgeRefs = ['motion-necessity', 'attention-handoff', 'temporal-hierarchy', 'continuity-vs-cut'];
  return {
    id: 'deep-continuity',
    title: 'Earned Continuity',
    temporalStrategy: 'continuity',
    projectTruthRefs: ['truth-consequence', 'truth-calm'],
    creativeWorldRefs: [`${worldId}:motionLanguage`, `${worldId}:signatureBehavior`, `${worldId}:responsiveStrategy`],
    knowledgeRefs,
    knowledgeContributions: contributions(knowledgeRefs, 'The continuity direction preserves object identity only when a consequential state changes role.'),
    synthesisCandidateRefs: [],
    synthesisContributions: [],
    semanticIntent: 'Use continuous transformation only for consequential state changes where preserving object identity reduces uncertainty; ordinary reading and navigation remain calm.',
    signatureBehavior: 'One persistent focal object changes role through an anchored handoff while supporting context waits, then settles into a stable inspectable state.',
    motionNecessity: {
      moves: true,
      rationale: 'Movement is earned when a decision changes the role or authority of the focal object and continuity helps the user understand what became what.',
      earnedBy: ['A decision commits and the same focal object must visibly assume a new role.', 'A state boundary would be harder to understand through instant replacement alone.'],
      stillnessCases: ['Evidence-reading states remain still.', 'Navigation and secondary controls remain still while the focal state is being evaluated.'],
      stillnessRationale: 'Stillness protects reading and creates the contrast that makes consequential movement legible.'
    },
    attentionSequence: [
      { id: 'focus-current', focus: 'Current focal state', reason: 'Establish the object whose identity must persist.', next: 'focus-crossing' },
      { id: 'focus-crossing', focus: 'Consequential boundary crossing', reason: 'Make the role change and causal action visible.', next: 'focus-settled' },
      { id: 'focus-settled', focus: 'Stable new focal state', reason: 'Return attention to the actionable terminal hierarchy.', next: null }
    ],
    temporalComposition: {
      rhythm: 'Long stable reading intervals are interrupted by one sustained consequential handoff.',
      pacing: 'The primary change is measured but direct; secondary context follows only after identity is established.',
      anticipation: 'A minimal pre-commit cue acknowledges the decision without delaying it.',
      holds: 'Hold before commitment only long enough to establish the current state; hold after settling for inspection.',
      overlap: 'Supporting context begins repositioning after the focal object has clearly entered the transition.',
      stillness: 'No ambient drift; stable states stop completely once the new hierarchy is established.',
      easingLanguage: 'Controlled acceleration and deceleration with restrained settling and no decorative overshoot.',
      energyCurve: 'Quiet baseline, one sustained rise through the role change, controlled decay to stillness.'
    },
    motionHierarchy: 'The focal consequential object receives the longest coherent motion; supporting context moves later and less; navigation remains static.',
    physicalCharacter: {
      mass: 'Moderate visual mass: substantial enough to feel consequential without reading as heavy machinery.',
      inertia: 'Low initial inertia for responsive acknowledgement, then measured sustained travel.',
      friction: 'Moderate resistance implied during the state crossing, disappearing at the stable destination.',
      elasticity: 'Essentially rigid; no playful deformation is needed to communicate identity.',
      damping: 'High damping with at most a subtle finite settle.',
      rationale: 'The product world is calm and authoritative, so physical character should express controlled consequence rather than entertainment.'
    },
    choreography: {
      spatial: 'Preserve one anchor while surrounding layers reposition around it; avoid unrelated long-distance travel.',
      interaction: 'Commit acknowledgement is immediate; the transition remains interruptible until the underlying state becomes final.',
      scroll: 'No scroll-linked motion is required because the behavior is driven by state consequence rather than page progression.',
      depthModel: 'Depth remains shallow and functional; only the focal object may cross a restrained depth interval to clarify hierarchy.'
    },
    cinematicLanguage: {
      camera: 'Camera remains fixed; object continuity carries the spatial explanation.',
      framing: 'Keep the focal object within a stable compositional region throughout the state change.',
      reveal: 'Reveal supporting context only after the focal identity is secure.',
      continuity: 'Continuous transformation is reserved for preserved identity; categorical changes still cut.',
      editing: 'Use one continuous consequential beat followed by a stable terminal hold.'
    },
    mediaMotion: {
      typography: 'Typography remains stable except for hierarchy changes directly tied to the new focal state.',
      image: 'Images remain anchored; no slow zoom or decorative pan.',
      material: 'Material response is limited to restrained depth/light change that confirms the state crossing.',
      procedural: 'No generative motion; deterministic continuity is more appropriate for consequential product state.'
    },
    responsivePlan: {
      desktop: 'Preserve the anchored handoff with moderate travel and shallow depth.',
      mobile: 'Reduce travel and depth; use compact position/scale continuity around the same focal anchor.',
      touch: 'Acknowledge the tap immediately and avoid gesture behavior that conflicts with vertical scrolling.'
    },
    reducedMotionEquivalent: 'Replace spatial travel with immediate anchored re-layout, focus/contrast change and ordered appearance so identity, consequence and hierarchy remain explicit without simulated movement.',
    accessibilityConstraints: ['Avoid large-field zoom or camera travel.', 'Ensure the terminal state is self-sufficient without remembering the transition.'],
    performanceReasoning: {
      complexityClass: 'medium',
      costDrivers: ['persistent-object transform', 'coordinated supporting-layer repositioning'],
      justification: 'Continuity uniquely communicates preserved identity across a consequential state change.',
      fallback: 'Use immediate re-layout plus opacity/focus hierarchy if continuous transforms cannot remain smooth.'
    },
    antiPatterns: ['No perpetual ambient drift.', 'No unrelated parallax or floating layers.', 'No universal spring behavior.'],
    failureModes: ['Minor events inherit the same ceremony and make the product feel slow.', 'Supporting layers move too early and compete with the focal identity handoff.'],
    uncertainty: 'Some high-frequency state changes may need a shorter continuity expression than first-time consequential decisions.',
    falsifier: 'Reject the direction if users understand the new state faster with immediate replacement or if repeated use makes the handoff feel like latency.',
    critique: ['Continuity can become self-important unless the significance gate is enforced ruthlessly.']
  };
}

function punctuationHypothesis(worldId) {
  const knowledgeRefs = ['holds-stillness', 'rhythm-pacing', 'editing-temporal-compression', 'typographic-motion'];
  return {
    id: 'deep-punctuation',
    title: 'Decisive Punctuation',
    temporalStrategy: 'punctuation',
    projectTruthRefs: ['truth-consequence', 'truth-calm'],
    creativeWorldRefs: [`${worldId}:motionLanguage`, `${worldId}:narrativeModel`, `${worldId}:typographyIntent.statement`],
    knowledgeRefs,
    knowledgeContributions: contributions(knowledgeRefs, 'The punctuation direction uses stable reading beats and short semantic chapter changes.'),
    synthesisCandidateRefs: [], synthesisContributions: [],
    semanticIntent: 'Treat movement as punctuation between stable reading states: hierarchy changes are brief and decisive, while inspection time remains almost completely still.',
    signatureBehavior: 'A compact chapter boundary replaces or masks the current hierarchy, exposes the new primary statement first, then releases supporting detail into a static reading state.',
    motionNecessity: {
      moves: true,
      rationale: 'Motion is useful only at information chapter boundaries where temporal ordering clarifies what changed in priority.',
      earnedBy: ['A new decision chapter changes the primary information hierarchy.', 'Supporting evidence needs a short ordered reveal after the new primary statement.'],
      stillnessCases: ['Reading within a chapter is fully still.', 'Comparison surfaces hold stable while users inspect evidence.'],
      stillnessRationale: 'Long static intervals make the brief chapter transitions perceptually sharp without turning the product into a continuous film.'
    },
    attentionSequence: [
      { id: 'focus-old-chapter', focus: 'Existing primary statement', reason: 'Establish the chapter being left.', next: 'focus-new-primary' },
      { id: 'focus-new-primary', focus: 'New primary statement', reason: 'Make the hierarchy change unmistakable at the boundary.', next: 'focus-support' },
      { id: 'focus-support', focus: 'Supporting evidence', reason: 'Release detail only after the new reading order is clear.', next: null }
    ],
    temporalComposition: {
      rhythm: 'Long static plateaus separated by short asymmetric pulses.',
      pacing: 'Fast chapter change, brief ordered support reveal, immediate return to rest.',
      anticipation: 'No pre-motion for routine chapter changes; the explicit user action already supplies anticipation.',
      holds: 'Hold the final composition until the next meaningful hierarchy change.',
      overlap: 'Primary replacement completes before secondary evidence begins a short entrance.',
      stillness: 'Static reading is the dominant temporal state.',
      easingLanguage: 'Fast asymmetric completion with crisp stops and no rebound.',
      energyCurve: 'Flat plateau, sharp short pulse, immediate return to flat.'
    },
    motionHierarchy: 'Only the chapter-defining primary statement receives decisive temporal emphasis; evidence follows briefly; all persistent chrome stays still.',
    physicalCharacter: {
      mass: 'Light but precise, closer to editorial replacement than physical object travel.',
      inertia: 'Very low inertia so chapter changes feel decisive.',
      friction: 'Minimal implied resistance; changes finish cleanly.',
      elasticity: 'None; typography and panels remain rigid.',
      damping: 'Immediate settling with no oscillation.',
      rationale: 'The intended character is controlled editorial judgment, not tactile material play.'
    },
    choreography: {
      spatial: 'Most elements hold position; priority changes through clipping, replacement and small ordered displacement.',
      interaction: 'User action changes the chapter immediately; no post-action lockout.',
      scroll: 'Scrolling remains ordinary reading progression and does not control a forced animation timeline.',
      depthModel: 'Primarily planar; depth change is unnecessary for the chapter metaphor.'
    },
    cinematicLanguage: {
      camera: 'Static camera.',
      framing: 'Compositional frame stays stable while content hierarchy changes inside it.',
      reveal: 'Mask/replacement reveals the primary chapter change before supporting evidence.',
      continuity: 'Use cuts for categorical hierarchy changes; preserve continuity only for elements whose identity truly persists.',
      editing: 'Cut, establish primary, release support, hold.'
    },
    mediaMotion: {
      typography: 'Kinetic treatment is limited to short hierarchy-changing headlines or labels; body copy remains stable.',
      image: 'Evidence imagery changes by restrained cut or mask rather than cinematic pan.',
      material: 'No autonomous material animation; surface treatment remains quiet.',
      procedural: 'No procedural variation; chapter behavior should be deterministic and repeatable.'
    },
    responsivePlan: {
      desktop: 'Use a concise chapter mask/replacement inside the established column structure.',
      mobile: 'Convert multi-column hierarchy changes into short vertical replacement while keeping reading order obvious.',
      touch: 'Keep chapter changes tap-responsive and independent of scroll momentum.'
    },
    reducedMotionEquivalent: 'Use immediate content replacement, focus movement and contrast hierarchy; preserve the same primary-before-support reading order without travel or masking.',
    accessibilityConstraints: ['Never delay body-copy availability for animation.', 'Avoid repeated flashing or rapid large-area replacement.'],
    performanceReasoning: {
      complexityClass: 'low',
      costDrivers: ['small clipping/replacement regions', 'brief ordered text transitions'],
      justification: 'The concept gains character through timing discipline rather than heavy rendering complexity.',
      fallback: 'Instant replacement plus typographic hierarchy preserves nearly all semantic value.'
    },
    antiPatterns: ['No soft cinematic transition between every section.', 'No decorative split-text on body content.', 'No scrolling spectacle.'],
    failureModes: ['Chapter pulses become repetitive mannerism.', 'Sharp replacement feels abrupt when the underlying states should preserve continuity.'],
    uncertainty: 'Some cross-state object relationships may require a small continuity cue inside the otherwise cut-based system.',
    falsifier: 'Reject if users lose spatial/state orientation at chapter boundaries or if the repeated punctuation becomes more noticeable than the content.',
    critique: ['Editorial punctuation is efficient but can become cold if every consequential state is treated as a hard chapter cut.']
  };
}

function materialHypothesis(worldId) {
  const knowledgeRefs = ['interaction-causality', 'perceived-mass-inertia', 'damping-settling', 'elasticity-resistance'];
  return {
    id: 'deep-material-response',
    title: 'Controlled Material Response',
    temporalStrategy: 'material-response',
    projectTruthRefs: ['truth-consequence', 'truth-calm'],
    creativeWorldRefs: [`${worldId}:motionLanguage`, `${worldId}:interactionModel`, `${worldId}:materialLanguage`],
    knowledgeRefs,
    knowledgeContributions: contributions(knowledgeRefs, 'The material direction ties perceptual resistance and settling strictly to direct consequential actions.'),
    synthesisCandidateRefs: [], synthesisContributions: [],
    semanticIntent: 'Give direct consequential actions a restrained sense of pressure, resistance and recovery so commitment is perceptible, while noninteractive content remains structurally quiet.',
    signatureBehavior: 'The acted-on surface compresses locally, commits with short directional displacement, then recovers into a highly damped stable state while surrounding information stays anchored.',
    motionNecessity: {
      moves: true,
      rationale: 'Local motion communicates direct agency and commitment when the user causes a consequential state change.',
      earnedBy: ['A direct press or drag crosses a real commitment threshold.', 'The affected surface changes state and benefits from perceptual resistance/recovery feedback.'],
      stillnessCases: ['Noninteractive evidence remains still during direct manipulation.', 'Background and navigation remain static while local material response occurs.'],
      stillnessRationale: 'Localizing motion to the causal surface preserves calm and prevents physical character from becoming global theatre.'
    },
    attentionSequence: [
      { id: 'focus-contact', focus: 'Directly manipulated surface', reason: 'Immediate local response confirms agency.', next: 'focus-commit' },
      { id: 'focus-commit', focus: 'Commit threshold', reason: 'Resistance resolves into a clear state-changing action.', next: 'focus-recovery' },
      { id: 'focus-recovery', focus: 'Stable committed surface', reason: 'Finite settling confirms completion and returns the interface to inspection.', next: null }
    ],
    temporalComposition: {
      rhythm: 'Short local pressure events interrupt an otherwise still interface.',
      pacing: 'Immediate contact response, compact commitment phase, finite recovery.',
      anticipation: 'Input pressure itself provides anticipation; avoid extra pre-action recoil.',
      holds: 'No artificial pre-commit hold; terminal state holds fully still after recovery.',
      overlap: 'Supporting state indicators may update near the end of recovery, never before commitment is clear.',
      stillness: 'All unrelated surfaces remain static during the local response.',
      easingLanguage: 'Direct pressure response with controlled resistance, then highly damped recovery.',
      energyCurve: 'Immediate local rise, short peak at commitment, rapid controlled decay.'
    },
    motionHierarchy: 'The causal surface owns the motion; adjacent status feedback is secondary; all unrelated content remains motionless.',
    physicalCharacter: {
      mass: 'Compact moderate mass localized to the interacted surface.',
      inertia: 'Very low at first contact to preserve responsiveness; slightly greater during committed displacement.',
      friction: 'Perceptible but restrained resistance before the commitment threshold.',
      elasticity: 'Minimal recoverable compression only where the surface plausibly deforms.',
      damping: 'High damping so recovery is finite and never bouncy.',
      rationale: 'Controlled resistance communicates consequence and agency while fitting the calm, precise Creative World.'
    },
    choreography: {
      spatial: 'Deformation and displacement stay local to the causal surface; no unrelated layers float or orbit.',
      interaction: 'Response begins immediately, tracks valid input, supports interruption before commit and reconciles deterministically after commit.',
      scroll: 'No scroll-linked material response; scrolling should not imply commitment or pressure.',
      depthModel: 'Small local depth/compression cues only; background depth remains fixed.'
    },
    cinematicLanguage: {
      camera: 'Static camera to keep agency attached to the manipulated object.',
      framing: 'No reframing; the interaction surface remains in place.',
      reveal: 'State confirmation appears locally after commitment.',
      continuity: 'The same surface persists through pressure, commitment and recovery.',
      editing: 'No cut during direct manipulation; use one continuous local causal arc.'
    },
    mediaMotion: {
      typography: 'Text stays rigid and legible; labels may update only after state commitment.',
      image: 'Images remain static unless they are the directly manipulated object.',
      material: 'Local compression, subtle light/depth response and finite recovery express the material model.',
      procedural: 'No autonomous procedural noise; material response is deterministic and input/state coupled.'
    },
    responsivePlan: {
      desktop: 'Use local pointer/press response with compact displacement.',
      mobile: 'Reduce displacement further and rely more on compression/contrast so touch targets remain stable.',
      touch: 'Keep response immediate, avoid gesture capture that interferes with scrolling, and support cancellation before commit.'
    },
    reducedMotionEquivalent: 'Replace compression/travel with immediate pressed-state contrast, focus/state label change and a stable committed result; preserve agency and completion without simulated material movement.',
    accessibilityConstraints: ['Keep deformation local rather than large-field.', 'Do not require users to track oscillation or repeated motion to understand completion.'],
    performanceReasoning: {
      complexityClass: 'medium',
      costDrivers: ['localized transform/deformation', 'input-coupled state updates'],
      justification: 'Local material response uniquely communicates direct agency and commitment when kept bounded.',
      fallback: 'Use simple transform/contrast response with immediate terminal-state update if richer deformation is not reliably smooth.'
    },
    antiPatterns: ['No universal bounce.', 'No cursor-follow magnetism unrelated to agency.', 'No global physics spectacle.'],
    failureModes: ['Physical character becomes playful and undermines precision.', 'Resistance is perceived as input lag rather than meaningful commitment feedback.'],
    uncertainty: 'The correct resistance level may vary substantially between frequent routine actions and rare high-consequence approvals.',
    falsifier: 'Reject if users interpret resistance as sluggishness, if cancellation becomes unreliable, or if local material feedback fails to improve commitment clarity.',
    critique: ['Material response is easy to over-style; the causal surface and real commitment threshold must remain the only reasons it exists.']
  };
}

function validHypotheses(worldId) {
  return [continuityHypothesis(worldId), punctuationHypothesis(worldId), materialHypothesis(worldId)];
}

function baseline() {
  const canonical = buildCanonicalMotionAuthorityFixture(PROJECT_ID);
  const knowledge = buildKnowledge(PROJECT_ID);
  const brief = buildBrief({ canonical, knowledge });
  assert.equal(brief.reviewReady, true, brief.findings.map((item) => item.code).join(', '));
  const reasoningSet = buildMotionIntelligenceV2Set({ brief, hypotheses: validHypotheses(brief.creativeWorldId) });
  return { canonical, knowledge, brief, reasoningSet };
}

test('Motion V2 knowledge corpus is qualified Foundation evidence rather than recipes or authority', () => {
  const foundation = buildMotionIntelligenceV2Foundation();
  assert.equal(foundation.reviewReady, true);
  assert.equal(foundation.knowledgeLibrary.entries.length >= 25, true);
  assert.ok(foundation.knowledgeLibrary.entries.every((entry) => entry.kind === 'principle'));
  assert.ok(foundation.knowledgeLibrary.entries.every((entry) => entry.domain === 'motion'));
  assert.ok(foundation.knowledgeLibrary.entries.every((entry) => entry.truth.authorityGranted === false));
  assert.ok(foundation.knowledgeLibrary.entries.every((entry) => entry.failureModes.length && entry.counterexamples.length && entry.diagnostics.length));
});

test('valid Motion Intelligence V2 compiles deep knowledge-grounded hypotheses into existing V1 exploration without creating authority', () => {
  const { reasoningSet } = baseline();
  assert.equal(reasoningSet.reviewReady, true, reasoningSet.findings.map((item) => item.code).join(', '));
  assert.equal(reasoningSet.hypotheses.length, 3);
  assert.equal(reasoningSet.truth.noWinnerOrRecommendationProduced, true);
  assert.equal(reasoningSet.truth.semanticMotionQualityVerified, false);
  assert.equal(reasoningSet.truth.humanMotionSelectionStillRequired, true);
  assert.equal(Object.hasOwn(reasoningSet.brief, 'authorityInputs'), false);

  const review = reviewMotionIntelligenceV2Set(reasoningSet);
  assert.equal(review.reviewReady, true, review.findings.map((item) => item.code).join(', '));
  assert.equal(review.derivedExploration.schema, 'ai-studio-os/motion-creative-exploration@1');
  assert.equal(review.derivedExploration.reviewReady, true);
  assert.equal(review.derivedExploration.selection, null);

  const handoff = buildMotionIntelligenceV2ExplorationHandoff({ reasoningSet });
  assert.equal(handoff.reviewReady, true, handoff.findings.map((item) => item.code).join(', '));
  assert.equal(handoff.status, 'ready-for-existing-motion-v1-temporal-proof');
  assert.equal(handoff.truth.motionDirectionCreated, false);
  assert.equal(handoff.truth.humanMotionSelectionRequired, true);
  const handoffReview = reviewMotionIntelligenceV2ExplorationHandoff(handoff, { reasoningSet });
  assert.equal(handoffReview.reviewReady, true);
});

test('a serialized Motion V2 Brief excludes full provenance sources and supports explicit fresh re-review', () => {
  const { canonical, knowledge, brief } = baseline();
  const serialized = JSON.parse(JSON.stringify(brief));
  assert.equal(Object.hasOwn(serialized, 'authorityInputs'), false);
  assert.equal(serialized.truth.fullProvenanceSourcesExcludedFromArtifact, true);

  const withoutSources = reviewMotionIntelligenceV2Brief(serialized);
  assert.equal(withoutSources.reviewReady, false);

  const withSources = reviewMotionIntelligenceV2Brief(serialized, {
    canonicalCreativeAuthority: canonical,
    knowledge,
    synthesis: null
  });
  assert.equal(withSources.reviewReady, true, withSources.findings.map((item) => item.code).join(', '));
});

test('tampering the Motion Foundation after retrieval invalidates provenance and redacts all Motion V2 knowledge content', () => {
  const canonical = buildCanonicalMotionAuthorityFixture(PROJECT_ID);
  const knowledge = buildKnowledge(PROJECT_ID);
  const tampered = structuredClone(knowledge);
  tampered.foundation.knowledgeLibrary.entries[0].causalRationale = 'FORGED MOTION CAUSALITY';
  tampered.retrieval.reviewReady = true;
  tampered.retrieval.provenanceReady = true;

  const brief = buildBrief({ canonical, knowledge: tampered });
  assert.equal(brief.reviewReady, false);
  assert.deepEqual(brief.knowledgeEvidence, []);
  assert.equal(brief.knowledgeBinding.knowledgeCount, 0);
  assert.ok(brief.findings.some((item) => item.code === 'motion-v2-knowledge-provenance-invalid'));
});

test('a valid retrieval from another project cannot leak evidence or raw provenance sources into the Motion V2 Brief', () => {
  const canonical = buildCanonicalMotionAuthorityFixture(PROJECT_ID);
  const foreignKnowledge = buildKnowledge('foreign-project');
  const brief = buildBrief({ canonical, knowledge: foreignKnowledge, projectId: PROJECT_ID });
  assert.equal(brief.reviewReady, false);
  assert.deepEqual(brief.knowledgeEvidence, []);
  assert.equal(brief.knowledgeBinding.knowledgeCount, 0);
  assert.equal(Object.hasOwn(brief, 'authorityInputs'), false);
  assert.equal(JSON.stringify(brief).includes('foreign-project'), false);
  assert.ok(brief.findings.some((item) => item.code === 'motion-v2-knowledge-project-drift'));
});

test('strategy labels and evidence relabeling cannot manufacture conceptual divergence', () => {
  const canonical = buildCanonicalMotionAuthorityFixture(PROJECT_ID);
  const knowledge = buildKnowledge(PROJECT_ID);
  const brief = buildBrief({ canonical, knowledge });
  const hypotheses = validHypotheses(brief.creativeWorldId);
  const duplicate = structuredClone(hypotheses[0]);
  duplicate.id = 'fake-different-concept';
  duplicate.title = hypotheses[0].title;
  duplicate.temporalStrategy = 'counterpoint';
  duplicate.knowledgeRefs = hypotheses[2].knowledgeRefs;
  duplicate.knowledgeContributions = contributions(duplicate.knowledgeRefs, 'Relabeled evidence must not make the same creative payload divergent.');
  hypotheses[1] = duplicate;

  const reasoningSet = buildMotionIntelligenceV2Set({ brief, hypotheses });
  assert.equal(reasoningSet.reviewReady, false);
  assert.ok(reasoningSet.findings.some((item) => item.code === 'motion-v2-conceptual-hypothesis-duplicate'));
});

test('knowledge contribution accounting must exactly match every claimed knowledge source', () => {
  const { brief } = baseline();
  const hypotheses = validHypotheses(brief.creativeWorldId);
  hypotheses[0].knowledgeContributions = hypotheses[0].knowledgeContributions.slice(0, 2);
  const reasoningSet = buildMotionIntelligenceV2Set({ brief, hypotheses });
  assert.equal(reasoningSet.reviewReady, false);
  assert.ok(reasoningSet.findings.some((item) => item.code === 'motion-v2-knowledge-contribution-set-drift'));
});

test('invalid knowledge refs and fabricated authority fields fail closed', () => {
  const { brief } = baseline();
  const hypotheses = validHypotheses(brief.creativeWorldId);
  hypotheses[0].knowledgeRefs = [...hypotheses[0].knowledgeRefs, 'invented-motion-principle'];
  hypotheses[0].knowledgeContributions = contributions(hypotheses[0].knowledgeRefs, 'Attempted injected evidence.');
  const reasoningSet = buildMotionIntelligenceV2Set({ brief, hypotheses });
  assert.ok(reasoningSet.findings.some((item) => item.code === 'motion-v2-knowledge-ref-invalid'));

  const forged = structuredClone(reasoningSet);
  forged.winner = 'deep-continuity';
  forged.score = 9.9;
  forged.truth.creativeDirectionSelected = true;
  const review = reviewMotionIntelligenceV2Set(forged);
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-v2-set-shape-invalid'));
  assert.ok(review.findings.some((item) => item.code === 'motion-v2-set-truth-drift'));
});

test('implementation technology cannot become the Motion V2 creative concept', () => {
  const { brief } = baseline();
  const hypotheses = validHypotheses(brief.creativeWorldId);
  hypotheses[0].semanticIntent = 'Use WebGL because WebGL makes the experience premium and sophisticated.';
  const reasoningSet = buildMotionIntelligenceV2Set({ brief, hypotheses });
  assert.equal(reasoningSet.reviewReady, false);
  assert.ok(reasoningSet.findings.some((item) => item.code === 'motion-v2-technology-became-concept'));
});

test('missing stillness, mobile/touch reinterpretation or reduced-motion equivalence keeps deep motion reasoning provisional', () => {
  const { brief } = baseline();
  const hypotheses = validHypotheses(brief.creativeWorldId);
  hypotheses[0].motionNecessity.stillnessCases = [];
  hypotheses[1].responsivePlan.mobile = '';
  hypotheses[1].responsivePlan.touch = '';
  hypotheses[2].reducedMotionEquivalent = '';
  const reasoningSet = buildMotionIntelligenceV2Set({ brief, hypotheses });
  assert.equal(reasoningSet.pass, true);
  assert.equal(reasoningSet.reviewReady, false);
  assert.equal(reasoningSet.status, 'provisional');
  assert.ok(reasoningSet.findings.some((item) => item.code === 'motion-v2-motion-necessity-unproven'));
  assert.ok(reasoningSet.findings.some((item) => item.code === 'motion-v2-responsive-reinterpretation-thin'));
  assert.ok(reasoningSet.findings.some((item) => item.code === 'motion-v2-reduced-motion-equivalent-missing'));
});

test('a V2 handoff cannot survive later tampering of its reasoning or Creative World authority', () => {
  const { reasoningSet, canonical, knowledge } = baseline();
  const handoff = buildMotionIntelligenceV2ExplorationHandoff({ reasoningSet });
  assert.equal(handoff.reviewReady, true);

  const tamperedAuthorityInputs = {
    canonicalCreativeAuthority: structuredClone(canonical),
    knowledge,
    synthesis: null
  };
  tamperedAuthorityInputs.canonicalCreativeAuthority.creativeDirection.provisional = true;
  const review = reviewMotionIntelligenceV2ExplorationHandoff(handoff, {
    reasoningSet,
    authorityInputs: tamperedAuthorityInputs
  });
  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-v2-handoff-source-invalid'));
});

test('unverified optional Synthesis evidence is never treated as advisory motion content', () => {
  const canonical = buildCanonicalMotionAuthorityFixture(PROJECT_ID);
  const knowledge = buildKnowledge(PROJECT_ID);
  const fakeSynthesis = {
    candidateArtifact: {
      schema: 'ai-studio-os/creative-synthesis-candidate-set@1',
      stage: 'creative-synthesis-candidate-egress',
      candidates: [{ id: 'forged-synthesis', governingIdea: 'Forged idea' }],
      reviewReady: true
    },
    synthesis: { projectId: PROJECT_ID, reviewReady: true },
    brief: { projectId: PROJECT_ID, reviewReady: true },
    sources: []
  };
  const brief = buildBrief({ canonical, knowledge, synthesis: fakeSynthesis });
  assert.equal(brief.reviewReady, false);
  assert.deepEqual(brief.synthesisCandidates, []);
  assert.ok(brief.findings.some((item) => item.code === 'motion-v2-synthesis-provenance-invalid'));
});
