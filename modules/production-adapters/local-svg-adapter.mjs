import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createProductionAdapter } from './runtime.mjs';

function clean(value) {
  return String(value ?? '').trim();
}

function safeRelativePath(value, fallback) {
  const raw = clean(value || fallback).replace(/\\/g, '/');
  const normalized = path.posix.normalize(raw).replace(/^\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error('local-svg-output-path-invalid');
  }
  return normalized.toLowerCase().endsWith('.svg') ? normalized : `${normalized}.svg`;
}

function parseViewBox(markup) {
  const match = markup.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);
  if (!match) return null;
  const values = match[1].trim().split(/[\s,]+/).map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null;
  if (values[2] <= 0 || values[3] <= 0) return null;
  return values;
}

function count(markup, pattern) {
  return (markup.match(pattern) ?? []).length;
}

export function inspectSvgMarkup(markup, { requireFontFree = false, vectorOnly = true } = {}) {
  const svg = clean(markup);
  const findings = [];
  if (!svg || !/<svg\b/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) {
    findings.push({ severity: 'blocker', code: 'svg-root-invalid', message: 'SVG output requires a complete <svg> root element.' });
  }

  const viewBox = parseViewBox(svg);
  if (!viewBox) findings.push({ severity: 'blocker', code: 'svg-viewbox-missing-or-invalid', message: 'SVG output requires a valid positive viewBox.' });

  const unsafePatterns = [
    [/<script\b/i, 'svg-script-forbidden', 'Scripts are forbidden in production SVG artifacts.'],
    [/<foreignObject\b/i, 'svg-foreign-object-forbidden', 'foreignObject is forbidden in production SVG artifacts.'],
    [/\son[a-z]+\s*=/i, 'svg-event-handler-forbidden', 'Inline event handlers are forbidden in production SVG artifacts.'],
    [/javascript\s*:/i, 'svg-javascript-url-forbidden', 'javascript: URLs are forbidden in production SVG artifacts.'],
    [/\b(?:href|xlink:href)\s*=\s*["']\s*(?:https?:)?\/\//i, 'svg-external-reference-forbidden', 'External network references are forbidden in production SVG artifacts.']
  ];
  for (const [pattern, code, message] of unsafePatterns) {
    if (pattern.test(svg)) findings.push({ severity: 'blocker', code, message });
  }

  const textNodes = count(svg, /<text\b/gi);
  const rasterImages = count(svg, /<image\b/gi);
  if (requireFontFree && textNodes > 0) {
    findings.push({ severity: 'blocker', code: 'svg-font-dependency-forbidden', message: 'Font-free vector masters may not contain <text> nodes; convert typography to approved outlines first.' });
  }
  if (vectorOnly && rasterImages > 0) {
    findings.push({ severity: 'blocker', code: 'svg-raster-image-forbidden', message: 'Vector-only master artifacts may not embed raster <image> content.' });
  }

  const pathCount = count(svg, /<path\b/gi);
  const primitiveCount = count(svg, /<(?:rect|circle|ellipse|line|polyline|polygon)\b/gi);
  const groupCount = count(svg, /<g\b/gi);
  const blockerCount = findings.filter((item) => item.severity === 'blocker').length;

  return {
    pass: blockerCount === 0,
    findings,
    measurements: {
      viewBox,
      pathCount,
      primitiveCount,
      groupCount,
      textNodes,
      rasterImages,
      currentColorUses: count(svg, /currentColor/gi),
      bytes: Buffer.byteLength(svg, 'utf8')
    }
  };
}

export function createLocalSvgAdapter({ rootDir, available = true } = {}) {
  const root = path.resolve(rootDir || process.cwd());
  return createProductionAdapter({
    id: 'local-svg',
    provider: 'local-vector-filesystem',
    available,
    operations: ['generate', 'edit'],
    capabilities: ['svg', 'vector', 'vector-master-file', 'icon-master', 'logo-candidate', 'deterministic-output'],
    costTier: 'low',
    priority: 95,
    metadata: {
      executionBoundary: 'local-filesystem',
      network: false,
      canonicalLogoApproval: false,
      creativeApproval: false
    },
    async execute(job) {
      const markup = clean(job.input?.svg ?? job.input?.content ?? job.svg);
      const requireFontFree = job.input?.requireFontFree === true || job.metadata?.requireFontFree === true;
      const vectorOnly = job.input?.vectorOnly !== false && job.metadata?.vectorOnly !== false;
      const inspection = inspectSvgMarkup(markup, { requireFontFree, vectorOnly });
      if (!inspection.pass) {
        return {
          files: [],
          findings: inspection.findings,
          measurements: [{ type: 'svg-structure', status: 'measured', pass: false, ...inspection.measurements }],
          provenance: { provider: 'local-vector-filesystem', operation: clean(job.operation) || 'generate' },
          cost: { currency: 'USD', amount: 0, estimated: false },
          metadata: { vectorOnly, requireFontFree }
        };
      }

      const relative = safeRelativePath(job.input?.outputPath, `${clean(job.id || 'vector-artifact')}.svg`);
      const target = path.resolve(root, relative);
      const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
      if (target !== root && !target.startsWith(rootPrefix)) throw new Error('local-svg-output-path-outside-root');

      const body = `${markup}\n`;
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, body, 'utf8');
      const stat = await fs.stat(target);
      const hash = crypto.createHash('sha256').update(body).digest('hex');

      return {
        files: [{ ref: target, role: 'primary', format: 'svg', bytes: stat.size, hash }],
        provenance: {
          provider: 'local-vector-filesystem',
          operation: clean(job.operation) || 'generate',
          deterministic: true
        },
        rights: job.rights ?? {},
        cost: { currency: 'USD', amount: 0, estimated: false },
        measurements: [{ type: 'svg-structure', status: 'measured', pass: true, ...inspection.measurements }],
        metadata: {
          relativePath: relative,
          deterministic: true,
          vectorOnly,
          requireFontFree,
          canonicalLogoApproval: false,
          creativeApproval: false
        }
      };
    }
  });
}
