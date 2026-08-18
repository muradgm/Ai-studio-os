function uniq(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function hasEvidence(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildSecurityPlan(spec = {}) {
  const controls = [];
  if (spec.authRequired || spec.authorizationSensitive) controls.push('authentication');
  if (spec.authorizationSensitive) controls.push('authorization', 'least-privilege', 'audit-log');
  if (spec.dataWrites) controls.push('input-validation', 'transaction-boundary');
  if (spec.publicApi) controls.push('rate-limit', 'schema-validation');
  if (spec.externalIO) controls.push('outbound-request-boundary', 'timeout-and-failure-handling');
  if (spec.handlesPii) controls.push('data-minimization', 'sensitive-log-redaction');
  if (spec.fileUpload) controls.push('file-type-validation', 'size-limit', 'isolated-storage');
  if (spec.handlesMoney) controls.push('idempotency', 'audit-log');

  return {
    stage: 'security-plan',
    requiredControls: uniq(controls),
    attackSurfaces: uniq([
      (spec.authRequired || spec.authorizationSensitive) && 'identity',
      spec.authorizationSensitive && 'permission-boundary',
      spec.dataWrites && 'state-mutation',
      spec.publicApi && 'public-api',
      spec.externalIO && 'external-io',
      spec.fileUpload && 'file-upload',
      spec.handlesPii && 'personal-data'
    ])
  };
}

export function evaluateSecurity({ plan, controlEvidence = {}, findings = [] } = {}) {
  if (!plan) throw new Error('security evaluation requires plan');
  const implementedControls = plan.requiredControls.filter((control) => hasEvidence(controlEvidence[control]));
  const missingControls = plan.requiredControls.filter((control) => !hasEvidence(controlEvidence[control]));
  const normalizedFindings = findings.map((finding) => ({
    severity: finding.severity ?? 'medium',
    category: finding.category ?? 'security',
    evidence: finding.evidence ?? '',
    message: finding.message ?? 'unspecified security finding'
  }));
  for (const control of missingControls) {
    normalizedFindings.push({
      severity: 'high',
      category: 'missing-control-evidence',
      evidence: control,
      message: `Required security control lacks evidence: ${control}`
    });
  }
  const blocks = new Set(['critical', 'high', 'medium']);
  return {
    stage: 'security',
    pass: normalizedFindings.every((finding) => !blocks.has(finding.severity)),
    requiredControls: plan.requiredControls,
    implementedControls,
    controlEvidence: { ...controlEvidence },
    missingControls,
    findings: normalizedFindings
  };
}
