import { createArtifact, buildArtifactGraph } from '../artifact-graph/runtime.mjs';

function clean(value) {
  return String(value ?? '').trim();
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function normalizeFile(file) {
  if (typeof file === 'string') return { ref: clean(file), role: 'primary', format: '' };
  return {
    ref: clean(file?.ref ?? file?.path ?? file?.url),
    role: clean(file?.role ?? 'primary'),
    format: clean(file?.format),
    hash: clean(file?.hash),
    bytes: Number.isFinite(file?.bytes) ? Number(file.bytes) : null
  };
}

export function createProductionAdapter(definition = {}) {
  const operations = [...new Set(array(definition.operations).map(clean).filter(Boolean))];
  const capabilities = [...new Set(array(definition.capabilities).map(clean).filter(Boolean))];
  return {
    schema: 'ai-studio-os/production-adapter@1',
    id: clean(definition.id),
    provider: clean(definition.provider ?? definition.id),
    available: definition.available !== false,
    operations,
    capabilities,
    costTier: clean(definition.costTier ?? 'medium'),
    priority: Number(definition.priority ?? 0),
    defaultModel: clean(definition.defaultModel),
    execute: typeof definition.execute === 'function' ? definition.execute : null,
    metadata: structuredClone(object(definition.metadata))
  };
}

export function validateProductionAdapter(adapter) {
  const findings = [];
  if (!adapter || adapter.schema !== 'ai-studio-os/production-adapter@1') findings.push(finding('blocker', 'production-adapter-schema-invalid', 'Adapter must use the production adapter contract.'));
  if (!clean(adapter?.id)) findings.push(finding('blocker', 'production-adapter-id-missing', 'Production adapter requires a stable id.'));
  if (!array(adapter?.operations).length) findings.push(finding('blocker', 'production-adapter-operations-missing', 'Production adapter must declare supported operations.', { adapterId: adapter?.id ?? null }));
  if (typeof adapter?.execute !== 'function') findings.push(finding('blocker', 'production-adapter-execute-missing', 'Production adapter requires an execute function.', { adapterId: adapter?.id ?? null }));
  return { pass: !findings.some((item) => item.severity === 'blocker'), findings };
}

function jobFindings(job, adapter) {
  const findings = [];
  const id = clean(job?.id ?? job?.assetId);
  const operation = clean(job?.operation);
  if (!id) findings.push(finding('blocker', 'production-job-id-missing', 'Production job requires an id.'));
  if (!clean(job?.kind ?? job?.type)) findings.push(finding('blocker', 'production-job-kind-missing', 'Production job requires an artifact kind.', { jobId: id }));
  if (!operation) findings.push(finding('blocker', 'production-job-operation-missing', 'Production job requires an operation.', { jobId: id }));
  if (adapter?.available === false) findings.push(finding('blocker', 'production-adapter-unavailable', 'Selected production adapter is unavailable.', { jobId: id, adapterId: adapter.id }));
  if (operation && !array(adapter?.operations).includes(operation)) findings.push(finding('blocker', 'production-adapter-operation-mismatch', `Adapter '${adapter?.id ?? 'unknown'}' does not support '${operation}'.`, { jobId: id, operation }));
  const capabilities = new Set(array(adapter?.capabilities));
  for (const required of array(job?.requiredCapabilities)) {
    if (!capabilities.has(required)) findings.push(finding('blocker', 'production-adapter-capability-mismatch', `Adapter '${adapter?.id ?? 'unknown'}' lacks '${required}'.`, { jobId: id, capability: required }));
  }
  if (job?.truthSensitive === true && operation === 'generate') {
    findings.push(finding('blocker', 'truth-sensitive-generation-blocked', 'Truth-sensitive final representation cannot be fabricated from scratch.', { jobId: id }));
  }
  if (operation === 'edit' && !array(job?.sourceFiles).some((item) => clean(typeof item === 'string' ? item : item?.ref ?? item?.path ?? item?.url))) {
    findings.push(finding('blocker', 'edit-source-missing', 'Edit operations require at least one real source file/reference.', { jobId: id }));
  }
  return findings;
}

function blockedArtifact(job, adapter, findings) {
  return createArtifact({
    id: clean(job?.id ?? job?.assetId) || 'blocked-production-job',
    version: clean(job?.version) || '1',
    kind: clean(job?.kind ?? job?.type) || 'unknown',
    title: clean(job?.title ?? job?.name ?? job?.id),
    projectId: clean(job?.projectId),
    brandDnaVersion: clean(job?.brandDnaVersion),
    status: 'blocked',
    reviewStatus: 'unreviewed',
    releaseStatus: 'blocked',
    dependencies: array(job?.dependencies),
    source: object(job?.source),
    creator: { type: 'production-adapter', adapterId: clean(adapter?.id), provider: clean(adapter?.provider) },
    recipe: clean(job?.recipe),
    rights: object(job?.rights),
    findings,
    metadata: { operation: clean(job?.operation), requiredCapabilities: array(job?.requiredCapabilities), ...object(job?.metadata) }
  });
}

export async function executeProductionJob({ job = {}, adapter, context = {} } = {}) {
  const normalizedAdapter = adapter?.schema === 'ai-studio-os/production-adapter@1' ? adapter : createProductionAdapter(adapter ?? {});
  const validation = validateProductionAdapter(normalizedAdapter);
  const preflight = [...validation.findings, ...jobFindings(job, normalizedAdapter)];
  if (preflight.some((item) => item.severity === 'blocker')) {
    const artifact = blockedArtifact(job, normalizedAdapter, preflight);
    return { stage: 'production-adapter-execution', status: 'blocked', adapterId: normalizedAdapter.id, artifact, findings: preflight, pass: false };
  }

  let result;
  try {
    result = await normalizedAdapter.execute(structuredClone(job), context);
  } catch (error) {
    const findings = [finding('blocker', 'production-adapter-execution-failed', error instanceof Error ? error.message : String(error), {
      jobId: clean(job.id ?? job.assetId), adapterId: normalizedAdapter.id
    })];
    const artifact = blockedArtifact(job, normalizedAdapter, findings);
    return { stage: 'production-adapter-execution', status: 'blocked', adapterId: normalizedAdapter.id, artifact, findings, pass: false };
  }

  const files = array(result?.files).map(normalizeFile).filter((file) => file.ref);
  const findings = array(result?.findings).map((item) => structuredClone(item));
  if (!files.length) findings.push(finding('blocker', 'adapter-output-file-missing', 'Adapter reported success without a real output file reference.', {
    jobId: clean(job.id ?? job.assetId), adapterId: normalizedAdapter.id
  }));

  const blocked = findings.some((item) => item.severity === 'blocker');
  const artifact = createArtifact({
    id: clean(job.id ?? job.assetId),
    version: clean(job.version) || '1',
    kind: clean(job.kind ?? job.type),
    format: clean(job.format ?? files[0]?.format),
    title: clean(job.title ?? job.name ?? job.id),
    projectId: clean(job.projectId),
    brandDnaVersion: clean(job.brandDnaVersion),
    status: blocked ? 'blocked' : 'produced',
    reviewStatus: 'unreviewed',
    releaseStatus: blocked ? 'blocked' : 'unmeasured',
    source: object(job.source),
    creator: {
      type: 'production-adapter',
      adapterId: normalizedAdapter.id,
      provider: normalizedAdapter.provider,
      model: clean(result?.provenance?.model ?? job?.preferredModel ?? normalizedAdapter.defaultModel)
    },
    recipe: clean(job.recipe),
    dependencies: array(job.dependencies),
    provenance: {
      adapterId: normalizedAdapter.id,
      provider: normalizedAdapter.provider,
      operation: clean(job.operation),
      requestId: clean(result?.provenance?.requestId),
      model: clean(result?.provenance?.model ?? job?.preferredModel ?? normalizedAdapter.defaultModel),
      ...object(result?.provenance)
    },
    rights: { ...object(job.rights), ...object(result?.rights) },
    files,
    previews: array(result?.previews),
    measurements: array(result?.measurements),
    findings,
    cost: object(result?.cost),
    createdAt: result?.createdAt ?? new Date().toISOString(),
    updatedAt: result?.updatedAt ?? result?.createdAt ?? new Date().toISOString(),
    metadata: {
      operation: clean(job.operation),
      requiredCapabilities: array(job.requiredCapabilities),
      adapterMetadata: object(normalizedAdapter.metadata),
      ...object(job.metadata),
      ...object(result?.metadata)
    }
  });

  return {
    stage: 'production-adapter-execution',
    status: artifact.pass && !blocked ? 'produced' : 'blocked',
    adapterId: normalizedAdapter.id,
    artifact,
    findings: artifact.findings,
    pass: artifact.pass && !blocked
  };
}

export async function executeProductionBatch({ jobs = [], assignments = [], adapters = [], context = {} } = {}) {
  const adapterMap = new Map(adapters.map((adapter) => {
    const normalized = adapter?.schema === 'ai-studio-os/production-adapter@1' ? adapter : createProductionAdapter(adapter);
    return [normalized.id, normalized];
  }));
  const assignmentMap = new Map(assignments.map((assignment) => [clean(assignment.assetId ?? assignment.jobId), assignment]));
  const executions = [];

  for (const job of jobs) {
    const id = clean(job.id ?? job.assetId);
    const assignment = assignmentMap.get(id);
    if (!assignment || assignment.action !== 'route' || !clean(assignment.adapterId)) {
      const reason = assignment?.reason ?? 'No routed production adapter assignment exists for this job.';
      const findings = [finding('blocker', 'production-job-not-routed', reason, { jobId: id, action: assignment?.action ?? null })];
      const artifact = blockedArtifact(job, null, findings);
      executions.push({ stage: 'production-adapter-execution', status: 'blocked', adapterId: null, artifact, findings, pass: false });
      continue;
    }
    const adapter = adapterMap.get(clean(assignment.adapterId));
    executions.push(await executeProductionJob({ job: { ...job, preferredModel: job.preferredModel ?? assignment.model }, adapter, context }));
  }

  const artifacts = executions.map((execution) => execution.artifact);
  const graph = buildArtifactGraph(artifacts);
  const findings = [
    ...executions.flatMap((execution) => execution.findings ?? []),
    ...(graph.findings ?? [])
  ];
  const pass = executions.length === jobs.length && executions.every((execution) => execution.pass) && graph.pass;
  return {
    stage: 'production-adapter-batch',
    executions,
    artifacts,
    graph,
    counts: {
      jobs: jobs.length,
      produced: executions.filter((item) => item.status === 'produced').length,
      blocked: executions.filter((item) => item.status === 'blocked').length,
      files: artifacts.reduce((sum, artifact) => sum + array(artifact.files).length, 0)
    },
    findings,
    pass
  };
}
