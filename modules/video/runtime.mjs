export function buildVideoPlan({ direction, storyboard, formats = ['16:9'], formatPlans = {} } = {}) {
  if (!direction?.directionStatement) throw new Error('video plan requires creative direction');
  if (!storyboard) throw new Error('video plan requires storyboard');
  const findings = [];
  const requestedFormats = [...new Set(formats)];
  if (!requestedFormats.length) findings.push({ severity: 'blocker', code: 'video-format-missing' });
  for (const format of requestedFormats) {
    const plan = formatPlans[format] ?? {};
    if (format === '9:16' && !plan.safeAreaStrategy) {
      findings.push({ severity: 'blocker', code: 'vertical-safe-area-missing', format });
    }
  }

  const shots = storyboard.shots.map((shot) => ({
    id: shot.id,
    beatId: shot.beatId,
    durationSec: shot.durationSec,
    purpose: shot.purpose,
    subject: shot.subject,
    sourcePolicy: shot.sourcePolicy,
    sourceEvidence: shot.sourceEvidence,
    camera: shot.camera ?? {},
    transition: shot.transition ?? 'cut-on-intent',
    continuity: shot.continuity ?? {}
  }));

  return {
    stage: 'video',
    directionContext: {
      statement: direction.directionStatement,
      traits: [...(direction.traits ?? [])]
    },
    formats: requestedFormats,
    formatPlans,
    durationSec: storyboard.totalDurationSec,
    shots,
    pacingRule: 'Cut, hold, or move only when the beat needs a change in attention, information, emotion, or physical perspective.',
    findings,
    pass: storyboard.pass && !findings.some((f) => f.severity === 'blocker')
  };
}
