import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCreativeKnowledgeGraph } from '../modules/creative-knowledge-graph/runtime.mjs';
import { buildCreativeKnowledgeRetrievalWithProvenance } from '../modules/creative-knowledge-graph/provenance.mjs';
import { buildCanonicalMotionAuthorityFixture } from '../fixtures/motion-creative-authority-fixture.mjs';
import { reviewMotionCreativeWorldAuthority } from '../modules/motion-creative-intelligence/world-authority.mjs';
import { buildMotionIntelligenceV2Foundation } from '../modules/motion-intelligence-v2/knowledge.mjs';
import {
  buildMotionIntelligenceV2Brief,
  reviewMotionIntelligenceV2Brief
} from '../modules/motion-intelligence-v2/runtime.mjs';

const PROJECT_ID = 'motion-v2-world-binding-project';
const AS_OF = '2026-08-28T22:00:00+02:00';

function buildKnowledge() {
  const foundation = buildMotionIntelligenceV2Foundation();
  const graph = buildCreativeKnowledgeGraph({ foundation });
  const retrieval = buildCreativeKnowledgeRetrievalWithProvenance({
    graph,
    foundation,
    projectId: PROJECT_ID,
    asOf: AS_OF,
    purpose: 'Prove exact Creative World content binding for Motion Intelligence V2.',
    domains: ['motion'],
    limit: 50
  });
  assert.equal(retrieval.reviewReady, true, retrieval.findings.map((item) => item.code).join(', '));
  return { foundation, graph, retrieval };
}

function buildBrief(canonicalCreativeAuthority, knowledge) {
  return buildMotionIntelligenceV2Brief({
    projectId: PROJECT_ID,
    canonicalCreativeAuthority,
    knowledge,
    projectTruths: [
      { id: 'truth-consequence', statement: 'Consequential state change should receive stronger temporal emphasis than routine navigation.' },
      { id: 'truth-calm', statement: 'The experience should remain calm and inspectable between meaningful state changes.' }
    ],
    constraints: [
      'Motion remains subordinate to product meaning.',
      'Reduced motion preserves semantic hierarchy.'
    ]
  });
}

function mutateSelectedWorldWithoutChangingId(canonical) {
  const changed = structuredClone(canonical);
  const worldId = changed.selectedCreativeWorld.id;
  const mutation = `${changed.selectedCreativeWorld.motionLanguage} Same-ID semantic mutation.`;

  changed.selectedCreativeWorld.motionLanguage = mutation;
  if (changed.creativeWorldExploration?.selectedWorld?.id === worldId) {
    changed.creativeWorldExploration.selectedWorld.motionLanguage = mutation;
  }
  const candidate = changed.creativeWorldExploration?.worlds?.find((world) => world.id === worldId);
  if (candidate) candidate.motionLanguage = mutation;

  return changed;
}

test('Motion V2 binds exact selected Creative World content so same-ID semantic drift invalidates an old Brief', () => {
  const canonical = buildCanonicalMotionAuthorityFixture(PROJECT_ID);
  const knowledge = buildKnowledge();
  const brief = buildBrief(canonical, knowledge);

  assert.equal(brief.reviewReady, true, brief.findings.map((item) => item.code).join(', '));
  assert.equal(brief.creativeWorldBinding.creativeWorldId, brief.creativeWorldId);
  assert.ok(brief.creativeWorldBinding.selectedWorldFingerprint);
  assert.ok(brief.coreSnapshotFingerprint);
  assert.notEqual(brief.snapshotFingerprint, brief.coreSnapshotFingerprint);

  const serialized = JSON.parse(JSON.stringify(brief));
  const changedAuthority = mutateSelectedWorldWithoutChangingId(canonical);

  // The existing canonical authority layer still accepts this consistently mutated
  // same-ID world, which is exactly why Motion V2 needs its own persisted content binding.
  const changedWorldReview = reviewMotionCreativeWorldAuthority({
    projectId: PROJECT_ID,
    canonicalCreativeAuthority: changedAuthority
  });
  assert.equal(changedWorldReview.reviewReady, true, changedWorldReview.findings.map((item) => item.code).join(', '));
  assert.equal(changedWorldReview.authority.creativeWorldId, brief.creativeWorldId);

  const review = reviewMotionIntelligenceV2Brief(serialized, {
    canonicalCreativeAuthority: changedAuthority,
    knowledge,
    synthesis: null
  });

  assert.equal(review.reviewReady, false);
  assert.ok(review.findings.some((item) => item.code === 'motion-v2-world-content-binding-drift'));
});
