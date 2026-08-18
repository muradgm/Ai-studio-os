export const LOGO_TYPES = [
  { id: 'wordmark', label: 'Wordmark', description: 'Brand name carried primarily by custom or distinctive typography.' },
  { id: 'lettermark', label: 'Lettermark / Monogram', description: 'Initials or abbreviated letter structure.' },
  { id: 'pictorial-mark', label: 'Pictorial Mark', description: 'Recognizable image or concrete symbol.' },
  { id: 'abstract-mark', label: 'Abstract Mark', description: 'Non-literal proprietary symbol or geometry.' },
  { id: 'mascot', label: 'Mascot', description: 'Character-led identity mark.' },
  { id: 'combination-mark', label: 'Combination Mark', description: 'Word/letter mark paired with a symbol or character.' },
  { id: 'emblem', label: 'Emblem', description: 'Text and symbol integrated inside a unified badge/seal/container.' }
];

const TYPE_IDS = new Set(LOGO_TYPES.map((x) => x.id));
const STRESS_TESTS = [
  'black-on-white', 'white-on-black', 'one-color', '16px', '32px', '64px', '128px',
  'favicon', 'app-icon', 'website-header', 'social-avatar', 'business-card', 'signage', 'stamp-or-embroidery', 'blur-recognition'
];

export function assessLogoTypes(assessments = []) {
  const findings = [];
  const byId = new Map();
  for (const assessment of assessments) {
    if (!TYPE_IDS.has(assessment?.type)) { findings.push(`unknown logo type: ${assessment?.type ?? '(missing)'}`); continue; }
    if (byId.has(assessment.type)) findings.push(`duplicate logo type assessment: ${assessment.type}`);
    byId.set(assessment.type, assessment);
    if (!Number.isFinite(assessment.score) || assessment.score < 0 || assessment.score > 10) findings.push(`${assessment.type} score must be 0–10`);
    if (typeof assessment.rationale !== 'string' || !assessment.rationale.trim()) findings.push(`${assessment.type} missing rationale`);
    if (!Array.isArray(assessment.risks)) findings.push(`${assessment.type} risks must be an array`);
  }
  for (const type of LOGO_TYPES) if (!byId.has(type.id)) findings.push(`missing logo type assessment: ${type.id}`);

  const ranked = [...byId.values()].filter((x) => Number.isFinite(x.score)).sort((a, b) => b.score - a.score);
  return {
    stage: 'logo-type-coverage',
    taxonomy: LOGO_TYPES,
    assessments: ranked,
    shortlist: ranked.slice(0, 3).map((x) => x.type),
    findings,
    status: findings.length ? 'blocked' : 'ready'
  };
}

export function buildLogoExploration(input = {}, typeCoverage) {
  const families = Array.isArray(input.families) ? input.families : [];
  const findings = [];
  if (!typeCoverage || typeCoverage.status !== 'ready') findings.push('logo exploration requires complete seven-type assessment');
  if (families.length < 3) findings.push('logo exploration requires at least three concept families');
  for (const family of families) {
    if (!TYPE_IDS.has(family?.type)) findings.push(`family ${family?.id ?? '(unknown)'} uses unknown logo type`);
    for (const key of ['id', 'type', 'concept', 'mechanism', 'memoryHook', 'risk']) {
      if (typeof family?.[key] !== 'string' || !family[key].trim()) findings.push(`family ${family?.id ?? '(unknown)'} missing ${key}`);
    }
    if (!Array.isArray(family?.variants) || family.variants.length < 2) findings.push(`family ${family?.id ?? '(unknown)'} needs at least two variants`);
  }
  return { stage: 'logo-exploration', families, findings, status: findings.length ? 'blocked' : 'ready' };
}

export function buildLogoSystem(input = {}) {
  const findings = [];
  const finalist = input.finalist;
  if (!finalist?.id) findings.push('missing finalist');
  if (!TYPE_IDS.has(finalist?.type)) findings.push('finalist uses invalid logo type');
  if (input.finalAssetFormat === 'raster') findings.push('raster generation cannot be the final master logo');
  if (input.vectorRequired !== true) findings.push('final logo requires vector reconstruction');

  const responsive = input.responsive ?? {};
  for (const key of ['primaryLockup', 'secondaryLockup', 'symbol', 'microMark', 'wordmark', 'favicon']) {
    if (!responsive[key]) findings.push(`responsive logo system missing ${key}`);
  }

  const stress = input.stressTests ?? {};
  for (const test of STRESS_TESTS) if (stress[test] !== 'pass') findings.push(`logo stress test not passed: ${test}`);

  const qa = input.qa ?? {};
  for (const key of ['conceptStrength', 'memorability', 'distinctiveness', 'smallSize', 'opticalQuality', 'reproduction', 'wordmarkCompatibility', 'motionPotential', 'aiGenericRisk']) {
    if (!Number.isFinite(qa[key]) || qa[key] < 0 || qa[key] > 10) findings.push(`logo QA ${key} must be 0–10`);
  }
  if (Number.isFinite(qa.aiGenericRisk) && qa.aiGenericRisk > 4) findings.push('AI-generic risk is too high');
  if (input.originalityReview?.status !== 'clear') findings.push('originality review must be clear before approval');

  return {
    stage: 'logo-system',
    finalist,
    vectorRequired: true,
    finalAssetFormat: input.finalAssetFormat,
    responsive,
    stressTests: stress,
    qa,
    originalityReview: input.originalityReview,
    motionPrinciple: input.motionPrinciple ?? null,
    findings,
    status: findings.length ? 'blocked' : 'approved'
  };
}
