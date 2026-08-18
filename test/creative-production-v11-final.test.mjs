import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildAssetRegistry, buildAssetPatchPlan } from '../modules/asset-registry/runtime.mjs';
import { runCreativeProductionRuntime } from '../lib/creative-production-runtime.mjs';

const input = JSON.parse(fs.readFileSync(new URL('../benchmarks/005-du-bonheur-creative-production/input.json', import.meta.url)));

test('invalid production planning does not emit downstream tool assignments', () => {
  const bad = structuredClone(input);
  bad.recipeId = 'unknown-recipe';
  const output = runCreativeProductionRuntime(bad);
  assert.equal(output.status, 'blocked');
  assert.deepEqual(output.gateway.assignments, []);
  assert.ok(output.gateway.findings.some((finding) => finding.code === 'upstream-production-planning-not-ready'));
});

test('asset registry rejects unknown review states', () => {
  const output = runCreativeProductionRuntime(input);
  const specs = [{...input.assetSpecs[0], reviewStatus:'magically-approved', directionRef:output.creativeDirection.directionStatement}];
  const registry = buildAssetRegistry({ assetSpecs:specs, gateway:output.gateway, modePlan:output.productionMode });
  assert.equal(registry.pass, false);
  assert.ok(registry.findings.some((finding) => finding.code === 'registry-review-status-invalid'));
});

test('asset registry rejects malformed patch attempt counters', () => {
  const output = runCreativeProductionRuntime(input);
  const specs = [{...input.assetSpecs[0], patchAttempts:-1, directionRef:output.creativeDirection.directionStatement}];
  const registry = buildAssetRegistry({ assetSpecs:specs, gateway:output.gateway, modePlan:output.productionMode });
  assert.equal(registry.pass, false);
  assert.ok(registry.findings.some((finding) => finding.code === 'registry-patch-attempts-invalid'));
});

test('asset patching rejects an invalid maximum-attempt configuration', () => {
  const registry = { entries:[{assetId:'A',version:1,patchAttempts:0,status:'planned',continuityId:'C',directionRef:'D',truthSensitive:false,sourceAssetIds:[]}] };
  const patch = buildAssetPatchPlan({ registry, findings:[{assetId:'A',severity:'major',validated:true}], maxAttempts:NaN });
  assert.equal(patch.pass, false);
  assert.ok(patch.findings.some((finding) => finding.code === 'patch-attempt-limit-invalid'));
});

test('output evidence advances a routed registry asset from planned to produced', () => {
  const output = runCreativeProductionRuntime(input);
  const specs = [{...input.assetSpecs[0], outputEvidence:'artifact://hero-v1', artifactHash:'sha256:abc', directionRef:output.creativeDirection.directionStatement}];
  const registry = buildAssetRegistry({ assetSpecs:specs, gateway:output.gateway, modePlan:output.productionMode });
  assert.equal(registry.pass, true);
  assert.equal(registry.entries[0].status, 'produced');
});
