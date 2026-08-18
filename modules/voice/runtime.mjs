function estimateSpeechSeconds(text, wordsPerSecond = 2.4) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return words / wordsPerSecond;
}
function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
const SOURCE_TYPES = new Set(['human-recorded', 'synthetic-stock', 'voice-clone']);

export function buildVoicePlan({ direction, enabled = false, language, sourceType = 'synthetic-stock', usageRightsEvidence, consentEvidence, cast = {}, delivery = {}, lines = [], beats = [] } = {}) {
  if (!direction?.directionStatement) throw new Error('voice plan requires creative direction');
  const findings = [];
  if (!enabled) return { stage: 'voice', enabled: false, directionContext: { statement: direction.directionStatement, traits: [...(direction.traits ?? [])] }, findings, pass: true, lines: [] };

  if (!nonEmpty(language)) findings.push({ severity: 'blocker', code: 'voice-language-missing' });
  if (!Object.keys(delivery).length) findings.push({ severity: 'blocker', code: 'voice-delivery-missing' });
  if (!SOURCE_TYPES.has(sourceType)) findings.push({ severity: 'blocker', code: 'voice-source-type-invalid', sourceType });
  if (!nonEmpty(usageRightsEvidence)) findings.push({ severity: 'blocker', code: 'voice-usage-rights-missing' });
  if (sourceType === 'voice-clone' && !nonEmpty(consentEvidence)) findings.push({ severity: 'blocker', code: 'voice-clone-consent-missing' });
  if (!lines.length) findings.push({ severity: 'blocker', code: 'voice-lines-missing' });

  const beatMap = new Map(beats.map((b) => [b.id, Number(b.durationSec)]));
  const lineDurationByBeat = new Map();
  let estimatedDurationSec = 0;
  const normalizedLines = lines.map((line) => {
    if (!nonEmpty(line.text)) findings.push({ severity: 'blocker', code: 'voice-line-empty', beatId: line.beatId });
    if (!beatMap.has(line.beatId)) findings.push({ severity: 'blocker', code: 'voice-line-unknown-beat', beatId: line.beatId });
    const d = Number(line.durationSec) > 0 ? Number(line.durationSec) : estimateSpeechSeconds(line.text, delivery.wordsPerSecond ?? 2.4);
    estimatedDurationSec += d;
    lineDurationByBeat.set(line.beatId, (lineDurationByBeat.get(line.beatId) ?? 0) + d);
    return { ...line, durationSec: Number(d.toFixed(2)) };
  });
  for (const [beatId, used] of lineDurationByBeat) {
    const available = beatMap.get(beatId);
    if (Number.isFinite(available) && used > available) findings.push({ severity: 'blocker', code: 'voice-overruns-beat', beatId, used, available });
  }
  return { stage: 'voice', enabled: true, directionContext: { statement: direction.directionStatement, traits: [...(direction.traits ?? [])] }, language, sourceType, usageRightsEvidence, consentEvidence, cast, delivery, pronunciation: delivery.pronunciation ?? [], lines: normalizedLines, estimatedDurationSec: Number(estimatedDurationSec.toFixed(2)), findings, pass: !findings.some((f) => f.severity === 'blocker') };
}
