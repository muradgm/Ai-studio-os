import { createArtifact, buildArtifactGraph, artifactRef } from '../artifact-graph/runtime.mjs';

const APPROVED = new Set(['approved', 'frozen']);

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeVersion(value, fallback = '1.0.0') {
  const version = clean(value);
  return version || fallback;
}

function artifactStatus(status, hasFile) {
  const value = clean(status);
  if (value === 'frozen') return 'frozen';
  if (value === 'approved') return 'approved';
  if (value === 'rejected') return 'rejected';
  if (value === 'blocked') return 'blocked';
  if (value === 'review' || value === 'review-candidate') return 'review';
  if (value === 'stale') return 'stale';
  if (value === 'planned') return 'planned';
  return hasFile ? 'produced' : 'planned';
}

function reviewStatus(status, review = {}) {
  const explicit = clean(review.status);
  if (['unreviewed', 'needs-revision', 'approved', 'rejected'].includes(explicit)) return explicit;
  if (APPROVED.has(status)) return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'unreviewed';
}

function reviewRecords(review = {}) {
  if (!review || typeof review !== 'object' || Array.isArray(review)) return [];
  return Object.entries(review)
    .filter(([key]) => key !== 'status')
    .map(([type, status]) => ({ type, status }));
}

function primaryFile(ref, format = '') {
  const value = clean(ref);
  return value ? [{ ref: value, role: 'primary', format: clean(format) }] : [];
}

function brandDnaArtifact(brandDNA = {}, manifest = {}) {
  const brandId = clean(brandDNA.brandId ?? manifest.brandId) || 'unbound-brand';
  const version = normalizeVersion(brandDNA.version ?? manifest.brandDnaVersion);
  const approved = APPROVED.has(clean(brandDNA.status));

  return createArtifact({
    id: `brand-dna:${brandId}`,
    version,
    kind: 'brand-dna',
    title: `${brandId} Brand DNA`,
    projectId: brandId,
    brandDnaVersion: version,
    // Brand DNA is structured runtime state, not necessarily a file. Keep the node
    // produced even when the source contract is approved/frozen, and carry approval
    // in reviewStatus/metadata rather than fabricating a file reference.
    status: 'produced',
    reviewStatus: approved ? 'approved' : 'unreviewed',
    releaseStatus: 'unmeasured',
    provenance: brandDNA.provenance ?? {},
    metadata: {
      sourceSchema: brandDNA.schema ?? 'ai-studio-os/brand-dna@1',
      sourceStatus: clean(brandDNA.status || 'draft'),
      strategy: brandDNA.strategy ?? {},
      creativeDirection: brandDNA.creativeDirection ?? {},
      voice: brandDNA.voice ?? {},
      color: brandDNA.color ?? {},
      typography: brandDNA.typography ?? {},
      geometry: brandDNA.geometry ?? {},
      imagery: brandDNA.imagery ?? {},
      motion: brandDNA.motion ?? {},
      iconDNA: brandDNA.iconDNA ?? {},
      unresolved: brandDNA.unresolved ?? []
    },
    findings: brandDNA.findings ?? []
  });
}

function assetArtifact(asset = {}, context = {}) {
  const hasFile = Boolean(clean(asset.artifactRef));
  const status = artifactStatus(asset.status, hasFile);
  const version = normalizeVersion(asset.version);
  const dependencies = [
    {
      artifactRef: context.brandDnaRef,
      relation: 'inherits-brand-dna',
      required: true,
      impact: 'stale'
    }
  ];

  for (const dependency of asset.metadata?.artifactDependencies ?? []) {
    if (typeof dependency === 'string') {
      dependencies.push({ artifactId: dependency, relation: 'depends-on', required: true, impact: 'stale' });
    } else if (dependency && typeof dependency === 'object') {
      dependencies.push(dependency);
    }
  }

  return createArtifact({
    id: clean(asset.id),
    version,
    kind: `brand/${clean(asset.category) || 'asset'}`,
    title: clean(asset.name ?? asset.id ?? asset.category),
    projectId: context.brandId,
    brandDnaVersion: clean(asset.brandDnaVersion ?? context.brandDnaVersion),
    status,
    reviewStatus: reviewStatus(clean(asset.status), asset.review),
    releaseStatus: 'unmeasured',
    recipe: context.recipe,
    dependencies,
    provenance: asset.provenance ?? {},
    rights: asset.rights ?? {},
    files: primaryFile(asset.artifactRef, asset.metadata?.format),
    reviews: reviewRecords(asset.review),
    metadata: {
      category: clean(asset.category),
      integrity: asset.integrity ?? {},
      ...asset.metadata
    }
  });
}

function addGuidelinesDependencies(artifacts) {
  const identityArtifacts = artifacts.filter((artifact) => artifact.kind.startsWith('brand/') && artifact.kind !== 'brand/guidelines');
  return artifacts.map((artifact) => {
    if (artifact.kind !== 'brand/guidelines') return artifact;
    const dependencies = [
      ...artifact.dependencies,
      ...identityArtifacts.map((source) => ({
        artifactRef: source.ref,
        relation: 'documents',
        required: true,
        impact: 'stale'
      }))
    ];
    return createArtifact({ ...artifact, dependencies });
  });
}

function applicationArtifact(application = {}, context = {}) {
  const appId = clean(application.id ?? application.name) || 'application';
  const version = normalizeVersion(application.version);
  const fileRef = clean(application.artifactRef);
  const status = artifactStatus(application.status, Boolean(fileRef));
  const dependencies = [
    {
      artifactRef: context.brandDnaRef,
      relation: 'inherits-brand-dna',
      required: true,
      impact: 'stale'
    },
    ...context.identityArtifacts
      .filter((artifact) => ['approved', 'frozen', 'produced', 'review'].includes(artifact.status))
      .map((artifact) => ({
        artifactRef: artifact.ref,
        relation: 'applies',
        required: true,
        impact: 'review'
      }))
  ];

  return createArtifact({
    id: `application:${appId}`,
    version,
    kind: 'brand/application',
    title: clean(application.name ?? appId),
    projectId: context.brandId,
    brandDnaVersion: clean(application.brandDnaVersion ?? context.brandDnaVersion),
    status,
    reviewStatus: reviewStatus(clean(application.status), application.review),
    releaseStatus: 'unmeasured',
    recipe: context.recipe,
    dependencies,
    files: primaryFile(fileRef),
    reviews: reviewRecords(application.review),
    metadata: {
      sourceApplicationId: appId,
      ...(application.metadata ?? {})
    }
  });
}

function manifestArtifact(manifest = {}, review = {}, delivery = {}, context = {}) {
  const version = normalizeVersion(manifest.version ?? manifest.brandDnaVersion);
  const dependencies = [
    { artifactRef: context.brandDnaRef, relation: 'binds-brand-dna', required: true, impact: 'stale' },
    ...context.identityArtifacts.map((artifact) => ({ artifactRef: artifact.ref, relation: 'contains', required: true, impact: 'stale' })),
    ...context.applications.map((artifact) => ({ artifactRef: artifact.ref, relation: 'proves-in-application', required: true, impact: 'stale' }))
  ];

  const productionReady = review?.productionReady === true && delivery?.status === 'ready-to-package';
  return createArtifact({
    id: clean(manifest.id) || `${context.brandId}-brand-kit`,
    version,
    kind: 'brand-kit-manifest',
    title: `${context.brandId} Brand Kit`,
    projectId: context.brandId,
    brandDnaVersion: context.brandDnaVersion,
    status: productionReady ? 'approved' : review?.status === 'blocked' ? 'blocked' : 'review',
    reviewStatus: productionReady ? 'approved' : 'unreviewed',
    releaseStatus: productionReady ? 'ready' : 'blocked',
    recipe: context.recipe,
    dependencies,
    // The manifest is structured state. Delivery files live on the contained artifacts,
    // so do not fabricate a package file before packaging actually occurs.
    metadata: {
      requiredCategories: manifest.requiredCategories ?? [],
      legal: manifest.legal ?? {},
      reviewStatus: review?.status ?? null,
      reviewCounts: review?.counts ?? {},
      deliveryStatus: delivery?.status ?? null,
      deliveryFiles: delivery?.files ?? []
    },
    findings: review?.findings ?? []
  });
}

export function createBrandKitArtifactGraph({ brandDNA, manifest, review, delivery, recipe = 'brand-identity-kit-recipe' } = {}) {
  const dna = brandDnaArtifact(brandDNA, manifest);
  const brandId = clean(manifest?.brandId ?? brandDNA?.brandId) || 'unbound-brand';
  const brandDnaVersion = normalizeVersion(manifest?.brandDnaVersion ?? brandDNA?.version);

  let identityArtifacts = (manifest?.assets ?? []).map((asset) => assetArtifact(asset, {
    brandId,
    brandDnaVersion,
    brandDnaRef: dna.ref,
    recipe
  }));
  identityArtifacts = addGuidelinesDependencies(identityArtifacts);

  const applications = (manifest?.applications ?? []).map((application) => applicationArtifact(application, {
    brandId,
    brandDnaVersion,
    brandDnaRef: dna.ref,
    identityArtifacts,
    recipe
  }));

  const manifestNode = manifestArtifact(manifest, review, delivery, {
    brandId,
    brandDnaVersion,
    brandDnaRef: dna.ref,
    identityArtifacts,
    applications,
    recipe
  });

  const graph = buildArtifactGraph([dna, ...identityArtifacts, ...applications, manifestNode]);
  return {
    stage: 'brand-kit-artifact-graph',
    brandDnaRef: dna.ref,
    manifestRef: manifestNode.ref,
    graph,
    counts: {
      identityArtifacts: identityArtifacts.length,
      applications: applications.length,
      graphArtifacts: graph.counts.artifacts,
      graphEdges: graph.counts.edges
    },
    findings: graph.findings,
    pass: graph.pass
  };
}

export function brandKitArtifactRefs(bundle = {}) {
  const graph = bundle.graph;
  if (!graph || graph.schema !== 'ai-studio-os/artifact-graph@1') return {};
  return {
    brandDNA: bundle.brandDnaRef,
    manifest: bundle.manifestRef,
    latest: graph.latest,
    ordered: graph.topologicalOrder
  };
}

export { artifactRef };
