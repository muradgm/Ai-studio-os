import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { buildCreativeMotionDogfoodAuthoringPlan, buildCreativeMotionDogfoodAuthoringTask, executeCreativeMotionDogfoodAuthoringPlan } from '../modules/creative-motion-capability-dogfood/authoring-runner.mjs';
import { buildCreativeMotionDogfoodExecutionSchedule, executeCreativeMotionDogfoodPlan } from '../modules/creative-motion-capability-dogfood/execution-runner.mjs';
import { buildGeminiMotionDogfoodBudget } from '../modules/creative-motion-capability-dogfood/gemini-runner.mjs';
import { buildCanonicalMotionAuthorityFixture, buildMotionHypotheses } from '../fixtures/motion-creative-authority-fixture.mjs';
import { buildMotionDogfoodV2AuthoringContexts, buildMotionDogfoodV2Hypotheses } from '../fixtures/motion-v2-dogfood-authoring-fixture.mjs';

const canonical = buildCanonicalMotionAuthorityFixture('benchmark-011-authoring');
const projectId = canonical.projectId;
const frozenBrief = { projectId, title: 'After Matter', targetExperience: 'Material time remains readable.' };
const briefFingerprint = fingerprintCreativeValue(frozenBrief);
const model = 'gemini-3.5-flash-lite';
const modelIdentity = { schema: 'ai-studio-os/gemini-model-identity@1', requestedModel: model, providerModelName: 'models/' + model, providerBaseModelId: '', providerVersion: '3.5-flash-lite-07-2026', supportedGenerationMethods: ['generateContent'], inputTokenLimit: 1_048_576, outputTokenLimit: 65_536, providerMetadataFingerprint: 'm'.repeat(64), capturedAt: '2026-08-29T18:30:00.000Z' };
const validV2 = buildMotionDogfoodV2AuthoringContexts({ projectId, canonicalCreativeAuthority: canonical });

function v1Context() {
  return { v1AuthoringContract: { schema: 'ai-studio-os/motion-v1-dogfood-isolation@1', isolationAttestedBy: 'operator-01', isolationEvidenceRef: 'artifact://isolation/a', truth: { motionV1CreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false } } };
}

function eContext() {
  return { directControlRequest: { schema: 'ai-studio-os/direct-model-motion-control-request@1', projectId, briefFingerprint, isolationAttestedBy: 'operator-01', isolationEvidenceRef: 'artifact://isolation/e', truth: { directModelCreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false } } };
}

function contexts(overrides = {}) {
  return ['A', 'B', 'C', 'D', 'E'].map((conditionId) => ({
    conditionId,
    context: overrides[conditionId] ?? (conditionId === 'A'
      ? v1Context()
      : conditionId === 'E'
        ? eContext()
        : {})
  }));
}

function validContexts(overrides = {}) {
  const defaults = {
    A: v1Context(),
    B: validV2.B,
    C: validV2.C,
    D: validV2.D,
    E: eContext()
  };
  return ['A', 'B', 'C', 'D', 'E'].map((conditionId) => ({ conditionId, context: overrides[conditionId] ?? defaults[conditionId] }));
}

function plan(overrides = {}) {
  return buildCreativeMotionDogfoodAuthoringPlan({
    experimentId: 'benchmark-011-authoring-v1',
    projectId,
    frozenBrief,
    selectedCreativeWorld: canonical.selectedCreativeWorld,
    canonicalCreativeAuthority: canonical,
    modelIdentity,
    conditionContexts: contexts(),
    budget: buildGeminiMotionDogfoodBudget(model),
    scheduleSeed: 'benchmark-011-schedule-v1',
    ...overrides
  });
}

function validPlan(overrides = {}) {
  return plan({ conditionContexts: validContexts(), ...overrides });
}

function providerResult({ trial, generationInstruction, architectureDeclaration, runtimeEvidenceRef, hypotheses }) {
  const requestFingerprint = fingerprintCreativeValue({ trialId: trial.trialId, generationInstruction });
  const responseFingerprint = fingerprintCreativeValue({ trialId: trial.trialId, hypotheses });
  const trace = {
    schema: 'ai-studio-os/gemini-motion-dogfood-trace@1',
    provider: 'gemini',
    model,
    startedAt: '2026-08-29T18:30:00.000Z',
    completedAt: '2026-08-29T18:30:00.001Z',
    elapsedMs: 1,
    responseStatus: 200,
    requestFingerprint,
    responseFingerprint,
    usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 200, totalTokenCount: 300 }
  };
  return {
    schema: 'ai-studio-os/gemini-motion-dogfood-run@1',
    status: 'produced',
    truth: { prototypeOnly: true, creativeDirectionApproved: false, technicalPlanningApproved: false, productionApproved: false, reviewReady: false, capabilityEvidenceReady: false, providerFallbackUsed: false, architectureExecutionCryptographicallyProven: false },
    trial: structuredClone(trial),
    architectureDeclaration,
    request: { bodyFingerprint: requestFingerprint, model, architectureDeclarationFingerprint: fingerprintCreativeValue(architectureDeclaration) },
    trace,
    runtimeControl: {
      schema: 'ai-studio-os/dogfood-runtime-control@1',
      runtimeTraceRef: trial.runtimeTraceRef,
      runtimeTraceFingerprint: fingerprintCreativeValue(trace),
      runtimeEvidenceRef,
      ...trial.generationBudget
    },
    generatedDraft: { hypotheses },
    generatedTextFingerprint: fingerprintCreativeValue({ hypotheses }),
    findings: []
  };
}

test('A/B/C/D authoring tasks contain pre-authoring context rather than completed Motion artifacts', () => {
  const task = JSON.parse(buildCreativeMotionDogfoodAuthoringTask({ trial: { trialId: 'trial-a-1', conditionId: 'A' }, frozenBrief, selectedCreativeWorld: canonical.selectedCreativeWorld, context: v1Context() }));
  assert.deepEqual(task.frozenBrief, frozenBrief);
  assert.deepEqual(task.selectedCreativeWorld, canonical.selectedCreativeWorld);
  assert.deepEqual(task.output.requiredTopLevel, ['hypotheses']);
  assert.ok(task.output.requiredHypothesisFields.includes('motionMoments'));
  for (const key of ['exploration', 'reasoningSet', 'handoff', 'hypotheses']) assert.equal(Object.hasOwn(task, key), false);
});

test('V2 authoring output contract exposes canonical Synthesis fields while preserving B/C/D isolation', () => {
  const bTask = JSON.parse(buildCreativeMotionDogfoodAuthoringTask({ trial: { trialId: 'trial-b-1', conditionId: 'B' }, frozenBrief, selectedCreativeWorld: canonical.selectedCreativeWorld, context: validV2.B }));
  const dTask = JSON.parse(buildCreativeMotionDogfoodAuthoringTask({ trial: { trialId: 'trial-d-1', conditionId: 'D' }, frozenBrief, selectedCreativeWorld: canonical.selectedCreativeWorld, context: validV2.D }));
  for (const field of ['synthesisCandidateRefs', 'synthesisContributions']) {
    assert.ok(bTask.output.requiredHypothesisFields.includes(field));
    assert.ok(dTask.output.requiredHypothesisFields.includes(field));
  }
  assert.equal(bTask.output.synthesisPolicy.mode, 'forbidden');
  assert.deepEqual(bTask.output.synthesisPolicy.allowedCandidateIds, []);
  assert.equal(dTask.output.synthesisPolicy.mode, 'verified-candidates-only');
  assert.deepEqual([...dTask.output.synthesisPolicy.allowedCandidateIds].sort(), [...validV2.synthesisCandidateIds].sort());
});

test('the frozen seeded schedule remains the source of planned provider call order and controls', () => {
  const result = plan();
  assert.deepEqual(result.schedule, buildCreativeMotionDogfoodExecutionSchedule('benchmark-011-schedule-v1'));
  assert.equal(new Set(result.schedule.map((item) => item.conditionId)).size, 5);
  assert.equal(result.generationBudget.maxGenerationAttempts, 1);
  assert.equal(result.generationBudget.tokenBudget, buildGeminiMotionDogfoodBudget(model).tokenBudget);
});

test('invalid B/C/D static knowledge contexts make zero provider calls', async () => {
  const result = plan();
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-authoring-v2-context-invalid'));
  let calls = 0;
  const run = await executeCreativeMotionDogfoodAuthoringPlan(result, { runner: { inspectModelIdentity: async () => ({ ...modelIdentity, status: 'enrolled' }), runPrototype: async () => { calls += 1; return {}; } } });
  assert.equal(run.invalidReason, 'preflight-invalid');
  assert.equal(calls, 0);
  assert.equal(run.truth.partialRunsNonResumable, true);
  assert.equal(run.truth.creativeDirectionApproved, false);
  assert.equal(run.truth.productionApproved, false);
});

test('a completed Motion exploration embedded in A context is rejected before generation', () => {
  const a = v1Context();
  const result = plan({ conditionContexts: contexts({ A: { ...a, exploration: { schema: 'ai-studio-os/motion-creative-exploration@1', stage: 'motion-creative-exploration' } } }) });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-authoring-context-completed-artifact-forbidden'));
});

test('verified Synthesis provenance may remain inside D authority inputs without being mistaken for completed Motion output', () => {
  const result = validPlan();
  assert.equal(result.pass, true, result.findings.map((item) => item.code).join(', '));
  const d = result.conditionContexts.find((item) => item.conditionId === 'D').context;
  assert.equal(d.v2Brief.synthesisBinding.candidateCount >= 1, true);
  assert.equal(Array.isArray(d.authorityInputs.synthesis.synthesis.hypotheses), true);
});

test('fully valid mocked A1-E3 authoring executes exactly once per trial and downstream verification makes zero extra generation calls', async () => {
  const authoringPlan = validPlan({ budget: { tokenBudget: 777, wallClockSeconds: 19 } });
  assert.equal(authoringPlan.pass, true, authoringPlan.findings.map((item) => item.code).join(', '));
  assert.equal(authoringPlan.generationBudget.tokenBudget, 777);
  assert.equal(authoringPlan.generationBudget.wallClockSeconds, 19);

  const calls = [];
  const runner = {
    inspectModelIdentity: async () => ({ ...modelIdentity, status: 'enrolled', findings: [] }),
    runPrototype: async ({ trial, generationInstruction, architectureDeclaration, runtimeEvidenceRef }) => {
      const task = JSON.parse(generationInstruction);
      calls.push({ trialId: trial.trialId, conditionId: trial.conditionId, generationBudget: trial.generationBudget, task });
      const hypotheses = ['A', 'E'].includes(trial.conditionId)
        ? buildMotionHypotheses(canonical.selectedCreativeWorld.id)
        : buildMotionDogfoodV2Hypotheses({ brief: task.motionV2Brief, selectedCreativeWorld: task.selectedCreativeWorld });
      return providerResult({ trial, generationInstruction, architectureDeclaration, runtimeEvidenceRef, hypotheses });
    }
  };

  const run = await executeCreativeMotionDogfoodAuthoringPlan(authoringPlan, { runner });
  assert.equal(run.status, 'produced', run.findings.map((item) => item.code).join(', '));
  assert.equal(run.trialRuns.length, 15);
  assert.equal(calls.length, 15);
  assert.deepEqual(calls.map((item) => item.trialId), authoringPlan.schedule.map((item) => item.trialId));
  assert.equal(new Set(calls.map((item) => item.trialId)).size, 15);
  assert.equal(calls.every((item) => fingerprintCreativeValue(item.generationBudget) === fingerprintCreativeValue(authoringPlan.generationBudget)), true);

  const bCalls = calls.filter((item) => item.conditionId === 'B');
  const cCalls = calls.filter((item) => item.conditionId === 'C');
  const dCalls = calls.filter((item) => item.conditionId === 'D');
  assert.equal(bCalls.every((item) => item.task.output.synthesisPolicy.mode === 'forbidden'), true);
  assert.equal(cCalls.every((item) => item.task.output.synthesisPolicy.mode === 'forbidden'), true);
  assert.equal(dCalls.every((item) => item.task.output.synthesisPolicy.mode === 'verified-candidates-only'), true);

  const bundles = run.executionPlan.conditionBundles;
  assert.equal(run.executionPlan.pass, true, run.executionPlan.findings.map((item) => item.code).join(', '));
  assert.equal(new Set(bundles.map((item) => item.sourceExecutionFingerprint)).size, 15);
  assert.equal(new Set(bundles.map((item) => item.runtimeTraceRef)).size, 15);
  assert.equal(new Set(bundles.map((item) => item.runtimeTraceFingerprint)).size, 15);
  assert.equal(bundles.filter((item) => item.conditionId === 'E').every((item) => item.executionMode === 'executed-direct-model-output' && item.generationInstruction === '' && item.directControl?.requestFingerprint && item.directControl?.responseFingerprint), true);

  const aArtifacts = run.trialRuns.filter((item) => item.conditionId === 'A').map((item) => fingerprintCreativeValue(item.nativeArtifact));
  assert.equal(new Set(aArtifacts).size, 1);
  const aProvenance = bundles.filter((item) => item.conditionId === 'A').map((item) => item.sourceExecutionFingerprint);
  assert.equal(new Set(aProvenance).size, 3);

  assert.equal(run.truth.reviewReady, false);
  assert.equal(run.truth.capabilityEvidenceReady, false);
  assert.equal(run.truth.creativeDirectionApproved, false);
  assert.equal(run.truth.technicalPlanningApproved, false);
  assert.equal(run.truth.productionApproved, false);

  let downstreamGenerationCalls = 0;
  const downstream = await executeCreativeMotionDogfoodPlan(run.executionPlan, {
    runner: {
      inspectModelIdentity: async () => ({ ...modelIdentity, status: 'enrolled', findings: [] }),
      runPrototype: async () => {
        downstreamGenerationCalls += 1;
        throw new Error('Downstream verification must not generate provider output after authoring.');
      }
    }
  });
  assert.equal(downstream.status, 'produced', downstream.findings.map((item) => item.code).join(', '));
  assert.equal(downstreamGenerationCalls, 0);
  assert.equal(downstream.trialRuns.length, 15);
  assert.equal(downstream.trialRuns.every((item) => item.providerGenerationUsed === false), true);
  assert.equal(downstream.trialRuns.filter((item) => item.conditionId === 'E').every((item) => item.providerGenerationOccurredBeforeVerification === true), true);
  assert.equal(downstream.truth.reviewReady, false);
  assert.equal(downstream.truth.capabilityEvidenceReady, false);
  assert.equal(downstream.truth.creativeDirectionApproved, false);
  assert.equal(downstream.truth.technicalPlanningApproved, false);
  assert.equal(downstream.truth.productionApproved, false);
});

test('tampered provider-result bindings fail fast before a second authoring call', async () => {
  const mutations = [
    ['condition', (result) => { result.trial.conditionId = 'tampered'; }, 'dogfood-authoring-provider-trial-binding-invalid'],
    ['project', (result) => { result.trial.projectId = 'another-project'; }, 'dogfood-authoring-provider-trial-binding-invalid'],
    ['brief', (result) => { result.trial.briefFingerprint = '0'.repeat(64); }, 'dogfood-authoring-provider-trial-binding-invalid'],
    ['architecture declaration', (result) => { result.request.architectureDeclarationFingerprint = '0'.repeat(64); }, 'dogfood-authoring-provider-architecture-binding-invalid'],
    ['request trace', (result) => { result.trace.requestFingerprint = '0'.repeat(64); }, 'dogfood-authoring-provider-request-response-binding-invalid'],
    ['trace fingerprint', (result) => { result.runtimeControl.runtimeTraceFingerprint = '0'.repeat(64); }, 'dogfood-authoring-provider-trace-fingerprint-invalid']
  ];
  for (const [label, mutate, expectedFinding] of mutations) {
    const authoringPlan = validPlan();
    let calls = 0;
    const run = await executeCreativeMotionDogfoodAuthoringPlan(authoringPlan, {
      runner: {
        inspectModelIdentity: async () => ({ ...modelIdentity, status: 'enrolled', findings: [] }),
        runPrototype: async ({ trial, generationInstruction, architectureDeclaration, runtimeEvidenceRef }) => {
          calls += 1;
          const task = JSON.parse(generationInstruction);
          const hypotheses = ['A', 'E'].includes(trial.conditionId)
            ? buildMotionHypotheses(canonical.selectedCreativeWorld.id)
            : buildMotionDogfoodV2Hypotheses({ brief: task.motionV2Brief, selectedCreativeWorld: task.selectedCreativeWorld });
          const result = providerResult({ trial, generationInstruction, architectureDeclaration, runtimeEvidenceRef, hypotheses });
          mutate(result);
          return result;
        }
      }
    });
    assert.equal(run.invalidReason, 'partial-batch-invalid', label);
    assert.equal(calls, 1, label);
    assert.ok(run.trialRuns[0].findings.some((item) => item.code === expectedFinding), label);
    assert.equal(run.truth.capabilityEvidenceReady, false, label);
    assert.equal(run.truth.productionApproved, false, label);
  }
});
