const DEFAULT_CODEPOINTS = [0x48, 0x4f, 0x6f, 0x6e]; // H O o n

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
  if (![0x00010000, 0x74727565, 0x74797031].includes(signature)) {
    const tag = tagAt(view, 0);
    if (tag === 'OTTO') return { unsupported: 'CFF/CFF2 outlines are not supported by the TrueType stroke analyzer' };
    if (tag === 'wOFF' || tag === 'wOF2') return { unsupported: 'compressed WOFF input must be decompressed before stroke analysis' };
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
  return { tables };
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
  return data.getUint16(4, false);
}

function parseLoca(view, table, numGlyphs, format) {
  const length = format === 0 ? (numGlyphs + 1) * 2 : (numGlyphs + 1) * 4;
  const data = tableView(view, table, length);
  if (!data) throw new Error('loca table is missing or truncated');
  return Array.from({ length: numGlyphs + 1 }, (_, i) => format === 0 ? data.getUint16(i * 2, false) * 2 : data.getUint32(i * 4, false));
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
    if (!rangeOffset) return (codepoint + delta) & 0xffff;
    const glyphOffset = idRangeOffsets + i * 2 + rangeOffset + (codepoint - start) * 2;
    if (glyphOffset + 2 > data.byteLength) return 0;
    const glyph = data.getUint16(glyphOffset, false);
    return glyph ? (glyph + delta) & 0xffff : 0;
  }
  return 0;
}

function parseCmapFormat12(data, offset, codepoint) {
  const count = data.getUint32(offset + 12, false);
  let lo = 0, hi = count - 1;
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
    if (format === 4) candidates.push({ priority: platform === 3 ? 2 : 3, format, offset });
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

function decodeSimpleGlyph(view, glyf, start, end) {
  if (start === end || end > glyf.length) return null;
  const data = new DataView(view.buffer, view.byteOffset + glyf.offset + start, end - start);
  if (data.byteLength < 10) return null;
  const contourCount = data.getInt16(0, false);
  if (contourCount <= 0) return null;
  const bounds = { xMin:data.getInt16(2,false), yMin:data.getInt16(4,false), xMax:data.getInt16(6,false), yMax:data.getInt16(8,false) };
  const endPts = [];
  for (let i = 0; i < contourCount; i += 1) endPts.push(data.getUint16(10 + i * 2, false));
  const pointCount = endPts[endPts.length - 1] + 1;
  const instructionOffset = 10 + contourCount * 2;
  if (instructionOffset + 2 > data.byteLength) return null;
  const instructionLength = data.getUint16(instructionOffset, false);
  let cursor = instructionOffset + 2 + instructionLength;
  if (cursor > data.byteLength) return null;

  const flags = [];
  while (flags.length < pointCount) {
    if (cursor >= data.byteLength) return null;
    const flag = data.getUint8(cursor++);
    flags.push(flag);
    if (flag & 0x08) {
      if (cursor >= data.byteLength) return null;
      const repeats = data.getUint8(cursor++);
      for (let i = 0; i < repeats; i += 1) flags.push(flag);
    }
    if (flags.length > pointCount) return null;
  }

  const xs = [];
  let x = 0;
  for (const flag of flags) {
    let delta = 0;
    if (flag & 0x02) {
      if (cursor >= data.byteLength) return null;
      const value = data.getUint8(cursor++);
      delta = (flag & 0x10) ? value : -value;
    } else if (!(flag & 0x10)) {
      if (cursor + 2 > data.byteLength) return null;
      delta = data.getInt16(cursor, false); cursor += 2;
    }
    x += delta; xs.push(x);
  }

  const ys = [];
  let y = 0;
  for (const flag of flags) {
    let delta = 0;
    if (flag & 0x04) {
      if (cursor >= data.byteLength) return null;
      const value = data.getUint8(cursor++);
      delta = (flag & 0x20) ? value : -value;
    } else if (!(flag & 0x20)) {
      if (cursor + 2 > data.byteLength) return null;
      delta = data.getInt16(cursor, false); cursor += 2;
    }
    y += delta; ys.push(y);
  }

  const points = flags.map((flag, i) => ({ x:xs[i], y:ys[i], onCurve:(flag & 0x01) !== 0 }));
  const contours = [];
  let startPoint = 0;
  for (const endPoint of endPts) {
    contours.push(points.slice(startPoint, endPoint + 1));
    startPoint = endPoint + 1;
  }
  return { contours, bounds };
}

function midpoint(a, b) { return { x:(a.x + b.x) / 2, y:(a.y + b.y) / 2, onCurve:true }; }

function normalizedContour(contour) {
  if (!contour.length) return [];
  const expanded = [];
  for (let i = 0; i < contour.length; i += 1) {
    const current = contour[i];
    const next = contour[(i + 1) % contour.length];
    expanded.push(current);
    if (!current.onCurve && !next.onCurve) expanded.push(midpoint(current, next));
  }
  if (!expanded[0].onCurve) {
    const last = expanded[expanded.length - 1];
    expanded.unshift(last.onCurve ? { ...last } : midpoint(last, expanded[0]));
  }
  return expanded;
}

function quadratic(p0, p1, p2, t) {
  const u = 1 - t;
  return { x:u*u*p0.x + 2*u*t*p1.x + t*t*p2.x, y:u*u*p0.y + 2*u*t*p1.y + t*t*p2.y };
}

function flattenContour(contour, steps = 8) {
  const points = normalizedContour(contour);
  if (points.length < 2) return points;
  const flattened = [{ x:points[0].x, y:points[0].y }];
  let i = 0;
  while (i < points.length) {
    const current = points[i % points.length];
    const next = points[(i + 1) % points.length];
    if (current.onCurve && next.onCurve) {
      flattened.push({ x:next.x, y:next.y });
      i += 1;
    } else if (current.onCurve && !next.onCurve) {
      const end = points[(i + 2) % points.length];
      if (!end.onCurve) break;
      for (let s = 1; s <= steps; s += 1) flattened.push(quadratic(current, next, end, s / steps));
      i += 2;
    } else {
      i += 1;
    }
    if (i >= points.length) break;
  }
  return flattened;
}

function intersections(polyline, axis, value) {
  const result = [];
  for (let i = 0; i < polyline.length - 1; i += 1) {
    const a = polyline[i], b = polyline[i + 1];
    const av = axis === 'x' ? a.x : a.y;
    const bv = axis === 'x' ? b.x : b.y;
    if ((av <= value && bv > value) || (bv <= value && av > value)) {
      const t = (value - av) / (bv - av);
      result.push(axis === 'x' ? a.y + t * (b.y - a.y) : a.x + t * (b.x - a.x));
    }
  }
  return result;
}

function filledRuns(polylines, axis, value) {
  const hits = polylines.flatMap((polyline) => intersections(polyline, axis, value)).sort((a,b)=>a-b);
  const runs = [];
  for (let i = 0; i + 1 < hits.length; i += 2) {
    const length = hits[i + 1] - hits[i];
    if (length > 0) runs.push(length);
  }
  return runs;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b)=>a-b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function sampleStrokeRuns(glyph) {
  const width = glyph.bounds.xMax - glyph.bounds.xMin;
  const height = glyph.bounds.yMax - glyph.bounds.yMin;
  if (width <= 0 || height <= 0) return { vertical:[], horizontal:[] };
  const polylines = glyph.contours.map((contour) => flattenContour(contour)).filter((line)=>line.length > 2);
  const vertical = [];
  const horizontal = [];
  for (const fraction of [0.2,0.3,0.4,0.5,0.6,0.7,0.8]) {
    const y = glyph.bounds.yMin + height * fraction;
    for (const run of filledRuns(polylines, 'y', y)) if (run <= width * 0.45) vertical.push(run);
    const x = glyph.bounds.xMin + width * fraction;
    for (const run of filledRuns(polylines, 'x', x)) if (run <= height * 0.45) horizontal.push(run);
  }
  return { vertical, horizontal };
}

function clamp100(value) { return Math.max(0, Math.min(100, Math.round(value))); }

export function analyzeOutlineStrokes(input, { family = null, codepoints = DEFAULT_CODEPOINTS, reference = null } = {}) {
  const buffer = asArrayBuffer(input);
  const view = new DataView(buffer);
  const directory = readDirectory(view);
  if (directory.unsupported) return { available:false, reason:directory.unsupported, evidence:null, samples:[] };
  const tables = directory.tables;
  if (!tables.has('glyf') || !tables.has('loca')) return { available:false, reason:'stroke analysis currently requires TrueType glyf/loca outlines', evidence:null, samples:[] };
  const head = parseHead(view, tables.get('head'));
  const numGlyphs = parseMaxp(view, tables.get('maxp'));
  const loca = parseLoca(view, tables.get('loca'), numGlyphs, head.indexToLocFormat);
  const resolveGlyph = makeCmapResolver(view, tables.get('cmap'));
  const glyf = tables.get('glyf');

  const samples = [];
  const verticalRuns = [];
  const horizontalRuns = [];
  for (const codepoint of codepoints) {
    const glyphId = resolveGlyph(codepoint);
    if (!glyphId || glyphId >= numGlyphs) { samples.push({codepoint,character:String.fromCodePoint(codepoint),status:'missing'}); continue; }
    const glyph = decodeSimpleGlyph(view, glyf, loca[glyphId], loca[glyphId + 1]);
    if (!glyph) { samples.push({codepoint,character:String.fromCodePoint(codepoint),glyphId,status:'unsupported'}); continue; }
    const runs = sampleStrokeRuns(glyph);
    verticalRuns.push(...runs.vertical);
    horizontalRuns.push(...runs.horizontal);
    samples.push({ codepoint, character:String.fromCodePoint(codepoint), glyphId, status:'analyzed', verticalRunCount:runs.vertical.length, horizontalRunCount:runs.horizontal.length });
  }

  const vertical = median(verticalRuns);
  const horizontal = median(horizontalRuns);
  const measured = [vertical, horizontal].filter(Number.isFinite);
  if (!measured.length) return { available:false, reason:'insufficient scanline intersections for stroke estimation', evidence:null, samples };
  const stem = median(measured);
  const descriptors = {
    stemThickness: clamp100((stem / head.unitsPerEm) * 100 * 4)
  };
  if (Number.isFinite(vertical)) descriptors.verticalStroke = clamp100((vertical / head.unitsPerEm) * 100 * 4);
  if (Number.isFinite(horizontal)) descriptors.horizontalStroke = clamp100((horizontal / head.unitsPerEm) * 100 * 4);
  if (Number.isFinite(vertical) && Number.isFinite(horizontal)) descriptors.strokeContrast = clamp100((Math.abs(vertical - horizontal) / Math.max(vertical, horizontal)) * 100);

  const analyzedCount = samples.filter((sample)=>sample.status === 'analyzed').length;
  const coverage = codepoints.length ? analyzedCount / codepoints.length : 0;
  const runSupport = Math.min(1, (verticalRuns.length + horizontalRuns.length) / 24);
  const confidence = clamp100(55 + coverage * 25 + runSupport * 18);
  const evidence = family ? {
    family,
    descriptors,
    sources:[{ type:'glyph-stroke-scanlines', reference:reference || `glyph-strokes:${family}`, confidence }]
  } : null;

  return {
    available:true,
    unitsPerEm:head.unitsPerEm,
    descriptors,
    confidence,
    sampleCoverage:Math.round(coverage * 100),
    runCounts:{ vertical:verticalRuns.length, horizontal:horizontalRuns.length },
    evidence,
    samples,
    unresolved:['terminals','aperture','serifStyle','humanism','geometry','rhythm']
  };
}

export { DEFAULT_CODEPOINTS as STROKE_CODEPOINTS };
