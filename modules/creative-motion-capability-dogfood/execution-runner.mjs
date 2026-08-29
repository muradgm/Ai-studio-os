import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { CREATIVE_MOTION_DOGFOOD_CONDITIONS } from './runtime.mjs';
import { buildCreativeMotionDogfoodDirectControlExploration, buildCreativeMotionDogfoodGenerationSource } from './execution.mjs';
import { buildGeminiMotionDogfoodBudget } from './gemini-runner.mjs';

const CONDITION_IDS = CREATIVE_MOTION_DOGFOOD_CONDITIONS.map((item) => item.id);

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }
function positiveInteger(value) { return Number.isInteger(value) && value > 0 ? value : null; }

function normalizeIdentity(value = {}) {
  return { schema: text(value?.schema), requestedModel: text(value?.requestedModel), providerModelName: text(value?.providerModelName), providerBaseModelId: text(value?.providerBaseModelId), providerVersion: text(value?.providerVersion), supportedGenerationMethods: Array.isArray(value?.supportedGenerationMethods) ? value.supportedGenerationMethods.map(text).filter(Boolean).sort() : [], inputTokenLimit: positiveInteger(value?.inputTokenLimit), outputTokenLimit: positiveInteger(value?.outputTokenLimit), providerMetadataFingerprint: text(value?.providerMetadataFingerprint), capturedAt: text(value?.capturedAt) };
}

function identityBinding(value = {}) {
  const { capturedAt: _capturedAt, ...binding } = normalizeIdentity(value);
  return binding;
}

export function sameCreativeMotionDogfoodProviderIdentity(expected = {}, observed = {}) {
  return sameValue(identityBinding(expected), identityBinding(observed));
}

function normalizeSourceEntry(value = {}) { return { conditionId: text(value?.conditionId).toUpperCase(), source: value?.source && typeof value.source === 'object' && !Array.isArray(value.source) ? value.source : null }; }
function sourceEntryFor(entries = [], conditionId) { return entries.filter((entry) => entry.conditionId === conditionId); }

function scheduleFor(seed = '') {
  const normalizedSeed = text(seed);
  return [1, 2, 3].flatMap((replicate) => CONDITION_IDS
    .map((conditionId) => ({ conditionId, replicate, orderKey: fingerprintCreativeValue({ seed: normalizedSeed, replicate, conditionId, purpose: 'balanced-dogfood-schedule' }) }))
    .sort((left, right) => left.orderKey === right.orderKey ? left.conditionId.localeCompare(right.conditionId) : left.orderKey.localeCompare(right.orderKey))
    .map(({ conditionId }) => ({ replicate, conditionId })));
}

function sourceBundle(value = {}) { return { conditionId: text(value?.conditionId).toUpperCase(), sourceKind: text(value?.sourceKind), executionMode: text(value?.executionMode), sourceSnapshotFingerprint: text(value?.sourceSnapshotFingerprint), selectedCreativeWorldFingerprint: text(value?.selectedCreativeWorldFingerprint), conditionArtifact: value?.conditionArtifact ?? null, generationInstruction: text(value?.generationInstruction), generationInstructionFingerprint: text(value?.generationInstructionFingerprint) }; }
function expectedTruth() { return { experimentOnly: true, protocolPlanOnly: true, noAutomaticRetry: true, noFallbackModel: true, noManualCherryPicking: true, partialRunsNonResumable: true, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false }; }

function normalizePlanCore(value = {}) {
  return {
    schema: 'ai-studio-os/creative-motion-dogfood-execution-plan@3', stage: 'creative-motion-dogfood-pre-proof-execution', experimentId: text(value?.experimentId), projectId: text(value?.projectId), frozenBrief: value?.frozenBrief ?? null, briefFingerprint: text(value?.briefFingerprint), selectedCreativeWorld: value?.selectedCreativeWorld ?? null, canonicalCreativeAuthority: value?.canonicalCreativeAuthority ?? null, modelIdentity: normalizeIdentity(value?.modelIdentity), generationBudget: value?.generationBudget ?? null, scheduleSeed: text(value?.scheduleSeed),
    schedule: Array.isArray(value?.schedule) ? value.schedule.map((item) => ({ replicate: positiveInteger(item?.replicate), conditionId: text(item?.conditionId).toUpperCase(), trialId: text(item?.trialId) })) : [],
    conditionSources: (Array.isArray(value?.conditionSources) ? value.conditionSources : []).map(normalizeSourceEntry), conditionBundles: (Array.isArray(value?.conditionBundles) ? value.conditionBundles : []).map(sourceBundle),
    trials: Array.isArray(value?.trials) ? value.trials.map((trial) => ({ trialId: text(trial?.trialId), conditionId: text(trial?.conditionId).toUpperCase(), replicate: positiveInteger(trial?.replicate), executionMode: text(trial?.executionMode), projectId: text(trial?.projectId), briefFingerprint: text(trial?.briefFingerprint), sourceSnapshotFingerprint: text(trial?.sourceSnapshotFingerprint), generationInstructionFingerprint: text(trial?.generationInstructionFingerprint), runtimeTraceRef: text(trial?.runtimeTraceRef), runtimeEvidenceRef: text(trial?.runtimeEvidenceRef), generationBudget: trial?.generationBudget ?? null })) : [],
    truth: { experimentOnly: value?.truth?.experimentOnly === true, protocolPlanOnly: value?.truth?.protocolPlanOnly === true, noAutomaticRetry: value?.truth?.noAutomaticRetry === true, noFallbackModel: value?.truth?.noFallbackModel === true, noManualCherryPicking: value?.truth?.noManualCherryPicking === true, partialRunsNonResumable: value?.truth?.partialRunsNonResumable === true, reviewReady: value?.truth?.reviewReady === true, capabilityEvidenceReady: value?.truth?.capabilityEvidenceReady === true, creativeDirectionApproved: value?.truth?.creativeDirectionApproved === true, technicalPlanningApproved: value?.truth?.technicalPlanningApproved === true, productionApproved: value?.truth?.productionApproved === true }
  };
}

function planFingerprint(value = {}) { return fingerprintCreativeValue(normalizePlanCore(value)); }

function plannedTrials({ projectId, briefFingerprint, runRef, schedule, bundles, generationBudget }) {
  const root = text(runRef).replace(/\/+$/, '');
  return schedule.map((slot) => {
    const suffix = `${slot.conditionId.toLowerCase()}-${slot.replicate}`;
    const bundle = bundles.find((item) => item.conditionId === slot.conditionId) ?? sourceBundle();
    return { trialId: `trial-${suffix}`, conditionId: slot.conditionId, replicate: slot.replicate, executionMode: bundle.executionMode, projectId: text(projectId), briefFingerprint: text(briefFingerprint), sourceSnapshotFingerprint: bundle.sourceSnapshotFingerprint, generationInstructionFingerprint: bundle.generationInstructionFingerprint, runtimeTraceRef: `artifact://${root}/trials/${suffix}/run.json#trace`, runtimeEvidenceRef: `${root}/trials/${suffix}/run.json`, generationBudget };
  });
}

function deriveBundles({ projectId, brief, briefFingerprint, selectedCreativeWorld, canonicalCreativeAuthority, conditionSources }) {
  return CONDITION_IDS.map((conditionId) => {
    const entries = sourceEntryFor(conditionSources, conditionId);
    if (entries.length !== 1) return sourceBundle({ conditionId });
    return buildCreativeMotionDogfoodGenerationSource({ trial: { conditionId, projectId, briefFingerprint }, brief, selectedCreativeWorld, canonicalCreativeAuthority, source: entries[0].source });
  });
}

export function buildCreativeMotionDogfoodExecutionPlan({ experimentId, projectId, frozenBrief, selectedCreativeWorld, canonicalCreativeAuthority, runRef, modelIdentity, conditionSources = [], budget = {}, scheduleSeed } = {}) {
  const briefFingerprint = fingerprintCreativeValue(frozenBrief ?? {});
  const identity = normalizeIdentity(modelIdentity);
  const generationBudget = buildGeminiMotionDogfoodBudget(identity.requestedModel, budget);
  const sources = (Array.isArray(conditionSources) ? conditionSources : []).map(normalizeSourceEntry);
  const bundles = deriveBundles({ projectId, brief: frozenBrief, briefFingerprint, selectedCreativeWorld, canonicalCreativeAuthority, conditionSources: sources });
  const schedule = scheduleFor(scheduleSeed).map((slot) => ({ ...slot, trialId: `trial-${slot.conditionId.toLowerCase()}-${slot.replicate}` }));
  const plan = { schema: 'ai-studio-os/creative-motion-dogfood-execution-plan@3', stage: 'creative-motion-dogfood-pre-proof-execution', experimentId: text(experimentId), projectId: text(projectId), frozenBrief: frozenBrief ?? null, briefFingerprint, selectedCreativeWorld: selectedCreativeWorld ?? null, canonicalCreativeAuthority: canonicalCreativeAuthority ?? null, modelIdentity: identity, generationBudget, scheduleSeed: text(scheduleSeed), schedule, conditionSources: sources, conditionBundles: bundles, trials: plannedTrials({ projectId, briefFingerprint, runRef, schedule, bundles, generationBudget }), truth: expectedTruth() };
  plan.snapshotFingerprint = planFingerprint(plan);
  const review = reviewCreativeMotionDogfoodExecutionPlan(plan);
  return { ...plan, findings: review.findings, pass: review.pass, status: review.status };
}

export function reviewCreativeMotionDogfoodExecutionPlan(plan = {}) {
  const findings = [];
  const core = normalizePlanCore(plan);
  const identity = core.modelIdentity;
  if (plan?.schema !== core.schema || plan?.stage !== core.stage) findings.push(finding('blocker', 'dogfood-executor-plan-schema-invalid', 'Execution plan requires the canonical V3 pre-proof execution schema and stage.'));
  if (!core.experimentId || !core.projectId || !core.scheduleSeed) findings.push(finding('blocker', 'dogfood-executor-context-incomplete', 'Execution plan needs experiment/project identities and a frozen non-empty schedule seed.'));
  if (core.briefFingerprint !== fingerprintCreativeValue(core.frozenBrief ?? {})) findings.push(finding('blocker', 'dogfood-executor-brief-fingerprint-drift', 'Execution plan must derive the brief fingerprint from its exact frozen brief.'));
  if (identity.schema !== 'ai-studio-os/gemini-model-identity@1' || !identity.requestedModel || !identity.providerModelName || !identity.providerVersion || !identity.providerMetadataFingerprint || !identity.capturedAt || !identity.supportedGenerationMethods.includes('generateContent')) findings.push(finding('blocker', 'dogfood-executor-provider-identity-invalid', 'Formal execution requires an enrolled provider model name, version, capabilities and metadata fingerprint.'));
  if (/(?:^|-)latest$/i.test(identity.requestedModel)) findings.push(finding('blocker', 'dogfood-executor-provider-model-mutable', 'Formal execution cannot use a mutable latest model alias.'));
  if (core.conditionSources.length !== CONDITION_IDS.length) findings.push(finding('blocker', 'dogfood-executor-source-coverage-invalid', 'Execution plan requires exactly one real upstream source bundle per A/B/C/D/E condition.'));
  const worldFingerprint = fingerprintCreativeValue(core.selectedCreativeWorld ?? null);
  const canonicalWorld = core.canonicalCreativeAuthority?.selectedCreativeWorld ?? core.canonicalCreativeAuthority?.creativeWorldExploration?.selectedWorld ?? null;
  if (!core.selectedCreativeWorld || !sameValue(core.selectedCreativeWorld, canonicalWorld)) findings.push(finding('blocker', 'dogfood-executor-shared-world-drift', 'The exact selected Creative World must be frozen and freshly match the canonical authority bundle.'));
  const derivedBundles = deriveBundles({ projectId: core.projectId, brief: core.frozenBrief, briefFingerprint: core.briefFingerprint, selectedCreativeWorld: core.selectedCreativeWorld, canonicalCreativeAuthority: core.canonicalCreativeAuthority, conditionSources: core.conditionSources });
  for (const conditionId of CONDITION_IDS) {
    const entries = sourceEntryFor(core.conditionSources, conditionId);
    if (entries.length !== 1) findings.push(finding('blocker', 'dogfood-executor-source-duplicate-or-missing', 'Each condition must have exactly one upstream source bundle.', { conditionId }));
    const derived = derivedBundles.find((item) => item.conditionId === conditionId);
    findings.push(...(derived?.findings ?? []));
    const bound = core.conditionBundles.find((item) => item.conditionId === conditionId);
    if (!bound || !sameValue(sourceBundle(bound), sourceBundle(derived))) findings.push(finding('blocker', 'dogfood-executor-source-bundle-drift', 'A condition bundle must be freshly derived from exact verified upstream artifacts; caller-supplied fingerprints, refs, prompts or declarations are not accepted.', { conditionId }));
  }
  if (derivedBundles.some((item) => item.selectedCreativeWorldFingerprint !== worldFingerprint)) findings.push(finding('blocker', 'dogfood-executor-source-world-binding-drift', 'Every condition source, including E, must bind the exact same selected Creative World object.'));
  const expectedBudget = buildGeminiMotionDogfoodBudget(identity.requestedModel, core.generationBudget ?? {});
  if (!sameValue(core.generationBudget, expectedBudget)) findings.push(finding('blocker', 'dogfood-executor-budget-drift', 'Formal execution requires one fixed model/temperature/token/time policy.'));
  const expectedSchedule = scheduleFor(core.scheduleSeed).map((slot) => ({ ...slot, trialId: `trial-${slot.conditionId.toLowerCase()}-${slot.replicate}` }));
  if (!sameValue(core.schedule, expectedSchedule)) findings.push(finding('blocker', 'dogfood-executor-schedule-drift', 'Execution must use the frozen deterministic balanced schedule.'));
  if (core.schedule.length !== 15 || [1, 2, 3].some((replicate) => !sameValue(core.schedule.filter((item) => item.replicate === replicate).map((item) => item.conditionId).sort(), CONDITION_IDS))) findings.push(finding('blocker', 'dogfood-executor-schedule-balance-invalid', 'Each replicate block must contain A/B/C/D/E exactly once.'));
  const runRef = core.trials[0]?.runtimeEvidenceRef?.replace(/\/trials\/[a-e]-[1-3]\/run\.json$/, '') ?? '';
  const expectedTrials = plannedTrials({ projectId: core.projectId, briefFingerprint: core.briefFingerprint, runRef, schedule: expectedSchedule, bundles: derivedBundles, generationBudget: expectedBudget });
  if (!sameValue(core.trials, expectedTrials)) findings.push(finding('blocker', 'dogfood-executor-trial-binding-drift', 'All fifteen trial bindings must be freshly derived from the verified source bundles and frozen schedule.'));
  if (!sameValue(core.truth, expectedTruth())) findings.push(finding('blocker', 'dogfood-executor-truth-drift', 'Pre-proof execution cannot gain review, capability, direction, planning or production authority.'));
  if (text(plan?.snapshotFingerprint) !== planFingerprint(plan)) findings.push(finding('blocker', 'dogfood-executor-plan-fingerprint-drift', 'Execution plan fingerprint must bind the frozen brief, sources, provider identity, schedule and every trial.'));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return { schema: 'ai-studio-os/creative-motion-dogfood-execution-plan-review@2', findings, pass: blockers.length === 0, status: blockers.length ? 'blocked' : 'ready-for-pre-proof-execution', truth: { reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}

function invalidRun(plan, trialRuns, findings, reason) {
  return { schema: 'ai-studio-os/creative-motion-dogfood-pre-proof-run@2', stage: 'creative-motion-dogfood-pre-proof-execution', status: 'invalid', invalidReason: reason, planSnapshotFingerprint: text(plan?.snapshotFingerprint), trialRuns, findings, truth: { experimentOnly: true, partialRunsNonResumable: true, replacementExperimentRequired: true, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}

export async function executeCreativeMotionDogfoodPlan(plan = {}, { runner } = {}) {
  const planReview = reviewCreativeMotionDogfoodExecutionPlan(plan);
  if (!planReview.pass || !runner || typeof runner.runPrototype !== 'function' || typeof runner.inspectModelIdentity !== 'function') return invalidRun(plan, [], [...planReview.findings, ...(!runner || typeof runner.runPrototype !== 'function' || typeof runner.inspectModelIdentity !== 'function' ? [finding('blocker', 'dogfood-executor-runner-incomplete', 'Formal execution requires Gemini generation and model identity inspection capabilities.')] : [])], 'preflight-invalid');
  const preIdentity = await runner.inspectModelIdentity();
  if (preIdentity?.status !== 'enrolled' || !sameCreativeMotionDogfoodProviderIdentity(plan.modelIdentity, preIdentity)) return invalidRun(plan, [], [finding('blocker', 'dogfood-executor-provider-identity-drift', 'Immediate pre-batch Gemini identity inspection did not exactly match the frozen model/resource/version/metadata binding.')], 'provider-identity-preflight-drift');
  const bundles = new Map(plan.conditionBundles.map((item) => [item.conditionId, item]));
  const trialRuns = [];
  for (const trial of plan.trials) {
    const bundle = bundles.get(trial.conditionId);
    if (bundle?.executionMode === 'architecture-output') {
      const artifactReview = trial.conditionId === 'A'
        ? bundle.conditionArtifact?.authorityInputs?.canonicalCreativeAuthority
        : bundle.conditionArtifact?.authorityInputs?.canonicalCreativeAuthority;
      const exactArtifact = bundle.conditionArtifact && sameValue(artifactReview?.selectedCreativeWorld ?? artifactReview?.creativeWorldExploration?.selectedWorld ?? null, plan.selectedCreativeWorld);
      trialRuns.push({ trialId: trial.trialId, conditionId: trial.conditionId, status: exactArtifact ? 'architecture-output-ready' : 'invalid', conditionArtifact: bundle.conditionArtifact, exactBinding: exactArtifact, providerGenerationUsed: false });
      if (!exactArtifact) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-architecture-output-drift', 'An A/B/C/D architecture output no longer binds the exact frozen Creative World.')], 'partial-batch-invalid');
      continue;
    }
    if (bundle?.executionMode !== 'direct-model-generation' || trial.conditionId !== 'E') return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-execution-mode-invalid', 'Only Condition E may use the direct-model provider generation path.')], 'preflight-invalid');
    let result;
    try { result = await runner.runPrototype({ trial, generationInstruction: bundle.generationInstruction, architectureDeclaration: { schema: 'ai-studio-os/creative-motion-dogfood-direct-model-binding@1', conditionId: 'E', sourceSnapshotFingerprint: bundle.sourceSnapshotFingerprint, selectedCreativeWorldFingerprint: bundle.selectedCreativeWorldFingerprint }, runtimeEvidenceRef: trial.runtimeEvidenceRef }); }
    catch (error) { return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-provider-system-failure', text(error?.message) || 'Provider execution failed.')], 'provider-system-failure'); }
    const exactBinding = text(result?.trial?.trialId) === trial.trialId && text(result?.trial?.runtimeTraceRef) === trial.runtimeTraceRef && sameValue(result?.trial?.generationBudget, trial.generationBudget) && text(result?.runtimeControl?.runtimeEvidenceRef) === trial.runtimeEvidenceRef && text(result?.request?.bodyFingerprint) !== '';
    const directOutput = buildCreativeMotionDogfoodDirectControlExploration({ projectId: plan.projectId, canonicalCreativeAuthority: plan.canonicalCreativeAuthority, selectedCreativeWorld: plan.selectedCreativeWorld, generatedDraft: result?.generatedDraft });
    trialRuns.push({ trialId: trial.trialId, conditionId: trial.conditionId, status: result?.status === 'produced' && exactBinding && directOutput.produced ? 'produced' : 'invalid', result, conditionArtifact: directOutput.exploration, exactBinding, providerGenerationUsed: true, findings: directOutput.findings });
    if (result?.status !== 'produced' || !exactBinding || !directOutput.produced) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-trial-invalid', 'A direct-model trial failed, drifted, or did not produce V1-valid hypotheses; the executor stopped immediately and the partial batch is non-resumable.', { trialId: trial.trialId, findingCodes: [...(result?.findings?.map((item) => item.code) ?? []), ...directOutput.findings.map((item) => item.code)] })], 'partial-batch-invalid');
  }
  const postIdentity = await runner.inspectModelIdentity();
  if (postIdentity?.status !== 'enrolled' || !sameCreativeMotionDogfoodProviderIdentity(plan.modelIdentity, postIdentity)) return invalidRun(plan, trialRuns, [finding('blocker', 'dogfood-executor-provider-identity-drift', 'Post-batch Gemini identity inspection did not exactly match the frozen model/resource/version/metadata binding.')], 'provider-identity-postflight-drift');
  return { schema: 'ai-studio-os/creative-motion-dogfood-pre-proof-run@2', stage: 'creative-motion-dogfood-pre-proof-execution', status: 'produced', planSnapshotFingerprint: text(plan?.snapshotFingerprint), trialRuns, findings: [], truth: { experimentOnly: true, partialRunsNonResumable: true, replacementExperimentRequired: false, retryCount: 0, fallbackModelUsed: false, manualCherryPickingAllowed: false, reviewReady: false, capabilityEvidenceReady: false, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false } };
}
