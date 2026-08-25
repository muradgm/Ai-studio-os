import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMotionCreativeExploration, selectedMotionDirection } from '../modules/motion-creative-intelligence/runtime.mjs';

const world = { id: 'world-a', reviewReady: true, selected: true, humanSelected: true };

function language(overrides = {}) {
  return {
    motionThesis: 'Stillness establishes control; movement concentrates around moments of product transformation.',
    signatureMotionBehavior: 'Objects persist across thresholds, then release with brief material inertia.',
    temporalRhythm: 'Long holds, short accelerations, deliberate recovery.',
    spatialBehavior: 'Depth changes only when hierarchy changes.',
    transitionGrammar: 'Continuity for related states; hard cuts for conceptual chapter changes.',
    interactionCharacter: 'Precise under navigation, tactile around product interaction.',
    easingLanguage: 'Controlled acceleration with restrained settling; no universal spring.',
    energyCurve: 'Low baseline, concentrated peaks, full return to calm.',
    depthModel: 'Shallow editorial plane with selective foreground crossings.',
    stillnessPolicy: 'Navigation, body copy and utility controls remain still unless state changes require motion.',
    reducedMotionInterpretation: 'Preserve sequencing and hierarchy through cuts, opacity and state changes without simulated camera travel.',
    ...overrides
  };
}

function hypothesis(id, title, interpretation, signature) {
  return {
    id, title, interpretation,
    creativeWorldRefs: ['composition', 'material behavior', 'interaction character'],
    language: language({ signatureMotionBehavior: signature }),
    motionMoments: [`${title} product reveal earns motion`, `${title} route threshold earns transition`],
    stillMoments: ['Primary navigation remains stable', 'Long-form reading remains still'],
    hierarchyConsequences: ['Motion intensity follows semantic importance, never decorative availability.'],
    responsiveConsequences: ['Mobile preserves the rhythm with shorter travel and fewer simultaneous layers.'],
    antiPatterns: ['No decorative motion without world evidence', 'No universal animation recipe'],
    critique: ['Risk: the signature could overpower content; proof must test restraint and legibility.'],
    technicalOptions: ['CSS/WAAPI for utility states', 'GSAP only where sequencing requires orchestration']
  };
}

function strong() {
  return buildMotionCreativeExploration({
    projectId: 'project-a', creativeWorld: world,
    hypotheses: [
      hypothesis('continuity', 'Cinematic Continuity', 'Use persistent spatial continuity to make selected transformations feel consequential.', 'A product object persists between states while the interface around it re-composes.'),
      hypothesis('editorial', 'Editorial Rhythm', 'Use temporal contrast, hard chapter cuts and typographic pacing instead of continuous spectacle.', 'A sharp chapter cut is followed by a measured typographic reveal and long stillness.'),
      hypothesis('tactile', 'Tactile Materiality', 'Let interaction expose weight, friction and recovery only where the world describes physical material behavior.', 'Direct manipulation creates brief resistance, deformation and restrained recovery.')
    ],
    selection: { hypothesisId: 'editorial', humanConfirmed: true, rationale: 'It best preserves the world’s restraint while giving hierarchy a memorable temporal structure.' }
  });
}

test('motion creative exploration requires taste, stillness and human selection before direction', () => {
  const output = strong();
  assert.equal(output.reviewReady, true);
  const direction = selectedMotionDirection(output);
  assert.equal(direction.hypothesisId, 'editorial');
  assert.equal(direction.truth.renderedMotionProofStillRequired, true);
  assert.equal(direction.truth.productionApproved, false);
});

test('technical motion cannot substitute for creative motion language', () => {
  const output = buildMotionCreativeExploration({
    projectId: 'project-a', creativeWorld: world,
    hypotheses: [{ id: 'tech', interpretation: 'Use GSAP and WebGL.', technicalOptions: ['GSAP', 'Three.js'] }],
    selection: { hypothesisId: 'tech', humanConfirmed: true, rationale: 'Technical choice.' }
  });
  assert.equal(output.reviewReady, false);
  assert.ok(output.findings.some((item) => item.code === 'motion-language-motionThesis-missing'));
  assert.equal(selectedMotionDirection(output), null);
});

test('motion direction fails closed when Creative World is not human-selected', () => {
  const output = buildMotionCreativeExploration({ projectId: 'project-a', creativeWorld: { ...world, selected: false }, hypotheses: strong().hypotheses, selection: strong().selection });
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'motion-creative-world-not-authoritative'));
});
