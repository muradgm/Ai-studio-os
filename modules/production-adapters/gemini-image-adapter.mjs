import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createProductionAdapter } from './runtime.mjs';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-3.1-flash-image';
const MAX_INLINE_REQUEST_BYTES = 20 * 1024 * 1024;
const MODELS = new Set([
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-3-pro-image'
]);
const FORMATS = new Map([
  ['png', 'image/png'],
  ['jpeg', 'image/jpeg'],
  ['jpg', 'image/jpeg']
]);
const FLASH_RATIOS = new Set(['1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9']);
const STANDARD_RATIOS = new Set(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']);

function clean(value) {
  return String(value ?? '').trim();
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function isInsideRoot(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const prefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(prefix);
}

function sourceRef(value) {
  if (typeof value === 'string') return clean(value);
  return clean(value?.ref ?? value?.path ?? value?.url);
}

function sourcePath(value, sourceRoot) {
  const ref = sourceRef(value);
  if (!ref) throw new Error('gemini-image-edit-source-missing');
  if (/^[a-z]+:\/\//i.test(ref) && !ref.startsWith('file://')) throw new Error('gemini-image-edit-source-local-file-required');
  const file = ref.startsWith('file://') ? fileURLToPath(ref) : path.resolve(ref);
  if (!isInsideRoot(sourceRoot, file)) throw new Error('gemini-image-edit-source-outside-root');
  return file;
}

function mimeForFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  throw new Error(`gemini-image-edit-source-format-unsupported:${ext || 'unknown'}`);
}

function normalizeBaseUrl(value) {
  return clean(value || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function normalizeFormat(value) {
  const raw = clean(value || 'png').toLowerCase();
  if (!FORMATS.has(raw)) throw new Error(`gemini-image-output-format-unsupported:${raw}`);
  return raw === 'jpg' ? 'jpeg' : raw;
}

function extensionFor(format) {
  return format === 'jpeg' ? '.jpg' : '.png';
}

function detectRasterFormat(buffer) {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return '';
}

function outputPath(root, value, fallback, format) {
  const raw = clean(value || fallback).replace(/\\/g, '/');
  const normalized = path.posix.normalize(raw).replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error('gemini-image-output-path-invalid');
  }
  const ext = path.posix.extname(normalized).toLowerCase();
  const accepted = format === 'jpeg' ? new Set(['.jpg', '.jpeg']) : new Set(['.png']);
  const relative = ext ? normalized : `${normalized}${extensionFor(format)}`;
  if (ext && !accepted.has(ext)) throw new Error('gemini-image-output-extension-mismatch');
  const target = path.resolve(root, relative);
  if (!isInsideRoot(root, target)) throw new Error('gemini-image-output-path-outside-root');
  return { relative, target };
}

function validateModelOptions(model, aspectRatio, imageSize) {
  if (!MODELS.has(model)) throw new Error(`gemini-image-model-unsupported:${model}`);
  const ratios = model === 'gemini-3.1-flash-image' ? FLASH_RATIOS : STANDARD_RATIOS;
  if (aspectRatio && !ratios.has(aspectRatio)) throw new Error(`gemini-image-aspect-ratio-unsupported:${aspectRatio}`);

  const size = clean(imageSize || '1K').toUpperCase();
  if (model === 'gemini-3.1-flash-lite-image' && size !== '1K') throw new Error(`gemini-image-size-unsupported:${model}:${size}`);
  if (model === 'gemini-3.1-flash-image' && !new Set(['512', '1K', '2K', '4K']).has(size)) throw new Error(`gemini-image-size-unsupported:${model}:${size}`);
  if (model === 'gemini-3-pro-image' && !new Set(['1K', '2K', '4K']).has(size)) throw new Error(`gemini-image-size-unsupported:${model}:${size}`);
  return size;
}

async function imageInputPart(value, sourceRoot) {
  const file = sourcePath(value, sourceRoot);
  const stat = await fs.stat(file);
  if (!stat.isFile()) throw new Error('gemini-image-edit-source-not-file');
  const bytes = await fs.readFile(file);
  return {
    type: 'image',
    data: bytes.toString('base64'),
    mime_type: mimeForFile(file),
    bytes: stat.size
  };
}

function providerImage(body) {
  const direct = body?.output_image ?? body?.outputImage;
  if (direct?.data) return direct;

  for (const step of array(body?.steps)) {
    if (clean(step?.type) !== 'model_output') continue;
    for (const block of array(step?.content)) {
      if (clean(block?.type) === 'image' && block?.data) return block;
    }
  }

  for (const output of array(body?.output)) {
    if (clean(output?.type) === 'image' && output?.data) return output;
  }
  return null;
}

function providerError(body, status) {
  const detail = clean(body?.error?.status ?? body?.error?.code ?? body?.error?.message ?? `http-${status}`);
  return `gemini-image-request-failed:${detail}`;
}

async function requestInteraction({ fetchImpl, baseUrl, apiKey, payload, signal }) {
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_INLINE_REQUEST_BYTES) throw new Error('gemini-image-inline-request-too-large');

  const response = await fetchImpl(`${baseUrl}/interactions`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: serialized,
    signal
  });

  const requestId = clean(response.headers?.get?.('x-goog-request-id') ?? response.headers?.get?.('x-request-id'));
  let body;
  try { body = await response.json(); }
  catch { body = {}; }
  if (!response.ok) {
    const error = new Error(providerError(body, response.status));
    error.requestId = requestId;
    throw error;
  }

  const image = providerImage(body);
  if (!image?.data) {
    const error = new Error('gemini-image-response-image-missing');
    error.requestId = requestId;
    throw error;
  }
  return { image, body, requestId };
}

export function createGeminiImageAdapter({
  rootDir,
  sourceRootDir,
  apiKey = process.env.GEMINI_API_KEY,
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
    id: 'gemini-image',
    provider: 'google-gemini',
    available: usable,
    operations: ['generate', 'edit'],
    capabilities: ['image', 'raster', 'image-generation', 'image-edit', 'reference-images', 'png', 'jpeg', 'provider-api'],
    costTier: 'medium',
    priority: 78,
    defaultModel,
    metadata: {
      executionBoundary: 'external-api',
      network: true,
      api: 'gemini-interactions',
      defaultModel,
      credentialEnv: 'GEMINI_API_KEY',
      sourceBoundary: 'local-root',
      inlineRequestLimitBytes: MAX_INLINE_REQUEST_BYTES,
      synthIdExpected: true
    },
    async execute(job, context = {}) {
      const input = object(job.input);
      const operation = clean(job.operation);
      const model = clean(job.preferredModel ?? input.model ?? defaultModel) || defaultModel;
      const prompt = clean(input.prompt ?? job.prompt);
      if (!prompt) throw new Error('gemini-image-prompt-missing');

      const format = normalizeFormat(job.format ?? input.outputFormat ?? input.output_format ?? 'png');
      const aspectRatio = clean(input.aspectRatio ?? input.aspect_ratio ?? '1:1');
      const imageSize = validateModelOptions(model, aspectRatio, input.imageSize ?? input.image_size ?? '1K');
      const responseFormat = {
        type: 'image',
        mime_type: FORMATS.get(format),
        aspect_ratio: aspectRatio,
        image_size: imageSize
      };

      const providerInput = [{ type: 'text', text: prompt }];
      let sourceBytes = 0;
      if (operation === 'edit') {
        const sources = array(job.sourceFiles);
        if (sources.length > 14) throw new Error('gemini-image-reference-count-exceeded');
        for (const source of sources) {
          const part = await imageInputPart(source, sourceRoot);
          sourceBytes += part.bytes;
          delete part.bytes;
          providerInput.push(part);
        }
      }

      const payload = { model, input: providerInput, response_format: responseFormat };
      const result = await requestInteraction({
        fetchImpl,
        baseUrl: normalizedBaseUrl,
        apiKey: key,
        payload,
        signal: context.signal
      });

      const buffer = Buffer.from(clean(result.image.data), 'base64');
      const detected = detectRasterFormat(buffer);
      if (!detected) throw new Error('gemini-image-output-not-raster');
      if (detected !== format) throw new Error(`gemini-image-output-format-mismatch:${detected}`);

      const fallback = `${clean(job.id || 'gemini-image')}${extensionFor(format)}`;
      const { relative, target } = outputPath(root, input.outputPath, fallback, format);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, buffer);
      const stat = await fs.stat(target);
      const sha256 = createHash('sha256').update(buffer).digest('hex');
      const interactionId = clean(result.body?.id ?? result.body?.interaction_id ?? result.body?.interactionId);
      const responseMime = clean(result.image?.mime_type ?? result.image?.mimeType ?? responseFormat.mime_type);

      return {
        files: [{ ref: target, role: 'primary', format, hash: `sha256:${sha256}`, bytes: stat.size }],
        measurements: [{ type: 'file-bytes', value: stat.size, unit: 'bytes', measured: true }],
        provenance: {
          provider: 'google-gemini',
          operation,
          model,
          requestId: result.requestId || interactionId,
          interactionId,
          endpoint: '/interactions'
        },
        rights: job.rights ?? {},
        metadata: {
          relativePath: relative,
          outputFormat: format,
          responseMime,
          aspectRatio,
          imageSize,
          sourceCount: operation === 'edit' ? array(job.sourceFiles).length : 0,
          sourceBytes,
          synthIdExpected: true,
          groundingEnabled: false,
          creativeApproval: false,
          releaseApproval: false
        }
      };
    }
  });
}
