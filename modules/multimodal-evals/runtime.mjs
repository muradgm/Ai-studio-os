function sameArray(a = [], b = []) { return JSON.stringify(a) === JSON.stringify(b); }
export function reviewMultimodal({ direction, storyboard, continuity, video, voice, audio, targetDurationSec } = {}) {
  const findings = [];
  const target = Number(targetDurationSec);
  const statement = direction?.directionStatement;
  const traits = direction?.traits ?? [];
  const stages = [storyboard, continuity, video, voice, audio].filter(Boolean);
  for (const stage of stages) {
    if (stage.directionContext?.statement !== statement) findings.push({ severity: 'blocker', code: 'creative-direction-drift', stage: stage.stage });
    if (stage.directionContext?.traits && !sameArray(stage.directionContext.traits, traits)) findings.push({ severity: 'major', code: 'creative-trait-drift', stage: stage.stage });
    for (const finding of stage.findings ?? []) findings.push({ ...finding, stage: stage.stage });
  }
  if (!Number.isFinite(target) || target <= 0) findings.push({ severity: 'blocker', code: 'invalid-target-duration', actual: targetDurationSec });
  if (video && Number.isFinite(target) && Math.abs(video.durationSec - target) > 0.25) findings.push({ severity: 'blocker', code: 'video-duration-mismatch', expected: target, actual: video.durationSec });
  if (voice?.enabled && Number.isFinite(target) && voice.estimatedDurationSec > target * 0.65) findings.push({ severity: 'major', code: 'voice-density-too-high', estimatedDurationSec: voice.estimatedDurationSec });
  const beatIds = new Set((storyboard?.beats ?? []).map((b) => b.id));
  for (const line of voice?.lines ?? []) if (!beatIds.has(line.beatId)) findings.push({ severity: 'blocker', code: 'orphan-voice-line', beatId: line.beatId });
  for (const cue of audio?.soundDesign ?? []) if (!beatIds.has(cue.beatId)) findings.push({ severity: 'blocker', code: 'orphan-audio-cue', beatId: cue.beatId });
  const blockers = findings.filter((f) => f.severity === 'blocker');
  const majors = findings.filter((f) => f.severity === 'major');
  return { stage: 'multimodal-review', directionContext: { statement, traits: [...traits] }, pass: blockers.length === 0 && majors.length === 0, findings, blockers, majors, summary: blockers.length ? 'blocked' : majors.length ? 'revise' : 'approved' };
}
