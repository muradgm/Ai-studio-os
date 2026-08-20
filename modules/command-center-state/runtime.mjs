import { planArtifactChange } from '../artifact-graph/runtime.mjs';

const QUEUE_PRIORITY = Object.freeze({
  blocked: 0,
  stale: 1,
  review: 2,
  queued: 3,
  produced: 4,
  approved: 5,
  released: 6
});

function clean(value) {
  return String(value ?? '').trim();
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function countSeverity(findings = [], severity) {
  return findings.filter((item) => item?.severity === severity).length;
}

function currentArtifacts(graph) {
  const byRef = new Map((graph?.artifacts ?? []).map((artifact) => [artifact.ref, artifact]));
  return Object.values(graph?.latest ?? {})
    .map((ref) => byRef.get(ref))
    .filter(Boolean);
}

function sourceState(artifact) {
  const status = clean(artifact?.status);
  const reviewStatus = clean(artifact?.reviewStatus);
  const releaseStatus = clean(artifact?.releaseStatus);
  const blockers = countSeverity(artifact?.findings ?? [], 'blocker');

  if (blockers > 0 || status === 'blocked' || status === 'rejected' || releaseStatus === 'blocked') return 'blocked';
  if (status === 'stale') return 'stale';
  if (status === 'review' || reviewStatus === 'needs-revision' || reviewStatus === 'unreviewed') {
    if (status === 'planned' || status === 'capture-required') return 'queued';
    return 'review';
  }
  if (status === 'planned' || status === 'capture-required') return 'queued';
  if (status === 'produced') return 'produced';
  if ((status === 'approved' || status === 'frozen') && (releaseStatus === 'released')) return 'released';
  if (status === 'approved' || status === 'frozen') return 'approved';
  if (releaseStatus === 'released') return 'released';
  return 'produced';
}

function impactMap(changePlan) {
  const map = new Map();
  for (const item of changePlan?.impacts ?? []) {
    map.set(item.artifactRef, item);
  }
  return map;
}

function effectiveState(artifact, impact) {
  const source = sourceState(artifact);
  if (source === 'blocked') return 'blocked';
  if (impact?.requiredState === 'stale') return 'stale';
  if (impact?.requiredState === 'review' && !['stale', 'blocked'].includes(source)) return 'review';
  return source;
}

function evidenceCounts(artifact) {
  return {
    files: Array.isArray(artifact?.files) ? artifact.files.length : 0,
    previews: Array.isArray(artifact?.previews) ? artifact.previews.length : 0,
    reviews: Array.isArray(artifact?.reviews) ? artifact.reviews.length : 0,
    measurements: Array.isArray(artifact?.measurements) ? artifact.measurements.length : 0,
    findings: Array.isArray(artifact?.findings) ? artifact.findings.length : 0,
    blockers: countSeverity(artifact?.findings ?? [], 'blocker'),
    majors: countSeverity(artifact?.findings ?? [], 'major')
  };
}

function normalizeKindFilters(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(clean).filter(Boolean))];
}

function matchesFilters(artifact, { projectId, kinds } = {}) {
  if (projectId && clean(artifact?.projectId) !== projectId) return false;
  if (!kinds.length) return true;
  const kind = clean(artifact?.kind);
  return kinds.some((candidate) => kind === candidate || kind.startsWith(`${candidate}/`));
}

function queueItem(artifact, impact) {
  const state = effectiveState(artifact, impact);
  const counts = evidenceCounts(artifact);
  return {
    artifactRef: artifact.ref,
    artifactId: artifact.id,
    version: artifact.version,
    kind: artifact.kind,
    title: artifact.title || artifact.id,
    projectId: artifact.projectId || null,
    brandDnaVersion: artifact.brandDnaVersion || null,
    state,
    sourceStatus: artifact.status,
    reviewStatus: artifact.reviewStatus,
    releaseStatus: artifact.releaseStatus,
    evidence: counts,
    dependencyCount: Array.isArray(artifact.dependencies) ? artifact.dependencies.length : 0,
    impact: impact ? {
      requiredState: impact.requiredState,
      depth: impact.depth,
      reasons: impact.reasons ?? []
    } : null
  };
}

function releaseState(items, graph) {
  if (graph?.status === 'blocked' || items.some((item) => item.state === 'blocked')) return 'blocked';
  if (items.some((item) => ['stale', 'review', 'queued', 'produced'].includes(item.state))) return 'review';
  if (!items.length) return 'unmeasured';
  if (items.every((item) => item.state === 'released')) return 'ready';
  if (items.every((item) => ['approved', 'released'].includes(item.state))) {
    const allMeasured = items.every((item) => ['ready', 'released'].includes(item.releaseStatus));
    return allMeasured ? 'ready' : 'unmeasured';
  }
  return 'unmeasured';
}

export function createCommandCenterArtifactState({
  graph,
  changedRefs = [],
  projectId = '',
  kinds = [],
  limit = 50
} = {}) {
  const findings = [];
  if (!graph || graph.schema !== 'ai-studio-os/artifact-graph@1') {
    return {
      schema: 'ai-studio-os/command-center-state@1',
      status: 'blocked',
      releaseState: 'blocked',
      queue: [],
      counts: { artifacts: 0, blockers: 1 },
      findings: [finding('blocker', 'command-center-artifact-graph-missing', 'Command Center requires a valid Artifact Graph.')],
      pass: false
    };
  }

  if (graph.status === 'blocked' || graph.pass === false) {
    findings.push(finding('blocker', 'command-center-artifact-graph-blocked', 'Artifact Graph is blocked and cannot be represented as healthy production state.', {
      graphBlockers: graph.counts?.blockers ?? null
    }));
  }

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 50;
  const filterProject = clean(projectId);
  const filterKinds = normalizeKindFilters(kinds);
  const changePlan = changedRefs.length ? planArtifactChange({ graph, changedRefs }) : null;
  if (changePlan && !changePlan.pass) {
    for (const item of changePlan.findings ?? []) findings.push(item);
  }
  const impacts = impactMap(changePlan);

  const artifacts = currentArtifacts(graph)
    .filter((artifact) => matchesFilters(artifact, { projectId: filterProject, kinds: filterKinds }));

  const allItems = artifacts.map((artifact) => queueItem(artifact, impacts.get(artifact.ref)));
  allItems.sort((a, b) => {
    const priority = QUEUE_PRIORITY[a.state] - QUEUE_PRIORITY[b.state];
    if (priority !== 0) return priority;
    const kindOrder = clean(a.kind).localeCompare(clean(b.kind));
    if (kindOrder !== 0) return kindOrder;
    return a.artifactRef.localeCompare(b.artifactRef);
  });

  const queue = allItems.slice(0, safeLimit);
  const state = releaseState(allItems, graph);
  const counts = {
    artifacts: allItems.length,
    queued: allItems.filter((item) => item.state === 'queued').length,
    produced: allItems.filter((item) => item.state === 'produced').length,
    review: allItems.filter((item) => item.state === 'review').length,
    stale: allItems.filter((item) => item.state === 'stale').length,
    blocked: allItems.filter((item) => item.state === 'blocked').length,
    approved: allItems.filter((item) => item.state === 'approved').length,
    released: allItems.filter((item) => item.state === 'released').length,
    files: allItems.reduce((sum, item) => sum + item.evidence.files, 0),
    reviews: allItems.reduce((sum, item) => sum + item.evidence.reviews, 0),
    measurements: allItems.reduce((sum, item) => sum + item.evidence.measurements, 0),
    blockers: findings.filter((item) => item.severity === 'blocker').length + allItems.reduce((sum, item) => sum + item.evidence.blockers, 0)
  };

  return {
    schema: 'ai-studio-os/command-center-state@1',
    status: findings.some((item) => item.severity === 'blocker') ? 'blocked' : 'ready',
    releaseState: state,
    filters: {
      projectId: filterProject || null,
      kinds: filterKinds,
      limit: safeLimit
    },
    queue,
    changePlan: changePlan ? {
      changed: changePlan.changed,
      impacts: changePlan.impacts,
      counts: changePlan.counts
    } : null,
    counts,
    findings,
    pass: !findings.some((item) => item.severity === 'blocker')
  };
}

export { QUEUE_PRIORITY };
