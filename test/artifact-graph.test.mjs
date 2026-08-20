import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createArtifact,
  buildArtifactGraph,
  planArtifactChange,
  artifactFromAssetRegistryEntry
} from '../modules/artifact-graph/runtime.mjs';

test('approved artifacts fail closed without a produced file reference', () => {
  const artifact = createArtifact({ id: 'logo-primary', kind: 'logo', version: '1.0.0', status: 'approved' });
  assert.equal(artifact.pass, false);
  assert.ok(artifact.findings.some((item) => item.code === 'approved-artifact-file-missing'));
});

test('artifact graph resolves latest-version dependencies and produces deterministic order', () => {
  const graph = buildArtifactGraph([
    createArtifact({ id: 'brand-dna', version: '1.0.0', kind: 'brand-dna', status: 'produced', files: ['artifacts/brand-dna-v1.json'] }),
    createArtifact({ id: 'brand-dna', version: '1.1.0', kind: 'brand-dna', status: 'produced', files: ['artifacts/brand-dna-v1.1.json'] }),
    createArtifact({
      id: 'logo-geometry', version: '2.0.0', kind: 'vector-spec', status: 'produced', files: ['artifacts/logo-geometry-v2.json'],
      dependencies: [{ artifactId: 'brand-dna', relation: 'implements', impact: 'review' }]
    }),
    createArtifact({
      id: 'logo-primary', version: '2.0.0', kind: 'logo', status: 'approved', files: ['artifacts/logo-primary-v2.svg'],
      dependencies: [{ artifactRef: 'logo-geometry@2.0.0', relation: 'renders', impact: 'stale' }]
    })
  ]);

  assert.equal(graph.pass, true);
  assert.equal(graph.latest['brand-dna'], 'brand-dna@1.1.0');
  assert.ok(graph.edges.some((edge) => edge.from === 'brand-dna@1.1.0' && edge.to === 'logo-geometry@2.0.0'));
  assert.ok(graph.topologicalOrder.indexOf('brand-dna@1.1.0') < graph.topologicalOrder.indexOf('logo-geometry@2.0.0'));
  assert.ok(graph.topologicalOrder.indexOf('logo-geometry@2.0.0') < graph.topologicalOrder.indexOf('logo-primary@2.0.0'));
});

test('missing required dependencies block while optional dependencies stay visible as risk', () => {
  const graph = buildArtifactGraph([
    createArtifact({
      id: 'guidelines', kind: 'document', status: 'produced', files: ['artifacts/guidelines.html'],
      dependencies: [
        { artifactId: 'logo-primary', required: true },
        { artifactId: 'social-template', required: false, impact: 'review' }
      ]
    })
  ]);

  assert.equal(graph.pass, false);
  assert.ok(graph.findings.some((item) => item.code === 'artifact-dependency-missing' && item.severity === 'blocker'));
  assert.ok(graph.findings.some((item) => item.code === 'artifact-dependency-missing' && item.severity === 'risk'));
});

test('dependency cycles fail closed', () => {
  const graph = buildArtifactGraph([
    createArtifact({ id: 'a', kind: 'spec', status: 'produced', files: ['a.json'], dependencies: [{ artifactId: 'b' }] }),
    createArtifact({ id: 'b', kind: 'spec', status: 'produced', files: ['b.json'], dependencies: [{ artifactId: 'a' }] })
  ]);

  assert.equal(graph.pass, false);
  assert.ok(graph.findings.some((item) => item.code === 'artifact-dependency-cycle'));
  assert.deepEqual(graph.topologicalOrder, []);
});

test('upstream changes propagate stale/review requirements without mutating descendants', () => {
  const graph = buildArtifactGraph([
    createArtifact({ id: 'logo-geometry', version: '4', kind: 'vector-spec', status: 'approved', files: ['geometry-v4.json'] }),
    createArtifact({
      id: 'logo-primary', version: '4', kind: 'logo', status: 'approved', files: ['logo-v4.svg'],
      dependencies: [{ artifactId: 'logo-geometry', relation: 'renders', impact: 'stale' }]
    }),
    createArtifact({
      id: 'icon-dna', version: '2', kind: 'icon-dna', status: 'approved', files: ['icon-dna-v2.json'],
      dependencies: [{ artifactId: 'logo-geometry', relation: 'inherits-geometry', impact: 'review' }]
    }),
    createArtifact({
      id: 'favicon', version: '4', kind: 'icon', status: 'approved', files: ['favicon-v4.svg'],
      dependencies: [{ artifactId: 'logo-primary', relation: 'derived-from', impact: 'stale' }]
    }),
    createArtifact({
      id: 'guidelines', version: '3', kind: 'document', status: 'approved', files: ['guidelines-v3.pdf'],
      dependencies: [
        { artifactId: 'logo-primary', relation: 'documents', impact: 'stale' },
        { artifactId: 'icon-dna', relation: 'documents', impact: 'stale' }
      ]
    })
  ]);

  assert.equal(graph.pass, true);
  const plan = planArtifactChange({ graph, changedRefs: ['logo-geometry'] });
  assert.equal(plan.pass, true);
  assert.deepEqual(plan.changed, ['logo-geometry@4']);

  const byId = new Map(plan.impacts.map((item) => [item.artifactId, item]));
  assert.equal(byId.get('logo-primary').requiredState, 'stale');
  assert.equal(byId.get('icon-dna').requiredState, 'review');
  assert.equal(byId.get('favicon').requiredState, 'stale');
  assert.equal(byId.get('guidelines').requiredState, 'stale');

  assert.equal(graph.artifacts.find((artifact) => artifact.id === 'favicon').status, 'approved');
  assert.equal(plan.counts.stale, 3);
  assert.equal(plan.counts.review, 1);
});

test('legacy Asset Registry entries migrate into the universal Artifact contract', () => {
  const artifact = artifactFromAssetRegistryEntry({
    assetId: 'hero-image',
    version: 3,
    type: 'image',
    purpose: 'Campaign hero image',
    status: 'produced',
    adapterId: 'image-provider-adapter',
    provider: 'provider-x',
    model: 'model-y',
    continuityId: 'campaign-001',
    directionRef: 'direction-v2',
    rightsStatus: 'owned',
    reviewStatus: 'approved',
    sourceAssetIds: ['product-packshot'],
    outputEvidence: 'artifacts/hero-image-v3.png',
    artifactHash: 'sha256:test',
    cost: { actual: 0.12, currency: 'USD' },
    patchAttempts: 1
  });

  assert.equal(artifact.schema, 'ai-studio-os/artifact@1');
  assert.equal(artifact.ref, 'hero-image@3');
  assert.equal(artifact.status, 'approved');
  assert.equal(artifact.files[0].ref, 'artifacts/hero-image-v3.png');
  assert.equal(artifact.source.provider, 'provider-x');
  assert.equal(artifact.rights.status, 'owned');
  assert.ok(artifact.dependencies.some((dependency) => dependency.artifactId === 'product-packshot' && dependency.relation === 'derived-from'));
  assert.equal(artifact.metadata.legacyAssetRegistry, true);
});
