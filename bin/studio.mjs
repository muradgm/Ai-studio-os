#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCreativeRuntime, validateBenchmark } from '../lib/creative-runtime.mjs';
import { runEngineeringRuntime, validateEngineeringBenchmark } from '../lib/engineering-runtime.mjs';
import { runMultimodalRuntime, validateMultimodalBenchmark } from '../lib/multimodal-runtime.mjs';
import { runObservationRuntime, validateObservationBenchmark } from '../lib/observation-runtime.mjs';
import { runCreativeProductionRuntime, validateCreativeProductionBenchmark } from '../lib/creative-production-runtime.mjs';
import { runLogoRuntime, validateLogoBenchmark } from '../lib/logo-runtime.mjs';
import { runCreativeEngineeringRuntime, validateCreativeEngineeringBenchmark } from '../lib/creative-engineering-runtime.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const [command, arg] = process.argv.slice(2);

function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function json(rel) { return JSON.parse(read(rel)); }

function usage() {
  console.log(`AI Studio OS v1.3

Usage:
  studio route <task-type>
  studio workflow <name>
  studio council <preset>
  studio creative <fixture>
  studio engineering <fixture>
  studio multimodal <fixture>
  studio observation <fixture>
  studio production <fixture>
  studio logo <fixture>
  studio creative-engineering <fixture>
  studio benchmark <fixture>
  studio list
`);
}

function creativePaths(name) {
  if (name !== 'du-bonheur') return null;
  return { input: 'benchmarks/001-du-bonheur/input.json', expected: 'benchmarks/001-du-bonheur/expected.json' };
}
function engineeringPaths(name) {
  if (name !== 'workspace-role-update') return null;
  return { input: 'benchmarks/002-workspace-role-update/input.json', expected: 'benchmarks/002-workspace-role-update/expected.json' };
}
function multimodalPaths(name) {
  if (name !== 'du-bonheur-brand-film') return null;
  return { input: 'benchmarks/003-du-bonheur-brand-film/input.json', expected: 'benchmarks/003-du-bonheur-brand-film/expected.json' };
}
function observationPaths(name) {
  if (name !== 'du-bonheur-post-launch') return null;
  return { input: 'benchmarks/004-du-bonheur-post-launch/input.json', expected: 'benchmarks/004-du-bonheur-post-launch/expected.json' };
}
function productionPaths(name) {
  if (name !== 'du-bonheur-v11') return null;
  return { input: 'benchmarks/005-du-bonheur-creative-production/input.json', expected: 'benchmarks/005-du-bonheur-creative-production/expected.json' };
}
function logoPaths(name) {
  if (name !== 'identity-v12') return null;
  return { input: 'benchmarks/006-logo-identity/input.json', expected: 'benchmarks/006-logo-identity/expected.json' };
}
function creativeEngineeringPaths(name) {
  if (name !== 'creative-engineering-v13') return null;
  return { input: 'benchmarks/007-creative-engineering/input.json', expected: 'benchmarks/007-creative-engineering/expected.json' };
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
  const paths = creativePaths(arg);
  if (!paths) { console.error(`Unknown creative fixture: ${arg ?? '(missing)'}`); process.exit(1); }
  console.log(JSON.stringify(runCreativeRuntime(json(paths.input)), null, 2));
} else if (command === 'engineering') {
  const paths = engineeringPaths(arg);
  if (!paths) { console.error(`Unknown engineering fixture: ${arg ?? '(missing)'}`); process.exit(1); }
  console.log(JSON.stringify(runEngineeringRuntime(json(paths.input)), null, 2));
} else if (command === 'multimodal') {
  const paths = multimodalPaths(arg);
  if (!paths) { console.error(`Unknown multimodal fixture: ${arg ?? '(missing)'}`); process.exit(1); }
  console.log(JSON.stringify(runMultimodalRuntime(json(paths.input)), null, 2));
} else if (command === 'observation') {
  const paths = observationPaths(arg);
  if (!paths) { console.error(`Unknown observation fixture: ${arg ?? '(missing)'}`); process.exit(1); }
  console.log(JSON.stringify(runObservationRuntime(json(paths.input)), null, 2));
} else if (command === 'production') {
  const paths = productionPaths(arg);
  if (!paths) { console.error(`Unknown production fixture: ${arg ?? '(missing)'}`); process.exit(1); }
  console.log(JSON.stringify(runCreativeProductionRuntime(json(paths.input)), null, 2));
} else if (command === 'logo') {
  const paths = logoPaths(arg);
  if (!paths) { console.error(`Unknown logo fixture: ${arg ?? '(missing)'}`); process.exit(1); }
  console.log(JSON.stringify(runLogoRuntime(json(paths.input)), null, 2));
} else if (command === 'creative-engineering') {
  const paths = creativeEngineeringPaths(arg);
  if (!paths) { console.error(`Unknown creative engineering fixture: ${arg ?? '(missing)'}`); process.exit(1); }
  console.log(JSON.stringify(runCreativeEngineeringRuntime(json(paths.input)), null, 2));
} else if (command === 'benchmark') {
  const creative = creativePaths(arg);
  const engineering = engineeringPaths(arg);
  const multimodal = multimodalPaths(arg);
  const observation = observationPaths(arg);
  const production = productionPaths(arg);
  const logo = logoPaths(arg);
  const creativeEngineering = creativeEngineeringPaths(arg);
  let result;
  if (creative) result = validateBenchmark(runCreativeRuntime(json(creative.input)), json(creative.expected));
  else if (engineering) result = validateEngineeringBenchmark(runEngineeringRuntime(json(engineering.input)), json(engineering.expected));
  else if (multimodal) result = validateMultimodalBenchmark(runMultimodalRuntime(json(multimodal.input)), json(multimodal.expected));
  else if (observation) result = validateObservationBenchmark(runObservationRuntime(json(observation.input)), json(observation.expected));
  else if (production) result = validateCreativeProductionBenchmark(runCreativeProductionRuntime(json(production.input)), json(production.expected));
  else if (logo) result = validateLogoBenchmark(runLogoRuntime(json(logo.input)), json(logo.expected));
  else if (creativeEngineering) result = validateCreativeEngineeringBenchmark(runCreativeEngineeringRuntime(json(creativeEngineering.input)), json(creativeEngineering.expected));
  else { console.error(`Unknown benchmark: ${arg ?? '(missing)'}`); process.exit(1); }
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
  console.log('engineering fixtures: workspace-role-update');
  console.log('multimodal fixtures: du-bonheur-brand-film');
  console.log('observation fixtures: du-bonheur-post-launch');
  console.log('production fixtures: du-bonheur-v11');
  console.log('logo fixtures: identity-v12');
  console.log('creative engineering fixtures: creative-engineering-v13');
} else {
  usage();
  process.exit(1);
}
