import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeOutlineStrokes } from '../modules/typography/stroke-outline-analyzer.mjs';
import { enrichFontCatalog } from '../modules/typography/font-intelligence.mjs';

function writeTag(view, offset, tag) {
  for (let i = 0; i < 4; i += 1) view.setUint8(offset + i, tag.charCodeAt(i));
}

function syntheticHFont() {
  const glyphLength = 74;
  const tables = [
    { tag:'head', offset:92, length:54 },
    { tag:'maxp', offset:146, length:6 },
    { tag:'loca', offset:152, length:12 },
    { tag:'cmap', offset:164, length:44 },
    { tag:'glyf', offset:208, length:glyphLength }
  ];
  const buffer = new ArrayBuffer(208 + glyphLength);
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
  view.setUint32(160, glyphLength, false);

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
  view.setUint16(sub + 14, 0x0048, false);
  view.setUint16(sub + 16, 0xffff, false);
  view.setUint16(sub + 18, 0, false);
  view.setUint16(sub + 20, 0x0048, false);
  view.setUint16(sub + 22, 0xffff, false);
  view.setInt16(sub + 24, 1 - 0x0048, false);
  view.setInt16(sub + 26, 1, false);
  view.setUint16(sub + 28, 0, false);
  view.setUint16(sub + 30, 0, false);

  const points = [
    [0,0],[100,0],[100,220],[300,220],[300,0],[400,0],
    [400,700],[300,700],[300,320],[100,320],[100,700],[0,700]
  ];
  const glyph = 208;
  view.setInt16(glyph, 1, false);
  view.setInt16(glyph + 2, 0, false);
  view.setInt16(glyph + 4, 0, false);
  view.setInt16(glyph + 6, 400, false);
  view.setInt16(glyph + 8, 700, false);
  view.setUint16(glyph + 10, points.length - 1, false);
  view.setUint16(glyph + 12, 0, false);
  let cursor = glyph + 14;
  for (let i = 0; i < points.length; i += 1) view.setUint8(cursor++, 0x01);
  let previousX = 0;
  for (const [x] of points) { view.setInt16(cursor, x - previousX, false); cursor += 2; previousX = x; }
  let previousY = 0;
  for (const [,y] of points) { view.setInt16(cursor, y - previousY, false); cursor += 2; previousY = y; }
  return buffer;
}

test('stroke analyzer estimates stems from real contour scanline intersections', () => {
  const output = analyzeOutlineStrokes(syntheticHFont(), {
    family:'Synthetic Mono',
    codepoints:[0x48],
    reference:'fixture://synthetic-mono.ttf'
  });
  assert.equal(output.available, true);
  assert.equal(output.sampleCoverage, 100);
  assert.ok(output.runCounts.vertical > 0);
  assert.ok(output.runCounts.horizontal > 0);
  assert.ok(output.descriptors.stemThickness > 0);
  assert.ok(output.descriptors.strokeContrast <= 10);
  assert.equal(output.evidence.sources[0].type, 'glyph-stroke-scanlines');
});

test('measured stroke contrast becomes provenance-backed pairing evidence', () => {
  const stroke = analyzeOutlineStrokes(syntheticHFont(), { family:'Synthetic Mono', codepoints:[0x48] }).evidence;
  const [font] = enrichFontCatalog([{family:'Synthetic Mono',category:'sans-serif'}], [stroke]);
  assert.equal(font.intelligence.evidenceBacked, true);
  assert.ok(Number.isFinite(font.intelligence.descriptors.strokeContrast));
});

test('stroke analyzer degrades cleanly when outlines are unavailable', () => {
  const buffer = new ArrayBuffer(12);
  const view = new DataView(buffer);
  view.setUint32(0, 0x00010000, false);
  view.setUint16(4, 0, false);
  const output = analyzeOutlineStrokes(buffer, { family:'No Outlines' });
  assert.equal(output.available, false);
  assert.match(output.reason, /glyf\/loca/);
});
