import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('landing page route includes inspiration and motion', () => {
  const routes = JSON.parse(fs.readFileSync(new URL('../kernel/routes.json', import.meta.url)));
  assert.ok(routes['landing-page'].includes('inspiration'));
  assert.ok(routes['landing-page'].includes('motion'));
});

test('saas feature route includes security', () => {
  const routes = JSON.parse(fs.readFileSync(new URL('../kernel/routes.json', import.meta.url)));
  assert.ok(routes['saas-feature'].includes('security'));
});

test('design council preserves a skeptic role', () => {
  const council = JSON.parse(fs.readFileSync(new URL('../kernel/councils/design.json', import.meta.url)));
  assert.ok(council.members.includes('skeptic'));
});
