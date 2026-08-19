import test from 'node:test';
import assert from 'node:assert/strict';
import { getSkillRegistry, routeSkills } from '../lib/skill-router.mjs';

test('registry defines four skill categories and unique active ids', () => {
  const registry = getSkillRegistry();
  assert.deepEqual(Object.keys(registry.categories).sort(), ['recipe', 'review', 'role', 'task']);
  const ids = registry.skills.map((skill) => skill.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(registry.skills.every((skill) => ['role', 'task', 'review', 'recipe'].includes(skill.category)));
});

test('logo route pairs maker, task, and independent review', () => {
  const result = routeSkills({ kind: 'logo', phase: 'create', risk: 'moderate' });
  assert.equal(result.status, 'ready');
  assert.ok(result.roles.some((skill) => skill.id === 'logo-designer'));
  assert.ok(result.tasks.some((skill) => skill.id === 'logo-exploration'));
  assert.ok(result.reviews.some((skill) => skill.id === 'logo-review'));
});

test('high-risk challenger does not displace required maker roles', () => {
  const result = routeSkills({ kind: 'landing-page', phase: 'create', risk: 'high' });
  assert.equal(result.status, 'ready');
  assert.ok(result.roles.some((skill) => skill.id === 'product-designer'));
  assert.ok(result.challengers.some((skill) => skill.id === 'creative-skeptic'));
  assert.ok(result.roles.length <= 3);
  assert.ok(result.challengers.length <= 1);
});

test('low-risk headline task stays minimal', () => {
  const result = routeSkills({ kind: 'copy', phase: 'create', risk: 'low' });
  assert.equal(result.status, 'ready');
  assert.ok(result.roles.some((skill) => skill.id === 'copywriter'));
  assert.ok(result.tasks.some((skill) => skill.id === 'headline-writing'));
  assert.equal(result.reviews.length, 0);
  assert.equal(result.challengers.length, 0);
});

test('review-only route invokes independent reviewers but not makers/tasks/recipes', () => {
  const result = routeSkills({ kind: 'logo', phase: 'review', risk: 'moderate' });
  assert.equal(result.status, 'ready');
  assert.equal(result.roles.length, 0);
  assert.equal(result.tasks.length, 0);
  assert.equal(result.recipes.length, 0);
  assert.ok(result.reviews.some((skill) => skill.id === 'logo-review'));
});

test('recipe phase activates one registered recipe', () => {
  const result = routeSkills({ kind: 'motion', phase: 'recipe', risk: 'moderate' });
  assert.equal(result.status, 'ready');
  assert.equal(result.recipes.length, 1);
  assert.equal(result.recipes[0].id, 'scroll-cinematic-recipe');
  assert.ok(result.reviews.some((skill) => skill.id === 'motion-review'));
});

test('explicit recipe can be selected without invoking every recipe', () => {
  const result = routeSkills({ kind: 'identity', phase: 'create', risk: 'moderate', recipe: 'brand-identity-recipe' });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.recipes.map((skill) => skill.id), ['brand-identity-recipe']);
});

test('unknown explicitly requested recipe blocks instead of silently disappearing', () => {
  const result = routeSkills({ kind: 'identity', phase: 'create', risk: 'moderate', recipe: 'does-not-exist' });
  assert.equal(result.status, 'blocked');
  assert.ok(result.findings.some((finding) => finding.includes('unknown or inactive requested recipe')));
});
