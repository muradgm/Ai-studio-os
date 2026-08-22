import fs from 'node:fs/promises';
import path from 'node:path';

import { readTypographyCatalog } from '../modules/typography/catalog.mjs';
import { analyzeFontCatalog } from '../modules/typography/catalog-analysis.mjs';

const cachePath = process.env.GOOGLE_FONTS_INTELLIGENCE_CACHE || '.tmp/google-fonts/intelligence.json';
const catalog = await readTypographyCatalog();
if (!catalog) {
  console.error('Google Fonts catalog cache is missing. Run npm run fonts:sync first.');
  process.exit(1);
}

const limitArg = Number(process.env.GOOGLE_FONTS_ANALYZE_LIMIT);
const concurrencyArg = Number(process.env.GOOGLE_FONTS_ANALYZE_CONCURRENCY);
const analysis = await analyzeFontCatalog(catalog.fonts, {
  limit: Number.isInteger(limitArg) && limitArg > 0 ? limitArg : catalog.fonts.length,
  concurrency: Number.isInteger(concurrencyArg) && concurrencyArg > 0 ? concurrencyArg : 4
});

const artifact = {
  version: 1,
  provider: catalog.provider ?? 'google-fonts',
  catalogFetchedAt: catalog.fetchedAt ?? null,
  analyzedAt: new Date().toISOString(),
  attempted: analysis.attempted,
  analyzed: analysis.analyzed,
  glyphAnalyzed: analysis.glyphAnalyzed,
  strokeAnalyzed: analysis.strokeAnalyzed,
  unsupported: analysis.unsupported,
  unavailable: analysis.unavailable,
  evidence: analysis.evidence,
  failures: analysis.results
    .filter((item) => item?.status !== 'analyzed')
    .map((item) => ({ family:item?.family ?? null, status:item?.status ?? 'unknown', reason:item?.reason ?? null }))
};

await fs.mkdir(path.dirname(cachePath), { recursive:true });
await fs.writeFile(cachePath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ cachePath, ...artifact, evidence:undefined, failures:undefined }, null, 2));
