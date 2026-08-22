import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeFontBinary, analyzeFontUrl, analyzeCatalogFont } from '../modules/typography/font-binary-analyzer.mjs';
import { normalizeFontEvidence, enrichFontCatalog } from '../modules/typography/font-intelligence.mjs';

function writeTag(view, offset, tag) {
  for (let index = 0; index < 4; index += 1) view.setUint8(offset + index, tag.charCodeAt(index));
}

function syntheticFont() {
  const tables = [
    { tag:'head', offset:76, length:54 },
    { tag:'OS/2', offset:132, length:90 },
    { tag:'hhea', offset:224, length:36 },
    { tag:'post', offset:260, length:12 }
  ];
  const buffer = new ArrayBuffer(272);
  const view = new DataView(buffer);
  view.setUint32(0, 0x00010000, false);
  view.setUint16(4, tables.length, false);
  tables.forEach((table, index) => {
    const base = 12 + index * 16;
    writeTag(view, base, table.tag);
    view.setUint32(base + 8, table.offset, false);
    view.setUint32(base + 12, table.length, false);
  });

  const head = tables[0].offset;
  view.setUint16(head + 18, 1000, false);
  view.setInt16(head + 36, -50, false);
  view.setInt16(head + 38, -250, false);
  view.setInt16(head + 40, 1050, false);
  view.setInt16(head + 42, 800, false);
  view.setInt16(head + 50, 1, false);

  const os2 = tables[1].offset;
  view.setUint16(os2, 4, false);
  view.setInt16(os2 + 2, 520, false);
  view.setUint16(os2 + 4, 400, false);
  view.setUint16(os2 + 6, 5, false);
  view.setInt16(os2 + 68, 750, false);
  view.setInt16(os2 + 70, -250, false);
  view.setInt16(os2 + 72, 100, false);
  view.setUint16(os2 + 74, 800, false);
  view.setUint16(os2 + 76, 250, false);
  view.setInt16(os2 + 86, 520, false);
  view.setInt16(os2 + 88, 700, false);

  const hhea = tables[2].offset;
  view.setInt16(hhea + 4, 800, false);
  view.setInt16(hhea + 6, -200, false);
  view.setInt16(hhea + 8, 0, false);

  const post = tables[3].offset;
  view.setInt32(post, 0x00030000, false);
  view.setInt32(post + 4, 0, false);
  view.setInt16(post + 8, -100, false);
  view.setInt16(post + 10, 50, false);
  return buffer;
}

test('binary analyzer extracts normalized OpenType metrics without guessing stylistic traits', () => {
  const output = analyzeFontBinary(syntheticFont(), { family:'Measured Sans', reference:'fixture://measured-sans.ttf' });
  assert.equal(output.format, 'ttf');
  assert.equal(output.metrics.unitsPerEm, 1000);
  assert.equal(output.metrics.os2.normalized.xHeight, 52);
  assert.equal(output.metrics.os2.normalized.averageWidth, 52);
  assert.equal(output.metrics.os2.normalized.capHeight, 70);
  assert.equal(output.metrics.hhea.normalized.ascender, 80);
  assert.equal(output.evidence.descriptors.xHeight, 52);
  assert.equal(output.evidence.descriptors.width, 52);
  assert.ok(output.unresolved.includes('strokeContrast'));
  assert.equal('strokeContrast' in output.evidence.descriptors, false);
});

test('binary measurements become provenance-backed font intelligence', () => {
  const output = analyzeFontBinary(syntheticFont(), { family:'Measured Sans', reference:'fixture://measured-sans.ttf' });
  const normalized = normalizeFontEvidence(output.evidence);
  assert.equal(normalized.evidenceBacked, true);
  assert.equal(normalized.confidence, 98);
  const enriched = enrichFontCatalog([{family:'Measured Sans', category:'sans-serif'}], [output.evidence]);
  assert.equal(enriched[0].intelligence.descriptors.xHeight, 52);
});

test('WOFF2 is explicitly rejected until decompressed rather than misparsed', () => {
  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);
  writeTag(view, 0, 'wOF2');
  assert.throws(() => analyzeFontBinary(buffer), /WOFF2 input must be decompressed/i);
});

test('URL analyzer enforces maximum binary size before parsing', async () => {
  const fetchImpl = async () => ({
    ok:true,
    headers:{ get:(name) => name === 'content-length' ? '9000000' : null },
    arrayBuffer:async () => syntheticFont()
  });
  await assert.rejects(() => analyzeFontUrl('https://fonts.example/test.ttf', { fetchImpl, maxBytes:1024 }), /exceeds 1024 byte/);
});

test('catalog analyzer chooses a usable variant and returns evidence', async () => {
  const fetchImpl = async () => ({
    ok:true,
    headers:{ get:() => null },
    arrayBuffer:async () => syntheticFont()
  });
  const output = await analyzeCatalogFont({
    family:'Measured Sans',
    files:{ regular:'https://fonts.example/measured-sans.ttf' }
  }, { fetchImpl });
  assert.equal(output.status, 'analyzed');
  assert.equal(output.variant, 'regular');
  assert.equal(output.analysis.evidence.family, 'Measured Sans');
});

test('catalog analyzer degrades cleanly when no files exist', async () => {
  const output = await analyzeCatalogFont({ family:'No Files', files:{} });
  assert.equal(output.status, 'unavailable');
});
