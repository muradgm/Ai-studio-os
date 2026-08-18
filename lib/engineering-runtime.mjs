import { buildImplementationPlan } from '../modules/engineering/runtime.mjs';
import { evaluateCodeReview } from '../modules/code-review/runtime.mjs';
import { buildSecurityPlan, evaluateSecurity } from '../modules/security/runtime.mjs';
import { buildQaPlan, evaluateQa } from '../modules/qa/runtime.mjs';
import { evaluateReleaseReadiness } from '../modules/release/runtime.mjs';

export function runEngineeringRuntime(input) {
  const implementation = buildImplementationPlan({
    intent: input.intent,
    spec: input.spec ?? {},
    architecture: input.architecture ?? {}
  });
  const codeReview = evaluateCodeReview({
    findings: input.review?.findings ?? [],
    requiredTests: implementation.requiredTests,
    testResults: input.review?.testResults ?? {}
  });
  const securityPlan = buildSecurityPlan(input.spec ?? {});
  const security = evaluateSecurity({
    plan: securityPlan,
    controlEvidence: input.security?.controlEvidence ?? {},
    findings: input.security?.findings ?? []
  });
  const qaPlan = buildQaPlan({ spec: input.spec ?? {}, implementation });
  const qa = evaluateQa({ plan: qaPlan, results: input.qa?.results ?? {} });
  const release = evaluateReleaseReadiness({
    implementation,
    codeReview,
    security,
    qa,
    release: input.release ?? {}
  });

  return {
    id: input.id,
    taskType: input.taskType,
    status: release.pass ? 'release-ready' : 'blocked',
    stages: ['engineering', 'code-review', 'security', 'qa', 'release'],
    implementation,
    codeReview,
    securityPlan,
    security,
    qaPlan,
    qa,
    release
  };
}

export function validateEngineeringBenchmark(output, expected) {
  const failures = [];
  for (const stage of expected.requiredStages ?? []) {
    if (!output.stages.includes(stage)) failures.push(`missing stage: ${stage}`);
  }
  if (expected.riskLevel && output.implementation.risk.level !== expected.riskLevel) {
    failures.push(`expected risk ${expected.riskLevel}, got ${output.implementation.risk.level}`);
  }
  for (const control of expected.requiredSecurityControls ?? []) {
    if (!output.securityPlan.requiredControls.includes(control)) failures.push(`missing security control: ${control}`);
    if (!output.security.implementedControls.includes(control)) failures.push(`missing security evidence: ${control}`);
  }
  for (const dimension of expected.requiredQaDimensions ?? []) {
    if (!output.qaPlan.requiredDimensions.includes(dimension)) failures.push(`missing QA dimension: ${dimension}`);
  }
  if (expected.releaseReady === true && !output.release.pass) failures.push(`release blocked: ${output.release.blockers.join(', ')}`);
  if (expected.releaseReady === false && output.release.pass) failures.push('release unexpectedly ready');
  return { pass: failures.length === 0, failures };
}
