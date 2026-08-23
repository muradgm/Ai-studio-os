import { buildProductUnderstanding } from '../modules/product-understanding/runtime.mjs';
import { buildInspirationPacket } from '../modules/inspiration/runtime.mjs';
import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../modules/creative-world/runtime.mjs';
import { buildCreativeDirection } from '../modules/creative-direction/runtime.mjs';
import { buildDesignPacket } from '../modules/design/runtime.mjs';
import { buildImagePlan } from '../modules/image/runtime.mjs';
import { buildMotionPacket } from '../modules/motion/runtime.mjs';
import { CREATIVE_RUBRIC } from '../modules/evals/runtime.mjs';

export function runCreativeRuntime(input) {
  const productUnderstanding = buildProductUnderstanding({
    ...(input.productUnderstanding ?? {}),
    projectId: input.id ?? input.productUnderstanding?.projectId
  });

  if (!productUnderstanding.reviewReady) {
    return {
      id: input.id,
      taskType: input.taskType,
      status: 'blocked',
      stages: ['product-understanding'],
      productUnderstanding,
      inspiration: null,
      creativeThesis: null,
      creativeWorldExploration: null,
      selectedCreativeWorld: null,
      creativeDirection: null,
      design: null,
      image: null,
      motion: null,
      evalRubric: CREATIVE_RUBRIC,
      findings: [{
        severity: 'blocker',
        code: 'creative-runtime-product-understanding-not-ready',
        message: 'Creative Thesis and Creative Worlds are blocked until Product Understanding is review-ready.'
      }]
    };
  }

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
  const worldSelected = selectedCreativeWorld?.schema === 'ai-studio-os/creative-world@1'
    && selectedCreativeWorld?.reviewReady === true
    && selectedCreativeWorld?.selected === true
    && selectedCreativeWorld?.truth?.humanCreativeSelectionConfirmed === true
    && selectedCreativeWorld?.truth?.visualWorldProofReviewed === true;

  let status;
  if (!creativeThesis.pass || worldBlocked) status = 'blocked';
  else if (creativeThesis.reviewReady === false || creativeWorldExploration.reviewReady === false) status = 'provisional';
  else if (!worldSelected) status = 'ready-for-style-frame-proof';
  else if (creativeDirection.provisional) status = 'provisional';
  else status = 'ready-for-creative-direction-review';

  return {
    id: input.id,
    taskType: input.taskType,
    status,
    stages: ['product-understanding', 'inspiration', 'creative-thesis', 'creative-world', 'creative-direction', 'design', 'image', 'motion', 'creative-eval'],
    productUnderstanding,
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
  for (const stage of expected.requiredStages ?? []) if (!output.stages.includes(stage)) failures.push(`missing stage: ${stage}`);

  if (expected.requireProductUnderstanding) {
    if (!output.productUnderstanding) failures.push('product understanding is missing');
    else {
      if (output.productUnderstanding.reviewReady !== true) failures.push('product understanding is not review-ready');
      if (output.productUnderstanding.truth?.creativeWorkAuthorized !== true) failures.push('product understanding did not authorize creative work');
      if (!output.productUnderstanding.evidence?.length) failures.push('product understanding evidence is missing');
    }
  }

  for (const lane of expected.requiredInspirationLanes ?? []) if (!output.inspiration?.lanes?.[lane]?.length) failures.push(`empty inspiration lane: ${lane}`);
  if (expected.status && output.status !== expected.status) failures.push(`expected status ${expected.status}, got ${output.status}`);
  if (expected.requireReducedMotion && !output.motion?.reducedMotion?.required) failures.push('reduced motion is not required');

  for (const rule of expected.assetExpectations ?? []) {
    const asset = output.image?.assets?.find((item) => item.id === rule.id);
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
    if (output.creativeDirection?.thesisContext?.statement !== output.creativeThesis?.statement) failures.push('creative direction is not bound to creative thesis');
  }

  if (expected.requireCreativeWorldExploration) {
    const exploration = output.creativeWorldExploration;
    if (!exploration) failures.push('creative world exploration is missing');
    else {
      const count = exploration.worlds?.length ?? 0;
      if (count < 3 || count > 5) failures.push(`creative world exploration expected 3–5 worlds, got ${count}`);
      if (!exploration.worlds?.every((world) => world.schema === 'ai-studio-os/creative-world@1')) failures.push('creative world schema mismatch');
      if (!exploration.worlds?.every((world) => world.signatureBehavior && world.categoryTransferTest?.whyProjectSpecific)) failures.push('creative world project-specific behavior evidence missing');
      if (!exploration.divergence?.every((pair) => pair.heuristicPass === true && pair.proofLevel === 'structural-heuristic')) failures.push('creative world exploration contains obvious structural reskins');
      if (exploration.truth?.selectedAutomatically === true) failures.push('creative world was selected automatically');
      if (exploration.review?.truth?.humanSemanticDivergenceReviewed === true) failures.push('runtime fabricated human semantic divergence review');
      if (expected.requireNoAutomaticWorldSelection && output.selectedCreativeWorld) failures.push('benchmark fixture fabricated a selected Creative World');
    }
  }

  if (expected.requireSharedCreativeDirection) {
    const statement = output.creativeDirection?.directionStatement;
    if (output.design?.directionContext?.statement !== statement) failures.push('design packet is not bound to creative direction');
    if (output.image?.directionContext?.statement !== statement) failures.push('image packet is not bound to creative direction');
    if (output.motion?.directionContext?.statement !== statement) failures.push('motion packet is not bound to creative direction');
  }

  return { pass: failures.length === 0, failures };
}
