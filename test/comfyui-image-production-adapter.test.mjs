import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createComfyUIImageAdapter,
  executeProductionJob,
  executeProductionBatch
} from '../modules/production-adapters/index.mjs';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
const WORKFLOW = {
  '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'demo.safetensors' } },
  '2': { class_type: 'SaveImage', inputs: { filename_prefix: 'agency' } }
};

async function tempRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-comfyui-adapter-'));
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return body; }
  };
}

function binaryResponse(bytes, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }
  };
}

function createHappyFetch(calls) {
  return async (url, options = {}) => {
    const value = String(url);
    calls.push({ url: value, method: options.method ?? 'GET', body: options.body ?? null });
    if (value.endsWith('/prompt')) return jsonResponse({ prompt_id: 'prompt-1', number: 1 });
    if (value.endsWith('/history/prompt-1')) {
      return jsonResponse({
        'prompt-1': {
          outputs: {
            '2': { images: [{ filename: 'agency_00001_.png', subfolder: '', type: 'output' }] }
          },
          status: { status_str: 'success', completed: true }
        }
      });
    }
    if (value.includes('/view?')) return binaryResponse(PNG);
    throw new Error(`unexpected-url:${value}`);
  };
}

test('defaults to local-only and blocks a remote ComfyUI base URL unless explicitly allowed', async () => {
  const adapter = createComfyUIImageAdapter({
    baseUrl: 'https://example.com:8188',
    fetchImpl: async () => { throw new Error('should-not-run'); }
  });
  assert.equal(adapter.available, false);

  const result = await executeProductionJob({
    adapter,
    job: {
      id: 'remote-blocked',
      kind: 'image/generated',
      operation: 'generate',
      requiredCapabilities: ['image-generation'],
      input: { workflow: WORKFLOW }
    }
  });
  assert.equal(result.pass, false);
  assert.equal(result.artifact.status, 'blocked');
  assert.ok(result.findings.some((item) => item.code === 'production-adapter-unavailable'));
});

test('submits a workflow, polls history, downloads a real raster file and returns an unreviewed Artifact', async () => {
  const root = await tempRoot();
  const calls = [];
  try {
    const adapter = createComfyUIImageAdapter({
      rootDir: root,
      fetchImpl: createHappyFetch(calls),
      pollIntervalMs: 0,
      sleepImpl: async () => {}
    });

    const result = await executeProductionJob({
      adapter,
      job: {
        id: 'agency-hero',
        version: '1',
        kind: 'image/generated',
        projectId: 'agency',
        operation: 'generate',
        requiredCapabilities: ['image', 'local-execution'],
        input: {
          workflow: WORKFLOW,
          outputNodeId: '2',
          outputPath: 'imagery/agency-hero'
        }
      }
    });

    assert.equal(result.pass, true);
    assert.equal(result.artifact.status, 'produced');
    assert.equal(result.artifact.reviewStatus, 'unreviewed');
    assert.equal(result.artifact.releaseStatus, 'unmeasured');
    assert.equal(result.artifact.creator.provider, 'comfyui');
    assert.equal(result.artifact.provenance.requestId, 'prompt-1');
    assert.equal(result.artifact.files[0].format, 'png');
    assert.match(result.artifact.files[0].hash, /^sha256:[a-f0-9]{64}$/);
    assert.equal(result.artifact.metadata.creativeApproval, false);
    assert.equal(result.artifact.metadata.releaseApproval, false);

    const written = await fs.readFile(result.artifact.files[0].ref);
    assert.deepEqual(written, PNG);
    assert.equal(calls[0].method, 'POST');
    const payload = JSON.parse(calls[0].body);
    assert.deepEqual(payload.prompt, WORKFLOW);
    assert.ok(calls.some((call) => call.url.includes('/history/prompt-1')));
    assert.ok(calls.some((call) => call.url.includes('/view?')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('supports current history-array response shape as well as legacy prompt-id keyed history', async () => {
  const root = await tempRoot();
  try {
    const fetchImpl = async (url) => {
      const value = String(url);
      if (value.endsWith('/prompt')) return jsonResponse({ prompt_id: 'prompt-array' });
      if (value.endsWith('/history/prompt-array')) {
        return jsonResponse({
          history: [{
            prompt_id: 'prompt-array',
            outputs: { '9': { images: [{ filename: 'array.png', subfolder: 'batch', type: 'output' }] } },
            status: { status_str: 'completed', completed: true }
          }]
        });
      }
      if (value.includes('/view?')) return binaryResponse(PNG);
      throw new Error(`unexpected-url:${value}`);
    };

    const result = await executeProductionJob({
      adapter: createComfyUIImageAdapter({ rootDir: root, fetchImpl, pollIntervalMs: 0, sleepImpl: async () => {} }),
      job: { id: 'history-array', kind: 'image/generated', operation: 'generate', input: { workflow: WORKFLOW } }
    });
    assert.equal(result.pass, true);
    assert.equal(result.artifact.metadata.outputNodeId, '9');
    assert.equal(result.artifact.metadata.providerSubfolder, 'batch');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('fails closed when the workflow is missing', async () => {
  const root = await tempRoot();
  try {
    const result = await executeProductionJob({
      adapter: createComfyUIImageAdapter({ rootDir: root, fetchImpl: async () => jsonResponse({}) }),
      job: { id: 'no-workflow', kind: 'image/generated', operation: 'generate', input: {} }
    });
    assert.equal(result.pass, false);
    assert.ok(result.findings.some((item) => item.code === 'production-adapter-execution-failed'));
    assert.ok(result.findings.some((item) => item.message.includes('comfyui-workflow-missing')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('fails closed on provider execution failure and timeout', async () => {
  const root = await tempRoot();
  try {
    const failedFetch = async (url) => {
      const value = String(url);
      if (value.endsWith('/prompt')) return jsonResponse({ prompt_id: 'failed-1' });
      if (value.endsWith('/history/failed-1')) {
        return jsonResponse({ 'failed-1': { outputs: {}, status: { status_str: 'error', completed: true } } });
      }
      throw new Error(`unexpected-url:${value}`);
    };
    const failed = await executeProductionJob({
      adapter: createComfyUIImageAdapter({ rootDir: root, fetchImpl: failedFetch, pollIntervalMs: 0, sleepImpl: async () => {} }),
      job: { id: 'failed', kind: 'image/generated', operation: 'generate', input: { workflow: WORKFLOW } }
    });
    assert.equal(failed.pass, false);
    assert.ok(failed.findings.some((item) => item.message.includes('comfyui-execution-failed')));

    const timeoutFetch = async (url) => {
      const value = String(url);
      if (value.endsWith('/prompt')) return jsonResponse({ prompt_id: 'timeout-1' });
      if (value.endsWith('/history/timeout-1')) return jsonResponse({});
      throw new Error(`unexpected-url:${value}`);
    };
    const timedOut = await executeProductionJob({
      adapter: createComfyUIImageAdapter({ rootDir: root, fetchImpl: timeoutFetch, maxPolls: 2, pollIntervalMs: 0, sleepImpl: async () => {} }),
      job: { id: 'timeout', kind: 'image/generated', operation: 'generate', input: { workflow: WORKFLOW } }
    });
    assert.equal(timedOut.pass, false);
    assert.ok(timedOut.findings.some((item) => item.message.includes('comfyui-execution-timeout')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('batch execution returns a dependency-valid Artifact Graph for ComfyUI output', async () => {
  const root = await tempRoot();
  try {
    const adapter = createComfyUIImageAdapter({
      rootDir: root,
      fetchImpl: createHappyFetch([]),
      pollIntervalMs: 0,
      sleepImpl: async () => {}
    });
    const batch = await executeProductionBatch({
      jobs: [{
        id: 'local-raster-1',
        kind: 'image/generated',
        operation: 'generate',
        requiredCapabilities: ['image-generation'],
        input: { workflow: WORKFLOW }
      }],
      assignments: [{ assetId: 'local-raster-1', action: 'route', adapterId: 'comfyui-image' }],
      adapters: [adapter]
    });
    assert.equal(batch.pass, true);
    assert.equal(batch.counts.produced, 1);
    assert.equal(batch.counts.files, 1);
    assert.equal(batch.graph.pass, true);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
