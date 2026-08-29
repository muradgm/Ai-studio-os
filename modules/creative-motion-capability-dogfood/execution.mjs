import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { reviewMotionCreativeExploration } from '../motion-creative-intelligence/runtime.mjs';
import { reviewMotionIntelligenceV2Set } from '../motion-intelligence-v2/runtime.mjs';
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
    isolationAttestedBy: text(value?.isolationAttestedBy),
    isolationEvidenceRef: text(value?.isolationEvidenceRef),
    truth: {
      directModelControl: value?.truth?.directModelControl === true,
      aiStudioMotionV1Used: value?.truth?.aiStudioMotionV1Used === true,
      aiStudioMotionV2Used: value?.truth?.aiStudioMotionV2Used === true,
      aiStudioSynthesisUsed: value?.truth?.aiStudioSynthesisUsed === true
    }
  };
}

function directControlFingerprint(control = {}) {
  return fingerprintCreativeValue(normalizeControl(control));
}

function trialById(experiment = {}, trialId = '') {
  return (Array.isArray(experiment?.trials) ? experiment.trials : []).find((item) => text(item?.trialId) === text(trialId)) ?? null;
}

function expectedKnowledgeIds(conditionId) {
  if (conditionId === 'B') return CORE_MOTION_KNOWLEDGE_IDS;
  if (conditionId === 'C' || conditionId === 'D') return FULL_MOTION_KNOWLEDGE_IDS;
  return [];
}

function reviewV1Trial(trial, source = {}) {
  const findings = [];
  const exploration = source?.exploration ?? null;
  const review = reviewMotionCreativeExploration(exploration ?? {});
  const sourceFingerprint = exploration ? fingerprintCreativeValue(exploration) : '';

  if (!review.reviewReady) findings.push(finding('blocker', 'dogfood-v1-exploration-invalid', 'Condition A requires a freshly review-ready Motion V1 exploration.', { findingCodes: review.findings?.map((item) => item.code) ?? [] }));
  if (text(exploration?.projectId) !== text(trial?.projectId)) findings.push(finding('blocker', 'dogfood-v1-project-drift', 'Condition A exploration must belong to the trial project.'));
  if (text(trial?.sourceSnapshotFingerprint) !== sourceFingerprint) findings.push(finding('blocker', 'dogfood-v1-source-binding-drift', 'Condition A trial source fingerprint must bind the exact supplied Motion V1 exploration.'));

  return {
    sourceKind: 'motion-v1-exploration',
    sourceSnapshotFingerprint: sourceFingerprint,
    verifiedKnowledgeIds: [],
    synthesisCandidateCount: 0,
    findings,
    reviewReady: findings.every((item) => item.severity !== 'blocker')
  };
}

function reviewV2Trial(trial, source = {}) {
  const findings = [];
  const reasoningSet = source?.reasoningSet ?? null;
  const authorityInputs = source?.authorityInputs ?? null;
  const review = reviewMotionIntelligenceV2Set(reasoningSet ?? {}, authorityInputs);
  const conditionId = text(trial?.conditionId).toUpperCase();
  const actualKnowledgeIds = sorted(reasoningSet?.brief?.knowledgeBinding?.knowledgeIds);
  const expectedIds = expectedKnowledgeIds(conditionId);
  const synthesisBinding = reasoningSet?.brief?.synthesisBinding ?? null;
  const synthesisCandidates = Array.isArray(reasoningSet?.brief?.synthesisCandidates) ? reasoningSet.brief.synthesisCandidates : [];
  const sourceFingerprint = text(reasoningSet?.snapshotFingerprint);

  if (!review.reviewReady) findings.push(finding('blocker', 'dogfood-v2-reasoning-set-invalid', 'Conditions B/C/D require a freshly review-ready Motion V2 reasoning set with its original authority inputs.', { conditionId, findingCodes: review.findings?.map((item) => item.code) ?? [] }));
  if (text(reasoningSet?.brief?.projectId) !== text(trial?.projectId)) findings.push(finding('blocker', 'dogfood-v2-project-drift', 'Motion V2 reasoning set must belong to the trial project.', { conditionId }));
  if (!sourceFingerprint || text(trial?.sourceSnapshotFingerprint) !== sourceFingerprint) findings.push(finding('blocker', 'dogfood-v2-source-binding-drift', 'V2 trial source fingerprint must bind the exact public Motion V2 reasoning-set snapshot.', { conditionId }));
  if (!sameValue(actualKnowledgeIds, expectedIds)) findings.push(finding('blocker', 'dogfood-v2-knowledge-profile-drift', 'Motion V2 trial must use the exact locked knowledge profile for its dogfood condition.', { conditionId, expectedKnowledgeIds: expectedIds, actualKnowledgeIds }));

  if (conditionId === 'D') {
    if (!synthesisBinding || Number(synthesisBinding?.candidateCount ?? 0) < 1 || synthesisCandidates.length < 1) findings.push(finding('blocker', 'dogfood-v2-synthesis-missing', 'Condition D requires verified non-empty Synthesis evidence consumed by Motion V2.'));
  } else if (synthesisBinding !== null || synthesisCandidates.length) {
    findings.push(finding('blocker', 'dogfood-v2-synthesis-contamination', 'Conditions B and C must not receive Synthesis evidence.', { conditionId }));
  }

  return {
    sourceKind: 'motion-v2-reasoning-set',
    sourceSnapshotFingerprint: sourceFingerprint,
    verifiedKnowledgeIds: actualKnowledgeIds,
    synthesisCandidateCount: Number(synthesisBinding?.candidateCount ?? 0),
    findings,
    reviewReady: findings.every((item) => item.severity !== 'blocker')
  };
}

function reviewDirectControlTrial(trial, source = {}) {
  const findings = [];
  const control = normalizeControl(source?.directControl ?? {});
  const sourceFingerprint = directControlFingerprint(control);
  const budget = trial?.generationBudget ?? {};

  if (control.schema !== 'ai-studio-os/direct-model-motion-control@1') findings.push(finding('blocker', 'dogfood-direct-control-schema-invalid', 'Condition E requires the direct-model control evidence contract.'));
  if (control.projectId !== text(trial?.projectId) || control.briefFingerprint !== text(trial?.briefFingerprint)) findings.push(finding('blocker', 'dogfood-direct-control-context-drift', 'Direct-model control must bind the same project and brief snapshot as the trial.'));
  if (control.modelPolicyId !== text(budget?.modelPolicyId) || control.temperaturePolicyId !== text(budget?.temperaturePolicyId) || control.maxGenerationAttempts !== budget?.maxGenerationAttempts || control.tokenBudget !== budget?.tokenBudget || control.wallClockSeconds !== budget?.wallClockSeconds) findings.push(finding('blocker', 'dogfood-direct-control-budget-drift', 'Direct-model control must use the same declared model/sampling/generation/time budget as the experiment.'));
  if (!control.requestFingerprint || !control.responseFingerprint || !control.runtimeTraceRef) findings.push(finding('blocker', 'dogfood-direct-control-evidence-missing', 'Direct-model control requires request, response and runtime-trace evidence.'));
  if (control.runtimeTraceRef !== text(trial?.runtimeTraceRef)) findings.push(finding('blocker', 'dogfood-direct-control-runtime-drift', 'Direct-model control runtime trace must match the trial trace binding.'));
  if (!control.isolationAttestedBy || !control.isolationEvidenceRef) findings.push(finding('blocker', 'dogfood-direct-control-isolation-attestation-missing', 'Until a first-class direct-model runner exists, Condition E requires explicit operator isolation attestation and evidence.'));
  if (control.truth.directModelControl !== true || control.truth.aiStudioMotionV1Used || control.truth.aiStudioMotionV2Used || control.truth.aiStudioSynthesisUsed) findings.push(finding('blocker', 'dogfood-direct-control-contaminated', 'Condition E must be recorded as an isolated direct-model attempt without AI Studio Motion/Synthesis reasoning.'));
  if (text(trial?.sourceSnapshotFingerprint) !== sourceFingerprint) findings.push(finding('blocker', 'dogfood-direct-control-source-binding-drift', 'Condition E trial source fingerprint must bind the exact direct-model control evidence object.'));

  return {
    sourceKind: 'operator-attested-direct-model-control',
    sourceSnapshotFingerprint: sourceFingerprint,
    verifiedKnowledgeIds: [],
    synthesisCandidateCount: 0,
    isolationAttestationRequired: true,
    independentControlIsolationProven: false,
    findings,
    reviewReady: findings.every((item) => item.severity !== 'blocker')
  };
}

function receiptFingerprint(value = {}) {
  return fingerprintCreativeValue({
    schema: 'ai-studio-os/creative-motion-dogfood-execution-receipt@1',
    experimentId: text(value?.experimentId),
    experimentSnapshotFingerprint: text(value?.experimentSnapshotFingerprint),
    trials: Array.isArray(value?.trials) ? value.trials.map((item) => ({
      trialId: text(item?.trialId),
      conditionId: text(item?.conditionId),
      sourceKind: text(item?.sourceKind),
      sourceSnapshotFingerprint: text(item?.sourceSnapshotFingerprint),
      verifiedKnowledgeIds: sorted(item?.verifiedKnowledgeIds),
      synthesisCandidateCount: Number(item?.synthesisCandidateCount ?? 0),
      isolationAttestationRequired: item?.isolationAttestationRequired === true,
      independentControlIsolationProven: item?.independentControlIsolationProven === true,
      reviewReady: item?.reviewReady === true
    })) : []
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
    else review = { sourceKind: '', sourceSnapshotFingerprint: '', verifiedKnowledgeIds: [], synthesisCandidateCount: 0, findings: [finding('blocker', 'dogfood-execution-condition-invalid', 'Execution receipt encountered an unsupported condition.', { trialId, conditionId })], reviewReady: false };

    const trialFindingCodes = review.findings.map((item) => item.code);
    for (const item of review.findings) findings.push({ ...item, evidence: { ...(item.evidence ?? {}), trialId, conditionId } });
    trials.push({
      trialId,
      conditionId,
      sourceKind: review.sourceKind,
      sourceSnapshotFingerprint: review.sourceSnapshotFingerprint,
      verifiedKnowledgeIds: review.verifiedKnowledgeIds,
      synthesisCandidateCount: review.synthesisCandidateCount,
      isolationAttestationRequired: review.isolationAttestationRequired === true,
      independentControlIsolationProven: review.independentControlIsolationProven === true,
      findingCodes: trialFindingCodes,
      reviewReady: review.reviewReady === true
    });
  }

  if (trials.length !== 15 || trials.some((item) => !item.reviewReady)) findings.push(finding('blocker', 'dogfood-execution-coverage-incomplete', 'All 15 dogfood trials must have condition-appropriate execution evidence before blinding.'));
  const fingerprints = trials.map((item) => item.sourceSnapshotFingerprint).filter(Boolean);
  if (fingerprints.length !== trials.length || new Set(fingerprints).size !== fingerprints.length) findings.push(finding('blocker', 'dogfood-execution-source-reused', 'Dogfood replicates must bind distinct source/reasoning snapshots; one execution cannot be aliased as multiple trials.'));

  const receipt = {
    schema: 'ai-studio-os/creative-motion-dogfood-execution-receipt@1',
    stage: 'creative-motion-dogfood-execution-verification',
    experimentId: text(experiment?.experimentId),
    experimentSnapshotFingerprint: text(experiment?.snapshotFingerprint),
    trials,
    truth: {
      conditionExecutionFreshlyReviewedWhereSupported: true,
      directModelIsolationUsesOperatorAttestation: true,
      directModelIsolationCryptographicallyProven: false,
      receiptIsNotCreativeQuality: true,
      receiptIsNotWinnerSelection: true,
      productionApproved: false
    }
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
  if (text(receipt?.experimentId) !== text(expected.experimentId) || text(receipt?.experimentSnapshotFingerprint) !== text(expected.experimentSnapshotFingerprint)) findings.push(finding('blocker', 'dogfood-execution-receipt-experiment-drift', 'Execution receipt must bind the exact current dogfood experiment snapshot.'));
  if (!sameValue(receipt?.trials ?? [], expected.trials) || text(receipt?.snapshotFingerprint) !== text(expected.snapshotFingerprint)) findings.push(finding('blocker', 'dogfood-execution-receipt-drift', 'Execution receipt must exactly match fresh condition-specific source review.'));
  if (!expected.reviewReady) findings.push(finding('blocker', 'dogfood-execution-source-review-blocked', 'Fresh execution-source review is not ready.', { findingCodes: expected.findings.map((item) => item.code) }));
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
      directModelIsolationUsesOperatorAttestation: true,
      productionApproved: false
    }
  };
}

export function dogfoodTrialFor(experiment = {}, trialId = '') {
  return trialById(experiment, trialId);
}

export const DOGFOOD_FULL_MOTION_KNOWLEDGE_IDS = FULL_MOTION_KNOWLEDGE_IDS;
