import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createOpenAIImageAdapter,
  executeProductionJob,
  executeProductionBatch
} from '../modules/production-adapters/index.mjs';

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0WsAAAAASUVORK5CYII=';

async function tempRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-openai-image-'));
}

function successResponse(requestId = 'req_test') {
  return new Response(JSON.stringify({
    data: [{ b64_json: PNG_BASE64 }],
    usage: { input_tokens: 1, output_tokens: 1 }
  }), {
    status: 200,
    headers: { 'content-type': 'application/json', 'x-request-id': requestId }
  });
}

function generationJob(overrides = {}) {
  return {
    id: 'campaign-hero',
    version: '1',
    kind: 'image/hero',
    operation: 'generate',
    projectId: 'agency',
    requiredCapabilities: ['image-generation'],
    truthSensitive: false,
    input: {
      prompt: 'A restrained editorial architecture image with warm paper light.',
      outputPath: 'imagery/campaign-hero.png',
      size: '1024x1024',
      quality: 'medium',
      background: 'opaque',
      moderation: 'auto'
    },
    ...overrides
  };
}

test('fails closed when no OpenAI API credential is available', async () => {
  const root = await tempRoot();
  const adapter = createOpenAIImageAdapter({ rootDir: root, apiKey: '', fetchImpl: async () => successResponse() });
  assert.equal(adapter.available, false);

  const result = await executeProductionJob({ job: generationJob(), adapter });
  assert.equal(result.pass, false);
  assert.equal(result.artifact.status, 'blocked');
  assert.ok(result.findings.some((item) => item.code === 'production-adapter-unavailable'));
});

test('generates a real PNG file and preserves provider provenance without claiming approval', async () => {
  const root = await tempRoot();
  const calls = [];
  const adapter = createOpenAIImageAdapter({
    rootDir: root,
    apiKey: 'test-key',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return successResponse('req_generate_1');
    }
  });

  const result = await executeProductionJob({ job: generationJob(), adapter });
  assert.equal(result.pass, true);
  assert.equal(result.artifact.status, 'produced');
  assert.equal(result.artifact.reviewStatus, 'unreviewed');
  assert.equal(result.artifact.releaseStatus, 'unmeasured');
  assert.equal(result.artifact.creator.provider, 'openai');
  assert.equal(result.artifact.creator.model, 'gpt-image-2');
  assert.equal(result.artifact.provenance.requestId, 'req_generate_1');
  assert.equal(result.artifact.provenance.endpoint, '/images/generations');
  assert.match(result.artifact.files[0].hash, /^sha256:[a-f0-9]{64}$/);

  const bytes = await fs.readFile(result.artifact.files[0].ref);
  assert.equal(bytes[0], 0x89);
  assert.equal(bytes[1], 0x50);

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/images\/generations$/);
  const payload = JSON.parse(calls[0].init.body);
  assert.equal(payload.model, 'gpt-image-2');
  assert.equal(payload.output_format, 'png');
  assert.equal(payload.size, '1024x1024');
  assert.equal(payload.quality, 'medium');
});

test('edits from a real local source using multipart image input', async () => {
  const root = await tempRoot();
  const source = path.join(root, 'source.png');
  await fs.writeFile(source, Buffer.from(PNG_BASE64, 'base64'));
  let observedBody = null;

  const adapter = createOpenAIImageAdapter({
    rootDir: root,
    apiKey: 'test-key',
    fetchImpl: async (url, init) => {
      assert.match(url, /\/images\/edits$/);
      observedBody = init.body;
      return successResponse('req_edit_1');
    }
  });

  const result = await executeProductionJob({
    adapter,
    job: {
      ...generationJob(),
      id: 'campaign-hero-edit',
      operation: 'edit',
      requiredCapabilities: ['image-edit'],
      sourceFiles: [source],
      input: {
        prompt: 'Keep the architecture; reduce visual clutter and warm the paper light.',
        outputPath: 'imagery/campaign-hero-edit.png',
        quality: 'high'
      }
    }
  });

  assert.equal(result.pass, true);
  assert.ok(observedBody instanceof FormData);
  assert.equal(observedBody.get('model'), 'gpt-image-2');
  assert.equal(observedBody.getAll('image[]').length, 1);
  assert.equal(result.artifact.provenance.endpoint, '/images/edits');
  assert.equal(result.artifact.metadata.sourceCount, 1);
});

test('rejects remote edit references because the adapter requires auditable local source files', async () => {
  const root = await tempRoot();
  const adapter = createOpenAIImageAdapter({ rootDir: root, apiKey: 'test-key', fetchImpl: async () => successResponse() });
  const result = await executeProductionJob({
    adapter,
    job: {
      ...generationJob(),
      operation: 'edit',
      requiredCapabilities: ['image-edit'],
      sourceFiles: ['https://example.com/source.png']
    }
  });

  assert.equal(result.pass, false);
  assert.equal(result.artifact.status, 'blocked');
  assert.ok(result.findings.some((item) => String(item.message).includes('openai-image-edit-source-local-file-required')));
});

test('blocks transparent gpt-image-2 requests instead of pretending unsupported output exists', async () => {
  const root = await tempRoot();
  const adapter = createOpenAIImageAdapter({ rootDir: root, apiKey: 'test-key', fetchImpl: async () => successResponse() });
  const result = await executeProductionJob({
    adapter,
    job: generationJob({ input: { ...generationJob().input, background: 'transparent' } })
  });

  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => String(item.message).includes('openai-image-transparent-background-unsupported')));
});

test('preserves provider moderation failure as a blocked production artifact', async () => {
  const root = await tempRoot();
  const adapter = createOpenAIImageAdapter({
    rootDir: root,
    apiKey: 'test-key',
    fetchImpl: async () => new Response(JSON.stringify({
      error: {
        type: 'image_generation_user_error',
        code: 'moderation_blocked',
        moderation_details: { moderation_stage: 'input', categories: ['harassment'] }
      }
    }), {
      status: 400,
      headers: { 'content-type': 'application/json', 'x-request-id': 'req_blocked_1' }
    })
  });

  const result = await executeProductionJob({ job: generationJob(), adapter });
  assert.equal(result.pass, false);
  assert.equal(result.artifact.status, 'blocked');
  assert.ok(result.findings.some((item) => String(item.message).includes('openai-image-request-failed:moderation_blocked')));
});

test('batch execution routes generated image output into a valid Artifact Graph', async () => {
  const root = await tempRoot();
  const adapter = createOpenAIImageAdapter({ rootDir: root, apiKey: 'test-key', fetchImpl: async () => successResponse('req_batch_1') });
  const job = generationJob({ id: 'brand-imagery-01', kind: 'brand/imagery' });

  const result = await executeProductionBatch({
    jobs: [job],
    assignments: [{ assetId: job.id, action: 'route', adapterId: 'openai-image', model: 'gpt-image-2' }],
    adapters: [adapter]
  });

  assert.equal(result.pass, true);
  assert.equal(result.counts.produced, 1);
  assert.equal(result.counts.files, 1);
  assert.equal(result.graph.pass, true);
  assert.equal(result.graph.artifacts[0].creator.provider, 'openai');
});
