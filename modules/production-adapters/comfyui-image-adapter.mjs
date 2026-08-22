import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createProductionAdapter } from './runtime.mjs';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8188';

function clean(value) {
  return String(value ?? '').trim();
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function isLoopbackHost(hostname) {
  const host = clean(hostname).toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
}

function normalizeBaseUrl(value) {
  const url = new URL(clean(value || DEFAULT_BASE_URL));
  url.pathname = url.pathname.replace(/\/+$/, '');
  return url;
}

function isInsideRoot(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const prefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(prefix);
}

function extensionFor(format) {
  if (format === 'jpeg') return '.jpg';
  return `.${format}`;
}

function detectRasterFormat(buffer) {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return '';
}

function resolveOutputPath(root, requested, fallbackStem, format) {
  const raw = clean(requested || fallbackStem).replace(/\\/g, '/');
  const normalized = path.posix.normalize(raw).replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error('comfyui-output-path-invalid');
  }

  const ext = path.posix.extname(normalized).toLowerCase();
  const accepted = format === 'jpeg' ? new Set(['.jpg', '.jpeg']) : new Set([extensionFor(format)]);
  const relative = ext ? normalized : `${normalized}${extensionFor(format)}`;
  if (ext && !accepted.has(ext)) throw new Error('comfyui-output-extension-mismatch');

  const target = path.resolve(root, relative);
  if (!isInsideRoot(root, target)) throw new Error('comfyui-output-path-outside-root');
  return { relative, target };
}

async function readJson(response, code) {
  let body;
  try { body = await response.json(); }
  catch { throw new Error(`${code}:invalid-json`); }
  if (!response.ok) throw new Error(`${code}:http-${response.status}`);
  return body;
}

function normalizeHistory(body, promptId) {
  if (!body || typeof body !== 'object') return null;
  if (body[promptId] && typeof body[promptId] === 'object') return body[promptId];
  if (Array.isArray(body.history)) return body.history.find((item) => clean(item?.prompt_id) === promptId) ?? null;
  if (clean(body.prompt_id) === promptId) return body;
  return null;
}

function historyState(entry) {
  const status = object(entry?.status);
  const state = clean(status.status_str ?? entry?.state ?? entry?.status).toLowerCase();
  const failed = ['error', 'failed', 'failure'].includes(state);
  const complete = status.completed === true || ['success', 'completed', 'complete'].includes(state) || Object.keys(object(entry?.outputs)).length > 0;
  return { state, failed, complete };
}

function selectOutputImage(entry, outputNodeId) {
  const outputs = object(entry?.outputs);
  const nodeIds = outputNodeId ? [clean(outputNodeId)] : Object.keys(outputs);
  for (const nodeId of nodeIds) {
    const node = object(outputs[nodeId]);
    const images = Array.isArray(node.images) ? node.images : [];
    for (const image of images) {
      const filename = clean(image?.filename);
      if (!filename) continue;
      return {
        nodeId,
        filename,
        subfolder: clean(image?.subfolder),
        type: clean(image?.type || 'output')
      };
    }
  }
  return null;
}

function outputViewUrl(baseUrl, image) {
  const url = new URL('/view', baseUrl);
  url.searchParams.set('filename', image.filename);
  url.searchParams.set('subfolder', image.subfolder);
  url.searchParams.set('type', image.type);
  return url;
}

async function submitWorkflow({ fetchImpl, baseUrl, workflow, clientId, extraData, signal }) {
  const payload = { prompt: workflow };
  if (clientId) payload.client_id = clientId;
  if (Object.keys(extraData).length) payload.extra_data = extraData;

  const response = await fetchImpl(new URL('/prompt', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal
  });
  const body = await readJson(response, 'comfyui-prompt-submit-failed');
  const promptId = clean(body?.prompt_id);
  if (!promptId) throw new Error('comfyui-prompt-id-missing');
  return promptId;
}

async function waitForHistory({ fetchImpl, baseUrl, promptId, outputNodeId, maxPolls, pollIntervalMs, sleepImpl, signal }) {
  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const response = await fetchImpl(new URL(`/history/${encodeURIComponent(promptId)}`, baseUrl), { signal });
    const body = await readJson(response, 'comfyui-history-request-failed');
    const entry = normalizeHistory(body, promptId);
    if (entry) {
      const state = historyState(entry);
      if (state.failed) throw new Error(`comfyui-execution-failed:${state.state || 'unknown'}`);
      if (state.complete) {
        const image = selectOutputImage(entry, outputNodeId);
        if (!image) throw new Error('comfyui-output-image-missing');
        return { entry, image, attempts: attempt + 1 };
      }
    }
    if (attempt < maxPolls - 1) await sleepImpl(pollIntervalMs);
  }
  throw new Error('comfyui-execution-timeout');
}

async function downloadOutput({ fetchImpl, baseUrl, image, signal }) {
  const response = await fetchImpl(outputViewUrl(baseUrl, image), { signal });
  if (!response.ok) throw new Error(`comfyui-output-download-failed:http-${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const format = detectRasterFormat(bytes);
  if (!format) throw new Error('comfyui-output-not-raster');
  return { bytes, format };
}

export function createComfyUIImageAdapter({
  rootDir,
  baseUrl = DEFAULT_BASE_URL,
  allowRemote = false,
  available = true,
  fetchImpl = globalThis.fetch,
  maxPolls = 180,
  pollIntervalMs = 1000,
  sleepImpl = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
} = {}) {
  const root = path.resolve(rootDir || process.cwd());
  const url = normalizeBaseUrl(baseUrl);
  const local = isLoopbackHost(url.hostname);
  const usable = available !== false && typeof fetchImpl === 'function' && (allowRemote || local);

  return createProductionAdapter({
    id: 'comfyui-image',
    provider: 'comfyui',
    available: usable,
    operations: ['generate'],
    capabilities: ['image', 'raster', 'image-generation', 'workflow-driven', 'local-execution', 'png', 'jpeg', 'webp'],
    costTier: 'low',
    priority: 90,
    metadata: {
      executionBoundary: local ? 'local-http' : 'remote-http',
      network: true,
      defaultBaseUrl: DEFAULT_BASE_URL,
      localOnlyByDefault: true,
      allowRemote: Boolean(allowRemote),
      api: 'comfyui-native-http'
    },
    async execute(job, context = {}) {
      const input = object(job.input);
      const workflow = object(input.workflow ?? input.promptGraph ?? input.prompt);
      if (!Object.keys(workflow).length) throw new Error('comfyui-workflow-missing');

      const outputNodeId = clean(input.outputNodeId);
      const clientId = clean(input.clientId ?? job.projectId ?? job.id);
      const startedAt = Date.now();
      const promptId = await submitWorkflow({
        fetchImpl,
        baseUrl: url,
        workflow,
        clientId,
        extraData: object(input.extraData),
        signal: context.signal
      });

      const completed = await waitForHistory({
        fetchImpl,
        baseUrl: url,
        promptId,
        outputNodeId,
        maxPolls: Math.max(1, Number(input.maxPolls ?? maxPolls)),
        pollIntervalMs: Math.max(0, Number(input.pollIntervalMs ?? pollIntervalMs)),
        sleepImpl,
        signal: context.signal
      });

      const downloaded = await downloadOutput({ fetchImpl, baseUrl: url, image: completed.image, signal: context.signal });
      const { relative, target } = resolveOutputPath(root, input.outputPath, clean(job.id || 'comfyui-image'), downloaded.format);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, downloaded.bytes);
      const stat = await fs.stat(target);
      const sha256 = createHash('sha256').update(downloaded.bytes).digest('hex');
      const durationMs = Date.now() - startedAt;

      return {
        files: [{ ref: target, role: 'primary', format: downloaded.format, hash: `sha256:${sha256}`, bytes: stat.size }],
        measurements: [
          { type: 'file-bytes', value: stat.size, unit: 'bytes', measured: true },
          { type: 'adapter-execution-ms', value: durationMs, unit: 'ms', measured: true }
        ],
        provenance: {
          provider: 'comfyui',
          operation: 'generate',
          requestId: promptId,
          endpoint: '/prompt + /history/{prompt_id} + /view',
          model: clean(input.modelLabel ?? job.metadata?.model)
        },
        rights: job.rights ?? {},
        cost: { currency: 'USD', amount: null, estimated: true, basis: 'local-compute-unmeasured' },
        metadata: {
          relativePath: relative,
          baseUrl: url.origin,
          localExecution: local,
          workflowNodeCount: Object.keys(workflow).length,
          outputNodeId: completed.image.nodeId,
          providerFilename: completed.image.filename,
          providerSubfolder: completed.image.subfolder,
          providerOutputType: completed.image.type,
          pollAttempts: completed.attempts,
          creativeApproval: false,
          releaseApproval: false
        }
      };
    }
  });
}
