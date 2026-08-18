import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCreativeRuntime, validateBenchmark } from '../lib/creative-runtime.mjs';
import { runEngineeringRuntime, validateEngineeringBenchmark } from '../lib/engineering-runtime.mjs';
import { runMultimodalRuntime, validateMultimodalBenchmark } from '../lib/multimodal-runtime.mjs';
import { runObservationRuntime, validateObservationBenchmark } from '../lib/observation-runtime.mjs';
import { runCreativeProductionRuntime, validateCreativeProductionBenchmark } from '../lib/creative-production-runtime.mjs';
import { runLogoRuntime, validateLogoBenchmark } from '../lib/logo-runtime.mjs';

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
  'benchmarks/001-du-bonheur/expected.json',
  'modules/engineering/runtime.mjs',
  'modules/code-review/runtime.mjs',
  'modules/security/runtime.mjs',
  'modules/qa/runtime.mjs',
  'modules/release/runtime.mjs',
  'lib/engineering-runtime.mjs',
  'benchmarks/002-workspace-role-update/input.json',
  'benchmarks/002-workspace-role-update/expected.json',
  'modules/storyboard/runtime.mjs',
  'modules/continuity/runtime.mjs',
  'modules/video/runtime.mjs',
  'modules/voice/runtime.mjs',
  'modules/audio/runtime.mjs',
  'modules/multimodal-evals/runtime.mjs',
  'lib/multimodal-runtime.mjs',
  'kernel/councils/multimodal.json',
  'benchmarks/003-du-bonheur-brand-film/input.json',
  'benchmarks/003-du-bonheur-brand-film/expected.json',
  'modules/outcome-evidence/runtime.mjs',
  'modules/analytics/runtime.mjs',
  'modules/feedback/runtime.mjs',
  'modules/post-launch/runtime.mjs',
  'modules/benchmark-history/runtime.mjs',
  'modules/learning-promotion/runtime.mjs',
  'lib/observation-runtime.mjs',
  'kernel/councils/observation.json',
  'benchmarks/004-du-bonheur-post-launch/input.json',
  'benchmarks/004-du-bonheur-post-launch/expected.json',
  'modules/creative-calibration/runtime.mjs',
  'modules/production-planning/runtime.mjs',
  'modules/tool-gateway/runtime.mjs',
  'modules/asset-registry/runtime.mjs',
  'lib/creative-production-runtime.mjs',
  'kernel/councils/creative-production.json',
  'benchmarks/005-du-bonheur-creative-production/input.json',
  'benchmarks/005-du-bonheur-creative-production/expected.json',
  'modules/logo-inspiration/runtime.mjs',
  'modules/logo-psychology/runtime.mjs',
  'modules/logo/runtime.mjs',
  'modules/logo-integrity/runtime.mjs',
  'modules/logo-integrity/artifact-adapter.mjs',
  'scripts/logo_integrity_inspect.py',
  'requirements-logo-integrity.txt',
  'bin/logo-integrity.mjs',
  'test/fixtures/logo-integrity/canonical.svg',
  'test/fixtures/logo-integrity/mark-spec.json',
  'lib/logo-runtime.mjs',
  'kernel/councils/logo.json',
  'benchmarks/006-logo-identity/input.json',
  'benchmarks/006-logo-identity/expected.json'
];

const failures = [];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`missing ${rel}`);
}

const skillsRoot = path.join(root, '.agents/skills');
for (const dir of fs.readdirSync(skillsRoot, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const file = path.join(skillsRoot, dir.name, 'SKILL.md');
  if (!fs.existsSync(file)) { failures.push(`missing SKILL.md for ${dir.name}`); continue; }
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---\n')) failures.push(`${dir.name}: missing frontmatter`);
  if (!/\nname:\s*[^\n]+/.test(text)) failures.push(`${dir.name}: missing name`);
  if (!/\ndescription:\s*[^\n]+/.test(text)) failures.push(`${dir.name}: missing description`);
}

JSON.parse(fs.readFileSync(path.join(root, 'kernel/routes.json'), 'utf8'));

if (!failures.length) {
  const creativeInput = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/001-du-bonheur/input.json'), 'utf8'));
  const creativeExpected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/001-du-bonheur/expected.json'), 'utf8'));
  const creativeBenchmark = validateBenchmark(runCreativeRuntime(creativeInput), creativeExpected);
  if (!creativeBenchmark.pass) failures.push(...creativeBenchmark.failures.map((f) => `creative benchmark: ${f}`));

  const engineeringInput = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/002-workspace-role-update/input.json'), 'utf8'));
  const engineeringExpected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/002-workspace-role-update/expected.json'), 'utf8'));
  const engineeringBenchmark = validateEngineeringBenchmark(runEngineeringRuntime(engineeringInput), engineeringExpected);
  if (!engineeringBenchmark.pass) failures.push(...engineeringBenchmark.failures.map((f) => `engineering benchmark: ${f}`));

  const multimodalInput = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/003-du-bonheur-brand-film/input.json'), 'utf8'));
  const multimodalExpected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/003-du-bonheur-brand-film/expected.json'), 'utf8'));
  const multimodalBenchmark = validateMultimodalBenchmark(runMultimodalRuntime(multimodalInput), multimodalExpected);
  if (!multimodalBenchmark.pass) failures.push(...multimodalBenchmark.failures.map((f) => `multimodal benchmark: ${f}`));

  const observationInput = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/004-du-bonheur-post-launch/input.json'), 'utf8'));
  const observationExpected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/004-du-bonheur-post-launch/expected.json'), 'utf8'));
  const observationBenchmark = validateObservationBenchmark(runObservationRuntime(observationInput), observationExpected);
  if (!observationBenchmark.pass) failures.push(...observationBenchmark.failures.map((f) => `observation benchmark: ${f}`));

  const productionInput = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/005-du-bonheur-creative-production/input.json'), 'utf8'));
  const productionExpected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/005-du-bonheur-creative-production/expected.json'), 'utf8'));
  const productionBenchmark = validateCreativeProductionBenchmark(runCreativeProductionRuntime(productionInput), productionExpected);
  if (!productionBenchmark.pass) failures.push(...productionBenchmark.failures.map((f) => `creative production benchmark: ${f}`));

  const logoInput = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/006-logo-identity/input.json'), 'utf8'));
  const logoExpected = JSON.parse(fs.readFileSync(path.join(root, 'benchmarks/006-logo-identity/expected.json'), 'utf8'));
  const logoBenchmark = validateLogoBenchmark(runLogoRuntime(logoInput), logoExpected);
  if (!logoBenchmark.pass) failures.push(...logoBenchmark.failures.map((f) => `logo benchmark: ${f}`));
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('AI Studio OS v1.2 validation passed.');
