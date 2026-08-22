import { analyzeCatalogFont } from './font-binary-analyzer.mjs';
import { analyzeGlyphOutlines } from './glyph-outline-analyzer.mjs';
import { analyzeOutlineStrokes } from './stroke-outline-analyzer.mjs';

const DEFAULT_PROVIDER_POLICIES = Object.freeze({
  'google-fonts': {
    protocols: ['https:'],
    hosts: ['fonts.gstatic.com'],
    upgradeHttpToHttps: true
  }
});

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalizeProviderPolicy(policy = {}) {
  const protocols = new Set((Array.isArray(policy.protocols) ? policy.protocols : ['https:']).map(String));
  const hosts = new Set((Array.isArray(policy.hosts) ? policy.hosts : []).map((host)=>String(host).toLowerCase()));
  return { protocols, hosts, upgradeHttpToHttps:policy.upgradeHttpToHttps === true };
}

function normalizeFontFilesByPolicy(font, providerPolicies) {
  const provider = String(font?.provider ?? 'unknown');
  const rawPolicy = providerPolicies?.[provider];
  if (!rawPolicy) {
    return { ...font, files:{}, networkPolicy:{ provider, allowed:false, reason:'provider-network-policy-required' } };
  }
  const policy = normalizeProviderPolicy(rawPolicy);
  const files = {};
  for (const [variant, rawUrl] of Object.entries(font.files ?? {})) {
    try {
      const url = new URL(rawUrl);
      if (policy.upgradeHttpToHttps && url.protocol === 'http:') url.protocol = 'https:';
      if (!policy.protocols.has(url.protocol)) continue;
      if (policy.hosts.size && !policy.hosts.has(url.hostname.toLowerCase())) continue;
      files[variant] = url.toString();
    } catch {
      // Invalid provider URLs are omitted and become an explicit unavailable result.
    }
  }
  return {
    ...font,
    files,
    networkPolicy:{ provider, allowed:true, protocols:[...policy.protocols], hosts:[...policy.hosts] }
  };
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
  includeStrokeAnalysis = true,
  providerPolicies = DEFAULT_PROVIDER_POLICIES
} = {}) {
  if (!Array.isArray(catalog)) throw new TypeError('font catalog must be an array');
  if (!providerPolicies || typeof providerPolicies !== 'object' || Array.isArray(providerPolicies)) throw new TypeError('providerPolicies must be an object');
  const workerCount = Math.min(positiveInteger(concurrency, 4), 12);
  const maxItems = Math.min(positiveInteger(limit, catalog.length || 1), catalog.length);
  const queue = catalog.slice(0, maxItems).map((font)=>normalizeFontFilesByPolicy(font, providerPolicies));
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
      const font = queue[index];
      if (font.networkPolicy?.allowed !== true) {
        results[index] = { family:font.family, status:'unavailable', reason:font.networkPolicy?.reason ?? 'provider-network-policy-required' };
        continue;
      }
      results[index] = await analyzeCatalogFont(font, {
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

export { DEFAULT_PROVIDER_POLICIES };
