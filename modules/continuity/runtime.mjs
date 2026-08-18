export function buildContinuityPlan({ direction, bible = {}, shots = [] } = {}) {
  if (!direction?.directionStatement) throw new Error('continuity requires creative direction');
  const requiredFields = bible.requiredFields ?? [];
  const locked = bible.locked ?? {};
  const findings = [];
  if (!requiredFields.length && !Object.keys(locked).length) findings.push({ severity: 'blocker', code: 'continuity-bible-empty' });

  for (const shot of shots) {
    const continuity = shot.continuity ?? {};
    for (const field of requiredFields) {
      const value = continuity[field];
      if (value === undefined || value === null || String(value).trim() === '') findings.push({ severity: 'blocker', code: 'missing-continuity-field', shotId: shot.id, field });
    }
    for (const [field, expected] of Object.entries(locked)) {
      if (continuity[field] !== expected) findings.push({ severity: 'blocker', code: 'locked-continuity-drift', shotId: shot.id, field, expected, actual: continuity[field] });
    }
  }

  return {
    stage: 'continuity',
    directionContext: { statement: direction.directionStatement, traits: [...(direction.traits ?? [])] },
    requiredFields, locked, findings,
    pass: !findings.some((f) => f.severity === 'blocker')
  };
}
