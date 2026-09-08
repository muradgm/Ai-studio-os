import { createArtifact, buildArtifactGraph, artifactRef } from '../artifact-graph/runtime.mjs';
import { createCommandCenterArtifactState } from '../command-center-state/runtime.mjs';
import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';
import { executeModelTask } from './runtime.mjs';

const AUTHORITY = Object.freeze({ candidateOnly: true, humanApproved: false, productionReady: false, releaseReady: false });
const text = (value) => typeof value === 'string' && value.trim() === value && value.length > 0;

// This boundary accepts JSON data, never executable objects or lossy serialization.
function jsonValue(value, ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (!value || typeof value !== 'object' || ancestors.has(value)) return false;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return false;
  ancestors.add(value);
  const valid = Object.values(value).every((item) => jsonValue(item, ancestors));
  ancestors.delete(value);
  return valid;
}

function validatedGraph(graph) {
  if (graph?.schema !== 'ai-studio-os/artifact-graph@1' || !Array.isArray(graph.artifacts)) throw new Error('studio-project-graph-invalid');
  // buildArtifactGraph trusts pre-shaped artifact schemas; re-run the canonical
  // artifact builder first so cached pass/status flags cannot skip validation.
  const artifacts = graph.artifacts.map((artifact) => {
    const checked = createArtifact(artifact);
    if (!checked.pass || fingerprintCreativeValue(checked) !== fingerprintCreativeValue(artifact)) throw new Error('studio-project-artifact-invalid');
    return checked;
  });
  const checked = buildArtifactGraph(artifacts);
  if (!checked.pass) throw new Error('studio-project-graph-invalid');
  return checked;
}

/** Explicit, append-only in-memory transaction. Callers retain the old graph on failure. */
export async function executeStudioModelTask({ graph, task, registry } = {}) {
  let model = null;
  const blocked = (code) => ({
    stage: 'studio-model-task', pass: false, graph, candidate: null, state: null,
    model, authority: { ...AUTHORITY },
    findings: [...(model?.findings ?? []), { severity: 'blocker', code, message: 'Studio model task did not integrate a candidate.' }]
  });
  try {
    if (task?.schema !== 'ai-studio-os/studio-model-task@1') return blocked('studio-model-task-schema-invalid');
    if (!jsonValue(task)) return blocked('studio-model-task-invalid');
    if (!text(task.id) || !text(task.projectId) || !text(task.sourceRef)) return blocked('studio-model-task-identity-missing');
    if (!['reason', 'critique', 'generate-structured', 'tool-plan'].includes(task.operation)
      || !Array.isArray(task.requiredCapabilities) || !task.requiredCapabilities.every(text)
      || !task.requiredCapabilities.includes('structured-output')
      || !['free', 'low', 'medium', 'high'].includes(task.budgetTier)) return blocked('studio-model-task-invalid');
    // Product requests express intent, not provider/model constraints or authority.
    const allowed = new Set(['schema', 'id', 'projectId', 'sourceRef', 'operation', 'requiredCapabilities', 'budgetTier', 'input']);
    if (Object.keys(task).some((key) => !allowed.has(key))) return blocked('studio-model-task-field-unsupported');
    const snapshot = validatedGraph(graph);
    const graphFingerprint = fingerprintCreativeValue(graph);
    const request = structuredClone(task);
    const source = snapshot.artifacts.find((item) => item.ref === request.sourceRef);
    if (!source || !text(source.projectId) || source.projectId !== request.projectId) return blocked('studio-model-source-project-mismatch');
    if (['stale', 'blocked', 'rejected', 'archived'].includes(source.status)) return blocked('studio-model-source-unusable');
    const candidateId = `${request.projectId}:model-candidate:${request.id}`;
    if (snapshot.artifacts.some((item) => item.id === candidateId)) return blocked('studio-model-candidate-already-exists');
    const candidateRef = artifactRef(candidateId, '1');
    const identity = { taskId: request.id, projectId: source.projectId, sourceRef: source.ref, candidateRef };
    const sourceFingerprint = fingerprintCreativeValue(source);
    model = await executeModelTask({ registry, task: {
      id: request.id, projectId: source.projectId, sourceRef: source.ref, candidateRef,
      operation: request.operation, requiredCapabilities: request.requiredCapabilities, budgetTier: request.budgetTier,
      input: { context: structuredClone(source), request: request.input ?? null },
      metadata: { sourceFingerprint }
    } });
    if (!model.pass) return blocked('studio-model-execution-blocked');
    if (fingerprintCreativeValue(graph) !== graphFingerprint) return blocked('studio-project-state-drift');
    const execution = model.execution;
    if (!execution?.output || Array.isArray(execution.output) || typeof execution.output !== 'object' || !jsonValue(execution.output)) return blocked('studio-model-structured-output-invalid');
    if (Object.entries(identity).some(([key, value]) => execution[key] !== value)) return blocked('studio-model-result-identity-mismatch');
    // Provider output is opaque authored content. Never spread it (or provider
    // metadata/provenance/findings) into artifact state, evidence, or authority.
    const candidate = createArtifact({
      id: candidateId, version: '1', kind: 'model/candidate', format: 'json', projectId: source.projectId,
      status: 'review', reviewStatus: 'unreviewed', releaseStatus: 'unmeasured',
      source: { ...identity, sourceFingerprint },
      creator: { type: 'model-runtime', providerId: execution.providerId },
      dependencies: [{ artifactRef: source.ref, relation: 'derived-from', required: true, impact: 'stale' }],
      provenance: { ...identity, sourceFingerprint, taskFingerprint: fingerprintCreativeValue(request) },
      metadata: {
        modelCandidate: {
          schema: 'ai-studio-os/model-candidate@1', ...identity, authority: { ...AUTHORITY },
          operation: request.operation, content: structuredClone(execution.output),
          contentFingerprint: fingerprintCreativeValue(execution.output),
          execution: {
            providerId: execution.providerId,
            liveProviderCall: typeof execution.provenance.liveProviderCall === 'boolean' ? execution.provenance.liveProviderCall : null,
            developmentOnly: typeof execution.provenance.developmentOnly === 'boolean' ? execution.provenance.developmentOnly : null,
            usage: { measured: false, inputTokens: null, outputTokens: null },
            cost: { measured: false, amount: null, currency: null }
          }
        }
      }
    });
    const nextGraph = buildArtifactGraph([...snapshot.artifacts, candidate]);
    if (!candidate.pass || !nextGraph.pass) return blocked('studio-model-integration-invalid');
    const state = createCommandCenterArtifactState({ graph: nextGraph, projectId: source.projectId });
    return { stage: 'studio-model-task', pass: true, graph: nextGraph, candidate, state, model, authority: { ...AUTHORITY }, findings: [] };
  } catch (error) {
    return blocked(['studio-project-graph-invalid', 'studio-project-artifact-invalid'].includes(error?.message)
      ? error.message : 'studio-model-task-invalid');
  }
}
