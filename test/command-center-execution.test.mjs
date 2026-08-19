import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { evaluateDeliveryGates } from '../modules/creative-engineering/index.mjs';
import {
  EXECUTION_PROJECTS,
  createExecutionJob,
  setJobStep,
  safeResolve
} from '../apps/creative-agency/execution-core.mjs';

test('production evidence can be required explicitly and missing evidence fails closed', () => {
  const gates = evaluateDeliveryGates({
    metrics: {
      bundle: { initialJsKb: 180, initialCssKb: 20 },
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
});

test('safeResolve blocks traversal outside preview/artifact roots', () => {
  const root = path.resolve('tmp-command-center');
  assert.equal(safeResolve(root, 'inside/file.png'), path.join(root, 'inside/file.png'));
  assert.throws(() => safeResolve(root, '../outside.txt'), /path traversal blocked/);
});
