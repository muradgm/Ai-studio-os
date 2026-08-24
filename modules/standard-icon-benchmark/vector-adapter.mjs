import { validateVectorSpec } from '../../lib/vector-geometry.mjs';

function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const path = (d, extra = '') => `<path d="${d}" ${extra}/>`;
const line = (x1, y1, x2, y2, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const circle = (cx, cy, r, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" ${extra}/>`;
const rect = (x, y, width, height, rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" ${extra}/>`;

function iconMarkup(conceptId, detail) {
  switch (conceptId) {
    case 'home':
      return [
        path(detail ? 'M3.5 10.8 12 3.7l8.5 7.1v8a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z' : 'M4 10.5 12 4l8 6.5V20H4z'),
        detail ? path('M9.2 20.5v-6.2h5.6v6.2') : ''
      ].join('');
    case 'menu':
      return [line(4, 7, 20, 7), line(4, 12, detail ? 18.5 : 20, 12), line(detail ? 5.5 : 4, 17, 20, 17)].join('');
    case 'search':
      return [circle(10.5, 10.5, detail ? 5.9 : 5.6), path(detail ? 'M14.9 14.9 20.3 20.3' : 'M14.6 14.6 20 20')].join('');
    case 'edit':
      return [path(detail ? 'M4.3 19.7 5.2 15.5 15.9 4.8a2 2 0 0 1 2.8 0l.5.5a2 2 0 0 1 0 2.8L8.5 18.8zM13.9 6.8l3.3 3.3' : 'M5 19 6 15 16 5l3 3L9 18z')].join('');
    case 'like':
      return [path(detail ? 'M12 20.2C7.1 16.9 4.2 14.3 4.2 10.5c0-2.7 1.9-4.6 4.4-4.6 1.5 0 2.7.7 3.4 1.8.7-1.1 1.9-1.8 3.4-1.8 2.5 0 4.4 1.9 4.4 4.6 0 3.8-2.9 6.4-7.8 9.7z' : 'M12 20c-5-3.2-8-5.8-8-9.5C4 8 5.8 6 8.4 6c1.6 0 2.8.8 3.6 2 .8-1.2 2-2 3.6-2C18.2 6 20 8 20 10.5c0 3.7-3 6.3-8 9.5z')].join('');
    case 'favorite':
      return [path(detail ? 'm12 3.8 2.55 5.17 5.7.83-4.13 4.02.98 5.68L12 16.8l-5.1 2.7.98-5.68L3.75 9.8l5.7-.83z' : 'm12 4 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z')].join('');
    case 'bookmark':
      return [path(detail ? 'M6.3 4.2h11.4v16.1L12 16.8l-5.7 3.5z' : 'M7 4h10v16l-5-3-5 3z')].join('');
    case 'share':
      return [rect(4, detail ? 9.2 : 9, 14, 10.5, 1.6), path(detail ? 'M12 13.2V4.1M8.7 7.2 12 3.9l3.3 3.3' : 'M12 13V4M9 7l3-3 3 3')].join('');
    case 'download':
      return [path(detail ? 'M12 4.2v10.3M8.5 11.2 12 14.7l3.5-3.5' : 'M12 4v10M9 11l3 3 3-3'), path(detail ? 'M5 16.4v2.1c0 .9.7 1.6 1.6 1.6h10.8c.9 0 1.6-.7 1.6-1.6v-2.1' : 'M5 17v3h14v-3')].join('');
    case 'settings':
      return [path(detail ? 'M9.2 4.4 10 2.8h4l.8 1.6 1.8.8 1.7-.6 2 3.4-1.2 1.3.2 2 .9 1.4-2 3.4-1.7-.3-1.6 1.1-.5 1.8h-4l-.5-1.8-1.6-1.1-1.7.3-2-3.4.9-1.4.2-2L3.7 8l2-3.4 1.7.6z' : 'M9 4l1-2h4l1 2 2 1 2-.5 2 3.5-1.5 1.5v2L21 13l-2 3.5-2-.5-2 1-1 2h-4l-1-2-2-1-2 .5L3 13l1.5-1.5v-2L3 8l2-3.5 2 .5z'), circle(12, 10.5, detail ? 2.6 : 2.4)].join('');
    case 'lock':
      return [rect(5.2, 10.2, 13.6, 9.7, detail ? 1.8 : 1.4), path(detail ? 'M8 10.2V7.6a4 4 0 0 1 8 0v2.6' : 'M8 10V7.5a4 4 0 0 1 8 0V10'), detail ? line(12, 14.2, 12, 16.2) : ''].join('');
    case 'upload':
      return [path(detail ? 'M12 15.4V5.1M8.5 8.4 12 4.9l3.5 3.5' : 'M12 15V5M9 8l3-3 3 3'), path(detail ? 'M5 17v1.8c0 .9.7 1.6 1.6 1.6h10.8c.9 0 1.6-.7 1.6-1.6V17' : 'M5 17v3h14v-3')].join('');
    case 'close':
      return detail ? [line(5.3, 5.3, 18.7, 18.7), line(18.7, 5.3, 5.3, 18.7)].join('') : [line(6, 6, 18, 18), line(18, 6, 6, 18)].join('');
    case 'filter':
      return [path(detail ? 'M4 5h16l-6.1 7.1v5.3l-3.8 2.1v-7.4z' : 'M4 5h16l-6 7v6l-4 2v-8z')].join('');
    case 'link':
      return [path(detail ? 'M9.7 14.3 8.2 15.8a4 4 0 0 1-5.7-5.7L5.4 7.2a4 4 0 0 1 5.7 0M14.3 9.7l1.5-1.5a4 4 0 1 1 5.7 5.7l-2.9 2.9a4 4 0 0 1-5.7 0M8.8 12h6.4' : 'M9 15 7.5 16.5a4 4 0 0 1-5.5-5.8l3-3a4 4 0 0 1 5.7 0M15 9l1.5-1.5a4 4 0 1 1 5.5 5.8l-3 3a4 4 0 0 1-5.7 0M9 12h6')].join('');
    case 'logout':
      return [path(detail ? 'M10.4 5H6.6A1.6 1.6 0 0 0 5 6.6v10.8A1.6 1.6 0 0 0 6.6 19h3.8M13.3 8.2 17.1 12l-3.8 3.8M9.6 12h7.2' : 'M10 5H5v14h5M13 8l4 4-4 4M9 12h8')].join('');
    default:
      throw new Error(`Unknown standard icon concept: ${conceptId}`);
  }
}

function vectorSpec(style, targetSize) {
  const g = style.resolvedStyle.geometry;
  return {
    canvas: { width: 24, height: 24, viewBox: g.viewBox },
    safeArea: { x: 2, y: 2, width: 20, height: 20 },
    opticalCenter: { x: 12, y: 12 },
    grid: { unit: 1, subdivision: 0.5 },
    stroke: { width: g.strokeWidthBySize[String(targetSize)], cap: g.cap, join: g.join },
    targetSizes: [14, 16, 20, 24],
    layers: [{ id: 'glyph', z: 0, role: 'semantic-master' }],
    geometry: { minimumGap: targetSize <= 16 ? 1.25 : 1 }
  };
}

export function inspectStandardIconSvg(svg, { conceptId, targetSize } = {}) {
  const findings = [];
  const add = (message) => findings.push({ severity: 'BLOCKER', message });
  if (typeof svg !== 'string' || !svg.startsWith('<svg ')) add('SVG root is missing.');
  if (!/viewBox="0 0 24 24"/.test(svg)) add('Canonical 24 unit viewBox is required.');
  if (!svg.includes('currentColor')) add('SVG must remain surface-neutral through currentColor.');
  if (/<image\b/i.test(svg) || /data:image/i.test(svg)) add('Raster content is forbidden.');
  if (/fill=["']white["']/i.test(svg) || /#fff(?:fff)?/i.test(svg)) add('Surface-coupled white fill is forbidden.');
  const shapeCount = (svg.match(/<(?:path|line|circle|rect|polygon|polyline)\b/g) ?? []).length;
  if (shapeCount === 0) add('At least one real vector shape is required.');
  if (conceptId && !svg.includes(`data-concept="${conceptId}"`)) add('Concept identity is missing from emitted SVG.');
  if (targetSize && !svg.includes(`data-size="${targetSize}"`)) add('Target-size identity is missing from emitted SVG.');
  return { status: findings.length ? 'blocked' : 'ready', findings, shapeCount };
}

export function buildStandardIconVectorArtifact(intent, style) {
  if (intent?.executionAuthority !== 'vector-geometry') throw new Error('Standard icon geometry requires Vector Geometry execution authority.');
  const targetSize = intent.targetSize;
  const strokeWidth = style.resolvedStyle.geometry.strokeWidthBySize[String(targetSize)];
  if (!strokeWidth) throw new Error(`No optical stroke width for ${targetSize}px.`);
  const detail = intent.retainedSemanticDevices.some((device) => device.id === 'secondary-detail');
  const markup = iconMarkup(intent.conceptId, detail);
  const spec = vectorSpec(style, targetSize);
  const vectorSpecValidation = validateVectorSpec(spec);
  if (vectorSpecValidation.status !== 'ready') throw new Error(`Vector spec blocked for ${intent.conceptId}@${targetSize}: ${JSON.stringify(vectorSpecValidation.findings)}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${targetSize}" height="${targetSize}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="${style.resolvedStyle.geometry.cap}" stroke-linejoin="${style.resolvedStyle.geometry.join}" data-concept="${esc(intent.conceptId)}" data-size="${targetSize}" data-style="${esc(style.resolvedStyle.id)}"><g id="glyph">${markup}</g></svg>`;
  const emittedSvgIntegrity = inspectStandardIconSvg(svg, { conceptId: intent.conceptId, targetSize });
  return {
    conceptId: intent.conceptId,
    targetSize,
    candidateId: intent.candidateId,
    retainedSemanticDeviceIds: intent.retainedSemanticDevices.map((device) => device.id),
    vectorSpec: spec,
    vectorSpecValidation,
    svg,
    emittedSvgIntegrity
  };
}
