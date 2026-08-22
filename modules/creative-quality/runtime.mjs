const REQUIRED_RUBRIC = [
  'concept-singularity',
  'composition-tension',
  'visual-hierarchy',
  'typography-authorship',
  'asset-quality',
  'motion-coherence',
  'interaction-character',
  'responsive-reinterpretation',
  'restraint',
  'distinctiveness',
  'memorability',
  'final-polish'
];

const STRUCTURAL_AXES = [
  'composition',
  'narrative',
  'spatialBehavior',
  'typography',
  'imageLanguage',
  'motion',
  'interaction'
];

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function hasEvidenceRef(item) {
  return nonEmpty(item?.evidenceRef) || nonEmpty(item?.artifactRef) || nonEmpty(item?.url);
}

function severityRank(severity) {
  return { blocker: 3, major: 2, minor: 1, taste: 0, risk: 0 }[severity] ?? 0;
}

function normalizeScores(rubric = []) {
  return rubric.map((item) => ({
    id: item.id,
    score: Number(item.score),
    evidenceRef: item.evidenceRef ?? null,
    rationale: item.rationale ?? null
  }));
}

function worldAxisSignature(world = {}) {
  return STRUCTURAL_AXES.map((axis) => `${axis}:${String(world[axis] ?? '').trim().toLowerCase()}`).join('|');
}

export function runCreativeQualityRuntime(input = {}) {
  const findings = [];
  const stages = [
    'creative-thesis',
    'creative-worlds',
    'human-selection',
    'high-fidelity-style-frame',
    'motion-interaction-thesis',
    'browser-implementation',
    'creative-quality-review',
    'delivery-gates',
    'polish-loop',
    'final-verdict'
  ];

  const truth = input.projectTruth ?? {};
  if (!nonEmpty(truth.projectId)) findings.push(finding('blocker', 'project-truth-missing', 'Award-caliber evaluation requires a concrete project id.'));
  if (!Array.isArray(truth.nonNegotiables) || truth.nonNegotiables.length < 2) {
    findings.push(finding('blocker', 'project-nonnegotiables-insufficient', 'Project truth needs at least two non-negotiables before creative excellence can be judged.'));
  }

  const thesis = input.creativeThesis ?? {};
  if (!nonEmpty(thesis.statement)) findings.push(finding('blocker', 'creative-thesis-missing', 'A reviewed Creative Thesis is required.'));
  if (thesis.reviewReady !== true) findings.push(finding('blocker', 'creative-thesis-not-review-ready', 'Creative Thesis must be review-ready before award-caliber evaluation.'));

  const worlds = Array.isArray(input.creativeWorlds) ? input.creativeWorlds : [];
  if (worlds.length < 3 || worlds.length > 5) {
    findings.push(finding('blocker', 'creative-world-count-invalid', 'Award-caliber exploration requires 3-5 Creative Worlds.', { count: worlds.length }));
  }
  const uniqueSignatures = new Set(worlds.map(worldAxisSignature));
  if (worlds.length && uniqueSignatures.size !== worlds.length) {
    findings.push(finding('blocker', 'creative-worlds-cosmetic-only', 'Creative Worlds must differ structurally, not only cosmetically.', { count: worlds.length, unique: uniqueSignatures.size }));
  }
  for (const world of worlds) {
    const missingAxes = STRUCTURAL_AXES.filter((axis) => !nonEmpty(world[axis]));
    if (missingAxes.length) findings.push(finding('major', 'creative-world-axis-missing', `Creative World '${world.id ?? 'unknown'}' is missing structural axes.`, { worldId: world.id ?? null, missingAxes }));
  }

  const selection = input.humanSelection ?? {};
  const selected = worlds.find((world) => world.id === selection.selectedWorldId);
  if (!selected) findings.push(finding('blocker', 'human-world-selection-missing', 'A human-selected Creative World must be present and match an explored world.', { selectedWorldId: selection.selectedWorldId ?? null }));
  if (selection.humanApproved !== true || !hasEvidenceRef(selection)) {
    findings.push(finding('blocker', 'human-selection-evidence-missing', 'Human selection requires explicit approval and evidence reference.'));
  }

  const styleFrames = Array.isArray(input.styleFrames) ? input.styleFrames : [];
  const selectedProof = styleFrames.find((frame) => frame.worldId === selection.selectedWorldId && frame.fidelity === 'high' && frame.rendered === true && hasEvidenceRef(frame));
  if (!selectedProof) findings.push(finding('blocker', 'selected-world-rendered-proof-missing', 'Selected world needs a high-fidelity rendered style-frame proof.'));

  const motion = input.motionInteractionThesis ?? {};
  if (!nonEmpty(motion.statement)) findings.push(finding('major', 'motion-interaction-thesis-missing', 'Motion/interaction thesis is required for award-caliber web work.'));
  if (!Array.isArray(motion.signatureBehaviors) || motion.signatureBehaviors.length < 2) {
    findings.push(finding('major', 'signature-interactions-insufficient', 'At least two signature interaction behaviors should be defined.'));
  }
  if (!nonEmpty(motion.reducedMotionPlan)) findings.push(finding('blocker', 'reduced-motion-plan-missing', 'Reduced-motion behavior must be designed from the start.'));

  const implementation = input.browserImplementation ?? {};
  if (!hasEvidenceRef(implementation)) findings.push(finding('blocker', 'browser-implementation-evidence-missing', 'Browser implementation must point to rendered evidence.'));
  if (!Array.isArray(implementation.captures) || implementation.captures.length < 3) {
    findings.push(finding('blocker', 'browser-captures-insufficient', 'Desktop, tablet, and mobile browser captures are required.', { count: implementation.captures?.length ?? 0 }));
  }

  const review = input.creativeQualityReview ?? {};
  if (review.independent !== true || review.renderedEvidence !== true || !hasEvidenceRef(review)) {
    findings.push(finding('blocker', 'independent-rendered-review-missing', 'Creative Quality Review must be independent and based on rendered evidence.'));
  }
  for (const item of review.findings ?? []) {
    if (['blocker', 'major'].includes(item.severity)) findings.push({ ...item, source: 'creative-quality-review' });
  }

  const delivery = input.deliveryGates ?? {};
  if (delivery.productionReady !== true || delivery.releaseDecision !== 'ready') {
    findings.push(finding('blocker', 'delivery-gates-not-ready', 'Award-caliber candidate work must still pass production delivery gates.', {
      productionReady: delivery.productionReady ?? false,
      releaseDecision: delivery.releaseDecision ?? null
    }));
  }
  for (const lane of ['accessibility', 'performance', 'responsive', 'reducedMotion']) {
    if (delivery[lane]?.pass !== true) findings.push(finding('blocker', `delivery-${lane}-failed`, `Delivery gate '${lane}' must pass.`, { lane }));
  }

  const polishLoops = Array.isArray(input.polishLoops) ? input.polishLoops : [];
  if (polishLoops.length < 2 || polishLoops.length > 4) {
    findings.push(finding('major', 'polish-loop-count-outside-target', 'Award-caliber benchmark expects 2-4 bounded polish loops.', { count: polishLoops.length }));
  }
  for (const loop of polishLoops) {
    if (!Array.isArray(loop.validatedFindings) || !loop.validatedFindings.length || !hasEvidenceRef(loop)) {
      findings.push(finding('major', 'polish-loop-evidence-missing', 'Each polish loop needs validated findings and before/after evidence.', { loopId: loop.id ?? null }));
    }
  }

  const rubric = normalizeScores(input.rubric);
  const rubricById = new Map(rubric.map((item) => [item.id, item]));
  for (const id of REQUIRED_RUBRIC) {
    const item = rubricById.get(id);
    if (!item) findings.push(finding('blocker', 'rubric-dimension-missing', `Missing creative-quality rubric dimension '${id}'.`, { id }));
    else if (!Number.isFinite(item.score) || item.score < 1 || item.score > 10 || !nonEmpty(item.evidenceRef)) {
      findings.push(finding('blocker', 'rubric-evidence-invalid', `Rubric dimension '${id}' requires score 1-10 and evidence.`, { id }));
    }
  }
  const minScore = Number(input.thresholds?.minDimensionScore ?? 8);
  const weakDimensions = rubric.filter((item) => Number.isFinite(item.score) && item.score < minScore).map((item) => item.id);
  if (weakDimensions.length) findings.push(finding('major', 'creative-quality-dimension-weak', 'One or more creative-quality dimensions are below the benchmark threshold.', { weakDimensions, minScore }));

  const claims = input.finalClaims ?? {};
  if (claims.awardWinning === true || claims.awardReady === true || claims.externalJuryEvidence === true) {
    findings.push(finding('blocker', 'unsupported-award-claim', 'The benchmark may identify an internal candidate, but must not claim award-winning or externally award-ready status.'));
  }

  const blocker = findings.some((item) => severityRank(item.severity) >= 3);
  const major = findings.some((item) => item.severity === 'major');
  const status = blocker ? 'blocked' : major ? 'review' : 'candidate';

  return {
    runtime: 'creative-quality-v1',
    stages,
    projectId: truth.projectId ?? null,
    selectedWorldId: selection.selectedWorldId ?? null,
    counts: {
      creativeWorlds: worlds.length,
      styleFrames: styleFrames.length,
      polishLoops: polishLoops.length,
      rubricDimensions: rubric.length
    },
    rubric,
    findings,
    verdict: {
      status,
      awardClaim: false,
      candidate: status === 'candidate',
      summary: status === 'candidate'
        ? 'Internally credible award-caliber web candidate; external awards still require external jury evaluation.'
        : status === 'review'
          ? 'Promising web candidate, but major creative-quality evidence still needs review.'
          : 'Blocked: core creative-quality or delivery evidence is missing.'
    },
    pass: status === 'candidate'
  };
}

export function validateAwardCaliberWebBenchmark(output = {}, expected = {}) {
  const failures = [];
  if (typeof expected.pass === 'boolean' && output.pass !== expected.pass) failures.push(`pass expected ${expected.pass} got ${output.pass}`);
  if (expected.finalStatus && output.verdict?.status !== expected.finalStatus) failures.push(`status expected ${expected.finalStatus} got ${output.verdict?.status}`);
  if (expected.selectedWorldId && output.selectedWorldId !== expected.selectedWorldId) failures.push(`selectedWorldId expected ${expected.selectedWorldId}`);
  if (typeof expected.minCreativeWorlds === 'number' && output.counts?.creativeWorlds < expected.minCreativeWorlds) failures.push(`creative worlds below ${expected.minCreativeWorlds}`);
  if (typeof expected.maxCreativeWorlds === 'number' && output.counts?.creativeWorlds > expected.maxCreativeWorlds) failures.push(`creative worlds above ${expected.maxCreativeWorlds}`);
  if (typeof expected.minPolishLoops === 'number' && output.counts?.polishLoops < expected.minPolishLoops) failures.push(`polish loops below ${expected.minPolishLoops}`);
  if (expected.requireNoAwardClaim && output.verdict?.awardClaim !== false) failures.push('award claim must remain false');
  for (const stage of expected.requiredStages ?? []) {
    if (!output.stages?.includes(stage)) failures.push(`missing stage ${stage}`);
  }
  for (const id of expected.requiredRubricDimensions ?? []) {
    if (!output.rubric?.some((item) => item.id === id)) failures.push(`missing rubric dimension ${id}`);
  }
  for (const code of expected.forbiddenFindingCodes ?? []) {
    if (output.findings?.some((item) => item.code === code)) failures.push(`forbidden finding present ${code}`);
  }
  return { pass: failures.length === 0, failures };
}
