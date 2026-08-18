function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function reliableMetricMap(analytics) { return new Map((analytics?.metrics ?? []).filter((m) => m.reliable).map((m) => [m.id, m])); }
function themeMap(feedback) { return new Map((feedback?.themes ?? []).filter((t) => t.reliable).map((t) => [t.theme, t])); }
function validRecurrenceContexts(candidate) { const contexts = new Map(); for (const item of candidate.recurrenceEvidence ?? []) if (nonEmpty(item.projectId) && nonEmpty(item.evidence)) contexts.set(item.projectId.trim(), item.evidence.trim()); return [...contexts.keys()]; }

export function evaluateLearningPromotion({ candidates = [], analytics, feedback, postLaunch } = {}) {
  const metrics = reliableMetricMap(analytics);
  const themes = themeMap(feedback);
  const findings = [];
  const results = candidates.map((candidate) => {
    const support = [];
    const supportSources = new Set();
    const conflicts = [];
    const reasons = [];
    if (!nonEmpty(candidate.id) || !nonEmpty(candidate.rule) || !['project', 'global'].includes(candidate.scope)) {
      findings.push({ severity: 'blocker', code: 'learning-candidate-invalid', candidateId: candidate.id });
      return { ...candidate, decision: 'hold', support, conflicts, independentSignals: 0, requiredIndependentSignals: 2, recurrenceContexts: [], reasons: ['invalid-candidate'] };
    }
    for (const id of candidate.supportMetricIds ?? []) {
      const metric = metrics.get(id);
      if (metric && ['improved', 'target-met'].includes(metric.status)) { support.push(`metric:${id}`); supportSources.add(`quantitative:${metric.sourceType}`); }
      if (metric && metric.status === 'regressed') conflicts.push(`metric:${id}`);
    }
    for (const theme of candidate.supportFeedbackThemes ?? []) {
      const signal = themes.get(theme);
      if (signal?.net > 0.2) { support.push(`feedback:${theme}`); for (const source of signal.sources) supportSources.add(`qualitative:${source}`); }
      if (signal?.net < -0.2) conflicts.push(`feedback:${theme}`);
    }
    for (const id of candidate.conflictMetricIds ?? []) { const metric = metrics.get(id); if (metric?.status === 'regressed') conflicts.push(`metric:${id}`); }
    for (const theme of candidate.conflictFeedbackThemes ?? []) { const signal = themes.get(theme); if (signal?.net < -0.2) conflicts.push(`feedback:${theme}`); }

    const independentSignals = supportSources.size;
    const requiredIndependentSignals = Math.max(2, Number(candidate.minIndependentSignals ?? 2));
    const recurrenceContexts = validRecurrenceContexts(candidate);
    let decision = 'hold';
    if (conflicts.length) { decision = 'reject'; reasons.push('reliable-conflicting-evidence'); }
    else if (postLaunch?.outcomeStatus === 'regression' || postLaunch?.outcomeStatus === 'insufficient-evidence') reasons.push('outcome-not-strong-enough');
    else if (independentSignals < requiredIndependentSignals) reasons.push('insufficient-independent-sources');
    else if (candidate.scope === 'global' && recurrenceContexts.length < 2) reasons.push('global-rule-needs-two-evidenced-contexts');
    else { decision = 'promote'; reasons.push(candidate.scope === 'global' ? 'global-evidence-threshold-met' : 'project-evidence-threshold-met'); }
    return { ...candidate, decision, support, supportSources: [...supportSources], conflicts, independentSignals, requiredIndependentSignals, recurrenceContexts, reasons };
  });
  return { stage: 'learning-promotion', findings, results, promoted: results.filter((r) => r.decision === 'promote').map((r) => r.id), held: results.filter((r) => r.decision === 'hold').map((r) => r.id), rejected: results.filter((r) => r.decision === 'reject').map((r) => r.id), pass: !findings.some((f) => f.severity === 'blocker') };
}
