import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference, expectedMemoryActions } from '../modules/interface-world-proof/fixture.mjs';
import { buildInterfaceWorldProofPlan, buildInterfaceWorldProofEvidence } from '../modules/interface-world-proof/runtime.mjs';
import { buildStyleFrameProof, buildVisualProofEvidence } from '../modules/style-frame/runtime.mjs';
import { buildCreativeWorldCatalog, loadCreativeWorldCatalog } from '../apps/creative-agency/creative-world-catalog.mjs';

const read = async (name) => JSON.parse(await fs.readFile(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const architectureInput = await read('product-ux-architecture.json');
const fixtureInput = await read('canonical-ux-fixture.json');
const exploration = await read('creative-worlds.json');
const oldMoments = await read('style-frame-moments.json');
const architecture = buildProductUXArchitecture(architectureInput);
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(fixtureInput, { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });

test('AI Council canonical fixture is coherent, architecture-bound, and freezes the eight-screen comparison semantics', () => {
  assert.equal(fixture.reviewReady, true, JSON.stringify(fixture.findings, null, 2));
  assert.equal(fixture.status, 'ready-for-interface-world-proof');
  assert.equal(fixture.activeThread.id, fixture.currentContext.threadId);
  assert.equal(fixture.activeThread.label, 'Architecture');
  assert.match(fixture.currentContext.label, /control-plane architecture/i);
  assert.match(fixture.conversation.userQuestion, /rewrite AI Council in Python/i);
  assert.deepEqual(fixture.canonicalScreenIds, architecture.screens.map((screen) => screen.id));
  assert.equal(fixture.truth.contextContentCoherent, true);
  assert.equal(fixture.truth.historicalMemoryPreservedOnRemoval, true);
  assert.equal(fixture.memoryRemovalSemantics.destructiveErase, false);
  assert.deepEqual(fixture.comparisonInvariants, [
    'same words',
    'same data',
    'same information priority',
    'same functionality',
    'same viewport',
    'same interaction state',
    'same canonical screen identity'
  ]);
});

test('memory controls are state-aware and removal preserves history instead of erasing evidence', () => {
  const confirmed = fixture.memory.filter((item) => item.verification === 'Confirmed');
  const proposed = fixture.memory.find((item) => item.verification === 'Proposed');
  assert.ok(confirmed.length >= 1);
  for (const item of confirmed) {
    assert.deepEqual(item.actions, expectedMemoryActions(item));
    assert.equal(item.actions.includes('Confirm'), false);
    assert.ok(item.actions.includes('Remove from active memory'));
  }
  assert.ok(proposed);
  assert.deepEqual(proposed.actions, ['Confirm', 'Reject', 'Edit']);
  assert.deepEqual(fixture.memoryHistoryExample.actions, ['View replacement', 'Restore / reopen if permitted']);
  assert.equal(fixture.memoryRemovalSemantics.preservesHistory, true);
});

test('decision lifecycle, memory verification, confidence, and authority remain separate status dimensions', () => {
  assert.deepEqual(fixture.statusTaxonomy.decisionLifecycle.values, ['Active', 'Superseded', 'Rejected']);
  assert.deepEqual(fixture.statusTaxonomy.memoryVerification.values, ['Confirmed', 'Proposed', 'Disputed']);
  assert.deepEqual(fixture.statusTaxonomy.confidence.values, ['High', 'Medium', 'Low']);
  assert.deepEqual(fixture.statusTaxonomy.authority.values, ['Advisory', 'Approval required', 'Authorized']);
  assert.equal(fixture.decision.lifecycle, 'Active');
  assert.equal(fixture.decision.confidence, 'High');
  assert.equal(fixture.decision.authority, 'Advisory');
  assert.equal(fixture.approval.authority, 'Approval required');
});

test('mobile continuity defines project/thread navigation without inventing another canonical screen', () => {
  assert.equal(fixture.mobileNavigation.triggerLabel, 'Architecture');
  assert.ok(fixture.mobileNavigation.items.includes('Project Home'));
  assert.ok(fixture.mobileNavigation.items.some((item) => /current thread/i.test(item)));
  assert.ok(fixture.mobileNavigation.items.includes('Cognitive Reliability'));
  assert.ok(fixture.mobileNavigation.items.includes('New conversation'));
  assert.deepEqual(fixture.screenModel.workspaceStates, ['conversation', 'structured-response', 'evidence-context']);
  assert.deepEqual(fixture.screenModel.destinationSurfaces, ['project-home', 'approval', 'decision-detail', 'project-memory']);
  assert.deepEqual(fixture.screenModel.responsiveExpressions, [{ screenId: 'mobile-conversation', expressionOf: 'conversation' }]);
});

test('AI Council canonical interface proof binds all three worlds to the same architecture and canonical fixture', () => {
  assert.equal(architecture.reviewReady, true, JSON.stringify(architecture.findings, null, 2));
  assert.equal(architecture.truth.informationArchitectureFrozen, true);
  const plan = buildInterfaceWorldProofPlan({ architecture, exploration, fixture });
  assert.equal(plan.reviewReady, true, JSON.stringify(plan.findings, null, 2));
  assert.equal(plan.status, 'ready-for-browser-proof');
  assert.equal(plan.screenIds.length, 8);
  assert.equal(plan.frames.length, 24);
  assert.equal(plan.comparisons.length, 8);
  assert.deepEqual(plan.explorationRef.worldIds, ['counterpoint', 'threshold', 'decision-spine']);
  assert.equal(plan.interfaceArchitectureRef.fingerprint, architectureRef.fingerprint);
  assert.equal(plan.canonicalFixtureRef.fingerprint, fixtureRef.fingerprint);
  assert.equal(plan.canonicalFixtureRef.architectureFingerprint, architectureRef.fingerprint);
  for (const worldId of plan.explorationRef.worldIds) {
    const worldFrames = plan.frames.filter((frame) => frame.worldId === worldId);
    assert.equal(worldFrames.length, 8);
    assert.deepEqual(worldFrames.map((frame) => frame.screenId), architecture.screens.map((screen) => screen.id));
    assert.ok(worldFrames.every((frame) => frame.truth.sameCanonicalProductSkeleton === true));
    assert.ok(worldFrames.every((frame) => frame.truth.sameCanonicalFixture === true));
    assert.ok(worldFrames.every((frame) => frame.canonicalFixtureRef.fingerprint === fixtureRef.fingerprint));
  }
});

test('AI Council loaded selection catalog requires current Product UX Architecture and canonical fixture fingerprints', async () => {
  const catalog = await loadCreativeWorldCatalog('ai-council');
  assert.equal(catalog.reviewReady, true, JSON.stringify(catalog.findings, null, 2));
  assert.equal(catalog.lockableCount, 0);
  assert.equal(catalog.requiredInterfaceArchitectureRef?.schema, 'ai-studio-os/product-ux-architecture-ref@1');
  assert.equal(catalog.requiredInterfaceArchitectureRef?.fingerprint, architectureRef.fingerprint);
  assert.equal(catalog.requiredCanonicalFixtureRef?.schema, 'ai-studio-os/canonical-interface-fixture-ref@1');
  assert.equal(catalog.requiredCanonicalFixtureRef?.fingerprint, fixtureRef.fingerprint);
  assert.deepEqual(catalog.requiredCanonicalFixtureRef?.screenIds, architecture.screens.map((screen) => screen.id));
});

test('the pre-architecture five-moment style-frame proof cannot authorize selection against current architecture and fixture', () => {
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
  assert.equal(oldProof.canonicalFixtureRef, undefined);
  const withOldProof = structuredClone(exploration);
  withOldProof.visualProof = oldProof;
  const catalog = buildCreativeWorldCatalog('ai-council', withOldProof, {
    sourceRef: 'legacy-five-moment-proof',
    requiredInterfaceArchitectureRef: architectureRef,
    requiredCanonicalFixtureRef: fixtureRef
  });
  assert.equal(catalog.status, 'awaiting-current-interface-proof');
  assert.equal(catalog.lockableCount, 0);
  assert.ok(catalog.candidates.every((candidate) => candidate.canLock === false));
  assert.ok(catalog.candidates.every((candidate) => candidate.visualProof.status === 'architecture-proof-stale'));
});

test('fixture drift invalidates otherwise architecture-matching proof', () => {
  const plan = buildInterfaceWorldProofPlan({ architecture, exploration, fixture });
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
  const changedFixture = structuredClone(fixtureInput);
  changedFixture.conversation.answer = `${changedFixture.conversation.answer} Re-evaluate after the benchmark.`;
  const changedFixtureReviewed = buildCanonicalInterfaceFixture(changedFixture, { architectureRef });
  const changedFixtureRef = buildCanonicalInterfaceFixtureReference(changedFixtureReviewed, { architectureRef });
  const withProof = structuredClone(exploration);
  withProof.visualProof = proof;
  const catalog = buildCreativeWorldCatalog('ai-council', withProof, {
    requiredInterfaceArchitectureRef: architectureRef,
    requiredCanonicalFixtureRef: changedFixtureRef
  });
  assert.equal(catalog.lockableCount, 0);
  assert.ok(catalog.candidates.every((candidate) => candidate.visualProof.status === 'fixture-proof-stale'));
});

test('only canonical eight-screen proof tied to current architecture and fixture can make all worlds selectable', () => {
  const plan = buildInterfaceWorldProofPlan({ architecture, exploration, fixture });
  const renderedFrames = plan.frames.map((frame) => ({
    frameId: frame.id,
    worldId: frame.worldId,
    screenId: frame.screenId,
    imageRef: `artifacts/ai-council/canonical-interface-world-proof-v1/frames/${frame.id}.png`,
    sourceRef: `artifacts/ai-council/canonical-interface-world-proof-v1/source-html/${frame.id}.html`,
    interfaceArchitectureFingerprint: architectureRef.fingerprint,
    canonicalFixtureFingerprint: fixtureRef.fingerprint
  }));
  const proof = buildInterfaceWorldProofEvidence({
    plan,
    renderedFrames,
    comparisonRefs: plan.screenIds.map((screenId) => `artifacts/ai-council/canonical-interface-world-proof-v1/comparisons/${screenId}-comparison.png`),
    overviewRefs: plan.explorationRef.worldIds.map((worldId) => `artifacts/ai-council/canonical-interface-world-proof-v1/world-overviews/${worldId}-overview.png`)
  });
  assert.equal(proof.reviewReady, true, JSON.stringify(proof.findings, null, 2));
  assert.equal(proof.interfaceArchitectureRef.fingerprint, architectureRef.fingerprint);
  assert.equal(proof.canonicalFixtureRef.fingerprint, fixtureRef.fingerprint);
  assert.equal(proof.worlds.length, 3);
  assert.ok(proof.worlds.every((world) => world.evidenceRefs.length === 8));

  const withProof = structuredClone(exploration);
  withProof.visualProof = proof;
  const catalog = buildCreativeWorldCatalog('ai-council', withProof, {
    sourceRef: 'canonical-eight-screen-proof',
    requiredInterfaceArchitectureRef: architectureRef,
    requiredCanonicalFixtureRef: fixtureRef
  });
  assert.equal(catalog.status, 'visual-proof-ready');
  assert.equal(catalog.lockableCount, 3);
  assert.ok(catalog.candidates.every((candidate) => candidate.canLock === true));
  assert.equal(withProof.selection, null);
  assert.equal(withProof.selectedWorld, null);
});
