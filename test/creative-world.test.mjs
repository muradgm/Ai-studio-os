import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCreativeWorldExploration,
  selectCreativeWorld
} from '../modules/creative-world/runtime.mjs';

const thesis = {
  schema:'ai-studio-os/creative-thesis@1',
  stage:'creative-thesis',
  projectId:'test-project',
  status:'ready-for-creative-direction-review',
  reviewReady:true,
  governingIdea:{statement:'Make evidence become the organizing experience behavior.'},
  creativeTension:{label:'evidence × anticipation'},
  categoryRejections:['generic luxury','decorative spectacle']
};

function world(id, overrides={}) {
  const index = Number(id.replace(/\D/g,'')) || 1;
  return {
    id,
    label:`World ${index}`,
    worldIdea:`World ${index} gives the thesis a distinct experience behavior rooted in project evidence.`,
    interpretationOfThesis:`World ${index} interprets the same evidence thesis without changing its governing idea.`,
    worldClass:`class-${index}`,
    narrativeModel:`narrative-${index}`,
    compositionModel:`composition-${index}`,
    typographyIntent:{
      statement:`Typography intent ${index} defines hierarchy behavior without naming a final family.`,
      pressures:{expression:50 + index}
    },
    imageLanguage:`image-language-${index}`,
    materialLanguage:`material-language-${index}`,
    motionLanguage:`motion-language-${index}`,
    interactionModel:`interaction-model-${index}`,
    responsiveStrategy:`responsive-strategy-${index}`,
    soundPolicy:'Silence is valid; sound requires a world-specific reason.',
    antiPatterns:[`generic-pattern-${index}`,`decorative-pattern-${index}`],
    ...overrides
  };
}

test('Creative World exploration requires a review-ready Creative Thesis', () => {
  const output = buildCreativeWorldExploration({
    creativeThesis:{...thesis,reviewReady:false,status:'provisional'},
    authoredWorlds:[world('world-1'),world('world-2'),world('world-3')]
  });
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item)=>item.code === 'creative-world-thesis-not-review-ready'));
});

test('3–5 genuinely different authored worlds become ready for world-selection review without selecting a winner', () => {
  const output = buildCreativeWorldExploration({
    creativeThesis:thesis,
    authoredWorlds:[world('world-1'),world('world-2'),world('world-3')]
  });
  assert.equal(output.pass, true);
  assert.equal(output.reviewReady, true);
  assert.equal(output.status, 'ready-for-world-selection-review');
  assert.equal(output.worlds.length, 3);
  assert.ok(output.worlds.every((item)=>item.reviewReady === true));
  assert.ok(output.divergence.every((pair)=>pair.pass === true && pair.differenceCount >= 4));
  assert.equal(output.selectedWorld, null);
  assert.equal(output.truth.selectedAutomatically, false);
  assert.ok(output.worlds.every((item)=>item.selected === false));
});

test('cosmetic variants are rejected even when labels and typography differ', () => {
  const base = world('world-1');
  const cosmetic = world('world-2', {
    worldClass:base.worldClass,
    narrativeModel:base.narrativeModel,
    compositionModel:base.compositionModel,
    imageLanguage:base.imageLanguage,
    motionLanguage:base.motionLanguage,
    interactionModel:'slightly different pointer response',
    responsiveStrategy:base.responsiveStrategy,
    typographyIntent:{statement:'Use a different typographic mood without changing the world.'}
  });
  const third = world('world-3');
  const output = buildCreativeWorldExploration({creativeThesis:thesis,authoredWorlds:[base,cosmetic,third]});
  assert.equal(output.pass, true);
  assert.equal(output.reviewReady, false);
  assert.ok(output.findings.some((item)=>item.code === 'creative-world-cosmetic-variation'));
});

test('technology cannot become the Creative World concept', () => {
  const output = buildCreativeWorldExploration({
    creativeThesis:thesis,
    authoredWorlds:[
      world('world-1',{worldIdea:'A WebGL world where 3D spectacle is the concept.'}),
      world('world-2'),
      world('world-3')
    ]
  });
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((item)=>item.code === 'creative-world-technology-became-concept'));
});

test('selection cannot occur without explicit human confirmation', () => {
  const exploration = buildCreativeWorldExploration({
    creativeThesis:thesis,
    authoredWorlds:[world('world-1'),world('world-2'),world('world-3')]
  });
  const pending = selectCreativeWorld(exploration,{worldId:'world-2',humanConfirmed:false});
  assert.equal(pending.selectedWorld, null);
  assert.equal(pending.truth.humanWorldSelectionConfirmed, false);
  assert.ok(pending.findings.some((item)=>item.code === 'creative-world-human-selection-required'));
});

test('explicit confirmed selection creates the canonical selected-world contract while keeping later approvals false', () => {
  const exploration = buildCreativeWorldExploration({
    creativeThesis:thesis,
    authoredWorlds:[world('world-1'),world('world-2'),world('world-3')]
  });
  const selected = selectCreativeWorld(exploration,{
    worldId:'world-2',
    humanConfirmed:true,
    rationale:'World 2 is the strongest thesis interpretation for the next visual proof.'
  });
  assert.equal(selected.selectedWorld.id, 'world-2');
  assert.equal(selected.selectedWorld.schema, 'ai-studio-os/creative-world@1');
  assert.equal(selected.selectedWorld.selected, true);
  assert.equal(selected.selectedWorld.reviewReady, true);
  assert.equal(selected.selectedWorld.truth.humanCreativeSelectionConfirmed, true);
  assert.equal(selected.selectedWorld.truth.styleFrameReviewComplete, false);
  assert.equal(selected.selectedWorld.truth.typographyApproved, false);
  assert.equal(selected.selectedWorld.truth.productionTechnologyApproved, false);
  assert.equal(selected.selection.selectedAutomatically, false);
});
