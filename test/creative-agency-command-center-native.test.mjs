import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createExecutionArtifactGraph, createExecutionCommandCenterState } from '../apps/creative-agency/command-center-artifacts.mjs';

function completedJob() {
  return {
    id: 'exec-test', projectId: 'creative-agency', iteration: 0, status: 'complete', approval: 'pending', productionReady: true,
    steps: [
      { id: 'build', status: 'passed' }, { id: 'capture', status: 'passed' }, { id: 'review', status: 'passed' },
      { id: 'patch', status: 'passed' }, { id: 'approve', status: 'waiting' }
    ],
    artifacts: {
      previewUrl: 'http://127.0.0.1:8787/preview/creative-agency/',
      reportUrl: 'http://127.0.0.1:8787/artifacts/exec-test/release-report.json',
      captures: [
        { screenshot: 'http://127.0.0.1:8787/artifacts/exec-test/captures/desktop.png', reducedMotion: false },
        { screenshot: 'http://127.0.0.1:8787/artifacts/exec-test/captures/desktop-reduced.png', reducedMotion: true }
      ]
    },
    evidence: {
      browser: { measured: true, captures: 2, passed: 2 },
      responsive: { desktop: { pass: true } },
      webVitals: { measured: true, lcpMs: 1100, inpMs: 80, cls: 0.01 }
    },
    findings: [], patches: [], releaseDecision: { status: 'ready', productionReady: true }
  };
}

test('Command Center is rendered natively without the legacy decorator script', () => {
  const index = fs.readFileSync(new URL('../apps/creative-agency/index.html', import.meta.url), 'utf8');
  const main = fs.readFileSync(new URL('../apps/creative-agency/src/main.js', import.meta.url), 'utf8');
  assert.doesNotMatch(index, /command-center-redesign\.js/);
  assert.match(main, /renderCommandCenterView/);
  assert.match(main, /createExecutionCommandCenterState/);
});

test('initial native Command Center queue is planned and file-truthful', () => {
  const { graph, state } = createExecutionCommandCenterState(null, { projectId: 'creative-agency' });
  assert.equal(graph.pass, true);
  assert.equal(graph.counts.artifacts, 5);
  assert.equal(state.queue.length, 5);
  assert.equal(state.counts.files, 0);
  assert.equal(state.releaseState, 'review');
  assert.ok(state.queue.every((item) => item.state === 'queued'));
});

test('completed measured job projects actual browser files and keeps approval separate', () => {
  const job = completedJob();
  const graph = createExecutionArtifactGraph(job);
  const { state } = createExecutionCommandCenterState(job);
  assert.equal(graph.pass, true);
  const captures = state.queue.find((item) => item.artifactId === 'creative-agency:captures');
  const review = state.queue.find((item) => item.artifactId === 'creative-agency:release-evidence');
  assert.equal(captures.evidence.files, 2);
  assert.ok(review.evidence.measurements >= 3);
  assert.equal(review.releaseStatus, 'ready');
  assert.notEqual(state.releaseState, 'ready', 'iteration approval remains a separate gate');
});

test('blocked review remains blocked in the universal queue', () => {
  const job = completedJob();
  job.productionReady = false;
  job.steps.find((step) => step.id === 'review').status = 'blocked';
  job.releaseDecision = { status: 'blocked', productionReady: false };
  job.findings = [{ severity: 'blocker', code: 'a11y-blocker', message: 'Focus order failed.' }];
  const { state } = createExecutionCommandCenterState(job);
  assert.equal(state.releaseState, 'blocked');
  assert.ok(state.queue.some((item) => item.state === 'blocked'));
});
