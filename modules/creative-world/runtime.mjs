function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) : {};
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

const STRUCTURAL_FIELDS = [
  'worldClass',
  'narrativeModel',
  'compositionModel',
  'imageLanguage',
  'motionLanguage',
  'interactionModel',
  'responsiveStrategy'
];

const TECHNOLOGY_TERMS = /\b(three\.?js|webgl|webgpu|gsap|scrolltrigger|rive|blender|houdini|shader|shaders|generative ai|midjourney|comfyui)\b/i;

function normalizeTypographyIntent(value = {}) {
  const input = objectOrEmpty(value);
  return {
    statement: clean(input.statement) || null,
    roles: objectOrEmpty(input.roles),
    preferredCategories: objectOrEmpty(input.preferredCategories),
    avoidCategories: cleanList(input.avoidCategories),
    descriptorTargets: objectOrEmpty(input.descriptorTargets),
    pressures: objectOrEmpty(input.pressures),
    antiPatterns: cleanList(input.antiPatterns ?? input.avoid)
  };
}

function normalizeTransferTest(value = {}) {
  const input = objectOrEmpty(value);
  return {
    whyProjectSpecific: clean(input.whyProjectSpecific ?? input.projectSpecificity) || null,
    transferRisk: clean(input.transferRisk ?? input.risk) || null
  };
}

function normalizeWorld(candidate = {}, thesis = null, index = 0) {
  const id = clean(candidate.id) || `world-${index + 1}`;
  return {
    schema: 'ai-studio-os/creative-world@1',
    id,
    label: clean(candidate.label) || `Creative World ${index + 1}`,
    worldIdea: clean(candidate.worldIdea ?? candidate.idea),
    interpretationOfThesis: clean(candidate.interpretationOfThesis ?? candidate.thesisInterpretation),
    signatureBehavior: clean(candidate.signatureBehavior ?? candidate.signatureMechanic),
    worldClass: clean(candidate.worldClass),
    narrativeModel: clean(candidate.narrativeModel),
    compositionModel: clean(candidate.compositionModel),
    typographyIntent: normalizeTypographyIntent(candidate.typographyIntent ?? candidate.typography),
    imageLanguage: clean(candidate.imageLanguage),
    materialLanguage: clean(candidate.materialLanguage),
    motionLanguage: clean(candidate.motionLanguage),
    interactionModel: clean(candidate.interactionModel),
    responsiveStrategy: clean(candidate.responsiveStrategy),
    soundPolicy: clean(candidate.soundPolicy) || 'Sound is optional and must be justified by the world; silence is valid.',
    categoryTransferTest: normalizeTransferTest(candidate.categoryTransferTest),
    antiPatterns: cleanList(candidate.antiPatterns ?? candidate.rejections),
    thesisRef: {
      schema: thesis?.schema ?? null,
      projectId: thesis?.projectId ?? null,
      governingIdea: thesis?.governingIdea?.statement ?? null
    },
    unresolvedRisks: cleanList(candidate.unresolvedRisks),
    reviewReady: false,
    selected: false,
    truth: {
      humanCreativeSelectionConfirmed: false,
      visualWorldProofReviewed: false,
      styleFrameReviewComplete: false,
      typographyApproved: false,
      productionTechnologyApproved: false
    }
  };
}

function canonicalDimension(value) {
  return clean(value).toLowerCase().replace(/\s+/g, ' ');
}

function pairDivergence(a, b) {
  const differences = [];
  const matches = [];
  for (const field of STRUCTURAL_FIELDS) {
    const av = canonicalDimension(a[field]);
    const bv = canonicalDimension(b[field]);
    if (av && bv && av !== bv) differences.push(field);
    else matches.push(field);
  }
  return {
    a: a.id,
    b: b.id,
    differenceCount: differences.length,
    differences,
    matches,
    heuristicPass: differences.length >= 4,
    pass: differences.length >= 4,
    proofLevel: 'structural-heuristic',
    humanSemanticDivergenceReviewed: false,
    limitation: 'String-distinct authored structural fields can detect obvious reskins, but they do not prove that two worlds are creatively or semantically different.'
  };
}

function reviewWorld(world, thesis) {
  const findings = [];
  if (!world.id) findings.push(finding('blocker', 'creative-world-id-missing', 'Creative World requires an id.'));
  if (!world.worldIdea) findings.push(finding('blocker', 'creative-world-idea-missing', 'Creative World requires one governing world idea.'));
  if (!world.interpretationOfThesis) findings.push(finding('major', 'creative-world-thesis-interpretation-missing', 'Creative World must state how it interprets the reviewed Creative Thesis without changing it.'));
  if (!world.signatureBehavior) findings.push(finding('major', 'creative-world-signature-behavior-missing', 'Creative World requires one authored experience behavior that can survive beyond a single layout or effect.'));

  for (const field of STRUCTURAL_FIELDS) {
    if (!clean(world[field])) findings.push(finding('major', 'creative-world-structural-dimension-missing', `Creative World is missing ${field}.`, { field, worldId: world.id }));
  }

  if (!clean(world.materialLanguage)) findings.push(finding('major', 'creative-world-material-language-missing', 'Creative World requires an authored material/surface language.'));
  if (!clean(world.typographyIntent?.statement)) findings.push(finding('major', 'creative-world-typography-intent-missing', 'Creative World must define typography intent without prematurely freezing a family.'));
  if (!clean(world.categoryTransferTest?.whyProjectSpecific)) findings.push(finding('major', 'creative-world-project-specificity-missing', 'Creative World must explain why its logic belongs to this project rather than the category generally.'));
  if (world.antiPatterns.length < 2) findings.push(finding('major', 'creative-world-anti-patterns-thin', 'Creative World needs at least two explicit anti-patterns or rejection rules.'));

  const technologyText = [world.worldIdea, world.interpretationOfThesis, world.signatureBehavior, world.worldClass, world.narrativeModel, world.compositionModel].join(' ');
  if (TECHNOLOGY_TERMS.test(technologyText)) {
    findings.push(finding('blocker', 'creative-world-technology-became-concept', 'Creative World may require technology later, but implementation technology cannot be the world idea or primary differentiator.', { worldId: world.id }));
  }

  const thesisIdea = clean(thesis?.governingIdea?.statement);
  const worldThesisIdea = clean(world.thesisRef?.governingIdea);
  if (thesisIdea && worldThesisIdea && thesisIdea !== worldThesisIdea) {
    findings.push(finding('blocker', 'creative-world-thesis-drift', 'Creative World changed the governing Creative Thesis instead of interpreting it.', { worldId: world.id }));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return { ...world, reviewReady: blockers.length === 0 && majors.length === 0, findings };
}

export function reviewCreativeWorldExploration(exploration = {}) {
  const findings = [];
  const thesis = exploration.creativeThesis ?? null;
  const worlds = Array.isArray(exploration.worlds) ? exploration.worlds : [];

  if (!thesis || thesis.schema !== 'ai-studio-os/creative-thesis@1') {
    findings.push(finding('blocker', 'creative-world-thesis-missing-or-unsupported', 'Creative World Exploration requires a supported Creative Thesis.'));
  } else if (thesis.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-world-thesis-not-review-ready', 'Creative World Exploration may not become review-ready before Creative Thesis is structurally review-ready.', { thesisStatus: thesis.status ?? null }));
  }

  if (worlds.length && (worlds.length < 3 || worlds.length > 5)) findings.push(finding('major', 'creative-world-candidate-count-invalid', 'Creative World Exploration requires 3–5 authored worlds.', { count: worlds.length }));
  if (!worlds.length) findings.push(finding('major', 'creative-world-authored-worlds-required', 'No authored Creative Worlds were supplied. The runtime may return an authoring brief, but it cannot fabricate creative authorship.'));

  for (const world of worlds) findings.push(...(world.findings ?? []));

  const divergence = [];
  for (let i = 0; i < worlds.length; i += 1) {
    for (let j = i + 1; j < worlds.length; j += 1) {
      const result = pairDivergence(worlds[i], worlds[j]);
      divergence.push(result);
      if (!result.heuristicPass) findings.push(finding('major', 'creative-world-cosmetic-variation', 'Two candidate worlds are too structurally similar even at the deterministic heuristic layer; palette/type/layout changes do not count as genuine world divergence.', result));
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const status = blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-style-frame-proof';

  return {
    stage: 'creative-world-review',
    status,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    findings,
    divergence,
    truth: {
      humanWorldSelectionConfirmed: false,
      humanSemanticDivergenceReviewed: false,
      visualApprovalComplete: false,
      styleFrameReviewComplete: false,
      structuralReviewOnly: true
    }
  };
}

function buildAuthoringBrief(thesis) {
  return {
    stage: 'creative-world-authoring-brief',
    thesisRef: thesis ? {
      schema: thesis.schema ?? null,
      projectId: thesis.projectId ?? null,
      governingIdea: thesis.governingIdea?.statement ?? null,
      creativeTension: thesis.creativeTension?.label ?? null,
      categoryRejections: [...(thesis.categoryRejections ?? [])]
    } : null,
    requiredCandidateCount: { min: 3, max: 5 },
    requiredStructuralDimensions: [...STRUCTURAL_FIELDS],
    instruction: 'Author 3–5 genuinely different experience worlds that all preserve the same thesis but differ in narrative, composition, image/material behavior, motion, interaction, and responsive logic. Do not submit palette/type/layout reskins.',
    technologyRule: 'Technology is downstream and may not be used as the primary world differentiator.',
    typographyRule: 'Define typography intent and measurable pressures; do not freeze final font families at Creative World stage.',
    proofRule: 'Structural readiness advances all viable worlds to comparable visual/style-frame proof. Do not select a winner from prose alone.'
  };
}

export function buildCreativeWorldExploration({ creativeThesis = null, authoredWorlds = [] } = {}) {
  const worlds = (Array.isArray(authoredWorlds) ? authoredWorlds : []).map((candidate, index) => reviewWorld(normalizeWorld(candidate, creativeThesis, index), creativeThesis));
  const exploration = {
    schema: 'ai-studio-os/creative-world-exploration@1',
    stage: 'creative-world',
    creativeThesis,
    thesisRef: creativeThesis ? {
      schema: creativeThesis.schema ?? null,
      projectId: creativeThesis.projectId ?? null,
      governingIdea: creativeThesis.governingIdea?.statement ?? null,
      status: creativeThesis.status ?? null,
      reviewReady: creativeThesis.reviewReady === true
    } : null,
    authoringBrief: buildAuthoringBrief(creativeThesis),
    worlds,
    selection: null,
    selectedWorld: null,
    truth: { authoredWorldsSupplied: worlds.length > 0, humanWorldSelectionConfirmed: false, selectedAutomatically: false }
  };
  const review = reviewCreativeWorldExploration(exploration);
  return { ...exploration, status: review.status, pass: review.pass, reviewReady: review.reviewReady, findings: review.findings, divergence: review.divergence, review };
}

export function selectCreativeWorld(exploration = {}, { worldId, humanConfirmed = false, visualReviewConfirmed = false, visualEvidenceRefs = [], rationale = '' } = {}) {
  const id = clean(worldId);
  const worlds = Array.isArray(exploration.worlds) ? exploration.worlds : [];
  const selected = worlds.find((world) => world.id === id) ?? null;
  const evidenceRefs = cleanList(visualEvidenceRefs);
  const findings = [];

  if (exploration.reviewReady !== true) findings.push(finding('blocker', 'creative-world-exploration-not-review-ready', 'A Creative World cannot be selected until the exploration set is structurally review-ready.'));
  if (!id || !selected) findings.push(finding('blocker', 'creative-world-selection-invalid', 'Creative World selection must reference one candidate in the current exploration.', { worldId: id || null }));
  if (humanConfirmed !== true) findings.push(finding('major', 'creative-world-human-selection-required', 'No automated score may select the Creative World. Explicit human/creative-director confirmation is required.'));
  if (visualReviewConfirmed !== true || !evidenceRefs.length) findings.push(finding('major', 'creative-world-visual-proof-review-required', 'A Creative World may not become authoritative from prose alone. Comparable visual proof must be reviewed and referenced before selection.'));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const confirmed = blockers.length === 0 && majors.length === 0;
  const updatedWorlds = worlds.map((world) => ({
    ...structuredClone(world),
    selected: confirmed && world.id === id,
    truth: {
      ...(world.truth ?? {}),
      humanCreativeSelectionConfirmed: confirmed && world.id === id,
      visualWorldProofReviewed: confirmed && world.id === id,
      styleFrameReviewComplete: confirmed && world.id === id,
      typographyApproved: false,
      productionTechnologyApproved: false
    }
  }));
  const selectedWorld = confirmed ? updatedWorlds.find((world) => world.id === id) ?? null : null;

  return {
    ...structuredClone(exploration),
    worlds: updatedWorlds,
    selection: {
      worldId: id || null,
      humanConfirmed: confirmed,
      visualReviewConfirmed: confirmed,
      visualEvidenceRefs: evidenceRefs,
      rationale: clean(rationale) || null,
      selectedAutomatically: false
    },
    selectedWorld,
    status: confirmed ? 'selected-awaiting-creative-direction-review' : exploration.status,
    findings: [...(exploration.findings ?? []), ...findings],
    truth: { ...(exploration.truth ?? {}), humanWorldSelectionConfirmed: confirmed, selectedAutomatically: false }
  };
}

export { STRUCTURAL_FIELDS as creativeWorldStructuralFields };
