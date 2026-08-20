import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createLocalSvgAdapter,
  executeProductionJob,
  executeProductionBatch,
  inspectSvgMarkup
} from '../modules/production-adapters/index.mjs';

const SIMPLE_ICON = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 12h16M12 4v16" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

async function tempRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-svg-adapter-'));
}

test('inspects safe SVG structure without creative approval claims', () => {
  const result = inspectSvgMarkup(SIMPLE_ICON, { requireFontFree: true, vectorOnly: true });
  assert.equal(result.pass, true);
  assert.deepEqual(result.measurements.viewBox, [0, 0, 24, 24]);
  assert.equal(result.measurements.pathCount, 1);
  assert.equal(result.measurements.currentColorUses, 1);
});

test('writes a real SVG master file and returns an unreviewed universal Artifact', async () => {
  const root = await tempRoot();
  try {
    const adapter = createLocalSvgAdapter({ rootDir: root });
    const result = await executeProductionJob({
      adapter,
      job: {
        id: 'icon-frame',
        version: '1',
        kind: 'brand/icon-master',
        title: 'Frame calibration icon',
        projectId: 'agency',
        operation: 'generate',
        requiredCapabilities: ['svg', 'icon-master'],
        format: 'svg',
        input: { svg: SIMPLE_ICON, outputPath: 'icons/frame.svg', requireFontFree: true, vectorOnly: true }
      }
    });

    assert.equal(result.pass, true);
    assert.equal(result.artifact.schema, 'ai-studio-os/artifact@1');
    assert.equal(result.artifact.status, 'produced');
    assert.equal(result.artifact.reviewStatus, 'unreviewed');
    assert.equal(result.artifact.releaseStatus, 'unmeasured');
    assert.equal(result.artifact.files.length, 1);
    assert.equal(result.artifact.files[0].format, 'svg');
    assert.equal(result.artifact.files[0].hash.length, 64);
    assert.equal(result.artifact.measurements[0].type, 'svg-structure');
    assert.equal(result.artifact.measurements[0].pass, true);
    assert.equal(result.artifact.metadata.canonicalLogoApproval, false);
    assert.equal(result.artifact.metadata.creativeApproval, false);

    const written = await fs.readFile(result.artifact.files[0].ref, 'utf8');
    assert.match(written, /<svg\b/);
    assert.match(written, /currentColor/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('blocks unsafe SVG and does not write a production file', async () => {
  const root = await tempRoot();
  try {
    const adapter = createLocalSvgAdapter({ rootDir: root });
    const result = await executeProductionJob({
      adapter,
      job: {
        id: 'unsafe-icon', version: '1', kind: 'brand/icon-master', operation: 'generate',
        input: { svg: '<svg viewBox="0 0 24 24"><script>alert(1)</script><path d="M0 0h24v24z"/></svg>' }
      }
    });
    assert.equal(result.pass, false);
    assert.equal(result.artifact.status, 'blocked');
    assert.ok(result.findings.some((item) => item.code === 'svg-script-forbidden'));
    assert.ok(result.findings.some((item) => item.code === 'adapter-output-file-missing'));
    const files = await fs.readdir(root);
    assert.deepEqual(files, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('blocks font-dependent logo candidates when font-free master is required', async () => {
  const root = await tempRoot();
  try {
    const adapter = createLocalSvgAdapter({ rootDir: root });
    const result = await executeProductionJob({
      adapter,
      job: {
        id: 'logo-candidate', version: '1', kind: 'brand/logo-candidate', operation: 'generate',
        requiredCapabilities: ['svg', 'logo-candidate'],
        metadata: { requireFontFree: true },
        input: { svg: '<svg viewBox="0 0 120 40"><text x="10" y="25">Agency</text></svg>' }
      }
    });
    assert.equal(result.pass, false);
    assert.ok(result.findings.some((item) => item.code === 'svg-font-dependency-forbidden'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('edit operations still require a real source reference before adapter execution', async () => {
  const root = await tempRoot();
  try {
    const adapter = createLocalSvgAdapter({ rootDir: root });
    const result = await executeProductionJob({
      adapter,
      job: {
        id: 'icon-edit', version: '2', kind: 'brand/icon-master', operation: 'edit',
        input: { svg: SIMPLE_ICON }
      }
    });
    assert.equal(result.pass, false);
    assert.ok(result.findings.some((item) => item.code === 'edit-source-missing'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('batch vector production returns a valid Artifact Graph with real SVG files', async () => {
  const root = await tempRoot();
  try {
    const adapter = createLocalSvgAdapter({ rootDir: root });
    const jobs = [
      { id: 'icon-frame', version: '1', kind: 'brand/icon-master', operation: 'generate', input: { svg: SIMPLE_ICON, outputPath: 'icons/frame.svg' } },
      { id: 'icon-signal', version: '1', kind: 'brand/icon-master', operation: 'generate', input: { svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor"/></svg>', outputPath: 'icons/signal.svg' } }
    ];
    const assignments = jobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-svg' }));
    const batch = await executeProductionBatch({ jobs, assignments, adapters: [adapter] });
    assert.equal(batch.pass, true);
    assert.equal(batch.counts.produced, 2);
    assert.equal(batch.counts.files, 2);
    assert.equal(batch.graph.pass, true);
    assert.equal(batch.graph.artifacts.length, 2);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
