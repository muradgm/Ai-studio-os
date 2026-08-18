function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }

export function synthesizeFeedback({ entries = [] } = {}) {
  const findings = [];
  const byTheme = new Map();
  for (const entry of entries) {
    if (!nonEmpty(entry.theme)) { findings.push({ severity: 'blocker', code: 'feedback-theme-missing' }); continue; }
    if (!nonEmpty(entry.sourceType)) { findings.push({ severity: 'major', code: 'feedback-source-type-missing', theme: entry.theme }); continue; }
    if (!['positive', 'negative', 'mixed'].includes(entry.sentiment)) { findings.push({ severity: 'major', code: 'feedback-sentiment-invalid', theme: entry.theme }); continue; }
    if (!nonEmpty(entry.evidence)) { findings.push({ severity: 'major', code: 'feedback-evidence-missing', theme: entry.theme }); continue; }
    if (!(Number(entry.count) > 0)) { findings.push({ severity: 'major', code: 'feedback-count-invalid', theme: entry.theme }); continue; }
    const current = byTheme.get(entry.theme) ?? { theme: entry.theme, positive: 0, negative: 0, mixed: 0, sources: new Set(), evidence: [], critical: false };
    current[entry.sentiment] = (current[entry.sentiment] ?? 0) + Number(entry.count);
    current.sources.add(entry.sourceType);
    current.evidence.push(entry.evidence);
    if (entry.critical === true) current.critical = true;
    byTheme.set(entry.theme, current);
  }
  const themes = [...byTheme.values()].map((theme) => {
    const total = theme.positive + theme.negative + theme.mixed;
    const net = total ? (theme.positive - theme.negative) / total : 0;
    return { ...theme, sources: [...theme.sources], total, net, reliable: total > 0 && theme.evidence.length > 0 };
  });
  return { stage: 'feedback', themes, findings, pass: !findings.some((f) => f.severity === 'blocker') };
}
