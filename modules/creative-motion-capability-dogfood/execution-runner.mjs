import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { CREATIVE_MOTION_DOGFOOD_CONDITIONS } from './runtime.mjs';
import { buildCreativeMotionDogfoodDirectControlExploration, buildCreativeMotionDogfoodGenerationSource } from './execution.mjs';
import { buildGeminiMotionDogfoodBudget } from './gemini-runner.mjs';

const CONDITION_IDS = CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((item) => item.id);
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }
function positiveInteger(value) { return Number.isInteger(value) && value > 0 ? value : null; }
function normalizeIdentity(value = {}) { return { schema: text(value?.schema), requestedModel: text(value?.requestedModel), providerModelName: text(value?.providerModelName), providerBaseModelId: text(value?.providerBaseModelId), providerVersion: text(value?.providerVersion), supportedGenerationMethods: Array.isArray(value?.supportedGenerationMethods) ? value.supportedGenerationMethods.map(text).filter(Boolean).sort() : [], inputTokenLimit: positiveInteger(value?.inputTokenLimit), outputTokenLimit: positiveInteger(value?.outputTokenLimit), providerMetadataFingerprint: text(value?.providerMetadataFingerprint), capturedAt: text(value?.capturedAt) }; }
function identityBinding(value = {}) { const { capturedAt: _capturedAt, ...binding } = normalizeIdentity(value); return binding; }
export function sameCreativeMotionDogfoodProviderIdentity(expected = {}, observed = {}) { return sameValue(identityBinding(expected), identityBinding(observed)); }

function normalizeSourceExecution(value = {}) { return { schema: text(value?.schema), trialId: text(value?.trialId), conditionId: text(value?.conditionId).toUpperCase(), executionInstanceRef: text(value?.executionInstanceRef), runtimeTraceRef: text(value?.runtimeTraceRef), runtimeTraceFingerprint: text(value?.runtimeTraceFingerprint), sourceEvidenceRef: text(value?.sourceEvidenceRef), sourceArtifactFingerprint: text(value?.sourceArtifactFingerprint) }; }
function normalizeSourceEntry(value = {}) { return { trialId: text(value?.trialId), conditionId: text(value?.conditionId).toUpperCase(), sourceExecution: normalizeSourceExecution(value?.sourceExecution), source: value?.source && typeof value.source === 'object' && !Array.isArray(value.source) ? value.source : null }; }
function sourceEntryFor(entries = [], trialId) { return entries.filter((entry) => entry.trialId === trialId); }

function scheduleFor(seed = '') {
  const normalizedSeed = text(seed);
  return [1, 2, 3].flatMap((replicate) => CONDITION_IDS.map((conditionId) => ({ conditionId, replicate, orderKey: fingerprintCreativeValue({ seed: normalizedSeed, replicate, conditionId, purpose: 'balanced-dogfood-schedule' }) })).sort((left, right) => left.orderKey === right.orderKey ? left.conditionId.localeCompare(right.conditionId) : left.orderKey.localeCompare(right.orderKey)).map(({ conditionId }) => ({ replicate, conditionId })));
}

export function buildCreativeMotionDogfoodExecutionSchedule(scheduleSeed = '') {
  return scheduleFor(scheduleSeed).map((slot) => ({ ...slot, trialId: 'trial-' + slot.conditionId.toLowerCase() + '-' + slot.replicate }));
}

function sourceBundle(value = {}) { return { trialId: text(value?.trialId), conditionId: text(value?.conditionId).toUpperCase(), sourceKind: text(value?.sourceKind), executionMode: text(value?.executionMode), sourceSnapshotFingerprint: text(value?.sourceSnapshotFingerprint), sourceArtifactFingerprint: text(value?.sourceArtifactFingerprint), sourceExecutionFingerprint: text(value?.sourceExecutionFingerprint), executionInstanceRef: text(value?.executionInstanceRef), runtimeTraceRef: text(value?.runtimeTraceRef), runtimeTraceFingerprint: text(value?.runtimeTraceFingerprint), sourceEvidenceRef: text(value?.sourceEvidenceRef), selectedCreativeWorldFingerprint: text(value?.selectedCreativeWorldFingerprint), conditionArtifact: value?.conditionArtifact ?? null, directControl: value?.directControl ?? null, generationInstruction: text(value?.generationInstruction), generationInstructionFingerprint: text(value?.generationInstructionFingerprint) }; }
function expectedTruth() { return { experimentOnly: true, protocolPlanOnly: true, noAutomaticRetry: true, noFallbackModel: true, noManualCherryPicking: true, partialRunsNonResumable: true, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false }; }

function normalizePlanCore(value = {}) {
  return {
    schema: 'ai-studio-os/creative-motion-dogfood-execution-plan@4', stage: 'creative-motion-dogfood-pre-proof-execution', experimentId: text(value?.experimentId), projectId: text(value?.projectId), frozenBrief: value?.frozenBrief ?? null, briefFingerprint: text(value?.briefFingerprint), selectedCreativeWorld: value?.selectedCreativeWorld ?? null, canonicalCreativeAuthority: value?.canonicalCreativeAuthority ?? null, modelIdentity: normalizeIdentity(value?.modelIdentity), generationBudget: value?.generationBudget ?? null, scheduleSeed: text(value?.scheduleSeed),
    schedule: Array.isArray(value?.schedule) ? value.schedule.map((item) => ({ replicate: positiveInteger(item?.replicate), conditionId: text(item?.conditionId).toUpperCase(), trialId: text(item?.trialId) })) : [],
    trialSources: (Array.isArray(value?.trialSources) ? value.trialSources : []).map(normalizeSourceEntry), conditionBundles: (Array.isArray(value?.conditionBundles) ? value.conditionBundles : []).map(sourceBundle),
    trials: Array.isArray(value?.trials) ? value.trials.map((trial) => ({ trialId: text(trial?.trialId), conditionId: text(trial?.conditionId).toUpperCase(), replicate: positiveInteger(trial?.replicate), executionMode: text(trial?.executionMode), projectId: text(trial?.projectId), briefFingerprint: text(trial?.briefFingerprint), sourceSnapshotFingerprint: text(trial?.sourceSnapshotFingerprint), sourceExecutionFingerprint: text(trial?.sourceExecutionFingerprint), runtimeTraceRef: text(trial?.runtimeTraceRef), runtimeEvidenceRef: text(trial?.runtimeEvidenceRef), generationInstructionFingerprint: text(trial?.generationInstructionFingerprint), generationBudget: trial?.generationBudget ?? null })) : [],
    truth: { experimentOnly: value?.truth?.experimentOnly === true, protocolPlanOnly: value?.truth?.protocolPlanOnly === true, noAutomaticRetry: value?.truth?.noAutomaticRetry === true, noFallbackModel: value?.truth?.noFallbackModel === true, noManualCherryPicking: value?.truth?.noManualCherryPicking === true, partialRunsNonResumable: value?.truth?.partialRunsNonResumable === true, reviewReady: value?.truth?.reviewReady === true, capabilityEvidenceReady: value?.truth?.capabilityEvidenceReady === true, creativeDirectionApproved: value?.truth?.creativeDirectionApproved === true, technicalPlanningApproved: value?.truth?.technicalPlanningApproved === true, productionApproved: value?.truth?.productionApproved === true }
  };
}
function planFingerprint(value = {}) { return fingerprintCreativeValue(normalizePlanCore(value)); }
function sourceArtifactFingerprint(bundle = {}) { return bundle.executionMode === 'architecture-output' ? fingerprintCreativeValue(bundle.conditionArtifact ?? null) : bundle.executionMode === 'executed-direct-model-output' ? fingerprintCreativeValue({ directControl: bundle.directControl ?? null, exploration: bundle.conditionArtifact ?? null }) : fingerprintCreativeValue({ sourceSnapshotFingerprint: bundle.sourceSnapshotFingerprint, generationInstructionFingerprint: bundle.generationInstructionFingerprint }); }
function reviewSourceExecution(entry = {}, trial = {}, bundle = {}) {
  const execution = normalizeSourceExecution(entry.sourceExecution);
  const artifactFingerprint = sourceArtifactFingerprint(bundle);
  const findings = [];
  if (execution.schema !== 'ai-studio-os/creative-motion-dogfood-source-execution@1') findings.push(finding('blocker', 'dogfood-executor-source-execution-schema-invalid', 'Every replicate requires the canonical source-execution provenance envelope.'));
  if (execution.trialId !== trial.trialId || execution.conditionId !== trial.conditionId) findings.push(finding('blocker', 'dogfood-executor-replicate-source-mismatch', 'Source provenance must bind the exact scheduled trial and condition.'));
  if (!execution.executionInstanceRef || !execution.runtimeTraceRef || !execution.runtimeTraceFingerprint || !execution.sourceEvidenceRef) findings.push(finding('blocker', 'dogfood-executor-source-execution-evidence-missing', 'Every replicate requires an execution instance, runtime trace, trace fingerprint and source evidence reference.'));
  if (execution.sourceArtifactFingerprint !== artifactFingerprint) findings.push(finding('blocker', 'dogfood-executor-source-artifact-drift', 'Source execution provenance must bind the exact native output or direct-model request artifact for its trial.'));
  return { ...execution, sourceArtifactFingerprint: artifactFingerprint, sourceExecutionFingerprint: fingerprintCreativeValue({ ...execution, sourceArtifactFingerprint: artifactFingerprint }), findings, reviewReady: findings.every((item) => item.severity !== 'blocker') };
}

function deriveBundles({ projectId, brief, briefFingerprint, selectedCreativeWorld, canonicalCreativeAuthority, schedule, trialSources, generationBudget }) {
  return schedule.map((trial) => {
    const entries = sourceEntryFor(trialSources, trial.trialId);
    if (entries.length !== 1) return sourceBundle({ trialId: trial.trialId, conditionId: trial.conditionId });
    const sourceExecution = entries[0].sourceExecution ?? {};
    const generated = buildCreativeMotionDogfoodGenerationSource({ trial: { ...trial, projectId, briefFingerprint, runtimeTraceRef: sourceExecution.runtimeTraceRef, generationBudget }, brief, selectedCreativeWorld, canonicalCreativeAuthority, source: entries[0].source });
    const execution = reviewSourceExecution(entries[0], trial, generated);
    return { ...generated, trialId: trial.trialId, sourceArtifactFingerprint: execution.sourceArtifactFingerprint, sourceExecutionFingerprint: execution.sourceExecutionFingerprint, executionInstanceRef: execution.executionInstanceRef, runtimeTraceRef: execution.runtimeTraceRef, runtimeTraceFingerprint: execution.runtimeTraceFingerprint, sourceEvidenceRef: execution.sourceEvidenceRef, findings: [...generated.findings, ...execution.findings], reviewReady: generated.reviewReady && execution.reviewReady };
  });
}
function plannedTrials({ projectId, briefFingerprint, schedule, bundles, generationBudget }) { return schedule.map((slot) => { const bundle = bundles.find((item) => item.trialId === slot.trialId) ?? sourceBundle(); return { trialId: slot.trialId, conditionId: slot.conditionId, replicate: slot.replicate, executionMode: bundle.executionMode, projectId: text(projectId), briefFingerprint: text(briefFingerprint), sourceSnapshotFingerprint: bundle.sourceSnapshotFingerprint, sourceExecutionFingerprint: bundle.sourceExecutionFingerprint, generationInstructionFingerprint: bundle.generationInstructionFingerprint, runtimeTraceRef: bundle.runtimeTraceRef, runtimeEvidenceRef: bundle.sourceEvidenceRef, generationBudget }; }); }

export function buildCreativeMotionDogfoodExecutionPlan({ experimentId, projectId, frozenBrief, selectedCreativeWorld, canonicalCreativeAuthority, modelIdentity, trialSources = [], budget = {}, scheduleSeed } = {}) {
  const briefFingerprint = fingerprintCreativeValue(frozenBrief ?? {});
  const identity = normalizeIdentity(modelIdentity);
  const generationBudget = buildGeminiMotionDogfoodBudget(identity.requestedModel, budget);
  const schedule = buildCreativeMotionDogfoodExecutionSchedule(scheduleSeed);
  const sources = (Array.isArray(trialSources) ? trialSources : []).map(normalizeSourceEntry);
  const bundles = deriveBundles({ projectId, brief: frozenBrief, briefFingerprint, selectedCreativeWorld, canonicalCreativeAuthority, schedule, trialSources: sources, generationBudget });
  const plan = { schema: 'ai-studio-os/creative-motion-dogfood-execution-plan@4', stage: 'creative-motion-dogfood-pre-proof-execution', experimentId: text(experimentId), projectId: text(projectId), frozenBrief: frozenBrief ?? null, briefFingerprint, selectedCreativeWorld: selectedCreativeWorld ?? null, canonicalCreativeAuthority: canonicalCreativeAuthority ?? null, modelIdentity: identity, generationBudget, scheduleSeed: text(scheduleSeed), schedule, trialSources: sources, conditionBundles: bundles, trials: plannedTrials({ projectId, briefFingerprint, schedule, bundles, generationBudget }), truth: expectedTruth() };
  plan.snapshotFingerprint = planFingerprint(plan);
  const review = reviewCreativeMotionDogfoodExecutionPlan(plan);
  return { ...plan, findings: review.findings, pass: review.pass, status: review.status };
}

export function reviewCreativeMotionDogfoodExecutionPlan(plan = {}) {
  const findings = [];
  const core = normalizePlanCore(plan);
  const identity = core.modelIdentity;
  if (plan?.schema !== core.schema || plan?.stage !== core.stage) findings.push(finding('blocker', 'dogfood-executor-plan-schema-invalid', 'Execution plan requires the canonical V4 per-replicate pre-proof execution schema and stage.'));
  if (!core.experimentId || !core.projectId || !core.scheduleSeed) findings.push(finding('blocker', 'dogfood-executor-context-incomplete', 'Execution plan needs experiment/project identities and a frozen non-empty schedule seed.'));
  if (core.briefFingerprint !== fingerprintCreativeValue(core.frozenBrief ?? {})) findings.push(finding('blocker', 'dogfood-executor-brief-fingerprint-drift', 'Execution plan must derive the brief fingerprint from its exact frozen brief.'));
  if (identity.schema !== 'ai-studio-os/gemini-model-identity@1' || !identity.requestedModel || !identity.providerModelName || !identity.providerVersion || !identity.providerMetadataFingerprint || !identity.capturedAt || !identity.supportedGenerationMethods.includes('generateContent') || /(?:^|-)latest$/i.test(identity.requestedModel)) findings.push(finding('blocker', 'dogfood-executor-provider-identity-invalid', 'Formal execution requires an enrolled immutable provider model name, version, capability and metadata binding.'));
  const canonicalWorld = core.canonicalCreativeAuthority?.selectedCreativeWorld ?? core.canonicalCreativeAuthority?.creativeWorldExploration?.selectedWorld ?? null;
  if (!core.selectedCreativeWorld || !sameValue(core.selectedCreativeWorld, canonicalWorld)) findings.push(finding('blocker', 'dogfood-executor-shared-world-drift', 'The exact selected Creative World must be frozen and freshly match the canonical authority bundle.'));
  const expectedSchedule = buildCreativeMotionDogfoodExecutionSchedule(core.scheduleSeed);
  if (!sameValue(core.schedule, expectedSchedule)) findings.push(finding('blocker', 'dogfood-executor-schedule-drift', 'Execution must use the frozen deterministic balanced schedule.'));
  if (core.trialSources.length !== expectedSchedule.length) findings.push(finding('blocker', 'dogfood-executor-source-coverage-invalid', 'Execution plan requires one independently produced source/output bundle for every A1–E3 trial.'));
  const derivedBundles = deriveBundles({ projectId: core.projectId, brief: core.frozenBrief, briefFingerprint: core.briefFingerprint, selectedCreativeWorld: core.selectedCreativeWorld, canonicalCreativeAuthority: core.canonicalCreativeAuthority, schedule: expectedSchedule, trialSources: core.trialSources, generationBudget: core.generationBudget });
  for (const expected of expectedSchedule) {
    const entries = sourceEntryFor(core.trialSources, expected.trialId);
    if (entries.length !== 1) findings.push(finding('blocker', 'dogfood-executor-source-duplicate-or-missing', 'Each scheduled replicate must have exactly one upstream source bundle.', { trialId: expected.trialId }));
    const derived = derivedBundles.find((item) => item.trialId === expected.trialId);
    findings.push(...(derived?.findings ?? []));
    const bound = core.conditionBundles.find((item) => item.trialId === expected.trialId);
    if (!bound || !sameValue(sourceBundle(bound), sourceBundle(derived))) findings.push(finding('blocker', 'dogfood-executor-source-bundle-drift', 'A trial bundle must be freshly derived from its exact verified upstream artifact and source-execution provenance.', { trialId: expected.trialId }));
  }
  const duplicate = (field) => derivedBundles.map((item) => text(item?.[field])).filter(Boolean).filter((value, index, all) => all.indexOf(value) !== index);
  if (duplicate('sourceExecutionFingerprint').length || duplicate('executionInstanceRef').length) findings.push(finding('blocker', 'dogfood-executor-replicate-execution-reused', 'A source execution instance or provenance fingerprint cannot be reused across replicates.'));
  if (duplicate('runtimeTraceRef').length || duplicate('runtimeTraceFingerprint').length) findings.push(finding('blocker', 'dogfood-executor-replicate-runtime-trace-reused', 'A runtime trace cannot be presented as independent replicate provenance.'));
  if (derivedBundles.some((item) => item.selectedCreativeWorldFingerprint !== fingerprintCreativeValue(core.selectedCreativeWorld ?? null))) findings.push(finding('blocker', 'dogfood-executor-source-world-binding-drift', 'Every trial source, including E, must bind the exact same selected Creative World object.'));
  const expectedBudget = buildGeminiMotionDogfoodBudget(identity.requestedModel, core.generationBudget ?? {});
  if (!sameValue(core.generationBudget, expectedBudget)) findings.push(finding('blocker', 'dogfood-executor-budget-drift', 'Formal execution requires one fixed model/temperature/token/time policy.'));
  const expectedTrials = plannedTrials({ projectId: core.projectId, briefFingerprint: core.briefFingerprint, schedule: expectedSchedule, bundles: derivedBundles, generationBudget: expectedBudget });
  if (!sameValue(core.trials, expectedTrials)) findings.push(finding('blocker', 'dogfood-executor-trial-binding-drift', 'All fifteen trial bindings must be freshly derived from the verified per-replicate source bundles and frozen schedule.'));
  if (!sameValue(core.truth, expectedTruth())) findings.push(finding('blocker', 'dogfood-executor-truth-drift', 'Pre-proof execution cannot gain review, capability, direction, planning or production authority.'));
  if (text(plan?.snapshotFingerprint) !== planFingerprint(plan)) findings.push(finding('blocker', 'dogfood-executor-plan-fingerprint-drift', 'Execution plan fingerprint must bind every per-trial source execution, provider identity, schedule and trial.'));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return { schema: 'ai-studio-os/creative-motion-dogfood-execution-plan-review@3', findings, pass: blockers.length === 0, status: blockers.length ? 'blocked' : 'ready-for-pre-proof-execution', truth: { reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}

function invalidRun(plan, trialRuns, findings, reason) { return { schema: 'ai-studio-os/creative-motion-dogfood-pre-proof-run@2', stage: 'creative-motion-dogfood-pre-proof-execution', status: 'invalid', invalidReason: reason, planSnapshotFingerprint: text(plan?.snapshotFingerprint), trialRuns, findings, truth: { experimentOnly: true, partialRunsNonResumable: true, replacementExperimentRequired: true, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } }; }
export async function executeCreativeMotionDogfoodPlan(plan = {}, { runner } = {}) {
  const planReview = reviewCreativeMotionDogfoodExecutionPlan(plan);
  if (!planReview.pass || !runner || typeof runner.runPrototype !== 'function' || typeof runner.inspectModelIdentity !== 'function') return invalidRun(plan, [], [...planReview.findings, ...(!runner || typeof runner.runPrototype !== 'function' || typeof runner.inspectModelIdentity !== 'function' ? [finding('blocker', 'dogfood-executor-runner-incomplete', 'Formal execution requires Gemini generation and model identity inspection capabilities.')] : [])], 'preflight-invalid');
  const preIdentity = await runner.inspectModelIdentity();
  if (preIdentity?.status !== 'enrolled' || !sameCreativeMotionDogfoodProviderIdentity(plan.modelIdentity, preIdentity)) return invalidRun(plan, [], [finding('blocker', 'dogfood-executor-provider-identity-drift', 'Immediate pre-batch Gemini identity inspection did not exactly match the frozen model/resource/version/metadata binding.')], 'provider-identity-preflight-drift');
  const bundles = new Map(plan.conditionBundles.map((item) => [item.trialId, item]));
  const trialRuns = [];
  for (const trial of plan.trials) {
    const bundle = bundles.get(trial.trialId);
    if (bundle?.executionMode === 'architecture-output' || bundle?.executionMode === 'executed-direct-model-output') {
      const authority = bundle.conditionArtifact?.authorityInputs?.canonicalCreativeAuthority;
      const exactArtifact = bundle.conditionArtifact && sameValue(authority?.selectedCreativeWorld ?? authority?.creativeWorldExploration?.selectedWorld ?? null, plan.selectedCreativeWorld);
      trialRuns.push({ trialId: trial.trialId, conditionId: trial.conditionId, status: exactArtifact ? bundle.executionMode === 'executed-direct-model-output' ? 'executed-direct-model-output-verified' : 'architecture-output-ready' : 'invalid', conditionArtifact: bundle.conditionArtifact, sourceExecutionFingerprint: bundle.sourceExecutionFingerprint, runtimeTraceRef: bundle.runtimeTraceRef, exactBinding: exactArtifact, providerGenerationUsed: false });
      if (!exactArtifact) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-architecture-output-drift', 'A native architecture output no longer binds the exact frozen Creative World.')], 'partial-batch-invalid');
      continue;
    }
    if (bundle?.executionMode !== 'direct-model-generation' || trial.conditionId !== 'E') return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-execution-mode-invalid', 'Only Condition E may use the direct-model provider generation path.')], 'preflight-invalid');
    let result;
    try { result = await runner.runPrototype({ trial, generationInstruction: bundle.generationInstruction, architectureDeclaration: { schema: 'ai-studio-os/creative-motion-dogfood-direct-model-binding@1', conditionId: 'E', sourceSnapshotFingerprint: bundle.sourceSnapshotFingerprint, sourceExecutionFingerprint: bundle.sourceExecutionFingerprint, selectedCreativeWorldFingerprint: bundle.selectedCreativeWorldFingerprint }, runtimeEvidenceRef: trial.runtimeEvidenceRef }); } catch (error) { return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-provider-system-failure', text(error?.message) || 'Provider execution failed.')], 'provider-system-failure'); }
    const exactBinding = text(result?.trial?.trialId) === trial.trialId && text(result?.trial?.runtimeTraceRef) === trial.runtimeTraceRef && sameValue(result?.trial?.generationBudget, trial.generationBudget) && text(result?.runtimeControl?.runtimeEvidenceRef) === trial.runtimeEvidenceRef && text(result?.request?.bodyFingerprint) !== '';
    const directOutput = buildCreativeMotionDogfoodDirectControlExploration({ projectId: plan.projectId, canonicalCreativeAuthority: plan.canonicalCreativeAuthority, selectedCreativeWorld: plan.selectedCreativeWorld, generatedDraft: result?.generatedDraft });
    trialRuns.push({ trialId: trial.trialId, conditionId: trial.conditionId, status: result?.status === 'produced' && exactBinding && directOutput.produced ? 'produced' : 'invalid', result, conditionArtifact: directOutput.exploration, sourceExecutionFingerprint: bundle.sourceExecutionFingerprint, exactBinding, providerGenerationUsed: true, findings: directOutput.findings });
    if (result?.status !== 'produced' || !exactBinding || !directOutput.produced) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-trial-invalid', 'A direct-model trial failed, drifted, or did not produce V1-valid hypotheses; the executor stopped immediately and the partial batch is non-resumable.', { trialId: trial.trialId, findingCodes: [...(result?.findings?.map((item) => item.code) ?? []), ...directOutput.findings.map((item) => item.code)] })], 'partial-batch-invalid');
  }
  const postIdentity = await runner.inspectModelIdentity();
  if (postIdentity?.status !== 'enrolled' || !sameCreativeMotionDogfoodProviderIdentity(plan.modelIdentity, postIdentity)) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-provider-identity-drift', 'Post-batch Gemini identity inspection did not exactly match the frozen model/resource/version/metadata binding.')], 'provider-identity-postflight-drift');
  return { schema: 'ai-studio-os/creative-motion-dogfood-pre-proof-run@2', stage: 'creative-motion-dogfood-pre-proof-execution', status: 'produced', planSnapshotFingerprint: text(plan?.snapshotFingerprint), trialRuns, findings: [], truth: { experimentOnly: true, partialRunsNonResumable: true, replacementExperimentRequired: false, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}
