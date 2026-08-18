function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function buildQaPlan({ spec = {}, implementation } = {}) {
  const dimensions = ['functional', 'regression'];
  if (spec.authorizationSensitive) dimensions.push('permissionBoundary');
  if (spec.dataWrites || spec.migration) dimensions.push('failureRecovery');
  if ((spec.surfaces ?? []).includes('ui')) dimensions.push('accessibility');
  if (implementation?.risk?.level === 'high') dimensions.push('observability');

  return {
    stage: 'qa-plan',
    requiredDimensions: uniq(dimensions),
    requiredTests: implementation?.requiredTests ?? [],
    scenarios: {
      happyPath: 'Primary intended flow succeeds with valid permissions and input.',
      edgeCases: 'Boundary values and invalid transitions are rejected safely.',
      failurePath: 'Dependencies or writes can fail without corrupting state.',
      regression: 'Existing adjacent behavior remains intact.'
    }
  };
}

export function evaluateQa({ plan, results = {} } = {}) {
  if (!plan) throw new Error('QA evaluation requires plan');
  const missingDimensions = plan.requiredDimensions.filter((dimension) => results[dimension] !== true);
  return {
    stage: 'qa',
    pass: missingDimensions.length === 0,
    requiredDimensions: plan.requiredDimensions,
    results,
    missingDimensions,
    findings: missingDimensions.map((dimension) => ({
      severity: 'blocker',
      category: 'qa-coverage',
      message: `Required QA dimension not passed: ${dimension}`
    }))
  };
}
