import { analyzeCatalogFont } from './font-binary-analyzer.mjs';
import { analyzeGlyphOutlines } from './glyph-outline-analyzer.mjs';
import { analyzeOutlineStrokes } from './stroke-outline-analyzer.mjs';

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalizeGoogleFontFiles(font) {
  if (font?.provider !== 'google-fonts') return font;
  const files = {};
  for (const [variant, rawUrl] of Object.entries(font.files ?? {})) {
    try {
      const url = new URL(rawUrl);
      if (url.hostname !== 'fonts.gstatic.com') continue;
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      url.protocol = 'https:';
      files[variant] = url.toString();
    } catch {
      // Invalid provider URLs are omitted and become an explicit unavailable result.
    }
  }
  return { ...font, files };
}

function createBoundedFetch(fetchImpl, requestTimeoutMs) {
  if (typeof fetchImpl !== 'function') throw new TypeError('font catalog analysis requires a fetch implementation');
  const timeoutMs = positiveInteger(requestTimeoutMs, 15000);
  return async (url, init = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`font request exceeded ${timeoutMs}ms timeout`)), timeoutMs);
    try {
      return await fetchImpl(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };
}

export async function analyzeFontCatalog(catalog = [], {
  concurrency = 4,
  limit = catalog.length,
  fetchImpl = globalThis.fetch,
  requestTimeoutMs = 15000,
  maxBytes,
  includeGlyphOutlines = true,
  includeStrokeAnalysis = true
} = {}) {
  if (!Array.isArray(catalog)) throw new TypeError('font catalog must be an array');
  const workerCount = Math.min(positiveInteger(concurrency, 4), 12);
  const maxItems = Math.min(positiveInteger(limit, catalog.length || 1), catalog.length);
  const queue = catalog.slice(0, maxItems).map(normalizeGoogleFontFiles);
  const results = new Array(queue.length);
  const boundedFetch = createBoundedFetch(fetchImpl, requestTimeoutMs);
  let cursor = 0;

  const additionalAnalyzers = [];
  if (includeGlyphOutlines) additionalAnalyzers.push((buffer, context) => analyzeGlyphOutlines(buffer, context));
  if (includeStrokeAnalysis) additionalAnalyzers.push((buffer, context) => analyzeOutlineStrokes(buffer, context));

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= queue.length) return;
      results[index] = await analyzeCatalogFont(queue[index], {
        fetchImpl: boundedFetch,
        additionalAnalyzers,
        ...(maxBytes ? { maxBytes } : {})
      });
    }
  }

  await Promise.all(Array.from({ length: Math.min(workerCount, queue.length || 1) }, () => worker()));

  const evidence = [];
  for (const item of results) {
    if (item?.status !== 'analyzed') continue;
    if (item.analysis?.evidence) evidence.push(item.analysis.evidence);
    for (const extension of item.analysis?.extensions ?? []) {
      if (extension?.evidence) evidence.push(extension.evidence);
    }
  }

  const counts = results.reduce((summary, item) => {
    const key = item?.status ?? 'unknown';
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});
  const glyphAnalyzed = results.filter((item) =>
    item?.analysis?.extensions?.some((extension) => extension?.available === true && extension?.evidence?.sources?.some((source)=>source.type === 'glyph-outline-metrics'))
  ).length;
  const strokeAnalyzed = results.filter((item) =>
    item?.analysis?.extensions?.some((extension) => extension?.available === true && extension?.evidence?.sources?.some((source)=>source.type === 'glyph-stroke-scanlines'))
  ).length;

  return {
    stage: 'font-catalog-analysis',
    attempted: queue.length,
    analyzed: counts.analyzed ?? 0,
    unsupported: counts.unsupported ?? 0,
    unavailable: counts.unavailable ?? 0,
    glyphAnalyzed,
    strokeAnalyzed,
    evidence,
    results
  };
}
