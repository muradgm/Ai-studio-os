import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { buildMotionCreativeExploration } from '../motion-creative-intelligence/runtime.mjs';
import { buildMotionIntelligenceV2ExplorationHandoff, buildMotionIntelligenceV2Set, reviewMotionIntelligenceV2Brief } from '../motion-intelligence-v2/runtime.mjs';
import { buildCreativeMotionDogfoodDirectControlExploration, buildCreativeMotionDogfoodGenerationSource, DOGFOOD_CORE_MOTION_KNOWLEDGE_IDS } from './execution.mjs';
import { buildCreativeMotionDogfoodExecutionPlan, buildCreativeMotionDogfoodExecutionSchedule, sameCreativeMotionDogfoodProviderIdentity } from './execution-runner.mjs';
import { buildGeminiMotionDogfoodBudget } from './gemini-runner.mjs';
import { MOTION_INTELLIGENCE_V2_KNOWLEDGE } from '../motion-intelligence-v2/knowledge.mjs';

const CONDITION_IDS = ['A', 'B', 'C', 'D', 'E'];
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }
function canonicalize(value) { if (Array.isArray(value)) return value.map(canonicalize); if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])); return value; }
function contextFor(entries = [], conditionId) { return entries.filter((item) => text(item?.conditionId).toUpperCase() === conditionId); }
function containsCompletedArtifact(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsCompletedArtifact);
  return Object.entries(value).some(([key, child]) => ['exploration', 'reasoningSet', 'handoff', 'hypotheses'].includes(key) || containsCompletedArtifact(child));
}
function sorted(values = []) { return [...new Set((Array.isArray(values) ? values : []).map(text).filter(Boolean))].sort(); }
const FULL_KNOWLEDGE_IDS = sorted(MOTION_INTELLIGENCE_V2_KNOWLEDGE.map((item) => item.id));

function reviewStaticContext({ conditionId, context, projectId, briefFingerprint, selectedCreativeWorld }) {
  const findings = [];
  if (!context || typeof context !== 'object' || Array.isArray(context)) findings.push(finding('blocker', 'dogfood-authoring-context-missing', 'Every condition requires verified pre-authoring context.'));
  if (containsCompletedArtifact(context)) findings.push(finding('blocker', 'dogfood-authoring-context-completed-artifact-forbidden', 'Provider authoring context must never contain completed Motion exploration, reasoning-set, handoff or hypotheses artifacts.'));
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
    output: { schema: conditionId === 'A' || conditionId === 'E' ? 'ai-studio-os/motion-hypotheses@1' : 'ai-studio-os/motion-intelligence-v2-hypotheses@2', minimumHypotheses: 3 }
  };
  if (conditionId === 'A') payload.motionV1AuthoringContract = context.v1AuthoringContract;
  if (['B', 'C', 'D'].includes(conditionId)) payload.motionV2Brief = context.v2Brief;
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

function invalidRun(plan, trialRuns, findings, reason) {
  return { schema: 'ai-studio-os/creative-motion-dogfood-authoring-run@1', stage: 'creative-motion-dogfood-provider-authoring', status: 'invalid', invalidReason: reason, planSnapshotFingerprint: text(plan?.snapshotFingerprint), trialRuns, findings, truth: { experimentOnly: true, partialRunsNonResumable: true, replacementExperimentRequired: true, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}

export function buildCreativeMotionDogfoodAuthoringPlan({ experimentId, projectId, frozenBrief, selectedCreativeWorld, canonicalCreativeAuthority, modelIdentity, conditionContexts = [], budget = {}, scheduleSeed } = {}) {
  const briefFingerprint = fingerprintCreativeValue(frozenBrief ?? {});
  const schedule = buildCreativeMotionDogfoodExecutionSchedule(scheduleSeed);
  const generationBudget = buildGeminiMotionDogfoodBudget(text(modelIdentity?.requestedModel), budget);
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
    let result;
    try { result = await runner.runPrototype({ trial, generationInstruction, architectureDeclaration: { schema: 'ai-studio-os/creative-motion-dogfood-pre-authoring-binding@1', conditionId: slot.conditionId, contextFingerprint: fingerprintCreativeValue(context), completedArtifactsExcluded: true }, runtimeEvidenceRef }); } catch (error) { return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-authoring-provider-failure', text(error?.message) || 'Provider authoring failed.')], 'provider-system-failure'); }
    const exactBinding = result?.status === 'produced' && text(result?.trial?.trialId) === slot.trialId && text(result?.trial?.runtimeTraceRef) === runtimeTraceRef && sameValue(result?.trial?.generationBudget, plan.generationBudget) && text(result?.runtimeControl?.runtimeEvidenceRef) === runtimeEvidenceRef;
    const native = exactBinding ? buildNativeArtifact({ conditionId: slot.conditionId, projectId: plan.projectId, canonicalCreativeAuthority: plan.canonicalCreativeAuthority, selectedCreativeWorld: plan.selectedCreativeWorld, context, generatedDraft: result.generatedDraft }) : { reviewReady: false, findings: [finding('blocker', 'dogfood-authoring-provider-binding-invalid', 'Provider result did not bind the exact scheduled trial and controls.')] };
    trialRuns.push({ trialId: slot.trialId, conditionId: slot.conditionId, status: native.reviewReady ? 'produced' : 'invalid', providerResult: result, nativeArtifact: native.exploration ?? null, findings: native.findings, exactBinding });
    if (!native.reviewReady) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-authoring-native-build-invalid', 'Generated hypotheses did not satisfy the condition native builder/reviewer.', { trialId: slot.trialId, findingCodes: native.findings?.map((item) => item.code) ?? [] })], 'partial-batch-invalid');
    const source = native.source;
    const verificationBundle = buildCreativeMotionDogfoodGenerationSource({ trial, brief: plan.frozenBrief, selectedCreativeWorld: plan.selectedCreativeWorld, canonicalCreativeAuthority: plan.canonicalCreativeAuthority, source });
    const artifactFingerprint = slot.conditionId === 'E' ? fingerprintCreativeValue({ sourceSnapshotFingerprint: verificationBundle.sourceSnapshotFingerprint, generationInstructionFingerprint: verificationBundle.generationInstructionFingerprint }) : fingerprintCreativeValue(native.exploration ?? null);
    trialSources.push({ trialId: slot.trialId, conditionId: slot.conditionId, source, sourceExecution: { schema: 'ai-studio-os/creative-motion-dogfood-source-execution@1', trialId: slot.trialId, conditionId: slot.conditionId, executionInstanceRef: runtimeEvidenceRef, runtimeTraceRef, runtimeTraceFingerprint: result.runtimeControl.runtimeTraceFingerprint, sourceEvidenceRef: runtimeEvidenceRef, sourceArtifactFingerprint: artifactFingerprint } });
  }
  const postIdentity = await runner.inspectModelIdentity();
  if (postIdentity?.status !== 'enrolled' || !sameCreativeMotionDogfoodProviderIdentity(plan.modelIdentity, postIdentity)) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-authoring-provider-identity-drift', 'Provider identity changed after authoring.')], 'provider-identity-postflight-drift');
  const executionPlan = buildCreativeMotionDogfoodExecutionPlan({ experimentId: plan.experimentId, projectId: plan.projectId, frozenBrief: plan.frozenBrief, selectedCreativeWorld: plan.selectedCreativeWorld, canonicalCreativeAuthority: plan.canonicalCreativeAuthority, modelIdentity: plan.modelIdentity, trialSources, budget: plan.generationBudget, scheduleSeed: plan.scheduleSeed });
  if (!executionPlan.pass) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-authoring-execution-verifier-rejected', 'The existing PR #72 verifier rejected the provider-authored native artifacts.', { findingCodes: executionPlan.findings.map((item) => item.code) })], 'execution-verifier-invalid');
  return { schema: 'ai-studio-os/creative-motion-dogfood-authoring-run@1', stage: 'creative-motion-dogfood-provider-authoring', status: 'produced', planSnapshotFingerprint: plan.snapshotFingerprint, executionPlan, trialRuns, findings: [], truth: { experimentOnly: true, partialRunsNonResumable: true, replacementExperimentRequired: false, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}
