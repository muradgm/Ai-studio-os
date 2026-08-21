const NUMERIC_DESCRIPTOR_KEYS = new Set([
  'xHeight', 'width', 'strokeContrast', 'aperture', 'humanism', 'roundness', 'complexity', 'proportion'
]);
const TEXT_DESCRIPTOR_KEYS = new Set(['geometry', 'rhythm', 'terminals', 'serifStyle']);
const DESCRIPTOR_KEYS = new Set([...NUMERIC_DESCRIPTOR_KEYS, ...TEXT_DESCRIPTOR_KEYS]);

function normalizeScale(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : null;
}

function normalizeText(value) {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}

export function normalizeFontEvidence(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const family = typeof raw.family === 'string' ? raw.family.trim() : '';
  if (!family) return null;

  const descriptors = {};
  for (const key of DESCRIPTOR_KEYS) {
    const value = raw.descriptors?.[key];
    if (NUMERIC_DESCRIPTOR_KEYS.has(key)) {
      const normalized = normalizeScale(value);
      if (normalized !== null) descriptors[key] = normalized;
    } else {
      const normalized = normalizeText(value);
      if (normalized) descriptors[key] = normalized;
    }
  }

  const sources = Array.isArray(raw.sources)
    ? raw.sources
        .filter((source) => source && typeof source === 'object')
        .map((source) => ({
          type: normalizeText(source.type) ?? 'unknown',
          reference: typeof source.reference === 'string' ? source.reference.trim() : '',
          confidence: normalizeScale(source.confidence) ?? 50
        }))
        .filter((source) => source.reference)
    : [];

  const confidence = sources.length
    ? Math.round(sources.reduce((sum, source) => sum + source.confidence, 0) / sources.length)
    : 0;

  return {
    family,
    descriptors,
    sources,
    confidence,
    evidenceBacked: Object.keys(descriptors).length > 0 && sources.length > 0
  };
}

function mergeEvidenceEntries(entries) {
  if (!entries.length) return null;
  const family = entries[0].family;
  const descriptors = {};
  const descriptorConfidence = {};
  const sources = [];

  for (const entry of entries) {
    sources.push(...entry.sources);
    for (const [key, value] of Object.entries(entry.descriptors)) {
      const weight = Math.max(1, entry.confidence);
      if (NUMERIC_DESCRIPTOR_KEYS.has(key)) {
        const prior = descriptorConfidence[key] ?? { weighted: 0, weight: 0 };
        prior.weighted += value * weight;
        prior.weight += weight;
        descriptorConfidence[key] = prior;
      } else if (!(key in descriptors) || entry.confidence >= (descriptorConfidence[key]?.confidence ?? -1)) {
        descriptors[key] = value;
        descriptorConfidence[key] = { confidence: entry.confidence };
      }
    }
  }

  for (const key of NUMERIC_DESCRIPTOR_KEYS) {
    const aggregate = descriptorConfidence[key];
    if (aggregate?.weight) descriptors[key] = Math.round(aggregate.weighted / aggregate.weight);
  }

  const uniqueSources = [];
  const seen = new Set();
  for (const source of sources) {
    const key = `${source.type}|${source.reference}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueSources.push(source);
  }
  const confidence = uniqueSources.length
    ? Math.round(uniqueSources.reduce((sum, source) => sum + source.confidence, 0) / uniqueSources.length)
    : 0;

  return { family, descriptors, sources: uniqueSources, confidence, evidenceBacked: Object.keys(descriptors).length > 0 && uniqueSources.length > 0 };
}

export function enrichFontCatalog(catalog = [], evidence = []) {
  if (!Array.isArray(catalog)) throw new TypeError('font catalog must be an array');
  if (!Array.isArray(evidence)) throw new TypeError('font evidence must be an array');

  const grouped = new Map();
  for (const item of evidence.map(normalizeFontEvidence).filter(Boolean)) {
    const key = item.family.toLowerCase();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(item);
  }
  const index = new Map([...grouped.entries()].map(([key, entries]) => [key, mergeEvidenceEntries(entries)]));

  return catalog.map((font) => {
    const intelligence = index.get(String(font.family ?? '').toLowerCase()) ?? null;
    return intelligence ? { ...font, intelligence } : { ...font };
  });
}

function numericDistance(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.abs(a - b);
}

export function compareFontStructures(primary, secondary) {
  const a = primary?.intelligence;
  const b = secondary?.intelligence;
  if (!a?.evidenceBacked || !b?.evidenceBacked) {
    return {
      available: false,
      confidence: 0,
      score: null,
      reasons: ['optical descriptors unavailable; pairing remains catalog-metadata based']
    };
  }

  let score = 70;
  const reasons = [];
  const widthDistance = numericDistance(a.descriptors.width, b.descriptors.width);
  const xHeightDistance = numericDistance(a.descriptors.xHeight, b.descriptors.xHeight);
  const contrastDistance = numericDistance(a.descriptors.strokeContrast, b.descriptors.strokeContrast);
  const roundnessDistance = numericDistance(a.descriptors.roundness, b.descriptors.roundness);
  const complexityDistance = numericDistance(a.descriptors.complexity, b.descriptors.complexity);
  const proportionDistance = numericDistance(a.descriptors.proportion, b.descriptors.proportion);

  if (widthDistance !== null) {
    if (widthDistance <= 18) { score += 8; reasons.push('compatible character-width proportions'); }
    else if (widthDistance >= 45) { score -= 8; reasons.push('large width mismatch may disrupt rhythm'); }
  }
  if (xHeightDistance !== null) {
    if (xHeightDistance <= 18) { score += 8; reasons.push('compatible x-height tendency'); }
    else if (xHeightDistance >= 45) { score -= 10; reasons.push('large x-height mismatch weakens text-scale harmony'); }
  }
  if (contrastDistance !== null) {
    if (contrastDistance >= 20 && contrastDistance <= 55) { score += 8; reasons.push('stroke contrast creates useful hierarchy tension'); }
    else if (contrastDistance > 70) { score -= 5; reasons.push('stroke contrast relationship may feel disconnected'); }
  }
  if (roundnessDistance !== null) {
    if (roundnessDistance <= 20) { score += 4; reasons.push('glyph curve ratios support visual coherence'); }
    else if (roundnessDistance >= 55) { score -= 4; reasons.push('glyph curve-ratio mismatch may feel structurally disconnected'); }
  }
  if (complexityDistance !== null) {
    if (complexityDistance <= 25) score += 3;
    else if (complexityDistance >= 60) { score -= 4; reasons.push('large outline-complexity mismatch may weaken pairing coherence'); }
  }
  if (proportionDistance !== null && proportionDistance <= 22) { score += 4; reasons.push('representative glyph proportions are compatible'); }

  const geometryA = a.descriptors.geometry;
  const geometryB = b.descriptors.geometry;
  if (geometryA && geometryB) {
    if (geometryA === geometryB) { score += 4; reasons.push('shared geometry supports coherence'); }
    else { score += 3; reasons.push('different geometry provides controlled contrast'); }
  }

  const rhythmA = a.descriptors.rhythm;
  const rhythmB = b.descriptors.rhythm;
  if (rhythmA && rhythmB && rhythmA === rhythmB) { score += 5; reasons.push('shared rhythm supports composition'); }

  const confidence = Math.round((a.confidence + b.confidence) / 2);
  return {
    available: true,
    confidence,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    evidence: { primarySources: a.sources, secondarySources: b.sources }
  };
}
