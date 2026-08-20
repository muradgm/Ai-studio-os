import test from 'node:test';
import assert from 'node:assert/strict';

import { createGoogleFontsProvider, normalizeGoogleFont } from '../modules/typography/google-fonts-provider.mjs';
import { scorePairing, supportsLanguages } from '../modules/typography/scoring.mjs';
import { buildTypographySystem } from '../modules/typography/runtime.mjs';
import { buildGoogleFontsCss2Url } from '../modules/typography/export.mjs';
import { buildDesignPacket } from '../modules/design/runtime.mjs';

const catalog = [
  normalizeGoogleFont({ family:'Newsreader', category:'serif', variants:['regular','500','600','700'], subsets:['latin','latin-ext'], files:{regular:'https://fonts.gstatic.test/newsreader.woff2'}, axes:[{tag:'wght',start:200,end:800}] }),
  normalizeGoogleFont({ family:'Manrope', category:'sans-serif', variants:['regular','500','600','700','800'], subsets:['latin','latin-ext'], files:{regular:'https://fonts.gstatic.test/manrope.woff2'}, axes:[{tag:'wght',start:200,end:800}] }),
  normalizeGoogleFont({ family:'IBM Plex Mono', category:'monospace', variants:['regular','500','600'], subsets:['latin','latin-ext'], files:{regular:'https://fonts.gstatic.test/plex.woff2'} }),
  normalizeGoogleFont({ family:'Poppins', category:'sans-serif', variants:['regular','500','600','700'], subsets:['latin','latin-ext'], files:{regular:'https://fonts.gstatic.test/poppins.woff2'} }),
  normalizeGoogleFont({ family:'Noto Sans Arabic', category:'sans-serif', variants:['regular','500','700'], subsets:['arabic'], files:{regular:'https://fonts.gstatic.test/arabic.woff2'} })
];

test('google provider normalizes catalog and caches identical list requests', async () => {
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    assert.match(String(url), /webfonts/);
    return { ok:true, json:async () => ({ items:[{ family:'Manrope', category:'sans-serif', variants:['regular'], subsets:['latin'], files:{regular:'x'} }] }) };
  };
  const provider = createGoogleFontsProvider({ apiKey:'test-key', fetchImpl, now:() => 1000 });
  const first = await provider.list();
  const second = await provider.list();
  assert.equal(first.fonts[0].provider, 'google-fonts');
  assert.equal(second.count, 1);
  assert.equal(calls, 1);
});

test('google provider never operates without a server-side API key', async () => {
  const provider = createGoogleFontsProvider({ apiKey:'', fetchImpl:async () => ({ok:true,json:async()=>({items:[]})}) });
  await assert.rejects(() => provider.list(), /GOOGLE_FONTS_API_KEY/);
});

test('language coverage rejects fonts missing required scripts', () => {
  assert.equal(supportsLanguages(catalog[0], ['de','fr','en']), true);
  assert.equal(supportsLanguages(catalog[0], ['ar']), false);
});

test('pairing rewards hierarchy contrast and complete language coverage', () => {
  const good = scorePairing(catalog[0], catalog[1], { requirements:{ languages:['de','fr','en'] } });
  const weaker = scorePairing(catalog[1], catalog[3], { requirements:{ languages:['de','fr','en'] } });
  assert.ok(good.score > weaker.score);
});

test('typography system is business-aware, pairing-aware, and production-ready', () => {
  const result = buildTypographySystem({
    catalog,
    business:{ type:'French patisserie', model:'local-retail', positioning:'accessible-luxury' },
    brand:{ traits:['warm','refined','artisanal','contemporary'] },
    requirements:{ languages:['de','fr','en'] },
    marketCommonFamilies:['Poppins']
  });
  assert.equal(result.pass, true);
  assert.equal(result.selection.display.family, 'Newsreader');
  assert.notEqual(result.selection.body.family, result.selection.display.family);
  assert.equal(result.selection.utility.family, 'IBM Plex Mono');
  assert.match(result.production.css2Url, /fonts\.googleapis\.com\/css2/);
  assert.ok(result.systems[0].pairing.score >= 80);
});

test('typography system blocks cleanly when catalog is unavailable', () => {
  const result = buildTypographySystem({ catalog:[] });
  assert.equal(result.pass, false);
  assert.equal(result.findings[0].code, 'typography-catalog-empty');
});

test('css2 export encodes families and selected weights without exposing API keys', () => {
  const url = buildGoogleFontsCss2Url([
    {family:'Newsreader',weights:[400,600],source:'google-fonts'},
    {family:'IBM Plex Mono',weights:[400,500],source:'google-fonts'}
  ]);
  assert.match(url, /Newsreader:wght@400;600/);
  assert.match(url, /IBM\+Plex\+Mono:wght@400;500/);
  assert.doesNotMatch(url, /key=/i);
});

test('design packet preserves legacy typography shape when no resolved system is supplied', () => {
  const packet = buildDesignPacket({ direction:{ directionStatement:'D', traits:[], antiPrinciples:[] } });
  assert.equal(packet.typography.display, 'character-bearing display role; never select a typeface by category cliché alone');
  assert.equal('selection' in packet.typography, false);
});

test('design packet carries resolved type selections and production config when available', () => {
  const typography = buildTypographySystem({
    catalog,
    business:{ type:'French patisserie' },
    brand:{ traits:['refined'] },
    requirements:{ languages:['de','fr','en'] }
  });
  const packet = buildDesignPacket({ direction:{ directionStatement:'D', traits:[], antiPrinciples:[] }, typography });
  assert.equal(packet.typography.selection.display.family, 'Newsreader');
  assert.ok(packet.typography.pairingScore > 0);
  assert.match(packet.typography.production.css2Url, /fonts\.googleapis\.com/);
});
