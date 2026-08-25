import test from 'node:test';
import assert from 'node:assert/strict';

import { reviewMotionCreativeExploration, selectedMotionDirection } from '../modules/motion-creative-intelligence/runtime.mjs';
import { buildMotionProofPlan, buildMotionProofEvidence } from '../modules/motion-creative-intelligence/proof.mjs';

function hypothesis(id, label) {
  return {
    id,
    title: label,
    interpretation: `${label} interprets the selected Creative World through a distinct temporal structure.`,
    creativeWorldRefs: ['world-a:motionIntent', 'world-a:interactionCharacter'],
    language: {
      motionThesis: `${label} motion thesis`,
      signatureMotionBehavior: `${label} signature behavior`,
      temporalRhythm: `${label} temporal rhythm`,
      spatialBehavior: `${label} spatial behavior`,
      transitionGrammar: `${label} transition grammar`,
      interactionCharacter: `${label} interaction character`,
      easingLanguage: `${label} easing language`,
      energyCurve: `${label} energy curve`,
      depthModel: `${label} depth model`,
      stillnessPolicy: `${label} deliberate stillness policy`,
      reducedMotionInterpretation: `${label} preserves hierarchy with reduced travel and no decorative deformation.`
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
  return plan.studies.map((study) => ({
    studyId: study.id,
    hypothesisId: study.hypothesisId,
    momentId: study.momentId,
    videoRef: `artifact://motion/${study.id}.webm`,
    sourceRef: `source://motion/${study.id}.mjs`,
    timelineRef: `trace://motion/${study.id}.json`,
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
