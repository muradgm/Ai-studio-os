import { compareFontStructures } from './font-intelligence.mjs';

const DEFAULT_COMMON_FAMILIES = new Set(['roboto','open sans','lato','montserrat','poppins','inter','raleway']);
const LANGUAGE_SUBSET = {
  ar:'arabic', bg:'cyrillic', cs:'latin-ext', de:'latin', el:'greek', en:'latin', es:'latin', fa:'arabic', fr:'latin',
  he:'hebrew', hi:'devanagari', hu:'latin-ext', id:'latin', it:'latin', ja:'japanese', ko:'korean', nl:'latin', no:'latin',
  pl:'latin-ext', pt:'latin', ro:'latin-ext', ru:'cyrillic', sk:'latin-ext', sv:'latin', th:'thai', tr:'latin-ext',
  uk:'cyrillic', vi:'vietnamese', 'zh-cn':'chinese-simplified', 'zh-sg':'chinese-simplified',
  'zh-tw':'chinese-traditional', 'zh-hk':'chinese-traditional', 'zh-hans':'chinese-simplified', 'zh-hant':'chinese-traditional'
};
const SCRIPT_SUBSET = {
  Arab:'arabic', Cyrl:'cyrillic', Deva:'devanagari', Grek:'greek', Hebr:'hebrew', Jpan:'japanese', Kore:'korean',
  Latn:'latin', Thai:'thai', Hans:'chinese-simplified', Hant:'chinese-traditional'
};
const LATIN_EXT_LANGUAGES = new Set(['cs','hu','pl','ro','sk','tr']);

function clamp(value, min=0, max=100) { return Math.max(min, Math.min(max, Math.round(value))); }
function normalWeights(font) {
  const weights = new Set();
  for (const variant of font.variants ?? []) {
    if (variant === 'regular') weights.add(400);
    else if (/^\d+$/.test(String(variant))) weights.add(Number(variant));
  }
  return [...weights].sort((a,b)=>a-b);
}

function normalizeLanguageTag(language) {
  const raw = String(language ?? '').trim().replace(/_/g, '-');
  if (!raw) return null;
  try { return new Intl.Locale(raw).toString().toLowerCase(); }
  catch { return null; }
}

function resolveLanguageRequirement(language) {
  const tag = normalizeLanguageTag(language);
  if (!tag) return { input:String(language ?? ''), subset:null, resolved:false, reason:'invalid-language-tag' };
  if (LANGUAGE_SUBSET[tag]) return { input:tag, subset:LANGUAGE_SUBSET[tag], resolved:true };
  const base = tag.split('-')[0];
  if (base === 'zh') return { input:tag, subset:null, resolved:false, reason:'chinese-script-or-region-required' };
  if (LANGUAGE_SUBSET[base]) return { input:tag, subset:LANGUAGE_SUBSET[base], resolved:true };
  try {
    const locale = new Intl.Locale(tag).maximize();
    const script = locale.script;
    const subset = SCRIPT_SUBSET[script] ?? null;
    if (!subset) return { input:tag, subset:null, resolved:false, reason:`unsupported-script:${script ?? 'unknown'}` };
    if (subset === 'latin' && LATIN_EXT_LANGUAGES.has(base)) return { input:tag, subset:'latin-ext', resolved:true };
    return { input:tag, subset, resolved:true };
  } catch {
    return { input:tag, subset:null, resolved:false, reason:'language-resolution-failed' };
  }
}

export function resolveLanguageRequirements(languages=[]) {
  return languages.map(resolveLanguageRequirement);
}

export function requiredSubsets(languages=[]) {
  const resolved = resolveLanguageRequirements(languages);
  if (resolved.some((item)=>!item.resolved)) return [];
  return [...new Set(resolved.map((item)=>item.subset).filter(Boolean))];
}
export function supportsLanguages(font, languages=[]) {
  if (!languages.length) return true;
  const resolved = resolveLanguageRequirements(languages);
  if (resolved.some((item)=>!item.resolved)) return false;
  const required = [...new Set(resolved.map((item)=>item.subset).filter(Boolean))];
  const available = new Set((font.subsets ?? []).map((subset)=>String(subset).toLowerCase()));
  return required.every((subset)=>available.has(subset) || (subset === 'latin' && available.has('latin-ext')));
}

function scoreCategoryForStrategy(font, role, pressures={}, creativeAuthority=false) {
  const category = String(font.category ?? '').toLowerCase();
  let score = 0;
  const reasons = [];
  const high = (key)=>Number(pressures[key] ?? 50) >= 70;
  if (role === 'body') {
    if (category === 'sans-serif' || category === 'serif') score += 12;
    else if (category === 'display') score -= 20;
    else if (category === 'monospace') score -= 10;
    if (high('readingDensity') && (category === 'serif' || category === 'sans-serif')) score += 8;
    if (high('accessibility') && category === 'sans-serif') score += 5;
  } else if (role === 'display') {
    if (['serif','sans-serif','display'].includes(category)) score += 7;
    if (high('expression') && category === 'display') { score += 13; reasons.push('display category supports a high-expression strategy'); }
    if (high('formality') && category === 'serif') score += 10;
    if (high('technicality') && category === 'sans-serif') score += 9;
    if (high('warmth') && category === 'serif') score += 5;
  } else if (role === 'utility') {
    if (category === 'monospace') score += high('technicality') ? 18 : 10;
    else if (category === 'sans-serif') score += 10;
    else score -= 4;
  }
  if (creativeAuthority) {
    score = Math.round(score * 0.35);
    reasons.push('business/category heuristic attenuated because Creative Thesis or Creative World is authoritative');
  }
  return { score, reasons };
}

function scoreExplicitCategoryPreference(font, business={}, role, intent=null) {
  const creativePreferred = intent?.preferredCategories?.[role];
  const preferred = Array.isArray(creativePreferred) && creativePreferred.length
    ? creativePreferred
    : business.preferredCategories?.[role];
  if (!Array.isArray(preferred) || !preferred.length) return { score:0, reasons:[] };
  const categories = preferred.map((value)=>String(value).toLowerCase());
  const index = categories.indexOf(String(font.category ?? '').toLowerCase());
  if (index === 0) return { score:creativePreferred ? 18 : 12, reasons:[creativePreferred ? 'selected creative world explicitly prefers this category for the role' : 'client/project explicitly prefers this category for the role'] };
  if (index > 0) return { score:creativePreferred ? 10 : 6, reasons:['category is within the explicit role preference set'] };
  return { score:creativePreferred ? -18 : -12, reasons:['category falls outside an explicit role preference'] };
}

function scoreCreativeDescriptorFit(font, role, intent=null) {
  const targets = intent?.descriptorTargets?.[role];
  if (!targets || typeof targets !== 'object') return { score:0, reasons:[], available:false };
  const descriptors = font.intelligence?.descriptors ?? {};
  let compared = 0;
  let total = 0;
  const reasons = [];
  for (const [key, spec] of Object.entries(targets)) {
    const actual = Number(descriptors[key]);
    const target = Number(spec?.target);
    const tolerance = Number(spec?.tolerance ?? 20);
    if (!Number.isFinite(actual) || !Number.isFinite(target) || !Number.isFinite(tolerance)) continue;
    const distance = Math.abs(actual - target);
    const contribution = Math.max(-20, 20 - (distance / Math.max(1, tolerance)) * 20);
    total += contribution;
    compared += 1;
    reasons.push(`${key} ${distance <= tolerance ? 'fits' : 'misses'} selected-world target`);
  }
  if (!compared) return { score:0, reasons:['creative descriptor targets exist but this font lacks matching measured evidence'], available:false };
  return { score:Math.round(total / compared), reasons, available:true };
}

export function scoreBusinessFit(font, { business={}, requirements={}, role='body', strategy={} }={}) {
  let score = 50;
  const reasons = [];
  const pressures = strategy.pressures ?? strategy;
  const intent = strategy.intent ?? null;
  const strategicCategory = scoreCategoryForStrategy(font, role, pressures, strategy.creativeAuthority === true);
  score += strategicCategory.score; reasons.push(...strategicCategory.reasons);
  const explicitCategory = scoreExplicitCategoryPreference(font, business, role, intent);
  score += explicitCategory.score; reasons.push(...explicitCategory.reasons);
  const creativeDescriptors = scoreCreativeDescriptorFit(font, role, intent);
  score += creativeDescriptors.score; reasons.push(...creativeDescriptors.reasons);
  if (supportsLanguages(font, requirements.languages ?? [])) { score += 15; reasons.push('required language coverage is present'); }
  else { score -= 45; reasons.push('required language coverage is incomplete or unresolved'); }
  const weightCount = normalWeights(font).length;
  if (role === 'body' && weightCount >= 4) score += 8;
  else if (role === 'display' && weightCount >= 2) score += 5;
  if ((font.axes ?? []).length > 0) score += 5;
  if ((pressures.accessibility ?? 50) >= 75 && role === 'body' && font.category === 'display') score -= 10;
  return { score:clamp(score), reasons, creativeDescriptors };
}

export function scoreProductionFitness(font, { requirements={}, role='body' }={}) {
  let score = 45;
  const reasons = [];
  const weights = normalWeights(font);
  if (Object.keys(font.files ?? {}).length) score += 20; else score -= 20;
  if (weights.includes(400)) score += 8;
  if (weights.some((weight)=>weight >= 600)) score += 8;
  if (role === 'body' && weights.length >= 4) score += 8;
  if ((font.axes ?? []).length > 0) score += 6;
  if (supportsLanguages(font, requirements.languages ?? [])) score += 10; else score -= 50;
  return { score:clamp(score), reasons };
}

export function scoreDistinctiveness(font, { marketCommonFamilies=[], avoidFamilies=[], strategy={} }={}) {
  const family = font.family.toLowerCase();
  const common = new Set([...DEFAULT_COMMON_FAMILIES, ...marketCommonFamilies.map((value)=>String(value).toLowerCase())]);
  const avoided = new Set(avoidFamilies.map((value)=>String(value).toLowerCase()));
  const pressure = Number(strategy.pressures?.distinctiveness ?? strategy.distinctiveness ?? 50);
  if (avoided.has(family)) return { score:0, reasons:['family is explicitly excluded'] };
  if (common.has(family)) return { score:pressure >= 70 ? 32 : 48, reasons:['family carries an overuse/commonality penalty'] };
  return { score:pressure >= 70 ? 88 : 82, reasons:['family avoids the default commonality penalty'] };
}

export function scorePairing(primary, secondary, { strategy='contrast-with-coherence', requirements={} }={}) {
  if (!primary || !secondary) return { score:0, reasons:['pair requires two fonts'], evidenceLevel:'none', structural:null };
  if (primary.family === secondary.family) {
    const score = strategy === 'single-family' ? 94 : 54;
    return { score, evidenceLevel:'family', structural:null, reasons:[strategy === 'single-family' ? 'single-family strategy intentionally preserves one family' : 'same-family pairing reduces role contrast unless intentional'] };
  }

  let score = strategy === 'single-family' ? 42 : 60;
  const reasons = [];
  const a = primary.category;
  const b = secondary.category;
  const strongContrast = new Set(['serif|sans-serif','sans-serif|serif','display|sans-serif','sans-serif|display']);
  if (strongContrast.has(`${a}|${b}`)) { score += 7; reasons.push('category contrast provides a preliminary hierarchy signal'); }
  else if (a === b) { score -= 3; reasons.push('same-category pairing requires stronger evidence'); }
  else score += 3;
  if (strategy === 'expressive-display' && (a === 'display' || a === 'serif') && b === 'sans-serif') score += 7;
  if (strategy === 'restrained-system' && a === b) score += 6;

  const structural = compareFontStructures(primary, secondary);
  if (structural.available) {
    score = Math.round(score * 0.72 + structural.score * 0.28);
    reasons.push(...structural.reasons);
  } else {
    reasons.push(...structural.reasons);
  }

  if (supportsLanguages(primary, requirements.languages ?? []) && supportsLanguages(secondary, requirements.languages ?? [])) {
    score += 10; reasons.push('both families cover required languages');
  } else {
    score -= 35; reasons.push('pair does not fully cover required languages');
  }
  if (normalWeights(primary).length >= 2 && normalWeights(secondary).length >= 3) score += 7;

  return {
    score:clamp(score),
    reasons,
    evidenceLevel:structural.available ? 'evidence-backed-structural' : 'catalog-metadata',
    structural
  };
}

export function scoreFontForRole(font, context={}) {
  const business = scoreBusinessFit(font, context);
  const production = scoreProductionFitness(font, context);
  const distinctiveness = scoreDistinctiveness(font, context);
  const total = clamp(business.score * 0.48 + production.score * 0.32 + distinctiveness.score * 0.20);
  return { total, business, production, distinctiveness };
}
