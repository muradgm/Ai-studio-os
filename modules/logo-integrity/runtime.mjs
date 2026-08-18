import { inspectLogoArtifacts } from './artifact-adapter.mjs';

const REQUIRED_RENDER_SIZES = [16, 32, 64, 128];
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function indexed(list = []) { return new Map(list.map((x) => [x.id, x])); }
function overlapKey(o) { return [o.a, o.b].sort().join('::'); }

function lockForArtifactFinding(message = '') {
  if (/overlap|intersection/i.test(message)) return 'overlap';
  if (/layer|mask|clip|occlusion/i.test(message)) return 'layers';
  if (/shape|geometry|shape id/i.test(message)) return 'shape';
  if (/render|visual drift/i.test(message)) return 'render';
  return 'svg';
}

function validateArtifactIntegrity(input) {
  const artifact = inspectLogoArtifacts(input.artifacts);
  const lockFindings = { shape: [], svg: [], layers: [], overlap: [], render: [] };
  for (const finding of artifact.findings ?? []) lockFindings[lockForArtifactFinding(finding)].push(finding);
  return {
    stage: 'logo-integrity',
    canonicalId: input.canonicalId ?? artifact.canonical?.fileSha256,
    evidenceMode: 'artifact-derived',
    artifact,
    locks: Object.fromEntries(Object.entries(lockFindings).map(([key, value]) => [key, { status: value.length ? 'blocked' : 'locked', findings: value }])),
    findings: artifact.findings ?? [],
    status: artifact.status === 'locked' ? 'locked' : 'blocked'
  };
}

export function validateLogoIntegrity(input = {}) {
  if (input.artifacts) return validateArtifactIntegrity(input);

  const canonical = input.canonical ?? {};
  const exported = input.exported ?? {};
  const findings = [];
  const lockFindings = { shape: [], svg: [], layers: [], overlap: [], render: [] };
  const add = (lock, message) => { findings.push(message); lockFindings[lock].push(message); };

  if (!Array.isArray(canonical.viewBox) || canonical.viewBox.length !== 4) add('svg', 'canonical viewBox must contain four numbers');
  if (!eq(exported.viewBox, canonical.viewBox)) add('svg', 'SVG viewBox drift');

  const palette = indexed(canonical.palette);
  const outPalette = indexed(exported.palette);
  for (const [id, token] of palette) {
    const candidate = outPalette.get(id);
    if (!candidate) add('svg', `missing palette token: ${id}`);
    else if (candidate.value !== token.value) add('svg', `palette drift: ${id}`);
  }
  for (const id of outPalette.keys()) if (!palette.has(id)) add('svg', `unexpected palette token: ${id}`);

  const layers = indexed(canonical.layers);
  const outLayers = indexed(exported.layers);
  if ((canonical.layers?.length ?? 0) > 1 && canonical.layered !== true) add('layers', 'multi-layer canonical mark must declare layered=true');
  for (const [id, layer] of layers) {
    const candidate = outLayers.get(id);
    if (!candidate) { add('layers', `missing layer: ${id}`); continue; }
    for (const key of ['zIndex', 'role', 'blendMode', 'opacity', 'maskId', 'clipId']) {
      if ((candidate[key] ?? null) !== (layer[key] ?? null)) add('layers', `layer drift ${id}.${key}`);
    }
  }
  for (const id of outLayers.keys()) if (!layers.has(id)) add('layers', `unexpected layer: ${id}`);

  const shapes = indexed(canonical.shapes);
  const outShapes = indexed(exported.shapes);
  for (const [id, shape] of shapes) {
    const candidate = outShapes.get(id);
    if (!candidate) { add('shape', `missing shape: ${id}`); continue; }
    for (const key of ['geometryFingerprint', 'layerId', 'fillToken', 'strokeToken']) {
      if ((candidate[key] ?? null) !== (shape[key] ?? null)) add('shape', `shape drift ${id}.${key}`);
    }
    if (!eq(candidate.transform ?? [1,0,0,1,0,0], shape.transform ?? [1,0,0,1,0,0])) add('shape', `shape drift ${id}.transform`);
    if (!eq(candidate.bbox, shape.bbox)) add('shape', `shape drift ${id}.bbox`);
  }
  for (const id of outShapes.keys()) if (!shapes.has(id)) add('shape', `unexpected shape: ${id}`);

  const expectedOverlaps = new Map((canonical.overlaps ?? []).map((o) => [overlapKey(o), o]));
  const actualOverlaps = new Map((exported.overlaps ?? []).map((o) => [overlapKey(o), o]));
  for (const [key, overlap] of expectedOverlaps) {
    const candidate = actualOverlaps.get(key);
    if (!candidate) { add('overlap', `missing overlap relationship: ${key}`); continue; }
    if (candidate.mode !== overlap.mode) add('overlap', `overlap mode drift: ${key}`);
    const tolerance = Number.isFinite(overlap.tolerance) ? overlap.tolerance : 0;
    if (!Number.isFinite(candidate.areaRatio) || Math.abs(candidate.areaRatio - overlap.areaRatio) > tolerance) add('overlap', `overlap geometry drift: ${key}`);
    if ((candidate.owner ?? null) !== (overlap.owner ?? null)) add('overlap', `overlap ownership drift: ${key}`);
  }
  for (const key of actualOverlaps.keys()) if (!expectedOverlaps.has(key)) add('overlap', `unexpected overlap relationship: ${key}`);

  const svg = exported.svg ?? {};
  if (svg.embeddedRaster === true) add('svg', 'SVG must not embed raster logo artwork');
  if (svg.transformsNormalized !== true) add('svg', 'SVG transforms must be normalized');
  if (svg.shapeIds && !eq([...svg.shapeIds].sort(), [...shapes.keys()].sort())) add('svg', 'SVG shape ID set drift');
  const allowedColors = new Set([...palette.values()].map((x) => x.value));
  for (const color of svg.rawColors ?? []) if (!allowedColors.has(color)) add('svg', `SVG contains unapproved raw color: ${color}`);
  if (typeof svg.fileSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(svg.fileSha256)) add('svg', 'actual SVG file hash evidence is required');
  if (typeof svg.inspectorEvidence !== 'string' || !svg.inspectorEvidence.trim()) add('svg', 'actual SVG inspector evidence is required');

  const renderEvidence = Array.isArray(exported.renderEvidence) ? exported.renderEvidence : [];
  const maxVisualDiffPct = Number.isFinite(input.maxVisualDiffPct) ? input.maxVisualDiffPct : 0.5;
  for (const size of REQUIRED_RENDER_SIZES) {
    const evidence = renderEvidence.find((x) => x.size === size);
    if (!evidence) add('render', `missing render diff evidence at ${size}px`);
    else if (!Number.isFinite(evidence.visualDiffPct) || evidence.visualDiffPct > maxVisualDiffPct) add('render', `visual drift exceeds tolerance at ${size}px`);
  }

  if ((exported.unexpectedOverlapCount ?? 0) !== 0) add('overlap', 'unexpected geometric overlaps detected');
  if ((exported.layerOcclusionViolations ?? 0) !== 0) add('layers', 'layer occlusion violations detected');

  return {
    stage: 'logo-integrity',
    canonicalId: canonical.id,
    evidenceMode: 'declared-snapshot',
    locks: Object.fromEntries(Object.entries(lockFindings).map(([key, value]) => [key, { status: value.length ? 'blocked' : 'locked', findings: value }])),
    findings,
    status: findings.length ? 'blocked' : 'locked'
  };
}
