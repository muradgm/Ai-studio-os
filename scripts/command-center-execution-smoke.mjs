import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startExecutionServer } from '../apps/creative-agency/execution-server.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smokeBaseline = path.join(root, 'artifacts/command-center/baselines/creative-agency');

async function json(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function runExecution(origin, iteration = 0) {
  const started = await json(`${origin}/api/executions`, {
    method: 'POST',
    body: JSON.stringify({ projectId: 'creative-agency', iteration })
  });
  assert.ok(started.job.id);

  let job = started.job;
  const deadline = Date.now() + 180000;
  while (!['complete', 'error'].includes(job.status) && Date.now() < deadline) {
    await sleep(900);
    job = (await json(`${origin}/api/executions/${job.id}`)).job;
  }
  assert.equal(job.status, 'complete', job.error ?? 'execution did not complete');
  return job;
}

function assertMeasuredRelease(job) {
  assert.equal(job.steps.find((step) => step.id === 'build').status, 'passed');
  assert.equal(job.steps.find((step) => step.id === 'capture').status, 'passed');
  assert.equal(job.artifacts.captures.length, 6);
  assert.equal(job.evidence.browser.passed, 6);
  assert.equal(job.evidence.responsive.mobile.pass, true);
  assert.equal(job.evidence.responsive.tablet.pass, true);
  assert.equal(job.evidence.responsive.desktop.pass, true);
  assert.equal(job.evidence.bundle.measured, true);

  assert.equal(job.evidence.webVitals.measured, true);
  assert.ok(Number.isFinite(job.evidence.webVitals.lcpMs));
  assert.ok(Number.isFinite(job.evidence.webVitals.inpMs));
  assert.ok(Number.isFinite(job.evidence.webVitals.cls));

  assert.equal(job.evidence.runtime.measured, true);
  assert.ok(Number.isFinite(job.evidence.runtime.fps));
  assert.ok(Number.isFinite(job.evidence.runtime.maxFrameMs));
  assert.ok(Number.isFinite(job.evidence.runtime.longTasks));

  assert.equal(job.evidence.accessibility.measured, true);
  assert.equal(job.evidence.accessibility.blockers, 0);
  assert.equal(job.evidence.accessibility.majors, 0);
  assert.ok(job.evidence.accessibility.keyboard.uniqueVisited >= 3);

  assert.equal(job.evidence.reducedMotion.measured, true);
  assert.equal(job.evidence.reducedMotion.pass, true);
  assert.equal(job.evidence.reducedMotion.continuousAnimations, 0);

  const codes = new Set(job.findings.map((finding) => finding.code));
  assert.equal([...codes].some((code) => code.endsWith('evidence-missing')), false, 'all required release evidence should be measured');
  assert.equal(job.releaseDecision.unmeasuredEvidence.length, 0);
  assert.equal(job.releaseDecision.status, 'ready', JSON.stringify(job.findings, null, 2));
  assert.equal(job.productionReady, true, JSON.stringify(job.findings, null, 2));
  assert.ok(job.artifacts.reportUrl);

  return codes;
}

await fs.rm(smokeBaseline, { recursive: true, force: true });

const runtime = await startExecutionServer({ port: 0 });
try {
  const status = await json(`${runtime.origin}/api/status`);
  assert.equal(status.status, 'ready');
  assert.equal(status.runtime, 'creative-engineering-v1.3');
  assert.equal(status.measurement, 'release-intelligence-v1');

  const first = await runExecution(runtime.origin, 0);
  assertMeasuredRelease(first);
  assert.ok(['baseline-seed', 'compared'].includes(first.evidence.visualRegression.status));

  const report = await json(first.artifacts.reportUrl);
  assert.equal(report.id, first.id);
  assert.equal(report.releaseDecision.status, 'ready');

  const approved = await json(`${runtime.origin}/api/executions/${first.id}/approve`, { method: 'POST', body: '{}' });
  assert.equal(approved.job.approval, 'iteration-approved');
  assert.equal(approved.job.productionReady, true);
  assert.equal(approved.job.steps.find((step) => step.id === 'approve').status, 'approved');
  assert.equal(approved.job.baseline.promoted, true);

  const second = await runExecution(runtime.origin, 1);
  assertMeasuredRelease(second);
  assert.equal(second.evidence.visualRegression.status, 'compared');
  assert.equal(second.evidence.visualRegression.pass, true);
  assert.equal(second.evidence.visualRegression.comparisons.length, 3);
  assert.equal(second.evidence.visualRegression.baselineJobId, first.id);

  console.log(JSON.stringify({
    pass: true,
    firstJob: first.id,
    secondJob: second.id,
    captures: second.artifacts.captures.length,
    webVitals: second.evidence.webVitals,
    runtime: second.evidence.runtime,
    accessibility: {
      blockers: second.evidence.accessibility.blockers,
      majors: second.evidence.accessibility.majors,
      keyboard: second.evidence.accessibility.keyboard
    },
    reducedMotion: second.evidence.reducedMotion,
    visualRegression: second.evidence.visualRegression,
    release: second.releaseDecision
  }, null, 2));
} finally {
  await runtime.close();
}
