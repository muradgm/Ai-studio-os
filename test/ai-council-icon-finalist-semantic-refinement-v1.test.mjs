import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ICON_FINALIST_WORLDS,
  ICON_FINALIST_MUST_REVISIT,
  ICON_FINALIST_REFINE,
  ICON_FINALIST_TUNING,
  ICON_FINALIST_FREEZE,
  ICON_FINALIST_SIZES,
  buildIconFinalistSemanticRefinementPlan,
  buildIconFinalistSemanticEvidence
} from '../modules/icon-system/finalist-semantic-refinement.mjs';
import {
  listFinalistCandidates,
  renderFinalistGlyphSvg,
  renderFinalistPreservedGlyphSvg
} from '../modules/icon-system/finalist-glyphs.mjs';
import { renderCraftGlyphSvg } from '../modules/icon-system/craft-glyphs.mjs';
import { validateCalibrationSvg } from '../modules/icon-system/calibration-glyphs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..', 'projects', 'ai-council');
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(projectRoot, name), 'utf8'));

const craftReview = await readJson('icon-world-craft-review-v1.json');
const input = await readJson('icon-finalist-semantic-refinement-v1.json');

function fakeEvidence(worldId) {
  return { worldId, imageRef: `artifacts/${worldId}.png`, sourceRef: `artifacts/${worldId}.html` };
}

test('finalist plan narrows active refinement to Provenance and Editorial and holds selection', () => {
  const plan = buildIconFinalistSemanticRefinementPlan(input, { craftReview });
  assert.equal(plan.reviewReady, true);
  assert.equal(plan.status, 'ready-for-finalist-browser-proof');
  assert.deepEqual([...plan.activeWorlds].sort(), [...ICON_FINALIST_WORLDS].sort());
  assert.deepEqual(plan.retiredFromActiveRefinement, ['quiver-construct']);
  assert.equal(plan.selectedWorld, null);
  assert.equal(plan.truth.humanSelectionRecommendedNow, false);
  assert.equal(plan.truth.iconWorldHumanSelected, false);
});

test('must-revisit concepts have three in-world hypotheses without new worlds', () => {
  for (const worldId of ICON_FINALIST_WORLDS) {
    for (const iconId of ICON_FINALIST_MUST_REVISIT) assert.equal(listFinalistCandidates(worldId, iconId).length, 3, `${worldId}:${iconId}`);
    for (const iconId of ICON_FINALIST_REFINE) assert.equal(listFinalistCandidates(worldId, iconId).length, 2, `${worldId}:${iconId}`);
    for (const iconId of ICON_FINALIST_TUNING) assert.equal(listFinalistCandidates(worldId, iconId).length, 1, `${worldId}:${iconId}`);
  }
  assert.throws(() => listFinalistCandidates('quiver-construct', 'council').length && renderFinalistGlyphSvg('quiver-construct','council','x'));
});

test('all finalist candidate SVG hypotheses are valid at 14, 16 and 24px', () => {
  for (const worldId of ICON_FINALIST_WORLDS) {
    for (const iconId of [...ICON_FINALIST_MUST_REVISIT, ...ICON_FINALIST_REFINE, ...ICON_FINALIST_TUNING]) {
      for (const candidate of listFinalistCandidates(worldId, iconId)) {
        for (const size of ICON_FINALIST_SIZES) {
          const rendered = renderFinalistGlyphSvg(worldId, iconId, candidate.id, { size });
          assert.equal(rendered.semanticRefined, true);
          assert.equal(validateCalibrationSvg(rendered.svg).pass, true, `${worldId}:${iconId}:${candidate.id}:${size}`);
        }
      }
    }
  }
});

test('convention-dominant controls remain frozen at craft geometry', () => {
  for (const worldId of ICON_FINALIST_WORLDS) {
    for (const iconId of ICON_FINALIST_FREEZE) {
      for (const size of ICON_FINALIST_SIZES) {
        const frozen = renderFinalistPreservedGlyphSvg(worldId, iconId, { size });
        const craft = renderCraftGlyphSvg(worldId, iconId, { size });
        assert.equal(frozen.svg, craft.svg, `${worldId}:${iconId}:${size}`);
      }
    }
  }
});

test('browser evidence can become independent-review-ready without preselecting candidates or a world', () => {
  const plan = buildIconFinalistSemanticRefinementPlan(input, { craftReview });
  const hypothesisEvidence = [];
  for (const worldId of ICON_FINALIST_WORLDS) {
    for (const iconId of [...ICON_FINALIST_MUST_REVISIT, ...ICON_FINALIST_REFINE, ...ICON_FINALIST_TUNING]) {
      for (const candidate of listFinalistCandidates(worldId, iconId)) hypothesisEvidence.push({ worldId, iconId, candidateId: candidate.id });
    }
  }
  const proof = buildIconFinalistSemanticEvidence({
    plan,
    hypothesisEvidence,
    collisionEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    textPairEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    uiContextEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    mobileTargetEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    finalistWorldEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    contextFixtureCandidates: ICON_FINALIST_WORLDS.map((worldId) => ({ worldId, candidates: {}, contextFixtureOnly: true, worldSelection: false, humanSelected: false })),
    candidateRecommendations: []
  });
  assert.equal(proof.reviewReady, true);
  assert.equal(proof.status, 'ready-for-independent-finalist-review');
  assert.equal(proof.selectedWorld, null);
  assert.equal(proof.truth.independentFinalistDesignReviewComplete, false);
  assert.equal(proof.truth.humanSelectionRecommendedNow, false);
  assert.equal(proof.truth.iconWorldHumanSelected, false);
});

test('candidate recommendation cannot smuggle in world selection authority', () => {
  const plan = buildIconFinalistSemanticRefinementPlan(input, { craftReview });
  const hypothesisEvidence = [];
  for (const worldId of ICON_FINALIST_WORLDS) {
    for (const iconId of [...ICON_FINALIST_MUST_REVISIT, ...ICON_FINALIST_REFINE, ...ICON_FINALIST_TUNING]) {
      for (const candidate of listFinalistCandidates(worldId, iconId)) hypothesisEvidence.push({ worldId, iconId, candidateId: candidate.id });
    }
  }
  const proof = buildIconFinalistSemanticEvidence({
    plan,
    hypothesisEvidence,
    collisionEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    textPairEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    uiContextEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    mobileTargetEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    finalistWorldEvidence: ICON_FINALIST_WORLDS.map(fakeEvidence),
    contextFixtureCandidates: ICON_FINALIST_WORLDS.map((worldId) => ({ worldId, candidates: {}, contextFixtureOnly: true, worldSelection: false, humanSelected: false })),
    candidateRecommendations: [{ worldId: 'provenance-glyph', worldSelection: true, recommendationAuthority: 'independent-design-review' }]
  });
  assert.equal(proof.reviewReady, false);
  assert.equal(proof.pass, false);
  assert.ok(proof.findings.some((item) => item.code === 'icon-finalist-candidate-recommendation-authority-invalid'));
});
