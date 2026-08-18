import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'AGENTS.md',
  'kernel/routes.json',
  'kernel/workflows/question.md',
  'kernel/workflows/analyze.md',
  'kernel/workflows/council.md',
  'kernel/workflows/critique.md',
  'kernel/workflows/red-team.md',
  'kernel/workflows/review.md',
  'kernel/workflows/improve.md'
];

const failures = [];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`missing ${rel}`);
}

const skillsRoot = path.join(root, '.agents/skills');
for (const dir of fs.readdirSync(skillsRoot, { withFileTypes: true }).filter(d => d.isDirectory())) {
  const file = path.join(skillsRoot, dir.name, 'SKILL.md');
  if (!fs.existsSync(file)) { failures.push(`missing SKILL.md for ${dir.name}`); continue; }
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---\n')) failures.push(`${dir.name}: missing frontmatter`);
  if (!/\nname:\s*[^\n]+/.test(text)) failures.push(`${dir.name}: missing name`);
  if (!/\ndescription:\s*[^\n]+/.test(text)) failures.push(`${dir.name}: missing description`);
}

JSON.parse(fs.readFileSync(path.join(root, 'kernel/routes.json'), 'utf8'));

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('AI Studio OS kernel validation passed.');
