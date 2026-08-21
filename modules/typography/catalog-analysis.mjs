import { analyzeCatalogFont } from './font-binary-analyzer.mjs';
import { analyzeGlyphOutlines } from './glyph-outline-analyzer.mjs';

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export async function analyzeFontCatalog(catalog = [], {
  concurrency = 4,
  limit = catalog.length,
  fetchImpl = globalThis.fetch,
  maxBytes,
  includeGlyphOutlines = true
} = {}) {
  if (!Array.isArray(catalog)) throw new TypeError('font catalog must be an array');
  const workerCount = Math.min(positiveInteger(concurrency, 4), 12);
  const maxItems = Math.min(positiveInteger(limit, catalog.length || 1), catalog.length);
  const queue = catalog.slice(0, maxItems);
  const results = new Array(queue.length);
  let cursor = 0;

  const additionalAnalyzers = includeGlyphOutlines
    ? [(buffer, context) => analyzeGlyphOutlines(buffer, context)]
    : [];

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= queue.length) return;
      results[index] = await analyzeCatalogFont(queue[index], {
        fetchImpl,
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
    item?.analysis?.extensions?.some((extension) => extension?.available === true && extension?.evidence)
  ).length;

  return {
    stage: 'font-catalog-analysis',
    attempted: queue.length,
    analyzed: counts.analyzed ?? 0,
    unsupported: counts.unsupported ?? 0,
    unavailable: counts.unavailable ?? 0,
    glyphAnalyzed,
    evidence,
    results
  };
}
