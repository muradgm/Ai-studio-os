import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { CREATIVE_MOTION_DOGFOOD_CONDITIONS } from './runtime.mjs';
import { buildGeminiMotionDogfoodBudget } from './gemini-runner.mjs';

const CONDITION_IDS = CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((item) => item.id);
const CONDITION_BY_ID = new Map(CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((item) => [item.id, item]));

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }
function positiveInteger(value) { return Number.isInteger(value) && value > 0 ? value : null; }

function normalizeIdentity(value = {}) {
  return {
    schema: text(value?.schema),
    requestedModel: text(value?.requestedModel),
    providerModelName: text(value?.providerModelName),
    providerBaseModelId: text(value?.providerBaseModelId),
    providerVersion: text(value?.providerVersion),
    supportedGenerationMethods: Array.isArray(value?.supportedGenerationMethods) ? value.supportedGenerationMethods.map(text).filter(Boolean).sort() : [],
    inputTokenLimit: positiveInteger(value?.inputTokenLimit),
    outputTokenLimit: positiveInteger(value?.outputTokenLimit),
    providerMetadataFingerprint: text(value?.providerMetadataFingerprint),
    capturedAt: text(value?.capturedAt)
  };
}

function normalizeMaterial(value = {}) {
  const declaration = value?.architectureDeclaration && typeof value.architectureDeclaration === 'object' && !Array.isArray(value.architectureDeclaration) ? value.architectureDeclaration : null;
  return {
    conditionId: text(value?.conditionId).toUpperCase(),
    generationInstruction: text(value?.generationInstruction),
    sourceSnapshotFingerprint: text(value?.sourceSnapshotFingerprint),
    authorityEvidenceRef: text(value?.authorityEvidenceRef),
    architectureDeclaration: declaration
  };
}

function expectedArchitectureTruth(conditionId) {
  if (conditionId === 'A') return { motionV1CreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false, directModelCreativeGeneration: false };
  if (conditionId === 'B' || conditionId === 'C') return { motionV1CreativeGeneration: false, aiStudioKnowledgeUsed: true, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: true, directModelCreativeGeneration: false };
  if (conditionId === 'D') return { motionV1CreativeGeneration: false, aiStudioKnowledgeUsed: true, aiStudioTransferUsed: true, aiStudioSynthesisUsed: true, aiStudioMotionV2Used: true, directModelCreativeGeneration: false };
  return { motionV1CreativeGeneration: false, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false, directModelCreativeGeneration: true };
}

function reviewMaterial(material, expectedConditionId) {
  const findings = [];
  const expectedTruth = expectedArchitectureTruth(expectedConditionId);
  const truth = material.architectureDeclaration?.truth ?? {};
  if (material.conditionId !== expectedConditionId) findings.push(finding('blocker', 'dogfood-executor-material-condition-drift', 'Condition material must bind the exact requested dogfood condition.', { expectedConditionId, actualConditionId: material.conditionId || null }));
  if (!material.generationInstruction || !material.sourceSnapshotFingerprint || !material.authorityEvidenceRef || !material.architectureDeclaration) findings.push(finding('blocker', 'dogfood-executor-material-incomplete', 'Every condition needs an instruction, source fingerprint, authority-evidence reference and architecture declaration before execution.'));
  for (const [key, expected] of Object.entries(expectedTruth)) {
    if (truth?.[key] !== expected) findings.push(finding('blocker', 'dogfood-executor-architecture-declaration-drift', 'Condition material architecture declaration does not match the locked dogfood condition profile.', { conditionId: expectedConditionId, key, expected, actual: truth?.[key] }));
  }
  return findings;
}

function normalizePlanCore(value = {}) {
  return {
    schema: 'ai-studio-os/creative-motion-dogfood-execution-plan@1',
    stage: 'creative-motion-dogfood-pre-proof-execution',
    experimentId: text(value?.experimentId),
    projectId: text(value?.projectId),
    briefFingerprint: text(value?.briefFingerprint),
    modelIdentity: normalizeIdentity(value?.modelIdentity),
    generationBudget: value?.generationBudget ?? null,
    conditionMaterials: (Array.isArray(value?.conditionMaterials) ? value.conditionMaterials : []).map(normalizeMaterial),
    trials: Array.isArray(value?.trials) ? value.trials.map((trial) => ({
      trialId: text(trial?.trialId), conditionId: text(trial?.conditionId).toUpperCase(), replicate: positiveInteger(trial?.replicate), projectId: text(trial?.projectId), briefFingerprint: text(trial?.briefFingerprint),
      sourceSnapshotFingerprint: text(trial?.sourceSnapshotFingerprint), generationInstructionFingerprint: text(trial?.generationInstructionFingerprint), architectureDeclarationFingerprint: text(trial?.architectureDeclarationFingerprint), runtimeTraceRef: text(trial?.runtimeTraceRef), runtimeEvidenceRef: text(trial?.runtimeEvidenceRef), generationBudget: trial?.generationBudget ?? null
    })) : [],
    truth: {
      experimentOnly: value?.truth?.experimentOnly === true,
      protocolPlanOnly: value?.truth?.protocolPlanOnly === true,
      noAutomaticRetry: value?.truth?.noAutomaticRetry === true,
      noFallbackModel: value?.truth?.noFallbackModel === true,
      noManualCherryPicking: value?.truth?.noManualCherryPicking === true,
      reviewReady: value?.truth?.reviewReady === true,
      capabilityEvidenceReady: value?.truth?.capabilityEvidenceReady === true,
      productionApproved: value?.truth?.productionApproved === true
    }
  };
}

function planFingerprint(value = {}) { return fingerprintCreativeValue(normalizePlanCore(value)); }

export function buildCreativeMotionDogfoodExecutionPlan({ experimentId, projectId, briefFingerprint, runRef, modelIdentity, conditionMaterials = [], budget = {} } = {}) {
  const identity = normalizeIdentity(modelIdentity);
  const generationBudget = buildGeminiMotionDogfoodBudget(identity.requestedModel, budget);
  const materials = CONDITION_IDS.map((conditionId) => normalizeMaterial((Array.isArray(conditionMaterials) ? conditionMaterials : []).find((item) => text(item?.conditionId).toUpperCase() === conditionId)));
  const normalizedRunRef = text(runRef).replace(/\/+$/, '');
  const trials = CONDITION_IDS.flatMap((conditionId) => [1, 2, 3].map((replicate) => {
    const material = materials.find((item) => item.conditionId === conditionId) ?? normalizeMaterial();
    const suffix = `${conditionId.toLowerCase()}-${replicate}`;
    return {
      trialId: `trial-${suffix}`,
      conditionId,
      replicate,
      projectId: text(projectId),
      briefFingerprint: text(briefFingerprint),
      sourceSnapshotFingerprint: material.sourceSnapshotFingerprint,
      generationInstructionFingerprint: fingerprintCreativeValue(material.generationInstruction),
      architectureDeclarationFingerprint: fingerprintCreativeValue(material.architectureDeclaration),
      runtimeTraceRef: `artifact://${normalizedRunRef}/trials/${suffix}/run.json#trace`,
      runtimeEvidenceRef: `${normalizedRunRef}/trials/${suffix}/run.json`,
      generationBudget
    };
  }));
  const plan = {
    schema: 'ai-studio-os/creative-motion-dogfood-execution-plan@1',
    stage: 'creative-motion-dogfood-pre-proof-execution',
    experimentId: text(experimentId),
    projectId: text(projectId),
    briefFingerprint: text(briefFingerprint),
    modelIdentity: identity,
    generationBudget,
    conditionMaterials: materials,
    trials,
    truth: {
      experimentOnly: true,
      protocolPlanOnly: true,
      noAutomaticRetry: true,
      noFallbackModel: true,
      noManualCherryPicking: true,
      reviewReady: false,
      capabilityEvidenceReady: false,
      productionApproved: false
    }
  };
  plan.snapshotFingerprint = planFingerprint(plan);
  const review = reviewCreativeMotionDogfoodExecutionPlan(plan);
  return { ...plan, findings: review.findings, pass: review.pass, status: review.status };
}

export function reviewCreativeMotionDogfoodExecutionPlan(plan = {}) {
  const findings = [];
  const core = normalizePlanCore(plan);
  const identity = core.modelIdentity;
  if (plan?.schema !== core.schema || plan?.stage !== core.stage) findings.push(finding('blocker', 'dogfood-executor-plan-schema-invalid', 'Execution plan requires the canonical pre-proof execution schema and stage.'));
  if (!core.experimentId || !core.projectId || !core.briefFingerprint) findings.push(finding('blocker', 'dogfood-executor-context-incomplete', 'Execution plan needs experiment, project and frozen brief identities.'));
  if (identity.schema !== 'ai-studio-os/gemini-model-identity@1' || !identity.requestedModel || !identity.providerModelName || !identity.providerVersion || !identity.providerMetadataFingerprint || !identity.capturedAt || !identity.supportedGenerationMethods.includes('generateContent')) findings.push(finding('blocker', 'dogfood-executor-provider-identity-invalid', 'Formal execution requires an enrolled provider model name, version, capabilities and metadata fingerprint.'));
  if (/(?:^|-)latest$/i.test(identity.requestedModel)) findings.push(finding('blocker', 'dogfood-executor-provider-model-mutable', 'Formal execution cannot use a mutable latest model alias.'));
  if (core.conditionMaterials.length !== CONDITION_IDS.length) findings.push(finding('blocker', 'dogfood-executor-material-coverage-invalid', 'Execution plan requires one explicit material bundle for every A/B/C/D/E condition.'));
  for (const conditionId of CONDITION_IDS) {
    const materials = core.conditionMaterials.filter((item) => item.conditionId === conditionId);
    if (materials.length !== 1) findings.push(finding('blocker', 'dogfood-executor-material-duplicate-or-missing', 'Each dogfood condition must have exactly one material bundle.', { conditionId }));
    else findings.push(...reviewMaterial(materials[0], conditionId));
  }
  if (core.trials.length !== 15) findings.push(finding('blocker', 'dogfood-executor-trial-count-invalid', 'Formal execution requires exactly fifteen A1–E3 trials.'));
  for (const conditionId of CONDITION_IDS) {
    const replicates = core.trials.filter((trial) => trial.conditionId === conditionId).map((trial) => trial.replicate).sort((a, b) => a - b);
    if (!sameValue(replicates, [1, 2, 3])) findings.push(finding('blocker', 'dogfood-executor-replicate-coverage-invalid', 'Every condition requires replicates 1, 2 and 3 exactly once.', { conditionId, replicates }));
  }
  const expectedBudget = buildGeminiMotionDogfoodBudget(identity.requestedModel, core.generationBudget ?? {});
  if (!sameValue(core.generationBudget, expectedBudget) || core.trials.some((trial) => !sameValue(trial.generationBudget, expectedBudget))) findings.push(finding('blocker', 'dogfood-executor-budget-drift', 'Every execution trial must bind the exact one-request Gemini model, temperature, token and wall-clock policy.'));
  if (core.trials.some((trial) => trial.projectId !== core.projectId || trial.briefFingerprint !== core.briefFingerprint || !trial.runtimeTraceRef || !trial.runtimeEvidenceRef)) findings.push(finding('blocker', 'dogfood-executor-trial-context-drift', 'Every trial must retain the exact project/brief binding and unique runtime evidence references.'));
  for (const trial of core.trials) {
    const material = core.conditionMaterials.find((item) => item.conditionId === trial.conditionId);
    if (!material || trial.sourceSnapshotFingerprint !== material.sourceSnapshotFingerprint || trial.generationInstructionFingerprint !== fingerprintCreativeValue(material.generationInstruction) || trial.architectureDeclarationFingerprint !== fingerprintCreativeValue(material.architectureDeclaration)) {
      findings.push(finding('blocker', 'dogfood-executor-trial-material-binding-drift', 'Every trial must bind the exact source snapshot, generation instruction and architecture declaration that the executor will submit.', { trialId: trial.trialId }));
    }
  }
  const uniqueIds = new Set(core.trials.map((trial) => trial.trialId));
  if (uniqueIds.size !== core.trials.length) findings.push(finding('blocker', 'dogfood-executor-trial-id-invalid', 'Every planned execution trial needs a unique stable ID.'));
  if (new Set(core.trials.map((trial) => trial.runtimeTraceRef)).size !== core.trials.length || new Set(core.trials.map((trial) => trial.runtimeEvidenceRef)).size !== core.trials.length) findings.push(finding('blocker', 'dogfood-executor-runtime-reference-duplicate', 'Every trial must write to its own trace and evidence reference.'));
  const expectedTruth = { experimentOnly: true, protocolPlanOnly: true, noAutomaticRetry: true, noFallbackModel: true, noManualCherryPicking: true, reviewReady: false, capabilityEvidenceReady: false, productionApproved: false };
  if (!sameValue(core.truth, expectedTruth)) findings.push(finding('blocker', 'dogfood-executor-truth-drift', 'Execution plans cannot gain review, capability or production authority.'));
  if (text(plan?.snapshotFingerprint) !== planFingerprint(plan)) findings.push(finding('blocker', 'dogfood-executor-plan-fingerprint-drift', 'Execution plan fingerprint must bind model identity, source material, controls and all fifteen trials.'));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return { schema: 'ai-studio-os/creative-motion-dogfood-execution-plan-review@1', findings, pass: blockers.length === 0, status: blockers.length ? 'blocked' : 'ready-for-pre-proof-execution', truth: { reviewReady: false, capabilityEvidenceReady: false, productionApproved: false } };
}

export async function executeCreativeMotionDogfoodPlan(plan = {}, { runner } = {}) {
  const planReview = reviewCreativeMotionDogfoodExecutionPlan(plan);
  if (!planReview.pass || !runner || typeof runner.runPrototype !== 'function') {
    return { schema: 'ai-studio-os/creative-motion-dogfood-pre-proof-run@1', status: 'blocked', planSnapshotFingerprint: text(plan?.snapshotFingerprint), trialRuns: [], findings: [...planReview.findings, ...(!runner || typeof runner.runPrototype !== 'function' ? [finding('blocker', 'dogfood-executor-runner-missing', 'Pre-proof execution requires the narrow Gemini dogfood runner.')] : [])], truth: { reviewReady: false, capabilityEvidenceReady: false, productionApproved: false } };
  }
  const materials = new Map(plan.conditionMaterials.map((item) => [item.conditionId, normalizeMaterial(item)]));
  const trialRuns = [];
  const findings = [];
  for (const trial of plan.trials) {
    const material = materials.get(trial.conditionId);
    const result = await runner.runPrototype({
      trial,
      generationInstruction: material.generationInstruction,
      architectureDeclaration: material.architectureDeclaration,
      runtimeEvidenceRef: trial.runtimeEvidenceRef
    });
    const exactBinding = text(result?.trial?.trialId) === trial.trialId
      && text(result?.trial?.runtimeTraceRef) === trial.runtimeTraceRef
      && sameValue(result?.trial?.generationBudget, trial.generationBudget)
      && text(result?.runtimeControl?.runtimeEvidenceRef) === trial.runtimeEvidenceRef;
    if (!exactBinding) findings.push(finding('blocker', 'dogfood-executor-result-binding-drift', 'A provider result did not bind the exact planned trial controls and evidence references.', { trialId: trial.trialId }));
    if (result?.status !== 'produced') findings.push(finding('blocker', 'dogfood-executor-trial-not-produced', 'A planned trial did not produce a structured draft; the executor does not retry or substitute a result.', { trialId: trial.trialId, findingCodes: result?.findings?.map((item) => item.code) ?? [] }));
    trialRuns.push({ trialId: trial.trialId, conditionId: trial.conditionId, status: text(result?.status), result, exactBinding });
  }
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-motion-dogfood-pre-proof-run@1',
    stage: 'creative-motion-dogfood-pre-proof-execution',
    status: blockers.length ? 'blocked' : 'produced',
    planSnapshotFingerprint: text(plan?.snapshotFingerprint),
    trialRuns,
    findings,
    truth: { experimentOnly: true, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, productionApproved: false }
  };
}

export const DOGFOOD_EXECUTION_CONDITIONS = Object.freeze(CONDITION_IDS.map((id) => CONDITION_BY_ID.get(id)));
