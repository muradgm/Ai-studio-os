const DEFAULT_COMMON_FAMILIES = new Set([
  'roboto', 'open sans', 'lato', 'montserrat', 'poppins', 'inter', 'raleway'
]);

const LANGUAGE_SUBSET = {
  ar: 'arabic', bg: 'cyrillic', de: 'latin', el: 'greek', en: 'latin', es: 'latin',
  fr: 'latin', he: 'hebrew', hi: 'devanagari', it: 'latin', ja: 'japanese', ko: 'korean',
  pl: 'latin-ext', pt: 'latin', ru: 'cyrillic', tr: 'latin-ext', uk: 'cyrillic', vi: 'vietnamese',
  'zh-cn': 'chinese-simplified', 'zh-tw': 'chinese-traditional'
};

const BUSINESS_CATEGORY_HINTS = [
  { match: /law|legal|finance|bank|wealth|consult|architecture|editorial|publishing/i, display: ['serif', 'sans-serif'], body: ['sans-serif', 'serif'] },
  { match: /fashion|luxury|beauty|jewel|gallery|culture|art|patisserie|bakery|restaurant|hospitality|hotel/i, display: ['serif', 'display'], body: ['sans-serif', 'serif'] },
  { match: /tech|software|saas|ai|developer|engineering|logistics|industrial|automotive/i, display: ['sans-serif', 'display'], body: ['sans-serif'] },
  { match: /health|medical|clinic|education|government|public|nonprofit/i, display: ['sans-serif', 'serif'], body: ['sans-serif', 'serif'] },
  { match: /streetwear|music|gaming|entertainment|sports|youth/i, display: ['display', 'sans-serif'], body: ['sans-serif'] }
];

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

function preferredCategories(business = {}, role) {
  const explicit = business.preferredCategories?.[role];
  if (Array.isArray(explicit) && explicit.length) return explicit.map((value) => String(value).toLowerCase());
  const haystack = [business.type, business.industry, business.model, business.positioning].filter(Boolean).join(' ');
  return BUSINESS_CATEGORY_HINTS.find((hint) => hint.match.test(haystack))?.[role] ?? (role === 'display' ? ['serif', 'sans-serif', 'display'] : ['sans-serif', 'serif']);
}

export function scoreBusinessFit(font, { business = {}, brand = {}, requirements = {}, role = 'body' } = {}) {
  let score = 50;
  const reasons = [];
  const preferred = preferredCategories(business, role);
  const categoryIndex = preferred.indexOf(String(font.category).toLowerCase());
  if (categoryIndex === 0) { score += 20; reasons.push('category strongly fits business role'); }
  else if (categoryIndex > 0) { score += 10; reasons.push('category is compatible with business role'); }
  else { score -= 12; reasons.push('category is outside the default business-role preference'); }

  if (supportsLanguages(font, requirements.languages ?? [])) { score += 15; reasons.push('required language coverage is present'); }
  else { score -= 45; reasons.push('required language coverage is incomplete'); }

  const weightCount = normalWeights(font).length;
  if (role === 'body' && weightCount >= 4) score += 10;
  else if (role === 'display' && weightCount >= 2) score += 6;
  if ((font.axes ?? []).length > 0) { score += 5; reasons.push('variable axes improve production flexibility'); }

  const traits = new Set((brand.traits ?? []).map((value) => String(value).toLowerCase()));
  if (traits.has('technical') && font.category === 'monospace') score += role === 'utility' ? 18 : 2;
  if ((traits.has('editorial') || traits.has('refined')) && font.category === 'serif' && role === 'display') score += 8;
  if (traits.has('contemporary') && font.category === 'sans-serif') score += 5;

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

export function scoreDistinctiveness(font, { marketCommonFamilies = [], avoidFamilies = [] } = {}) {
  const family = font.family.toLowerCase();
  const common = new Set([...DEFAULT_COMMON_FAMILIES, ...marketCommonFamilies.map((value) => String(value).toLowerCase())]);
  const avoided = new Set(avoidFamilies.map((value) => String(value).toLowerCase()));
  if (avoided.has(family)) return { score: 0, reasons: ['family is explicitly excluded'] };
  if (common.has(family)) return { score: 45, reasons: ['family carries an overuse/commonality penalty'] };
  return { score: 82, reasons: ['family avoids the default commonality penalty'] };
}

export function scorePairing(primary, secondary, { strategy = 'contrast-with-coherence', requirements = {} } = {}) {
  if (!primary || !secondary) return { score: 0, reasons: ['pair requires two fonts'] };
  if (primary.family === secondary.family) {
    const score = strategy === 'single-family' ? 94 : 52;
    return { score, reasons: [strategy === 'single-family' ? 'single-family strategy intentionally preserves one family' : 'same-family pairing reduces hierarchy contrast'] };
  }

  let score = 58;
  const reasons = [];
  const a = primary.category;
  const b = secondary.category;
  const strongContrast = new Set(['serif|sans-serif', 'sans-serif|serif', 'display|sans-serif', 'sans-serif|display']);
  if (strongContrast.has(`${a}|${b}`)) { score += 18; reasons.push('category contrast supports hierarchy'); }
  else if (a === b) { score -= 8; reasons.push('same-category pairing needs stronger optical evidence'); }
  else { score += 8; reasons.push('category relationship provides moderate contrast'); }

  const sharedSubsets = (primary.subsets ?? []).filter((subset) => (secondary.subsets ?? []).includes(subset));
  if (sharedSubsets.length) score += 7;
  if (supportsLanguages(primary, requirements.languages ?? []) && supportsLanguages(secondary, requirements.languages ?? [])) {
    score += 9; reasons.push('both families cover required languages');
  } else {
    score -= 35; reasons.push('pair does not fully cover required languages');
  }

  const primaryWeights = normalWeights(primary).length;
  const secondaryWeights = normalWeights(secondary).length;
  if (primaryWeights >= 2 && secondaryWeights >= 3) score += 8;

  return { score: clamp(score), reasons };
}

export function scoreFontForRole(font, context = {}) {
  const business = scoreBusinessFit(font, context);
  const production = scoreProductionFitness(font, context);
  const distinctiveness = scoreDistinctiveness(font, context);
  const total = clamp(business.score * 0.45 + production.score * 0.35 + distinctiveness.score * 0.20);
  return { total, business, production, distinctiveness };
}
