import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { classifyChangeRisk, buildImplementationPlan } from '../modules/engineering/runtime.mjs';
import { evaluateCodeReview } from '../modules/code-review/runtime.mjs';
import { buildSecurityPlan, evaluateSecurity } from '../modules/security/runtime.mjs';
import { buildQaPlan, evaluateQa } from '../modules/qa/runtime.mjs';
import { evaluateReleaseReadiness } from '../modules/release/runtime.mjs';
import { runEngineeringRuntime, validateEngineeringBenchmark } from '../lib/engineering-runtime.mjs';

const input = JSON.parse(fs.readFileSync(new URL('../benchmarks/002-workspace-role-update/input.json', import.meta.url)));
const expected = JSON.parse(fs.readFileSync(new URL('../benchmarks/002-workspace-role-update/expected.json', import.meta.url)));

test('permission-sensitive state mutation is high risk', () => {
  const risk = classifyChangeRisk({ authRequired: true, authorizationSensitive: true, dataWrites: true, highImpact: true });
  assert.equal(risk.level, 'high');
  assert.ok(risk.factors.includes('authorizationSensitive'));
});

test('authorization-sensitive change implies authentication, authorization, and audit controls', () => {
  const plan = buildSecurityPlan({ authorizationSensitive: true, dataWrites: true });
  assert.ok(plan.requiredControls.includes('authentication'));
  assert.ok(plan.requiredControls.includes('authorization'));
  assert.ok(plan.requiredControls.includes('audit-log'));
  assert.ok(plan.requiredControls.includes('transaction-boundary'));
});

test('missing authorization evidence blocks security review', () => {
  const plan = buildSecurityPlan({ authorizationSensitive: true });
  const result = evaluateSecurity({
    plan,
    controlEvidence: {
      authentication: 'session middleware',
      'least-privilege': 'member role denied by policy',
      'audit-log': 'audit event emitted'
    },
    findings: []
  });
  assert.equal(result.pass, false);
  assert.ok(result.missingControls.includes('authorization'));
});

test('missing required test result blocks code review', () => {
  const result = evaluateCodeReview({ requiredTests: ['permission-denied'], testResults: {}, findings: [] });
  assert.equal(result.pass, false);
  assert.deepEqual(result.missingTests, ['permission-denied']);
});

test('failed required test blocks code review', () => {
  const result = evaluateCodeReview({ requiredTests: ['permission-denied'], testResults: { 'permission-denied': false }, findings: [] });
  assert.equal(result.pass, false);
  assert.deepEqual(result.failedTests, ['permission-denied']);
});

test('taste-only review note does not block code review', () => {
  const result = evaluateCodeReview({ findings: [{ severity: 'taste', message: 'prefer different name' }] });
  assert.equal(result.pass, true);
});

test('permission-sensitive QA requires permission boundary coverage', () => {
  const implementation = buildImplementationPlan({ intent: 'change role', spec: { authorizationSensitive: true, dataWrites: true, surfaces: ['ui'] } });
  const plan = buildQaPlan({ spec: implementation.spec, implementation });
  assert.ok(plan.requiredDimensions.includes('permissionBoundary'));
  const result = evaluateQa({ plan, results: { functional: true, regression: true, failureRecovery: true, accessibility: true } });
  assert.equal(result.pass, false);
  assert.ok(result.missingDimensions.includes('permissionBoundary'));
});

test('high-risk release requires rollback and observability', () => {
  const implementation = buildImplementationPlan({ intent: 'change role', spec: { authRequired: true, authorizationSensitive: true, dataWrites: true, highImpact: true } });
  const passGate = { pass: true };
  const result = evaluateReleaseReadiness({ implementation, codeReview: passGate, security: passGate, qa: passGate, release: {} });
  assert.equal(result.pass, false);
  assert.ok(result.blockers.includes('rollback-plan-required'));
  assert.ok(result.blockers.includes('observability-plan-required'));
});

test('workspace role benchmark passes all engineering gates', () => {
  const output = runEngineeringRuntime(input);
  const result = validateEngineeringBenchmark(output, expected);
  assert.equal(result.pass, true, result.failures.join('\n'));
  assert.equal(output.status, 'release-ready');
  assert.equal(output.security.pass, true);
  assert.equal(output.qa.pass, true);
  assert.equal(output.codeReview.failedTests.length, 0);
});

test('authorization-sensitive implementation derives boundary tests automatically', () => {
  const plan = buildImplementationPlan({ intent: 'change role', spec: { authorizationSensitive: true, dataWrites: true } });
  assert.ok(plan.requiredTests.includes('unauthenticated-request-denied'));
  assert.ok(plan.requiredTests.includes('authorized-request-succeeds'));
  assert.ok(plan.requiredTests.includes('unauthorized-request-denied'));
  assert.ok(plan.requiredTests.includes('write-failure-recovery'));
  assert.ok(plan.invariants.includes('Unauthenticated callers cannot perform the operation.'));
});

test('whitespace-only release evidence does not satisfy high-risk gate', () => {
  const implementation = buildImplementationPlan({ intent: 'change role', spec: { authorizationSensitive: true, dataWrites: true, highImpact: true } });
  const passGate = { pass: true };
  const result = evaluateReleaseReadiness({
    implementation,
    codeReview: passGate,
    security: passGate,
    qa: passGate,
    release: { rollbackPlan: '   ', observabilityPlan: '\n' }
  });
  assert.equal(result.pass, false);
  assert.ok(result.blockers.includes('rollback-plan-required'));
  assert.ok(result.blockers.includes('observability-plan-required'));
});
