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
    renderEvidenceRef: 'evidence://direct-control/render/e-1',
    renderEvidenceFingerprint: 'v'.repeat(64),
    isolationAttestedBy: 'operator-01',
    isolationEvidenceRef: 'evidence://direct-control/isolation/e-1',
    truth: {
      directModelControl: true,
      aiStudioMotionV1Used: false,
      aiStudioMotionV2Used: false,
      aiStudioSynthesisUsed: false,
      renderEvidenceIndependentlyVerified: true
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

test('direct-model control requires an isolated request/response and independently verified rendered-evidence envelope', () => {
  const control = directControl();
  const trial = {
    trialId: 'trial-e-1',
    conditionId: 'E',
    projectId: control.projectId,
    briefFingerprint: control.briefFingerprint,
    generationBudget: budget(),
    evidenceBundleRef: control.renderEvidenceRef,
    runtimeTraceRef: control.runtimeTraceRef,
    sourceSnapshotFingerprint: fingerprintCreativeValue(control)
  };
  const receipt = buildCreativeMotionDogfoodExecutionReceipt(experimentWithTrial(trial), {
    trialSources: { 'trial-e-1': { directControl: control } }
  });
  assert.equal(receipt.trials[0].reviewReady, true);
  assert.equal(receipt.trials[0].sourceKind, 'operator-attested-direct-model-control');
  assert.equal(receipt.trials[0].proofEvidenceRef, control.renderEvidenceRef);
  assert.equal(receipt.trials[0].independentControlIsolationProven, false);
  assert.equal(receipt.reviewReady, false, 'single-trial probe must not qualify as a complete 15-trial experiment');
});

test('direct-model control is blocked if AI Studio Motion or Synthesis was used', () => {
  const control = directControl({
    truth: {
      directModelControl: true,
      aiStudioMotionV1Used: false,
      aiStudioMotionV2Used: true,
      aiStudioSynthesisUsed: false,
      renderEvidenceIndependentlyVerified: true
    }
  });
  const trial = {
    trialId: 'trial-e-1',
    conditionId: 'E',
    projectId: control.projectId,
    briefFingerprint: control.briefFingerprint,
    generationBudget: budget(),
    evidenceBundleRef: control.renderEvidenceRef,
    runtimeTraceRef: control.runtimeTraceRef,
    sourceSnapshotFingerprint: fingerprintCreativeValue(control)
  };
  const receipt = buildCreativeMotionDogfoodExecutionReceipt(experimentWithTrial(trial), {
    trialSources: { 'trial-e-1': { directControl: control } }
  });
  assert.equal(receipt.trials[0].reviewReady, false);
  assert.ok(receipt.findings.some((item) => item.code === 'dogfood-direct-control-contaminated'));
});

test('direct-model control cannot enter review without independently verified rendered comparison evidence', () => {
  const control = directControl({
    truth: {
      directModelControl: true,
      aiStudioMotionV1Used: false,
      aiStudioMotionV2Used: false,
      aiStudioSynthesisUsed: false,
      renderEvidenceIndependentlyVerified: false
    }
  });
  const trial = {
    trialId: 'trial-e-1',
    conditionId: 'E',
    projectId: control.projectId,
    briefFingerprint: control.briefFingerprint,
    generationBudget: budget(),
    evidenceBundleRef: control.renderEvidenceRef,
    runtimeTraceRef: control.runtimeTraceRef,
    sourceSnapshotFingerprint: fingerprintCreativeValue(control)
  };
  const receipt = buildCreativeMotionDogfoodExecutionReceipt(experimentWithTrial(trial), {
    trialSources: { 'trial-e-1': { directControl: control } }
  });
  assert.equal(receipt.trials[0].reviewReady, false);
  assert.ok(receipt.findings.some((item) => item.code === 'dogfood-direct-control-render-unverified'));
});
