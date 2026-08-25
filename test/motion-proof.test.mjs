import test from 'node:test';
import assert from 'node:assert/strict';

import { reviewMotionCreativeExploration, selectedMotionDirection } from '../modules/motion-creative-intelligence/runtime.mjs';
import { buildMotionProofPlan, buildMotionProofEvidence } from '../modules/motion-creative-intelligence/proof.mjs';

const HYPOTHESIS_VARIANTS = {
  continuity: {
    interpretation: 'Persistent object continuity bridges related product states while the surrounding composition reforms around one semantic anchor.',
    motionThesis: 'Continuity carries one meaningful object through state changes; stillness frames the handoff before and after it.',
    signatureMotionBehavior: 'A persistent object crosses a threshold while adjacent layers reorganize around it without a camera flourish.',
    temporalRhythm: 'Extended holds surround one concise continuity move and a quiet recovery.',
    spatialBehavior: 'Spatial change follows the persistent object and avoids unrelated depth movement.',
    transitionGrammar: 'Related states preserve object continuity; unrelated chapters cut cleanly.',
    interactionCharacter: 'Interaction feels precise and continuous rather than elastic.',
    easingLanguage: 'Controlled acceleration supports one legible handoff with restrained settling.',
    energyCurve: 'Low baseline energy rises briefly during the continuity event and returns fully to calm.',
    depthModel: 'A shallow plane gives the persistent object just enough separation to survive recomposition.',
    stillnessPolicy: 'Navigation and reading regions remain fixed while the semantic anchor carries the change.',
    reducedMotionInterpretation: 'Keep the same state sequence with direct cuts and object persistence but remove simulated travel.'
  },
  editorial: {
    interpretation: 'Editorial chaptering uses decisive temporal cuts, typographic pacing and silence to mark changes in conceptual hierarchy.',
    motionThesis: 'Chapter rhythm separates ideas with hard cuts, delayed type and long unmoving reading intervals.',
    signatureMotionBehavior: 'A clean chapter cut resets composition, followed by a measured text reveal instead of continuous object travel.',
    temporalRhythm: 'Long silent holds are interrupted by short chapter cuts and staggered editorial reveals.',
    spatialBehavior: 'The composition stays planar; hierarchy changes through replacement and pacing rather than depth.',
    transitionGrammar: 'Conceptual chapters cut; supporting text enters only after the new hierarchy is established.',
    interactionCharacter: 'Controls respond immediately and quietly so editorial pacing remains dominant.',
    easingLanguage: 'Short controlled reveals stop decisively with no ornamental rebound.',
    energyCurve: 'Energy arrives in discrete chapter pulses separated by extended stillness.',
    depthModel: 'Depth remains nearly flat so typography and temporal contrast carry the experience.',
    stillnessPolicy: 'Reading intervals are intentionally motionless until a chapter boundary is crossed.',
    reducedMotionInterpretation: 'Preserve chapter order and hierarchy through cuts and opacity without staged travel.'
  },
  tactile: {
    interpretation: 'Tactile material response makes direct manipulation expose friction, resistance and damped recovery only at contact points.',
    motionThesis: 'Perceived weight emerges during manipulation while resting interface regions stay inert and functional.',
    signatureMotionBehavior: 'A manipulated surface yields slightly under input, then returns with restrained damping and no ambient bounce.',
    temporalRhythm: 'Motion is event-driven: immediate resistance, brief deformation, then a short damped recovery.',
    spatialBehavior: 'Local displacement stays near the touched element instead of moving the entire scene.',
    transitionGrammar: 'State transitions remain direct; physical response is reserved for manipulation moments.',
    interactionCharacter: 'Touch feels weighted and material, with clear resistance and recovery.',
    easingLanguage: 'High damping and low elasticity imply mass without playful spring behavior.',
    energyCurve: 'Energy appears only under direct input and dissipates rapidly after release.',
    depthModel: 'Selective local depth supports contact and compression while the wider interface stays flat.',
    stillnessPolicy: 'Nothing moves autonomously; material response exists only when input or state change earns it.',
    reducedMotionInterpretation: 'Replace deformation and travel with immediate state feedback while preserving cause and hierarchy.'
  }
};

function hypothesis(id, label) {
  const variant = HYPOTHESIS_VARIANTS[id];
  return {
    id,
    title: label,
    interpretation: variant.interpretation,
    creativeWorldRefs: ['world-a:motionIntent', 'world-a:interactionCharacter'],
    language: {
      motionThesis: variant.motionThesis,
      signatureMotionBehavior: variant.signatureMotionBehavior,
      temporalRhythm: variant.temporalRhythm,
      spatialBehavior: variant.spatialBehavior,
      transitionGrammar: variant.transitionGrammar,
      interactionCharacter: variant.interactionCharacter,
      easingLanguage: variant.easingLanguage,
      energyCurve: variant.energyCurve,
      depthModel: variant.depthModel,
      stillnessPolicy: variant.stillnessPolicy,
      reducedMotionInterpretation: variant.reducedMotionInterpretation
    },
    motionMoments: [`${label} primary reveal earns movement.`],
    stillMoments: [`${label} navigation remains still until state changes.`],
    hierarchyConsequences: [`${label} delays secondary information until the primary state resolves.`],
    responsiveConsequences: [`${label} recomposes timing and interaction for touch/mobile.`],
    antiPatterns: ['No gratuitous parallax or decorative cursor effects.'],
    critique: [`${label} risks becoming mannered if its signature behavior repeats without hierarchy.`],
    technicalOptions: [],
    specialistIntent: {}
  };
}

function proofReadyExploration(selection = null) {
  return {
    schema: 'ai-studio-os/motion-creative-exploration@1',
    stage: 'motion-creative-exploration',
    projectId: 'project-a',
    creativeWorldId: 'world-a',
    worldAuthority: { pass: true, authority: { creativeWorldId: 'world-a' } },
    hypotheses: [
      hypothesis('continuity', 'Cinematic Continuity'),
      hypothesis('editorial', 'Editorial Rhythm'),
      hypothesis('tactile', 'Tactile Materiality')
    ],
    selection
  };
}

function renderedFromPlan(plan) {
  return plan.studies.map((study, index) => ({
    studyId: study.id,
    hypothesisId: study.hypothesisId,
    momentId: study.momentId,
    videoRef: `artifact://motion/${study.id}.webm`,
    sourceRef: `source://motion/${study.id}.mjs`,
    timelineRef: `trace://motion/${study.id}.json`,
    sourceSha256: String(index + 1).padStart(64, 'a').slice(-64),
    timelineSha256: String(index + 1).padStart(64, 'b').slice(-64),
    viewport: study.viewport,
    input: study.input,
    durationMs: 1600,
    frameCount: 96,
    browserRendered: true,
    exactSourceRendered: true
  }));
}

test('motion exploration becomes proof-ready before any winner is selected', () => {
  const exploration = proofReadyExploration(null);
  const review = reviewMotionCreativeExploration(exploration);
  assert.equal(review.reviewReady, true);
  assert.equal(review.status, 'ready-for-motion-proof');
  assert.equal(review.truth.proofPrecedesHumanMotionSelection, true);
  assert.equal(selectedMotionDirection(exploration), null);
});

test('motion proof plan covers every hypothesis against every temporal proof moment', () => {
  const plan = buildMotionProofPlan({ exploration: proofReadyExploration() });
  assert.equal(plan.reviewReady, true);
  assert.equal(plan.hypotheses.length, 3);
  assert.ok(plan.moments.some((moment) => moment.viewport === 'mobile'));
  assert.ok(plan.moments.some((moment) => moment.input === 'reduced-motion'));
  assert.equal(plan.studies.length, plan.hypotheses.length * plan.moments.length);
  assert.equal(plan.truth.proofPlanIsNotRenderedEvidence, true);
});

test('complete exact browser temporal evidence becomes ready for Motion Critic but selects no winner', () => {
  const plan = buildMotionProofPlan({ exploration: proofReadyExploration() });
  const evidence = buildMotionProofEvidence({
    plan,
    renderedStudies: renderedFromPlan(plan),
    comparisonRefs: ['artifact://motion/comparison-board.html']
  });
  assert.equal(evidence.reviewReady, true);
  assert.equal(evidence.status, 'ready-for-motion-critic');
  assert.equal(evidence.truth.exactBrowserTemporalEvidence, true);
  assert.equal(evidence.truth.sourceAndTimelineDigestsRequired, true);
  assert.equal(evidence.truth.proofDoesNotSelectWinner, true);
  assert.equal(evidence.truth.humanMotionSelectionConfirmed, false);
  assert.equal(evidence.truth.productionApproved, false);
});

test('proof plan or static-only references cannot masquerade as rendered motion evidence', () => {
  const plan = buildMotionProofPlan({ exploration: proofReadyExploration() });
  const rendered = renderedFromPlan(plan);
  rendered[0] = {
    ...rendered[0],
    videoRef: '',
    captureRef: '',
    durationMs: 0,
    frameCount: 1
  };
  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['artifact://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-temporal-capture-missing'));
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-temporal-metrics-invalid'));
});

test('source and timeline provenance must carry valid SHA-256 digests', () => {
  const plan = buildMotionProofPlan({ exploration: proofReadyExploration() });
  const rendered = renderedFromPlan(plan);
  rendered[0].sourceSha256 = 'claimed';
  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['artifact://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-provenance-digest-missing'));
});

test('one missing hypothesis/moment render keeps the proof blocked', () => {
  const plan = buildMotionProofPlan({ exploration: proofReadyExploration() });
  const rendered = renderedFromPlan(plan).slice(1);
  const evidence = buildMotionProofEvidence({ plan, renderedStudies: rendered, comparisonRefs: ['artifact://motion/compare.html'] });
  assert.equal(evidence.reviewReady, false);
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-render-missing'));
  assert.ok(evidence.findings.some((item) => item.code === 'motion-proof-render-count-mismatch'));
});

test('final direction still requires explicit human selection even after creative proof-readiness', () => {
  const withoutSelection = proofReadyExploration();
  assert.equal(selectedMotionDirection(withoutSelection), null);

  const withSelection = proofReadyExploration({
    hypothesisId: 'editorial',
    humanConfirmed: true,
    rationale: 'Rendered comparison shows the clearest hierarchy and strongest restraint.'
  });
  const direction = selectedMotionDirection(withSelection);
  assert.equal(direction?.hypothesisId, 'editorial');
  assert.equal(direction?.truth.renderedMotionProofStillRequired, true);
});
