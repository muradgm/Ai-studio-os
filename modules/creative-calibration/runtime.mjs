// v1.1 Creative Calibration: reference extraction, Design Read, Creative Dials, divergence, and selection.

const DIMENSIONS = ['typography', 'layout', 'image', 'motion', 'color', 'interaction', 'material'];

function refNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function unique(values) {
  return [...new Set(values.filter(refNonEmpty).map((value) => value.trim()))];
}

export function extractReferenceSystem({ references = [] } = {}) {
  const findings = [];
  const normalized = [];

  for (const reference of references) {
    const id = String(reference.id ?? reference.reference ?? '').trim();
    if (!id) findings.push({ severity: 'blocker', code: 'reference-id-missing' });
    if (!refNonEmpty(reference.evidence)) findings.push({ severity: 'blocker', code: 'reference-evidence-missing', id });
    if (!refNonEmpty(reference.take)) findings.push({ severity: 'blocker', code: 'reference-take-missing', id });
    if (!refNonEmpty(reference.reject)) findings.push({ severity: 'blocker', code: 'reference-reject-missing', id });
    if (reference.copyExact === true) findings.push({ severity: 'blocker', code: 'reference-copy-request', id });

    const extracted = {};
    for (const dimension of DIMENSIONS) {
      const value = reference.extracted?.[dimension];
      if (refNonEmpty(value)) extracted[dimension] = value.trim();
    }
    if (!Object.keys(extracted).length) findings.push({ severity: 'major', code: 'reference-extraction-empty', id });

    normalized.push({
      id,
      reference: reference.reference ?? id,
      evidence: reference.evidence,
      take: reference.take,
      reject: reference.reject,
      transform: reference.transform ?? 'Translate the principle into project-specific form; do not reproduce the source composition.',
      extracted
    });
  }

  if (normalized.length < 2) findings.push({ severity: 'major', code: 'reference-system-too-thin', count: normalized.length });

  const system = {};
  for (const dimension of DIMENSIONS) {
    system[dimension] = unique(normalized.map((reference) => reference.extracted[dimension]));
  }

  return {
    stage: 'reference-extraction',
    policy: 'decompose-principles-then-transform',
    dimensions: DIMENSIONS,
    references: normalized,
    system,
    findings,
    pass: !findings.some((finding) => ['blocker', 'major'].includes(finding.severity))
  };
}

function readNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildDesignRead(input = {}) {
  const required = ['business', 'emotionalTarget', 'categoryExpectation', 'opportunity', 'memorableIdea'];
  const findings = [];
  for (const field of required) {
    if (!readNonEmpty(input[field])) findings.push({ severity: 'blocker', code: 'design-read-field-missing', field });
  }
  if (!Array.isArray(input.risks) || input.risks.length === 0) findings.push({ severity: 'major', code: 'design-read-risks-missing' });

  return {
    stage: 'design-read',
    business: input.business,
    emotionalTarget: input.emotionalTarget,
    categoryExpectation: input.categoryExpectation,
    opportunity: input.opportunity,
    memorableIdea: input.memorableIdea,
    risks: input.risks ?? [],
    question: 'What did the system understand before it started designing?',
    findings,
    pass: !findings.some((finding) => ['blocker', 'major'].includes(finding.severity))
  };
}

const DIALS = [
  'novelty',
  'visualDensity',
  'editoriality',
  'asymmetry',
  'motionIntensity',
  'texture',
  'luxury',
  'warmth',
  'playfulness',
  'technicalSpectacle'
];

function validValue(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10;
}

export function buildCreativeDials(input = {}) {
  const findings = [];
  const values = {};
  const rationales = {};

  for (const dial of DIALS) {
    const entry = input[dial];
    const value = typeof entry === 'object' ? entry?.value : entry;
    const rationale = typeof entry === 'object' ? entry?.rationale : undefined;
    if (!validValue(value)) findings.push({ severity: 'blocker', code: 'creative-dial-invalid', dial, value });
    else values[dial] = Number(value);
    if (typeof rationale !== 'string' || !rationale.trim()) findings.push({ severity: 'major', code: 'creative-dial-rationale-missing', dial });
    else rationales[dial] = rationale.trim();
  }

  const fingerprint = DIALS.map((dial) => `${dial}:${values[dial] ?? 'x'}`).join('|');

  return {
    stage: 'creative-dials',
    scale: '0-10',
    values,
    rationales,
    fingerprint,
    implications: {
      motion: values.motionIntensity === undefined ? null : values.motionIntensity <= 4 ? 'restrained' : values.motionIntensity <= 7 ? 'expressive-controlled' : 'high-intensity',
      composition: values.asymmetry === undefined ? null : values.asymmetry <= 3 ? 'stable' : values.asymmetry <= 7 ? 'controlled-asymmetry' : 'strong-asymmetry',
      spectacle: values.technicalSpectacle === undefined ? null : values.technicalSpectacle <= 3 ? 'concept-first' : 'technology-visible'
    },
    findings,
    pass: !findings.some((finding) => ['blocker', 'major'].includes(finding.severity))
  };
}

export { DIALS as CREATIVE_DIAL_NAMES };

function tokens(value) {
  return new Set(String(value ?? '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((token) => token.length > 2));
}

function jaccard(a, b) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size && !right.size) return 1;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

export function buildConceptExploration({ concepts = [], designRead, creativeDials, referenceSystem, productUnderstanding } = {}) {
  const findings = [];
  if (!productUnderstanding?.reviewReady) findings.push({ severity: 'blocker', code: 'product-understanding-not-ready' });
  if (!designRead?.pass) findings.push({ severity: 'blocker', code: 'design-read-not-ready' });
  if (!creativeDials?.pass) findings.push({ severity: 'blocker', code: 'creative-dials-not-ready' });
  if (!referenceSystem?.pass) findings.push({ severity: 'blocker', code: 'reference-system-not-ready' });
  if (concepts.length < 3 || concepts.length > 5) findings.push({ severity: 'blocker', code: 'concept-count-out-of-range', count: concepts.length });

  const ids = new Set();
  const normalized = concepts.map((concept) => {
    const id = String(concept.id ?? '').trim();
    if (!id) findings.push({ severity: 'blocker', code: 'concept-id-missing' });
    else if (ids.has(id)) findings.push({ severity: 'blocker', code: 'concept-id-duplicate', id });
    ids.add(id);
    for (const field of ['thesis', 'memorableIdea', 'businessFit', 'risk']) {
      if (typeof concept[field] !== 'string' || !concept[field].trim()) findings.push({ severity: 'major', code: 'concept-field-missing', id, field });
    }
    if (!Array.isArray(concept.traits) || concept.traits.length < 2) findings.push({ severity: 'major', code: 'concept-traits-too-thin', id });
    return { ...concept, id };
  });

  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      const a = normalized[i];
      const b = normalized[j];
      const similarity = jaccard(`${a.thesis} ${a.memorableIdea} ${(a.traits ?? []).join(' ')}`, `${b.thesis} ${b.memorableIdea} ${(b.traits ?? []).join(' ')}`);
      if (similarity >= 0.72) findings.push({ severity: 'major', code: 'concepts-too-similar', a: a.id, b: b.id, similarity: Number(similarity.toFixed(2)) });
    }
  }

  return {
    stage: 'explore',
    method: 'diverge-after-product-understanding',
    productUnderstandingRef: productUnderstanding?.projectId ?? null,
    concepts: normalized,
    findings,
    pass: !findings.some((finding) => ['blocker', 'major'].includes(finding.severity))
  };
}

function selectionNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function selectConcept({ exploration, selectedId, rationale, evidence, rejected = [], killCriteria = [] } = {}) {
  const findings = [];
  if (!exploration?.pass) findings.push({ severity: 'blocker', code: 'exploration-not-ready' });
  const selected = exploration?.concepts?.find((concept) => concept.id === selectedId);
  if (!selected) findings.push({ severity: 'blocker', code: 'selected-concept-missing', selectedId });
  if (!selectionNonEmpty(rationale)) findings.push({ severity: 'blocker', code: 'selection-rationale-missing' });
  if (!selectionNonEmpty(evidence)) findings.push({ severity: 'blocker', code: 'selection-evidence-missing' });
  if (!Array.isArray(killCriteria) || killCriteria.length === 0) findings.push({ severity: 'major', code: 'selection-kill-criteria-missing' });

  const rejectedById = new Map(rejected.map((item) => [item.id, item]));
  for (const concept of exploration?.concepts ?? []) {
    if (concept.id === selectedId) continue;
    const item = rejectedById.get(concept.id);
    if (!item || !selectionNonEmpty(item.reason)) findings.push({ severity: 'major', code: 'rejected-concept-reason-missing', id: concept.id });
  }

  return {
    stage: 'concept-selection',
    selected,
    selectedId,
    rationale,
    evidence,
    rejected,
    killCriteria,
    findings,
    pass: !findings.some((finding) => ['blocker', 'major'].includes(finding.severity))
  };
}
