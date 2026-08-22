import test from 'node:test';
import assert from 'node:assert/strict';

import { enrichFontCatalog, normalizeFontEvidence, compareFontStructures } from '../modules/typography/font-intelligence.mjs';
import { scorePairing } from '../modules/typography/scoring.mjs';
import { buildTypographySystem } from '../modules/typography/runtime.mjs';

const catalog = [
  { family:'Newsreader', provider:'google-fonts', category:'serif', variants:['regular','500','600'], subsets:['latin','latin-ext'], files:{regular:'x'} },
  { family:'Manrope', provider:'google-fonts', category:'sans-serif', variants:['regular','500','600','700'], subsets:['latin','latin-ext'], files:{regular:'y'} },
  { family:'Poppins', provider:'google-fonts', category:'sans-serif', variants:['regular','500','600','700'], subsets:['latin','latin-ext'], files:{regular:'z'} }
];

const evidence = [
  {
    family:'Newsreader',
    descriptors:{ xHeight:58, width:54, strokeContrast:76, geometry:'humanist', rhythm:'textual', terminals:'calligraphic', aperture:62, humanism:84 },
    sources:[{ type:'manual-analysis', reference:'specimen-review:newsreader-v1', confidence:92 }]
  },
  {
    family:'Manrope',
    descriptors:{ xHeight:66, width:61, strokeContrast:28, geometry:'geometric-humanist', rhythm:'open', terminals:'clean', aperture:76, humanism:52 },
    sources:[{ type:'manual-analysis', reference:'specimen-review:manrope-v1', confidence:90 }]
  }
];

test('font evidence requires both descriptors and source provenance to be evidence-backed', () => {
  const valid = normalizeFontEvidence(evidence[0]);
  const unsupported = normalizeFontEvidence({ family:'Ghost Sans', descriptors:{ xHeight:60 } });
  assert.equal(valid.evidenceBacked, true);
  assert.equal(unsupported.evidenceBacked, false);
  assert.equal(valid.confidence, 92);
});

test('catalog enrichment is non-destructive for fonts without evidence', () => {
  const enriched = enrichFontCatalog(catalog, evidence);
  assert.equal(enriched[0].intelligence.evidenceBacked, true);
  assert.equal(enriched[2].intelligence, undefined);
  assert.equal(catalog[0].intelligence, undefined);
});

test('structural comparison exposes evidence provenance and confidence', () => {
  const [newsreader, manrope] = enrichFontCatalog(catalog.slice(0,2), evidence);
  const comparison = compareFontStructures(newsreader, manrope);
  assert.equal(comparison.available, true);
  assert.ok(comparison.confidence >= 90);
  assert.ok(comparison.evidence.primarySources.length > 0);
  assert.ok(comparison.score > 0);
});

test('pairing explicitly distinguishes evidence-backed structural judgment from catalog-only judgment', () => {
  const [newsreader, manrope, poppins] = enrichFontCatalog(catalog, evidence);
  const enrichedPair = scorePairing(newsreader, manrope, { requirements:{ languages:['de','en'] } });
  const metadataPair = scorePairing(newsreader, poppins, { requirements:{ languages:['de','en'] } });
  assert.equal(enrichedPair.evidenceLevel, 'evidence-backed-structural');
  assert.equal(metadataPair.evidenceLevel, 'catalog-metadata');
  assert.ok(enrichedPair.structural.confidence >= 90);
});

test('typography runtime carries intelligence into selected font roles without requiring it for all fonts', () => {
  const output = buildTypographySystem({
    catalog,
    fontEvidence:evidence,
    business:{ type:'French patisserie', model:'local-retail', positioning:'accessible-luxury' },
    brand:{ traits:['warm','refined','contemporary'] },
    requirements:{ languages:['de','fr','en'] },
    pairing:{ minScore:60 }
  });
  assert.equal(output.pass, true);
  assert.equal(output.intelligence.evidenceFamilies, 2);
  assert.ok(['evidence-backed-structural','catalog-metadata'].includes(output.intelligence.winnerEvidenceLevel));
  assert.ok(output.selection.display.intelligence || output.selection.body.intelligence);
});
