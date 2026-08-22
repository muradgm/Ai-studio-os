const REPRESENTATIVE_CODEPOINTS = [0x48, 0x4f, 0x6f, 0x6e, 0x61, 0x65, 0x73]; // H O o n a e s

function asArrayBuffer(input) {
  if (input instanceof ArrayBuffer) return input;
  if (ArrayBuffer.isView(input)) return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  throw new TypeError('font binary must be an ArrayBuffer or typed-array view');
}

function tagAt(view, offset) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}

function assertRange(view, offset, length, label) {
  if (offset < 0 || length < 0 || offset + length > view.byteLength) throw new RangeError(`${label} exceeds font binary bounds`);
}

function readDirectory(view) {
  if (view.byteLength < 12) throw new Error('font binary is too small for an SFNT header');
  const signature = view.getUint32(0, false);
  if (![0x00010000, 0x4f54544f, 0x74727565, 0x74797031].includes(signature)) {
    const tag = tagAt(view, 0);
    if (tag === 'wOFF' || tag === 'wOF2') throw new Error('compressed WOFF input must be decompressed before glyph outline analysis');
    throw new Error('unsupported font binary signature');
  }
  const numTables = view.getUint16(4, false);
  assertRange(view, 0, 12 + numTables * 16, 'SFNT table directory');
  const tables = new Map();
  for (let i = 0; i < numTables; i += 1) {
    const base = 12 + i * 16;
    const tag = tagAt(view, base);
    const offset = view.getUint32(base + 8, false);
    const length = view.getUint32(base + 12, false);
    assertRange(view, offset, length, `table ${tag}`);
    tables.set(tag, { offset, length });
  }
  return tables;
}

function tableView(view, table, minimum = 0) {
  if (!table || table.length < minimum) return null;
  return new DataView(view.buffer, view.byteOffset + table.offset, table.length);
}

function parseHead(view, table) {
  const data = tableView(view, table, 54);
  if (!data) throw new Error('head table is required');
  return { unitsPerEm: data.getUint16(18, false), indexToLocFormat: data.getInt16(50, false) };
}

function parseMaxp(view, table) {
  const data = tableView(view, table, 6);
  if (!data) throw new Error('maxp table is required');
  return { numGlyphs: data.getUint16(4, false) };
}

function parseLoca(view, table, numGlyphs, format) {
  const data = tableView(view, table, format === 0 ? (numGlyphs + 1) * 2 : (numGlyphs + 1) * 4);
  if (!data) throw new Error('loca table is missing or truncated');
  const offsets = [];
  for (let i = 0; i <= numGlyphs; i += 1) offsets.push(format === 0 ? data.getUint16(i * 2, false) * 2 : data.getUint32(i * 4, false));
  return offsets;
}

function parseCmapFormat4(data, offset, codepoint) {
  const segCount = data.getUint16(offset + 6, false) / 2;
  const endCodes = offset + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const idDeltas = startCodes + segCount * 2;
  const idRangeOffsets = idDeltas + segCount * 2;
  for (let i = 0; i < segCount; i += 1) {
    const end = data.getUint16(endCodes + i * 2, false);
    const start = data.getUint16(startCodes + i * 2, false);
    if (codepoint < start || codepoint > end) continue;
    const delta = data.getInt16(idDeltas + i * 2, false);
    const rangeOffset = data.getUint16(idRangeOffsets + i * 2, false);
    if (rangeOffset === 0) return (codepoint + delta) & 0xffff;
    const glyphOffset = idRangeOffsets + i * 2 + rangeOffset + (codepoint - start) * 2;
    if (glyphOffset + 2 > data.byteLength) return 0;
    const glyph = data.getUint16(glyphOffset, false);
    return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
  }
  return 0;
}

function parseCmapFormat12(data, offset, codepoint) {
  const nGroups = data.getUint32(offset + 12, false);
  let lo = 0, hi = nGroups - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const base = offset + 16 + mid * 12;
    const start = data.getUint32(base, false);
    const end = data.getUint32(base + 4, false);
    if (codepoint < start) hi = mid - 1;
    else if (codepoint > end) lo = mid + 1;
    else return data.getUint32(base + 8, false) + (codepoint - start);
  }
  return 0;
}

function makeCmapResolver(view, table) {
  const data = tableView(view, table, 4);
  if (!data) throw new Error('cmap table is required');
  const count = data.getUint16(2, false);
  const candidates = [];
  for (let i = 0; i < count; i += 1) {
    const base = 4 + i * 8;
    const platform = data.getUint16(base, false);
    const encoding = data.getUint16(base + 2, false);
    const offset = data.getUint32(base + 4, false);
    if (offset + 2 > data.byteLength) continue;
    const format = data.getUint16(offset, false);
    if (format === 12) candidates.push({ priority: platform === 3 && encoding === 10 ? 0 : 1, format, offset });
    else if (format === 4) candidates.push({ priority: platform === 3 ? 2 : 3, format, offset });
  }
  candidates.sort((a, b) => a.priority - b.priority);
  if (!candidates.length) throw new Error('no supported cmap format (4 or 12)');
  return (codepoint) => {
    for (const cmap of candidates) {
      const glyph = cmap.format === 12 ? parseCmapFormat12(data, cmap.offset, codepoint) : parseCmapFormat4(data, cmap.offset, codepoint);
      if (glyph) return glyph;
    }
    return 0;
  };
}

function parseSimpleGlyph(view, glyf, start, end, unitsPerEm) {
  if (start === end) return { empty: true };
  if (end > glyf.length) throw new RangeError('glyph exceeds glyf table bounds');
  const data = new DataView(view.buffer, view.byteOffset + glyf.offset + start, end - start);
  if (data.byteLength < 10) return { unsupported: true, reason: 'truncated-glyph' };
  const contours = data.getInt16(0, false);
  const xMin = data.getInt16(2, false), yMin = data.getInt16(4, false), xMax = data.getInt16(6, false), yMax = data.getInt16(8, false);
  if (contours < 0) return { composite: true, bounds: { xMin, yMin, xMax, yMax } };
  if (contours === 0) return { empty: true, bounds: { xMin, yMin, xMax, yMax } };
  const endPtsOffset = 10;
  if (endPtsOffset + contours * 2 + 2 > data.byteLength) return { unsupported: true, reason: 'truncated-contours' };
  let lastPoint = -1;
  for (let i = 0; i < contours; i += 1) lastPoint = data.getUint16(endPtsOffset + i * 2, false);
  const pointCount = lastPoint + 1;
  const instructionLengthOffset = endPtsOffset + contours * 2;
  const instructionLength = data.getUint16(instructionLengthOffset, false);
  let flagOffset = instructionLengthOffset + 2 + instructionLength;
  if (flagOffset > data.byteLength) return { unsupported: true, reason: 'truncated-instructions' };
  let onCurve = 0, offCurve = 0, decoded = 0;
  while (decoded < pointCount) {
    if (flagOffset >= data.byteLength) return { unsupported: true, reason: 'truncated-flags' };
    const flag = data.getUint8(flagOffset++);
    const repeats = (flag & 0x08) ? (flagOffset < data.byteLength ? data.getUint8(flagOffset++) : 0) : 0;
    const copies = repeats + 1;
    const curve = (flag & 0x01) !== 0;
    if (curve) onCurve += copies; else offCurve += copies;
    decoded += copies;
    if (decoded > pointCount) return { unsupported: true, reason: 'invalid-flag-repeat' };
  }
  const width = Math.max(0, xMax - xMin), height = Math.max(0, yMax - yMin);
  return {
    contours,
    pointCount,
    onCurve,
    offCurve,
    curveRatio: pointCount ? offCurve / pointCount : 0,
    aspectRatio: height ? width / height : null,
    normalizedWidth: unitsPerEm ? width / unitsPerEm : null,
    normalizedHeight: unitsPerEm ? height / unitsPerEm : null,
    bounds: { xMin, yMin, xMax, yMax }
  };
}

function clamp100(value) { return Math.max(0, Math.min(100, Math.round(value))); }

function summarize(samples) {
  const simple = samples.filter((sample) => sample.metrics && Number.isFinite(sample.metrics.pointCount));
  if (!simple.length) return { descriptors: {}, confidence: 0, coverage: 0 };
  const avg = (fn) => simple.reduce((sum, sample) => sum + fn(sample.metrics), 0) / simple.length;
  const avgCurve = avg((m) => m.curveRatio);
  const avgPoints = avg((m) => m.pointCount);
  const avgContours = avg((m) => m.contours);
  const aspectValues = simple.map((s) => s.metrics.aspectRatio).filter(Number.isFinite);
  const avgAspect = aspectValues.length ? aspectValues.reduce((a, b) => a + b, 0) / aspectValues.length : null;
  const descriptors = {
    roundness: clamp100(avgCurve * 150),
    complexity: clamp100((avgPoints / 80) * 100)
  };
  if (avgAspect !== null) descriptors.proportion = clamp100(Math.min(avgAspect, 1.5) / 1.5 * 100);
  const coverage = simple.length / samples.length;
  const confidence = clamp100(55 + coverage * 35 + Math.min(avgContours, 4) * 2.5);
  return { descriptors, confidence, coverage: Math.round(coverage * 100) };
}

export function analyzeGlyphOutlines(input, { family = null, codepoints = REPRESENTATIVE_CODEPOINTS, reference = null } = {}) {
  const buffer = asArrayBuffer(input);
  const view = new DataView(buffer);
  const tables = readDirectory(view);
  if (!tables.has('glyf') || !tables.has('loca')) {
    return { available: false, reason: 'outline analysis currently requires TrueType glyf/loca outlines', evidence: null, samples: [] };
  }
  const head = parseHead(view, tables.get('head'));
  const maxp = parseMaxp(view, tables.get('maxp'));
  const loca = parseLoca(view, tables.get('loca'), maxp.numGlyphs, head.indexToLocFormat);
  const resolveGlyph = makeCmapResolver(view, tables.get('cmap'));
  const glyf = tables.get('glyf');
  const samples = [];
  for (const codepoint of codepoints) {
    const glyphId = resolveGlyph(codepoint);
    if (!glyphId || glyphId >= maxp.numGlyphs) {
      samples.push({ codepoint, character: String.fromCodePoint(codepoint), glyphId: 0, status: 'missing' });
      continue;
    }
    const metrics = parseSimpleGlyph(view, glyf, loca[glyphId], loca[glyphId + 1], head.unitsPerEm);
    const status = metrics.composite ? 'composite' : metrics.unsupported ? 'unsupported' : metrics.empty ? 'empty' : 'analyzed';
    samples.push({ codepoint, character: String.fromCodePoint(codepoint), glyphId, status, ...(status === 'analyzed' ? { metrics } : { detail: metrics }) });
  }
  const summary = summarize(samples);
  const evidence = family && Object.keys(summary.descriptors).length
    ? {
        family,
        descriptors: summary.descriptors,
        sources: [{ type: 'glyph-outline-metrics', reference: reference || `glyph-outline:${family}`, confidence: summary.confidence }]
      }
    : null;
  return {
    available: true,
    unitsPerEm: head.unitsPerEm,
    sampleCoverage: summary.coverage,
    descriptors: summary.descriptors,
    evidence,
    samples,
    unresolved: ['strokeContrast', 'terminals', 'aperture', 'serifStyle', 'humanism', 'geometry', 'rhythm']
  };
}

export { REPRESENTATIVE_CODEPOINTS };
