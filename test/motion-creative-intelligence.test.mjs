import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../modules/creative-world/runtime.mjs';
import { buildMotionCreativeExploration, selectedMotionDirection } from '../modules/motion-creative-intelligence/runtime.mjs';

const thesis = {
  schema: 'ai-studio-os/creative-thesis@1',
  projectId: 'project-a',
  reviewReady: true,
  governingIdea: { statement: 'Make product truth the organizing experience.' }
};

function worldCandidate(id, variant = 0) {
  const variants = [
    {
      worldClass: 'editorial-ritual', narrativeModel: 'progressive-reveal', compositionModel: 'asymmetric-editorial-grid',
      imageLanguage: 'material closeups with negative space', motionLanguage: 'measured threshold transitions', interactionModel: 'quiet direct manipulation', responsiveStrategy: 'recompose editorial hierarchy'
    },
    {
      worldClass: 'object-theatre', narrativeModel: 'object-led-sequence', compositionModel: 'central-sculptural-stage',
      imageLanguage: 'isolated objects in controlled depth', motionLanguage: 'persistent object continuity', interactionModel: 'spatial object focus', responsiveStrategy: 'collapse depth into focused object chapters'
    },
    {
      worldClass: 'tactile-system', narrativeModel: 'material-transformation', compositionModel: 'layered-material-field',
      imageLanguage: 'macro texture and process evidence', motionLanguage: 'resistance and restrained recovery', interactionModel: 'tactile threshold feedback', responsiveStrategy: 'reduce simultaneous layers while preserving material rhythm'
    }
  ];
  const v = variants[variant];
  return {
    id,
    label: id,
    worldIdea: `World ${id} turns project truth into ${v.worldClass}.`,
    interpretationOfThesis: `Interpret the thesis through ${v.narrativeModel}.`,
    signatureBehavior: `A signature ${v.motionLanguage} behavior.`,
    ...v,
    typographyIntent: { statement: 'Typography supports the world without becoming the concept.' },
    materialLanguage: variant === 0 ? 'paper and glass' : variant === 1 ? 'light and polished surfaces' : 'textile and soft material layers',
    categoryTransferTest: { whyProjectSpecific: `This world derives from project-a truth through ${v.worldClass}.` },
    antiPatterns: ['generic premium motion', 'technology-led concept']
  };
}

function selectedWorldBundle() {
  const exploration = buildCreativeWorldExploration({
    creativeThesis: thesis,
    authoredWorlds: [worldCandidate('world-a', 0), worldCandidate('world-b', 1), worldCandidate('world-c', 2)]
  });
  assert.equal(exploration.reviewReady, true);
  const selected = selectCreativeWorld(exploration, {
    worldId: 'world-a',
    humanConfirmed: true,
    visualReviewConfirmed: true,
    visualEvidenceRefs: ['world-a-opening.png', 'world-a-core.png'],
    rationale: 'World A best translates the thesis into restrained temporal hierarchy.'
  });
  assert.equal(selected.truth.humanWorldSelectionConfirmed, true);
  return { exploration: selected, world: selected.selectedWorld };
}

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
    creativeWorldRefs: ['motionLanguage', 'compositionModel', 'interactionModel'],
    language: language({ signatureMotionBehavior: signature }),
    motionMoments: [`${title} product reveal earns motion`, `${title} route threshold earns transition`],
    stillMoments: ['Primary navigation remains stable', 'Long-form reading remains still'],
    hierarchyConsequences: ['Motion intensity follows semantic importance, never decorative availability.'],
    responsiveConsequences: ['Mobile preserves the rhythm with shorter travel and fewer simultaneous layers.'],
    antiPatterns: ['No decorative motion without world evidence', 'No universal animation recipe'],
    critique: ['Risk: the signature could overpower content; proof must test restraint and legibility.'],
    technicalOptions: ['CSS/WAAPI for utility states', 'GSAP only where sequencing requires orchestration'],
    specialistIntent: {
      spatialComposition: 'Use depth only to clarify hierarchy changes.',
      cameraBehavior: 'Camera remains mostly fixed; reframing is rare and motivated.',
      physicalBehavior: 'Perceived mass is moderate with high damping and low elasticity.',
      shaderMaterialBehavior: 'Material change should reveal state, not decorate idle moments.',
      spatialNecessity: '2D remains default; spatial treatment must earn itself through hierarchy.'
    }
  };
}

function strong() {
  const bundle = selectedWorldBundle();
  return buildMotionCreativeExploration({
    projectId: 'project-a',
    creativeWorldExploration: bundle.exploration,
    creativeWorld: bundle.world,
    hypotheses: [
      hypothesis('continuity', 'Cinematic Continuity', 'Use persistent spatial continuity to make selected transformations feel consequential.', 'A product object persists between states while the interface around it re-composes.'),
      hypothesis('editorial', 'Editorial Rhythm', 'Use temporal contrast, hard chapter cuts and typographic pacing instead of continuous spectacle.', 'A sharp chapter cut is followed by a measured typographic reveal and long stillness.'),
      hypothesis('tactile', 'Tactile Materiality', 'Let interaction expose weight, friction and recovery only where the world describes physical material behavior.', 'Direct manipulation creates brief resistance, deformation and restrained recovery.')
    ],
    selection: { hypothesisId: 'editorial', humanConfirmed: true, rationale: 'It best preserves the world’s restraint while giving hierarchy a memorable temporal structure.' }
  });
}

test('motion creative exploration requires canonical Creative World authority, taste and stillness while a pre-proof preference remains provisional', () => {
  const output = strong();
  assert.equal(output.worldAuthority.pass, true);
  assert.equal(output.reviewReady, true);
  assert.equal(output.truth.canonicalCreativeWorldAuthorityRecomputed, true);
  const candidate = selectedMotionDirection(output);
  assert.equal(candidate.schema, 'ai-studio-os/motion-direction-candidate@1');
  assert.equal(candidate.hypothesisId, 'editorial');
  assert.equal(candidate.creativeWorldAuthority.creativeWorldId, 'world-a');
  assert.equal(candidate.truth.renderedMotionProofStillRequired, true);
  assert.equal(candidate.truth.motionCriticStillRequired, true);
  assert.equal(candidate.truth.technicalPlanningAuthorized, false);
  assert.equal(candidate.truth.productionApproved, false);
  assert.equal(candidate.truth.spatialTechnologySelected, false);
});

test('technical motion cannot substitute for creative motion language', () => {
  const bundle = selectedWorldBundle();
  const output = buildMotionCreativeExploration({
    projectId: 'project-a', creativeWorldExploration: bundle.exploration, creativeWorld: bundle.world,
    hypotheses: [{ id: 'tech', interpretation: 'Use GSAP and WebGL.', technicalOptions: ['GSAP', 'Three.js'] }],
    selection: { hypothesisId: 'tech', humanConfirmed: true, rationale: 'Technical choice.' }
  });
  assert.equal(output.worldAuthority.pass, true);
  assert.equal(output.reviewReady, false);
  assert.ok(output.findings.some((item) => item.code === 'motion-language-motionThesis-missing'));
  assert.equal(selectedMotionDirection(output), null);
});

test('forged selected/reviewReady flags cannot replace canonical Creative World provenance', () => {
  const fakeWorld = { ...worldCandidate('world-a', 0), schema: 'ai-studio-os/creative-world@1', reviewReady: true, selected: true, truth: { humanCreativeSelectionConfirmed: true, visualWorldProofReviewed: true }, thesisRef: { projectId: 'project-a', governingIdea: thesis.governingIdea.statement } };
  const output = buildMotionCreativeExploration({
    projectId: 'project-a',
    creativeWorld: fakeWorld,
    creativeWorldExploration: { selectedWorld: fakeWorld, truth: { humanWorldSelectionConfirmed: true } },
    hypotheses: strong().hypotheses,
    selection: strong().selection
  });
  assert.equal(output.pass, false);
  assert.equal(output.worldAuthority.pass, false);
  assert.ok(output.findings.some((item) => item.code === 'motion-creative-world-not-authoritative'));
});

test('selected world must remain a member of the reviewed 3-5 world exploration', () => {
  const bundle = selectedWorldBundle();
  const outsider = { ...bundle.world, id: 'outsider', selected: true, truth: { ...bundle.world.truth, humanCreativeSelectionConfirmed: true } };
  const output = buildMotionCreativeExploration({
    projectId: 'project-a', creativeWorldExploration: bundle.exploration, creativeWorld: outsider,
    hypotheses: strong().hypotheses, selection: strong().selection
  });
  assert.equal(output.worldAuthority.pass, false);
  assert.ok(output.worldAuthority.findings.some((item) => item.code === 'motion-world-membership-invalid'));
});
