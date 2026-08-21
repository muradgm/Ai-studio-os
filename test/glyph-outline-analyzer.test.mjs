import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeGlyphOutlines } from '../modules/typography/glyph-outline-analyzer.mjs';
import { enrichFontCatalog } from '../modules/typography/font-intelligence.mjs';

function writeTag(view, offset, tag) {
  for (let i = 0; i < 4; i += 1) view.setUint8(offset + i, tag.charCodeAt(i));
}

function syntheticOutlineFont() {
  const tables = [
    { tag:'head', offset:92, length:54 },
    { tag:'maxp', offset:146, length:6 },
    { tag:'loca', offset:152, length:12 },
    { tag:'cmap', offset:164, length:44 },
    { tag:'glyf', offset:208, length:18 }
  ];
  const buffer = new ArrayBuffer(226);
  const view = new DataView(buffer);
  view.setUint32(0, 0x00010000, false);
  view.setUint16(4, tables.length, false);
  tables.forEach((table, index) => {
    const base = 12 + index * 16;
    writeTag(view, base, table.tag);
    view.setUint32(base + 8, table.offset, false);
    view.setUint32(base + 12, table.length, false);
  });

  view.setUint16(92 + 18, 1000, false);
  view.setInt16(92 + 50, 1, false);
  view.setUint16(146 + 4, 2, false);

  view.setUint32(152, 0, false);
  view.setUint32(156, 0, false);
  view.setUint32(160, 18, false);

  const cmap = 164;
  view.setUint16(cmap, 0, false);
  view.setUint16(cmap + 2, 1, false);
  view.setUint16(cmap + 4, 3, false);
  view.setUint16(cmap + 6, 1, false);
  view.setUint32(cmap + 8, 12, false);
  const sub = cmap + 12;
  view.setUint16(sub, 4, false);
  view.setUint16(sub + 2, 32, false);
  view.setUint16(sub + 6, 4, false);
  view.setUint16(sub + 8, 4, false);
  view.setUint16(sub + 10, 1, false);
  view.setUint16(sub + 12, 0, false);
  view.setUint16(sub + 14, 0x006f, false);
  view.setUint16(sub + 16, 0xffff, false);
  view.setUint16(sub + 18, 0, false);
  view.setUint16(sub + 20, 0x006f, false);
  view.setUint16(sub + 22, 0xffff, false);
  view.setInt16(sub + 24, 1 - 0x006f, false);
  view.setInt16(sub + 26, 1, false);
  view.setUint16(sub + 28, 0, false);
  view.setUint16(sub + 30, 0, false);

  const glyph = 208;
  view.setInt16(glyph, 1, false);
  view.setInt16(glyph + 2, 0, false);
  view.setInt16(glyph + 4, 0, false);
  view.setInt16(glyph + 6, 500, false);
  view.setInt16(glyph + 8, 500, false);
  view.setUint16(glyph + 10, 3, false);
  view.setUint16(glyph + 12, 0, false);
  view.setUint8(glyph + 14, 0x01);
  view.setUint8(glyph + 15, 0x00);
  view.setUint8(glyph + 16, 0x01);
  view.setUint8(glyph + 17, 0x00);
  return buffer;
}

test('glyph analyzer measures representative TrueType outline structure', () => {
  const output = analyzeGlyphOutlines(syntheticOutlineFont(), {
    family:'Outline Test',
    codepoints:[0x006f],
    reference:'fixture://outline-test.ttf'
  });
  assert.equal(output.available, true);
  assert.equal(output.sampleCoverage, 100);
  assert.equal(output.samples[0].status, 'analyzed');
  assert.equal(output.samples[0].metrics.pointCount, 4);
  assert.equal(output.samples[0].metrics.offCurve, 2);
  assert.equal(output.samples[0].metrics.curveRatio, 0.5);
  assert.ok(output.evidence.descriptors.roundness > 0);
  assert.ok(output.evidence.descriptors.complexity >= 0);
  assert.equal(output.evidence.sources[0].type, 'glyph-outline-metrics');
});

test('multiple evidence sources for one family are merged rather than overwritten', () => {
  const outline = analyzeGlyphOutlines(syntheticOutlineFont(), { family:'Outline Test', codepoints:[0x006f] }).evidence;
  const binary = {
    family:'Outline Test',
    descriptors:{ xHeight:52, width:50 },
    sources:[{ type:'font-binary-metrics', reference:'fixture://binary', confidence:98 }]
  };
  const [font] = enrichFontCatalog([{family:'Outline Test',category:'sans-serif'}], [binary, outline]);
  assert.equal(font.intelligence.descriptors.xHeight, 52);
  assert.ok(Number.isFinite(font.intelligence.descriptors.roundness));
  assert.equal(font.intelligence.sources.length, 2);
});

test('outline analyzer degrades cleanly when glyf/loca outlines are absent', () => {
  const buffer = new ArrayBuffer(12);
  const view = new DataView(buffer);
  view.setUint32(0, 0x00010000, false);
  view.setUint16(4, 0, false);
  const output = analyzeGlyphOutlines(buffer, { family:'No Outlines' });
  assert.equal(output.available, false);
  assert.match(output.reason, /glyf\/loca/);
});
