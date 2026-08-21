import { buildInspirationPacket } from '../modules/inspiration/runtime.mjs';
import {
  extractReferenceSystem,
  buildDesignRead,
  buildCreativeDials,
  buildConceptExploration,
  selectConcept
} from '../modules/creative-calibration/runtime.mjs';
import { buildCreativeDirection } from '../modules/creative-direction/runtime.mjs';
import { buildDesignPacket } from '../modules/design/runtime.mjs';
import { buildTypographySystem } from '../modules/typography/runtime.mjs';
import { prepareProjectTypographyInput } from '../modules/typography/project-orchestrator.mjs';
import { buildImagePlan } from '../modules/image/runtime.mjs';
import { buildMotionPacket } from '../modules/motion/runtime.mjs';
import { buildProductionMode, buildProductionRecipe } from '../modules/production-planning/runtime.mjs';
import { routeCreativeTools } from '../modules/tool-gateway/runtime.mjs';
import { buildAssetRegistry, buildAssetPatchPlan } from '../modules/asset-registry/runtime.mjs';

export function runCreativeProductionRuntime(input) {
  const inspiration = buildInspirationPacket(input.inspiration ?? {});
  const referenceSystem = extractReferenceSystem({ references: input.references ?? [] });
  const designRead = buildDesignRead(input.designRead ?? {});
  const creativeDials = buildCreativeDials(input.creativeDials ?? {});
  const exploration = buildConceptExploration({
    concepts: input.concepts ?? [],
    designRead,
    creativeDials,
    referenceSystem
  });
  const selection = selectConcept({ exploration, ...(input.selection ?? {}) });

  const selectedTraits = selection.selected?.traits ?? input.creativeTraits ?? [];
  const creativeDirection = buildCreativeDirection({
    intent: input.intent,
    businessTruths: input.businessTruths,
    inspiration,
    traits: selectedTraits,
    antiPrinciples: input.antiPrinciples
  });
  creativeDirection.calibration = {
    designRead: designRead.memorableIdea,
    creativeDials: creativeDials.values,
    dialFingerprint: creativeDials.fingerprint,
    selectedConceptId: selection.selectedId
  };

  const typography = input.typography
    ? buildTypographySystem({
        ...input.typography,
        catalog: input.fontCatalog ?? input.typography.catalog ?? []
      })
    : null;
  const design = buildDesignPacket({ direction: creativeDirection, preferences: input.designPreferences, typography });
  const image = buildImagePlan(input.assets ?? [], { direction: creativeDirection });
  const motion = buildMotionPacket({
    ...(input.motion ?? {}),
    intensity: creativeDials.values.motionIntensity ?? input.motion?.intensity ?? 4,
    direction: creativeDirection
  });
  const productionMode = buildProductionMode(input.productionMode ?? {});
  const recipe = buildProductionRecipe({ recipeId: input.recipeId, modePlan: productionMode });

  const assetSpecs = (input.assetSpecs ?? []).map((spec) => ({
    ...spec,
    directionRef: spec.directionRef ?? creativeDirection.directionStatement
  }));
  const inspirationReady = inspiration.status === 'ready' && creativeDirection.provisional !== true;
  const calibrationReady = [inspirationReady, referenceSystem.pass, designRead.pass, creativeDials.pass, exploration.pass, selection.pass].every(Boolean);
  const typographyReady = typography
    ? typography.pass === true && design.typography?.consumption?.pass === true
    : true;
  const productionPlanningReady = productionMode.pass && recipe.pass;
  const gateway = calibrationReady && typographyReady && productionPlanningReady
    ? routeCreativeTools({ assetSpecs, adapters: input.adapters ?? [], modePlan: productionMode })
    : {
        stage: 'tool-gateway',
        providerAgnostic: true,
        assignments: [],
        findings: [{
          severity: 'blocker',
          code: !calibrationReady
            ? 'upstream-creative-calibration-not-ready'
            : !typographyReady
              ? 'upstream-typography-consumption-not-ready'
              : 'upstream-production-planning-not-ready'
        }],
        pass: false,
        productionReady: false
      };
  const registry = buildAssetRegistry({ assetSpecs, gateway, modePlan: productionMode, existing: input.existingAssets ?? [] });
  const patch = buildAssetPatchPlan({ registry, findings: input.assetFindings ?? [], maxAttempts: input.maxPatchAttempts ?? 3 });

  const stagePass = [
    calibrationReady,
    typographyReady,
    referenceSystem.pass,
    designRead.pass,
    creativeDials.pass,
    exploration.pass,
    selection.pass,
    productionMode.pass,
    recipe.pass,
    gateway.pass,
    registry.pass,
    patch.pass
  ].every(Boolean);

  const stages = [
    'inspiration', 'reference-extraction', 'design-read', 'creative-dials', 'explore', 'concept-selection',
    'creative-direction', ...(typography ? ['typography'] : []), 'design', 'image', 'motion', 'production-mode', 'production-recipe',
    'tool-gateway', 'asset-registry', 'asset-patch'
  ];

  return {
    id: input.id,
    taskType: input.taskType,
    version: '1.1',
    status: !stagePass ? 'blocked' : productionMode.mode === 'prototype' ? 'prototype-ready' : 'production-plan-ready',
    stages,
    inspiration,
    referenceSystem,
    designRead,
    creativeDials,
    exploration,
    selection,
    creativeDirection,
    ...(typography ? { typography } : {}),
    design,
    image,
    motion,
    productionMode,
    recipe,
    gateway,
    registry,
    patch
  };
}

export async function runCreativeProductionProjectRuntime(input = {}, typographyResourceOptions = {}) {
  const prepared = await prepareProjectTypographyInput(input, typographyResourceOptions);
  if (!prepared.pass) {
    return {
      id:input.id,
      taskType:input.taskType,
      version:'1.1',
      status:'blocked',
      stages:['typography-resource-orchestration'],
      typographyResources:prepared.resources?.metadata ?? null,
      findings:prepared.findings,
      pass:false
    };
  }
  const output = runCreativeProductionRuntime(prepared.input);
  return {
    ...output,
    typographyOrchestration:{
      enabled:prepared.enabled,
      resources:prepared.resources?.metadata ?? null,
      findings:prepared.findings
    }
  };
}

export function validateCreativeProductionBenchmark(output, expected) {
  const failures = [];
  for (const stage of expected.requiredStages ?? []) if (!output.stages.includes(stage)) failures.push(`missing stage: ${stage}`);
  if (expected.status && output.status !== expected.status) failures.push(`expected status ${expected.status}, got ${output.status}`);
  if (expected.selectedConceptId && output.selection.selectedId !== expected.selectedConceptId) failures.push(`expected selected concept ${expected.selectedConceptId}`);
  if (expected.recipeId && output.recipe.recipeId !== expected.recipeId) failures.push(`expected recipe ${expected.recipeId}`);
  if (expected.requireProviderAgnostic && output.gateway.providerAgnostic !== true) failures.push('tool gateway is not provider-agnostic');
  if (expected.requirePrototypeNotFinal && output.productionMode.mode === 'prototype' && output.productionMode.finalUseAllowed !== false) failures.push('prototype incorrectly allows final use');
  if (expected.requireSharedDirection) {
    const statement = output.creativeDirection.directionStatement;
    if (output.design.directionContext?.statement !== statement) failures.push('design direction drift');
    if (output.image.directionContext?.statement !== statement) failures.push('image direction drift');
    if (output.motion.directionContext?.statement !== statement) failures.push('motion direction drift');
    for (const entry of output.registry.entries) if (entry.directionRef !== statement) failures.push(`asset ${entry.assetId} direction drift`);
  }
  for (const assignment of expected.assignments ?? []) {
    const actual = output.gateway.assignments.find((item) => item.assetId === assignment.assetId);
    if (!actual) failures.push(`missing assignment ${assignment.assetId}`);
    else if (actual.action !== assignment.action) failures.push(`${assignment.assetId}: expected action ${assignment.action}, got ${actual.action}`);
  }
  return { pass: failures.length === 0, failures };
}
