import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildProductionMode } from '../modules/production-planning/runtime.mjs';
import { routeCreativeTools } from '../modules/tool-gateway/runtime.mjs';
import { buildAssetRegistry, buildAssetPatchPlan } from '../modules/asset-registry/runtime.mjs';
import { runCreativeProductionRuntime } from '../lib/creative-production-runtime.mjs';
const input = JSON.parse(fs.readFileSync(new URL('../benchmarks/005-du-bonheur-creative-production/input.json', import.meta.url)));

test('incomplete inspiration cannot become production-plan-ready', () => {
  const bad = structuredClone(input);
  bad.inspiration.referenceMatrix = [];
  const output = runCreativeProductionRuntime(bad);
  assert.equal(output.status, 'blocked');
  assert.equal(output.creativeDirection.provisional, true);
});

test('prototype may carry unresolved capture work without pretending it is production-ready', () => {
  const modePlan = buildProductionMode({ mode: 'prototype' });
  const spec = { id:'REAL-PROTOTYPE', operation:'generate', truthSensitive:true, requiredCapabilities:['image-generate'], budgetTier:'medium' };
  const gateway = routeCreativeTools({ assetSpecs:[spec], adapters:input.adapters, modePlan });
  assert.equal(gateway.pass, true);
  assert.equal(gateway.productionReady, false);
  assert.equal(gateway.assignments[0].action, 'capture-required');
  assert.ok(gateway.findings.some((finding) => finding.severity === 'major'));
});

test('asset patching always targets the latest registered version', () => {
  const registry = { entries:[
    {assetId:'A',version:3,patchAttempts:0,status:'planned',continuityId:'C',directionRef:'D',truthSensitive:false,sourceAssetIds:[]},
    {assetId:'A',version:1,patchAttempts:0,status:'planned',continuityId:'C',directionRef:'D',truthSensitive:false,sourceAssetIds:[]},
    {assetId:'A',version:2,patchAttempts:0,status:'planned',continuityId:'C',directionRef:'D',truthSensitive:false,sourceAssetIds:[]}
  ] };
  const patch = buildAssetPatchPlan({ registry, findings:[{assetId:'A',severity:'major',validated:true,requestedChange:'latest'}] });
  assert.equal(patch.pass, true);
  assert.equal(patch.patchRequests[0].fromVersion, 3);
  assert.equal(patch.patchRequests[0].targetVersion, 4);
});

test('asset registry carries review, output, hash, and cost fields', () => {
  const output = runCreativeProductionRuntime(input);
  const entry = output.registry.entries.find((item) => item.assetId === 'DB-HERO-001');
  assert.equal(entry.reviewStatus, 'unreviewed');
  assert.equal(entry.outputEvidence, null);
  assert.equal(entry.artifactHash, null);
  assert.deepEqual(entry.cost, { estimated:null, actual:null, currency:null });
});

test('approved registry assets require output evidence', () => {
  const output = runCreativeProductionRuntime(input);
  const specs = structuredClone(input.assetSpecs).map((spec) => ({...spec, directionRef:output.creativeDirection.directionStatement}));
  specs[0].reviewStatus = 'approved';
  specs[0].outputEvidence = '';
  const registry = buildAssetRegistry({ assetSpecs:specs, gateway:output.gateway, modePlan:output.productionMode });
  assert.equal(registry.pass, false);
  assert.ok(registry.findings.some((finding) => finding.code === 'registry-approved-output-evidence-missing'));
});

test('blocked calibration does not emit downstream provider assignments', () => {
  const bad = structuredClone(input);
  bad.selection.selectedId = 'missing-concept';
  const output = runCreativeProductionRuntime(bad);
  assert.equal(output.status, 'blocked');
  assert.equal(output.gateway.pass, false);
  assert.deepEqual(output.gateway.assignments, []);
  assert.ok(output.gateway.findings.some((finding) => finding.code === 'upstream-creative-calibration-not-ready'));
});

test('tool gateway exposes why adapters were accepted or rejected', () => {
  const adapters = [
    { id:'famous-expensive', provider:'famous', available:true, operations:['generate'], capabilities:['image-generate'], costTier:'high', priority:99 },
    { id:'fit', provider:'other', available:true, operations:['generate'], capabilities:['image-generate'], costTier:'medium', priority:1 }
  ];
  const spec = { id:'TRACE', operation:'generate', truthSensitive:false, requiredCapabilities:['image-generate'], budgetTier:'medium' };
  const output = routeCreativeTools({ assetSpecs:[spec], adapters, modePlan:buildProductionMode(input.productionMode) });
  assert.equal(output.assignments[0].adapterId, 'fit');
  const rejected = output.assignments[0].selectionTrace.find((item) => item.adapterId === 'famous-expensive');
  assert.equal(rejected.eligible, false);
  assert.ok(rejected.reasons.includes('over-budget'));
});

test('asset registry rejects malformed versions in new specs', () => {
  const output = runCreativeProductionRuntime(input);
  const specs = [{...input.assetSpecs[0], version:0, directionRef:output.creativeDirection.directionStatement}];
  const registry = buildAssetRegistry({ assetSpecs:specs, gateway:output.gateway, modePlan:output.productionMode });
  assert.equal(registry.pass, false);
  assert.ok(registry.findings.some((finding) => finding.code === 'registry-version-invalid'));
});

test('asset registry rejects duplicate versions already present in history', () => {
  const output = runCreativeProductionRuntime(input);
  const existing = [
    {assetId:'OLD',version:1},
    {assetId:'OLD',version:1}
  ];
  const registry = buildAssetRegistry({ assetSpecs:[], gateway:output.gateway, modePlan:output.productionMode, existing });
  assert.equal(registry.pass, false);
  assert.ok(registry.findings.some((finding) => finding.code === 'registry-version-duplicate'));
});

test('patching refuses assets whose production plan is blocked', () => {
  const registry = { entries:[{assetId:'A',version:1,patchAttempts:0,status:'blocked',continuityId:'C',directionRef:'D',truthSensitive:false,sourceAssetIds:[]}] };
  const patch = buildAssetPatchPlan({ registry, findings:[{assetId:'A',severity:'major',validated:true,requestedChange:'retry'}] });
  assert.equal(patch.pass, false);
  assert.ok(patch.findings.some((finding) => finding.code === 'patch-asset-not-actionable'));
});
