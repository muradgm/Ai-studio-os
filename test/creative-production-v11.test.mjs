import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildProductUnderstanding } from '../modules/product-understanding/runtime.mjs';
import {
  extractReferenceSystem,
  buildDesignRead,
  buildCreativeDials,
  buildConceptExploration,
  selectConcept
} from '../modules/creative-calibration/runtime.mjs';
import { buildProductionMode, buildProductionRecipe } from '../modules/production-planning/runtime.mjs';
import { routeCreativeTools } from '../modules/tool-gateway/runtime.mjs';
import { buildAssetRegistry, buildAssetPatchPlan } from '../modules/asset-registry/runtime.mjs';
import { runCreativeProductionRuntime, validateCreativeProductionBenchmark } from '../lib/creative-production-runtime.mjs';

const input = JSON.parse(fs.readFileSync(new URL('../benchmarks/005-du-bonheur-creative-production/input.json', import.meta.url)));
const expected = JSON.parse(fs.readFileSync(new URL('../benchmarks/005-du-bonheur-creative-production/expected.json', import.meta.url)));

function readyProductUnderstanding() { return buildProductUnderstanding({ ...input.productUnderstanding, projectId: input.id }); }
function readyReferenceSystem() { return extractReferenceSystem({ references: input.references }); }
function readyDesignRead() { return buildDesignRead(input.designRead); }
function readyDials() { return buildCreativeDials(input.creativeDials); }
function readyExploration() {
  return buildConceptExploration({
    concepts: input.concepts,
    productUnderstanding: readyProductUnderstanding(),
    designRead: readyDesignRead(),
    creativeDials: readyDials(),
    referenceSystem: readyReferenceSystem()
  });
}

test('reference extraction rejects exact-copy intent', () => {
  const refs = structuredClone(input.references); refs[0].copyExact = true;
  const output = extractReferenceSystem({ references: refs });
  assert.equal(output.pass, false); assert.ok(output.findings.some((f) => f.code === 'reference-copy-request'));
});

test('reference extraction requires evidence and transformed dimensions', () => {
  const refs = structuredClone(input.references); refs[0].evidence = ''; refs[1].extracted = {};
  const output = extractReferenceSystem({ references: refs });
  assert.equal(output.pass, false); assert.ok(output.findings.some((f) => f.code === 'reference-evidence-missing')); assert.ok(output.findings.some((f) => f.code === 'reference-extraction-empty'));
});

test('design read requires the memorable idea and risks', () => {
  const bad = structuredClone(input.designRead); bad.memorableIdea = ''; bad.risks = [];
  assert.equal(buildDesignRead(bad).pass, false);
});

test('creative dials reject out-of-range values', () => {
  const bad = structuredClone(input.creativeDials); bad.motionIntensity.value = 12;
  const output = buildCreativeDials(bad); assert.equal(output.pass, false); assert.ok(output.findings.some((f) => f.code === 'creative-dial-invalid' && f.dial === 'motionIntensity'));
});

test('creative dials require rationale, not naked numbers', () => {
  const bad = structuredClone(input.creativeDials); bad.texture.rationale = ' '; assert.equal(buildCreativeDials(bad).pass, false);
});

test('exploration blocks when Product Understanding is missing', () => {
  const output = buildConceptExploration({ concepts: input.concepts, designRead: readyDesignRead(), creativeDials: readyDials(), referenceSystem: readyReferenceSystem() });
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((f) => f.code === 'product-understanding-not-ready'));
});

test('exploration requires three to five concepts', () => {
  const output = buildConceptExploration({ concepts: input.concepts.slice(0, 2), productUnderstanding: readyProductUnderstanding(), designRead: readyDesignRead(), creativeDials: readyDials(), referenceSystem: readyReferenceSystem() });
  assert.equal(output.pass, false); assert.ok(output.findings.some((f) => f.code === 'concept-count-out-of-range'));
});

test('exploration rejects cosmetic variants masquerading as alternatives', () => {
  const concepts = structuredClone(input.concepts.slice(0, 3)); concepts[1] = { ...concepts[0], id: 'copy-b' }; concepts[2] = { ...concepts[0], id: 'copy-c' };
  const output = buildConceptExploration({ concepts, productUnderstanding: readyProductUnderstanding(), designRead: readyDesignRead(), creativeDials: readyDials(), referenceSystem: readyReferenceSystem() });
  assert.equal(output.pass, false); assert.ok(output.findings.some((f) => f.code === 'concepts-too-similar'));
});

test('concept selection requires explicit rejection rationale for every alternative', () => {
  const output = selectConcept({ exploration: readyExploration(), ...input.selection, rejected: input.selection.rejected.slice(0, 2) });
  assert.equal(output.pass, false); assert.ok(output.findings.some((f) => f.code === 'rejected-concept-reason-missing'));
});

test('concept selection requires kill criteria', () => {
  assert.equal(selectConcept({ exploration: readyExploration(), ...input.selection, killCriteria: [] }).pass, false);
});

test('prototype mode cannot be final-use allowed', () => {
  const output = buildProductionMode({ mode: 'prototype' }); assert.equal(output.pass, true); assert.equal(output.finalUseAllowed, false); assert.equal(output.prototypeLabelRequired, true);
});

test('production mode requires strict truth, rights, accessibility, and performance', () => {
  assert.equal(buildProductionMode({ mode: 'production', truth: 'loose', accessibility: 'optional', performance: 'required', rights: 'required' }).pass, false);
});

test('production recipes are provider-independent', () => {
  const recipe = buildProductionRecipe({ recipeId: 'scroll-cinematic', modePlan: buildProductionMode(input.productionMode) });
  assert.equal(recipe.pass, true); assert.match(recipe.providerPolicy, /never vendor requirements/i);
});

test('truth-sensitive generation routes to capture instead of synthetic documentary output', () => {
  const spec = { id:'REAL-001', type:'image', purpose:'real product', operation:'generate', truthSensitive:true, hasRealSource:false, requiredCapabilities:['image-generate'], budgetTier:'high' };
  const output = routeCreativeTools({ assetSpecs:[spec], adapters:input.adapters, modePlan:buildProductionMode(input.productionMode) });
  assert.equal(output.pass, false); assert.equal(output.assignments[0].action, 'capture-required');
});

test('editing requires a real source', () => {
  const output = routeCreativeTools({ assetSpecs:[{...input.assetSpecs[0], hasRealSource:false}], adapters:input.adapters, modePlan:buildProductionMode(input.productionMode) });
  assert.equal(output.pass, false); assert.equal(output.assignments[0].action, 'source-required');
});

test('tool gateway chooses by capability and constraints rather than vendor name', () => {
  const adapters = [
    { id:'expensive-famous', provider:'famous', available:true, operations:['generate'], capabilities:['image-generate'], costTier:'high', priority:99 },
    { id:'fit', provider:'unknown', available:true, operations:['generate'], capabilities:['image-generate'], costTier:'medium', priority:2 }
  ];
  const spec = { id:'A', operation:'generate', truthSensitive:false, requiredCapabilities:['image-generate'], budgetTier:'medium' };
  const output = routeCreativeTools({ assetSpecs:[spec], adapters, modePlan:buildProductionMode(input.productionMode) });
  assert.equal(output.pass, true); assert.equal(output.assignments[0].adapterId, 'fit');
});

test('production gateway blocks when no adapter satisfies constraints', () => {
  const spec = { id:'A', operation:'video', truthSensitive:false, requiredCapabilities:['3d-video'], budgetTier:'low' };
  const output = routeCreativeTools({ assetSpecs:[spec], adapters:input.adapters, modePlan:buildProductionMode(input.productionMode) });
  assert.equal(output.pass, false); assert.equal(output.assignments[0].action, 'unassigned');
});

test('asset registry rejects unresolved production rights', () => {
  const out = runCreativeProductionRuntime(input); const specs = structuredClone(input.assetSpecs); specs[0].rightsStatus = 'unresolved';
  const registry = buildAssetRegistry({ assetSpecs:specs.map((s) => ({...s, directionRef:out.creativeDirection.directionStatement})), gateway:out.gateway, modePlan:out.productionMode });
  assert.equal(registry.pass, false); assert.ok(registry.findings.some((f) => f.code === 'registry-rights-unresolved'));
});

test('asset registry requires source evidence for truth-sensitive real-source work', () => {
  const out = runCreativeProductionRuntime(input); const specs = structuredClone(input.assetSpecs); specs[0].sourceEvidence = '';
  assert.equal(buildAssetRegistry({ assetSpecs:specs.map((s) => ({...s, directionRef:out.creativeDirection.directionStatement})), gateway:out.gateway, modePlan:out.productionMode }).pass, false);
});

test('asset registry forbids duplicate asset version keys', () => {
  const out = runCreativeProductionRuntime(input);
  const registry = buildAssetRegistry({ assetSpecs:input.assetSpecs.map((s) => ({...s, directionRef:out.creativeDirection.directionStatement})), gateway:out.gateway, modePlan:out.productionMode, existing:[{assetId:'DB-HERO-001',version:1}] });
  assert.equal(registry.pass, false); assert.ok(registry.findings.some((f) => f.code === 'registry-version-duplicate'));
});

test('asset patching targets only validated major/blocker findings', () => {
  const out = runCreativeProductionRuntime(input);
  const findings = [{assetId:'DB-SUPPORT-002',severity:'minor',validated:true,requestedChange:'ignore minor'},{assetId:'DB-SUPPORT-002',severity:'major',validated:false,requestedChange:'unvalidated'},{assetId:'DB-SUPPORT-002',severity:'major',validated:true,requestedChange:'real patch'}];
  const patch = buildAssetPatchPlan({ registry:out.registry, findings });
  assert.equal(patch.patchRequests.length, 1); assert.equal(patch.patchRequests[0].requestedChange, 'real patch'); assert.equal(patch.patchRequests[0].integrationReviewRequired, true);
});

test('asset patch preserves continuity and direction references', () => {
  const out = runCreativeProductionRuntime(input); const patch = out.patch.patchRequests[0]; const entry = out.registry.entries.find((e) => e.assetId === patch.assetId);
  assert.equal(patch.preserve.continuityId, entry.continuityId); assert.equal(patch.preserve.directionRef, entry.directionRef);
});

test('asset patching stops after repeated failed attempts', () => {
  const registry = { entries:[{assetId:'A',version:3,patchAttempts:3,status:'planned',continuityId:'C',directionRef:'D',truthSensitive:false,sourceAssetIds:[]}] };
  const patch = buildAssetPatchPlan({ registry, findings:[{assetId:'A',severity:'major',validated:true,requestedChange:'again'}], maxAttempts:3 });
  assert.equal(patch.pass, false); assert.ok(patch.findings.some((f) => f.code === 'patch-attempt-limit'));
});

test('v1.1 benchmark preserves one direction through design image motion and asset registry', () => {
  const output = runCreativeProductionRuntime(input); const result = validateCreativeProductionBenchmark(output, expected);
  assert.equal(result.pass, true, result.failures.join('\n')); assert.equal(output.status, 'production-plan-ready'); assert.equal(output.selection.selectedId, 'berlin-atelier');
});

test('v1.1 motion intensity inherits the creative dial', () => {
  assert.equal(runCreativeProductionRuntime(input).motion.intensity, input.creativeDials.motionIntensity.value);
});

test('provider names are not embedded in production recipes', () => {
  const mode = buildProductionMode(input.productionMode);
  for (const id of ['editorial-brand-site','scroll-cinematic','product-film']) {
    const recipe = buildProductionRecipe({ recipeId:id, modePlan:mode }); assert.equal(recipe.pass, true); assert.doesNotMatch(JSON.stringify(recipe), /higgsfield|openai|adobe|veed/i);
  }
});

test('creative-production route includes Product Understanding, calibration, gateway, registry, and patch stages', () => {
  const routes = JSON.parse(fs.readFileSync(new URL('../kernel/routes.json', import.meta.url)));
  for (const stage of ['product-understanding','reference-extraction','design-read','creative-dials','explore','concept-selection','production-mode','production-recipe','tool-gateway','asset-registry','asset-patch']) assert.ok(routes['creative-production'].includes(stage), `missing ${stage}`);
});

test('creative-production council includes production, asset, accessibility, and skeptic roles', () => {
  const council = JSON.parse(fs.readFileSync(new URL('../kernel/councils/creative-production.json', import.meta.url)));
  for (const role of ['production-technologist','asset-librarian','performance-accessibility-reviewer','skeptic']) assert.ok(council.members.includes(role), `missing ${role}`);
  assert.equal(council.independentFirst, true);
});
