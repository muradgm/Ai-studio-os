import { syncGoogleFontsCatalog } from '../modules/typography/google-fonts-sync.mjs';

const catalog = await syncGoogleFontsCatalog();
console.log(`Google Fonts catalog synced: ${catalog.count} families (VF capability enabled) -> .tmp/google-fonts/catalog.json`);
