function normalizeId(value) { return String(value ?? '').trim(); }
function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }

export function buildStoryboard({ direction, intent, durationSec = 30, beats = [], shots = [] } = {}) {
  if (!direction?.directionStatement) throw new Error('storyboard requires creative direction');
  if (!intent) throw new Error('storyboard requires intent');

  const findings = [];
  const targetDuration = Number(durationSec);
  if (!Number.isFinite(targetDuration) || targetDuration <= 0) findings.push({ severity: 'blocker', code: 'invalid-target-duration', actual: durationSec });
  const beatIds = new Set();
  let beatCursor = 0;
  const normalizedBeats = beats.map((beat) => {
    const id = normalizeId(beat.id);
    const d = Number(beat.durationSec);
    if (!id) findings.push({ severity: 'blocker', code: 'beat-missing-id' });
    else if (beatIds.has(id)) findings.push({ severity: 'blocker', code: 'duplicate-beat-id', id });
    else beatIds.add(id);
    if (!(d > 0)) findings.push({ severity: 'blocker', code: 'invalid-beat-duration', id });
    const startSec = beatCursor;
    beatCursor += d > 0 ? d : 0;
    return { ...beat, id, durationSec: d, startSec, endSec: beatCursor };
  });
  if (Math.abs(beatCursor - targetDuration) > 0.25) {
    findings.push({ severity: 'blocker', code: 'beat-duration-mismatch', expected: targetDuration, actual: beatCursor });
  }

  const beatDurations = new Map(normalizedBeats.map((b) => [b.id, b.durationSec]));
  const shotIds = new Set();
  const shotDurationByBeat = new Map();
  let shotCursor = 0;
  const normalizedShots = shots.map((shot) => {
    const id = normalizeId(shot.id);
    const beatId = normalizeId(shot.beatId);
    const d = Number(shot.durationSec);
    if (!id) findings.push({ severity: 'blocker', code: 'shot-missing-id' });
    else if (shotIds.has(id)) findings.push({ severity: 'blocker', code: 'duplicate-shot-id', id });
    else shotIds.add(id);
    if (!beatIds.has(beatId)) findings.push({ severity: 'blocker', code: 'unknown-shot-beat', id, beatId });
    if (!(d > 0)) findings.push({ severity: 'blocker', code: 'invalid-shot-duration', id });
    if (shot.truthSensitive && !['real-source', 'capture-required'].includes(shot.sourcePolicy)) {
      findings.push({ severity: 'blocker', code: 'truth-sensitive-synthetic-source', id });
    }
    if (shot.truthSensitive && shot.sourcePolicy === 'real-source' && !nonEmpty(shot.sourceEvidence)) {
      findings.push({ severity: 'blocker', code: 'truth-source-evidence-missing', id });
    }
    if (shot.sourcePolicy === 'capture-required') {
      findings.push({ severity: 'major', code: 'capture-pending', id });
    }
    shotDurationByBeat.set(beatId, (shotDurationByBeat.get(beatId) ?? 0) + (d > 0 ? d : 0));
    const startSec = shotCursor;
    shotCursor += d > 0 ? d : 0;
    return { ...shot, id, beatId, durationSec: d, startSec, endSec: shotCursor };
  });

  for (const [beatId, beatDuration] of beatDurations) {
    const actual = shotDurationByBeat.get(beatId) ?? 0;
    if (Math.abs(actual - beatDuration) > 0.25) findings.push({ severity: 'blocker', code: 'shot-beat-duration-mismatch', beatId, expected: beatDuration, actual });
  }
  if (Math.abs(shotCursor - targetDuration) > 0.25) {
    findings.push({ severity: 'blocker', code: 'storyboard-duration-mismatch', expected: targetDuration, actual: shotCursor });
  }

  return {
    stage: 'storyboard',
    directionContext: {
      statement: direction.directionStatement,
      traits: [...(direction.traits ?? [])],
      antiPrinciples: [...(direction.antiPrinciples ?? [])]
    },
    intent,
    durationSec: targetDuration,
    beats: normalizedBeats,
    shots: normalizedShots,
    totalDurationSec: shotCursor,
    findings,
    pass: !findings.some((f) => ['blocker','major'].includes(f.severity))
  };
}
