import { reviewMotionCreativeWorldAuthority } from './world-authority.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function list(value) { return [...new Set((Array.isArray(value) ? value : []).map(text).filter(Boolean))]; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

const REQUIRED_LANGUAGE = [
  'motionThesis', 'signatureMotionBehavior', 'temporalRhythm', 'spatialBehavior',
  'transitionGrammar', 'interactionCharacter', 'easingLanguage', 'energyCurve',
  'depthModel', 'stillnessPolicy', 'reducedMotionInterpretation'
];

const MOTION_WORLD_REF_PATHS = new Set([
  'worldIdea',
  'signatureBehavior',
  'narrativeModel',
  'compositionModel',
  'imageLanguage',
  'materialLanguage',
  'motionLanguage',
  'interactionModel',
  'responsiveStrategy',
  'typographyIntent.statement',
  'categoryTransferTest.whyProjectSpecific'
]);

const TECHNOLOGY_TERMS = /\b(three\.?js|webgl|webgpu|gsap|scrolltrigger|rive|blender|houdini|lottie|waapi|web animations api|css animation|shader implementation|physics engine)\b/i;

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

function canonicalBundleFromInput(input = {}) {
  if (input.canonicalCreativeAuthority && typeof input.canonicalCreativeAuthority === 'object') {
    return { ...input.canonicalCreativeAuthority, projectId: input.projectId ?? input.canonicalCreativeAuthority.projectId };
  }
  const exploration = input.creativeWorldExploration ?? null;
  return {
    projectId: input.projectId ?? input.creativeThesis?.projectId ?? null,
    creativeThesisDeliberation: input.creativeThesisDeliberation ?? null,
    creativeThesis: input.creativeThesis ?? exploration?.creativeThesis ?? null,
    selectedCreativeWorld: input.creativeWorld ?? input.selectedCreativeWorld ?? exploration?.selectedWorld ?? null,
    creativeWorldExploration: exploration,
    styleFrameProof: input.styleFrameProof ?? null,
    visualProofEvidence: input.visualProofEvidence ?? input.styleFrameProofEvidence ?? null,
    creativeDirection: input.creativeDirection ?? null
  };
}

function recomputeWorldAuthority(exploration = {}) {
  const inputs = exploration.authorityInputs && typeof exploration.authorityInputs === 'object' ? exploration.authorityInputs : {};
  return reviewMotionCreativeWorldAuthority({
    projectId: inputs.projectId,
    canonicalCreativeAuthority: inputs.canonicalCreativeAuthority
  });
}

function selectedCreativeWorldFromAuthority(exploration = {}) {
  const canonical = exploration?.authorityInputs?.canonicalCreativeAuthority ?? {};
  return canonical.selectedCreativeWorld ?? canonical.creativeWorldExploration?.selectedWorld ?? null;
}

function valueAtPath(object, path) {
  return path.split('.').reduce((value, key) => value && typeof value === 'object' ? value[key] : undefined, object);
}

function reviewCreativeWorldRefs(refs = [], world = null) {
  const worldId = text(world?.id);
  const validRefs = [];
  const invalidRefs = [];
  for (const ref of refs) {
    const separator = ref.indexOf(':');
    const refWorldId = separator > 0 ? ref.slice(0, separator) : '';
    const path = separator > 0 ? ref.slice(separator + 1) : '';
    const supportedPath = MOTION_WORLD_REF_PATHS.has(path);
    const value = supportedPath ? valueAtPath(world, path) : null;
    const resolves = Boolean(worldId)
      && refWorldId === worldId
      && supportedPath
      && (typeof value === 'string' ? Boolean(text(value)) : value != null);
    if (resolves) validRefs.push(ref);
    else invalidRefs.push(ref);
  }
  return { validRefs, invalidRefs };
}

function conceptualMotionText(hypothesis = {}) {
  return [
    hypothesis.interpretation,
    ...REQUIRED_LANGUAGE.map((key) => hypothesis.language?.[key]),
    ...(hypothesis.motionMoments ?? []),
    ...(hypothesis.stillMoments ?? []),
    ...(hypothesis.hierarchyConsequences ?? []),
    ...(hypothesis.responsiveConsequences ?? [])
  ].map(text).filter(Boolean).join(' ');
}

export function reviewMotionCreativeExploration(exploration = {}) {
  const findings = [];
  const hypotheses = (Array.isArray(exploration.hypotheses) ? exploration.hypotheses : []).map(normalizeHypothesis);
  const projectId = text(exploration.projectId);
  const worldId = text(exploration.creativeWorldId);
  const worldAuthority = recomputeWorldAuthority(exploration);
  const selectedWorld = selectedCreativeWorldFromAuthority(exploration);

  if (!projectId) findings.push(finding('blocker', 'motion-creative-project-binding-missing', 'Motion exploration must be bound to a project identity.'));
  if (!worldId) findings.push(finding('blocker', 'motion-creative-world-binding-missing', 'Motion exploration must be bound to a selected Creative World.'));
  if (worldAuthority.pass !== true) {
    findings.push(finding('blocker', 'motion-creative-world-not-authoritative', 'Motion may interpret only a Creative World that remains canonical when the full creative authority handoff is re-reviewed at the Motion boundary.', {
      authorityFindingCodes: worldAuthority.findings.map((item) => item.code),
      canonicalFindingCodes: worldAuthority.canonicalHandoff?.findings?.map((item) => item.code) ?? []
    }));
  }
  if (worldAuthority.pass === true && worldAuthority.authority?.projectId !== projectId) {
    findings.push(finding('blocker', 'motion-creative-project-authority-drift', 'Motion exploration project identity drifted from recomputed canonical Creative World authority.', {
      explorationProjectId: projectId || null,
      authorityProjectId: worldAuthority.authority?.projectId ?? null
    }));
  }
  if (worldAuthority.pass === true && worldAuthority.authority?.creativeWorldId !== worldId) {
    findings.push(finding('blocker', 'motion-creative-world-authority-drift', 'Motion exploration Creative World identity drifted from recomputed canonical authority.', {
      explorationWorldId: worldId || null,
      authorityWorldId: worldAuthority.authority?.creativeWorldId ?? null
    }));
  }
  if (hypotheses.length < 3) findings.push(finding('major', 'motion-creative-divergence-thin', 'Explore at least three materially different motion interpretations before convergence.', { count: hypotheses.length }));
  const hypothesisIds = hypotheses.map((item) => item.id);
  if (new Set(hypothesisIds).size !== hypotheses.length) findings.push(finding('blocker', 'motion-hypothesis-id-duplicate', 'Motion hypotheses require unique IDs so proof, Critic evidence and human selection cannot become ambiguous.', { hypothesisIds }));

  hypotheses.forEach((hypothesis, index) => {
    if (!hypothesis.interpretation) findings.push(finding('major', 'motion-interpretation-missing', 'Each motion hypothesis needs a creative interpretation, not only implementation notes.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.creativeWorldRefs.length) {
      findings.push(finding('major', 'motion-world-evidence-missing', 'Each motion hypothesis must cite Creative World decisions it interprets.', { hypothesisId: hypothesis.id }));
    } else {
      const refReview = reviewCreativeWorldRefs(hypothesis.creativeWorldRefs, selectedWorld);
      if (refReview.invalidRefs.length) findings.push(finding('blocker', 'motion-world-evidence-ref-invalid', 'Motion hypothesis Creative World references must resolve to supported decisions on the exact selected Creative World.', { hypothesisId: hypothesis.id, invalidRefs: refReview.invalidRefs, creativeWorldId: worldId || null }));
      if (refReview.validRefs.length < 2) findings.push(finding('major', 'motion-world-evidence-thin', 'A serious motion hypothesis should ground itself in at least two distinct selected Creative World decisions.', { hypothesisId: hypothesis.id, validRefs: refReview.validRefs }));
    }
    for (const key of REQUIRED_LANGUAGE) {
      if (!hypothesis.language[key]) findings.push(finding('major', `motion-language-${key}-missing`, `Motion hypothesis is missing ${key}.`, { hypothesisId: hypothesis.id }));
    }
    if (!hypothesis.motionMoments.length || !hypothesis.stillMoments.length) findings.push(finding('major', 'motion-stillness-balance-unproven', 'Each hypothesis must say both what earns movement and what deliberately remains still.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.hierarchyConsequences.length) findings.push(finding('major', 'motion-hierarchy-unproven', 'Motion must state how it supports information hierarchy.', { hypothesisId: hypothesis.id }));
    if (!hypothesis.responsiveConsequences.length) findings.push(finding('major', 'motion-responsive-interpretation-missing', 'Motion must reinterpret across viewport/input constraints rather than merely scale down.', { hypothesisId: hypothesis.id }));
    if (hypothesis.antiPatterns.length < 2) findings.push(finding('major', 'motion-anti-patterns-thin', 'Each motion hypothesis needs at least two explicit rejection rules so taste includes what the system refuses to animate.', { hypothesisId: hypothesis.id, count: hypothesis.antiPatterns.length }));
    if (!hypothesis.critique.length) findings.push(finding('major', 'motion-hypothesis-uncriticized', 'Each hypothesis requires adversarial creative critique.', { hypothesisId: hypothesis.id }));
    const creativeText = conceptualMotionText(hypothesis);
    if (TECHNOLOGY_TERMS.test(creativeText)) findings.push(finding('blocker', 'motion-technology-became-concept', 'Motion creative language may describe behavior and perceptual character, but implementation technology cannot become the concept or creative justification.', { hypothesisId: hypothesis.id }));
    if (GENERIC_PATTERNS.some((pattern) => pattern.test(creativeText))) findings.push(finding('major', 'motion-generic-premium-pattern', 'Motion hypothesis relies on a generic premium-web pattern without project-specific justification.', { hypothesisId: hypothesis.id }));
    for (let j = index + 1; j < hypotheses.length; j += 1) {
      const score = overlap(hypothesis, hypotheses[j]);
      if (score > 0.72) findings.push(finding('major', 'motion-hypotheses-too-similar', 'Motion hypotheses are variants rather than genuinely different interpretations.', { left: hypothesis.id, right: hypotheses[j].id, overlap: score }));
    }
  });

  const preferenceSupplied = exploration.selection && typeof exploration.selection === 'object';
  if (preferenceSupplied) {
    const selectedId = text(exploration.selection?.hypothesisId);
    const selected = hypotheses.find((item) => item.id === selectedId);
    if (!selected) findings.push(finding('blocker', 'motion-preference-invalid', 'A supplied motion preference must reference a hypothesis in the current exploration.', { hypothesisId: selectedId || null }));
    if (selected && exploration.selection?.humanConfirmed !== true) findings.push(finding('blocker', 'motion-human-preference-missing', 'A supplied motion preference requires explicit human confirmation.'));
    if (selected && !text(exploration.selection?.rationale)) findings.push(finding('major', 'motion-preference-rationale-missing', 'A supplied motion preference requires comparative rationale.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/motion-creative-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-motion-proof',
    findings,
    worldAuthority,
    normalizedHypotheses: hypotheses,
    truth: {
      technicalFeasibilityIsNotCreativeApproval: true,
      renderedMotionProofRequired: true,
      canonicalCreativeWorldAuthorityRequired: true,
      projectAuthorityBindingRequired: true,
      fullCanonicalCreativeHandoffRecomputed: true,
      creativeWorldRefsResolved: blockers.every((item) => item.code !== 'motion-world-evidence-ref-invalid'),
      duplicateHypothesisIdsRejected: true,
      technologyCannotBecomeMotionConcept: true,
      rejectionRulesRequired: true,
      shallowWorldAuthorityFlagsAccepted: false,
      proofPrecedesAuthoritativeHumanMotionSelection: true,
      humanMotionSelectionRequiredAfterCritic: true
    }
  };
}

export function buildMotionCreativeExploration(input = {}) {
  const canonicalCreativeAuthority = canonicalBundleFromInput(input);
  const authoritativeWorld = canonicalCreativeAuthority.selectedCreativeWorld ?? canonicalCreativeAuthority.creativeWorldExploration?.selectedWorld ?? null;
  const exploration = {
    schema: 'ai-studio-os/motion-creative-exploration@1',
    stage: 'motion-creative-exploration',
    projectId: text(input.projectId ?? canonicalCreativeAuthority.projectId) || null,
    creativeWorldId: text(authoritativeWorld?.id) || null,
    authorityInputs: {
      projectId: text(input.projectId ?? canonicalCreativeAuthority.projectId) || null,
      canonicalCreativeAuthority
    },
    creativeWorldExplorationRef: canonicalCreativeAuthority.creativeWorldExploration ? {
      schema: canonicalCreativeAuthority.creativeWorldExploration.schema ?? null,
      selectedWorldId: canonicalCreativeAuthority.creativeWorldExploration.selectedWorld?.id ?? null,
      candidateWorldIds: (canonicalCreativeAuthority.creativeWorldExploration.worlds ?? []).map((world) => world.id)
    } : null,
    hypotheses: (Array.isArray(input.hypotheses) ? input.hypotheses : []).map(normalizeHypothesis),
    selection: input.selection && typeof input.selection === 'object' ? {
      hypothesisId: text(input.selection.hypothesisId),
      humanConfirmed: input.selection.humanConfirmed === true,
      rationale: text(input.selection.rationale)
    } : null,
    truth: {
      followsCreativeWorld: true,
      mayInterpretButNotOverrideCreativeWorld: true,
      motionTasteRequiresRenderedProof: true,
      humanMotionSelectionRequired: true,
      proofPrecedesAuthoritativeHumanMotionSelection: true,
      fullCanonicalCreativeHandoffRequired: true,
      shallowCreativeWorldFlagsAccepted: false
    }
  };
  const review = reviewMotionCreativeExploration(exploration);
  return {
    ...exploration,
    findings: review.findings,
    pass: review.pass,
    reviewReady: review.reviewReady,
    status: review.status,
    hypotheses: review.normalizedHypotheses,
    normalizedHypotheses: review.normalizedHypotheses,
    worldAuthority: review.worldAuthority,
    truth: {
      ...(exploration.truth ?? {}),
      ...(review.truth ?? {})
    }
  };
}

export function selectedMotionDirection(exploration = {}) {
  const review = reviewMotionCreativeExploration(exploration);
  if (!review.reviewReady) return null;
  if (!exploration.selection || exploration.selection.humanConfirmed !== true || !text(exploration.selection.rationale)) return null;
  const selected = review.normalizedHypotheses.find((item) => item.id === exploration.selection?.hypothesisId);
  if (!selected) return null;
  const specialistIntent = normalizeSpecialistIntent(selected.specialistIntent);
  return {
    schema: 'ai-studio-os/motion-direction-candidate@1',
    status: 'preference-recorded-awaiting-proof-and-critic',
    projectId: exploration.projectId,
    creativeWorldId: exploration.creativeWorldId,
    creativeWorldAuthority: review.worldAuthority.authority ?? null,
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
      cameraCreativeIntent: specialistIntent.cameraBehavior ? { cameraBehavior: specialistIntent.cameraBehavior, authority: 'creative-intent-only' } : null,
      physicalBehaviorIntent: specialistIntent.physicalBehavior ? { physicalBehavior: specialistIntent.physicalBehavior, authority: 'perceptual-behavior-only' } : null,
      shaderMaterialIntent: specialistIntent.shaderMaterialBehavior ? { shaderMaterialBehavior: specialistIntent.shaderMaterialBehavior, authority: 'creative-material-intent-only' } : null,
      implementationNotes: specialistIntent.implementationNotes
    },
    truth: {
      humanCreativePreferenceRecorded: true,
      renderedMotionProofStillRequired: true,
      motionCriticStillRequired: true,
      technicalPlanningAuthorized: false,
      productionApproved: false,
      fullCanonicalCreativeHandoffRecomputed: true,
      spatialTechnologySelected: false,
      physicsEngineSelected: false,
      shaderImplementationSelected: false,
      blenderPipelineSelected: false,
      specialistHandoffsAreCreativeIntentOnly: true
    }
  };
}

export { MOTION_WORLD_REF_PATHS as motionCreativeWorldRefPaths };