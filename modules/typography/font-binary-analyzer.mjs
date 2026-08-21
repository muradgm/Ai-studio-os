const SFNT_SIGNATURES = new Set([0x00010000, 0x4f54544f, 0x74727565, 0x74797031]);

function asArrayBuffer(input) {
  if (input instanceof ArrayBuffer) return input;
  if (ArrayBuffer.isView(input)) return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  throw new TypeError('font binary must be an ArrayBuffer or typed-array view');
}

function tagAt(view, offset) {
  return String.fromCharCode(
    view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3)
  );
}

function fixed16_16(view, offset) {
  return view.getInt32(offset, false) / 65536;
}

function assertRange(view, offset, length, label) {
  if (offset < 0 || length < 0 || offset + length > view.byteLength) {
    throw new RangeError(`${label} exceeds font binary bounds`);
  }
}

function readDirectory(view) {
  if (view.byteLength < 12) throw new Error('font binary is too small for an SFNT header');
  const signature = view.getUint32(0, false);
  if (!SFNT_SIGNATURES.has(signature)) {
    const tag = tagAt(view, 0);
    if (tag === 'wOFF' || tag === 'wOF2') {
      throw new Error(`${tag === 'wOF2' ? 'WOFF2' : 'WOFF'} input must be decompressed to SFNT before metric analysis`);
    }
    throw new Error('unsupported font binary signature');
  }

  const numTables = view.getUint16(4, false);
  const directoryLength = 12 + numTables * 16;
  assertRange(view, 0, directoryLength, 'SFNT table directory');

  const tables = new Map();
  for (let index = 0; index < numTables; index += 1) {
    const base = 12 + index * 16;
    const tag = tagAt(view, base);
    const offset = view.getUint32(base + 8, false);
    const length = view.getUint32(base + 12, false);
    assertRange(view, offset, length, `table ${tag}`);
    tables.set(tag, { tag, offset, length });
  }
  return tables;
}

function tableView(view, table, minimumLength = 0) {
  if (!table) return null;
  if (table.length < minimumLength) return null;
  return new DataView(view.buffer, view.byteOffset + table.offset, table.length);
}

function ratioPercent(value, unitsPerEm) {
  if (!Number.isFinite(value) || !Number.isFinite(unitsPerEm) || unitsPerEm <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((value / unitsPerEm) * 100)));
}

function parseHead(view, table) {
  const data = tableView(view, table, 54);
  if (!data) return null;
  const unitsPerEm = data.getUint16(18, false);
  if (unitsPerEm < 16 || unitsPerEm > 16384) throw new Error(`invalid unitsPerEm: ${unitsPerEm}`);
  return {
    unitsPerEm,
    bounds: {
      xMin: data.getInt16(36, false), yMin: data.getInt16(38, false),
      xMax: data.getInt16(40, false), yMax: data.getInt16(42, false)
    },
    indexToLocFormat: data.getInt16(50, false)
  };
}

function parseOs2(view, table, unitsPerEm) {
  const data = tableView(view, table, 78);
  if (!data) return null;
  const version = data.getUint16(0, false);
  const result = {
    version,
    xAvgCharWidth: data.getInt16(2, false),
    weightClass: data.getUint16(4, false),
    widthClass: data.getUint16(6, false),
    typoAscender: data.getInt16(68, false),
    typoDescender: data.getInt16(70, false),
    typoLineGap: data.getInt16(72, false),
    winAscent: data.getUint16(74, false),
    winDescent: data.getUint16(76, false),
    sxHeight: null,
    capHeight: null
  };
  if (version >= 2 && data.byteLength >= 90) {
    const sxHeight = data.getInt16(86, false);
    const capHeight = data.getInt16(88, false);
    result.sxHeight = sxHeight > 0 ? sxHeight : null;
    result.capHeight = capHeight > 0 ? capHeight : null;
  }
  return {
    ...result,
    normalized: {
      averageWidth: ratioPercent(Math.abs(result.xAvgCharWidth), unitsPerEm),
      xHeight: ratioPercent(result.sxHeight, unitsPerEm),
      capHeight: ratioPercent(result.capHeight, unitsPerEm),
      typoAscender: ratioPercent(Math.abs(result.typoAscender), unitsPerEm),
      typoDescender: ratioPercent(Math.abs(result.typoDescender), unitsPerEm),
      typoLineGap: ratioPercent(Math.abs(result.typoLineGap), unitsPerEm)
    }
  };
}

function parseHhea(view, table, unitsPerEm) {
  const data = tableView(view, table, 36);
  if (!data) return null;
  const ascender = data.getInt16(4, false);
  const descender = data.getInt16(6, false);
  const lineGap = data.getInt16(8, false);
  return {
    ascender,
    descender,
    lineGap,
    normalized: {
      ascender: ratioPercent(Math.abs(ascender), unitsPerEm),
      descender: ratioPercent(Math.abs(descender), unitsPerEm),
      lineGap: ratioPercent(Math.abs(lineGap), unitsPerEm)
    }
  };
}

function parsePost(view, table) {
  const data = tableView(view, table, 12);
  if (!data) return null;
  return {
    version: fixed16_16(data, 0),
    italicAngle: fixed16_16(data, 4),
    underlinePosition: data.getInt16(8, false),
    underlineThickness: data.getInt16(10, false)
  };
}

function buildEvidenceDescriptors(metrics) {
  const descriptors = {};
  if (Number.isFinite(metrics.os2?.normalized?.xHeight)) descriptors.xHeight = metrics.os2.normalized.xHeight;
  if (Number.isFinite(metrics.os2?.normalized?.averageWidth)) descriptors.width = metrics.os2.normalized.averageWidth;
  return descriptors;
}

export function analyzeFontBinary(input, { family = null, reference = null } = {}) {
  const buffer = asArrayBuffer(input);
  const view = new DataView(buffer);
  const tables = readDirectory(view);
  const head = parseHead(view, tables.get('head'));
  if (!head) throw new Error('OpenType head table is required for metric normalization');

  const metrics = {
    unitsPerEm: head.unitsPerEm,
    bounds: head.bounds,
    os2: parseOs2(view, tables.get('OS/2'), head.unitsPerEm),
    hhea: parseHhea(view, tables.get('hhea'), head.unitsPerEm),
    post: parsePost(view, tables.get('post')),
    tables: [...tables.keys()].sort()
  };
  const descriptors = buildEvidenceDescriptors(metrics);
  const evidence = family
    ? {
        family,
        descriptors,
        sources: [{
          type: 'font-binary-metrics',
          reference: reference || `binary:${family}`,
          confidence: Object.keys(descriptors).length >= 2 ? 98 : 92
        }]
      }
    : null;

  return {
    format: tagAt(view, 0) === 'OTTO' ? 'otf' : 'ttf',
    measurable: true,
    metrics,
    evidence,
    unresolved: ['strokeContrast', 'geometry', 'rhythm', 'terminals', 'aperture', 'serifStyle', 'humanism']
  };
}

export async function analyzeFontUrl(url, {
  family = null,
  fetchImpl = globalThis.fetch,
  maxBytes = 8 * 1024 * 1024,
  additionalAnalyzers = []
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('font URL analysis requires a fetch implementation');
  if (!Array.isArray(additionalAnalyzers) || additionalAnalyzers.some((analyzer) => typeof analyzer !== 'function')) {
    throw new TypeError('additionalAnalyzers must be an array of functions');
  }
  const parsed = new URL(url);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('font URL must use http or https');

  const response = await fetchImpl(parsed, { headers: { accept: 'font/ttf,font/otf,application/octet-stream,*/*' } });
  if (!response?.ok) throw new Error(`font binary request failed (${response?.status ?? 'unknown'})`);
  const declaredLength = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error(`font binary exceeds ${maxBytes} byte analysis limit`);

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > maxBytes) throw new Error(`font binary exceeds ${maxBytes} byte analysis limit`);
  const base = analyzeFontBinary(buffer, { family, reference: parsed.toString() });
  if (!additionalAnalyzers.length) return base;

  const extensions = [];
  for (const analyzer of additionalAnalyzers) {
    try {
      extensions.push(await analyzer(buffer, { family, reference: parsed.toString() }));
    } catch (error) {
      extensions.push({ available: false, reason: error.message });
    }
  }
  return { ...base, extensions };
}

export async function analyzeCatalogFont(font, options = {}) {
  if (!font?.family) throw new Error('catalog font requires a family');
  const files = font.files && typeof font.files === 'object' ? font.files : {};
  const preferredKeys = ['regular', '400', '500', '300', '600', '700'];
  const key = preferredKeys.find((candidate) => files[candidate]) ?? Object.keys(files)[0];
  if (!key) return { family: font.family, status: 'unavailable', reason: 'catalog entry has no font file URL' };
  try {
    const analysis = await analyzeFontUrl(files[key], { ...options, family: font.family });
    return { family: font.family, status: 'analyzed', variant: key, analysis };
  } catch (error) {
    return { family: font.family, status: 'unsupported', variant: key, reason: error.message };
  }
}
