import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeFontCatalog } from '../modules/typography/catalog-analysis.mjs';

function emptyFontResponse() {
  const buffer = new ArrayBuffer(12);
  const view = new DataView(buffer);
  view.setUint32(0, 0x00010000, false);
  view.setUint16(4, 0, false);
  return buffer;
}

test('Google catalog analysis rejects non-gstatic provider URLs before network access', async () => {
  let called = false;
  const fetchImpl = async () => {
    called = true;
    throw new Error('should not fetch');
  };
  const result = await analyzeFontCatalog([
    {
      family:'Unsafe Google Font',
      provider:'google-fonts',
      files:{ regular:'http://127.0.0.1/private.ttf' }
    }
  ], { fetchImpl, includeGlyphOutlines:false, includeStrokeAnalysis:false });
  assert.equal(called, false);
  assert.equal(result.unavailable, 1);
  assert.equal(result.results[0].status, 'unavailable');
});

test('Google catalog analysis upgrades approved gstatic URLs to HTTPS', async () => {
  let requested = null;
  const fetchImpl = async (url) => {
    requested = String(url);
    return {
      ok:true,
      status:200,
      headers:{ get:()=>null },
      arrayBuffer:async () => emptyFontResponse()
    };
  };
  const result = await analyzeFontCatalog([
    {
      family:'Approved Google Font',
      provider:'google-fonts',
      files:{ regular:'http://fonts.gstatic.com/s/test/font.ttf' }
    }
  ], { fetchImpl, includeGlyphOutlines:false, includeStrokeAnalysis:false });
  assert.match(requested, /^https:\/\/fonts\.gstatic\.com\//);
  assert.equal(result.results[0].status, 'unsupported');
});

test('custom providers use their explicit remote host policy', async () => {
  let requested = null;
  const fetchImpl = async (url) => {
    requested = String(url);
    return {
      ok:true,
      status:200,
      headers:{ get:()=>null },
      arrayBuffer:async () => emptyFontResponse()
    };
  };
  await analyzeFontCatalog([
    {
      family:'Custom Font',
      provider:'custom-provider',
      files:{ regular:'https://font-cdn.example/custom.ttf' }
    }
  ], {
    fetchImpl,
    includeGlyphOutlines:false,
    includeStrokeAnalysis:false,
    providerPolicies:{
      'custom-provider':{
        protocols:['https:'],
        hosts:['font-cdn.example']
      }
    }
  });
  assert.equal(requested, 'https://font-cdn.example/custom.ttf');
});
