import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const familyDir = path.join(root, 'assets/traderframe/icons/core-v1');
const dna = JSON.parse(fs.readFileSync(path.join(familyDir, 'icon-dna.json'), 'utf8'));
const names = ['frame', 'trend', 'watchlist', 'signal', 'filter', 'risk'];

test('TraderFrame calibration DNA remains review-gated and internally consistent', () => {
  assert.equal(dna.status, 'review-candidate');
  assert.deepEqual(dna.canvas.viewBox, [0, 0, 24, 24]);
  assert.equal(dna.stroke.width, 1.5);
  assert.equal(dna.stroke.cap, 'square');
  assert.equal(dna.stroke.join, 'miter');
  assert.deepEqual(dna.geometry.dominantAngles, [0, 45, 90]);
  assert.deepEqual(dna.targetSizes, [16, 20, 24, 32]);
  assert.deepEqual(Object.keys(dna.icons), names);
});

test('all six canonical SVG masters use one semantic event layer and no hard-coded color', () => {
  for (const name of names) {
    const svg = fs.readFileSync(path.join(familyDir, `${name}.svg`), 'utf8');
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /stroke-width="1\.5"/);
    assert.match(svg, /stroke-linecap="square"/);
    assert.match(svg, /stroke-linejoin="miter"/);
    assert.match(svg, /currentColor/);
    assert.equal((svg.match(/data-layer="event"/g) ?? []).length, 1, `${name} must have exactly one event layer`);
    assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}/, `${name} canonical master must not hard-code palette colors`);
    assert.doesNotMatch(svg, /<script|<foreignObject|<image|href=/i, `${name} must remain self-contained vector geometry`);
  }
});

test('declared icon footprints remain inside the 2-unit safe area', () => {
  const minX = dna.safeArea.x;
  const minY = dna.safeArea.y;
  const maxX = minX + dna.safeArea.width;
  const maxY = minY + dna.safeArea.height;
  for (const [name, icon] of Object.entries(dna.icons)) {
    const [x1, y1, x2, y2] = icon.bboxApprox;
    assert.ok(x1 >= minX && y1 >= minY, `${name} starts outside safe area`);
    assert.ok(x2 <= maxX && y2 <= maxY, `${name} ends outside safe area`);
    assert.ok(x2 > x1 && y2 > y1, `${name} bbox must be positive`);
  }
});

test('Terminal Red remains an application-level event token rather than canonical SVG paint', () => {
  assert.equal(dna.color.accentToken, '#E54832');
  assert.match(dna.color.accentRule, /one event layer/i);
  for (const name of names) {
    const svg = fs.readFileSync(path.join(familyDir, `${name}.svg`), 'utf8');
    assert.ok(!svg.includes('#E54832'));
  }
});
