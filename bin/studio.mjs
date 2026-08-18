#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCreativeRuntime, validateBenchmark } from '../lib/creative-runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const [command, arg] = process.argv.slice(2);

function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function json(rel) { return JSON.parse(read(rel)); }

function usage() {
  console.log(`AI Studio OS — Epoch 002

Usage:
  studio route <task-type>
  studio workflow <name>
  studio council <preset>
  studio creative <fixture>
  studio benchmark <fixture>
  studio list
`);
}

function benchmarkPaths(name) {
  if (name !== 'du-bonheur') return null;
  return {
    input: 'benchmarks/001-du-bonheur/input.json',
    expected: 'benchmarks/001-du-bonheur/expected.json'
  };
}

if (!command) { usage(); process.exit(0); }

if (command === 'route') {
  const routes = json('kernel/routes.json');
  if (!arg || !routes[arg]) {
    console.error(`Unknown route: ${arg ?? '(missing)'}`);
    console.error(`Available: ${Object.keys(routes).join(', ')}`);
    process.exit(1);
  }
  console.log(routes[arg].join(' -> '));
} else if (command === 'workflow') {
  const name = (arg || '').replace(/^\//, '');
  const file = `kernel/workflows/${name}.md`;
  if (!name || !fs.existsSync(path.join(root, file))) {
    console.error(`Unknown workflow: ${arg ?? '(missing)'}`);
    process.exit(1);
  }
  console.log(read(file));
} else if (command === 'council') {
  const file = `kernel/councils/${arg}.json`;
  if (!arg || !fs.existsSync(path.join(root, file))) {
    console.error(`Unknown council preset: ${arg ?? '(missing)'}`);
    process.exit(1);
  }
  const council = json(file);
  console.log(`${council.name} council`);
  console.log(`members: ${council.members.join(', ')}`);
  console.log(`chair: ${council.chair}`);
} else if (command === 'creative') {
  const paths = benchmarkPaths(arg);
  if (!paths) { console.error(`Unknown creative fixture: ${arg ?? '(missing)'}`); process.exit(1); }
  console.log(JSON.stringify(runCreativeRuntime(json(paths.input)), null, 2));
} else if (command === 'benchmark') {
  const paths = benchmarkPaths(arg);
  if (!paths) { console.error(`Unknown benchmark: ${arg ?? '(missing)'}`); process.exit(1); }
  const output = runCreativeRuntime(json(paths.input));
  const result = validateBenchmark(output, json(paths.expected));
  console.log(JSON.stringify({ benchmark: arg, ...result }, null, 2));
  if (!result.pass) process.exit(1);
} else if (command === 'list') {
  const routes = Object.keys(json('kernel/routes.json'));
  const workflows = fs.readdirSync(path.join(root, 'kernel/workflows')).filter(f => f.endsWith('.md')).map(f => f.slice(0,-3));
  const councils = fs.readdirSync(path.join(root, 'kernel/councils')).filter(f => f.endsWith('.json')).map(f => f.slice(0,-5));
  console.log('routes:', routes.join(', '));
  console.log('workflows:', workflows.join(', '));
  console.log('councils:', councils.join(', '));
  console.log('creative fixtures: du-bonheur');
} else {
  usage();
  process.exit(1);
}
