import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createProductionAdapter, executeProductionJob, executeProductionBatch } from '../modules/production-adapters/runtime.mjs';
import { createLocalDocumentAdapter } from '../modules/production-adapters/local-document-adapter.mjs';

async function tempRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-adapter-'));
}

test('local document adapter creates a real openable file and universal Artifact', async () => {
  const root = await tempRoot();
  const adapter = createLocalDocumentAdapter({ rootDir: root });
  const result = await executeProductionJob({
    adapter,
    job: {
      id: 'brand-guidelines', version: '1', kind: 'document/guidelines', operation: 'write-document', projectId: 'agency',
      format: 'markdown', input: { outputPath: 'guidelines/brand-guidelines.md', content: '# Brand Guidelines\n\nProduction proof.' },
      rights: { redistribution: 'project-delivery' }
    }
  });
  assert.equal(result.pass, true);
  assert.equal(result.status, 'produced');
  assert.equal(result.artifact.schema, 'ai-studio-os/artifact@1');
  assert.equal(result.artifact.status, 'produced');
  assert.equal(result.artifact.reviewStatus, 'unreviewed');
  assert.equal(result.artifact.releaseStatus, 'unmeasured');
  assert.equal(result.artifact.creator.adapterId, 'local-document');
  assert.equal(result.artifact.files.length, 1);
  assert.match(await fs.readFile(result.artifact.files[0].ref, 'utf8'), /Production proof/);
});

test('adapter success without a real file fails closed', async () => {
  const adapter = createProductionAdapter({
    id: 'empty-output', provider: 'fixture', operations: ['generate'], capabilities: ['image'],
    async execute() { return { files: [] }; }
  });
  const result = await executeProductionJob({ adapter, job: { id: 'hero', kind: 'image', operation: 'generate', requiredCapabilities: ['image'] } });
  assert.equal(result.pass, false);
  assert.equal(result.artifact.status, 'blocked');
  assert.ok(result.findings.some((item) => item.code === 'adapter-output-file-missing'));
});

test('truth-sensitive generation is blocked before adapter execution', async () => {
  let called = false;
  const adapter = createProductionAdapter({
    id: 'generator', provider: 'fixture', operations: ['generate'], capabilities: ['image'],
    async execute() { called = true; return { files: ['/tmp/should-not-exist.png'] }; }
  });
  const result = await executeProductionJob({
    adapter,
    job: { id: 'real-product', kind: 'image/product', operation: 'generate', truthSensitive: true, requiredCapabilities: ['image'] }
  });
  assert.equal(result.pass, false);
  assert.equal(called, false);
  assert.ok(result.findings.some((item) => item.code === 'truth-sensitive-generation-blocked'));
});

test('unavailable adapters and adapter exceptions become blocker artifacts', async () => {
  const unavailable = createProductionAdapter({ id: 'offline', operations: ['generate'], capabilities: ['image'], available: false, async execute() {} });
  const blocked = await executeProductionJob({ adapter: unavailable, job: { id: 'hero', kind: 'image', operation: 'generate', requiredCapabilities: ['image'] } });
  assert.equal(blocked.pass, false);
  assert.ok(blocked.findings.some((item) => item.code === 'production-adapter-unavailable'));

  const broken = createProductionAdapter({ id: 'broken', operations: ['generate'], capabilities: ['image'], async execute() { throw new Error('provider timeout'); } });
  const failed = await executeProductionJob({ adapter: broken, job: { id: 'hero-2', kind: 'image', operation: 'generate', requiredCapabilities: ['image'] } });
  assert.equal(failed.pass, false);
  assert.ok(failed.findings.some((item) => item.code === 'production-adapter-execution-failed'));
});

test('batch execution consumes routed assignments and returns a valid Artifact Graph', async () => {
  const root = await tempRoot();
  const adapter = createLocalDocumentAdapter({ rootDir: root });
  const jobs = [
    {
      id: 'strategy', version: '1', kind: 'document/strategy', operation: 'write-document', projectId: 'agency',
      requiredCapabilities: ['document'], input: { outputPath: 'strategy.md', content: '# Strategy' }
    },
    {
      id: 'guidelines', version: '1', kind: 'document/guidelines', operation: 'write-document', projectId: 'agency',
      requiredCapabilities: ['document'], dependencies: [{ artifactRef: 'strategy@1', relation: 'documents', impact: 'stale' }],
      input: { outputPath: 'guidelines.md', content: '# Guidelines' }
    }
  ];
  const assignments = jobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-document' }));
  const result = await executeProductionBatch({ jobs, assignments, adapters: [adapter] });
  assert.equal(result.pass, true);
  assert.equal(result.counts.produced, 2);
  assert.equal(result.counts.files, 2);
  assert.equal(result.graph.pass, true);
  assert.equal(result.graph.counts.artifacts, 2);
  assert.ok(result.graph.edges.some((edge) => edge.from === 'strategy@1' && edge.to === 'guidelines@1'));
});

test('batch refuses jobs the tool gateway did not route', async () => {
  const root = await tempRoot();
  const adapter = createLocalDocumentAdapter({ rootDir: root });
  const result = await executeProductionBatch({
    jobs: [{ id: 'product-photo', kind: 'image/product', operation: 'generate', truthSensitive: true }],
    assignments: [{ assetId: 'product-photo', action: 'capture-required', adapterId: null, reason: 'Real product requires capture.' }],
    adapters: [adapter]
  });
  assert.equal(result.pass, false);
  assert.equal(result.counts.blocked, 1);
  assert.ok(result.findings.some((item) => item.code === 'production-job-not-routed'));
});
