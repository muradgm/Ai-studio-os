const DESCRIPTOR_KEYS = new Set([
  'xHeight', 'width', 'strokeContrast', 'geometry', 'rhythm', 'terminals', 'aperture', 'serifStyle', 'humanism'
]);

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
    if (['xHeight', 'width', 'strokeContrast', 'aperture', 'humanism'].includes(key)) {
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

export function enrichFontCatalog(catalog = [], evidence = []) {
  if (!Array.isArray(catalog)) throw new TypeError('font catalog must be an array');
  if (!Array.isArray(evidence)) throw new TypeError('font evidence must be an array');

  const index = new Map();
  for (const item of evidence.map(normalizeFontEvidence).filter(Boolean)) {
    index.set(item.family.toLowerCase(), item);
  }

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
    evidence: {
      primarySources: a.sources,
      secondarySources: b.sources
    }
  };
}
