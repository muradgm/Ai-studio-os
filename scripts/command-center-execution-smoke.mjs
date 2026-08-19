import assert from 'node:assert/strict';
import { startExecutionServer } from '../apps/creative-agency/execution-server.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}

const runtime = await startExecutionServer({ port: 0 });
try {
  const status = await json(`${runtime.origin}/api/status`);
  assert.equal(status.status, 'ready');
  assert.equal(status.runtime, 'creative-engineering-v1.3');

  const started = await json(`${runtime.origin}/api/executions`, {
    method: 'POST',
    body: JSON.stringify({ projectId: 'creative-agency' })
  });
  assert.ok(started.job.id);

  let job = started.job;
  const deadline = Date.now() + 150000;
  while (!['complete', 'error'].includes(job.status) && Date.now() < deadline) {
    await sleep(900);
    job = (await json(`${runtime.origin}/api/executions/${job.id}`)).job;
  }

  assert.equal(job.status, 'complete', job.error ?? 'execution did not complete');
  assert.equal(job.steps.find((step) => step.id === 'build').status, 'passed');
  assert.equal(job.steps.find((step) => step.id === 'capture').status, 'passed');
  assert.equal(job.artifacts.captures.length, 6);
  assert.equal(job.evidence.browser.passed, 6);
  assert.equal(job.evidence.responsive.mobile.pass, true);
  assert.equal(job.evidence.responsive.tablet.pass, true);
  assert.equal(job.evidence.responsive.desktop.pass, true);
  assert.equal(job.evidence.bundle.measured, true);
  assert.equal(job.productionReady, false, 'unmeasured release evidence must block production readiness');

  const codes = new Set(job.findings.map((finding) => finding.code));
  assert.ok(codes.has('web-vitals-evidence-missing'));
  assert.ok(codes.has('runtime-evidence-missing'));
  assert.ok(codes.has('accessibility-evidence-missing'));

  const approved = await json(`${runtime.origin}/api/executions/${job.id}/approve`, { method: 'POST', body: '{}' });
  assert.equal(approved.job.approval, 'iteration-approved');
  assert.equal(approved.job.productionReady, false, 'iteration approval must never override production gates');
  assert.equal(approved.job.steps.find((step) => step.id === 'approve').status, 'approved');

  console.log(JSON.stringify({
    pass: true,
    job: job.id,
    captures: job.artifacts.captures.length,
    responsive: Object.fromEntries(Object.entries(job.evidence.responsive).map(([id, item]) => [id, item.pass])),
    productionReady: job.productionReady,
    releaseBlockers: [...codes].filter((code) => code.endsWith('evidence-missing'))
  }, null, 2));
} finally {
  await runtime.close();
}
