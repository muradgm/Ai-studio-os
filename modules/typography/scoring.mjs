const DEFAULT_COMMON_FAMILIES = new Set([
  'roboto', 'open sans', 'lato', 'montserrat', 'poppins', 'inter', 'raleway'
]);

const LANGUAGE_SUBSET = {
  ar: 'arabic', bg: 'cyrillic', de: 'latin', el: 'greek', en: 'latin', es: 'latin',
  fr: 'latin', he: 'hebrew', hi: 'devanagari', it: 'latin', ja: 'japanese', ko: 'korean',
  pl: 'latin-ext', pt: 'latin', ru: 'cyrillic', tr: 'latin-ext', uk: 'cyrillic', vi: 'vietnamese',
  'zh-cn': 'chinese-simplified', 'zh-tw': 'chinese-traditional'
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalWeights(font) {
  const weights = new Set();
  for (const variant of font.variants ?? []) {
    if (variant === 'regular') weights.add(400);
    else if (/^\d+$/.test(String(variant))) weights.add(Number(variant));
  }
  return [...weights].sort((a, b) => a - b);
}

export function requiredSubsets(languages = []) {
  return [...new Set(languages.map((language) => LANGUAGE_SUBSET[String(language).toLowerCase()] ?? null).filter(Boolean))];
}

export function supportsLanguages(font, languages = []) {
  const required = requiredSubsets(languages);
  if (required.length === 0) return true;
  const available = new Set((font.subsets ?? []).map((subset) => String(subset).toLowerCase()));
  return required.every((subset) => available.has(subset) || (subset === 'latin' && available.has('latin-ext')));
}

function scoreCategoryForStrategy(font, role, pressures = {}) {
  const category = String(font.category ?? '').toLowerCase();
  let score = 0;
  const reasons = [];
  const high = (key) => Number(pressures[key] ?? 50) >= 70;

  if (role === 'body') {
    if (category === 'sans-serif' || category === 'serif') { score += 12; reasons.push('category is viable for sustained body reading'); }
    else if (category === 'display') score -= 20;
    else if (category === 'monospace') score -= 10;
    if (high('readingDensity') && (category === 'serif' || category === 'sans-serif')) score += 8;
    if (high('accessibility') && category === 'sans-serif') score += 5;
  } else if (role === 'display') {
    if (category === 'serif' || category === 'sans-serif' || category === 'display') score += 7;
    if (high('expression') && category === 'display') { score += 13; reasons.push('display category supports a high-expression strategy'); }
    if (high('formality') && category === 'serif') { score += 10; reasons.push('serif category can support the formal pressure'); }
    if (high('technicality') && category === 'sans-serif') { score += 9; reasons.push('sans-serif category supports technical clarity'); }
    if (high('warmth') && category === 'serif') score += 5;
  } else if (role === 'utility') {
    if (category === 'monospace') { score += high('technicality') ? 18 : 10; reasons.push('monospace category is useful for functional utility text'); }
    else if (category === 'sans-serif') score += 10;
    else score -= 4;
  }

  return { score, reasons };
}

function scoreExplicitCategoryPreference(font, business = {}, role) {
  const preferred = business.preferredCategories?.[role];
  if (!Array.isArray(preferred) || preferred.length === 0) return { score: 0, reasons: [] };
  const categories = preferred.map((value) => String(value).toLowerCase());
  const index = categories.indexOf(String(font.category ?? '').toLowerCase());
  if (index === 0) return { score: 12, reasons: ['client/project explicitly prefers this category for the role'] };
  if (index > 0) return { score: 6, reasons: ['category is within the explicit project preference set'] };
  return { score: -12, reasons: ['category falls outside an explicit project preference'] };
}

export function scoreBusinessFit(font, { business = {}, requirements = {}, role = 'body', strategy = {} } = {}) {
  let score = 50;
  const reasons = [];
  const pressures = strategy.pressures ?? strategy;

  const strategicCategory = scoreCategoryForStrategy(font, role, pressures);
  score += strategicCategory.score;
  reasons.push(...strategicCategory.reasons);

  const explicitCategory = scoreExplicitCategoryPreference(font, business, role);
  score += explicitCategory.score;
  reasons.push(...explicitCategory.reasons);

  if (supportsLanguages(font, requirements.languages ?? [])) { score += 15; reasons.push('required language coverage is present'); }
  else { score -= 45; reasons.push('required language coverage is incomplete'); }

  const weightCount = normalWeights(font).length;
  if (role === 'body' && weightCount >= 4) { score += 8; reasons.push('weight range supports body hierarchy'); }
  else if (role === 'display' && weightCount >= 2) score += 5;
  if ((font.axes ?? []).length > 0) { score += 5; reasons.push('variable axes improve production flexibility'); }

  if ((pressures.trust ?? 50) >= 75 && role === 'body' && (font.category === 'sans-serif' || font.category === 'serif')) score += 4;
  if ((pressures.accessibility ?? 50) >= 75 && role === 'body' && font.category === 'display') score -= 10;

  return { score: clamp(score), reasons };
}

export function scoreProductionFitness(font, { requirements = {}, role = 'body' } = {}) {
  let score = 45;
  const reasons = [];
  const weights = normalWeights(font);
  if (Object.keys(font.files ?? {}).length > 0) { score += 20; reasons.push('font files are resolvable'); }
  else { score -= 20; reasons.push('no resolved font files in catalog entry'); }
  if (weights.includes(400)) score += 8;
  if (weights.some((weight) => weight >= 600)) score += 8;
  if (role === 'body' && weights.length >= 4) score += 8;
  if ((font.axes ?? []).length > 0) score += 6;
  if (supportsLanguages(font, requirements.languages ?? [])) score += 10;
  else score -= 50;
  return { score: clamp(score), reasons };
}

export function scoreDistinctiveness(font, { marketCommonFamilies = [], avoidFamilies = [], strategy = {} } = {}) {
  const family = font.family.toLowerCase();
  const common = new Set([...DEFAULT_COMMON_FAMILIES, ...marketCommonFamilies.map((value) => String(value).toLowerCase())]);
  const avoided = new Set(avoidFamilies.map((value) => String(value).toLowerCase()));
  const distinctivenessPressure = Number(strategy.pressures?.distinctiveness ?? strategy.distinctiveness ?? 50);
  if (avoided.has(family)) return { score: 0, reasons: ['family is explicitly excluded'] };
  if (common.has(family)) {
    return {
      score: distinctivenessPressure >= 70 ? 32 : 48,
      reasons: ['family carries an overuse/commonality penalty', ...(distinctivenessPressure >= 70 ? ['project has a high differentiation requirement'] : [])]
    };
  }
  return { score: distinctivenessPressure >= 70 ? 88 : 82, reasons: ['family avoids the default commonality penalty'] };
}

function opticalEvidence(primary, secondary) {
  const a = primary.descriptors ?? {};
  const b = secondary.descriptors ?? {};
  const numericKeys = ['xHeight', 'width', 'strokeContrast', 'roundness'];
  const differences = [];
  for (const key of numericKeys) {
    if (Number.isFinite(a[key]) && Number.isFinite(b[key])) differences.push(Math.abs(a[key] - b[key]));
  }
  if (differences.length < 2) return { available: false, score: 0, reasons: ['optical descriptor evidence is unavailable; category contrast remains only a weak pairing signal'] };

  const distance = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  if (distance >= 15 && distance <= 45) return { available: true, score: 12, reasons: ['explicit optical descriptors provide useful contrast without severe mismatch'] };
  if (distance < 8) return { available: true, score: -4, reasons: ['explicit optical descriptors indicate limited hierarchy contrast'] };
  if (distance > 60) return { available: true, score: -7, reasons: ['explicit optical descriptors indicate excessive structural distance'] };
  return { available: true, score: 5, reasons: ['explicit optical descriptors indicate moderate structural contrast'] };
}

export function scorePairing(primary, secondary, { strategy = 'contrast-with-coherence', requirements = {} } = {}) {
  if (!primary || !secondary) return { score: 0, reasons: ['pair requires two fonts'], evidenceLevel: 'none' };
  if (primary.family === secondary.family) {
    const score = strategy === 'single-family' ? 94 : 54;
    return {
      score,
      evidenceLevel: 'family',
      reasons: [strategy === 'single-family' ? 'single-family strategy intentionally preserves one family' : 'same-family pairing reduces role contrast unless a single-family system is intentional']
    };
  }

  let score = strategy === 'single-family' ? 42 : 60;
  const reasons = [];
  const a = primary.category;
  const b = secondary.category;
  const strongContrast = new Set(['serif|sans-serif', 'sans-serif|serif', 'display|sans-serif', 'sans-serif|display']);
  if (strongContrast.has(`${a}|${b}`)) { score += 9; reasons.push('category contrast provides a preliminary hierarchy signal'); }
  else if (a === b) { score -= 3; reasons.push('same-category pairing requires optical evidence or deliberate restraint'); }
  else { score += 4; reasons.push('category relationship provides modest contrast'); }

  if (strategy === 'expressive-display' && (a === 'display' || a === 'serif') && b === 'sans-serif') score += 7;
  if (strategy === 'restrained-system' && a === b) score += 6;
  if (strategy === 'single-family') reasons.push('different families conflict with the requested single-family strategy');

  const optical = opticalEvidence(primary, secondary);
  score += optical.score;
  reasons.push(...optical.reasons);

  const sharedSubsets = (primary.subsets ?? []).filter((subset) => (secondary.subsets ?? []).includes(subset));
  if (sharedSubsets.length) score += 5;
  if (supportsLanguages(primary, requirements.languages ?? []) && supportsLanguages(secondary, requirements.languages ?? [])) {
    score += 10; reasons.push('both families cover required languages');
  } else {
    score -= 35; reasons.push('pair does not fully cover required languages');
  }

  const primaryWeights = normalWeights(primary).length;
  const secondaryWeights = normalWeights(secondary).length;
  if (primaryWeights >= 2 && secondaryWeights >= 3) { score += 7; reasons.push('both families have enough weights for role separation'); }

  return { score: clamp(score), reasons, evidenceLevel: optical.available ? 'optical-descriptors' : 'catalog-metadata' };
}

export function scoreFontForRole(font, context = {}) {
  const business = scoreBusinessFit(font, context);
  const production = scoreProductionFitness(font, context);
  const distinctiveness = scoreDistinctiveness(font, context);
  const total = clamp(business.score * 0.48 + production.score * 0.32 + distinctiveness.score * 0.20);
  return { total, business, production, distinctiveness };
}
