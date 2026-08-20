import { createGoogleFontsProvider } from '../modules/typography/google-fonts-provider.mjs';
import { syncTypographyCatalog } from '../modules/typography/catalog.mjs';

const provider = createGoogleFontsProvider();
const catalog = await syncTypographyCatalog({ provider, sort: 'popularity' });
console.log(`Google Fonts catalog synced: ${catalog.count} families -> .tmp/google-fonts/catalog.json`);
