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
function sources(overrides = {}) { return ['A', 'B', 'C', 'D', 'E'].map((conditionId) => ({ conditionId, source: overrides[conditionId] ?? (conditionId === 'A' ? aSource() : conditionId === 'E' ? { directControlRequest: directControlRequest() } : {}) })); }
function plan(overrides = {}) { return buildCreativeMotionDogfoodExecutionPlan({ experimentId: 'benchmark-011-after-matter-v1', projectId, frozenBrief: brief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, runRef: 'artifacts/dogfood/after-matter/run-001', modelIdentity: identity, conditionSources: sources(), budget: buildGeminiMotionDogfoodBudget(model), scheduleSeed: 'benchmark-011-schedule-v1', ...overrides }); }

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

test('a Creative World content mutation with the same ID invalidates the source bundle', () => {
  const mutated = structuredClone(aSource());
  mutated.exploration.authorityInputs.canonicalCreativeAuthority.selectedCreativeWorld.motionLanguage = 'same id, mutated world content';
  const result = buildCreativeMotionDogfoodGenerationSource({ trial: { conditionId: 'A', projectId, briefFingerprint }, brief, selectedCreativeWorld: canonical.selectedCreativeWorld, canonicalCreativeAuthority: canonical, source: mutated });
  assert.equal(result.reviewReady, false);
  assert.ok(result.findings.some((item) => item.code === 'dogfood-generation-source-world-drift'));
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
