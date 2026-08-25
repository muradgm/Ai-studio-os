import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildDrawingMemory,
  buildDrawingIntelligencePlan,
  buildGeometryIntent
} from '../modules/drawing-intelligence/runtime.mjs';
import {
  AUTHORITY_PRODUCTION_CANDIDATES,
  buildAuthorityVectorArtifact,
  inspectAuthoritySvgIntegrity
} from '../modules/drawing-intelligence/authority-production-test.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..', 'projects', 'ai-council');
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(projectRoot, name), 'utf8'));

const input = await readJson('drawing-intelligence-authority-production-v1.json');
const memoryInput = await readJson('drawing-intelligence-memory-v1.json');

test('Authority production test proposes three state-neutral candidates without known blocker collisions', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  assert.equal(plan.pass, true);
  assert.equal(plan.reviewReady, true);
  assert.deepEqual(plan.candidates.map((candidate) => candidate.id), AUTHORITY_PRODUCTION_CANDIDATES);
  for (const candidate of plan.candidates) {
    assert.equal(candidate.recommendationEligibility, true, candidate.id);
    assert.ok(!candidate.collisions.some((collision) => collision.severity === 'BLOCKER'), candidate.id);
    assert.ok(!candidate.findings.some((item) => item.code === 'drawing-candidate-semantic-state-violation'), candidate.id);
  }
  assert.equal(plan.recommendedCandidate, null);
  assert.equal(plan.humanApproved, false);
});

test('Authority production geometry receives less semantic machinery at smaller sizes', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  for (const candidateId of AUTHORITY_PRODUCTION_CANDIDATES) {
    const micro = buildGeometryIntent(plan, candidateId, { size: 14 });
    const small = buildGeometryIntent(plan, candidateId, { size: 16 });
    const master = buildGeometryIntent(plan, candidateId, { size: 24 });
    assert.equal(micro.retainedSemanticDevices.length, 1, candidateId);
    assert.equal(small.retainedSemanticDevices.length, 2, candidateId);
    assert.equal(master.retainedSemanticDevices.length, 3, candidateId);
    assert.ok(micro.primitivePlan.primitives.length < small.primitivePlan.primitives.length, candidateId);
    assert.ok(small.primitivePlan.primitives.length < master.primitivePlan.primitives.length, candidateId);
    assert.ok(micro.primitivePlan.relationships.every((relationship) => relationship.semanticDeviceId === 'boundary'), candidateId);
  }
});

test('Vector Geometry spec and emitted SVG integrity pass for every Authority candidate at 14/16/24', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  for (const candidateId of AUTHORITY_PRODUCTION_CANDIDATES) {
    for (const size of plan.targetSizes) {
      const intent = buildGeometryIntent(plan, candidateId, { size });
      const artifact = buildAuthorityVectorArtifact(intent);
      assert.equal(artifact.vectorSpecValidation.status, 'ready', `${candidateId}@${size}`);
      assert.equal(artifact.emittedSvgIntegrity.status, 'ready', `${candidateId}@${size}`);
      assert.equal(artifact.emittedSvgIntegrity.surfaceNeutral, true, `${candidateId}@${size}`);
      assert.match(artifact.svg, /^<svg /, `${candidateId}@${size}`);
      assert.ok(!artifact.svg.includes('fill="white"'), `${candidateId}@${size}`);
      assert.ok(!artifact.svg.includes('Approval required'));
      assert.ok(!artifact.svg.includes('Authorized'));
    }
  }
});

test('emitted SVG integrity catches surface coupling and out-of-bounds geometry', () => {
  const coupled = '<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor"><g id="authority-opposed-domains-16"><circle cx="12" cy="12" r="3" fill="white"/></g></svg>';
  const coupledResult = inspectAuthoritySvgIntegrity(coupled, { candidateId: 'opposed-domains', targetSize: 16 });
  assert.equal(coupledResult.status, 'blocked');
  assert.ok(coupledResult.findings.some((item) => item.code === 'authority-svg-raw-fill-forbidden'));

  const outside = '<svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor"><g id="authority-opposed-domains-16"><line x1="2" y1="12" x2="30" y2="12"/></g></svg>';
  const outsideResult = inspectAuthoritySvgIntegrity(outside, { candidateId: 'opposed-domains', targetSize: 16 });
  assert.equal(outsideResult.status, 'blocked');
  assert.ok(outsideResult.findings.some((item) => item.code === 'authority-svg-line-bounds-invalid'));
});

test('Authority master geometry remains identical across later product-state labels', () => {
  const memory = buildDrawingMemory(memoryInput);
  const plan = buildDrawingIntelligencePlan(input, { memory });
  const intent = buildGeometryIntent(plan, 'opposed-domains', { size: 16 });
  const master = buildAuthorityVectorArtifact(intent).svg;
  const compositions = ['Authority', 'Approval required', 'Authorized', 'Rejected'].map((label) => ({ label, svg: master }));
  assert.equal(new Set(compositions.map((item) => item.svg)).size, 1);
});
