import { buildLogoInspirationPacket } from '../modules/logo-inspiration/runtime.mjs';
import { buildLogoPsychology } from '../modules/logo-psychology/runtime.mjs';
import { assessLogoTypes, buildLogoExploration, buildLogoSystem } from '../modules/logo/runtime.mjs';
import { validateLogoIntegrity } from '../modules/logo-integrity/runtime.mjs';

export function runLogoRuntime(input = {}) {
  const inspiration = buildLogoInspirationPacket(input.inspiration ?? {});
  const psychology = buildLogoPsychology(input.psychology ?? {});
  const typeCoverage = assessLogoTypes(input.typeAssessments ?? []);
  const exploration = buildLogoExploration(input.exploration ?? {}, typeCoverage);
  const system = buildLogoSystem(input.system ?? {});
  const integrity = validateLogoIntegrity(input.integrity ?? {});
  const blockers = [inspiration, psychology, typeCoverage, exploration, system, integrity].flatMap((x) => x.findings ?? []);
  return {
    id: input.id,
    stage: 'logo-runtime',
    stages: ['logo-inspiration', 'logo-psychology', 'logo-type-coverage', 'logo-exploration', 'logo-system', 'logo-integrity'],
    inspiration, psychology, typeCoverage, exploration, system, integrity, blockers,
    status: blockers.length ? 'blocked' : 'approved'
  };
}

export function validateLogoBenchmark(output, expected = {}) {
  const failures = [];
  for (const stage of expected.requiredStages ?? []) if (!output.stages.includes(stage)) failures.push(`missing stage: ${stage}`);
  if (expected.status && output.status !== expected.status) failures.push(`expected status ${expected.status}, got ${output.status}`);
  if (expected.requireSevenTypes && output.typeCoverage.taxonomy.length !== 7) failures.push('seven logo types are not covered');
  for (const type of expected.requiredTypes ?? []) if (!output.typeCoverage.taxonomy.some((x) => x.id === type)) failures.push(`missing logo type: ${type}`);
  for (const dimension of expected.requiredPsychologyDimensions ?? []) if (!output.psychology.hypotheses.some((x) => x.dimension === dimension)) failures.push(`missing psychology dimension: ${dimension}`);
  for (const sourceId of expected.requiredInspirationSources ?? []) if (!output.inspiration.sources.some((x) => x.id === sourceId)) failures.push(`missing inspiration source: ${sourceId}`);
  if (expected.requireVectorMaster && output.system.vectorRequired !== true) failures.push('vector master is not required');
  if (expected.requireOriginalityClear && output.system.originalityReview?.status !== 'clear') failures.push('originality review not clear');
  if (expected.requireIntegrityLocked && output.integrity.status !== 'locked') failures.push('logo integrity is not locked');
  return { pass: failures.length === 0, failures };
}
