export const CREATIVE_RUBRIC = {
  businessClarity: { min: 7, critical: true, direction: 'higher' },
  brandFit: { min: 8, critical: true, direction: 'higher' },
  distinctiveness: { min: 8, critical: true, direction: 'higher' },
  visualHierarchy: { min: 8, critical: false, direction: 'higher' },
  imageAuthenticity: { min: 8, critical: true, direction: 'higher' },
  motionPurpose: { min: 7, critical: false, direction: 'higher' },
  accessibility: { min: 7, critical: true, direction: 'higher' },
  aiGenericRisk: { max: 3, critical: true, direction: 'lower' }
};

export function evaluateCreative(scores, rubric = CREATIVE_RUBRIC) {
  const findings = [];
  const normalized = {};
  for (const [key, rule] of Object.entries(rubric)) {
    const value = Number(scores[key]);
    if (!Number.isFinite(value)) {
      findings.push({ key, severity: 'blocker', reason: 'missing-score' });
      continue;
    }
    normalized[key] = value;
    const pass = rule.direction === 'lower' ? value <= rule.max : value >= rule.min;
    if (!pass) findings.push({ key, severity: rule.critical ? 'blocker' : 'major', reason: 'threshold' });
  }

  const positiveKeys = Object.entries(rubric).filter(([, r]) => r.direction === 'higher').map(([k]) => k);
  const average = positiveKeys.length
    ? positiveKeys.reduce((sum, key) => sum + (normalized[key] ?? 0), 0) / positiveKeys.length
    : 0;

  return {
    stage: 'creative-eval',
    pass: findings.every((f) => f.severity !== 'blocker') && average >= 7.5,
    average: Number(average.toFixed(2)),
    findings,
    scores: normalized
  };
}
