import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createProductionAdapter } from './runtime.mjs';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-image-2';
const FORMATS = new Set(['png', 'jpeg', 'webp']);
const QUALITIES = new Set(['low', 'medium', 'high', 'auto']);
const BACKGROUNDS = new Set(['opaque', 'auto', 'transparent']);
const MODERATION = new Set(['auto', 'low']);

function clean(value) {
  return String(value ?? '').trim();
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeBaseUrl(value) {
  return clean(value || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function normalizeFormat(value) {
  const format = clean(value || 'png').toLowerCase();
  if (!FORMATS.has(format)) throw new Error(`openai-image-format-unsupported:${format}`);
  return format;
}

function extensionFor(format) {
  return format === 'jpeg' ? '.jpg' : `.${format}`;
}

function isInsideRoot(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const rootPrefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(rootPrefix);
}

function outputPath(root, value, fallback, format) {
  const raw = clean(value || fallback).replace(/\\/g, '/');
  const normalized = path.posix.normalize(raw).replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error('openai-image-output-path-invalid');
  }
  const ext = path.posix.extname(normalized).toLowerCase();
  const accepted = format === 'jpeg' ? new Set(['.jpg', '.jpeg']) : new Set([extensionFor(format)]);
  const relative = ext ? normalized : `${normalized}${extensionFor(format)}`;
  if (ext && !accepted.has(ext)) throw new Error('openai-image-output-extension-mismatch');
  const target = path.resolve(root, relative);
  if (!isInsideRoot(root, target)) throw new Error('openai-image-output-path-outside-root');
  return { relative, target };
}

function sourceRef(value) {
  if (typeof value === 'string') return clean(value);
  return clean(value?.ref ?? value?.path ?? value?.url);
}

function localPathFromRef(value, sourceRoot) {
  const ref = sourceRef(value);
  if (!ref) throw new Error('openai-image-edit-source-missing');
  if (/^[a-z]+:\/\//i.test(ref) && !ref.startsWith('file://')) throw new Error('openai-image-edit-source-local-file-required');
  const file = ref.startsWith('file://') ? fileURLToPath(ref) : path.resolve(ref);
  if (!isInsideRoot(sourceRoot, file)) throw new Error('openai-image-edit-source-outside-root');
  return file;
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

function detectRasterFormat(buffer) {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return '';
}

function imageOptions(job, defaultModel) {
  const input = object(job.input);
  const model = clean(job.preferredModel ?? input.model ?? defaultModel) || defaultModel;
  const format = normalizeFormat(job.format ?? input.outputFormat ?? input.output_format ?? 'png');
  const quality = clean(input.quality || 'auto').toLowerCase();
  const background = clean(input.background || 'auto').toLowerCase();
  const moderation = clean(input.moderation || 'auto').toLowerCase();
  const size = clean(input.size || 'auto');
  const compressionValue = input.outputCompression ?? input.output_compression;
  const outputCompression = compressionValue === undefined || compressionValue === null ? null : Number(compressionValue);

  if (!QUALITIES.has(quality)) throw new Error(`openai-image-quality-unsupported:${quality}`);
  if (!BACKGROUNDS.has(background)) throw new Error(`openai-image-background-unsupported:${background}`);
  if (!MODERATION.has(moderation)) throw new Error(`openai-image-moderation-unsupported:${moderation}`);
  if (outputCompression !== null && (!Number.isFinite(outputCompression) || outputCompression < 0 || outputCompression > 100)) {
    throw new Error('openai-image-output-compression-invalid');
  }
  if (outputCompression !== null && !['jpeg', 'webp'].includes(format)) {
    throw new Error('openai-image-output-compression-format-invalid');
  }
  if (model === 'gpt-image-2' && background === 'transparent') {
    throw new Error('openai-image-transparent-background-unsupported');
  }

  return { model, format, quality, background, moderation, size, outputCompression };
}

async function parseResponse(response) {
  const requestId = clean(response.headers?.get?.('x-request-id'));
  let body;
  try { body = await response.json(); }
  catch { body = {}; }

  if (!response.ok) {
    const providerCode = clean(body?.error?.code ?? body?.error?.type ?? `http-${response.status}`);
    const error = new Error(`openai-image-request-failed:${providerCode}`);
    error.status = response.status;
    error.code = providerCode;
    error.requestId = requestId;
    error.moderationDetails = object(body?.error?.moderation_details);
    throw error;
  }

  const base64 = clean(body?.data?.[0]?.b64_json);
  if (!base64) {
    const error = new Error('openai-image-response-image-missing');
    error.requestId = requestId;
    throw error;
  }
  return { buffer: Buffer.from(base64, 'base64'), requestId, body };
}

function generationPayload(job, options) {
  const input = object(job.input);
  const prompt = clean(input.prompt ?? job.prompt);
  if (!prompt) throw new Error('openai-image-prompt-missing');
  const payload = {
    model: options.model,
    prompt,
    n: 1,
    size: options.size,
    quality: options.quality,
    output_format: options.format,
    background: options.background,
    moderation: options.moderation
  };
  if (options.outputCompression !== null) payload.output_compression = options.outputCompression;
  return payload;
}

async function generationRequest({ fetchImpl, baseUrl, apiKey, job, options, signal }) {
  const response = await fetchImpl(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(generationPayload(job, options)),
    signal
  });
  return parseResponse(response);
}

async function appendLocalImage(form, field, value, sourceRoot) {
  const file = localPathFromRef(value, sourceRoot);
  const stat = await fs.stat(file);
  if (!stat.isFile()) throw new Error('openai-image-edit-source-not-file');
  if (stat.size > 50 * 1024 * 1024) throw new Error('openai-image-edit-source-too-large');
  const bytes = await fs.readFile(file);
  form.append(field, new Blob([bytes], { type: mimeFor(file) }), path.basename(file));
}

async function editRequest({ fetchImpl, baseUrl, apiKey, job, options, sourceRoot, signal }) {
  const input = object(job.input);
  const prompt = clean(input.prompt ?? job.prompt);
  if (!prompt) throw new Error('openai-image-prompt-missing');

  const form = new FormData();
  form.append('model', options.model);
  form.append('prompt', prompt);
  form.append('size', options.size);
  form.append('quality', options.quality);
  form.append('output_format', options.format);
  form.append('background', options.background);
  form.append('moderation', options.moderation);
  if (options.outputCompression !== null) form.append('output_compression', String(options.outputCompression));

  const sources = array(job.sourceFiles);
  for (const source of sources) await appendLocalImage(form, 'image[]', source, sourceRoot);
  if (input.maskFile) await appendLocalImage(form, 'mask', input.maskFile, sourceRoot);

  const response = await fetchImpl(`${baseUrl}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal
  });
  return parseResponse(response);
}

export function createOpenAIImageAdapter({
  rootDir,
  sourceRootDir,
  apiKey = process.env.OPENAI_API_KEY,
  baseUrl = DEFAULT_BASE_URL,
  defaultModel = DEFAULT_MODEL,
  available = true,
  fetchImpl = globalThis.fetch
} = {}) {
  const root = path.resolve(rootDir || process.cwd());
  const sourceRoot = path.resolve(sourceRootDir || root);
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const key = clean(apiKey);
  const usable = available !== false && Boolean(key) && typeof fetchImpl === 'function';

  return createProductionAdapter({
    id: 'openai-image',
    provider: 'openai',
    available: usable,
    operations: ['generate', 'edit'],
    capabilities: ['image', 'raster', 'image-generation', 'image-edit', 'png', 'jpeg', 'webp', 'provider-api'],
    costTier: 'medium',
    priority: 80,
    defaultModel,
    metadata: {
      executionBoundary: 'external-api',
      network: true,
      api: 'image-api',
      defaultModel,
      credentialEnv: 'OPENAI_API_KEY',
      sourceBoundary: 'local-root'
    },
    async execute(job, context = {}) {
      const operation = clean(job.operation);
      const options = imageOptions(job, defaultModel);
      const fallback = `${clean(job.id || 'image')}${extensionFor(options.format)}`;
      const { relative, target } = outputPath(root, job.input?.outputPath, fallback, options.format);

      const result = operation === 'edit'
        ? await editRequest({ fetchImpl, baseUrl: normalizedBaseUrl, apiKey: key, job, options, sourceRoot, signal: context.signal })
        : await generationRequest({ fetchImpl, baseUrl: normalizedBaseUrl, apiKey: key, job, options, signal: context.signal });

      const detected = detectRasterFormat(result.buffer);
      if (!detected) throw new Error('openai-image-output-not-raster');
      if (detected !== options.format) throw new Error(`openai-image-output-format-mismatch:${detected}`);

      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, result.buffer);
      const stat = await fs.stat(target);
      const sha256 = createHash('sha256').update(result.buffer).digest('hex');

      return {
        files: [{ ref: target, role: 'primary', format: options.format, hash: `sha256:${sha256}`, bytes: stat.size }],
        measurements: [{ type: 'file-bytes', value: stat.size, unit: 'bytes', measured: true }],
        provenance: {
          provider: 'openai',
          operation,
          model: options.model,
          requestId: result.requestId,
          endpoint: operation === 'edit' ? '/images/edits' : '/images/generations'
        },
        rights: job.rights ?? {},
        metadata: {
          relativePath: relative,
          outputFormat: options.format,
          size: options.size,
          quality: options.quality,
          background: options.background,
          moderation: options.moderation,
          outputCompression: options.outputCompression,
          sourceCount: operation === 'edit' ? array(job.sourceFiles).length : 0,
          providerResponseHasUsage: Boolean(result.body?.usage)
        }
      };
    }
  });
}
