import { buildInspirationPacket } from '../modules/inspiration/runtime.mjs';
import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../modules/creative-world/runtime.mjs';
import { buildCreativeDirection } from '../modules/creative-direction/runtime.mjs';
import { buildDesignPacket } from '../modules/design/runtime.mjs';
import { buildImagePlan } from '../modules/image/runtime.mjs';
import { buildMotionPacket } from '../modules/motion/runtime.mjs';
import { CREATIVE_RUBRIC } from '../modules/evals/runtime.mjs';

export function runCreativeRuntime(input) {
  const inspiration = buildInspirationPacket(input.inspiration ?? {});
  const creativeThesis = buildCreativeThesis({
    projectId: input.id,
    intent: input.intent,
    businessTruths: input.businessTruths,
    inspiration,
    traits: input.creativeTraits,
    antiPrinciples: input.antiPrinciples,
    audience: input.audience,
    commercialObjective: input.commercialObjective,
    authoredCandidate: input.creativeThesisCandidate
  });

  const worldExplorationBase = buildCreativeWorldExploration({
    creativeThesis,
    authoredWorlds: input.creativeWorldCandidates ?? []
  });
  const creativeWorldExploration = input.creativeWorldSelection
    ? selectCreativeWorld(worldExplorationBase, input.creativeWorldSelection)
    : worldExplorationBase;
  const selectedCreativeWorld = creativeWorldExploration.selectedWorld ?? null;

  const creativeDirection = buildCreativeDirection({
    intent: input.intent,
    businessTruths: input.businessTruths,
    inspiration,
    traits: input.creativeTraits,
    antiPrinciples: input.antiPrinciples,
    thesis: creativeThesis,
    world: selectedCreativeWorld
  });
  const design = buildDesignPacket({ direction: creativeDirection, preferences: input.designPreferences });
  const image = buildImagePlan(input.assets ?? [], { direction: creativeDirection });
  const motion = buildMotionPacket({ ...(input.motion ?? {}), direction: creativeDirection });

  const worldBlocked = creativeWorldExploration.findings?.some((item) => item.severity === 'blocker') === true;
  const worldSelected = selectedCreativeWorld?.selected === true && selectedCreativeWorld?.truth?.humanCreativeSelectionConfirmed === true;
  const status = !creativeThesis.pass || worldBlocked
    ? 'blocked'
    : (creativeThesis.reviewReady === false || creativeWorldExploration.reviewReady === false || !worldSelected || creativeDirection.provisional)
      ? 'provisional'
      : 'ready-for-style-frame-production';

  return {
    id: input.id,
    taskType: input.taskType,
    status,
    stages: ['inspiration', 'creative-thesis', 'creative-world', 'creative-direction', 'design', 'image', 'motion', 'creative-eval'],
    inspiration,
    creativeThesis,
    creativeWorldExploration,
    selectedCreativeWorld,
    creativeDirection,
    design,
    image,
    motion,
    evalRubric: CREATIVE_RUBRIC
  };
}

export function validateBenchmark(output, expected) {
  const failures = [];
  for (const stage of expected.requiredStages ?? []) {
    if (!output.stages.includes(stage)) failures.push(`missing stage: ${stage}`);
  }
  for (const lane of expected.requiredInspirationLanes ?? []) {
    if (!output.inspiration.lanes[lane]?.length) failures.push(`empty inspiration lane: ${lane}`);
  }
  if (expected.requireReducedMotion && !output.motion.reducedMotion?.required) failures.push('reduced motion is not required');

  for (const rule of expected.assetExpectations ?? []) {
    const asset = output.image.assets.find((item) => item.id === rule.id);
    if (!asset) failures.push(`missing asset: ${rule.id}`);
    else if (asset.action !== rule.action) failures.push(`${rule.id}: expected ${rule.action}, got ${asset.action}`);
  }

  if (expected.requireCreativeThesis) {
    if (!output.creativeThesis) failures.push('creative thesis is missing');
    else {
      if (!output.creativeThesis.governingIdea?.statement) failures.push('creative thesis governing idea is missing');
      if (!output.creativeThesis.sourceTruths?.length) failures.push('creative thesis is not truth anchored');
      if (!output.creativeThesis.competitorTransferTest?.question) failures.push('creative thesis competitor-transfer test is missing');
      if (!output.creativeThesis.technologyPolicy) failures.push('creative thesis technology policy is missing');
      if (output.creativeThesis.truth?.humanCreativeApproval === true) failures.push('creative thesis fabricated human approval');
    }
    if (output.creativeDirection.thesisContext?.statement !== output.creativeThesis?.statement) failures.push('creative direction is not bound to creative thesis');
  }

  if (expected.requireCreativeWorldExploration) {
    const exploration = output.creativeWorldExploration;
    if (!exploration) failures.push('creative world exploration is missing');
    else {
      const count = exploration.worlds?.length ?? 0;
      if (count < 3 || count > 5) failures.push(`creative world exploration expected 3–5 worlds, got ${count}`);
      if (!exploration.worlds?.every((world) => world.schema === 'ai-studio-os/creative-world@1')) failures.push('creative world schema mismatch');
      if (!exploration.divergence?.every((pair) => pair.pass === true)) failures.push('creative world exploration contains cosmetic variants');
      if (exploration.truth?.selectedAutomatically === true) failures.push('creative world was selected automatically');
      if (output.selectedCreativeWorld) failures.push('benchmark fixture fabricated a selected Creative World');
    }
  }

  if (expected.requireSharedCreativeDirection) {
    const statement = output.creativeDirection.directionStatement;
    if (output.design.directionContext?.statement !== statement) failures.push('design packet is not bound to creative direction');
    if (output.image.directionContext?.statement !== statement) failures.push('image packet is not bound to creative direction');
    if (output.motion.directionContext?.statement !== statement) failures.push('motion packet is not bound to creative direction');
  }

  return { pass: failures.length === 0, failures };
}
