const EPSILON = 1e-9;

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertPoint(point, label = 'point') {
  if (!point || !finiteNumber(point.x) || !finiteNumber(point.y)) {
    throw new TypeError(`${label} must contain finite x/y coordinates`);
  }
}

function assertCurve(curve, label = 'curve') {
  if (!curve) throw new TypeError(`${label} is required`);
  for (const key of ['p0', 'p1', 'p2', 'p3']) assertPoint(curve[key], `${label}.${key}`);
}

export function distance(a, b) {
  assertPoint(a, 'a');
  assertPoint(b, 'b');
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function cubicBezierPoint(curve, t) {
  assertCurve(curve);
  if (!finiteNumber(t) || t < 0 || t > 1) throw new RangeError('t must be between 0 and 1');
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * curve.p0.x + 3 * uu * t * curve.p1.x + 3 * u * tt * curve.p2.x + ttt * curve.p3.x,
    y: uuu * curve.p0.y + 3 * uu * t * curve.p1.y + 3 * u * tt * curve.p2.y + ttt * curve.p3.y
  };
}

export function cubicBezierDerivative(curve, t) {
  assertCurve(curve);
  if (!finiteNumber(t) || t < 0 || t > 1) throw new RangeError('t must be between 0 and 1');
  const u = 1 - t;
  return {
    x: 3 * u * u * (curve.p1.x - curve.p0.x) + 6 * u * t * (curve.p2.x - curve.p1.x) + 3 * t * t * (curve.p3.x - curve.p2.x),
    y: 3 * u * u * (curve.p1.y - curve.p0.y) + 6 * u * t * (curve.p2.y - curve.p1.y) + 3 * t * t * (curve.p3.y - curve.p2.y)
  };
}

export function cubicBezierSecondDerivative(curve, t) {
  assertCurve(curve);
  if (!finiteNumber(t) || t < 0 || t > 1) throw new RangeError('t must be between 0 and 1');
  const u = 1 - t;
  return {
    x: 6 * u * (curve.p2.x - 2 * curve.p1.x + curve.p0.x) + 6 * t * (curve.p3.x - 2 * curve.p2.x + curve.p1.x),
    y: 6 * u * (curve.p2.y - 2 * curve.p1.y + curve.p0.y) + 6 * t * (curve.p3.y - 2 * curve.p2.y + curve.p1.y)
  };
}

export function cubicBezierCurvature(curve, t) {
  const d1 = cubicBezierDerivative(curve, t);
  const d2 = cubicBezierSecondDerivative(curve, t);
  const speedSq = d1.x * d1.x + d1.y * d1.y;
  if (speedSq <= EPSILON) return Infinity;
  const cross = d1.x * d2.y - d1.y * d2.x;
  return cross / Math.pow(speedSq, 1.5);
}

function angleBetweenDegrees(a, b) {
  const magA = Math.hypot(a.x, a.y);
  const magB = Math.hypot(b.x, b.y);
  if (magA <= EPSILON || magB <= EPSILON) return Infinity;
  const dot = a.x * b.x + a.y * b.y;
  const cosine = Math.max(-1, Math.min(1, dot / (magA * magB)));
  return Math.acos(cosine) * 180 / Math.PI;
}

export function classifyCubicJoin(curveA, curveB, options = {}) {
  assertCurve(curveA, 'curveA');
  assertCurve(curveB, 'curveB');
  const positionTolerance = options.positionTolerance ?? 1e-6;
  const angleToleranceDegrees = options.angleToleranceDegrees ?? 0.5;
  const curvatureTolerance = options.curvatureTolerance ?? 1e-4;

  const positionError = distance(curveA.p3, curveB.p0);
  if (positionError > positionTolerance) {
    return { continuity: 'NONE', positionError, tangentAngleError: Infinity, curvatureError: Infinity };
  }

  const tangentA = cubicBezierDerivative(curveA, 1);
  const tangentB = cubicBezierDerivative(curveB, 0);
  const tangentAngleError = angleBetweenDegrees(tangentA, tangentB);
  if (tangentAngleError > angleToleranceDegrees) {
    return { continuity: 'C0', positionError, tangentAngleError, curvatureError: Infinity };
  }

  const curvatureA = cubicBezierCurvature(curveA, 1);
  const curvatureB = cubicBezierCurvature(curveB, 0);
  const curvatureError = Number.isFinite(curvatureA) && Number.isFinite(curvatureB)
    ? Math.abs(curvatureA - curvatureB)
    : Infinity;

  return {
    continuity: curvatureError <= curvatureTolerance ? 'C2' : 'C1',
    positionError,
    tangentAngleError,
    curvatureError
  };
}

export function sortLayersByLogicalZ(layers = []) {
  const ids = new Set();
  return [...layers]
    .map((layer, index) => {
      if (!layer || typeof layer.id !== 'string' || !layer.id.trim()) throw new TypeError(`layer ${index} requires a stable id`);
      if (!finiteNumber(layer.z)) throw new TypeError(`layer ${layer.id} requires a finite logical z`);
      if (ids.has(layer.id)) throw new Error(`duplicate layer id: ${layer.id}`);
      ids.add(layer.id);
      return { ...layer };
    })
    .sort((a, b) => a.z - b.z || a.id.localeCompare(b.id));
}

function containsPoint(viewBox, point) {
  const [x, y, width, height] = viewBox;
  return point.x >= x - EPSILON && point.x <= x + width + EPSILON && point.y >= y - EPSILON && point.y <= y + height + EPSILON;
}

function containsRect(viewBox, rect) {
  const [x, y, width, height] = viewBox;
  return rect.x >= x - EPSILON && rect.y >= y - EPSILON && rect.x + rect.width <= x + width + EPSILON && rect.y + rect.height <= y + height + EPSILON;
}

export function validateVectorSpec(spec = {}) {
  const findings = [];
  const block = (message) => findings.push({ severity: 'BLOCKER', message });
  const major = (message) => findings.push({ severity: 'MAJOR', message });

  const canvas = spec.canvas ?? {};
  if (!finiteNumber(canvas.width) || canvas.width <= 0) block('canvas.width must be positive');
  if (!finiteNumber(canvas.height) || canvas.height <= 0) block('canvas.height must be positive');

  const viewBox = canvas.viewBox;
  if (!Array.isArray(viewBox) || viewBox.length !== 4 || !viewBox.every(finiteNumber) || viewBox[2] <= 0 || viewBox[3] <= 0) {
    block('canvas.viewBox must be [x, y, width, height] with positive dimensions');
  }

  if (Array.isArray(viewBox) && viewBox.length === 4 && viewBox.every(finiteNumber) && viewBox[2] > 0 && viewBox[3] > 0) {
    const safeArea = spec.safeArea;
    if (!safeArea || !['x', 'y', 'width', 'height'].every((key) => finiteNumber(safeArea[key])) || safeArea.width <= 0 || safeArea.height <= 0) {
      block('safeArea requires finite x/y/width/height with positive dimensions');
    } else if (!containsRect(viewBox, safeArea)) {
      block('safeArea must stay inside viewBox');
    }

    const opticalCenter = spec.opticalCenter;
    if (!opticalCenter || !finiteNumber(opticalCenter.x) || !finiteNumber(opticalCenter.y)) {
      block('opticalCenter requires finite x/y');
    } else if (!containsPoint(viewBox, opticalCenter)) {
      block('opticalCenter must stay inside viewBox');
    }
  }

  const grid = spec.grid ?? {};
  if (!finiteNumber(grid.unit) || grid.unit <= 0) major('grid.unit should be positive');
  if (grid.subdivision !== undefined && (!finiteNumber(grid.subdivision) || grid.subdivision <= 0)) major('grid.subdivision should be positive when provided');

  if (spec.stroke) {
    if (!finiteNumber(spec.stroke.width) || spec.stroke.width <= 0) block('stroke.width must be positive');
    if (spec.stroke.cap && !['butt', 'round', 'square'].includes(spec.stroke.cap)) major('stroke.cap is not a standard SVG linecap');
    if (spec.stroke.join && !['miter', 'round', 'bevel'].includes(spec.stroke.join)) major('stroke.join is not a standard SVG linejoin');
  }

  const targets = spec.targetSizes;
  if (!Array.isArray(targets) || targets.length === 0 || !targets.every((size) => Number.isInteger(size) && size > 0)) {
    block('targetSizes must contain positive integer pixel sizes');
  } else if (new Set(targets).size !== targets.length) {
    major('targetSizes contains duplicates');
  }

  let paintOrder = [];
  try {
    paintOrder = sortLayersByLogicalZ(spec.layers ?? []);
    if (!paintOrder.length) block('at least one explicit logical-z layer is required');
    const zValues = paintOrder.map((layer) => layer.z);
    if (new Set(zValues).size !== zValues.length) major('top-level logical z values should be unique to avoid ambiguous paint order');
  } catch (error) {
    block(error.message);
  }

  if (spec.geometry?.minimumGap !== undefined && (!finiteNumber(spec.geometry.minimumGap) || spec.geometry.minimumGap < 0)) {
    block('geometry.minimumGap must be a non-negative finite number');
  }

  return {
    status: findings.some((finding) => finding.severity === 'BLOCKER') ? 'blocked' : 'ready',
    findings,
    paintOrder: paintOrder.map((layer) => layer.id)
  };
}
