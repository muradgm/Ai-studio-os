import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { buildProductUnderstanding } from '../modules/product-understanding/runtime.mjs';
import { buildInspirationPacket } from '../modules/inspiration/runtime.mjs';
import { buildCreativeThesis } from '../modules/creative-thesis/runtime.mjs';
import { buildCreativeWorldExploration } from '../modules/creative-world/runtime.mjs';
import { buildCreativeWorldCatalog } from '../apps/creative-agency/creative-world-catalog.mjs';

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../projects/ai-council/${name}`, import.meta.url), 'utf8'));
const productInput = read('product-understanding.json');
const researchInput = read('creative-research.json');
const thesisInput = read('creative-thesis.json');
const candidateInput = read('creative-world-candidates.json');
const persistedExploration = read('creative-worlds.json');

function buildRun() {
  const productUnderstanding = buildProductUnderstanding(productInput);
  const inspiration = buildInspirationPacket(researchInput);
  const creativeThesis = buildCreativeThesis({
    projectId: 'ai-council',
    intent: thesisInput.intent,
    businessTruths: [
      productUnderstanding.productDefinition,
      productUnderstanding.problem,
      productUnderstanding.valueProposition,
      ...productUnderstanding.nonNegotiables.slice(0, 3)
    ],
    inspiration,
    traits: thesisInput.creativeTraits,
    antiPrinciples: thesisInput.antiPrinciples,
    audience: thesisInput.audience,
    commercialObjective: thesisInput.commercialObjective,
    authoredCandidate: thesisInput.authoredCandidate
  });
  const creativeWorldExploration = buildCreativeWorldExploration({
    creativeThesis,
    authoredWorlds: candidateInput.worlds
  });
  return { productUnderstanding, inspiration, creativeThesis, creativeWorldExploration };
}

test('AI Council current product understanding authorizes creative thesis from current repository evidence', () => {
  const { productUnderstanding } = buildRun();
  assert.equal(productUnderstanding.sourceRevision, '07339ffe056767fd1c2c117cb0ab047de31285e0');
  assert.equal(productUnderstanding.reviewReady, true, JSON.stringify(productUnderstanding.findings, null, 2));
  assert.equal(productUnderstanding.status, 'ready-for-creative-thesis');
  assert.equal(productUnderstanding.truth.creativeWorkAuthorized, true);
  assert.deepEqual(productUnderstanding.evidenceCoverage.missing, []);
  assert.ok(productUnderstanding.productMechanics.some((item) => /Problem Formulation/i.test(item)));
  assert.ok(productUnderstanding.productMechanics.some((item) => /Strategy Comparison/i.test(item)));
});

test('AI Council research is evidence-ready and rejects agent-dashboard transfer', () => {
  const { inspiration } = buildRun();
  assert.equal(inspiration.status, 'ready');
  assert.equal(inspiration.evidenceReady, true);
  assert.deepEqual(inspiration.missingLanes, []);
  assert.ok(inspiration.referenceMatrix.length >= 6);
  assert.ok(inspiration.opportunityGaps.some((item) => /defensible technical decision/i.test(item)));
  assert.ok(inspiration.lanes.antiReferences.some((item) => /mission-control/i.test(item)));
});

test('AI Council authored Creative Thesis is review-ready without fabricating human approval', () => {
  const { creativeThesis } = buildRun();
  assert.equal(creativeThesis.reviewReady, true, JSON.stringify(creativeThesis.findings, null, 2));
  assert.equal(creativeThesis.status, 'ready-for-creative-direction-review');
  assert.equal(creativeThesis.authorship.mode, 'authored-candidate');
  assert.match(creativeThesis.governingIdea.statement, /decision should not appear; it should resolve/i);
  assert.match(creativeThesis.creativeTension.label, /open inquiry × governed commitment/i);
  assert.equal(creativeThesis.truth.humanCreativeApproval, false);
  assert.equal(creativeThesis.truth.creativeThesisFrozen, false);
  assert.ok(creativeThesis.alternativesConsidered.length >= 3);
});

test('AI Council Creative Worlds are structurally complete and genuinely divergent at the heuristic layer', () => {
  const { creativeWorldExploration } = buildRun();
  assert.equal(creativeWorldExploration.pass, true, JSON.stringify(creativeWorldExploration.findings, null, 2));
  assert.equal(creativeWorldExploration.reviewReady, true, JSON.stringify(creativeWorldExploration.findings, null, 2));
  assert.equal(creativeWorldExploration.status, 'ready-for-style-frame-proof');
  assert.deepEqual(creativeWorldExploration.worlds.map((world) => world.id), ['counterpoint', 'threshold', 'decision-spine']);
  assert.ok(creativeWorldExploration.worlds.every((world) => world.reviewReady === true));
  assert.ok(creativeWorldExploration.divergence.every((pair) => pair.heuristicPass === true && pair.differenceCount >= 4));
  assert.equal(creativeWorldExploration.selectedWorld, null);
  assert.equal(creativeWorldExploration.truth.selectedAutomatically, false);
  assert.equal(creativeWorldExploration.review.truth.humanSemanticDivergenceReviewed, false);
});

test('persisted AI Council world artifact matches runtime-authored decisions and remains unselected', () => {
  const { creativeThesis, creativeWorldExploration } = buildRun();
  assert.equal(persistedExploration.schema, 'ai-studio-os/creative-world-exploration@1');
  assert.equal(persistedExploration.reviewReady, creativeWorldExploration.reviewReady);
  assert.equal(persistedExploration.status, creativeWorldExploration.status);
  assert.equal(persistedExploration.thesisRef.governingIdea, creativeThesis.governingIdea.statement);
  assert.deepEqual(persistedExploration.worlds.map((world) => world.id), creativeWorldExploration.worlds.map((world) => world.id));

  for (const runtimeWorld of creativeWorldExploration.worlds) {
    const persisted = persistedExploration.worlds.find((world) => world.id === runtimeWorld.id);
    assert.ok(persisted, `missing persisted world ${runtimeWorld.id}`);
    for (const field of ['worldIdea', 'interpretationOfThesis', 'signatureBehavior', 'worldClass', 'narrativeModel', 'compositionModel', 'imageLanguage', 'materialLanguage', 'motionLanguage', 'interactionModel', 'responsiveStrategy']) {
      assert.equal(persisted[field], runtimeWorld[field], `${runtimeWorld.id}: ${field} drift`);
    }
    assert.equal(persisted.typographyIntent.statement, runtimeWorld.typographyIntent.statement);
    assert.equal(persisted.reviewReady, runtimeWorld.reviewReady);
    assert.equal(persisted.selected, false);
    assert.equal(persisted.truth.humanCreativeSelectionConfirmed, false);
    assert.equal(persisted.truth.visualWorldProofReviewed, false);
  }

  assert.equal(persistedExploration.selection, null);
  assert.equal(persistedExploration.selectedWorld, null);
  assert.equal(persistedExploration.visualProof, null);
  assert.equal(persistedExploration.truth.selectedAutomatically, false);
});

test('Command Center exposes the three worlds but refuses to lock any before real visual proof', () => {
  const catalog = buildCreativeWorldCatalog('ai-council', persistedExploration);
  assert.equal(catalog.pass, true, JSON.stringify(catalog.findings, null, 2));
  assert.equal(catalog.reviewReady, true);
  assert.equal(catalog.status, 'awaiting-visual-proof');
  assert.equal(catalog.candidates.length, 3);
  assert.equal(catalog.lockableCount, 0);
  assert.ok(catalog.candidates.every((candidate) => candidate.canLock === false));
  assert.ok(catalog.candidates.every((candidate) => candidate.visualProof.status === 'proof-required'));
});
