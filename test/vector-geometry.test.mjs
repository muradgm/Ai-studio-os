import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyCubicJoin,
  cubicBezierPoint,
  sortLayersByLogicalZ,
  validateVectorSpec
} from '../lib/vector-geometry.mjs';
import { routeSkills } from '../lib/skill-router.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'modules/vector-geometry/examples/traderframe-core-family.json'), 'utf8'));

const straightA = {
  p0: { x: 0, y: 0 },
  p1: { x: 1 / 3, y: 0 },
  p2: { x: 2 / 3, y: 0 },
  p3: { x: 1, y: 0 }
};

const straightB = {
  p0: { x: 1, y: 0 },
  p1: { x: 4 / 3, y: 0 },
  p2: { x: 5 / 3, y: 0 },
  p3: { x: 2, y: 0 }
};

test('vector family fixture validates and produces deterministic SVG paint order', () => {
  const result = validateVectorSpec(fixture);
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.paintOrder, ['base', 'structure', 'event']);
  assert.deepEqual(result.findings, []);
});

test('vector spec fails closed when safe area escapes the viewBox', () => {
  const invalid = structuredClone(fixture);
  invalid.safeArea.x = -2;
  const result = validateVectorSpec(invalid);
  assert.equal(result.status, 'blocked');
  assert.ok(result.findings.some((finding) => finding.message.includes('safeArea must stay inside viewBox')));
});

test('logical z sorts layers into deterministic paint order', () => {
  const ordered = sortLayersByLogicalZ([
    { id: 'event', z: 20 },
    { id: 'base', z: 0 },
    { id: 'structure', z: 10 }
  ]);
  assert.deepEqual(ordered.map((layer) => layer.id), ['base', 'structure', 'event']);
});

test('cubic Bézier evaluator returns exact endpoints', () => {
  assert.deepEqual(cubicBezierPoint(straightA, 0), straightA.p0);
  assert.deepEqual(cubicBezierPoint(straightA, 1), straightA.p3);
});

test('straight cubic join classifies as C2 continuity', () => {
  const result = classifyCubicJoin(straightA, straightB);
  assert.equal(result.continuity, 'C2');
  assert.ok(result.positionError < 1e-9);
  assert.ok(result.tangentAngleError < 1e-9);
  assert.ok(result.curvatureError < 1e-9);
});

test('same-position but tangent-breaking cubic join classifies as C0', () => {
  const verticalStart = {
    p0: { x: 1, y: 0 },
    p1: { x: 1, y: 0.4 },
    p2: { x: 1.5, y: 0.8 },
    p3: { x: 2, y: 1 }
  };
  const result = classifyCubicJoin(straightA, verticalStart);
  assert.equal(result.continuity, 'C0');
});

test('tangent-continuous but curvature-changing cubic join classifies as C1', () => {
  const curvedStart = {
    p0: { x: 1, y: 0 },
    p1: { x: 4 / 3, y: 0 },
    p2: { x: 5 / 3, y: 0.7 },
    p3: { x: 2, y: 1 }
  };
  const result = classifyCubicJoin(straightA, curvedStart);
  assert.equal(result.continuity, 'C1');
});

test('icon-system route selects vector maker, construction task, and independent geometry review', () => {
  const result = routeSkills({ kind: 'icon-system', phase: 'create', risk: 'moderate', needs: ['product'] });
  assert.equal(result.status, 'ready');
  assert.ok(result.roles.some((skill) => skill.id === 'vector-geometry-engineer'));
  assert.ok(result.roles.some((skill) => skill.id === 'art-direction'));
  assert.ok(result.roles.some((skill) => skill.id === 'product-designer'));
  assert.deepEqual(result.tasks.map((skill) => skill.id), ['icon-system-construction']);
  assert.ok(result.reviews.some((skill) => skill.id === 'vector-geometry-review'));
});

test('icon-system recipe route activates only the dedicated recipe', () => {
  const result = routeSkills({ kind: 'icon-system', phase: 'recipe', risk: 'moderate' });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.recipes.map((skill) => skill.id), ['icon-system-recipe']);
});

test('vector review route contains reviewer but no maker/task/recipe', () => {
  const result = routeSkills({ kind: 'vector', phase: 'review', risk: 'moderate' });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.roles, []);
  assert.deepEqual(result.tasks, []);
  assert.deepEqual(result.recipes, []);
  assert.deepEqual(result.reviews.map((skill) => skill.id), ['vector-geometry-review']);
});
