#!/usr/bin/env node
import { inspectLogoArtifacts } from '../modules/logo-integrity/artifact-adapter.mjs';

const [canonicalSvg, candidateSvg, specJson] = process.argv.slice(2);
if (!canonicalSvg || !candidateSvg || !specJson) {
  console.error('Usage: node ./bin/logo-integrity.mjs <canonical.svg> <candidate.svg> <mark-spec.json>');
  process.exit(2);
}
const result = inspectLogoArtifacts({ canonicalSvg, candidateSvg, specJson });
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'locked') process.exit(1);
