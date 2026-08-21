import { analyzeCatalogFont } from './font-binary-analyzer.mjs';

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export async function analyzeFontCatalog(catalog = [], {
  concurrency = 4,
  limit = catalog.length,
  fetchImpl = globalThis.fetch,
  maxBytes
} = {}) {
  if (!Array.isArray(catalog)) throw new TypeError('font catalog must be an array');
  const workerCount = Math.min(positiveInteger(concurrency, 4), 12);
  const maxItems = Math.min(positiveInteger(limit, catalog.length || 1), catalog.length);
  const queue = catalog.slice(0, maxItems);
  const results = new Array(queue.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= queue.length) return;
      results[index] = await analyzeCatalogFont(queue[index], { fetchImpl, ...(maxBytes ? { maxBytes } : {}) });
    }
  }

  await Promise.all(Array.from({ length: Math.min(workerCount, queue.length || 1) }, () => worker()));

  const evidence = results
    .filter((item) => item?.status === 'analyzed' && item.analysis?.evidence)
    .map((item) => item.analysis.evidence);
  const counts = results.reduce((summary, item) => {
    const key = item?.status ?? 'unknown';
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});

  return {
    stage: 'font-catalog-analysis',
    attempted: queue.length,
    analyzed: counts.analyzed ?? 0,
    unsupported: counts.unsupported ?? 0,
    unavailable: counts.unavailable ?? 0,
    evidence,
    results
  };
}
