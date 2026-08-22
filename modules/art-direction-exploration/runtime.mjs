function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export const ART_DIRECTION_DIMENSIONS = [
  'spatialModel',
  'compositionModel',
  'typographicBehavior',
  'colorBehavior',
  'imageRole',
  'materialModel',
  'motionMetaphor',
  'interactionExpression',
  'responsiveExpression'
];

function normalizeDirection(candidate = {}, lock = null, index = 0) {
  return {
    schema: 'ai-studio-os/art-direction-candidate@1',
    id: clean(candidate.id) || `direction-${index + 1}`,
    label: clean(candidate.label) || `Art Direction ${index + 1}`,
    premise: clean(candidate.premise),
    experienceThesisRef: {
      schema: lock?.schema ?? null,
      projectId: lock?.projectId ?? null,
      worldId: lock?.worldId ?? null,
      lockedExperienceIdea: lock?.lockedExperienceIdea ?? null,
      lockedSequence: [...(lock?.lockedSequence ?? [])]
    },
    spatialModel: clean(candidate.spatialModel),
    compositionModel: clean(candidate.compositionModel),
    typographicBehavior: clean(candidate.typographicBehavior),
    colorBehavior: clean(candidate.colorBehavior),
    imageRole: clean(candidate.imageRole),
    materialModel: clean(candidate.materialModel),
    motionMetaphor: clean(candidate.motionMetaphor),
    interactionExpression: clean(candidate.interactionExpression),
    responsiveExpression: clean(candidate.responsiveExpression),
    soundPolicy: clean(candidate.soundPolicy) || 'Silence is valid; sound requires a service or narrative reason.',
    antiPatterns: cleanList(candidate.antiPatterns),
    unresolvedRisks: cleanList(candidate.unresolvedRisks),
    selected: false,
    reviewReady: false,
    truth: {
      humanVisualApproval: false,
      selectedAutomatically: false,
      typographyApproved: false,
      productionTechnologyApproved: false,
      productionReady: false
    }
  };
}

function canonical(value) {
  return clean(value).toLowerCase().replace(/\s+/g, ' ');
}

function reviewDirection(direction, lock) {
  const findings = [];
  if (!direction.premise) findings.push(finding('major', 'art-direction-premise-missing', 'Art direction requires a clear premise.', { directionId: direction.id }));
  for (const dimension of ART_DIRECTION_DIMENSIONS) {
    if (!clean(direction[dimension])) findings.push(finding('major', 'art-direction-dimension-missing', `Art direction is missing ${dimension}.`, { directionId: direction.id, dimension }));
  }
  if (direction.antiPatterns.length < 2) findings.push(finding('major', 'art-direction-anti-patterns-thin', 'Art direction needs at least two explicit anti-patterns.', { directionId: direction.id }));
  if (direction.experienceThesisRef.worldId !== lock?.worldId) findings.push(finding('blocker', 'art-direction-world-lock-drift', 'Art direction is not bound to the selected experience thesis.', { directionId: direction.id }));
  if (JSON.stringify(direction.experienceThesisRef.lockedSequence) !== JSON.stringify(lock?.lockedSequence ?? [])) findings.push(finding('blocker', 'art-direction-sequence-drift', 'Art direction changed the locked experience sequence.', { directionId: direction.id }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return { ...direction, findings, reviewReady: blockers.length === 0 && majors.length === 0 };
}

function pairDivergence(a, b) {
  const differences = [];
  const matches = [];
  for (const field of ART_DIRECTION_DIMENSIONS) {
    if (canonical(a[field]) && canonical(b[field]) && canonical(a[field]) !== canonical(b[field])) differences.push(field);
    else matches.push(field);
  }
  return {
    a: a.id,
    b: b.id,
    differenceCount: differences.length,
    differences,
    matches,
    pass: differences.length >= 5
  };
}

export function buildArtDirectionExploration({ experienceLock = null, authoredDirections = [] } = {}) {
  const findings = [];
  if (!experienceLock || experienceLock.schema !== 'ai-studio-os/experience-thesis-lock@1') {
    findings.push(finding('blocker', 'art-direction-experience-lock-missing', 'Art Direction Exploration requires a supported experience-thesis lock.'));
  } else if (experienceLock.truth?.humanExperienceThesisSelectionConfirmed !== true) {
    findings.push(finding('blocker', 'art-direction-experience-lock-unconfirmed', 'The experience thesis must be explicitly human-selected before art-direction exploration.'));
  }

  const input = Array.isArray(authoredDirections) ? authoredDirections : [];
  if (input.length < 3 || input.length > 5) findings.push(finding('major', 'art-direction-count-invalid', 'Art Direction Exploration requires 3–5 authored directions.', { count: input.length }));

  const directions = input.map((candidate, index) => reviewDirection(normalizeDirection(candidate, experienceLock, index), experienceLock));
  for (const direction of directions) findings.push(...direction.findings);

  const divergence = [];
  for (let i = 0; i < directions.length; i += 1) {
    for (let j = i + 1; j < directions.length; j += 1) {
      const result = pairDivergence(directions[i], directions[j]);
      divergence.push(result);
      if (!result.pass) findings.push(finding('major', 'art-direction-cosmetic-variation', 'Two art directions are too similar; the art director must change the formal interpretation, not merely styling.', result));
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const reviewReady = blockers.length === 0 && majors.length === 0;

  return {
    schema: 'ai-studio-os/art-direction-exploration@1',
    stage: 'art-direction-exploration',
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-visual-proof',
    pass: blockers.length === 0,
    reviewReady,
    experienceLock,
    directions,
    divergence,
    findings,
    selection: null,
    truth: {
      experienceThesisLocked: experienceLock?.truth?.humanExperienceThesisSelectionConfirmed === true,
      artDirectionSelectedAutomatically: false,
      humanVisualApproval: false,
      typographyApproved: false,
      productionTechnologyApproved: false,
      productionReady: false
    }
  };
}
