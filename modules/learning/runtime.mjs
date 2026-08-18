export function classifyLearning(feedback) {
  const recurrence = Number(feedback.recurrence ?? 1);
  const scope = feedback.scope ?? 'project';
  const evidence = feedback.evidence ?? 'subjective';

  let classification = 'one-off';
  if (feedback.positiveExample) classification = 'strong-positive-example';
  else if (recurrence >= 2 && scope === 'cross-project') classification = 'general-principle';
  else if (recurrence >= 2) classification = 'recurring-failure';
  else if (scope === 'project') classification = 'project-specific';

  const promote = ['general-principle', 'recurring-failure', 'strong-positive-example'].includes(classification)
    && evidence !== 'weak';

  return { classification, promote };
}
