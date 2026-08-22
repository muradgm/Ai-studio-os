const DEFAULT_ENDPOINT = 'https://www.googleapis.com/webfonts/v1/webfonts';
const ALLOWED_SORTS = new Set(['alpha', 'date', 'popularity', 'style', 'trending']);
const ALLOWED_GOOGLE_API_HOSTS = new Set(['www.googleapis.com', 'fonts.googleapis.com']);

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateCredentialEndpoint(endpoint) {
  let url;
  try { url = new URL(endpoint); }
  catch { throw new TypeError('Google Fonts endpoint must be a valid URL'); }
  if (url.protocol !== 'https:') throw new Error('Google Fonts credential endpoint must use HTTPS');
  if (!ALLOWED_GOOGLE_API_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error(`Google Fonts credential endpoint host is not allowed: ${url.hostname}`);
  }
  if (!/^\/webfonts\/v1\/webfonts\/?$/.test(url.pathname)) {
    throw new Error(`Google Fonts credential endpoint path is not allowed: ${url.pathname}`);
  }
  return url;
}

function normalizeAxis(axis) {
  if (!axis || typeof axis !== 'object') return null;
  const tag = clean(axis.tag);
  if (!tag) return null;
  return {
    tag,
    start: Number.isFinite(Number(axis.start)) ? Number(axis.start) : null,
    end: Number.isFinite(Number(axis.end)) ? Number(axis.end) : null
  };
}

export function normalizeGoogleFont(raw = {}) {
  const family = clean(raw.family);
  if (!family) return null;
  return {
    id: `google-fonts:${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    provider: 'google-fonts',
    family,
    category: clean(raw.category) || 'unknown',
    variants: Array.isArray(raw.variants) ? [...new Set(raw.variants.filter(Boolean))] : [],
    subsets: Array.isArray(raw.subsets) ? [...new Set(raw.subsets.filter(Boolean))] : [],
    files: raw.files && typeof raw.files === 'object' ? { ...raw.files } : {},
    axes: Array.isArray(raw.axes) ? raw.axes.map(normalizeAxis).filter(Boolean) : [],
    lastModified: clean(raw.lastModified) || null,
    version: clean(raw.version) || null,
    menu: clean(raw.menu) || null,
    source: 'google-fonts-developer-api'
  };
}

export function createGoogleFontsProvider({
  apiKey = process.env.GOOGLE_FONTS_API_KEY,
  fetchImpl = globalThis.fetch,
  endpoint = DEFAULT_ENDPOINT,
  cacheTtlMs = 6 * 60 * 60 * 1000,
  now = () => Date.now()
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('google fonts provider requires a fetch implementation');
  const credentialEndpoint = validateCredentialEndpoint(endpoint);

  let cache = null;

  async function list({ sort = 'popularity', capability, forceRefresh = false } = {}) {
    if (!apiKey) throw new Error('GOOGLE_FONTS_API_KEY is required to sync the Google Fonts catalog');
    if (!ALLOWED_SORTS.has(sort)) throw new RangeError(`unsupported Google Fonts sort: ${sort}`);

    const cacheKey = `${sort}:${capability ?? ''}`;
    if (!forceRefresh && cache?.key === cacheKey && now() - cache.savedAt < cacheTtlMs) return cache.value;

    // Clone the validated endpoint before attaching the credential. Never append a key to an unvalidated URL.
    const url = new URL(credentialEndpoint.toString());
    url.searchParams.set('key', apiKey);
    url.searchParams.set('sort', sort);
    if (capability) url.searchParams.set('capability', capability);

    const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
    if (!response?.ok) {
      const status = response?.status ?? 'unknown';
      throw new Error(`Google Fonts catalog request failed (${status})`);
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.items)) throw new Error('Google Fonts catalog response is missing items');

    const fonts = payload.items.map(normalizeGoogleFont).filter(Boolean);
    const value = {
      provider: 'google-fonts',
      fetchedAt: new Date(now()).toISOString(),
      sort,
      capability: capability ?? null,
      count: fonts.length,
      fonts
    };
    cache = { key: cacheKey, savedAt: now(), value };
    return value;
  }

  async function search(query = {}, options = {}) {
    const catalog = await list(options);
    const term = clean(query.term).toLowerCase();
    const categories = new Set((query.categories ?? []).map((value) => clean(value).toLowerCase()).filter(Boolean));
    const subsets = new Set((query.subsets ?? []).map((value) => clean(value).toLowerCase()).filter(Boolean));
    const requireVariable = query.variable === true;
    const limit = Number.isInteger(query.limit) && query.limit > 0 ? query.limit : 50;

    const fonts = catalog.fonts.filter((font) => {
      if (term && !font.family.toLowerCase().includes(term)) return false;
      if (categories.size && !categories.has(font.category.toLowerCase())) return false;
      if (subsets.size && ![...subsets].every((subset) => font.subsets.map((item) => item.toLowerCase()).includes(subset))) return false;
      if (requireVariable && font.axes.length === 0) return false;
      return true;
    });

    return { ...catalog, query: { ...query }, count: Math.min(fonts.length, limit), fonts: fonts.slice(0, limit) };
  }

  function clearCache() {
    cache = null;
  }

  return Object.freeze({ id: 'google-fonts', list, search, clearCache });
}

export { DEFAULT_ENDPOINT, ALLOWED_GOOGLE_API_HOSTS };
