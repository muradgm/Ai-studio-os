import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { buildMotionCreativeExploration } from '../motion-creative-intelligence/runtime.mjs';
import { buildMotionIntelligenceV2ExplorationHandoff, buildMotionIntelligenceV2Set, reviewMotionIntelligenceV2Brief } from '../motion-intelligence-v2/runtime.mjs';
import { buildCreativeMotionDogfoodDirectControlExploration, DOGFOOD_CORE_MOTION_KNOWLEDGE_IDS } from './execution.mjs';
import { buildCreativeMotionDogfoodExecutionPlan, buildCreativeMotionDogfoodExecutionSchedule, sameCreativeMotionDogfoodProviderIdentity } from './execution-runner.mjs';
import { buildGeminiMotionDogfoodBudget, buildGeminiMotionDogfoodRequestRecord } from './gemini-runner.mjs';
import { MOTION_INTELLIGENCE_V2_KNOWLEDGE } from '../motion-intelligence-v2/knowledge.mjs';

const CONDITION_IDS = ['A', 'B', 'C', 'D', 'E'];
const COMPLETED_MOTION_SCHEMAS = new Set([
  'ai-studio-os/motion-creative-exploration@1',
  'ai-studio-os/motion-intelligence-reasoning-set@2',
  'ai-studio-os/motion-intelligence-v2-exploration-handoff@1'
]);
const COMPLETED_MOTION_STAGES = new Set([
  'motion-creative-exploration',
  'motion-intelligence-v2-reasoning',
  'motion-intelligence-v2-to-v1-handoff'
]);
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }
function canonicalize(value) { if (Array.isArray(value)) return value.map(canonicalize); if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])); return value; }
function contextFor(entries = [], conditionId) { return entries.filter((item) => text(item?.conditionId).toUpperCase() === conditionId); }
function containsCompletedMotionArtifact(value, depth = 0) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => containsCompletedMotionArtifact(item, depth + 1));
  if (COMPLETED_MOTION_SCHEMAS.has(text(value.schema)) || COMPLETED_MOTION_STAGES.has(text(value.stage))) return true;
  return Object.entries(value).some(([key, child]) => (depth === 0 && ['exploration', 'reasoningSet', 'handoff', 'hypotheses'].includes(key)) || containsCompletedMotionArtifact(child, depth + 1));
}
function sorted(values = []) { return [...new Set((Array.isArray(values) ? values : []).map(text).filter(Boolean))].sort(); }
const FULL_KNOWLEDGE_IDS = sorted(MOTION_INTELLIGENCE_V2_KNOWLEDGE.map((item) => item.id));

function reviewStaticContext({ conditionId, context, projectId, briefFingerprint, selectedCreativeWorld }) {
  const findings = [];
  if (!context || typeof context !== 'object' || Array.isArray(context)) findings.push(finding('blocker', 'dogfood-authoring-context-missing', 'Every condition requires verified pre-authoring context.'));
  if (containsCompletedMotionArtifact(context)) findings.push(finding('blocker', 'dogfood-authoring-context-completed-artifact-forbidden', 'Provider authoring context must never contain a completed Motion exploration, reasoning set, or V2-to-V1 handoff. Verified non-Motion provenance artifacts remain allowed.'));
  if (conditionId === 'A') {
    const contract = context?.v1AuthoringContract ?? {};
    if (text(contract.schema) !== 'ai-studio-os/motion-v1-dogfood-isolation@1' || !text(contract.isolationAttestedBy) || !text(contract.isolationEvidenceRef) || contract.truth?.motionV1CreativeGeneration !== true || contract.truth?.aiStudioKnowledgeUsed || contract.truth?.aiStudioTransferUsed || contract.truth?.aiStudioSynthesisUsed || contract.truth?.aiStudioMotionV2Used) findings.push(finding('blocker', 'dogfood-authoring-v1-context-invalid', 'Condition A requires the existing V1-only isolation attestation as pre-authoring context.'));
  } else if (['B', 'C', 'D'].includes(conditionId)) {
    const brief = context?.v2Brief;
    const authorityInputs = context?.authorityInputs;
    const review = reviewMotionIntelligenceV2Brief(brief ?? {}, authorityInputs);
    if (!review.reviewReady || text(brief?.projectId) !== projectId) findings.push(finding('blocker', 'dogfood-authoring-v2-context-invalid', 'Conditions B/C/D require a freshly review-ready Motion V2 Brief and original authority inputs.', { conditionId, findingCodes: review.findings?.map((item) => item.code) ?? [] }));
    const expectedWorld = selectedCreativeWorld?.id;
    if (text(brief?.creativeWorldId) !== text(expectedWorld)) findings.push(finding('blocker', 'dogfood-authoring-v2-world-drift', 'Motion V2 pre-authoring context must bind the exact frozen Creative World.'));
    const knowledgeIds = Array.isArray(brief?.knowledgeBinding?.knowledgeIds) ? brief.knowledgeBinding.knowledgeIds : [];
    const expectedKnowledgeIds = conditionId === 'B' ? sorted(DOGFOOD_CORE_MOTION_KNOWLEDGE_IDS) : FULL_KNOWLEDGE_IDS;
    if (!sameValue(sorted(knowledgeIds), expectedKnowledgeIds) || (conditionId === 'D' && Number(brief?.synthesisBinding?.candidateCount ?? 0) < 1) || (conditionId !== 'D' && (brief?.synthesisBinding || (brief?.synthesisCandidates ?? []).length))) findings.push(finding('blocker', 'dogfood-authoring-v2-isolation-drift', 'B/C/D must preserve their verified knowledge and Synthesis isolation before authoring.'));
  } else if (conditionId === 'E') {
    const request = context?.directControlRequest ?? {};
    if (text(request.schema) !== 'ai-studio-os/direct-model-motion-control-request@1' || text(request.projectId) !== projectId || text(request.briefFingerprint) !== briefFingerprint || !text(request.isolationAttestedBy) || !text(request.isolationEvidenceRef) || request.truth?.directModelCreativeGeneration !== true || request.truth?.aiStudioKnowledgeUsed || request.truth?.aiStudioTransferUsed || request.truth?.aiStudioSynthesisUsed || request.truth?.aiStudioMotionV2Used) findings.push(finding('blocker', 'dogfood-authoring-direct-context-invalid', 'Condition E requires the existing isolated direct-model control request.'));
  } else findings.push(finding('blocker', 'dogfood-authoring-condition-invalid', 'Unsupported condition.'));
  return { findings, reviewReady: findings.every((item) => item.severity !== 'blocker') };
}

export function buildCreativeMotionDogfoodAuthoringTask({ trial, frozenBrief, selectedCreativeWorld, context }) {
  const conditionId = trial.conditionId;
  const payload = {
    schema: 'ai-studio-os/creative-motion-dogfood-authoring-task@1',
    task: 'Author exactly three divergent Motion hypotheses as JSON. Do not return completed explorations, reasoning sets, handoffs, reviews, authority claims, or implementation code.',
    trial: { trialId: trial.trialId, conditionId },
    frozenBrief,
    frozenBriefFingerprint: fingerprintCreativeValue(frozenBrief),
    selectedCreativeWorld,
    selectedCreativeWorldFingerprint: fingerprintCreativeValue(selectedCreativeWorld),
    output: {
      schema: conditionId === 'A' || conditionId === 'E' ? 'ai-studio-os/motion-hypotheses@1' : 'ai-studio-os/motion-intelligence-v2-hypotheses@2',
      minimumHypotheses: 3,
      requiredTopLevel: ['hypotheses'],
      requiredHypothesisFields: conditionId === 'A' || conditionId === 'E'
        ? ['id', 'title', 'interpretation', 'creativeWorldRefs', 'language', 'motionMoments', 'stillMoments', 'hierarchyConsequences', 'responsiveConsequences', 'antiPatterns', 'critique']
        : ['id', 'title', 'temporalStrategy', 'projectTruthRefs', 'creativeWorldRefs', 'knowledgeRefs', 'knowledgeContributions', 'synthesisCandidateRefs', 'synthesisContributions', 'semanticIntent', 'signatureBehavior', 'motionNecessity', 'attentionSequence', 'temporalComposition', 'motionHierarchy', 'physicalCharacter', 'choreography', 'cinematicLanguage', 'mediaMotion', 'responsivePlan', 'reducedMotionEquivalent', 'accessibilityConstraints', 'performanceReasoning', 'antiPatterns', 'failureModes', 'uncertainty', 'falsifier', 'critique'],
      noCompletedArtifacts: true
    }
  };
  if (conditionId === 'A') payload.motionV1AuthoringContract = context.v1AuthoringContract;
  if (['B', 'C', 'D'].includes(conditionId)) {
    payload.motionV2Brief = context.v2Brief;
    payload.output.synthesisPolicy = conditionId === 'D'
      ? {
          mode: 'verified-candidates-only',
          allowedCandidateIds: (context.v2Brief?.synthesisCandidates ?? []).map((item) => item.id),
          contributionsMustExactlyMatchReferences: true
        }
      : {
          mode: 'forbidden',
          allowedCandidateIds: [],
          contributionsMustExactlyMatchReferences: true
        };
  }
  if (conditionId === 'E') payload.directControlRequest = context.directControlRequest;
  return JSON.stringify(canonicalize(payload));
}

function buildNativeArtifact({ conditionId, projectId, canonicalCreativeAuthority, selectedCreativeWorld, context, generatedDraft }) {
  if (conditionId === 'A') {
    const exploration = buildMotionCreativeExploration({ projectId, canonicalCreativeAuthority, hypotheses: generatedDraft?.hypotheses });
    return { exploration, source: { exploration, v1Isolation: { ...context.v1AuthoringContract, explorationFingerprint: fingerprintCreativeValue(exploration) } }, reviewReady: exploration.reviewReady, findings: exploration.findings ?? [] };
  }
  if (['B', 'C', 'D'].includes(conditionId)) {
    const reasoningSet = buildMotionIntelligenceV2Set({ brief: context.v2Brief, hypotheses: generatedDraft?.hypotheses }, context.authorityInputs);
    const handoff = buildMotionIntelligenceV2ExplorationHandoff({ reasoningSet, authorityInputs: context.authorityInputs });
    return { exploration: handoff.exploration, source: { reasoningSet, handoff, authorityInputs: context.authorityInputs }, reviewReady: reasoningSet.reviewReady && handoff.reviewReady, findings: [...(reasoningSet.findings ?? []), ...(handoff.findings ?? [])] };
  }
  const direct = buildCreativeMotionDogfoodDirectControlExploration({ projectId, canonicalCreativeAuthority, selectedCreativeWorld, generatedDraft });
  return { exploration: direct.exploration, source: { directControlRequest: context.directControlRequest }, reviewReady: direct.produced, findings: direct.findings };
}

function reviewProviderResultBinding({ result, trial, generationInstruction, runtimeEvidenceRef, architectureDeclaration, modelIdentity }) {
  const findings = [];
  const expectedRequest = buildGeminiMotionDogfoodRequestRecord({ model: modelIdentity?.requestedModel, generationInstruction, generationBudget: trial.generationBudget, architectureDeclaration });
  const truth = result?.truth ?? {};
  if (result?.status !== 'produced') findings.push(finding('blocker', 'dogfood-authoring-provider-status-invalid', 'Provider result must be a produced response before native construction.'));
  if (text(result?.trial?.trialId) !== trial.trialId || text(result?.trial?.conditionId).toUpperCase() !== trial.conditionId || text(result?.trial?.projectId) !== trial.projectId || text(result?.trial?.briefFingerprint) !== trial.briefFingerprint || text(result?.trial?.runtimeTraceRef) !== trial.runtimeTraceRef || !sameValue(result?.trial?.generationBudget, trial.generationBudget)) findings.push(finding('blocker', 'dogfood-authoring-provider-trial-binding-invalid', 'Provider result must bind the exact scheduled trial, condition, project, frozen brief, trace reference and budget.'));
  if (text(result?.runtimeControl?.runtimeEvidenceRef) !== runtimeEvidenceRef || text(result?.runtimeControl?.runtimeTraceRef) !== trial.runtimeTraceRef) findings.push(finding('blocker', 'dogfood-authoring-provider-runtime-binding-invalid', 'Provider runtime control must bind the exact scheduled trace and evidence references.'));
  if (text(result?.request?.bodyFingerprint) !== expectedRequest.bodyFingerprint || !sameValue(result?.request?.generationConfig, expectedRequest.generationConfig) || text(result?.request?.endpoint) !== expectedRequest.endpoint || text(result?.request?.method) !== expectedRequest.method || text(result?.request?.model) !== expectedRequest.model || text(result?.request?.architectureDeclarationFingerprint) !== expectedRequest.architectureDeclarationFingerprint) findings.push(finding('blocker', 'dogfood-authoring-provider-request-control-invalid', 'Provider request must exactly match the frozen Gemini instruction, model, generation configuration and architecture declaration.'));
  if (!text(result?.request?.bodyFingerprint) || text(result?.trace?.requestFingerprint) !== text(result?.request?.bodyFingerprint) || !text(result?.trace?.responseFingerprint)) findings.push(finding('blocker', 'dogfood-authoring-provider-request-response-binding-invalid', 'Provider trace must bind the exact request fingerprint and a non-empty response fingerprint.'));
  if (text(result?.runtimeControl?.runtimeTraceFingerprint) !== fingerprintCreativeValue(result?.trace ?? null)) findings.push(finding('blocker', 'dogfood-authoring-provider-trace-fingerprint-invalid', 'Runtime control must bind a fresh fingerprint of the exact provider trace.'));
  if (!sameValue({ maxGenerationAttempts: result?.runtimeControl?.maxGenerationAttempts, tokenBudget: result?.runtimeControl?.tokenBudget, wallClockSeconds: result?.runtimeControl?.wallClockSeconds, modelPolicyId: result?.runtimeControl?.modelPolicyId, temperaturePolicyId: result?.runtimeControl?.temperaturePolicyId }, trial.generationBudget)) findings.push(finding('blocker', 'dogfood-authoring-provider-runtime-budget-invalid', 'Provider runtime control must retain the exact frozen generation budget.'));
  if (text(result?.trace?.provider) !== 'gemini' || text(result?.trace?.model) !== text(modelIdentity?.requestedModel) || text(result?.request?.model) !== text(modelIdentity?.requestedModel)) findings.push(finding('blocker', 'dogfood-authoring-provider-model-binding-invalid', 'Provider result must identify the exact enrolled Gemini model.'));
  if (truth.prototypeOnly !== true || truth.providerFallbackUsed !== false || truth.architectureExecutionCryptographicallyProven !== false || truth.reviewReady !== false || truth.capabilityEvidenceReady !== false || truth.creativeDirectionApproved !== false || truth.technicalPlanningApproved !== false || truth.productionApproved !== false) findings.push(finding('blocker', 'dogfood-authoring-provider-authority-truth-invalid', 'Provider generation output remains prototype-only, non-fallback, non-cryptographically-proven and non-authoritative.'));
  return { findings, reviewReady: findings.every((item) => item.severity !== 'blocker') };
}

function invalidRun(plan, trialRuns, findings, reason) {
  return { schema: 'ai-studio-os/creative-motion-dogfood-authoring-run@1', stage: 'creative-motion-dogfood-provider-authoring', status: 'invalid', invalidReason: reason, planSnapshotFingerprint: text(plan?.snapshotFingerprint), trialRuns, findings, truth: { experimentOnly: true, partialRunsNonResumable: true, replacementExperimentRequired: true, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}

export function buildCreativeMotionDogfoodAuthoringPlan({ experimentId, projectId, frozenBrief, selectedCreativeWorld, canonicalCreativeAuthority, modelIdentity, conditionContexts = [], budget = {}, generationBudget: frozenGenerationBudget = null, scheduleSeed } = {}) {
  const briefFingerprint = fingerprintCreativeValue(frozenBrief ?? {});
  const schedule = buildCreativeMotionDogfoodExecutionSchedule(scheduleSeed);
  const generationBudget = buildGeminiMotionDogfoodBudget(text(modelIdentity?.requestedModel), frozenGenerationBudget ?? budget);
  const contexts = (Array.isArray(conditionContexts) ? conditionContexts : []).map((item) => ({ conditionId: text(item?.conditionId).toUpperCase(), context: item?.context ?? null }));
  const findings = [];
  if (!projectId || !scheduleSeed || !sameValue(selectedCreativeWorld, canonicalCreativeAuthority?.selectedCreativeWorld ?? canonicalCreativeAuthority?.creativeWorldExploration?.selectedWorld ?? null)) findings.push(finding('blocker', 'dogfood-authoring-shared-control-invalid', 'Authoring requires the exact frozen brief, selected Creative World and canonical authority bundle.'));
  for (const conditionId of CONDITION_IDS) {
    const entries = contextFor(contexts, conditionId);
    if (entries.length !== 1) findings.push(finding('blocker', 'dogfood-authoring-context-coverage-invalid', 'Each condition requires exactly one static pre-authoring context.', { conditionId }));
    else findings.push(...reviewStaticContext({ conditionId, context: entries[0].context, projectId: text(projectId), briefFingerprint, selectedCreativeWorld }).findings);
  }
  const plan = { schema: 'ai-studio-os/creative-motion-dogfood-authoring-plan@1', stage: 'creative-motion-dogfood-provider-authoring', experimentId: text(experimentId), projectId: text(projectId), frozenBrief: frozenBrief ?? null, briefFingerprint, selectedCreativeWorld: selectedCreativeWorld ?? null, canonicalCreativeAuthority: canonicalCreativeAuthority ?? null, modelIdentity: modelIdentity ?? null, generationBudget, scheduleSeed: text(scheduleSeed), schedule, conditionContexts: contexts, truth: { experimentOnly: true, noAutomaticRetry: true, noFallbackModel: true, noManualCherryPicking: true, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
  plan.snapshotFingerprint = fingerprintCreativeValue(plan);
  return { ...plan, findings, pass: findings.every((item) => item.severity !== 'blocker'), status: findings.some((item) => item.severity === 'blocker') ? 'blocked' : 'ready-for-provider-authoring' };
}

export async function executeCreativeMotionDogfoodAuthoringPlan(plan = {}, { runner } = {}) {
  const fresh = buildCreativeMotionDogfoodAuthoringPlan(plan);
  if (!fresh.pass || text(plan?.snapshotFingerprint) !== fresh.snapshotFingerprint || !runner || typeof runner.runPrototype !== 'function' || typeof runner.inspectModelIdentity !== 'function') return invalidRun(plan, [], [...fresh.findings, finding('blocker', 'dogfood-authoring-preflight-invalid', 'Authoring plan, schedule, contexts or runner are invalid before provider execution.')], 'preflight-invalid');
  const preIdentity = await runner.inspectModelIdentity();
  if (preIdentity?.status !== 'enrolled' || !sameCreativeMotionDogfoodProviderIdentity(plan.modelIdentity, preIdentity)) return invalidRun(plan, [], [finding('blocker', 'dogfood-authoring-provider-identity-drift', 'Provider identity changed before authoring.')], 'provider-identity-preflight-drift');
  const trialSources = [];
  const trialRuns = [];
  for (const slot of plan.schedule) {
    const context = contextFor(plan.conditionContexts, slot.conditionId)[0].context;
    const runtimeTraceRef = 'artifact://dogfood-authoring/' + plan.experimentId + '/' + slot.trialId + '/trace';
    const runtimeEvidenceRef = 'artifact://dogfood-authoring/' + plan.experimentId + '/' + slot.trialId + '/run';
    const trial = { ...slot, projectId: plan.projectId, briefFingerprint: plan.briefFingerprint, runtimeTraceRef, generationBudget: plan.generationBudget };
    const generationInstruction = buildCreativeMotionDogfoodAuthoringTask({ trial, frozenBrief: plan.frozenBrief, selectedCreativeWorld: plan.selectedCreativeWorld, context });
    const architectureDeclaration = { schema: 'ai-studio-os/creative-motion-dogfood-pre-authoring-binding@1', conditionId: slot.conditionId, contextFingerprint: fingerprintCreativeValue(context), completedArtifactsExcluded: true };
    let result;
    try { result = await runner.runPrototype({ trial, generationInstruction, architectureDeclaration, runtimeEvidenceRef }); } catch (error) { return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-authoring-provider-failure', text(error?.message) || 'Provider authoring failed.')], 'provider-system-failure'); }
    const binding = reviewProviderResultBinding({ result, trial, generationInstruction, runtimeEvidenceRef, architectureDeclaration, modelIdentity: plan.modelIdentity });
    const native = binding.reviewReady ? buildNativeArtifact({ conditionId: slot.conditionId, projectId: plan.projectId, canonicalCreativeAuthority: plan.canonicalCreativeAuthority, selectedCreativeWorld: plan.selectedCreativeWorld, context, generatedDraft: result.generatedDraft }) : { reviewReady: false, findings: binding.findings };
    trialRuns.push({ trialId: slot.trialId, conditionId: slot.conditionId, status: native.reviewReady ? 'produced' : 'invalid', providerResult: result, nativeArtifact: native.exploration ?? null, findings: native.findings, exactBinding: binding.reviewReady });
    if (!native.reviewReady) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-authoring-native-build-invalid', 'Generated hypotheses did not satisfy the condition native builder/reviewer.', { trialId: slot.trialId, findingCodes: native.findings?.map((item) => item.code) ?? [] })], 'partial-batch-invalid');
    const source = native.source;
    if (slot.conditionId === 'E') {
      source.exploration = native.exploration;
      source.directControl = {
        schema: 'ai-studio-os/direct-model-motion-control@1',
        projectId: plan.projectId,
        briefFingerprint: plan.briefFingerprint,
        modelPolicyId: plan.generationBudget.modelPolicyId,
        temperaturePolicyId: plan.generationBudget.temperaturePolicyId,
        maxGenerationAttempts: plan.generationBudget.maxGenerationAttempts,
        tokenBudget: plan.generationBudget.tokenBudget,
        wallClockSeconds: plan.generationBudget.wallClockSeconds,
        requestFingerprint: result.request.bodyFingerprint,
        responseFingerprint: result.trace.responseFingerprint,
        runtimeTraceRef,
        explorationFingerprint: fingerprintCreativeValue(native.exploration),
        isolationAttestedBy: context.directControlRequest.isolationAttestedBy,
        isolationEvidenceRef: context.directControlRequest.isolationEvidenceRef,
        truth: { directModelCreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false, v1ContractValidationAndProofOnly: true }
      };
    }
    const artifactFingerprint = slot.conditionId === 'E' ? fingerprintCreativeValue({ directControl: source.directControl, exploration: native.exploration }) : fingerprintCreativeValue(native.exploration ?? null);
    trialSources.push({ trialId: slot.trialId, conditionId: slot.conditionId, source, sourceExecution: { schema: 'ai-studio-os/creative-motion-dogfood-source-execution@1', trialId: slot.trialId, conditionId: slot.conditionId, executionInstanceRef: runtimeEvidenceRef, runtimeTraceRef, runtimeTraceFingerprint: result.runtimeControl.runtimeTraceFingerprint, sourceEvidenceRef: runtimeEvidenceRef, sourceArtifactFingerprint: artifactFingerprint } });
  }
  const postIdentity = await runner.inspectModelIdentity();
  if (postIdentity?.status !== 'enrolled' || !sameCreativeMotionDogfoodProviderIdentity(plan.modelIdentity, postIdentity)) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-authoring-provider-identity-drift', 'Provider identity changed after authoring.')], 'provider-identity-postflight-drift');
  const executionPlan = buildCreativeMotionDogfoodExecutionPlan({ experimentId: plan.experimentId, projectId: plan.projectId, frozenBrief: plan.frozenBrief, selectedCreativeWorld: plan.selectedCreativeWorld, canonicalCreativeAuthority: plan.canonicalCreativeAuthority, modelIdentity: plan.modelIdentity, trialSources, budget: plan.generationBudget, scheduleSeed: plan.scheduleSeed });
  if (!executionPlan.pass) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-authoring-execution-verifier-rejected', 'The existing PR #72 verifier rejected the provider-authored native artifacts.', { findingCodes: executionPlan.findings.map((item) => item.code) })], 'execution-verifier-invalid');
  return { schema: 'ai-studio-os/creative-motion-dogfood-authoring-run@1', stage: 'creative-motion-dogfood-provider-authoring', status: 'produced', planSnapshotFingerprint: plan.snapshotFingerprint, executionPlan, trialRuns, findings: [], truth: { experimentOnly: true, partialRunsNonResumable: true, replacementExperimentRequired: false, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}
