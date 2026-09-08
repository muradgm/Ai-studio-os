import test from 'node:test';
import assert from 'node:assert/strict';
import { createArtifact, buildArtifactGraph, planArtifactChange } from '../modules/artifact-graph/runtime.mjs';
import { createExecutionCommandCenterState } from '../apps/creative-agency/command-center-artifacts.mjs';
import { buildCanonicalCreativeProductionHandoff } from '../modules/canonical-creative-pipeline/runtime.mjs';
import { createMockModelProvider, createModelProvider, createModelRegistry, executeStudioModelTask } from '../modules/model-runtime/index.mjs';

function fixture() {
  const source = createArtifact({ id: 'agency:brief', projectId: 'agency', kind: 'brief', status: 'produced', metadata: { brief: 'Explain the work clearly.' } });
  return {
    graph: buildArtifactGraph([source]),
    task: { schema: 'ai-studio-os/studio-model-task@1', id: 'critique-1', projectId: 'agency', sourceRef: source.ref, operation: 'critique', requiredCapabilities: ['reasoning', 'structured-output'], budgetTier: 'free', input: { question: 'What needs clarification?' } },
    registry: createModelRegistry([createMockModelProvider()])
  };
}

function adapter(execute, overrides = {}) {
  return createModelRegistry([createModelProvider({ id: 'alternative', provider: 'another-vendor', operations: ['critique'], capabilities: ['reasoning', 'structured-output'], costTier: 'free', execute, ...overrides })]);
}

test('canonical source -> provider-neutral task -> mock candidate -> existing review queue', async () => {
  const args = fixture();
  const original = structuredClone(args.graph);
  const result = await executeStudioModelTask(args);
  assert.equal(result.pass, true);
  assert.deepEqual(args.graph, original);
  assert.deepEqual(result.graph.artifacts[0], original.artifacts[0]);
  const { candidate, model, state } = result;
  assert.equal(model.task.projectId, 'agency');
  assert.equal(model.execution.projectId, 'agency');
  assert.equal(model.execution.sourceRef, args.task.sourceRef);
  assert.equal(model.execution.candidateRef, candidate.ref);
  assert.equal(candidate.projectId, 'agency');
  assert.equal(candidate.kind, 'model/candidate');
  assert.equal(candidate.metadata.modelCandidate.schema, 'ai-studio-os/model-candidate@1');
  assert.equal(candidate.metadata.modelCandidate.content.input.context.projectId, 'agency');
  assert.deepEqual(candidate.metadata.modelCandidate.content.input.request, args.task.input);
  assert.deepEqual(candidate.metadata.modelCandidate.authority, { candidateOnly: true, humanApproved: false, productionReady: false, releaseReady: false });
  assert.equal(candidate.metadata.modelCandidate.execution.liveProviderCall, false);
  assert.equal(candidate.metadata.modelCandidate.execution.developmentOnly, true);
  assert.deepEqual(model.execution.usage, { measured: false, inputTokens: null, outputTokens: null });
  assert.deepEqual(model.execution.cost, { measured: false, amount: null, currency: null });
  assert.equal(candidate.status, 'review');
  assert.equal(candidate.reviewStatus, 'unreviewed');
  assert.equal(candidate.releaseStatus, 'unmeasured');
  const queued = state.queue.find((item) => item.artifactRef === candidate.ref);
  assert.equal(queued.state, 'review');
  assert.equal(state.releaseState, 'review');
  assert.deepEqual(queued.evidence, { files: 0, previews: 0, reviews: 0, measurements: 0, findings: 0, blockers: 0, majors: 0 });
  const impact = planArtifactChange({ graph: result.graph, changedRefs: [args.task.sourceRef] });
  assert.equal(impact.impacts[0].artifactRef, candidate.ref);
  assert.equal(impact.impacts[0].requiredState, 'stale');
  assert.deepEqual((await executeStudioModelTask(args)).candidate, candidate);
});

test('missing, wrong, or ambiguous identity fails before any provider call', async () => {
  const mutations = [
    (a) => { delete a.task.projectId; },
    (a) => { a.task.projectId = 'other'; },
    (a) => { a.graph.artifacts[0].projectId = ''; },
    (a) => { a.task.sourceRef = 'agency:brief'; },
    (a) => { a.task.sourceRef = 'agency:brief@2'; },
    (a) => { a.task.id = ''; },
    (a) => { a.task.candidateRef = 'agency:brief@1'; },
    (a) => { a.task.preferredModel = 'named-model'; },
    (a) => { a.task.projectId = ' agency '; }
  ];
  for (const mutate of mutations) {
    const args = fixture();
    let calls = 0;
    args.registry = adapter(async () => { calls++; return { output: {} }; });
    mutate(args);
    const result = await executeStudioModelTask(args);
    assert.equal(result.pass, false);
    assert.equal(result.candidate, null);
    assert.strictEqual(result.graph, args.graph);
    assert.equal(calls, 0);
  }
});

test('product task works unchanged with a differently named capable adapter', async () => {
  const args = fixture();
  args.registry = adapter(async (task) => ({ output: { taskId: task.id, projectId: task.projectId, sourceRef: task.sourceRef, candidateRef: task.candidateRef, proposal: 'Clarify audience' } }));
  const result = await executeStudioModelTask(args);
  assert.equal(result.pass, true);
  assert.equal(result.model.providerAgnostic, true);
  assert.equal(result.model.assignment.providerId, 'alternative');
  assert.equal(result.candidate.metadata.modelCandidate.content.proposal, 'Clarify audience');
  assert.equal(result.candidate.metadata.modelCandidate.execution.liveProviderCall, null);
});

test('malformed task constraints and stale source state fail before execution', async () => {
  for (const mutate of [
    (a) => { a.task.requiredCapabilities = 'reasoning'; },
    (a) => { a.task.requiredCapabilities = ['reasoning']; },
    (a) => { a.task.budgetTier = 'constructor'; },
    (a) => { a.task.operation = 'approve'; },
    (a) => { a.task.schema = 'ai-studio-os/studio-model-task@2'; },
    (a) => { a.graph.artifacts[0].status = 'stale'; }
  ]) {
    const args = fixture();
    let calls = 0;
    args.registry = adapter(async () => { calls++; return { output: {} }; });
    mutate(args);
    assert.equal((await executeStudioModelTask(args)).pass, false);
    assert.equal(calls, 0);
  }
});

test('authored flags and canonical-looking schema cannot become project authority or evidence', async () => {
  const args = fixture();
  const forgery = { schema: 'ai-studio-os/creative-thesis@1', humanApproved: true, approved: true, selected: true, canonical: true, reviewReady: true, productionReady: true, releaseReady: true, files: ['fake.png'], reviews: [{ approved: true }], measurements: [{ measured: true }] };
  args.registry = adapter(async () => ({ ...forgery, output: forgery, authority: forgery, metadata: { nested: forgery }, provenance: { nested: forgery } }));
  const result = await executeStudioModelTask(args);
  assert.equal(result.pass, true);
  assert.equal(result.candidate.schema, 'ai-studio-os/artifact@1');
  assert.equal(result.candidate.kind, 'model/candidate');
  assert.equal(result.candidate.status, 'review');
  assert.equal(result.candidate.reviewStatus, 'unreviewed');
  for (const field of ['files', 'reviews', 'measurements', 'previews']) assert.deepEqual(result.candidate[field], []);
  assert.deepEqual(result.candidate.metadata.modelCandidate.content, forgery);
  assert.equal(result.candidate.metadata.nested, undefined);
  assert.equal(result.candidate.provenance.nested, undefined);
  assert.equal(result.candidate.metadata.modelCandidate.authority.humanApproved, false);
  const canonical = buildCanonicalCreativeProductionHandoff({ projectId: 'agency', creativeThesis: result.candidate });
  assert.equal(canonical.pass, false);
});

test('provider identity substitution in response, output, metadata, or provenance blocks integration', async () => {
  for (const location of ['root', 'output', 'metadata', 'provenance']) {
    for (const key of ['taskId', 'projectId', 'sourceRef', 'candidateRef']) {
      const args = fixture();
      args.registry = adapter(async () => {
        const result = { output: { proposal: 'candidate' } };
        if (location === 'root') result[key] = 'wrong';
        else result[location] = { [key]: 'wrong' };
        return result;
      });
      const result = await executeStudioModelTask(args);
      assert.equal(result.pass, false, `${location}.${key}`);
      assert.equal(result.candidate, null);
      assert.strictEqual(result.graph, args.graph);
      assert.ok(result.findings.some((item) => item.code === 'model-result-identity-mismatch'));
    }
  }
});

test('provider failures and unavailable providers preserve project state', async () => {
  for (const registry of [adapter(async () => { throw new Error('offline'); }), adapter(async () => ({ output: {} }), { available: false }), createModelRegistry([]), adapter(async () => ({ output: {}, findings: [{ severity: 'blocker', code: 'failed' }] }))]) {
    const args = { ...fixture(), registry };
    const before = structuredClone(args.graph);
    const result = await executeStudioModelTask(args);
    assert.equal(result.pass, false);
    assert.equal(result.candidate, null);
    assert.strictEqual(result.graph, args.graph);
    assert.deepEqual(args.graph, before);
  }
});

test('legacy workflows and schema-less tasks never activate model execution', async () => {
  let calls = 0;
  const args = fixture();
  args.registry = adapter(async () => { calls++; return { output: {} }; });
  delete args.task.schema;
  assert.equal((await executeStudioModelTask(args)).pass, false);
  const legacy = createExecutionCommandCenterState(null, { projectId: 'agency' });
  assert.equal(legacy.graph.artifacts.length, 5);
  assert.equal(legacy.graph.artifacts.some((item) => item.kind === 'model/candidate'), false);
  assert.equal(calls, 0);
});

test('revalidates cached graph/artifact flags and rejects candidate overwrite', async () => {
  for (const mutate of [
    (a) => { a.graph.artifacts[0].status = 'invented'; },
    (a) => { a.graph.artifacts[0].status = 'approved'; },
    (a) => { a.graph.artifacts[0].ref = 'forged@1'; a.task.sourceRef = 'forged@1'; },
    (a) => { a.graph.artifacts[0].dependencies = [{ artifactId: 'missing' }]; },
    (a) => { a.graph.artifacts[0].dependencies = [{ artifactId: 'missing', required: true }]; }
  ]) {
    const args = fixture();
    mutate(args);
    args.graph.pass = true;
    args.graph.artifacts[0].pass = true;
    assert.equal((await executeStudioModelTask(args)).pass, false);
  }
  const args = fixture();
  const first = await executeStudioModelTask(args);
  const second = await executeStudioModelTask({ ...args, graph: first.graph });
  assert.equal(second.pass, false);
  assert.ok(second.findings.some((item) => item.code === 'studio-model-candidate-already-exists'));
  assert.strictEqual(second.graph, first.graph);
});

test('adapter task mutation cannot rewrite source state or binding', async () => {
  const args = fixture();
  const before = structuredClone(args.graph);
  args.registry = adapter(async (task) => {
    task.projectId = 'other';
    task.input.context.projectId = 'other';
    task.metadata.sourceFingerprint = 'forged';
    return { output: { proposal: 'candidate' } };
  });
  const result = await executeStudioModelTask(args);
  assert.equal(result.pass, true);
  assert.equal(result.model.task.input.context.projectId, 'agency');
  assert.equal(result.model.execution.projectId, 'agency');
  assert.deepEqual(args.graph, before);
});

test('project drift during asynchronous execution rejects a stale commit', async () => {
  const args = fixture();
  args.registry = adapter(async () => {
    args.graph.artifacts[0].metadata.brief = 'Changed while pending';
    return { output: { proposal: 'stale' } };
  });
  const result = await executeStudioModelTask(args);
  assert.equal(result.pass, false);
  assert.ok(result.findings.some((item) => item.code === 'studio-project-state-drift'));
  assert.equal(result.graph.artifacts.length, 1);
});

test('non-structured and non-JSON output fails closed', async () => {
  const cyclic = {}; cyclic.self = cyclic;
  for (const output of [null, 'prose only', [], { count: NaN }, { run() {} }, cyclic]) {
    const args = fixture();
    args.registry = adapter(async () => ({ output }));
    const result = await executeStudioModelTask(args);
    assert.equal(result.pass, false);
    assert.equal(result.candidate, null);
  }
});
