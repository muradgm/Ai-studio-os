import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createGeminiImageAdapter,
  executeProductionJob,
  executeProductionBatch
} from '../modules/production-adapters/index.mjs';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);

async function tempRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-gemini-image-'));
}

function response(body, status = 200, requestId = 'gemini-request-1') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get(name) { return name.toLowerCase() === 'x-goog-request-id' ? requestId : null; } },
    async json() { return body; }
  };
}

function successBody({ data = PNG.toString('base64'), mimeType = 'image/png' } = {}) {
  return {
    id: 'interaction-1',
    output_image: { type: 'image', data, mime_type: mimeType },
    steps: []
  };
}

test('is unavailable without an explicit Gemini API credential', async () => {
  const adapter = createGeminiImageAdapter({ apiKey: '', fetchImpl: async () => { throw new Error('should-not-run'); } });
  assert.equal(adapter.available, false);
  const result = await executeProductionJob({
    adapter,
    job: { id: 'no-key', kind: 'image/generated', operation: 'generate', input: { prompt: 'A studio still life.' } }
  });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'production-adapter-unavailable'));
});

test('generates through Gemini Interactions, writes a real image and preserves provenance', async () => {
  const root = await tempRoot();
  const calls = [];
  try {
    const fetchImpl = async (url, options) => {
      calls.push({ url: String(url), options });
      return response(successBody());
    };
    const result = await executeProductionJob({
      adapter: createGeminiImageAdapter({ rootDir: root, apiKey: 'fake-gemini-key', fetchImpl }),
      job: {
        id: 'campaign-hero',
        version: '1',
        kind: 'image/generated',
        projectId: 'agency',
        operation: 'generate',
        requiredCapabilities: ['image-generation'],
        format: 'png',
        input: {
          prompt: 'A restrained editorial architecture image with warm afternoon light.',
          aspectRatio: '16:9',
          imageSize: '2K',
          outputPath: 'imagery/campaign-hero.png'
        }
      }
    });

    assert.equal(result.pass, true);
    assert.equal(result.artifact.status, 'produced');
    assert.equal(result.artifact.reviewStatus, 'unreviewed');
    assert.equal(result.artifact.releaseStatus, 'unmeasured');
    assert.equal(result.artifact.creator.provider, 'google-gemini');
    assert.equal(result.artifact.creator.model, 'gemini-3.1-flash-image');
    assert.equal(result.artifact.provenance.requestId, 'gemini-request-1');
    assert.equal(result.artifact.provenance.interactionId, 'interaction-1');
    assert.equal(result.artifact.metadata.aspectRatio, '16:9');
    assert.equal(result.artifact.metadata.imageSize, '2K');
    assert.equal(result.artifact.metadata.groundingEnabled, false);
    assert.equal(result.artifact.metadata.creativeApproval, false);
    assert.match(result.artifact.files[0].hash, /^sha256:[a-f0-9]{64}$/);
    assert.deepEqual(await fs.readFile(result.artifact.files[0].ref), PNG);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
    assert.equal(calls[0].options.headers['x-goog-api-key'], 'fake-gemini-key');
    const payload = JSON.parse(calls[0].options.body);
    assert.equal(payload.model, 'gemini-3.1-flash-image');
    assert.deepEqual(payload.response_format, {
      type: 'image', mime_type: 'image/png', aspect_ratio: '16:9', image_size: '2K'
    });
    assert.deepEqual(payload.input, [{ type: 'text', text: 'A restrained editorial architecture image with warm afternoon light.' }]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('edits with auditable local reference images encoded as Gemini image input blocks', async () => {
  const root = await tempRoot();
  const source = path.join(root, 'sources', 'product.png');
  const calls = [];
  try {
    await fs.mkdir(path.dirname(source), { recursive: true });
    await fs.writeFile(source, PNG);
    const fetchImpl = async (url, options) => {
      calls.push({ url: String(url), options });
      return response(successBody());
    };

    const result = await executeProductionJob({
      adapter: createGeminiImageAdapter({ rootDir: root, sourceRootDir: root, apiKey: 'fake-key', fetchImpl }),
      job: {
        id: 'product-edit',
        kind: 'image/edited',
        operation: 'edit',
        sourceFiles: [source],
        requiredCapabilities: ['image-edit'],
        input: { prompt: 'Retain the product exactly; replace only the background with warm paper.', outputPath: 'edited/product.png' }
      }
    });

    assert.equal(result.pass, true);
    assert.equal(result.artifact.metadata.sourceCount, 1);
    assert.equal(result.artifact.metadata.sourceBytes, PNG.length);
    const payload = JSON.parse(calls[0].options.body);
    assert.equal(payload.input.length, 2);
    assert.deepEqual(payload.input[0], { type: 'text', text: 'Retain the product exactly; replace only the background with warm paper.' });
    assert.equal(payload.input[1].type, 'image');
    assert.equal(payload.input[1].mime_type, 'image/png');
    assert.equal(payload.input[1].data, PNG.toString('base64'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('blocks edit sources outside the configured source root', async () => {
  const root = await tempRoot();
  const outsideRoot = await tempRoot();
  const outside = path.join(outsideRoot, 'outside.png');
  try {
    await fs.writeFile(outside, PNG);
    const result = await executeProductionJob({
      adapter: createGeminiImageAdapter({ rootDir: root, sourceRootDir: root, apiKey: 'fake-key', fetchImpl: async () => response(successBody()) }),
      job: { id: 'outside-edit', kind: 'image/edited', operation: 'edit', sourceFiles: [outside], input: { prompt: 'Edit this.' } }
    });
    assert.equal(result.pass, false);
    assert.ok(result.findings.some((item) => item.message.includes('gemini-image-edit-source-outside-root')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await fs.rm(outsideRoot, { recursive: true, force: true });
  }
});

test('enforces current model-specific image-size capability instead of silently downgrading', async () => {
  const root = await tempRoot();
  try {
    const result = await executeProductionJob({
      adapter: createGeminiImageAdapter({ rootDir: root, apiKey: 'fake-key', fetchImpl: async () => response(successBody()) }),
      job: {
        id: 'lite-4k',
        kind: 'image/generated',
        operation: 'generate',
        preferredModel: 'gemini-3.1-flash-lite-image',
        input: { prompt: 'Generate an image.', imageSize: '4K' }
      }
    });
    assert.equal(result.pass, false);
    assert.ok(result.findings.some((item) => item.message.includes('gemini-image-size-unsupported')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('preserves provider failures and missing image output as blocked artifacts', async () => {
  const root = await tempRoot();
  try {
    const failed = await executeProductionJob({
      adapter: createGeminiImageAdapter({ rootDir: root, apiKey: 'fake-key', fetchImpl: async () => response({ error: { status: 'RESOURCE_EXHAUSTED' } }, 429) }),
      job: { id: 'provider-failure', kind: 'image/generated', operation: 'generate', input: { prompt: 'Generate.' } }
    });
    assert.equal(failed.pass, false);
    assert.ok(failed.findings.some((item) => item.message.includes('gemini-image-request-failed:RESOURCE_EXHAUSTED')));

    const missing = await executeProductionJob({
      adapter: createGeminiImageAdapter({ rootDir: root, apiKey: 'fake-key', fetchImpl: async () => response({ id: 'interaction-empty', steps: [] }) }),
      job: { id: 'missing-output', kind: 'image/generated', operation: 'generate', input: { prompt: 'Generate.' } }
    });
    assert.equal(missing.pass, false);
    assert.ok(missing.findings.some((item) => item.message.includes('gemini-image-response-image-missing')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('accepts image content from model_output steps when output_image convenience field is absent', async () => {
  const root = await tempRoot();
  try {
    const body = {
      id: 'interaction-step',
      steps: [{ type: 'model_output', content: [{ type: 'image', data: PNG.toString('base64'), mime_type: 'image/png' }] }]
    };
    const result = await executeProductionJob({
      adapter: createGeminiImageAdapter({ rootDir: root, apiKey: 'fake-key', fetchImpl: async () => response(body) }),
      job: { id: 'step-image', kind: 'image/generated', operation: 'generate', input: { prompt: 'Generate.' } }
    });
    assert.equal(result.pass, true);
    assert.equal(result.artifact.provenance.interactionId, 'interaction-step');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('batch execution returns a valid Artifact Graph for Gemini output', async () => {
  const root = await tempRoot();
  try {
    const adapter = createGeminiImageAdapter({ rootDir: root, apiKey: 'fake-key', fetchImpl: async () => response(successBody()) });
    const batch = await executeProductionBatch({
      jobs: [{ id: 'gemini-asset', kind: 'image/generated', operation: 'generate', input: { prompt: 'Generate a launch image.' } }],
      assignments: [{ assetId: 'gemini-asset', action: 'route', adapterId: 'gemini-image' }],
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
