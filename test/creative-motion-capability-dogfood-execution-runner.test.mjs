import test from 'node:test';
import assert from 'node:assert/strict';

import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { buildCreativeMotionDogfoodDirectControlExploration, buildCreativeMotionDogfoodGenerationSource } from '../modules/creative-motion-capability-dogfood/execution.mjs';
import { buildCreativeMotionDogfoodExecutionPlan, executeCreativeMotionDogfoodPlan, reviewCreativeMotionDogfoodExecutionPlan, sameCreativeMotionDogfoodProviderIdentity } from '../modules/creative-motion-capability-dogfood/execution-runner.mjs';
import { buildGeminiMotionDogfoodBudget } from '../modules/creative-motion-capability-dogfood/gemini-runner.mjs';
import { buildMotionExplorationFixture, buildMotionHypotheses } from '../fixtures/motion-creative-authority-fixture.mjs';

const { canonical, exploration } = buildMotionExplorationFixture();
const projectId = canonical.projectId;
const brief = { projectId, title: 'After Matter', targetExperience: 'Material time remains readable.' };
const briefFingerprint = fingerprintCreativeValue(brief);
const model = 'gemini-3.5-flash-lite';
const identity = { schema: 'ai-studio-os/gemini-model-identity@1', requestedModel: model, providerModelName: `models/${model}`, providerBaseModelId: '', providerVersion: '3.5-flash-lite-07-2026', supportedGenerationMethods: ['generateContent'], inputTokenLimit: 1_048_576, outputTokenLimit: 65_536, providerMetadataFingerprint: 'm'.repeat(64), capturedAt: '2026-08-29T18:30:00.000Z' };

function directControlRequest(overrides = {}) { return { schema: 'ai-studio-os/direct-model-motion-control-request@1', projectId, briefFingerprint, isolationAttestedBy: 'operator-01', isolationEvidenceRef: 'artifact://dogfood/e/isolation', truth: { directModelCreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false }, ...overrides }; }
function aSource() { return { exploration, v1Isolation: { schema: 'ai-studio-os/motion-v1-dogfood-isolation@1', explorationFingerprint: fingerprintCreativeValue(exploration), isolationAttestedBy: 'operator-01', isolationEvidenceRef: 'artifact://dogfood/a/isolation', truth: { motionV1CreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false } } }; }
function sourceExecution(trialId, conditionId, sourceArtifactFingerprint) { return { schema: 'ai-studio-os/creative-motion-dogfood-source-execution@1', trialId, conditionId, executionInstanceRef: `artifact://dogfood/source-executions/${trialId}`, runtimeTraceRef: `artifact://dogfood/traces/${trialId}`, runtimeTraceFingerprint: fingerprintCreativeValue({ trialId, kind: 'trace' }), sourceEvidenceRef: `artifact://dogfood/evidence/${trialId}`, sourceArtifactFingerprint }; }
function trialSources() {
  return ['A', 'B', 'C', 'D', 'E'].flatMap((conditionId) => [1, 2, 3].map((replicate) => {
    const trialId = `trial-${conditionId.toLowerCase()}-${replicate}`;
    const source = conditionId === 'A' ? aSource() : conditionId === 'E' ? { directControlRequest: directControlRequest() } : {};
    const sourceArtifactFingerprint = conditionId === 'A' ? fingerprintCreativeValue(exploration) : conditionId === 'E' ? fingerprintCreativeValue({ sourceSnapshotFingerprint: fingerprintCreativeValue(directControlRequest()), generationInstructionFingerprint: '' }) : fingerprintCreativeValue(null);
    return { trialId, conditionId, sourceExecution: sourceExecution(trialId, conditionId, sourceArtifactFingerprint), source };
  }));
}
function plan(overrides = {}) { return buildCreativeMotionDogfoodExecutionPlan({ experimentId: 'benchmark-011-after-matter-v1', projectId, frozenBrief: brief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, modelIdentity: identity, trialSources: trialSources(), budget: buildGeminiMotionDogfoodBudget(model), scheduleSeed: 'benchmark-011-schedule-v1', ...overrides }); }

test('A stays an architecture output and cannot acquire a post-architecture Gemini instruction', () => {
  const result = buildCreativeMotionDogfoodGenerationSource({ trial: { conditionId: 'A', projectId, briefFingerprint }, brief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, source: { ...aSource(), generationInstruction: 'substituted prompt' } });
  assert.equal(result.reviewReady, true);
  assert.equal(result.executionMode, 'architecture-output');
  assert.equal(result.generationInstruction, '');
  assert.equal(result.generationInstructionFingerprint, '');
  assert.equal(result.conditionArtifact, exploration);
});

test('B/C/D remain native architecture-output modes even when a caller supplies a Gemini prompt', () => {
  for (const conditionId of ['B', 'C', 'D']) {
    const result = buildCreativeMotionDogfoodGenerationSource({ trial: { conditionId, projectId, briefFingerprint }, brief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, source: { generationInstruction: 'extra Gemini transformation' } });
    assert.equal(result.executionMode, 'architecture-output');
    assert.equal(result.generationInstruction, '');
  }
});

test('E receives the exact canonical Creative World object, not caller prompt text or refs', () => {
  const result = buildCreativeMotionDogfoodGenerationSource({ trial: { conditionId: 'E', projectId, briefFingerprint }, brief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, source: { directControlRequest: directControlRequest(), generationInstruction: 'substituted prompt', sourceSnapshotFingerprint: 'f'.repeat(64), authorityEvidenceRef: 'artifact://forged' } });
  const instruction = JSON.parse(result.generationInstruction);
  assert.equal(result.reviewReady, true);
  assert.equal(result.executionMode, 'direct-model-generation');
  assert.deepEqual(instruction.selectedCreativeWorld, canonical.selectedCreativeWorld);
  assert.equal(instruction.selectedCreativeWorldFingerprint, fingerprintCreativeValue(canonical.selectedCreativeWorld));
  assert.equal(result.generationInstruction.includes('substituted prompt'), false);
  assert.equal(result.generationInstruction.includes('artifact://forged'), false);
});

test('executed E evidence is verification-only and cannot derive a second Gemini instruction', () => {
  const generated = buildCreativeMotionDogfoodDirectControlExploration({ projectId, canonicalCreativeAuthority: canonical, selectedCreativeWorld: canonical.selectedCreativeWorld, generatedDraft: { hypotheses: buildMotionHypotheses(canonical.selectedCreativeWorld.id) } });
  const budget = buildGeminiMotionDogfoodBudget(model);
  const trial = { conditionId: 'E', projectId, briefFingerprint, runtimeTraceRef: 'artifact://dogfood/e/trace', generationBudget: budget };
  const directControl = { schema: 'ai-studio-os/direct-model-motion-control@1', projectId, briefFingerprint, ...budget, requestFingerprint: 'r'.repeat(64), responseFingerprint: 's'.repeat(64), runtimeTraceRef: trial.runtimeTraceRef, explorationFingerprint: fingerprintCreativeValue(generated.exploration), isolationAttestedBy: 'operator-01', isolationEvidenceRef: 'artifact://dogfood/e/isolation', truth: { directModelCreativeGeneration: true, aiStudioKnowledgeUsed: false, aiStudioTransferUsed: false, aiStudioSynthesisUsed: false, aiStudioMotionV2Used: false, v1ContractValidationAndProofOnly: true } };
  const result = buildCreativeMotionDogfoodGenerationSource({ trial, brief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, source: { directControl, exploration: generated.exploration } });
  assert.equal(result.reviewReady, true);
  assert.equal(result.executionMode, 'executed-direct-model-output');
  assert.equal(result.generationInstruction, '');
  assert.equal(result.generationInstructionFingerprint, '');
  assert.equal(result.conditionArtifact, generated.exploration);
});

test('a Creative World content mutation with the same ID invalidates the source bundle', () => {
  const mutated = structuredClone(aSource());
  mutated.exploration.authorityInputs.canonicalCreativeAuthority.selectedCreativeWorld.motionLanguage = 'same id, mutated world content';
  const result = buildCreativeMotionDogfoodGenerationSource({ trial: { conditionId: 'A', projectId, briefFingerprint }, brief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, source: mutated });
  assert.equal(result.reviewReady, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-generation-source-world-drift'));
});

test('copied A1 provenance cannot be presented as A2/A3 replicate evidence', () => {
  const sources = trialSources();
  const a1 = sources.find((item) => item.trialId === 'trial-a-1');
  const a2 = sources.find((item) => item.trialId === 'trial-a-2');
  const a3 = sources.find((item) => item.trialId === 'trial-a-3');
  a2.sourceExecution = structuredClone(a1.sourceExecution);
  a3.sourceExecution = structuredClone(a1.sourceExecution);
  const result = plan({ trialSources: sources });
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-executor-replicate-source-mismatch'));
  assert.ok(result.findings.some((item) => item.code === 'dogfood-executor-replicate-execution-reused'));
  assert.ok(result.findings.some((item) => item.code === 'dogfood-executor-replicate-runtime-trace-reused'));
});

test('independent A executions may have identical creative output without replicate contamination', () => {
  const result = plan();
  const aBundles = result.conditionBundles.filter((item) => item.conditionId === 'A');
  assert.equal(new Set(aBundles.map((item) => item.sourceArtifactFingerprint)).size, 1);
  assert.equal(new Set(aBundles.map((item) => item.sourceExecutionFingerprint)).size, 3);
  assert.equal(new Set(aBundles.map((item) => item.runtimeTraceRef)).size, 3);
  assert.equal(aBundles.every((item) => item.reviewReady), true);
  assert.equal(result.findings.some((item) => item.code === 'dogfood-executor-replicate-execution-reused'), false);
  assert.equal(result.findings.some((item) => item.code === 'dogfood-executor-replicate-runtime-trace-reused'), false);
});

test('arbitrary JSON and incomplete direct hypotheses cannot count as produced output', () => {
  const options = { projectId, canonicalCreativeAuthority: canonical, selectedCreativeWorld: canonical.selectedCreativeWorld };
  const arbitrary = buildCreativeMotionDogfoodDirectControlExploration({ ...options, generatedDraft: { ok: true } });
  const incomplete = buildCreativeMotionDogfoodDirectControlExploration({ ...options, generatedDraft: { hypotheses: [{ id: 'only-an-id' }] } });
  assert.equal(arbitrary.produced, false);
  assert.equal(incomplete.produced, false);
  assert.ok(incomplete.findings.some((item) => item.code === 'dogfood-direct-output-hypotheses-invalid'));
  assert.equal(buildCreativeMotionDogfoodDirectControlExploration({ ...options, generatedDraft: { hypotheses: buildMotionHypotheses(canonical.selectedCreativeWorld.id) } }).produced, true);
});

test('plan rejects fabricated V2 sources before identity inspection or provider generation', async () => {
  const result = plan();
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-v2-reasoning-set-invalid'));
  let inspected = false;
  let generated = false;
  const run = await executeCreativeMotionDogfoodPlan(result, { runner: { inspectModelIdentity: async () => { inspected = true; return { ...identity, status: 'enrolled' }; }, runPrototype: async () => { generated = true; return {}; } } });
  assert.equal(run.invalidReason, 'preflight-invalid');
  assert.equal(inspected, false);
  assert.equal(generated, false);
});

test('provider identity comparison rejects a stale resource version or metadata fingerprint while ignoring only capture time', () => {
  assert.equal(sameCreativeMotionDogfoodProviderIdentity(identity, { ...identity, capturedAt: '2026-08-29T19:00:00.000Z' }), true);
  assert.equal(sameCreativeMotionDogfoodProviderIdentity(identity, { ...identity, providerVersion: '3.5-flash-lite-08-2026' }), false);
  assert.equal(sameCreativeMotionDogfoodProviderIdentity(identity, { ...identity, providerMetadataFingerprint: 'n'.repeat(64) }), false);
});

test('plan fingerprints and rejects deterministic schedule reordering without changing non-resumable truth', () => {
  const result = plan();
  const reordered = { ...result, schedule: [...result.schedule].reverse() };
  reordered.snapshotFingerprint = fingerprintCreativeValue({ ...reordered, findings: undefined, pass: undefined, status: undefined });
  const review = reviewCreativeMotionDogfoodExecutionPlan(reordered);
  assert.equal(review.pass, false);
  assert.ok(review.findings.some((item) => item.code === 'dogfood-executor-schedule-drift'));
  assert.equal(result.truth.partialRunsNonResumable, true);
});

test('pre-proof execution cannot be resumed or promoted by caller truth fields', async () => {
  const result = plan();
  const promoted = { ...result, truth: { ...result.truth, reviewReady: true, capabilityEvidenceReady: true, creativeDirectionApproved: true, technicalPlanningApproved: true, productionApproved: true } };
  const run = await executeCreativeMotionDogfoodPlan(promoted, { runner: {}, previousRun: { status: 'invalid', trialRuns: [{ trialId: 'trial-a-1' }] } });
  assert.equal(run.status, 'invalid');
  assert.equal(run.truth.replacementExperimentRequired, true);
  assert.ok(run.findings.some((item) => item.code === 'dogfood-executor-truth-drift'));
});
