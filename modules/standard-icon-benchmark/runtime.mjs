import {
  buildDrawingMemory,
  buildDrawingIntelligencePlan,
  buildGeometryIntent
} from '../drawing-intelligence/runtime.mjs';

export const STANDARD_ICON_BENCHMARK_SCHEMA = 'ai-studio-os/standard-icon-benchmark@1';
export const STANDARD_ICON_INVENTORY_SCHEMA = 'ai-studio-os/standard-icon-semantic-inventory@1';
export const STANDARD_ICON_STYLE_SCHEMA = 'ai-studio-os/icon-style-constitution@1';

const LEVELS = new Set(['very-high', 'high', 'medium', 'low']);
const CATEGORIES = new Set(['convention-dominant', 'neighbor-sensitive']);

function blocker(code, message, evidence = {}) {
  return { severity: 'BLOCKER', code, message, evidence };
}

export function validateStandardIconInventory(input = {}, benchmark = {}) {
  const findings = [];
  if (input.schema !== STANDARD_ICON_INVENTORY_SCHEMA) findings.push(blocker('standard-icon-inventory-schema-invalid', `Inventory must use ${STANDARD_ICON_INVENTORY_SCHEMA}.`));
  const concepts = Array.isArray(input.concepts) ? input.concepts : [];
  const ids = new Set();
  for (const [index, concept] of concepts.entries()) {
    if (!concept?.id || !concept?.label || !concept?.meaning) findings.push(blocker('standard-icon-concept-invalid', 'Each concept requires id, label and meaning.', { index }));
    if (ids.has(concept?.id)) findings.push(blocker('standard-icon-concept-duplicate', 'Concept ids must be unique.', { id: concept?.id }));
    ids.add(concept?.id);
    if (!CATEGORIES.has(concept?.category)) findings.push(blocker('standard-icon-category-invalid', 'Unknown icon category.', { id: concept?.id, category: concept?.category }));
    if (!LEVELS.has(concept?.conventionStrength) || !LEVELS.has(concept?.allowedOriginality)) findings.push(blocker('standard-icon-level-invalid', 'conventionStrength and allowedOriginality must use known levels.', { id: concept?.id }));
    if (!Array.isArray(concept?.mustCommunicate) || concept.mustCommunicate.length === 0) findings.push(blocker('standard-icon-must-communicate-empty', 'Each concept requires mustCommunicate.', { id: concept?.id }));
    if (!Array.isArray(concept?.mustNotMean) || concept.mustNotMean.length === 0) findings.push(blocker('standard-icon-must-not-mean-empty', 'Each concept requires mustNotMean.', { id: concept?.id }));
  }
  for (const id of benchmark.concepts ?? []) if (!ids.has(id)) findings.push(blocker('standard-icon-benchmark-concept-missing', 'Benchmark concept is missing from inventory.', { id }));
  return { pass: !findings.length, findings, concepts };
}

export function authorStyleConstitution(input = {}) {
  const findings = [];
  if (input.schema !== STANDARD_ICON_STYLE_SCHEMA) findings.push(blocker('standard-icon-style-schema-invalid', `Style brief must use ${STANDARD_ICON_STYLE_SCHEMA}.`));
  const preserve = new Set(input.brief?.mustPreserve ?? []);
  const avoid = new Set(input.brief?.mustAvoid ?? []);
  if (!preserve.has('immediate recognition') || !preserve.has('small-size clarity')) findings.push(blocker('standard-icon-style-usability-constraint-missing', 'Style brief must protect recognition and small-size clarity.'));

  const constitution = {
    ...input,
    constitutionAuthored: findings.length === 0,
    resolvedStyle: {
      id: 'quiet-cutline-v1',
      name: 'Quiet Cutline',
      thesis: 'Preserve learned silhouettes, then create authorship through disciplined proportion, negative space, optical weight and restrained cut details rather than metaphor novelty.',
      derivation: [
        'Immediate recognition requires learned silhouettes to remain dominant.',
        'Small-size clarity favors a single continuous optical stroke family and generous internal gaps.',
        'Avoiding repeated gimmicks rules out a universal decorative signature mark.',
        'Family character therefore comes from shared proportions, terminal discipline, curve tension and arrow grammar.'
      ],
      geometry: {
        viewBox: [0, 0, 24, 24],
        safeInset: 2.25,
        strokeWidthBySize: { '14': 2.2, '16': 2.05, '20': 1.9, '24': 1.8 },
        cap: 'round',
        join: 'round',
        curveCharacter: 'taut-soft',
        cornerCharacter: 'soft structural corners with selective flat cuts',
        negativeSpace: 'open and deliberately wider than decorative icon families',
        arrowGrammar: 'open 45-degree heads with short stems and clear origin/destination separation',
        occupancy: 'centered compact field with optical rather than mathematical centering'
      },
      constraints: {
        genericLibraryImitationAvoided: avoid.has('generic library imitation'),
        semanticReinventionAllowedForConventionalControls: false,
        universalBrandMotifAllowed: false
      }
    },
    findings,
    pass: findings.length === 0
  };
  return constitution;
}

function semanticPlan() {
  return {
    semanticDevices: [
      { id: 'core-metaphor', label: 'learned functional metaphor', priority: 1 },
      { id: 'secondary-detail', label: 'size-permitted construction detail', priority: 2 }
    ],
    primitives: [
      { id: 'core-shape', kind: 'conventional-metaphor', role: 'primary-recognition', semanticDeviceId: 'core-metaphor', qualities: { familiar: true } },
      { id: 'secondary-shape', kind: 'supporting-detail', role: 'authored-detail', semanticDeviceId: 'secondary-detail', qualities: { decorativeOnly: false } }
    ],
    relationships: [
      { from: 'core-shape', to: 'secondary-shape', type: 'supports-without-redefining', semanticDeviceId: 'secondary-detail' }
    ]
  };
}

export function buildStandardIconDrawingInput(concept, benchmark, style) {
  const familiarityMode = concept.category === 'convention-dominant' ? 'convention-first' : 'hybrid-restrained';
  const targetSizes = benchmark.targetSizes;
  return {
    schema: 'ai-studio-os/drawing-intelligence@1',
    projectId: benchmark.id,
    id: `${benchmark.id}-${concept.id}`,
    assetType: 'icon',
    conceptId: concept.id,
    semanticIntent: {
      meaning: concept.meaning,
      mustCommunicate: concept.mustCommunicate,
      mustNotMean: concept.mustNotMean,
      mustNotEncode: [],
      contexts: ['standard interface control', 'desktop UI', 'mobile UI']
    },
    familiarityDecision: {
      mode: familiarityMode,
      rationale: concept.category === 'convention-dominant'
        ? `${concept.label} has a strong learned UI metaphor; style may alter construction but not semantic recognition.`
        : `${concept.label} has close semantic neighbors; preserve the learned metaphor while using restrained authored construction to improve distinction.`
    },
    targetSizes,
    sizeBudgets: Object.fromEntries(targetSizes.map((size) => [String(size), { maxSemanticDevices: size <= 16 ? 1 : 2 }])),
    candidates: [
      {
        id: 'convention-core',
        metaphor: `${concept.label} using its established interface metaphor with neutral conventional construction.`,
        metaphorCues: [`${concept.id}-convention`, 'learned-silhouette'],
        geometryCues: ['balanced-occupancy', 'open-negative-space'],
        primitivePlan: semanticPlan()
      },
      {
        id: 'studio-authored',
        metaphor: `${concept.label} using its established interface metaphor interpreted through ${style.resolvedStyle.name} family rules.`,
        metaphorCues: [`${concept.id}-convention`, 'learned-silhouette', 'quiet-cutline'],
        geometryCues: ['optical-balance', 'taut-soft-curves', 'controlled-terminals'],
        primitivePlan: semanticPlan()
      }
    ]
  };
}

export function buildStandardIconBenchmark({ benchmark, inventory, styleBrief, memory: memoryInput }) {
  const findings = [];
  if (benchmark.schema !== STANDARD_ICON_BENCHMARK_SCHEMA) findings.push(blocker('standard-icon-benchmark-schema-invalid', `Benchmark must use ${STANDARD_ICON_BENCHMARK_SCHEMA}.`));
  if (!Array.isArray(benchmark.targetSizes) || benchmark.targetSizes.length < 3) findings.push(blocker('standard-icon-target-sizes-invalid', 'Benchmark requires at least three target sizes.'));
  const inventoryResult = validateStandardIconInventory(inventory, benchmark);
  findings.push(...inventoryResult.findings);
  const style = authorStyleConstitution(styleBrief);
  findings.push(...style.findings);
  const memory = buildDrawingMemory(memoryInput);
  if (!memory.pass) findings.push(...memory.findings);

  const plans = [];
  const intents = [];
  if (!findings.length) {
    for (const conceptId of benchmark.concepts) {
      const concept = inventoryResult.concepts.find((item) => item.id === conceptId);
      const drawingInput = buildStandardIconDrawingInput(concept, benchmark, style);
      const plan = buildDrawingIntelligencePlan(drawingInput, { memory });
      plans.push(plan);
      if (!plan.pass) findings.push(...plan.findings.map((item) => ({ ...item, conceptId })));
      if (plan.pass) {
        for (const size of benchmark.targetSizes) intents.push(buildGeometryIntent(plan, benchmark.benchmarkCandidateId, { size }));
      }
    }
  }

  const pass = findings.every((item) => item.severity !== 'BLOCKER') && plans.length === benchmark.concepts.length && plans.every((plan) => plan.pass);
  return {
    schema: STANDARD_ICON_BENCHMARK_SCHEMA,
    id: benchmark.id,
    benchmark,
    inventory: inventoryResult,
    style,
    memory,
    plans,
    intents,
    findings,
    pass,
    reviewReady: pass,
    status: pass ? 'ready-for-vector-construction' : 'blocked',
    humanStandardIconReviewComplete: false,
    standardIconSystemApproved: false
  };
}

export function deriveStandardIconTruth(input = {}) {
  const gates = {
    standardIconSemanticInventoryAuthored: input.inventoryPassed === true,
    styleConstitutionAuthored: input.styleConstitutionAuthored === true,
    drawingIntelligenceInterpretationRun: input.drawingPlansPassed === true,
    sizeBudgetExecutionEnforced: input.sizeBudgetExecutionEnforced === true,
    vectorSpecValidationPassed: input.vectorSpecValidationPassed === true,
    emittedSvgIntegrityPassed: input.emittedSvgIntegrityPassed === true,
    browserGlyphRenderPassed: input.browserGlyphRenderPassed === true,
    specimenProofComplete: input.specimenProofComplete === true,
    uiContextProofComplete: input.uiContextProofComplete === true,
    collisionReviewComplete: input.collisionReviewComplete === true,
    labelBlindProofComplete: input.labelBlindProofComplete === true,
    textPairingProofComplete: input.textPairingProofComplete === true,
    squintProofComplete: input.squintProofComplete === true
  };
  const pass = Object.values(gates).every(Boolean);
  return {
    ...gates,
    pass,
    reviewReady: pass,
    status: pass ? 'ready-for-human-standard-icon-review' : 'blocked',
    humanStandardIconReviewComplete: false,
    standardIconSystemApproved: false
  };
}
