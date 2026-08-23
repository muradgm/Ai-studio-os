import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildStyleFrameProof, buildVisualProofEvidence } from '../modules/style-frame/runtime.mjs';
import { buildCreativeWorldCatalog } from '../apps/creative-agency/creative-world-catalog.mjs';

const exploration = JSON.parse(await fs.readFile(new URL('../projects/ai-council/creative-worlds.json', import.meta.url), 'utf8'));
const momentConfig = JSON.parse(await fs.readFile(new URL('../projects/ai-council/style-frame-moments.json', import.meta.url), 'utf8'));

test('AI Council style-frame plan covers the same five product moments across all three worlds', () => {
  const plan = buildStyleFrameProof({ exploration, moments: momentConfig.moments });
  assert.equal(plan.reviewReady, true);
  assert.equal(plan.status, 'ready-for-browser-proof');
  assert.equal(plan.projectId, 'ai-council');
  assert.equal(plan.moments.length, 5);
  assert.equal(plan.frames.length, 15);
  assert.equal(plan.comparisons.length, 5);
  assert.deepEqual(plan.explorationRef.worldIds, ['counterpoint', 'threshold', 'decision-spine']);

  for (const world of exploration.worlds) {
    const frames = plan.frames.filter((frame) => frame.worldId === world.id);
    assert.equal(frames.length, 5);
    assert.deepEqual(frames.map((frame) => frame.momentId), momentConfig.moments.map((moment) => moment.id));
    assert.ok(frames.every((frame) => frame.productState));
    assert.ok(frames.every((frame) => frame.proofPolicy.exactBrowserRasterRequired === true));
    assert.ok(frames.every((frame) => frame.truth.humanVisualApproval === false));
  }
});

test('rendered proof evidence can make worlds reviewable without fabricating selection', () => {
  const plan = buildStyleFrameProof({ exploration, moments: momentConfig.moments });
  const renderedFrames = plan.frames.map((frame) => ({
    frameId: frame.id,
    worldId: frame.worldId,
    momentId: frame.momentId,
    imageRef: `artifacts/ai-council/style-frame-proof-v2/frames/${frame.id}.png`,
    sourceRef: `artifacts/ai-council/style-frame-proof-v2/source-html/${frame.id}.html`
  }));
  const comparisonRefs = plan.moments.map((moment) => `artifacts/ai-council/style-frame-proof-v2/comparisons/${moment.id}-comparison.png`);
  const proof = buildVisualProofEvidence({ plan, renderedFrames, comparisonRefs });

  assert.equal(proof.reviewReady, true);
  assert.equal(proof.status, 'ready-for-human-visual-review');
  assert.equal(proof.truth.humanWorldSelectionConfirmed, false);
  assert.equal(proof.truth.selectedAutomatically, false);
  assert.equal(proof.worlds.length, 3);
  assert.ok(proof.worlds.every((world) => world.reviewReady === true));
  assert.ok(proof.worlds.every((world) => world.evidenceRefs.length === 5));
});

test('Command Center remains blocked before proof and becomes evidence-lockable only after proof overlay', () => {
  const before = buildCreativeWorldCatalog('ai-council', exploration, { sourceRef: 'projects/ai-council/creative-worlds.json' });
  assert.equal(before.status, 'awaiting-visual-proof');
  assert.equal(before.lockableCount, 0);

  const plan = buildStyleFrameProof({ exploration, moments: momentConfig.moments });
  const renderedFrames = plan.frames.map((frame) => ({
    frameId: frame.id,
    worldId: frame.worldId,
    momentId: frame.momentId,
    imageRef: `artifacts/ai-council/style-frame-proof-v2/frames/${frame.id}.png`,
    sourceRef: `artifacts/ai-council/style-frame-proof-v2/source-html/${frame.id}.html`
  }));
  const proof = buildVisualProofEvidence({
    plan,
    renderedFrames,
    comparisonRefs: plan.moments.map((moment) => `artifacts/ai-council/style-frame-proof-v2/comparisons/${moment.id}-comparison.png`)
  });
  const withProof = structuredClone(exploration);
  withProof.visualProof = proof;
  const after = buildCreativeWorldCatalog('ai-council', withProof, { sourceRef: 'generated-style-frame-proof' });

  assert.equal(after.status, 'visual-proof-ready');
  assert.equal(after.lockableCount, 3);
  assert.ok(after.candidates.every((candidate) => candidate.canLock === true));
  assert.equal(withProof.selection, null);
  assert.equal(withProof.selectedWorld, null);
});
