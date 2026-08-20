import test from 'node:test';
import assert from 'node:assert/strict';
import { createArtifact, buildArtifactGraph } from '../modules/artifact-graph/runtime.mjs';
import { createCommandCenterArtifactState } from '../modules/command-center-state/runtime.mjs';

function graphFixture() {
  const dna = createArtifact({
    id: 'brand-dna:agency', version: '1.0.0', kind: 'brand-dna', title: 'Agency Brand DNA', projectId: 'agency',
    status: 'produced', reviewStatus: 'approved', releaseStatus: 'unmeasured'
  });
  const logoV1 = createArtifact({
    id: 'logo', version: '1', kind: 'brand/logo', title: 'Primary Logo', projectId: 'agency', brandDnaVersion: '1.0.0',
    status: 'approved', reviewStatus: 'approved', releaseStatus: 'ready', files: ['artifact://logo-v1.svg'],
    dependencies: [{ artifactRef: dna.ref, relation: 'inherits-brand-dna', impact: 'stale' }]
  });
  const logoV2 = createArtifact({
    id: 'logo', version: '2', kind: 'brand/logo', title: 'Primary Logo', projectId: 'agency', brandDnaVersion: '1.0.0',
    status: 'approved', reviewStatus: 'approved', releaseStatus: 'unmeasured', files: ['artifact://logo-v2.svg'],
    dependencies: [{ artifactRef: dna.ref, relation: 'inherits-brand-dna', impact: 'stale' }]
  });
  const icons = createArtifact({
    id: 'icons', version: '1', kind: 'brand/icon-system', title: 'Icon Family', projectId: 'agency', brandDnaVersion: '1.0.0',
    status: 'review', reviewStatus: 'needs-revision', releaseStatus: 'blocked', files: ['artifact://icons.svg'],
    dependencies: [{ artifactRef: logoV2.ref, relation: 'derived-from', impact: 'review' }],
    findings: [{ severity: 'major', code: 'icon-spacing', message: 'Optical spacing needs revision.' }]
  });
  const guidelines = createArtifact({
    id: 'guidelines', version: '1', kind: 'brand/guidelines', title: 'Brand Guidelines', projectId: 'agency', brandDnaVersion: '1.0.0',
    status: 'approved', reviewStatus: 'approved', releaseStatus: 'ready', files: ['artifact://guidelines.pdf'],
    dependencies: [
      { artifactRef: dna.ref, relation: 'inherits-brand-dna', impact: 'stale' },
      { artifactRef: logoV2.ref, relation: 'documents', impact: 'stale' },
      { artifactRef: icons.ref, relation: 'documents', impact: 'stale' }
    ]
  });
  const website = createArtifact({
    id: 'website', version: '1', kind: 'brand/application', title: 'Website', projectId: 'agency', brandDnaVersion: '1.0.0',
    status: 'produced', reviewStatus: 'unreviewed', releaseStatus: 'unmeasured', files: ['artifact://website/index.html'],
    measurements: [{ type: 'browser', status: 'measured' }],
    dependencies: [{ artifactRef: logoV2.ref, relation: 'applies', impact: 'review' }]
  });
  return buildArtifactGraph([dna, logoV1, logoV2, icons, guidelines, website]);
}

test('projects only latest artifact versions into the queue', () => {
  const state = createCommandCenterArtifactState({ graph: graphFixture(), projectId: 'agency' });
  assert.equal(state.pass, true);
  assert.equal(state.counts.artifacts, 5);
  assert.equal(state.queue.some((item) => item.artifactRef === 'logo@1'), false);
  assert.equal(state.queue.some((item) => item.artifactRef === 'logo@2'), true);
});

test('orders consequential states before healthy approved work', () => {
  const state = createCommandCenterArtifactState({ graph: graphFixture() });
  assert.equal(state.queue[0].artifactId, 'icons');
  assert.equal(state.queue[0].state, 'blocked');
  const approvedIndex = state.queue.findIndex((item) => item.artifactId === 'logo');
  assert.ok(approvedIndex > 0);
});

test('change impact overrides optimistic artifact state without mutating graph', () => {
  const graph = graphFixture();
  const state = createCommandCenterArtifactState({ graph, changedRefs: ['logo@2'] });
  const guidelines = state.queue.find((item) => item.artifactId === 'guidelines');
  const website = state.queue.find((item) => item.artifactId === 'website');
  assert.equal(guidelines.state, 'stale');
  assert.equal(guidelines.impact.requiredState, 'stale');
  assert.equal(website.state, 'review');
  assert.equal(website.impact.requiredState, 'review');
  assert.equal(graph.artifacts.find((item) => item.id === 'guidelines').status, 'approved');
});

test('approval never becomes release ready without measured release state', () => {
  const graph = buildArtifactGraph([
    createArtifact({
      id: 'logo', version: '1', kind: 'brand/logo', status: 'approved', reviewStatus: 'approved', releaseStatus: 'unmeasured',
      files: ['artifact://logo.svg']
    })
  ]);
  const state = createCommandCenterArtifactState({ graph });
  assert.equal(state.queue[0].state, 'approved');
  assert.equal(state.releaseState, 'unmeasured');
  assert.equal('progress' in state, false);
  assert.equal('percentage' in state, false);
});

test('fails closed when the Artifact Graph is blocked', () => {
  const orphan = createArtifact({
    id: 'website', version: '1', kind: 'web', status: 'produced', reviewStatus: 'unreviewed',
    dependencies: [{ artifactId: 'missing-logo', required: true, impact: 'stale' }]
  });
  const graph = buildArtifactGraph([orphan]);
  assert.equal(graph.pass, false);
  const state = createCommandCenterArtifactState({ graph });
  assert.equal(state.pass, false);
  assert.equal(state.status, 'blocked');
  assert.equal(state.releaseState, 'blocked');
  assert.ok(state.findings.some((item) => item.code === 'command-center-artifact-graph-blocked'));
});

test('reports only actual evidence counts', () => {
  const artifact = createArtifact({
    id: 'hero-motion', version: '3', kind: 'motion', status: 'produced', reviewStatus: 'approved', releaseStatus: 'unmeasured',
    files: ['artifact://hero.webm'], previews: ['artifact://hero-preview.png'],
    reviews: [{ type: 'motion-review', status: 'passed' }],
    measurements: [{ type: 'frame-time', value: 16.2 }]
  });
  const state = createCommandCenterArtifactState({ graph: buildArtifactGraph([artifact]) });
  assert.deepEqual(state.queue[0].evidence, {
    files: 1, previews: 1, reviews: 1, measurements: 1, findings: 0, blockers: 0, majors: 0
  });
  assert.equal(state.counts.files, 1);
  assert.equal(state.counts.reviews, 1);
  assert.equal(state.counts.measurements, 1);
});
