import { reviewTraderFrameIconVisuals } from './runtime.mjs';

function median(values = []) {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function severityRank(value) {
  return ({ blocker: 4, major: 3, minor: 2, taste: 1 })[String(value).toLowerCase()] ?? 0;
}

export function reviewTraderFrameIconVisualsV2(markups, metrics = {}) {
  const base = reviewTraderFrameIconVisuals(markups, metrics);
  const size = 24;
  const inkValues = Object.values(metrics).map((entry) => entry?.[size]?.inkCoverage).filter(Number.isFinite);
  const inkMedian = median(inkValues);
  const learningInk = metrics['learning-event']?.[size]?.inkCoverage;

  const findings = base.findings.filter((item) => item.code !== 'traderframe-icon-optical-density-outlier');
  const lenses = base.lenses.map((lens) => ({
    ...lens,
    findings: lens.findings.filter((item) => item.code !== 'traderframe-icon-optical-density-outlier')
  }));
  const optical = lenses.find((lens) => lens.id === 'optical-reviewer');

  if (optical && Number.isFinite(learningInk) && inkMedian > 0 && learningInk > inkMedian * 1.25) {
    const item = {
      severity: 'major',
      code: 'traderframe-icon-optical-density-outlier',
      message: 'Learning Event carries materially more rendered ink than the family median and reads as a heavier optical family at small sizes.',
      icon: 'learning-event',
      evidence: {
        targetSize: size,
        inkCoverage: learningInk,
        familyMedianInkCoverage: inkMedian,
        ratio: Math.round((learningInk / inkMedian) * 10000) / 10000
      }
    };
    optical.findings.push(item);
    findings.push({ ...item, reviewer: 'optical-reviewer' });
  }

  for (const lens of lenses) {
    lens.status = lens.findings.some((item) => severityRank(item.severity) >= severityRank('major')) ? 'changes-required' : 'reviewed';
  }
  const blocking = findings.filter((item) => severityRank(item.severity) >= severityRank('major'));

  return {
    ...base,
    status: blocking.length ? 'changes-required' : 'review',
    pass: blocking.length === 0,
    lenses,
    metricsSummary: {
      ...base.metricsSummary,
      inkCoverageMedian: inkMedian,
      densityMetric: 'inkCoverage@24px'
    },
    findings
  };
}
