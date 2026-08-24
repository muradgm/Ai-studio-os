import crypto from 'node:crypto';

export const DRAWING_INTELLIGENCE_SCHEMA = 'ai-studio-os/drawing-intelligence@1';
export const DRAWING_MEMORY_SCHEMA = 'ai-studio-os/drawing-memory@1';
export const DRAWING_GEOMETRY_INTENT_SCHEMA = 'ai-studio-os/drawing-geometry-intent@1';
export const DRAWING_REVIEW_SCHEMA = 'ai-studio-os/drawing-review@1';

export const LEARNED_VISUAL_VOCABULARY = {
  'git-topology': {
    label: 'Git branch / merge / graph topology',
    cues: ['branch', 'fork', 'merge', 'bifurcation', 'connected-path', 'commit-graph', 'route-junction']
  },
  'crop-scan-focus': {
    label: 'Crop / scan / focus frame',
    cues: ['crop-corners', 'corner-brackets', 'focus-frame', 'scan-frame', 'bounding-box']
  },
  'split-alignment-docking': {
    label: 'Split pane / alignment / docking / resize',
    cues: ['divider', 'vertical-divider', 'horizontal-divider', 'split-pane', 'alignment-axis', 'resize-divider', 'docking', 'crosshair']
  },
  'security-access': {
    label: 'Security / authentication / access',
    cues: ['lock', 'shield', 'key', 'padlock', 'security-boundary']
  },
  'retry-refresh': {
    label: 'Retry / refresh',
    cues: ['circular-arrow', 'refresh', 'retry', 'reload']
  },
  'settings-properties': {
    label: 'Settings / properties / controls',
    cues: ['gear', 'sliders', 'properties-list', 'control-knob']
  },
  'success-completion': {
    label: 'Success / completion',
    cues: ['naked-check', 'check-circle', 'success-badge']
  },
  'navigation-action': {
    label: 'Navigation / generic action',
    cues: ['arrow', 'chevron', 'forward-direction', 'route', 'play']
  }
};

const FAMILIARITY_MODES = new Set(['convention-first', 'brand-original-required', 'hybrid-restrained']);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function unique(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => text(value)).filter(Boolean))];
}
function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}
function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 24);
}
function containsRawVectorData(value) {
  const source = JSON.stringify(value ?? {});
  return /<svg|<path|\bd\s*=|M\s*-?\d+(?:\.\d+)?\s*-?\d+/i.test(source);
}
function vocabularyCueIndex(vocabulary = LEARNED_VISUAL_VOCABULARY) {
  const index = new Map();
  for (const [id, entry] of Object.entries(vocabulary)) {
    for (const cue of entry.cues ?? []) index.set(cue, id);
  }
  return index;
}

export function buildDrawingMemory(input = {}) {
  const findings = [];
  if (input.schema !== DRAWING_MEMORY_SCHEMA) findings.push(finding('BLOCKER', 'drawing-memory-schema-invalid', `Drawing memory must use ${DRAWING_MEMORY_SCHEMA}.`));
  if (!text(input.projectId)) findings.push(finding('BLOCKER', 'drawing-memory-project-missing', 'Drawing memory requires projectId.'));
  const records = Array.isArray(input.records) ? input.records : [];
  const normalized = records.map((record, index) => {
    const avoidCues = unique(record.avoidCues);
    if (!text(record.conceptId) || !text(record.reason) || avoidCues.length === 0) {
      findings.push(finding('BLOCKER', 'drawing-memory-record-invalid', 'Each drawing-memory record requires conceptId, reason and avoidCues.', { index }));
    }
    return {
      id: text(record.id) || `record-${index + 1}`,
      conceptId: text(record.conceptId),
      status: text(record.status) || 'rejected',
      avoidCues,
      reason: text(record.reason),
      evidenceRefs: unique(record.evidenceRefs)
    };
  });
  return {
    schema: DRAWING_MEMORY_SCHEMA,
    projectId: text(input.projectId),
    records: normalized,
    findings,
    pass: !findings.some((item) => item.severity === 'BLOCKER')
  };
}

export function assessLearnedVocabularyCollisions(candidate = {}, { vocabulary = LEARNED_VISUAL_VOCABULARY, memory = null, conceptId = '' } = {}) {
  const cues = unique([...(candidate.metaphorCues ?? []), ...(candidate.geometryCues ?? [])]);
  const cueIndex = vocabularyCueIndex(vocabulary);
  const byVocabulary = new Map();
  for (const cue of cues) {
    const vocabularyId = cueIndex.get(cue);
    if (!vocabularyId) continue;
    if (!byVocabulary.has(vocabularyId)) byVocabulary.set(vocabularyId, []);
    byVocabulary.get(vocabularyId).push(cue);
  }

  const collisions = [...byVocabulary.entries()].map(([vocabularyId, matchedCues]) => ({
    source: 'learned-visual-vocabulary',
    vocabularyId,
    label: vocabulary[vocabularyId]?.label ?? vocabularyId,
    matchedCues,
    severity: 'MAJOR'
  }));

  const memoryRecords = memory?.records ?? [];
  for (const record of memoryRecords) {
    if (record.status !== 'rejected') continue;
    if (record.conceptId !== conceptId && record.conceptId !== '*') continue;
    const matchedCues = cues.filter((cue) => record.avoidCues.includes(cue));
    if (!matchedCues.length) continue;
    collisions.push({
      source: 'drawing-memory',
      memoryRecordId: record.id,
      matchedCues,
      reason: record.reason,
      severity: 'BLOCKER'
    });
  }
  return collisions;
}

function validateSizeBudgets(input, targetSizes, findings) {
  const budgets = input.sizeBudgets ?? {};
  for (const size of targetSizes) {
    const budget = budgets[String(size)] ?? budgets[size];
    if (!budget || !Number.isInteger(budget.maxSemanticDevices) || budget.maxSemanticDevices < 1) {
      findings.push(finding('BLOCKER', 'drawing-size-budget-missing', `Target size ${size}px requires maxSemanticDevices.`, { size }));
    }
  }
  return budgets;
}

export function buildDrawingIntelligencePlan(input = {}, { memory: memoryInput = null, vocabulary = LEARNED_VISUAL_VOCABULARY } = {}) {
  const findings = [];
  if (input.schema !== DRAWING_INTELLIGENCE_SCHEMA) findings.push(finding('BLOCKER', 'drawing-intelligence-schema-invalid', `Drawing Intelligence input must use ${DRAWING_INTELLIGENCE_SCHEMA}.`));
  if (!text(input.projectId) || !text(input.id) || !text(input.assetType) || !text(input.conceptId)) findings.push(finding('BLOCKER', 'drawing-intelligence-identity-invalid', 'projectId, id, assetType and conceptId are required.'));

  const semanticIntent = input.semanticIntent ?? {};
  if (!text(semanticIntent.meaning)) findings.push(finding('BLOCKER', 'drawing-semantic-meaning-missing', 'semanticIntent.meaning is required.'));
  if (unique(semanticIntent.mustCommunicate).length === 0) findings.push(finding('BLOCKER', 'drawing-semantic-must-communicate-empty', 'At least one mustCommunicate statement is required.'));
  if (unique(semanticIntent.mustNotMean).length === 0) findings.push(finding('MAJOR', 'drawing-semantic-negative-space-empty', 'Explicit mustNotMean semantics are required for abstract or consequential concepts.'));

  const familiarity = input.familiarityDecision ?? {};
  if (!FAMILIARITY_MODES.has(familiarity.mode) || !text(familiarity.rationale)) findings.push(finding('BLOCKER', 'drawing-familiarity-decision-invalid', 'familiarityDecision requires a supported mode and rationale.'));

  const targetSizes = Array.isArray(input.targetSizes) ? input.targetSizes : [];
  if (targetSizes.length === 0 || !targetSizes.every((size) => Number.isInteger(size) && size > 0)) findings.push(finding('BLOCKER', 'drawing-target-sizes-invalid', 'targetSizes must contain positive integer pixel sizes.'));
  const sizeBudgets = validateSizeBudgets(input, targetSizes, findings);

  let memory = null;
  if (memoryInput) {
    memory = memoryInput.schema === DRAWING_MEMORY_SCHEMA && Array.isArray(memoryInput.records) && memoryInput.pass !== undefined
      ? memoryInput
      : buildDrawingMemory(memoryInput);
    if (!memory.pass) findings.push(finding('BLOCKER', 'drawing-memory-invalid', 'Drawing memory must pass validation before it can influence a plan.'));
  }

  const candidates = (Array.isArray(input.candidates) ? input.candidates : []).map((candidate, index) => {
    const candidateFindings = [];
    const id = text(candidate.id) || `candidate-${index + 1}`;
    const primitivePlan = candidate.primitivePlan ?? {};
    if (!text(candidate.metaphor) || unique(candidate.metaphorCues).length === 0) candidateFindings.push(finding('BLOCKER', 'drawing-candidate-metaphor-invalid', 'Candidate requires metaphor and metaphorCues.', { id }));
    if (containsRawVectorData(primitivePlan)) candidateFindings.push(finding('BLOCKER', 'drawing-candidate-raw-vector-data-forbidden', 'Drawing Intelligence must hand off semantic primitives, not raw SVG/path data.', { id }));
    if (!Array.isArray(primitivePlan.primitives) || primitivePlan.primitives.length === 0) candidateFindings.push(finding('BLOCKER', 'drawing-candidate-primitives-missing', 'Candidate requires semantic primitives.', { id }));
    const collisions = assessLearnedVocabularyCollisions(candidate, { vocabulary, memory, conceptId: text(input.conceptId) });
    const blockers = collisions.filter((item) => item.severity === 'BLOCKER').length + candidateFindings.filter((item) => item.severity === 'BLOCKER').length;
    return {
      ...candidate,
      id,
      metaphorCues: unique(candidate.metaphorCues),
      geometryCues: unique(candidate.geometryCues),
      collisions,
      findings: candidateFindings,
      recommendationEligibility: blockers === 0,
      status: blockers ? 'reject-or-redesign' : collisions.length ? 'collision-review-required' : 'eligible-for-render-proof'
    };
  });

  if (candidates.length < 2) findings.push(finding('BLOCKER', 'drawing-candidate-range-too-narrow', 'Drawing Intelligence requires at least two metaphor hypotheses before geometry construction.'));
  if (!candidates.some((candidate) => candidate.recommendationEligibility)) findings.push(finding('BLOCKER', 'drawing-no-viable-candidate', 'At least one candidate must remain viable after memory and learned-vocabulary checks.'));

  const planFingerprint = hash({
    projectId: input.projectId,
    conceptId: input.conceptId,
    semanticIntent,
    familiarity,
    targetSizes,
    sizeBudgets,
    candidates: candidates.map((candidate) => ({ id: candidate.id, metaphor: candidate.metaphor, metaphorCues: candidate.metaphorCues, geometryCues: candidate.geometryCues, primitivePlan: candidate.primitivePlan }))
  });

  const blockers = findings.filter((item) => item.severity === 'BLOCKER');
  return {
    schema: DRAWING_INTELLIGENCE_SCHEMA,
    projectId: text(input.projectId),
    id: text(input.id),
    assetType: text(input.assetType),
    conceptId: text(input.conceptId),
    semanticIntent: {
      meaning: text(semanticIntent.meaning),
      mustCommunicate: unique(semanticIntent.mustCommunicate),
      mustNotMean: unique(semanticIntent.mustNotMean),
      contexts: unique(semanticIntent.contexts)
    },
    familiarityDecision: { mode: familiarity.mode, rationale: text(familiarity.rationale) },
    targetSizes,
    sizeBudgets,
    candidates,
    planFingerprint,
    status: blockers.length ? 'blocked' : 'ready-for-render-proof',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    findings,
    recommendedCandidate: null,
    humanApproved: false,
    executionAuthority: 'vector-geometry'
  };
}

export function buildGeometryIntent(plan, candidateId, { size } = {}) {
  if (plan?.reviewReady !== true) throw new Error('Drawing Intelligence plan must be review-ready before geometry handoff.');
  if (!plan.targetSizes.includes(size)) throw new Error(`Unsupported target size: ${size}`);
  const candidate = plan.candidates.find((item) => item.id === candidateId);
  if (!candidate) throw new Error(`Unknown drawing candidate: ${candidateId}`);
  if (!candidate.recommendationEligibility) throw new Error(`Drawing candidate is blocked by design memory or semantic findings: ${candidateId}`);

  const budget = plan.sizeBudgets[String(size)] ?? plan.sizeBudgets[size];
  const semanticDevices = Array.isArray(candidate.primitivePlan?.semanticDevices) ? candidate.primitivePlan.semanticDevices : [];
  const retainedSemanticDevices = semanticDevices.slice(0, budget.maxSemanticDevices);

  return {
    schema: DRAWING_GEOMETRY_INTENT_SCHEMA,
    projectId: plan.projectId,
    drawingPlanRef: { id: plan.id, fingerprint: plan.planFingerprint },
    conceptId: plan.conceptId,
    candidateId,
    targetSize: size,
    semanticMeaning: plan.semanticIntent.meaning,
    retainedSemanticDevices,
    primitivePlan: candidate.primitivePlan,
    mustNotMean: plan.semanticIntent.mustNotMean,
    executionAuthority: 'vector-geometry',
    rawSvgAllowed: false,
    rawPathDataAllowed: false
  };
}

export function reviewRenderedDrawing(plan, input = {}) {
  const findings = [];
  if (input.schema !== DRAWING_REVIEW_SCHEMA) findings.push(finding('BLOCKER', 'drawing-review-schema-invalid', `Drawing review must use ${DRAWING_REVIEW_SCHEMA}.`));
  if (input.planFingerprint !== plan?.planFingerprint) findings.push(finding('BLOCKER', 'drawing-review-plan-drift', 'Drawing review must be bound to the exact Drawing Intelligence plan.'));
  const reviews = Array.isArray(input.candidateReviews) ? input.candidateReviews : [];
  for (const candidate of plan?.candidates ?? []) {
    const review = reviews.find((item) => item.candidateId === candidate.id);
    if (!review) {
      findings.push(finding('BLOCKER', 'drawing-review-candidate-missing', 'Every candidate requires rendered visual review.', { candidateId: candidate.id }));
      continue;
    }
    if (!Array.isArray(review.sizeChecks) || !plan.targetSizes.every((size) => review.sizeChecks.some((item) => item.size === size))) findings.push(finding('BLOCKER', 'drawing-review-size-proof-incomplete', 'Every target size requires a visual review check.', { candidateId: candidate.id }));
    if (!text(review.labelBlindResemblance) || !text(review.textPairFit) || !text(review.uiContextFit) || !text(review.squintFamilyFit)) findings.push(finding('BLOCKER', 'drawing-review-observation-incomplete', 'Rendered review requires label-blind resemblance, text-pair, UI-context and squint-family observations.', { candidateId: candidate.id }));
  }
  if (input.humanApproved === true || input.finalVectorApproved === true) findings.push(finding('BLOCKER', 'drawing-review-authority-overclaimed', 'Drawing Intelligence review cannot create human or final vector approval.'));

  const blockers = findings.filter((item) => item.severity === 'BLOCKER');
  return {
    schema: DRAWING_REVIEW_SCHEMA,
    projectId: plan?.projectId ?? null,
    planFingerprint: plan?.planFingerprint ?? null,
    candidateReviews: reviews,
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-for-independent-design-judgment',
    recommendedCandidate: null,
    humanApproved: false,
    finalVectorApproved: false
  };
}
