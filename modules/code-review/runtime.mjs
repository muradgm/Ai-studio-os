const BLOCKING = new Set(['blocker', 'major']);

export function evaluateCodeReview({ findings = [], requiredTests = [], testResults = {} } = {}) {
  const normalizedFindings = findings.map((finding) => ({
    severity: finding.severity ?? 'minor',
    category: finding.category ?? 'general',
    evidence: finding.evidence ?? '',
    message: finding.message ?? 'unspecified finding'
  }));
  const missingTests = requiredTests.filter((test) => !(test in testResults));
  const failedTests = requiredTests.filter((test) => test in testResults && testResults[test] !== true);

  for (const test of missingTests) {
    normalizedFindings.push({
      severity: 'blocker',
      category: 'test-coverage',
      evidence: test,
      message: `Required test result missing: ${test}`
    });
  }
  for (const test of failedTests) {
    normalizedFindings.push({
      severity: 'blocker',
      category: 'test-failure',
      evidence: test,
      message: `Required test failed: ${test}`
    });
  }

  const invalidSeverity = normalizedFindings.find((finding) => !['blocker', 'major', 'minor', 'taste'].includes(finding.severity));
  if (invalidSeverity) {
    normalizedFindings.push({
      severity: 'blocker',
      category: 'review-schema',
      evidence: invalidSeverity.severity,
      message: `Unknown review severity: ${invalidSeverity.severity}`
    });
  }

  return {
    stage: 'code-review',
    pass: normalizedFindings.every((finding) => !BLOCKING.has(finding.severity)),
    findings: normalizedFindings,
    missingTests,
    failedTests,
    testResults: { ...testResults }
  };
}
