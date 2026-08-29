import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { buildMotionCreativeExploration, reviewMotionCreativeExploration } from '../motion-creative-intelligence/runtime.mjs';
import { reviewMotionProofEvidence } from '../motion-creative-intelligence/proof.mjs';
import {
  reviewMotionIntelligenceV2Set,
  reviewMotionIntelligenceV2ExplorationHandoff
} from '../motion-intelligence-v2/runtime.mjs';
import { MOTION_INTELLIGENCE_V2_KNOWLEDGE } from '../motion-intelligence-v2/knowledge.mjs';

export const DOGFOOD_CORE_MOTION_KNOWLEDGE_IDS = Object.freeze([
  'motion-necessity',
  'attention-handoff',
  'temporal-hierarchy',
  'anticipation',
  'overlap-follow-through',
  'holds-stillness',
  'rhythm-pacing',
  'continuity-vs-cut'
]);

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }
function compareText(left, right) { const a = text(left); const b = text(right); return a === b ? 0 : a < b ? -1 : 1; }
function sorted(values = []) { return [...new Set((Array.isArray(values) ? values : []).map(text).filter(Boolean))].sort(compareText); }
function sameValue(left, right) { return fingerprintCreativeValue(left) === fingerprintCreativeValue(right); }

const FULL_MOTION_KNOWLEDGE_IDS = Object.freeze(sorted(MOTION_INTELLIGENCE_V2_KNOWLEDGE.map((item) => item.id)));
const CORE_MOTION_KNOWLEDGE_IDS = Object.freeze(sorted(DOGFOOD_CORE_MOTION_KNOWLEDGE_IDS));

function normalizeControl(value = {}) {
  return {
    schema: text(value?.schema),
    projectId: text(value?.projectId),
    briefFingerprint: text(value?.briefFingerprint),
    modelPolicyId: text(value?.modelPolicyId),
    temperaturePolicyId: text(value?.temperaturePolicyId),
    maxGenerationAttempts: Number.isInteger(value?.maxGenerationAttempts) ? value.maxGenerationAttempts : null,
    tokenBudget: Number.isInteger(value?.tokenBudget) ? value.tokenBudget : null,
    wallClockSeconds: Number.isInteger(value?.wallClockSeconds) ? value.wallClockSeconds : null,
    requestFingerprint: text(value?.requestFingerprint),
    responseFingerprint: text(value?.responseFingerprint),
    runtimeTraceRef: text(value?.runtimeTraceRef),
    explorationFingerprint: text(value?.explorationFingerprint),
    isolationAttestedBy: text(value?.isolationAttestedBy),
    isolationEvidenceRef: text(value?.isolationEvidenceRef),
    truth: {
      directModelCreativeGeneration: value?.truth?.directModelCreativeGeneration === true,
      aiStudioKnowledgeUsed: value?.truth?.aiStudioKnowledgeUsed === true,
      aiStudioTransferUsed: value?.truth?.aiStudioTransferUsed === true,
      aiStudioSynthesisUsed: value?.truth?.aiStudioSynthesisUsed === true,
      aiStudioMotionV2Used: value?.truth?.aiStudioMotionV2Used === true,
      v1ContractValidationAndProofOnly: value?.truth?.v1ContractValidationAndProofOnly === true
    }
  };
}

function normalizeV1Isolation(value = {}) {
  return {
    schema: text(value?.schema),
    explorationFingerprint: text(value?.explorationFingerprint),
    isolationAttestedBy: text(value?.isolationAttestedBy),
    isolationEvidenceRef: text(value?.isolationEvidenceRef),
    truth: {
      motionV1CreativeGeneration: value?.truth?.motionV1CreativeGeneration === true,
      aiStudioKnowledgeUsed: value?.truth?.aiStudioKnowledgeUsed === true,
      aiStudioTransferUsed: value?.truth?.aiStudioTransferUsed === true,
      aiStudioSynthesisUsed: value?.truth?.aiStudioSynthesisUsed === true,
      aiStudioMotionV2Used: value?.truth?.aiStudioMotionV2Used === true
    }
  };
}

function normalizeRuntimeControl(value = {}) {
  return {
    schema: text(value?.schema),
    runtimeTraceRef: text(value?.runtimeTraceRef),
    runtimeTraceFingerprint: text(value?.runtimeTraceFingerprint),
    runtimeEvidenceRef: text(value?.runtimeEvidenceRef),
    modelPolicyId: text(value?.modelPolicyId),
    temperaturePolicyId: text(value?.temperaturePolicyId),
    maxGenerationAttempts: Number.isInteger(value?.maxGenerationAttempts) ? value.maxGenerationAttempts : null,
    tokenBudget: Number.isInteger(value?.tokenBudget) ? value.tokenBudget : null,
    wallClockSeconds: Number.isInteger(value?.wallClockSeconds) ? value.wallClockSeconds : null
  };
}

function directControlFingerprint(control = {}) {
  return fingerprintCreativeValue(normalizeControl(control));
}

function v1BaselineFingerprint(exploration, isolation) {
  return fingerprintCreativeValue({ exploration: exploration ?? null, isolation: normalizeV1Isolation(isolation) });
}

function trialById(experiment = {}, trialId = '') {
  return (Array.isArray(experiment?.trials) ? experiment.trials : []).find((item) => text(item?.trialId) === text(trialId)) ?? null;
}

function expectedKnowledgeIds(conditionId) {
  if (conditionId === 'B') return CORE_MOTION_KNOWLEDGE_IDS;
  if (conditionId === 'C' || conditionId === 'D') return FULL_MOTION_KNOWLEDGE_IDS;
  return [];
}

function reviewTemporalProofBinding(trial, exploration, source = {}) {
  const findings = [];
  const proofEvidence = source?.proofEvidence ?? null;
  const proofEvidenceRef = text(source?.proofEvidenceRef);
  const proofReview = reviewMotionProofEvidence(proofEvidence ?? {});
  const renderedStudies = Array.isArray(proofEvidence?.renderedStudies) ? proofEvidence.renderedStudies : [];
  const plannedMoments = Array.isArray(proofEvidence?.plan?.moments) ? proofEvidence.plan.moments : [];
  const proofExploration = proofEvidence?.plan?.authorityInputs?.exploration ?? null;
  const proofEvidenceFingerprint = proofEvidence ? fingerprintCreativeValue(proofEvidence) : '';

  if (!proofReview.reviewReady || proofReview.truth?.exactBrowserTemporalEvidence !== true) findings.push(finding('blocker', 'dogfood-temporal-proof-invalid', 'Dogfood evidence requires the existing Motion proof verifier to confirm real exact-browser temporal evidence; fixture-only proof cannot qualify.', { findingCodes: proofReview.findings?.map((item) => item.code) ?? [] }));
  if (!sameValue(proofExploration ?? null, exploration ?? null)) findings.push(finding('blocker', 'dogfood-temporal-proof-source-drift', 'Rendered Motion proof must be built from the exact condition exploration being tested.'));
  if (!proofEvidenceRef || proofEvidenceRef !== text(trial?.evidenceBundleRef)) findings.push(finding('blocker', 'dogfood-temporal-proof-ref-drift', 'Trial evidence-bundle reference must identify the exact freshly reviewed Motion proof evidence.'));
  if (renderedStudies.length !== Number(trial?.temporalStudyCount ?? 0)) findings.push(finding('blocker', 'dogfood-temporal-study-count-drift', 'Trial temporal-study count must match the freshly reviewed Motion proof.', { expected: renderedStudies.length, actual: trial?.temporalStudyCount ?? null }));
  if (!plannedMoments.some((item) => text(item?.viewport) === 'mobile')) findings.push(finding('blocker', 'dogfood-mobile-proof-missing', 'Dogfood proof requires an authored mobile temporal moment.'));
  if (!plannedMoments.some((item) => text(item?.input) === 'reduced-motion')) findings.push(finding('blocker', 'dogfood-reduced-motion-proof-missing', 'Dogfood proof requires a reduced-motion temporal moment.'));
  if (trial?.realBrowserEvidence !== true || trial?.mobileEvidence !== true || trial?.reducedMotionEvidence !== true) findings.push(finding('blocker', 'dogfood-trial-proof-claims-invalid', 'Trial must explicitly retain real-browser, mobile and reduced-motion evidence claims that match the verified proof.'));

  return {
    proofEvidenceFingerprint,
    proofEvidenceRef,
    renderedStudyCount: renderedStudies.length,
    findings,
    reviewReady: findings.every((item) => item.severity !== 'blocker')
  };
}

function reviewRuntimeControlBinding(trial, source = {}) {
  const findings = [];
  const runtimeControl = normalizeRuntimeControl(source?.runtimeControl ?? {});
  const budget = trial?.generationBudget ?? {};

  if (runtimeControl.schema !== 'ai-studio-os/dogfood-runtime-control@1') findings.push(finding('blocker', 'dogfood-runtime-control-schema-invalid', 'Every trial requires the canonical runtime-control evidence contract before capability interpretation.'));
  if (!runtimeControl.runtimeTraceRef || !runtimeControl.runtimeTraceFingerprint || !runtimeControl.runtimeEvidenceRef) findings.push(finding('blocker', 'dogfood-runtime-control-evidence-missing', 'Every trial requires a trace reference, trace fingerprint and runtime evidence reference; declared budget parity is not execution verification.'));
  if (runtimeControl.runtimeTraceRef !== text(trial?.runtimeTraceRef)) findings.push(finding('blocker', 'dogfood-runtime-control-trace-drift', 'Runtime-control evidence must bind the exact trial runtime trace reference.'));
  if (runtimeControl.modelPolicyId !== text(budget?.modelPolicyId) || runtimeControl.temperaturePolicyId !== text(budget?.temperaturePolicyId) || runtimeControl.maxGenerationAttempts !== budget?.maxGenerationAttempts || runtimeControl.tokenBudget !== budget?.tokenBudget || runtimeControl.wallClockSeconds !== budget?.wallClockSeconds) findings.push(finding('blocker', 'dogfood-runtime-control-budget-drift', 'Runtime-control evidence must match the trial declared model, sampling, attempt, token and time policy exactly.'));

  return {
    runtimeTraceRef: runtimeControl.runtimeTraceRef,
    runtimeTraceFingerprint: runtimeControl.runtimeTraceFingerprint,
    runtimeEvidenceRef: runtimeControl.runtimeEvidenceRef,
    verifiedRuntimeControl: findings.every((item) => item.severity !== 'blocker'),
    findings
  };
}

function reviewV1Source(trial, source = {}) {
  const findings = [];
  const exploration = source?.exploration ?? null;
  const isolation = normalizeV1Isolation(source?.v1Isolation ?? {});
  const review = reviewMotionCreativeExploration(exploration ?? {});
  const sourceFingerprint = v1BaselineFingerprint(exploration, isolation);

  if (!review.reviewReady) findings.push(finding('blocker', 'dogfood-v1-exploration-invalid', 'Condition A requires a freshly review-ready Motion V1 exploration.', { findingCodes: review.findings?.map((item) => item.code) ?? [] }));
  if (text(exploration?.projectId) !== text(trial?.projectId)) findings.push(finding('blocker', 'dogfood-v1-project-drift', 'Condition A exploration must belong to the trial project.'));
  if (isolation.schema !== 'ai-studio-os/motion-v1-dogfood-isolation@1') findings.push(finding('blocker', 'dogfood-v1-isolation-schema-invalid', 'Condition A requires the canonical V1-only isolation evidence contract.'));
  if (!isolation.isolationAttestedBy || !isolation.isolationEvidenceRef) findings.push(finding('blocker', 'dogfood-v1-isolation-attestation-missing', 'Condition A requires explicit operator isolation attestation and evidence until V1-only generation has a first-class trace boundary.'));
  if (isolation.explorationFingerprint !== fingerprintCreativeValue(exploration ?? null)) findings.push(finding('blocker', 'dogfood-v1-isolation-exploration-drift', 'Condition A isolation evidence must bind the exact supplied Motion V1 exploration.'));
  if (isolation.truth.motionV1CreativeGeneration !== true || isolation.truth.aiStudioKnowledgeUsed || isolation.truth.aiStudioTransferUsed || isolation.truth.aiStudioSynthesisUsed || isolation.truth.aiStudioMotionV2Used) findings.push(finding('blocker', 'dogfood-v1-baseline-contaminated', 'Condition A must use Motion V1-only creative generation without Knowledge, Transfer, Synthesis or Motion V2 participation.'));
  return {
    sourceKind: 'motion-v1-exploration',
    sourceSnapshotFingerprint: sourceFingerprint,
    verifiedKnowledgeIds: [],
    synthesisCandidateCount: 0,
    isolationAttestationRequired: true,
    baselineIsolationCryptographicallyProven: false,
    findings,
    reviewReady: findings.every((item) => item.severity !== 'blocker')
  };
}

function reviewV1Trial(trial, source = {}) {
  const review = reviewV1Source(trial, source);
  const proof = reviewTemporalProofBinding(trial, source?.exploration ?? null, source);
  const findings = [...review.findings, ...proof.findings];
  if (text(trial?.sourceSnapshotFingerprint) !== review.sourceSnapshotFingerprint) findings.push(finding('blocker', 'dogfood-v1-source-binding-drift', 'Condition A trial source fingerprint must bind the exact supplied Motion V1 exploration and V1-only isolation evidence.'));
  return { ...review, proofEvidenceFingerprint: proof.proofEvidenceFingerprint, proofEvidenceRef: proof.proofEvidenceRef, findings, reviewReady: findings.every((item) => item.severity !== 'blocker') };
}

function reviewV2Source(trial, source = {}) {
  const findings = [];
  const reasoningSet = source?.reasoningSet ?? null;
  const handoff = source?.handoff ?? null;
  const authorityInputs = source?.authorityInputs ?? null;
  const setReview = reviewMotionIntelligenceV2Set(reasoningSet ?? {}, authorityInputs);
  const handoffReview = reviewMotionIntelligenceV2ExplorationHandoff(handoff ?? {}, { reasoningSet, authorityInputs });
  const exploration = handoff?.exploration ?? null;
  const conditionId = text(trial?.conditionId).toUpperCase();
  const actualKnowledgeIds = sorted(reasoningSet?.brief?.knowledgeBinding?.knowledgeIds);
  const expectedIds = expectedKnowledgeIds(conditionId);
  const synthesisBinding = reasoningSet?.brief?.synthesisBinding ?? null;
  const synthesisCandidates = Array.isArray(reasoningSet?.brief?.synthesisCandidates) ? reasoningSet.brief.synthesisCandidates : [];
  const sourceFingerprint = text(reasoningSet?.snapshotFingerprint);

  if (!setReview.reviewReady) findings.push(finding('blocker', 'dogfood-v2-reasoning-set-invalid', 'Conditions B/C/D require a freshly review-ready Motion V2 reasoning set with its original authority inputs.', { conditionId, findingCodes: setReview.findings?.map((item) => item.code) ?? [] }));
  if (!handoffReview.reviewReady || !exploration) findings.push(finding('blocker', 'dogfood-v2-handoff-invalid', 'Conditions B/C/D require the exact freshly reviewed V2→V1 exploration handoff used for temporal proof.', { conditionId, findingCodes: handoffReview.findings?.map((item) => item.code) ?? [] }));
  if (text(reasoningSet?.brief?.projectId) !== text(trial?.projectId)) findings.push(finding('blocker', 'dogfood-v2-project-drift', 'Motion V2 reasoning set must belong to the trial project.', { conditionId }));
  if (!sourceFingerprint) findings.push(finding('blocker', 'dogfood-v2-source-binding-missing', 'V2 source requires the exact public Motion V2 reasoning-set snapshot fingerprint.', { conditionId }));
  if (!sameValue(actualKnowledgeIds, expectedIds)) findings.push(finding('blocker', 'dogfood-v2-knowledge-profile-drift', 'Motion V2 trial must use the exact locked knowledge profile for its dogfood condition.', { conditionId, expectedKnowledgeIds: expectedIds, actualKnowledgeIds }));

  if (conditionId === 'D') {
    if (!synthesisBinding || Number(synthesisBinding?.candidateCount ?? 0) < 1 || synthesisCandidates.length < 1) findings.push(finding('blocker', 'dogfood-v2-synthesis-missing', 'Condition D requires verified non-empty Synthesis evidence consumed by Motion V2.'));
  } else if (synthesisBinding !== null || synthesisCandidates.length) {
    findings.push(finding('blocker', 'dogfood-v2-synthesis-contamination', 'Conditions B and C must not receive Synthesis evidence.', { conditionId }));
  }
  return {
    sourceKind: 'motion-v2-reasoning-set-v1-proof-handoff',
    sourceSnapshotFingerprint: sourceFingerprint,
    verifiedKnowledgeIds: actualKnowledgeIds,
    synthesisCandidateCount: Number(synthesisBinding?.candidateCount ?? 0),
    findings,
    reviewReady: findings.every((item) => item.severity !== 'blocker')
  };
}

function reviewV2Trial(trial, source = {}) {
  const review = reviewV2Source(trial, source);
  const proof = reviewTemporalProofBinding(trial, source?.handoff?.exploration ?? null, source);
  const findings = [...review.findings, ...proof.findings];
  if (text(trial?.sourceSnapshotFingerprint) !== review.sourceSnapshotFingerprint) findings.push(finding('blocker', 'dogfood-v2-source-binding-drift', 'V2 trial source fingerprint must bind the exact public Motion V2 reasoning-set snapshot.', { conditionId: text(trial?.conditionId).toUpperCase() }));
  return { ...review, proofEvidenceFingerprint: proof.proofEvidenceFingerprint, proofEvidenceRef: proof.proofEvidenceRef, findings, reviewReady: findings.every((item) => item.severity !== 'blocker') };
}

function normalizeDirectControlRequest(value = {}) {
  return {
    schema: text(value?.schema),
    projectId: text(value?.projectId),
    briefFingerprint: text(value?.briefFingerprint),
    isolationAttestedBy: text(value?.isolationAttestedBy),
    isolationEvidenceRef: text(value?.isolationEvidenceRef),
    truth: {
      directModelCreativeGeneration: value?.truth?.directModelCreativeGeneration === true,
      aiStudioKnowledgeUsed: value?.truth?.aiStudioKnowledgeUsed === true,
      aiStudioTransferUsed: value?.truth?.aiStudioTransferUsed === true,
      aiStudioSynthesisUsed: value?.truth?.aiStudioSynthesisUsed === true,
      aiStudioMotionV2Used: value?.truth?.aiStudioMotionV2Used === true
    }
  };
}

function reviewDirectControlPreProofSource(trial, source = {}) {
  const findings = [];
  const request = normalizeDirectControlRequest(source?.directControlRequest ?? {});
  const sourceFingerprint = fingerprintCreativeValue(request);
  if (request.schema !== 'ai-studio-os/direct-model-motion-control-request@1') findings.push(finding('blocker', 'dogfood-direct-control-request-schema-invalid', 'Condition E pre-proof execution requires the canonical direct-model request contract.'));
  if (request.projectId !== text(trial?.projectId) || request.briefFingerprint !== text(trial?.briefFingerprint)) findings.push(finding('blocker', 'dogfood-direct-control-request-context-drift', 'Condition E request must bind the exact experiment project and frozen brief.'));
  if (!request.isolationAttestedBy || !request.isolationEvidenceRef) findings.push(finding('blocker', 'dogfood-direct-control-isolation-attestation-missing', 'Condition E requires explicit operator isolation attestation until a first-class isolated direct-model runner exists.'));
  if (request.truth.directModelCreativeGeneration !== true || request.truth.aiStudioKnowledgeUsed || request.truth.aiStudioTransferUsed || request.truth.aiStudioSynthesisUsed || request.truth.aiStudioMotionV2Used) findings.push(finding('blocker', 'dogfood-direct-control-contaminated', 'Condition E pre-proof source must bypass AI Studio creative reasoning layers.'));
  return { sourceKind: 'direct-model-pre-proof-request', sourceSnapshotFingerprint: sourceFingerprint, verifiedKnowledgeIds: [], synthesisCandidateCount: 0, isolationAttestationRequired: true, independentControlIsolationProven: false, findings, reviewReady: findings.every((item) => item.severity !== 'blocker') };
}

function reviewExecutedDirectControlSource(trial, source = {}) {
  const findings = [];
  const control = normalizeControl(source?.directControl ?? {});
  const exploration = source?.exploration ?? null;
  const explorationFingerprint = fingerprintCreativeValue(exploration ?? null);
  const explorationReview = reviewMotionCreativeExploration(exploration ?? {});
  if (control.schema !== 'ai-studio-os/direct-model-motion-control@1') findings.push(finding('blocker', 'dogfood-executed-direct-control-schema-invalid', 'Executed Condition E evidence requires the canonical direct-model control record.'));
  if (control.projectId !== text(trial?.projectId) || control.briefFingerprint !== text(trial?.briefFingerprint)) findings.push(finding('blocker', 'dogfood-executed-direct-control-context-drift', 'Executed Condition E evidence must bind the exact project and frozen brief.'));
  const budget = trial?.generationBudget ?? {};
  if (control.modelPolicyId !== text(budget?.modelPolicyId) || control.temperaturePolicyId !== text(budget?.temperaturePolicyId) || control.maxGenerationAttempts !== budget?.maxGenerationAttempts || control.tokenBudget !== budget?.tokenBudget || control.wallClockSeconds !== budget?.wallClockSeconds) findings.push(finding('blocker', 'dogfood-executed-direct-control-budget-drift', 'Executed Condition E evidence must retain the exact frozen generation controls.'));
  if (!control.requestFingerprint || !control.responseFingerprint || !control.runtimeTraceRef || control.explorationFingerprint !== explorationFingerprint) findings.push(finding('blocker', 'dogfood-executed-direct-control-evidence-drift', 'Executed Condition E evidence requires exact request, response, trace and exploration bindings.'));
  if (control.runtimeTraceRef !== text(trial?.runtimeTraceRef)) findings.push(finding('blocker', 'dogfood-executed-direct-control-runtime-drift', 'Executed Condition E evidence must bind the exact trial runtime trace.'));
  if (!explorationReview.reviewReady || text(exploration?.projectId) !== text(trial?.projectId)) findings.push(finding('blocker', 'dogfood-executed-direct-control-exploration-invalid', 'Executed Condition E output must be a fresh V1-valid exploration.'));
  if (!control.isolationAttestedBy || !control.isolationEvidenceRef || control.truth.directModelCreativeGeneration !== true || control.truth.aiStudioKnowledgeUsed || control.truth.aiStudioTransferUsed || control.truth.aiStudioSynthesisUsed || control.truth.aiStudioMotionV2Used || control.truth.v1ContractValidationAndProofOnly !== true) findings.push(finding('blocker', 'dogfood-executed-direct-control-isolation-invalid', 'Executed Condition E must preserve direct-model isolation and V1-validation-only truth.'));
  return { sourceKind: 'executed-direct-model-v1-exploration', sourceSnapshotFingerprint: fingerprintCreativeValue({ directControl: control, exploration }), verifiedKnowledgeIds: [], synthesisCandidateCount: 0, isolationAttestationRequired: true, independentControlIsolationProven: false, findings, reviewReady: findings.every((item) => item.severity !== 'blocker') };
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

function selectedWorld(authority = {}) {
  return authority?.selectedCreativeWorld ?? authority?.creativeWorldExploration?.selectedWorld ?? null;
}

function sharedWorldReview({ trial = {}, selectedCreativeWorld: expectedWorld = null, canonicalCreativeAuthority = null, source = {} } = {}) {
  const findings = [];
  const expectedFingerprint = fingerprintCreativeValue(expectedWorld ?? null);
  const expectedRef = text(expectedWorld?.id);
  const authorityWorld = selectedWorld(canonicalCreativeAuthority ?? {});
  const sourceWorld = text(trial?.conditionId).toUpperCase() === 'A'
    ? selectedWorld(source?.exploration?.authorityInputs?.canonicalCreativeAuthority)
    : ['B', 'C', 'D'].includes(text(trial?.conditionId).toUpperCase())
      ? selectedWorld(source?.authorityInputs?.canonicalCreativeAuthority)
      : null;
  if (!expectedWorld || !expectedRef || !canonicalCreativeAuthority) findings.push(finding('blocker', 'dogfood-generation-source-shared-world-missing', 'Formal execution requires the exact selected Creative World and its canonical authority bundle.'));
  if (!sameValue(authorityWorld, expectedWorld)) findings.push(finding('blocker', 'dogfood-generation-source-canonical-world-drift', 'The canonical Creative World authority must contain the exact frozen selected Creative World object.'));
  if (sourceWorld && !sameValue(sourceWorld, expectedWorld)) findings.push(finding('blocker', 'dogfood-generation-source-world-drift', 'Condition source artifacts must embed the exact frozen selected Creative World content, not only the same ID or reference.'));
  return { selectedCreativeWorldFingerprint: expectedFingerprint, selectedCreativeWorldRef: expectedRef, findings, reviewReady: findings.every((item) => item.severity !== 'blocker') };
}

export function buildCreativeMotionDogfoodGenerationSource({ trial = {}, brief = {}, source = {}, selectedCreativeWorld = null, canonicalCreativeAuthority = null } = {}) {
  const conditionId = text(trial?.conditionId).toUpperCase();
  let review;
  let payload;
  if (conditionId === 'A') { review = reviewV1Source(trial, source); payload = { exploration: source?.exploration ?? null, v1Isolation: source?.v1Isolation ?? null }; }
  else if (['B', 'C', 'D'].includes(conditionId)) { review = reviewV2Source(trial, source); payload = { reasoningSet: source?.reasoningSet ?? null, handoff: source?.handoff ?? null, authorityInputs: source?.authorityInputs ?? null }; }
  else if (conditionId === 'E' && source?.directControl) { review = reviewExecutedDirectControlSource(trial, source); payload = { directControl: source?.directControl ?? null, exploration: source?.exploration ?? null }; }
  else if (conditionId === 'E') { review = reviewDirectControlPreProofSource(trial, source); payload = { directControlRequest: source?.directControlRequest ?? null }; }
  else review = { sourceKind: '', sourceSnapshotFingerprint: '', findings: [finding('blocker', 'dogfood-execution-condition-invalid', 'Generation source encountered an unsupported dogfood condition.', { conditionId })], reviewReady: false }, payload = {};
  const briefFingerprint = fingerprintCreativeValue(brief ?? {});
  const world = sharedWorldReview({ trial, selectedCreativeWorld, canonicalCreativeAuthority, source });
  const findings = [...review.findings, ...world.findings];
  if (briefFingerprint !== text(trial?.briefFingerprint)) findings.push(finding('blocker', 'dogfood-generation-source-brief-drift', 'Generation source must receive the exact frozen brief bound to the trial.'));
  const executedDirect = conditionId === 'E' && source?.directControl;
  const executionMode = conditionId === 'E' ? executedDirect ? 'executed-direct-model-output' : 'direct-model-generation' : 'architecture-output';
  const conditionArtifact = conditionId === 'A' ? source?.exploration ?? null : ['B', 'C', 'D'].includes(conditionId) ? source?.handoff?.exploration ?? null : executedDirect ? source?.exploration ?? null : null;
  const instruction = conditionId === 'E' && !executedDirect ? JSON.stringify(canonicalize({ schema: 'ai-studio-os/creative-motion-dogfood-direct-model-task@2', projectId: text(trial?.projectId), brief, briefFingerprint, selectedCreativeWorld, selectedCreativeWorldRef: world.selectedCreativeWorldRef, selectedCreativeWorldFingerprint: world.selectedCreativeWorldFingerprint, output: { schema: 'ai-studio-os/motion-hypotheses@1', minimumHypotheses: 3, v1ValidationRequired: true }, directControlRequest: payload.directControlRequest })) : '';
  return { schema: 'ai-studio-os/creative-motion-dogfood-generation-source@2', conditionId, sourceKind: review.sourceKind, executionMode, sourceSnapshotFingerprint: review.sourceSnapshotFingerprint, selectedCreativeWorldFingerprint: world.selectedCreativeWorldFingerprint, conditionArtifact, directControl: executedDirect ? source?.directControl ?? null : null, generationInstruction: instruction, generationInstructionFingerprint: instruction ? fingerprintCreativeValue(instruction) : '', findings, reviewReady: findings.every((item) => item.severity !== 'blocker'), truth: { sourceFreshlyReviewed: true, operatorIsolationAttestationUsedOnlyWhereExistingArchitectureRequiresIt: review.isolationAttestationRequired === true, reviewReady: false, capabilityEvidenceReady: false, productionApproved: false } };
}

export function buildCreativeMotionDogfoodDirectControlExploration({ projectId, canonicalCreativeAuthority, selectedCreativeWorld, generatedDraft } = {}) {
  const findings = [];
  if (!sameValue(selectedWorld(canonicalCreativeAuthority ?? {}), selectedCreativeWorld ?? null)) findings.push(finding('blocker', 'dogfood-direct-output-world-drift', 'Direct-model output must be validated against the exact frozen Creative World authority.'));
  const exploration = buildMotionCreativeExploration({ projectId, canonicalCreativeAuthority, hypotheses: generatedDraft?.hypotheses });
  if (!exploration.reviewReady) findings.push(finding('blocker', 'dogfood-direct-output-hypotheses-invalid', 'Direct-model output must contain complete V1-valid Motion hypotheses; arbitrary JSON is not a produced trial.', { findingCodes: exploration.findings?.map((item) => item.code) ?? [] }));
  return { exploration, findings, produced: findings.every((item) => item.severity !== 'blocker'), truth: { reviewReady: false, capabilityEvidenceReady: false, productionApproved: false } };
}

function reviewDirectControlTrial(trial, source = {}) {
  const findings = [];
  const control = normalizeControl(source?.directControl ?? {});
  const exploration = source?.exploration ?? null;
  const explorationReview = reviewMotionCreativeExploration(exploration ?? {});
  const explorationFingerprint = exploration ? fingerprintCreativeValue(exploration) : '';
  const sourceFingerprint = directControlFingerprint(control);
  const budget = trial?.generationBudget ?? {};
  const proof = reviewTemporalProofBinding(trial, exploration, source);

  if (control.schema !== 'ai-studio-os/direct-model-motion-control@1') findings.push(finding('blocker', 'dogfood-direct-control-schema-invalid', 'Condition E requires the direct-model control evidence contract.'));
  if (control.projectId !== text(trial?.projectId) || control.briefFingerprint !== text(trial?.briefFingerprint)) findings.push(finding('blocker', 'dogfood-direct-control-context-drift', 'Direct-model control must bind the same project and brief snapshot as the trial.'));
  if (control.modelPolicyId !== text(budget?.modelPolicyId) || control.temperaturePolicyId !== text(budget?.temperaturePolicyId) || control.maxGenerationAttempts !== budget?.maxGenerationAttempts || control.tokenBudget !== budget?.tokenBudget || control.wallClockSeconds !== budget?.wallClockSeconds) findings.push(finding('blocker', 'dogfood-direct-control-budget-drift', 'Direct-model control must use the same declared model/sampling/generation/time budget as the experiment.'));
  if (!control.requestFingerprint || !control.responseFingerprint || !control.runtimeTraceRef || !control.explorationFingerprint) findings.push(finding('blocker', 'dogfood-direct-control-evidence-missing', 'Direct-model control requires request, response, runtime-trace and resulting exploration fingerprints.'));
  if (control.runtimeTraceRef !== text(trial?.runtimeTraceRef)) findings.push(finding('blocker', 'dogfood-direct-control-runtime-drift', 'Direct-model control runtime trace must match the trial trace binding.'));
  if (!explorationReview.reviewReady) findings.push(finding('blocker', 'dogfood-direct-control-exploration-invalid', 'Direct-model hypotheses must still satisfy the shared V1 Motion exploration contract before rendering.', { findingCodes: explorationReview.findings?.map((item) => item.code) ?? [] }));
  if (text(exploration?.projectId) !== text(trial?.projectId) || control.explorationFingerprint !== explorationFingerprint) findings.push(finding('blocker', 'dogfood-direct-control-exploration-drift', 'Direct-model control must bind the exact V1-shaped exploration produced from the model response.'));
  if (!control.isolationAttestedBy || !control.isolationEvidenceRef) findings.push(finding('blocker', 'dogfood-direct-control-isolation-attestation-missing', 'Until a first-class isolated direct-model runner exists, Condition E requires explicit operator isolation attestation and evidence.'));
  if (control.truth.directModelCreativeGeneration !== true || control.truth.aiStudioKnowledgeUsed || control.truth.aiStudioTransferUsed || control.truth.aiStudioSynthesisUsed || control.truth.aiStudioMotionV2Used || control.truth.v1ContractValidationAndProofOnly !== true) findings.push(finding('blocker', 'dogfood-direct-control-contaminated', 'Condition E must bypass AI Studio creative reasoning layers while allowing only shared V1 contract validation and temporal proof after direct-model hypothesis generation.'));
  if (text(trial?.sourceSnapshotFingerprint) !== sourceFingerprint) findings.push(finding('blocker', 'dogfood-direct-control-source-binding-drift', 'Condition E trial source fingerprint must bind the exact direct-model request/response/isolation evidence object.'));
  findings.push(...proof.findings);

  return {
    sourceKind: 'direct-model-generation-v1-validation-proof',
    sourceSnapshotFingerprint: sourceFingerprint,
    proofEvidenceFingerprint: proof.proofEvidenceFingerprint,
    proofEvidenceRef: proof.proofEvidenceRef,
    verifiedKnowledgeIds: [],
    synthesisCandidateCount: 0,
    isolationAttestationRequired: true,
    independentControlIsolationProven: false,
    findings,
    reviewReady: findings.every((item) => item.severity !== 'blocker')
  };
}

function canonicalReceiptTruth(value = {}) {
  return {
    conditionExecutionFreshlyReviewedWhereSupported: true,
    sameTemporalProofAuthorityUsedAcrossConditions: true,
    declaredControlParity: value?.declaredControlParity === true,
    verifiedRuntimeControlParity: value?.verifiedRuntimeControlParity === true,
    baselineV1IsolationUsesOperatorAttestation: true,
    baselineV1IsolationCryptographicallyProven: false,
    directModelIsolationUsesOperatorAttestation: true,
    directModelIsolationCryptographicallyProven: false,
    directModelUsesV1ValidationAndProofOnlyAfterGeneration: true,
    identicalOutputsAcrossIndependentReplicatesAllowed: true,
    receiptIsNotCreativeQuality: true,
    receiptIsNotWinnerSelection: true,
    productionApproved: false
  };
}

function normalizedReceiptTrials(value = {}) {
  return Array.isArray(value?.trials) ? value.trials.map((item) => ({
    trialId: text(item?.trialId),
    conditionId: text(item?.conditionId),
    sourceKind: text(item?.sourceKind),
    sourceSnapshotFingerprint: text(item?.sourceSnapshotFingerprint),
    proofEvidenceFingerprint: text(item?.proofEvidenceFingerprint),
    proofEvidenceRef: text(item?.proofEvidenceRef),
    verifiedKnowledgeIds: sorted(item?.verifiedKnowledgeIds),
    synthesisCandidateCount: Number(item?.synthesisCandidateCount ?? 0),
    isolationAttestationRequired: item?.isolationAttestationRequired === true,
    baselineIsolationCryptographicallyProven: item?.baselineIsolationCryptographicallyProven === true,
    independentControlIsolationProven: item?.independentControlIsolationProven === true,
    runtimeTraceRef: text(item?.runtimeTraceRef),
    runtimeTraceFingerprint: text(item?.runtimeTraceFingerprint),
    runtimeEvidenceRef: text(item?.runtimeEvidenceRef),
    verifiedRuntimeControl: item?.verifiedRuntimeControl === true,
    reviewReady: item?.reviewReady === true
  })) : [];
}

function receiptFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-motion-dogfood-execution-receipt@1',
    stage: 'creative-motion-dogfood-execution-verification',
    experimentId: text(value?.experimentId),
    experimentSnapshotFingerprint: text(value?.experimentSnapshotFingerprint),
    trials: normalizedReceiptTrials(value),
    truth: canonicalReceiptTruth(value?.truth)
  });
}

export function buildCreativeMotionDogfoodExecutionReceipt(experiment = {}, { trialSources = {} } = {}) {
  const findings = [];
  const trials = [];
  const experimentTrials = Array.isArray(experiment?.trials) ? experiment.trials : [];

  for (const trial of experimentTrials) {
    const trialId = text(trial?.trialId);
    const conditionId = text(trial?.conditionId).toUpperCase();
    const source = trialSources?.[trialId] ?? {};
    let review;
    if (conditionId === 'A') review = reviewV1Trial(trial, source);
    else if (['B', 'C', 'D'].includes(conditionId)) review = reviewV2Trial(trial, source);
    else if (conditionId === 'E') review = reviewDirectControlTrial(trial, source);
    else review = { sourceKind: '', sourceSnapshotFingerprint: '', proofEvidenceFingerprint: '', proofEvidenceRef: '', verifiedKnowledgeIds: [], synthesisCandidateCount: 0, findings: [finding('blocker', 'dogfood-execution-condition-invalid', 'Execution receipt encountered an unsupported condition.', { trialId, conditionId })], reviewReady: false };

    const runtimeControl = reviewRuntimeControlBinding(trial, source);
    const trialFindings = [...review.findings, ...runtimeControl.findings];
    const trialFindingCodes = trialFindings.map((item) => item.code);
    for (const item of trialFindings) findings.push({ ...item, evidence: { ...(item.evidence ?? {}), trialId, conditionId } });
    trials.push({
      trialId,
      conditionId,
      sourceKind: review.sourceKind,
      sourceSnapshotFingerprint: review.sourceSnapshotFingerprint,
      proofEvidenceFingerprint: review.proofEvidenceFingerprint,
      proofEvidenceRef: review.proofEvidenceRef,
      verifiedKnowledgeIds: review.verifiedKnowledgeIds,
      synthesisCandidateCount: review.synthesisCandidateCount,
      isolationAttestationRequired: review.isolationAttestationRequired === true,
      baselineIsolationCryptographicallyProven: review.baselineIsolationCryptographicallyProven === true,
      independentControlIsolationProven: review.independentControlIsolationProven === true,
      runtimeTraceRef: runtimeControl.runtimeTraceRef,
      runtimeTraceFingerprint: runtimeControl.runtimeTraceFingerprint,
      runtimeEvidenceRef: runtimeControl.runtimeEvidenceRef,
      verifiedRuntimeControl: runtimeControl.verifiedRuntimeControl,
      findingCodes: trialFindingCodes,
      reviewReady: review.reviewReady === true && runtimeControl.verifiedRuntimeControl
    });
  }

  if (trials.length !== 15 || trials.some((item) => !item.reviewReady)) findings.push(finding('blocker', 'dogfood-execution-coverage-incomplete', 'All 15 dogfood trials must have condition-appropriate source and real temporal-proof verification before capability interpretation.'));

  const declaredControlParity = experimentTrials.length === 15 && experimentTrials.every((trial) => fingerprintCreativeValue(trial?.generationBudget ?? {}) === fingerprintCreativeValue(experimentTrials[0]?.generationBudget ?? {}));
  const verifiedRuntimeControlParity = trials.length === 15 && trials.every((trial) => trial.verifiedRuntimeControl === true);
  const receipt = {
    schema: 'ai-studio-os/creative-motion-dogfood-execution-receipt@1',
    stage: 'creative-motion-dogfood-execution-verification',
    experimentId: text(experiment?.experimentId),
    experimentSnapshotFingerprint: text(experiment?.snapshotFingerprint),
    trials,
    truth: canonicalReceiptTruth({ declaredControlParity, verifiedRuntimeControlParity })
  };
  receipt.snapshotFingerprint = receiptFingerprint(receipt);
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    ...receipt,
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-for-blind-capability-review'
  };
}

export function reviewCreativeMotionDogfoodExecutionReceipt(receipt = {}, experiment = {}, { trialSources = {} } = {}) {
  const expected = buildCreativeMotionDogfoodExecutionReceipt(experiment, { trialSources });
  const findings = [];
  if (receipt?.schema !== 'ai-studio-os/creative-motion-dogfood-execution-receipt@1') findings.push(finding('blocker', 'dogfood-execution-receipt-schema-invalid', 'Execution receipt requires the canonical V1 schema.'));
  if (receipt?.stage !== 'creative-motion-dogfood-execution-verification') findings.push(finding('blocker', 'dogfood-execution-receipt-stage-invalid', 'Execution receipt requires the canonical execution-verification stage.'));
  if (text(receipt?.experimentId) !== text(expected.experimentId) || text(receipt?.experimentSnapshotFingerprint) !== text(expected.experimentSnapshotFingerprint)) findings.push(finding('blocker', 'dogfood-execution-receipt-experiment-drift', 'Execution receipt must bind the exact current dogfood experiment snapshot.'));
  if (!sameValue(normalizedReceiptTrials(receipt), normalizedReceiptTrials(expected)) || !sameValue(receipt?.truth ?? {}, expected.truth ?? {}) || text(receipt?.snapshotFingerprint) !== text(expected.snapshotFingerprint)) findings.push(finding('blocker', 'dogfood-execution-receipt-drift', 'Execution receipt must exactly match fresh condition-specific source/proof review and the fixed non-authoritative truth boundary.'));
  if (!expected.reviewReady) findings.push(finding('blocker', 'dogfood-execution-source-review-blocked', 'Fresh execution-source or rendered-proof review is not ready.', { findingCodes: expected.findings.map((item) => item.code) }));
  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-motion-dogfood-execution-receipt-review@1',
    findings,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'ready-for-blind-capability-review',
    computedFingerprint: expected.snapshotFingerprint,
    truth: {
      callerConditionLabelsInsufficient: true,
      freshSourceReviewRequired: true,
      freshTemporalProofReviewRequired: true,
      directModelIsolationUsesOperatorAttestation: true,
      directModelSharesV1ValidationAndProofHarness: true,
      identicalOutputsAcrossIndependentReplicatesAllowed: true,
      productionApproved: false
    }
  };
}

export function dogfoodTrialFor(experiment = {}, trialId = '') {
  return trialById(experiment, trialId);
}

export const DOGFOOD_FULL_MOTION_KNOWLEDGE_IDS = FULL_MOTION_KNOWLEDGE_IDS;
