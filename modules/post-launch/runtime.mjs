export function reviewPostLaunch({ analytics, feedback } = {}) {
  if (!analytics) throw new Error('post-launch review requires analytics');
  const primary = analytics.metrics.filter((m) => m.primary !== false && !m.guardrail);
  const reliablePrimary = primary.filter((m) => m.reliable);
  const insufficient = primary.filter((m) => !m.reliable || m.status === 'insufficient-evidence');
  const improved = reliablePrimary.filter((m) => ['improved', 'target-met'].includes(m.status));
  const regressed = reliablePrimary.filter((m) => m.status === 'regressed');
  const negativeFeedback = (feedback?.themes ?? []).filter((t) => t.reliable && t.critical && t.net < -0.35 && t.total >= 5);

  let outcomeStatus;
  if (analytics.guardrailRegressions.length) outcomeStatus = 'regression';
  else if (!analytics.pass || !reliablePrimary.length || insufficient.length === primary.length) outcomeStatus = 'insufficient-evidence';
  else if (regressed.length > improved.length) outcomeStatus = 'regression';
  else if (improved.length === reliablePrimary.length && !negativeFeedback.length) outcomeStatus = 'success';
  else outcomeStatus = 'mixed';

  return { stage: 'post-launch-review', outcomeStatus, attribution: analytics.attribution, improvedMetricIds: improved.map((m) => m.id), regressedMetricIds: regressed.map((m) => m.id), insufficientMetricIds: insufficient.map((m) => m.id), guardrailRegressions: analytics.guardrailRegressions, negativeFeedbackThemes: negativeFeedback.map((t) => t.theme), decisionReady: outcomeStatus !== 'insufficient-evidence', pass: outcomeStatus !== 'regression' };
}
