export const PSYCHOLOGY_DIMENSIONS = [
  'processing-fluency',
  'shape-semantics',
  'complexity',
  'symmetry-harmony',
  'naturalness-abstraction',
  'typography',
  'color-context',
  'figure-ground',
  'distinctiveness-familiarity'
];

export const PSYCHOLOGY_EVIDENCE_GUIDE = {
  'processing-fluency': 'Ease of processing can influence brand evaluation; test recognition and comprehension rather than assuming simplicity wins.',
  'shape-semantics': 'Circular and angular forms can cue different attribute associations; treat this as a hypothesis tied to the intended brand perception.',
  complexity: 'Complexity can change fluency and may also signal craftsmanship/luxury in some contexts; optimize for the brand, not a universal simplicity rule.',
  'symmetry-harmony': 'Harmony can support positive affect and clarity, but intentional tension may be useful when brand strategy calls for it.',
  'naturalness-abstraction': 'Natural versus abstract forms can change meaning and affect; validate against audience/category expectations.',
  typography: 'Letterform structure, contrast, width, terminals, case, and rhythm shape perceived personality; test the actual word/name.',
  'color-context': 'Color associations are contextual and cultural; do not encode universal one-color-one-emotion mappings.',
  'figure-ground': 'Negative space and closure can create memory hooks, but hidden tricks must remain legible at real sizes.',
  'distinctiveness-familiarity': 'A mark must be easy enough to process while remaining differentiated enough to own; measure both recognition and confusion risk.'
};

export function buildLogoPsychology(input = {}) {
  const hypotheses = Array.isArray(input.hypotheses) ? input.hypotheses : [];
  const findings = [];
  const seen = new Set();

  for (const item of hypotheses) {
    if (!PSYCHOLOGY_DIMENSIONS.includes(item?.dimension)) {
      findings.push(`unknown psychology dimension: ${item?.dimension ?? '(missing)'}`);
      continue;
    }
    seen.add(item.dimension);
    for (const key of ['choice', 'intendedEffect', 'evidenceBasis', 'testMethod', 'falsifier']) {
      if (typeof item?.[key] !== 'string' || !item[key].trim()) findings.push(`${item.dimension} missing ${key}`);
    }
    if (item.dimension === 'color-context' && (typeof item.culturalContext !== 'string' || !item.culturalContext.trim())) {
      findings.push('color-context requires culturalContext');
    }
    if (item.dimension === 'color-context' && /always|universally|guarantees|means trust|means luxury/i.test(item.intendedEffect ?? '')) {
      findings.push('color-context contains an overgeneralized universal claim');
    }
  }

  const missingCore = ['processing-fluency', 'shape-semantics', 'complexity', 'typography', 'color-context', 'distinctiveness-familiarity']
    .filter((dimension) => !seen.has(dimension));
  for (const dimension of missingCore) findings.push(`missing core psychology dimension: ${dimension}`);

  return {
    stage: 'logo-psychology',
    desiredPerceptions: input.desiredPerceptions ?? [],
    audienceContexts: input.audienceContexts ?? [],
    evidenceGuide: PSYCHOLOGY_EVIDENCE_GUIDE,
    hypotheses,
    missingCore,
    findings,
    status: findings.length ? 'blocked' : 'ready'
  };
}
