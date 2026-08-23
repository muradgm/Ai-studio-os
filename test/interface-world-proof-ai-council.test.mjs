import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildInterfaceWorldProofPlan, buildInterfaceWorldProofEvidence } from '../modules/interface-world-proof/runtime.mjs';
import { buildStyleFrameProof, buildVisualProofEvidence } from '../modules/style-frame/runtime.mjs';
import { buildCreativeWorldCatalog, loadCreativeWorldCatalog } from '../apps/creative-agency/creative-world-catalog.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const architectureInput = await read('product-ux-architecture.json');
const exploration = await read('creative-worlds.json');
const oldMoments = await read('style-frame-moments.json');
const architecture = buildProductUXArchitecture(architectureInput);
const architectureRef = buildProductUXArchitectureReference(architecture);

test('AI Council canonical interface proof binds all three worlds to the same eight frozen screens', () => {
  assert.equal(architecture.reviewReady, true, JSON.stringify(architecture.findings, null, 2));
  assert.equal(architecture.truth.informationArchitectureFrozen, true);
  const plan = buildInterfaceWorldProofPlan({ architecture, exploration });
  assert.equal(plan.reviewReady, true, JSON.stringify(plan.findings, null, 2));
  assert.equal(plan.status, 'ready-for-browser-proof');
  assert.equal(plan.screenIds.length, 8);
  assert.equal(plan.frames.length, 24);
  assert.equal(plan.comparisons.length, 8);
  assert.deepEqual(plan.explorationRef.worldIds, ['counterpoint', 'threshold', 'decision-spine']);
  assert.equal(plan.interfaceArchitectureRef.fingerprint, architectureRef.fingerprint);
  for (const worldId of plan.explorationRef.worldIds) {
    const worldFrames = plan.frames.filter((frame) => frame.worldId === worldId);
    assert.equal(worldFrames.length, 8);
    assert.deepEqual(worldFrames.map((frame) => frame.screenId), architecture.screens.map((screen) => screen.id));
    assert.ok(worldFrames.every((frame) => frame.truth.sameCanonicalProductSkeleton === true));
  }
});

test('AI Council loaded selection catalog requires the current Product UX Architecture fingerprint', async () => {
  const catalog = await loadCreativeWorldCatalog('ai-council');
  assert.equal(catalog.reviewReady, true, JSON.stringify(catalog.findings, null, 2));
  assert.equal(catalog.lockableCount, 0);
  assert.equal(catalog.requiredInterfaceArchitectureRef?.schema, 'ai-studio-os/product-ux-architecture-ref@1');
  assert.equal(catalog.requiredInterfaceArchitectureRef?.fingerprint, architectureRef.fingerprint);
  assert.deepEqual(catalog.requiredInterfaceArchitectureRef?.screenIds, architecture.screens.map((screen) => screen.id));
});

test('the pre-architecture five-moment style-frame proof cannot authorize selection against the frozen interface', () => {
  const plan = buildStyleFrameProof({ exploration, moments: oldMoments.moments });
  const renderedFrames = plan.frames.map((frame) => ({
    frameId: frame.id,
    worldId: frame.worldId,
    momentId: frame.momentId,
    imageRef: `artifacts/ai-council/style-frame-proof-v2/frames/${frame.id}.png`,
    sourceRef: `artifacts/ai-council/style-frame-proof-v2/source-html/${frame.id}.html`
  }));
  const oldProof = buildVisualProofEvidence({
    plan,
    renderedFrames,
    comparisonRefs: plan.moments.map((moment) => `artifacts/ai-council/style-frame-proof-v2/comparisons/${moment.id}-comparison.png`)
  });
  assert.equal(oldProof.interfaceArchitectureRef, undefined);
  const withOldProof = structuredClone(exploration);
  withOldProof.visualProof = oldProof;
  const catalog = buildCreativeWorldCatalog('ai-council', withOldProof, {
    sourceRef: 'legacy-five-moment-proof',
    requiredInterfaceArchitectureRef: architectureRef
  });
  assert.equal(catalog.status, 'awaiting-current-interface-proof');
  assert.equal(catalog.lockableCount, 0);
  assert.ok(catalog.candidates.every((candidate) => candidate.canLock === false));
  assert.ok(catalog.candidates.every((candidate) => candidate.visualProof.status === 'architecture-proof-stale'));
});

test('only canonical eight-screen proof tied to the current architecture can make all worlds selectable', () => {
  const plan = buildInterfaceWorldProofPlan({ architecture, exploration });
  const renderedFrames = plan.frames.map((frame) => ({
    frameId: frame.id,
    worldId: frame.worldId,
    screenId: frame.screenId,
    imageRef: `artifacts/ai-council/canonical-interface-world-proof-v1/frames/${frame.id}.png`,
    sourceRef: `artifacts/ai-council/canonical-interface-world-proof-v1/source-html/${frame.id}.html`
  }));
  const proof = buildInterfaceWorldProofEvidence({
    plan,
    renderedFrames,
    comparisonRefs: plan.screenIds.map((screenId) => `artifacts/ai-council/canonical-interface-world-proof-v1/comparisons/${screenId}-comparison.png`),
    overviewRefs: plan.explorationRef.worldIds.map((worldId) => `artifacts/ai-council/canonical-interface-world-proof-v1/world-overviews/${worldId}-overview.png`)
  });
  assert.equal(proof.reviewReady, true, JSON.stringify(proof.findings, null, 2));
  assert.equal(proof.interfaceArchitectureRef.fingerprint, architectureRef.fingerprint);
  assert.equal(proof.worlds.length, 3);
  assert.ok(proof.worlds.every((world) => world.evidenceRefs.length === 8));

  const withProof = structuredClone(exploration);
  withProof.visualProof = proof;
  const catalog = buildCreativeWorldCatalog('ai-council', withProof, {
    sourceRef: 'canonical-eight-screen-proof',
    requiredInterfaceArchitectureRef: architectureRef
  });
  assert.equal(catalog.status, 'visual-proof-ready');
  assert.equal(catalog.lockableCount, 3);
  assert.ok(catalog.candidates.every((candidate) => candidate.canLock === true));
  assert.equal(withProof.selection, null);
  assert.equal(withProof.selectedWorld, null);
});
