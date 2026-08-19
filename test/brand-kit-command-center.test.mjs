import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Command Center mounts Brand Kit as a first-class deliverable lane without fake output', () => {
  const html = fs.readFileSync(path.join(root, 'apps/creative-agency/index.html'), 'utf8');
  const panel = fs.readFileSync(path.join(root, 'apps/creative-agency/src/brand-kit-panel.js'), 'utf8');
  assert.match(html, /brand-kit-panel\.js/);
  assert.match(panel, /Brand Identity Kit \/ Production System/);
  assert.match(panel, /NOT RUN/);
  assert.match(panel, /brand-identity-kit-recipe/);
  assert.match(panel, /Personalized icons/);
  assert.match(panel, /brand-kit:manifest/);
  assert.doesNotMatch(panel, /DELIVERY READY[^\n]*NOT RUN/);
});
