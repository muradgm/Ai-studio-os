function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }

export function analyzeBenchmarkHistory({ runs = [] } = {}) {
  const findings = [];
  const groups = new Map();
  for (const run of runs) {
    const validTime = Number.isFinite(Date.parse(run.timestamp));
    if (!nonEmpty(run.benchmarkId) || !nonEmpty(run.commitSha) || !validTime || typeof run.pass !== 'boolean') {
      findings.push({ severity: 'blocker', code: 'benchmark-run-invalid', benchmarkId: run.benchmarkId });
      continue;
    }
    const list = groups.get(run.benchmarkId) ?? [];
    list.push(run);
    groups.set(run.benchmarkId, list);
  }
  const regressions = [];
  const activeRegressions = [];
  const summaries = [];
  for (const [benchmarkId, group] of groups) {
    const ordered = [...group].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    for (let i = 1; i < ordered.length; i++) if (ordered[i - 1].pass === true && ordered[i].pass === false) regressions.push({ benchmarkId, from: ordered[i - 1].commitSha, to: ordered[i].commitSha, timestamp: ordered[i].timestamp });
    const latest = ordered.at(-1);
    if (latest?.pass === false) activeRegressions.push({ benchmarkId, commitSha: latest.commitSha });
    let passStreak = 0;
    for (let i = ordered.length - 1; i >= 0 && ordered[i].pass; i--) passStreak++;
    summaries.push({ benchmarkId, latestPass: latest?.pass ?? null, latestCommitSha: latest?.commitSha, passStreak, runCount: ordered.length });
  }
  return { stage: 'benchmark-history', summaries, regressions, activeRegressions, findings, pass: !findings.some((f) => f.severity === 'blocker') && activeRegressions.length === 0 };
}
