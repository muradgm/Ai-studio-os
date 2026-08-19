import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'kernel/skill-registry.json'), 'utf8'));
const requiredSections = [
  'Purpose',
  'When to use',
  'Inputs required',
  'Operating principles',
  'Workflow',
  'Deliverables',
  'Review criteria',
  'Failure modes',
  'Handoffs'
];

test('specialist skill registry has valid category and unique ids/paths', () => {
  const ids = registry.skills.map((skill) => skill.id);
  const paths = registry.skills.map((skill) => skill.path);
  assert.equal(new Set(ids).size, ids.length, 'skill ids must be unique');
  assert.equal(new Set(paths).size, paths.length, 'skill paths must be unique');
  for (const skill of registry.skills) {
    assert.ok(['role', 'task', 'review', 'recipe'].includes(skill.category), `${skill.id}: invalid category`);
    assert.equal(skill.status, 'active', `${skill.id}: core catalog skill must be active`);
  }
});

test('every catalogued skill file exists and implements the detailed skill contract', () => {
  for (const skill of registry.skills) {
    const fullPath = path.join(root, skill.path);
    assert.ok(fs.existsSync(fullPath), `${skill.id}: missing ${skill.path}`);
    const text = fs.readFileSync(fullPath, 'utf8');
    assert.ok(text.startsWith('---\n'), `${skill.id}: missing frontmatter`);
    assert.ok(text.includes(`\nname: ${skill.id}\n`), `${skill.id}: frontmatter name mismatch`);
    assert.ok(text.includes(`\ncategory: ${skill.category}\n`), `${skill.id}: frontmatter category mismatch`);
    assert.match(text, /\ndescription:\s*[^\n]+/, `${skill.id}: missing description`);
    for (const section of requiredSections) {
      assert.ok(text.includes(`## ${section}`), `${skill.id}: missing section ${section}`);
    }
  }
});

test('catalog keeps reviewer skills independent from maker categories', () => {
  const reviews = registry.skills.filter((skill) => skill.category === 'review');
  assert.ok(reviews.length >= 4, 'core catalog needs independent reviewers');
  for (const review of reviews) {
    assert.ok(!review.phases.includes('create'), `${review.id}: review skill must not be a create-phase maker`);
  }
});

test('routing limits encode anti-sprawl and challenger isolation', () => {
  assert.ok(registry.routingRules.maxRoleSkills <= 3, 'maker role cap must remain small');
  assert.ok(registry.routingRules.maxTaskSkills <= 2, 'task cap must remain small');
  assert.ok(registry.routingRules.maxChallengerSkills <= 1, 'challenger cap must remain small');
  assert.deepEqual(registry.routingRules.challengerSkillIds, ['creative-skeptic']);
  assert.equal(registry.routingRules.doNotInvokeEverything, true);
  assert.equal(registry.routingRules.reviewMustBeIndependent, true);
  assert.equal(registry.routingRules.reviewPhaseExcludesMakers, true);
  assert.equal(registry.routingRules.unknownRequestedRecipeBlocks, true);
});
