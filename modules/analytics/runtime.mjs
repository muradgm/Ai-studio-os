function statusFor(metric) {
  if (!metric.reliable) return 'insufficient-evidence';
  const delta = metric.observed - metric.baseline;
  const threshold = Math.abs(Number(metric.minMeaningfulChange ?? 0));
  if (metric.goal === 'target') {
    const target = Number(metric.target);
    if (!Number.isFinite(target)) return 'insufficient-evidence';
    return metric.targetDirection === 'at-most' ? (metric.observed <= target ? 'target-met' : 'regressed') : (metric.observed >= target ? 'target-met' : 'regressed');
  }
  if (Math.abs(delta) < threshold) return 'flat';
  if (metric.goal === 'increase') return delta > 0 ? 'improved' : 'regressed';
  return delta < 0 ? 'improved' : 'regressed';
}

export function analyzeOutcomes({ evidence } = {}) {
  if (!evidence) throw new Error('analytics requires outcome evidence');
  const metrics = evidence.metrics.map((metric) => {
    const delta = metric.observed - metric.baseline;
    const relativeDelta = metric.baseline === 0 ? null : delta / Math.abs(metric.baseline);
    return { ...metric, delta, relativeDelta, status: statusFor(metric) };
  });
  const guardrailRegressions = metrics.filter((m) => m.guardrail && m.status === 'regressed').map((m) => m.id);
  const primary = metrics.filter((m) => m.primary !== false && !m.guardrail);
  return { stage: 'analytics', attribution: evidence.attribution, metrics, primaryMetricIds: primary.map((m) => m.id), guardrailRegressions, pass: evidence.pass && guardrailRegressions.length === 0 };
}
