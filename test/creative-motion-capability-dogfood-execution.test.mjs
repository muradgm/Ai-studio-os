import test from 'node:test';
import assert from 'node:assert/strict';

import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { buildCreativeMotionDogfoodExecutionReceipt } from '../modules/creative-motion-capability-dogfood/execution.mjs';

function budget() {
  return {
    maxGenerationAttempts: 3,
    tokenBudget: 24000,
    wallClockSeconds: 900,
    modelPolicyId: 'dogfood-best-available-v1',
    temperaturePolicyId: 'dogfood-balanced-divergence-v1'
  };
}

function experimentWithTrial(trial) {
  return {
    schema: 'ai-studio-os/creative-motion-capability-dogfood@1',
    experimentId: 'execution-binding-probe',
    snapshotFingerprint: 'e'.repeat(64),
    trials: [trial]
  };
}

function directControl(overrides = {}) {
  return {
    schema: 'ai-studio-os/direct-model-motion-control@1',
    projectId: 'project-dogfood',
    briefFingerprint: 'b'.repeat(64),
    modelPolicyId: 'dogfood-best-available-v1',
    temperaturePolicyId: 'dogfood-balanced-divergence-v1',
    maxGenerationAttempts: 3,
    tokenBudget: 24000,
    wallClockSeconds: 900,
    requestFingerprint: 'r'.repeat(64),
    responseFingerprint: 'q'.repeat(64),
    runtimeTraceRef: 'trace://e-1',
    explorationFingerprint: 'x'.repeat(64),
    isolationAttestedBy: 'operator-01',
    isolationEvidenceRef: 'evidence://direct-control/isolation/e-1',
    truth: {
      directModelCreativeGeneration: true,
      aiStudioKnowledgeUsed: false,
      aiStudioTransferUsed: false,
      aiStudioSynthesisUsed: false,
      aiStudioMotionV2Used: false,
      v1ContractValidationAndProofOnly: true
    },
    ...overrides
  };
}

test('condition execution fails closed when a claimed V2 trial has no real reasoning set or temporal proof', () => {
  const trial = {
    trialId: 'trial-b-1',
    conditionId: 'B',
    projectId: 'project-dogfood',
    briefFingerprint: 'b'.repeat(64),
    generationBudget: budget(),
    evidenceBundleRef: 'evidence://b-1',
    temporalStudyCount: 15,
    realBrowserEvidence: true,
    mobileEvidence: true,
    reducedMotionEvidence: true,
    runtimeTraceRef: 'trace://b-1',
    sourceSnapshotFingerprint: 's'.repeat(64)
  };
  const receipt = buildCreativeMotionDogfoodExecutionReceipt(experimentWithTrial(trial), {
    trialSources: { 'trial-b-1': {} }
  });
  assert.equal(receipt.reviewReady, false);
  assert.ok(receipt.findings.some((item) => item.code === 'dogfood-v2-reasoning-set-invalid'));
  assert.ok(receipt.findings.some((item) => item.code === 'dogfood-temporal-proof-invalid'));
  assert.ok(receipt.findings.some((item) => item.code === 'dogfood-execution-coverage-incomplete'));
});

test('direct-model control cannot qualify from request-response attestation alone; it must share the real V1 temporal proof harness', () => {
  const control = directControl();
  const trial = {
    trialId: 'trial-e-1',
    conditionId: 'E',
    projectId: control.projectId,
    briefFingerprint: control.briefFingerprint,
    generationBudget: budget(),
    evidenceBundleRef: 'evidence://direct-control/proof/e-1',
    temporalStudyCount: 15,
    realBrowserEvidence: true,
    mobileEvidence: true,
    reducedMotionEvidence: true,
    runtimeTraceRef: control.runtimeTraceRef,
    sourceSnapshotFingerprint: fingerprintCreativeValue(control)
  };
  const receipt = buildCreativeMotionDogfoodExecutionReceipt(experimentWithTrial(trial), {
    trialSources: { 'trial-e-1': { directControl: control } }
  });
  assert.equal(receipt.trials[0].reviewReady, false);
  assert.equal(receipt.trials[0].sourceKind, 'direct-model-generation-v1-validation-proof');
  assert.equal(receipt.trials[0].independentControlIsolationProven, false);
  assert.ok(receipt.findings.some((item) => item.code === 'dogfood-direct-control-exploration-invalid'));
  assert.ok(receipt.findings.some((item) => item.code === 'dogfood-temporal-proof-invalid'));
});

test('direct-model control is blocked if AI Studio Motion V2 or upstream creative intelligence was used during generation', () => {
  const control = directControl({
    truth: {
      directModelCreativeGeneration: true,
      aiStudioKnowledgeUsed: false,
      aiStudioTransferUsed: false,
      aiStudioSynthesisUsed: false,
      aiStudioMotionV2Used: true,
      v1ContractValidationAndProofOnly: true
    }
  });
  const trial = {
    trialId: 'trial-e-1',
    conditionId: 'E',
    projectId: control.projectId,
    briefFingerprint: control.briefFingerprint,
    generationBudget: budget(),
    evidenceBundleRef: 'evidence://direct-control/proof/e-1',
    temporalStudyCount: 15,
    realBrowserEvidence: true,
    mobileEvidence: true,
    reducedMotionEvidence: true,
    runtimeTraceRef: control.runtimeTraceRef,
    sourceSnapshotFingerprint: fingerprintCreativeValue(control)
  };
  const receipt = buildCreativeMotionDogfoodExecutionReceipt(experimentWithTrial(trial), {
    trialSources: { 'trial-e-1': { directControl: control } }
  });
  assert.equal(receipt.trials[0].reviewReady, false);
  assert.ok(receipt.findings.some((item) => item.code === 'dogfood-direct-control-contaminated'));
});
