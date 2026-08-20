const ARTIFACT_STATUSES = new Set([
  'planned',
  'produced',
  'capture-required',
  'review',
  'approved',
  'frozen',
  'stale',
  'blocked',
  'rejected',
  'archived'
]);

const REVIEW_STATES = new Set(['unreviewed', 'needs-revision', 'approved', 'rejected']);
const RELEASE_STATES = new Set(['unmeasured', 'blocked', 'review', 'ready', 'released']);
const DEPENDENCY_IMPACTS = new Set(['stale', 'review', 'none']);
const IMPACT_PRIORITY = Object.freeze({ none: 0, review: 1, stale: 2 });

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) : {};
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? structuredClone(value) : [];
}

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeVersion(value) {
  const version = clean(value ?? '1');
  return version || '1';
}

export function artifactRef(artifactOrId, version) {
  if (typeof artifactOrId === 'string') {
    const id = clean(artifactOrId);
    return id ? `${id}@${normalizeVersion(version)}` : '';
  }
  const id = clean(artifactOrId?.id ?? artifactOrId?.artifactId);
  return id ? `${id}@${normalizeVersion(artifactOrId?.version ?? version)}` : '';
}

export function parseArtifactRef(value) {
  const ref = clean(value);
  const split = ref.lastIndexOf('@');
  if (split <= 0 || split === ref.length - 1) return null;
  return { id: ref.slice(0, split), version: ref.slice(split + 1), ref };
}

function normalizeFile(file) {
  if (typeof file === 'string') {
    return { ref: clean(file), role: 'primary', format: '', hash: '', bytes: null };
  }
  return {
    ref: clean(file?.ref ?? file?.path ?? file?.url),
    role: clean(file?.role ?? 'primary'),
    format: clean(file?.format),
    hash: clean(file?.hash),
    bytes: Number.isFinite(file?.bytes) ? Number(file.bytes) : null
  };
}

function normalizeDependency(dependency) {
  if (typeof dependency === 'string') {
    const parsed = parseArtifactRef(dependency);
    return parsed
      ? { artifactRef: parsed.ref, artifactId: parsed.id, version: parsed.version, relation: 'depends-on', required: true, impact: 'stale' }
      : { artifactRef: '', artifactId: clean(dependency), version: '', relation: 'depends-on', required: true, impact: 'stale' };
  }

  const exact = clean(dependency?.artifactRef ?? dependency?.ref);
  const parsed = exact ? parseArtifactRef(exact) : null;
  return {
    artifactRef: parsed?.ref ?? '',
    artifactId: parsed?.id ?? clean(dependency?.artifactId ?? dependency?.id),
    version: parsed?.version ?? clean(dependency?.version),
    relation: clean(dependency?.relation ?? 'depends-on'),
    required: dependency?.required !== false,
    impact: DEPENDENCY_IMPACTS.has(dependency?.impact) ? dependency.impact : 'stale'
  };
}

export function createArtifact(input = {}) {
  const findings = [];
  const id = clean(input.id ?? input.artifactId);
  const version = normalizeVersion(input.version);
  const kind = clean(input.kind ?? input.type);
  const status = clean(input.status ?? 'planned');
  const reviewStatus = clean(input.reviewStatus ?? 'unreviewed');
  const releaseStatus = clean(input.releaseStatus ?? 'unmeasured');

  const files = arrayOrEmpty(input.files).map(normalizeFile).filter((file) => file.ref);
  const directRef = clean(input.artifactRef ?? input.outputEvidence);
  if (directRef && !files.some((file) => file.ref === directRef)) files.push(normalizeFile(directRef));

  const dependencies = arrayOrEmpty(input.dependencies).map(normalizeDependency);

  if (!id) findings.push(finding('blocker', 'artifact-id-missing', 'Artifact requires a stable id.'));
  if (!kind) findings.push(finding('blocker', 'artifact-kind-missing', 'Artifact requires a kind/type.', { id }));
  if (!ARTIFACT_STATUSES.has(status)) findings.push(finding('blocker', 'artifact-status-invalid', `Unknown artifact status '${status}'.`, { id, status }));
  if (!REVIEW_STATES.has(reviewStatus)) findings.push(finding('blocker', 'artifact-review-status-invalid', `Unknown artifact review status '${reviewStatus}'.`, { id, reviewStatus }));
  if (!RELEASE_STATES.has(releaseStatus)) findings.push(finding('blocker', 'artifact-release-status-invalid', `Unknown artifact release status '${releaseStatus}'.`, { id, releaseStatus }));

  if (['approved', 'frozen'].includes(status) && files.length === 0) {
    findings.push(finding('blocker', 'approved-artifact-file-missing', 'Approved/frozen artifact requires a produced file reference.', { id, version }));
  }

  const self = id ? artifactRef(id, version) : '';
  for (const dependency of dependencies) {
    if (!dependency.artifactId) {
      findings.push(finding('blocker', 'artifact-dependency-id-missing', 'Artifact dependency requires an artifact id or exact artifactRef.', { artifactRef: self }));
      continue;
    }
    if (dependency.artifactRef === self || (!dependency.artifactRef && dependency.artifactId === id && (!dependency.version || dependency.version === version))) {
      findings.push(finding('blocker', 'artifact-self-dependency', 'Artifact cannot depend on itself.', { artifactRef: self }));
    }
  }

  const artifact = {
    schema: 'ai-studio-os/artifact@1',
    id,
    version,
    ref: self,
    kind,
    format: clean(input.format),
    title: clean(input.title ?? input.name ?? id),
    projectId: clean(input.projectId),
    brandDnaVersion: clean(input.brandDnaVersion),
    status,
    reviewStatus,
    releaseStatus,
    source: objectOrEmpty(input.source),
    creator: objectOrEmpty(input.creator),
    recipe: clean(input.recipe),
    dependencies,
    provenance: objectOrEmpty(input.provenance),
    rights: objectOrEmpty(input.rights),
    files,
    previews: arrayOrEmpty(input.previews),
    measurements: arrayOrEmpty(input.measurements),
    reviews: arrayOrEmpty(input.reviews),
    findings: [...arrayOrEmpty(input.findings), ...findings],
    cost: objectOrEmpty(input.cost),
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
    metadata: objectOrEmpty(input.metadata)
  };

  artifact.pass = !artifact.findings.some((item) => item.severity === 'blocker');
  return artifact;
}

function versionParts(value) {
  return normalizeVersion(value).split(/[.-]/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
}

function compareVersions(a, b) {
  const aa = versionParts(a);
  const bb = versionParts(b);
  const length = Math.max(aa.length, bb.length);
  for (let i = 0; i < length; i += 1) {
    const av = aa[i] ?? 0;
    const bv = bb[i] ?? 0;
    if (av === bv) continue;
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv));
  }
  return 0;
}

function resolveDependency(dependency, nodes, latestById) {
  if (dependency.artifactRef) return dependency.artifactRef;
  if (dependency.version) return artifactRef(dependency.artifactId, dependency.version);
  return latestById.get(dependency.artifactId)?.ref ?? artifactRef(dependency.artifactId, '1');
}

function detectCycle(nodes, outgoing) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function walk(ref) {
    if (visiting.has(ref)) {
      const index = stack.indexOf(ref);
      return [...stack.slice(index), ref];
    }
    if (visited.has(ref)) return null;
    visiting.add(ref);
    stack.push(ref);
    for (const edge of outgoing.get(ref) ?? []) {
      if (!nodes.has(edge.to)) continue;
      const cycle = walk(edge.to);
      if (cycle) return cycle;
    }
    stack.pop();
    visiting.delete(ref);
    visited.add(ref);
    return null;
  }

  for (const ref of nodes.keys()) {
    const cycle = walk(ref);
    if (cycle) return cycle;
  }
  return null;
}

function topoSort(nodes, edges) {
  const indegree = new Map([...nodes.keys()].map((ref) => [ref, 0]));
  const outgoing = new Map();
  for (const edge of edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) continue;
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
    outgoing.get(edge.from).push(edge);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
  }
  const queue = [...indegree.entries()].filter(([, count]) => count === 0).map(([ref]) => ref).sort();
  const order = [];
  while (queue.length) {
    const ref = queue.shift();
    order.push(ref);
    for (const edge of outgoing.get(ref) ?? []) {
      const next = (indegree.get(edge.to) ?? 0) - 1;
      indegree.set(edge.to, next);
      if (next === 0) {
        queue.push(edge.to);
        queue.sort();
      }
    }
  }
  return order;
}

export function buildArtifactGraph(inputArtifacts = []) {
  const findings = [];
  const artifacts = inputArtifacts.map((artifact) => artifact?.schema === 'ai-studio-os/artifact@1' ? structuredClone(artifact) : createArtifact(artifact));
  const nodes = new Map();
  const latestById = new Map();

  for (const artifact of artifacts) {
    for (const inherited of artifact.findings ?? []) {
      if (inherited.severity === 'blocker') findings.push(finding('blocker', 'artifact-invalid', inherited.message, { artifactRef: artifact.ref, source: inherited.code }));
    }
    if (!artifact.ref) continue;
    if (nodes.has(artifact.ref)) {
      findings.push(finding('blocker', 'artifact-version-duplicate', `Duplicate artifact version '${artifact.ref}'.`, { artifactRef: artifact.ref }));
      continue;
    }
    nodes.set(artifact.ref, artifact);
    const current = latestById.get(artifact.id);
    if (!current || compareVersions(artifact.version, current.version) > 0) latestById.set(artifact.id, artifact);
  }

  const edges = [];
  for (const artifact of nodes.values()) {
    for (const dependency of artifact.dependencies ?? []) {
      const resolvedRef = resolveDependency(dependency, nodes, latestById);
      const edge = {
        from: resolvedRef,
        to: artifact.ref,
        relation: dependency.relation,
        required: dependency.required,
        impact: dependency.impact,
        requested: dependency.artifactRef || (dependency.version ? artifactRef(dependency.artifactId, dependency.version) : dependency.artifactId)
      };
      edges.push(edge);
      if (!nodes.has(resolvedRef)) {
        findings.push(finding(dependency.required ? 'blocker' : 'risk', 'artifact-dependency-missing', `Dependency '${edge.requested}' required by '${artifact.ref}' is not present in the graph.`, {
          artifactRef: artifact.ref,
          dependency: edge.requested,
          resolvedRef,
          required: dependency.required
        }));
      }
    }
  }

  const outgoing = new Map();
  for (const edge of edges) {
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
    outgoing.get(edge.from).push(edge);
  }

  const cycle = detectCycle(nodes, outgoing);
  if (cycle) findings.push(finding('blocker', 'artifact-dependency-cycle', 'Artifact dependency graph contains a cycle.', { cycle }));

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const graph = {
    schema: 'ai-studio-os/artifact-graph@1',
    status: blockers.length ? 'blocked' : 'ready',
    pass: blockers.length === 0,
    artifacts: [...nodes.values()],
    nodes: Object.fromEntries([...nodes.entries()].map(([ref, artifact]) => [ref, { id: artifact.id, version: artifact.version, kind: artifact.kind, status: artifact.status }])),
    edges,
    latest: Object.fromEntries([...latestById.entries()].map(([id, artifact]) => [id, artifact.ref])),
    topologicalOrder: cycle ? [] : topoSort(nodes, edges),
    counts: {
      artifacts: nodes.size,
      edges: edges.length,
      blockers: blockers.length,
      risks: findings.filter((item) => item.severity === 'risk').length
    },
    findings
  };
  return graph;
}

function resolveChangedRef(graph, value) {
  const exact = parseArtifactRef(value);
  if (exact) return exact.ref;
  return graph.latest?.[clean(value)] ?? '';
}

function strongerImpact(a, b) {
  return IMPACT_PRIORITY[a] >= IMPACT_PRIORITY[b] ? a : b;
}

export function planArtifactChange({ graph, changedRefs = [] } = {}) {
  const findings = [];
  if (!graph || graph.schema !== 'ai-studio-os/artifact-graph@1') {
    return { stage: 'artifact-change-plan', changed: [], impacts: [], findings: [finding('blocker', 'artifact-graph-missing', 'A valid Artifact Graph is required.')], pass: false };
  }

  const nodeMap = new Map((graph.artifacts ?? []).map((artifact) => [artifact.ref, artifact]));
  const outgoing = new Map();
  for (const edge of graph.edges ?? []) {
    if (!outgoing.has(edge.from)) outgoing.set(edge.from, []);
    outgoing.get(edge.from).push(edge);
  }

  const changed = [];
  const queue = [];
  for (const requested of changedRefs) {
    const resolved = resolveChangedRef(graph, requested);
    if (!resolved || !nodeMap.has(resolved)) {
      findings.push(finding('blocker', 'changed-artifact-not-found', `Changed artifact '${requested}' is not present in the graph.`, { requested }));
      continue;
    }
    if (!changed.includes(resolved)) changed.push(resolved);
    queue.push({ ref: resolved, depth: 0 });
  }

  const impactByRef = new Map();
  while (queue.length) {
    const current = queue.shift();
    for (const edge of outgoing.get(current.ref) ?? []) {
      if (edge.impact === 'none' || !nodeMap.has(edge.to)) continue;
      const previous = impactByRef.get(edge.to);
      const nextImpact = previous ? strongerImpact(previous.impact, edge.impact) : edge.impact;
      const depth = previous ? Math.min(previous.depth, current.depth + 1) : current.depth + 1;
      const reasons = previous?.reasons ?? [];
      const reason = { from: current.ref, relation: edge.relation, impact: edge.impact };
      if (!reasons.some((item) => item.from === reason.from && item.relation === reason.relation && item.impact === reason.impact)) reasons.push(reason);
      const changedImpact = !previous || nextImpact !== previous.impact;
      impactByRef.set(edge.to, { artifactRef: edge.to, impact: nextImpact, depth, reasons });
      if (changedImpact) queue.push({ ref: edge.to, depth });
    }
  }

  const impacts = [...impactByRef.values()]
    .filter((item) => !changed.includes(item.artifactRef))
    .map((item) => {
      const artifact = nodeMap.get(item.artifactRef);
      return {
        artifactRef: item.artifactRef,
        artifactId: artifact.id,
        version: artifact.version,
        kind: artifact.kind,
        currentStatus: artifact.status,
        requiredState: item.impact === 'stale' ? 'stale' : 'review',
        depth: item.depth,
        reasons: item.reasons
      };
    })
    .sort((a, b) => a.depth - b.depth || a.artifactRef.localeCompare(b.artifactRef));

  return {
    stage: 'artifact-change-plan',
    status: findings.some((item) => item.severity === 'blocker') ? 'blocked' : 'ready',
    changed,
    impacts,
    counts: {
      changed: changed.length,
      stale: impacts.filter((item) => item.requiredState === 'stale').length,
      review: impacts.filter((item) => item.requiredState === 'review').length
    },
    findings,
    pass: !findings.some((item) => item.severity === 'blocker')
  };
}

export function artifactFromAssetRegistryEntry(entry = {}) {
  const dependencies = [
    ...(Array.isArray(entry.dependencies) ? entry.dependencies.map((dependency) => ({ artifactId: clean(dependency), relation: 'depends-on', required: true, impact: 'stale' })) : []),
    ...(Array.isArray(entry.sourceAssetIds) ? entry.sourceAssetIds.map((dependency) => ({ artifactId: clean(dependency), relation: 'derived-from', required: true, impact: 'stale' })) : [])
  ].filter((dependency) => dependency.artifactId);

  const reviewStatus = REVIEW_STATES.has(entry.reviewStatus) ? entry.reviewStatus : 'unreviewed';
  let status = clean(entry.status ?? 'planned');
  if (status === 'produced' && reviewStatus === 'approved') status = 'approved';
  if (!ARTIFACT_STATUSES.has(status)) status = 'planned';

  return createArtifact({
    id: entry.assetId,
    version: String(entry.version ?? 1),
    kind: entry.type ?? 'asset',
    title: entry.purpose ?? entry.assetId,
    status,
    reviewStatus,
    releaseStatus: 'unmeasured',
    source: {
      adapterId: entry.adapterId ?? null,
      provider: entry.provider ?? null,
      model: entry.model ?? null,
      evidenceRef: entry.sourceEvidence ?? null
    },
    dependencies,
    provenance: {
      continuityId: entry.continuityId ?? null,
      directionRef: entry.directionRef ?? null,
      instructionRef: entry.instructionRef ?? null,
      truthSensitive: Boolean(entry.truthSensitive),
      sourceEvidence: entry.sourceEvidence ?? null
    },
    rights: { status: entry.rightsStatus ?? 'unresolved' },
    files: entry.outputEvidence ? [{ ref: entry.outputEvidence, role: 'primary', hash: entry.artifactHash ?? '' }] : [],
    cost: entry.cost ?? {},
    createdAt: entry.createdAt ?? null,
    metadata: {
      operation: entry.operation ?? null,
      patchAttempts: entry.patchAttempts ?? 0,
      legacyAssetRegistry: true
    }
  });
}

export { ARTIFACT_STATUSES, REVIEW_STATES, RELEASE_STATES, DEPENDENCY_IMPACTS };
