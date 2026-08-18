function hasEvidence(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function evaluateReleaseReadiness({ implementation, codeReview, security, qa, release = {} } = {}) {
  if (!implementation || !codeReview || !security || !qa) throw new Error('release readiness requires all upstream gates');
  const blockers = [];
  if (!codeReview.pass) blockers.push('code-review-failed');
  if (!security.pass) blockers.push('security-review-failed');
  if (!qa.pass) blockers.push('qa-failed');
  if (implementation.rollbackRequired && !hasEvidence(release.rollbackPlan)) blockers.push('rollback-plan-required');
  if (implementation.observabilityRequired && !hasEvidence(release.observabilityPlan)) blockers.push('observability-plan-required');

  return {
    stage: 'release',
    pass: blockers.length === 0,
    blockers,
    rollbackPlan: hasEvidence(release.rollbackPlan) ? release.rollbackPlan : null,
    observabilityPlan: hasEvidence(release.observabilityPlan) ? release.observabilityPlan : null,
    risk: implementation.risk
  };
}
