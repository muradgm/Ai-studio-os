import { validateVectorSpec } from '../../lib/vector-geometry.mjs';

export const AUTHORITY_PRODUCTION_CANDIDATES = ['opposed-domains', 'material-seam', 'offset-threshold'];

function retained(intent, deviceId) {
  return intent.retainedSemanticDevices.some((device) => device.id === deviceId);
}

function line(x1, y1, x2, y2, extra = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
}
function circle(cx, cy, r, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${extra}/>`;
}
function rect(x, y, width, height, extra = '') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${extra}/>`;
}

function opposedDomains(intent) {
  const micro = intent.targetSize <= 14;
  const pieces = [];
  const leftX = micro ? 9.25 : 9;
  const rightX = micro ? 14.75 : 15;
  pieces.push(line(leftX, 7.5, leftX, 16.5));
  pieces.push(line(rightX, 7.5, rightX, 16.5));
  if (retained(intent, 'domain-contrast')) {
    pieces.push(circle(5.25, 12, micro ? 1.8 : 2.15, 'fill="none"'));
    pieces.push(rect(17, 9.75, 4.25, 4.5, 'rx="0.5" fill="currentColor" stroke="none"'));
  }
  if (retained(intent, 'consequence-emphasis')) {
    pieces.push(line(16.8, 16.75, 21.3, 16.75, 'stroke-width="2"'));
  }
  return pieces;
}

function materialSeam(intent) {
  const micro = intent.targetSize <= 14;
  const pieces = [];
  const gapLeft = micro ? 9.75 : 9.5;
  const gapRight = micro ? 14.25 : 14.5;
  pieces.push(line(3.5, 12, gapLeft, 12));
  pieces.push(line(gapRight, 12, 20.5, 12));
  if (retained(intent, 'domain-contrast')) {
    pieces.push(circle(4.25, 12, micro ? 1.65 : 2, 'fill="white"'));
    pieces.push(rect(17.5, 9.9, 3.9, 4.2, 'rx="0.45" fill="currentColor" stroke="none"'));
  }
  if (retained(intent, 'consequence-emphasis')) {
    pieces.push(line(14.5, 15.25, 20.5, 15.25, 'stroke-width="2"'));
  }
  return pieces;
}

function offsetThreshold(intent) {
  const micro = intent.targetSize <= 14;
  const pieces = [];
  pieces.push(line(3.75, micro ? 9.25 : 9, 10.25, micro ? 9.25 : 9));
  pieces.push(line(13.75, micro ? 14.75 : 15, 20.25, micro ? 14.75 : 15));
  if (retained(intent, 'domain-contrast')) {
    pieces.push(circle(4.25, micro ? 9.25 : 9, micro ? 1.55 : 1.9, 'fill="white"'));
    pieces.push(rect(17.25, micro ? 12.65 : 12.8, 3.85, 4.1, 'rx="0.45" fill="currentColor" stroke="none"'));
  }
  if (retained(intent, 'consequence-emphasis')) {
    pieces.push(line(13.75, 18, 20.25, 18, 'stroke-width="2"'));
  }
  return pieces;
}

function vectorSpec(intent) {
  const layers = [{ id: 'boundary', z: 0 }];
  if (retained(intent, 'domain-contrast')) layers.push({ id: 'domain-contrast', z: 10 });
  if (retained(intent, 'consequence-emphasis')) layers.push({ id: 'consequence-emphasis', z: 20 });
  return {
    canvas: { width: 24, height: 24, viewBox: [0, 0, 24, 24] },
    safeArea: { x: 2, y: 2, width: 20, height: 20 },
    grid: { unit: 1, subdivision: 0.5 },
    opticalCenter: { x: 12, y: 12 },
    stroke: { width: intent.targetSize <= 14 ? 1.65 : 1.5, cap: 'round', join: 'round' },
    targetSizes: [intent.targetSize],
    layers,
    geometry: { minimumGap: intent.targetSize <= 14 ? 2.5 : 2 }
  };
}

export function buildAuthorityVectorArtifact(intent) {
  if (!AUTHORITY_PRODUCTION_CANDIDATES.includes(intent?.candidateId)) throw new Error(`Unsupported Authority production candidate: ${intent?.candidateId}`);
  const spec = vectorSpec(intent);
  const validation = validateVectorSpec(spec);
  if (validation.status !== 'ready') throw new Error(`Authority vector spec failed validation for ${intent.candidateId}@${intent.targetSize}: ${JSON.stringify(validation.findings)}`);

  const parts = intent.candidateId === 'opposed-domains'
    ? opposedDomains(intent)
    : intent.candidateId === 'material-seam'
      ? materialSeam(intent)
      : offsetThreshold(intent);

  const strokeWidth = spec.stroke.width;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${intent.targetSize}" height="${intent.targetSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g id="authority-${intent.candidateId}-${intent.targetSize}">${parts.join('')}</g></svg>`;

  return {
    candidateId: intent.candidateId,
    targetSize: intent.targetSize,
    retainedSemanticDeviceIds: intent.retainedSemanticDevices.map((device) => device.id),
    primitiveIds: intent.primitivePlan.primitives.map((primitive) => primitive.id),
    relationshipCount: intent.primitivePlan.relationships.length,
    vectorSpec: spec,
    vectorValidation: validation,
    svg
  };
}
