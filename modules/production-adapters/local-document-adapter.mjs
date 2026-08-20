import fs from 'node:fs/promises';
import path from 'node:path';
import { createProductionAdapter } from './runtime.mjs';

function clean(value) {
  return String(value ?? '').trim();
}

function safeRelativePath(value, fallback) {
  const raw = clean(value || fallback).replace(/\\/g, '/');
  const normalized = path.posix.normalize(raw).replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error('local-document-output-path-invalid');
  }
  return normalized;
}

function extensionFor(format) {
  const value = clean(format).toLowerCase();
  if (value === 'json') return '.json';
  if (value === 'txt' || value === 'text') return '.txt';
  return '.md';
}

function serialize(content, format) {
  const value = clean(format).toLowerCase();
  if (value === 'json') {
    if (typeof content === 'string') {
      try { return `${JSON.stringify(JSON.parse(content), null, 2)}\n`; }
      catch { return `${JSON.stringify({ content }, null, 2)}\n`; }
    }
    return `${JSON.stringify(content ?? {}, null, 2)}\n`;
  }
  return `${typeof content === 'string' ? content : JSON.stringify(content ?? {}, null, 2)}\n`;
}

export function createLocalDocumentAdapter({ rootDir, available = true } = {}) {
  const root = path.resolve(rootDir || process.cwd());
  return createProductionAdapter({
    id: 'local-document',
    provider: 'local-filesystem',
    available,
    operations: ['write-document'],
    capabilities: ['document', 'markdown', 'json', 'text', 'deterministic-output'],
    costTier: 'low',
    priority: 100,
    metadata: { executionBoundary: 'local-filesystem', network: false },
    async execute(job) {
      const format = clean(job.format || job.input?.format || 'markdown').toLowerCase();
      const extension = extensionFor(format);
      const relative = safeRelativePath(job.input?.outputPath, `${clean(job.id || 'artifact')}${extension}`);
      const target = path.resolve(root, relative);
      const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
      if (target !== root && !target.startsWith(rootPrefix)) throw new Error('local-document-output-path-outside-root');

      const body = serialize(job.input?.content, format);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, body, 'utf8');
      const stat = await fs.stat(target);
      return {
        files: [{ ref: target, role: 'primary', format, bytes: stat.size }],
        provenance: { provider: 'local-filesystem', operation: 'write-document' },
        rights: job.rights ?? {},
        cost: { currency: 'USD', amount: 0, estimated: false },
        metadata: { relativePath: relative, deterministic: true }
      };
    }
  });
}
