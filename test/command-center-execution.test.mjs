import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  evaluateDeliveryGates,
  decideVisualRegression,
  measurementFindings,
  summarizeAccessibilityIssues,
  synthesizeReleaseDecision
} from '../modules/creative-engineering/index.mjs';
import {
  EXECUTION_PROJECTS,
  createExecutionJob,
  setJobStep,
  safeResolve
} from '../apps/creative-agency/execution-core.mjs';

test('production evidence can be required explicitly and measured:false fails closed', () => {
  const gates = evaluateDeliveryGates({
    metrics: {
      webVitals: { measured: false },
      bundle: { initialJsKb: 180, initialCssKb: 20, measured: true },
      responsive: { mobile: { pass: true }, tablet: { pass: true }, desktop: { pass: true } }
    },
    requiredEvidence: ['webVitals', 'runtime', 'bundle', 'accessibility', 'responsive']
  });
  assert.equal(gates.productionReady, false);
  const codes = gates.findings.map((item) => item.code);
  assert.ok(codes.includes('web-vitals-evidence-missing'));
  assert.ok(codes.includes('runtime-evidence-missing'));
  assert.ok(codes.includes('accessibility-evidence-missing'));
  assert.ok(!codes.includes('bundle-evidence-missing'));
  assert.ok(!codes.includes('responsive-evidence-missing'));
});

test('measured release evidence can satisfy the v1.3 delivery gate', () => {
  const gates = evaluateDeliveryGates({
    metrics: {
      webVitals: { measured: true, lcpMs: 1200, inpMs: 80, cls: 0.01 },
      runtime: { measured: true, fps: 60, maxFrameMs: 17, longTasks: 0 },
      bundle: { measured: true, initialJsKb: 180, initialCssKb: 20 },
      accessibility: { measured: true, blockers: 0, majors: 0 },
      responsive: { mobile: { pass: true }, tablet: { pass: true }, desktop: { pass: true } },
      reducedMotion: { measured: true, pass: true, continuousAnimations: 0 },
      visualRegression: { measured: true, status: 'baseline-seed', pass: true }
    },
    requiredEvidence: ['webVitals', 'runtime', 'bundle', 'accessibility', 'responsive', 'reducedMotion', 'visualRegression']
  });
  assert.equal(gates.productionReady, true);
  assert.equal(gates.findings.length, 0);
});

test('reduced motion and visual regression participate in release gates', () => {
  const gates = evaluateDeliveryGates({
    metrics: {
      reducedMotion: { measured: true, pass: false, continuousAnimations: 2 },
      visualRegression: { measured: true, status: 'compared', pass: false, maxChangedRatio: 0.04, threshold: 0.015 },
      responsive: { mobile: { pass: true }, tablet: { pass: true }, desktop: { pass: true } }
    }
  });
  const codes = gates.findings.map((item) => item.code);
  assert.ok(codes.includes('reduced-motion-gate-failed'));
  assert.ok(codes.includes('visual-regression-gate-failed'));
  assert.equal(gates.productionReady, false);
});

test('visual regression seeds first baseline and fails over threshold after comparison', () => {
  const seed = decideVisualRegression([], { threshold: 0.015 });
  assert.equal(seed.status, 'baseline-seed');
  assert.equal(seed.pass, true);

  const compared = decideVisualRegression([
    { viewport: 'mobile', dimensionsMatch: true, changedRatio: 0.004 },
    { viewport: 'tablet', dimensionsMatch: true, changedRatio: 0.021 }
  ], { threshold: 0.015 });
  assert.equal(compared.status, 'compared');
  assert.equal(compared.pass, false);
  assert.equal(compared.maxChangedRatio, 0.021);
});

test('accessibility summaries and release synthesis keep blockers and majors explicit', () => {
  const issues = [
    { severity: 'blocker', code: 'keyboard-path-trapped' },
    { severity: 'major', code: 'form-label-missing' }
  ];
  assert.deepEqual(summarizeAccessibilityIssues(issues), { blockers: 1, majors: 1, minors: 0 });

  const evidence = {
    webVitals: { measured: true },
    runtime: { measured: true }
  };
  const decision = synthesizeReleaseDecision({
    findings: issues,
    evidence,
    requiredEvidence: ['webVitals', 'runtime', 'accessibility']
  });
  assert.equal(decision.status, 'blocked');
  assert.equal(decision.productionReady, false);
  assert.deepEqual(decision.unmeasuredEvidence, ['accessibility']);
});

test('measurement findings preserve actionable accessibility issue details', () => {
  const findings = measurementFindings({
    accessibility: {
      issues: [{ severity: 'major', code: 'form-label-missing', message: 'Label it.' }]
    }
  });
  assert.deepEqual(findings.map((item) => item.code), ['form-label-missing']);
});

test('Command Center execution project is whitelisted and has no arbitrary command field', () => {
  const project = EXECUTION_PROJECTS['creative-agency'];
  assert.equal(project.buildScript, 'build:web');
  assert.equal(Object.hasOwn(project, 'command'), false);
  assert.equal(Object.hasOwn(project, 'args'), false);
});

test('execution job uses bounded state transitions and keeps iteration approval separate', () => {
  const job = createExecutionJob({ id: 'exec-test', projectId: 'creative-agency' });
  assert.equal(job.status, 'queued');
  setJobStep(job, 'build', 'running');
  assert.equal(job.stage, 'build');
  assert.equal(job.approval, 'pending');
  assert.equal(job.productionReady, false);
  assert.equal(job.releaseDecision.status, 'unmeasured');
  assert.equal(job.artifacts.reportUrl, null);
});

test('safeResolve blocks traversal outside preview/artifact roots', () => {
  const root = path.resolve('tmp-command-center');
  assert.equal(safeResolve(root, 'inside/file.png'), path.join(root, 'inside/file.png'));
  assert.throws(() => safeResolve(root, '../outside.txt'), /path traversal blocked/);
});
