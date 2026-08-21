import { createGoogleFontsProvider } from './google-fonts-provider.mjs';
import { syncTypographyCatalog } from './catalog.mjs';

export async function syncGoogleFontsCatalog({
  provider = createGoogleFontsProvider(),
  sort = 'popularity',
  capability = 'VF',
  cachePath,
  forceRefresh = true,
  sync = syncTypographyCatalog
} = {}) {
  if (!provider || typeof provider.list !== 'function') throw new TypeError('Google Fonts sync requires a provider with list()');
  return sync({
    provider,
    sort,
    capability,
    forceRefresh,
    ...(cachePath ? { cachePath } : {})
  });
}
