import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CACHE_PATH = '.tmp/google-fonts/catalog.json';

export async function writeTypographyCatalog(catalog, {
  cachePath = DEFAULT_CACHE_PATH,
  mkdir = fs.mkdir,
  writeFile = fs.writeFile
} = {}) {
  if (!catalog || !Array.isArray(catalog.fonts)) throw new TypeError('typography catalog must contain a fonts array');
  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  return { cachePath, count: catalog.fonts.length, fetchedAt: catalog.fetchedAt ?? null };
}

export async function readTypographyCatalog({
  cachePath = DEFAULT_CACHE_PATH,
  readFile = fs.readFile
} = {}) {
  try {
    const raw = await readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.fonts)) throw new Error('cached typography catalog is invalid');
    return parsed;
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function syncTypographyCatalog({
  provider,
  cachePath = DEFAULT_CACHE_PATH,
  sort = 'popularity',
  capability,
  forceRefresh = true
} = {}) {
  if (!provider || typeof provider.list !== 'function') throw new TypeError('typography sync requires a provider with list()');
  const catalog = await provider.list({ sort, capability, forceRefresh });
  await writeTypographyCatalog(catalog, { cachePath });
  return catalog;
}
