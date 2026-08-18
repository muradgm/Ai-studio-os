function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function finite(value) { return Number.isFinite(Number(value)); }

export function collectOutcomeEvidence({ launch = {}, metrics = [], experiment = null } = {}) {
  const findings = [];
  if (!nonEmpty(launch.id)) findings.push({ severity: 'blocker', code: 'launch-id-missing' });
  if (!nonEmpty(launch.hypothesis)) findings.push({ severity: 'blocker', code: 'launch-hypothesis-missing' });

  const seen = new Set();
  const normalizedMetrics = metrics.map((metric) => {
    const id = String(metric.id ?? '').trim();
    const metricFindings = [];
    if (!id) metricFindings.push('metric-id-missing');
    else if (seen.has(id)) metricFindings.push('duplicate-metric-id');
    else seen.add(id);
    if (!['increase', 'decrease', 'target'].includes(metric.goal)) metricFindings.push('metric-goal-invalid');
    if (!finite(metric.baseline) || !finite(metric.observed)) metricFindings.push('metric-value-invalid');
    if (!nonEmpty(metric.sourceType)) metricFindings.push('metric-source-type-missing');
    if (!nonEmpty(metric.sourceEvidence)) metricFindings.push('metric-source-evidence-missing');
    if (!nonEmpty(metric.thresholdEvidence)) metricFindings.push('metric-threshold-evidence-missing');
    if (!(Number(metric.sampleSize) > 0)) metricFindings.push('metric-sample-size-invalid');
    if (!(Number(metric.windowDays) > 0)) metricFindings.push('metric-window-invalid');

    const minSampleSize = Number(metric.minSampleSize);
    const minWindowDays = Number(metric.minWindowDays);
    if (!(minSampleSize > 0)) metricFindings.push('metric-min-sample-invalid');
    if (!(minWindowDays > 0)) metricFindings.push('metric-min-window-invalid');
    if (['increase', 'decrease'].includes(metric.goal)) {
      if (!finite(metric.minMeaningfulChange) || !(Number(metric.minMeaningfulChange) > 0)) metricFindings.push('metric-meaningful-change-invalid');
    }
    if (metric.goal === 'target') {
      if (!finite(metric.target)) metricFindings.push('metric-target-invalid');
      if (!['at-least', 'at-most'].includes(metric.targetDirection)) metricFindings.push('metric-target-direction-invalid');
    }

    const qualityReasons = [];
    if (Number(metric.sampleSize) < minSampleSize) qualityReasons.push('sample-too-small');
    if (Number(metric.windowDays) < minWindowDays) qualityReasons.push('window-too-short');
    const reliable = metricFindings.length === 0 && qualityReasons.length === 0;
    for (const code of metricFindings) findings.push({ severity: 'blocker', code, metricId: id || undefined });
    return { ...metric, id, baseline: Number(metric.baseline), observed: Number(metric.observed), sampleSize: Number(metric.sampleSize), windowDays: Number(metric.windowDays), minSampleSize, minWindowDays, minMeaningfulChange: metric.minMeaningfulChange === undefined ? undefined : Number(metric.minMeaningfulChange), reliable, qualityReasons };
  });

  const primaryMetricIds = normalizedMetrics.filter((m) => m.primary !== false && !m.guardrail).map((m) => m.id).filter(Boolean);
  if (!primaryMetricIds.length) findings.push({ severity: 'blocker', code: 'primary-metric-missing' });

  let attribution = 'correlational';
  if (experiment) {
    const covered = new Set(experiment.metricIds ?? []);
    const coversPrimaryMetrics = primaryMetricIds.every((id) => covered.has(id));
    const validExperiment = experiment.design === 'randomized-controlled'
      && experiment.randomized === true
      && experiment.controlGroup === true
      && Number(experiment.sampleSize) >= Number(experiment.minSampleSize ?? 1)
      && nonEmpty(experiment.evidence)
      && coversPrimaryMetrics;
    if (validExperiment) attribution = 'causal-supported';
    else findings.push({ severity: 'major', code: 'experiment-evidence-insufficient' });
  }

  return { stage: 'outcome-evidence', launch, metrics: normalizedMetrics, primaryMetricIds, attribution, findings, pass: !findings.some((f) => f.severity === 'blocker') };
}
