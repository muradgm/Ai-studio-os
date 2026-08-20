import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { runBrandKitRuntime } from '../lib/brand-kit-runtime.mjs';
import { planArtifactChange } from '../modules/artifact-graph/runtime.mjs';

const benchmarkInput = JSON.parse(fs.readFileSync(new URL('../benchmarks/008-brand-identity-kit/input.json', import.meta.url), 'utf8'));

test('Brand Kit runtime publishes a valid universal Artifact Graph', () => {
  const output = runBrandKitRuntime(benchmarkInput);
  const bundle = output.artifactGraph;

  assert.equal(output.pass, true);
  assert.equal(bundle.pass, true);
  assert.equal(bundle.graph.schema, 'ai-studio-os/artifact-graph@1');
  assert.equal(bundle.counts.identityArtifacts, 7);
  assert.equal(bundle.counts.applications, 2);
  assert.equal(bundle.counts.graphArtifacts, 11);
  assert.ok(bundle.counts.graphEdges >= 30);
  assert.equal(bundle.brandDnaRef, 'brand-dna:benchmark-identity@1.0.0');
  assert.equal(bundle.manifestRef, 'benchmark-identity-brand-kit@1.0.0');

  const manifestNode = bundle.graph.artifacts.find((artifact) => artifact.ref === bundle.manifestRef);
  assert.equal(manifestNode.status, 'produced');
  assert.equal(manifestNode.reviewStatus, 'approved');
  assert.equal(manifestNode.releaseStatus, 'ready');
  assert.equal(manifestNode.files.length, 0, 'structured manifest must not fabricate a package file');
});

test('Brand DNA changes invalidate every downstream Brand Kit artifact', () => {
  const output = runBrandKitRuntime(benchmarkInput);
  const plan = planArtifactChange({
    graph: output.artifactGraph.graph,
    changedRefs: ['brand-dna:benchmark-identity']
  });

  assert.equal(plan.pass, true);
  assert.equal(plan.changed.length, 1);
  assert.equal(plan.impacts.length, 10);
  assert.equal(plan.counts.stale, 10);
  assert.equal(plan.counts.review, 0);
  assert.ok(plan.impacts.some((impact) => impact.artifactRef === 'logo-master@1.0.0' && impact.requiredState === 'stale'));
  assert.ok(plan.impacts.some((impact) => impact.artifactRef === 'application:website@1.0.0' && impact.requiredState === 'stale'));
  assert.ok(plan.impacts.some((impact) => impact.artifactRef === 'benchmark-identity-brand-kit@1.0.0' && impact.requiredState === 'stale'));
});

test('Changing a logo marks applications for review and compiled guidelines stale', () => {
  const output = runBrandKitRuntime(benchmarkInput);
  const plan = planArtifactChange({
    graph: output.artifactGraph.graph,
    changedRefs: ['logo-master']
  });

  assert.equal(plan.pass, true);
  const byRef = new Map(plan.impacts.map((impact) => [impact.artifactRef, impact]));
  assert.equal(byRef.get('guidelines-v1@1.0.0')?.requiredState, 'stale');
  assert.equal(byRef.get('application:website@1.0.0')?.requiredState, 'review');
  assert.equal(byRef.get('application:social@1.0.0')?.requiredState, 'review');
  assert.equal(byRef.get('benchmark-identity-brand-kit@1.0.0')?.requiredState, 'stale');
});

test('Brand Kit graph fails closed when manifest review detects Brand DNA drift', () => {
  const drifted = structuredClone(benchmarkInput);
  drifted.assets = drifted.assets.map((asset) => asset.id === 'logo-master'
    ? { ...asset, brandDnaVersion: '0.9.0' }
    : asset);

  const output = runBrandKitRuntime(drifted);
  assert.equal(output.review.productionReady, false);
  assert.equal(output.artifactGraph.pass, false);
  assert.ok(output.artifactGraph.findings.some((finding) => finding.code === 'artifact-invalid'));
});
