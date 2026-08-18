import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCreativeRuntime, validateBenchmark } from '../lib/creative-runtime.mjs';

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
  'kernel/workflows/improve.md',
  'modules/inspiration/runtime.mjs',
  'modules/creative-direction/runtime.mjs',
  'modules/design/runtime.mjs',
  'modules/image/runtime.mjs',
  'modules/motion/runtime.mjs',
  'modules/evals/runtime.mjs',
  'lib/creative-runtime.mjs',
  'benchmarks/001-du-bonheur/input.json',
  'benchmarks/001-du-bonheur/expected.json'
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

if (!failures.length) {
  const input = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/001-du-bonheur/input.json'), 'utf8'));
  const expected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/001-du-bonheur/expected.json'), 'utf8'));
  const benchmark = validateBenchmark(runCreativeRuntime(input), expected);
  if (!benchmark.pass) failures.push(...benchmark.failures.map((f) => `benchmark: ${f}`));
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('AI Studio OS Epoch 002 validation passed.');
