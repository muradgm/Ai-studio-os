import { createArtifact, buildArtifactGraph } from '../../modules/artifact-graph/runtime.mjs';
import { createCommandCenterArtifactState } from '../../modules/command-center-state/runtime.mjs';

function stepState(job, id) {
  return job?.steps?.find((step) => step.id === id)?.status ?? 'waiting';
}

function artifactStatus(step, { approved = false } = {}) {
  if (approved) return 'approved';
  if (['failed', 'blocked'].includes(step)) return 'blocked';
  if (['passed', 'ready'].includes(step)) return 'produced';
  if (step === 'approved') return 'approved';
  return 'planned';
}

function reviewStatus(step) {
  if (['failed', 'blocked'].includes(step)) return 'needs-revision';
  if (['passed', 'approved'].includes(step)) return 'approved';
  if (step === 'ready') return 'needs-revision';
  return 'unreviewed';
}

function screenshotFiles(job) {
  return (job?.artifacts?.captures ?? []).map((capture) => ({
    ref: capture.screenshot,
    role: capture.reducedMotion ? 'reduced-motion-capture' : 'browser-capture',
    format: 'png'
  })).filter((file) => file.ref);
}

function evidenceMeasurements(job) {
  return Object.entries(job?.evidence ?? {}).map(([type, value]) => ({ type, value }));
}

function baseProjectArtifacts(projectId) {
  const build = createArtifact({
    id: `${projectId}:build`, version: '1', kind: 'web/build', title: 'Production Build', projectId,
    status: 'planned', reviewStatus: 'unreviewed', releaseStatus: 'unmeasured'
  });
  const capture = createArtifact({
    id: `${projectId}:captures`, version: '1', kind: 'web/capture', title: 'Browser Captures', projectId,
    status: 'planned', reviewStatus: 'unreviewed', releaseStatus: 'unmeasured',
    dependencies: [{ artifactRef: build.ref, relation: 'captures', required: true, impact: 'stale' }]
  });
  const review = createArtifact({
    id: `${projectId}:release-evidence`, version: '1', kind: 'evidence/release', title: 'Release Evidence', projectId,
    status: 'planned', reviewStatus: 'unreviewed', releaseStatus: 'unmeasured',
    dependencies: [{ artifactRef: capture.ref, relation: 'measures', required: true, impact: 'stale' }]
  });
  const patch = createArtifact({
    id: `${projectId}:patch-queue`, version: '1', kind: 'review/patch-queue', title: 'Patch Queue', projectId,
    status: 'planned', reviewStatus: 'unreviewed', releaseStatus: 'unmeasured',
    dependencies: [{ artifactRef: review.ref, relation: 'responds-to', required: true, impact: 'stale' }]
  });
  const approval = createArtifact({
    id: `${projectId}:iteration-approval`, version: '1', kind: 'decision/approval', title: 'Iteration Approval', projectId,
    status: 'planned', reviewStatus: 'unreviewed', releaseStatus: 'unmeasured',
    dependencies: [
      { artifactRef: review.ref, relation: 'considers', required: true, impact: 'review' },
      { artifactRef: patch.ref, relation: 'considers', required: true, impact: 'review' }
    ]
  });
  return [build, capture, review, patch, approval];
}

export function createExecutionArtifactGraph(job, { projectId = job?.projectId ?? 'creative-agency' } = {}) {
  if (!job) return buildArtifactGraph(baseProjectArtifacts(projectId));

  const version = String(Number(job.iteration ?? 0) + 1);
  const buildStep = stepState(job, 'build');
  const captureStep = stepState(job, 'capture');
  const reviewStep = stepState(job, 'review');
  const patchStep = stepState(job, 'patch');
  const approvalStep = stepState(job, 'approve');

  const build = createArtifact({
    id: `${projectId}:build`, version, kind: 'web/build', title: 'Production Build', projectId,
    status: artifactStatus(buildStep), reviewStatus: reviewStatus(buildStep), releaseStatus: 'unmeasured',
    previews: job.artifacts?.previewUrl ? [{ ref: job.artifacts.previewUrl, role: 'live-preview' }] : [],
    source: { executionJobId: job.id, selectedDirectionId: job.directionSelection?.selectedDirectionId ?? null }
  });

  const capture = createArtifact({
    id: `${projectId}:captures`, version, kind: 'web/capture', title: 'Browser Captures', projectId,
    status: artifactStatus(captureStep), reviewStatus: reviewStatus(captureStep), releaseStatus: 'unmeasured',
    files: screenshotFiles(job),
    dependencies: [{ artifactRef: build.ref, relation: 'captures', required: true, impact: 'stale' }],
    source: { executionJobId: job.id, selectedDirectionId: job.directionSelection?.selectedDirectionId ?? null }
  });

  const releaseReady = job.releaseDecision?.productionReady === true || job.releaseDecision?.status === 'ready';
  const review = createArtifact({
    id: `${projectId}:release-evidence`, version, kind: 'evidence/release', title: 'Release Evidence', projectId,
    status: releaseReady ? 'approved' : artifactStatus(reviewStep),
    reviewStatus: releaseReady ? 'approved' : reviewStatus(reviewStep),
    releaseStatus: releaseReady ? 'ready' : job.releaseDecision?.status === 'blocked' ? 'blocked' : 'unmeasured',
    files: job.artifacts?.reportUrl ? [{ ref: job.artifacts.reportUrl, role: 'release-report', format: 'json' }] : [],
    measurements: evidenceMeasurements(job), findings: job.findings ?? [],
    dependencies: [{ artifactRef: capture.ref, relation: 'measures', required: true, impact: 'stale' }],
    source: { executionJobId: job.id, selectedDirectionId: job.directionSelection?.selectedDirectionId ?? null }
  });

  const patches = job.patches ?? [];
  const patch = createArtifact({
    id: `${projectId}:patch-queue`, version, kind: 'review/patch-queue', title: 'Patch Queue', projectId,
    status: patches.length ? 'review' : artifactStatus(patchStep),
    reviewStatus: patches.length ? 'needs-revision' : reviewStatus(patchStep), releaseStatus: 'unmeasured',
    findings: job.findings ?? [], metadata: { patches },
    dependencies: [{ artifactRef: review.ref, relation: 'responds-to', required: true, impact: 'stale' }],
    source: { executionJobId: job.id, selectedDirectionId: job.directionSelection?.selectedDirectionId ?? null }
  });

  const approved = job.approval === 'iteration-approved' || approvalStep === 'approved';
  const approval = createArtifact({
    id: `${projectId}:iteration-approval`, version, kind: 'decision/approval', title: 'Iteration Approval', projectId,
    status: approved && job.artifacts?.reportUrl ? 'approved' : approved ? 'produced' : artifactStatus(approvalStep),
    reviewStatus: approved ? 'approved' : reviewStatus(approvalStep),
    releaseStatus: approved && job.productionReady ? 'ready' : 'unmeasured',
    files: approved && job.artifacts?.reportUrl ? [{ ref: job.artifacts.reportUrl, role: 'approval-evidence', format: 'json' }] : [],
    dependencies: [
      { artifactRef: review.ref, relation: 'considers', required: true, impact: 'review' },
      { artifactRef: patch.ref, relation: 'considers', required: true, impact: 'review' }
    ],
    metadata: { approvedAt: job.approvedAt ?? null, productionReady: Boolean(job.productionReady) },
    source: { executionJobId: job.id, selectedDirectionId: job.directionSelection?.selectedDirectionId ?? null }
  });

  return buildArtifactGraph([build, capture, review, patch, approval]);
}

export function createExecutionCommandCenterState(job, options = {}) {
  const projectId = options.projectId ?? job?.projectId ?? 'creative-agency';
  const graph = createExecutionArtifactGraph(job, { projectId });
  const state = createCommandCenterArtifactState({ graph, projectId, limit: options.limit ?? 20 });
  return { graph, state, jobId: job?.id ?? null };
}
