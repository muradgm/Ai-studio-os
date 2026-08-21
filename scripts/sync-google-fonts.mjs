import { createGoogleFontsProvider } from '../modules/typography/google-fonts-provider.mjs';
import { syncTypographyCatalog } from '../modules/typography/catalog.mjs';

const provider = createGoogleFontsProvider();
const catalog = await syncTypographyCatalog({
  provider,
  sort: 'popularity',
  capability: 'VF'
});
console.log(`Google Fonts catalog synced: ${catalog.count} families (VF capability enabled) -> .tmp/google-fonts/catalog.json`);
