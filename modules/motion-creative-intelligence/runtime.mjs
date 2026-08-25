import { reviewMotionCreativeWorldAuthority } from './world-authority.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

const REQUIRED_LANGUAGE = [
  'motionThesis', 'signatureMotionBehavior', 'temporalRhythm', 'spatialBehavior',
  'transitionGrammar', 'interactionCharacter', 'easingLanguage', 'energyCurve',
  'depthModel', 'stillnessPolicy', 'reducedMotionInterpretation'
];

const GENERIC_PATTERNS = [
  /fade[- ]?up every/i,
  /parallax everywhere/i,
  /cursor blob/i,
  /magnetic button/i,
  /split text.*every/i,
  /webgl.*because/i,
  /floating 3d.*unrelated/i,
  /smooth scroll.*premium/i
];

function normalizeSpecialistIntent(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    spatialComposition: text(source.spatialComposition),
    cameraBehavior: text(source.cameraBehavior),
    physicalBehavior: text(source.physicalBehavior),
    shaderMaterialBehavior: text(source.shaderMaterialBehavior),
    spatialNecessity: text(source.spatialNecessity),
    implementationNotes: list(source.implementationNotes)
  };
}

function normalizeHypothesis(candidate = {}, index = 0) {
  const language = candidate.language && typeof candidate.language === 'object' ? candidate.language : {};
  return {
    id: text(candidate.id) || `motion-hypothesis-${index + 1}`,
    title: text(candidate.title),
    interpretation: text(candidate.interpretation),
    creativeWorldRefs: list(candidate.creativeWorldRefs),
    language: Object.fromEntries(REQUIRED_LANGUAGE.map((key) => [key, text(language[key])])),
    motionMoments: list(candidate.motionMoments),
    stillMoments: list(candidate.stillMoments),
    hierarchyConsequences: list(candidate.hierarchyConsequences),
    responsiveConsequences: list(candidate.responsiveConsequences),
    antiPatterns: list(candidate.antiPatterns),
    critique: list(candidate.critique),
    technicalOptions: list(candidate.technicalOptions),
    specialistIntent: normalizeSpecialistIntent(candidate.specialistIntent)
  };
}

function tokenSet(value) {
  return new Set(text(value).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
}

function overlap(a, b) {
  const left = tokenSet(`${a.interpretation} ${a.language.motionThesis} ${a.language.signatureMotionBehavior}`);
  const right = tokenSet(`${b.interpretation} ${b.language.motionThesis} ${b.language.signatureMotionBehavior}`);
  if (!left.size || !right.size) return 0;
  return [...left].filter((token) => right.has(token)).length / Math.min(left.size, right.size);
}

export function reviewMotionCreativeExploration(exploration = {}) {
  const findings = [];
  const hypotheses = Array.isArray(exploration.hypotheses) ? exploration.hypotheses : [];
  const worldId = text(exploration.creativeWorldId);

  if (!worldId) findings.push(finding('blocker', 'motion-creative-world-binding-missing', 'Motion exploration must be bound to a selected Creative World.'));
  if (exploration.worldAuthority?.pass !== true) {
    findings.push(finding('blocker', 'motion-creative-world-not-authoritative', 'Motion may interpret only a Creative World that remains canonical when authority is re-reviewed at the Motion boundary.', {
      authorityFindingCodes: exploration.worldAuthority?.findings?.map((item) => item.code) ?? []
    }));
  }
  if (hypotheses.length < 3) findings.push(finding('major', 'motion-creative-divergence-thin', 'Explore at least three materially different motion interpretations before selection.', { count: hypotheses.length }));

  hypotheses.forEach((hypothesis, index) => {
    if (!hypothesis.interpretation) findings.push(finding('major', 'motion-interpretation-missing', 'Each motion hypothesis needs a creative interpretation, not only implementation notes.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.creativeWorldRefs.length) findings.push(finding('major', 'motion-world-evidence-missing', 'Each motion hypothesis must cite Creative World decisions it interprets.', { hypothesisId: hypothesis.id }));
    for (const key of REQUIRED_LANGUAGE) {
      if (!hypothesis.language[key]) findings.push(finding('major', `motion-language-${key}-missing`, `Motion hypothesis is missing ${key}.`, { hypothesisId: hypothesis.id }));
    }
    if (!hypothesis.motionMoments.length || !hypothesis.stillMoments.length) findings.push(finding('major', 'motion-stillness-balance-unproven', 'Each hypothesis must say both what earns movement and what deliberately remains still.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.hierarchyConsequences.length) findings.push(finding('major', 'motion-hierarchy-unproven', 'Motion must state how it supports information hierarchy.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.responsiveConsequences.length) findings.push(finding('major', 'motion-responsive-interpretation-missing', 'Motion must reinterpret across viewport/input constraints rather than merely scale down.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.critique.length) findings.push(finding('major', 'motion-hypothesis-uncriticized', 'Each hypothesis requires adversarial creative critique.', { hypothesisId: hypothesis.id }));
    const genericText = `${hypothesis.interpretation} ${Object.values(hypothesis.language).join(' ')} ${hypothesis.motionMoments.join(' ')}`;
    if (GENERIC_PATTERNS.some((pattern) => pattern.test(genericText))) findings.push(finding('major', 'motion-generic-premium-pattern', 'Motion hypothesis relies on a generic premium-web pattern without project-specific justification.', { hypothesisId: hypothesis.id }));
    for (let j = index + 1; j < hypotheses.length; j += 1) {
      const score = overlap(hypothesis, hypotheses[j]);
      if (score > 0.72) findings.push(finding('major', 'motion-hypotheses-too-similar', 'Motion hypotheses are variants rather than genuinely different interpretations.', { left: hypothesis.id, right: hypotheses[j].id, overlap: score }));
    }
  });

  const selectedId = text(exploration.selection?.hypothesisId);
  const selected = hypotheses.find((item) => item.id === selectedId);
  if (!selected) findings.push(finding('blocker', 'motion-selection-missing', 'Motion exploration requires an explicit selected hypothesis before it can become direction.'));
  if (selected && exploration.selection?.humanConfirmed !== true) findings.push(finding('blocker', 'motion-human-selection-missing', 'Motion creative direction requires explicit human selection.'));
  if (selected && !text(exploration.selection?.rationale)) findings.push(finding('major', 'motion-selection-rationale-missing', 'Selected motion hypothesis requires comparative rationale.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/motion-creative-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-motion-proof',
    findings,
    truth: {
      technicalFeasibilityIsNotCreativeApproval: true,
      renderedMotionProofRequired: true,
      canonicalCreativeWorldAuthorityRequired: true
    }
  };
}

export function buildMotionCreativeExploration({ projectId, creativeWorldExploration, creativeWorld, hypotheses = [], selection = null } = {}) {
  const worldAuthority = reviewMotionCreativeWorldAuthority({ projectId, creativeWorldExploration, creativeWorld });
  const authoritativeWorld = worldAuthority.pass === true
    ? (creativeWorld ?? creativeWorldExploration?.selectedWorld ?? null)
    : (creativeWorld ?? creativeWorldExploration?.selectedWorld ?? null);
  const exploration = {
    schema: 'ai-studio-os/motion-creative-exploration@1',
    stage: 'motion-creative-exploration',
    projectId: text(projectId) || null,
    creativeWorldId: text(authoritativeWorld?.id) || null,
    creativeWorldExplorationRef: creativeWorldExploration ? {
      schema: creativeWorldExploration.schema ?? null,
      selectedWorldId: creativeWorldExploration.selectedWorld?.id ?? null,
      candidateWorldIds: (creativeWorldExploration.worlds ?? []).map((world) => world.id)
    } : null,
    worldAuthority,
    hypotheses: (Array.isArray(hypotheses) ? hypotheses : []).map(normalizeHypothesis),
    selection: selection && typeof selection === 'object' ? {
      hypothesisId: text(selection.hypothesisId),
      humanConfirmed: selection.humanConfirmed === true,
      rationale: text(selection.rationale)
    } : null,
    truth: {
      followsCreativeWorld: true,
      mayInterpretButNotOverrideCreativeWorld: true,
      motionTasteRequiresRenderedProof: true,
      humanMotionSelectionRequired: true,
      canonicalCreativeWorldAuthorityRecomputed: true,
      shallowCreativeWorldFlagsAccepted: false
    }
  };
  const review = reviewMotionCreativeExploration(exploration);
  return { ...exploration, ...review };
}

export function selectedMotionDirection(exploration = {}) {
  const review = reviewMotionCreativeExploration(exploration);
  if (!review.reviewReady) return null;
  const selected = exploration.hypotheses.find((item) => item.id === exploration.selection?.hypothesisId);
  const specialistIntent = normalizeSpecialistIntent(selected.specialistIntent);
  return {
    schema: 'ai-studio-os/motion-direction@1',
    projectId: exploration.projectId,
    creativeWorldId: exploration.creativeWorldId,
    creativeWorldAuthority: exploration.worldAuthority?.authority ?? null,
    hypothesisId: selected.id,
    title: selected.title,
    interpretation: selected.interpretation,
    language: selected.language,
    motionMoments: selected.motionMoments,
    stillMoments: selected.stillMoments,
    hierarchyConsequences: selected.hierarchyConsequences,
    responsiveConsequences: selected.responsiveConsequences,
    antiPatterns: selected.antiPatterns,
    technicalOptions: selected.technicalOptions,
    specialistHandoffs: {
      spatialCreativeIntent: specialistIntent.spatialComposition || specialistIntent.spatialNecessity ? {
        spatialComposition: specialistIntent.spatialComposition || selected.language.spatialBehavior,
        spatialNecessity: specialistIntent.spatialNecessity || 'Motion direction requests spatial interpretation only where it strengthens the selected Creative World.',
        authority: 'creative-intent-only'
      } : null,
      cameraCreativeIntent: specialistIntent.cameraBehavior ? {
        cameraBehavior: specialistIntent.cameraBehavior,
        authority: 'creative-intent-only'
      } : null,
      physicalBehaviorIntent: specialistIntent.physicalBehavior ? {
        physicalBehavior: specialistIntent.physicalBehavior,
        authority: 'perceptual-behavior-only'
      } : null,
      shaderMaterialIntent: specialistIntent.shaderMaterialBehavior ? {
        shaderMaterialBehavior: specialistIntent.shaderMaterialBehavior,
        authority: 'creative-material-intent-only'
      } : null,
      implementationNotes: specialistIntent.implementationNotes
    },
    truth: {
      creativeDirectionSelectedByHuman: true,
      renderedMotionProofStillRequired: true,
      productionApproved: false,
      creativeWorldAuthorityRecomputed: true,
      spatialTechnologySelected: false,
      physicsEngineSelected: false,
      shaderImplementationSelected: false,
      blenderPipelineSelected: false,
      specialistHandoffsAreCreativeIntentOnly: true
    }
  };
}
