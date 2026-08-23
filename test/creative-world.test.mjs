import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCreativeWorldExploration, selectCreativeWorld } from '../modules/creative-world/runtime.mjs';

const thesis = {
  schema:'ai-studio-os/creative-thesis@1', stage:'creative-thesis', projectId:'test-project',
  status:'ready-for-creative-direction-review', reviewReady:true,
  governingIdea:{statement:'Make evidence become the organizing experience behavior.'},
  creativeTension:{label:'evidence × anticipation'}, categoryRejections:['generic luxury','decorative spectacle']
};

function world(id, overrides={}) {
  const index = Number(id.replace(/\D/g,'')) || 1;
  return {
    id, label:`World ${index}`,
    worldIdea:`World ${index} gives the thesis a distinct experience behavior rooted in project evidence.`,
    interpretationOfThesis:`World ${index} interprets the same evidence thesis without changing its governing idea.`,
    signatureBehavior:`signature-behavior-${index}`,
    worldClass:`class-${index}`, narrativeModel:`narrative-${index}`, compositionModel:`composition-${index}`,
    typographyIntent:{statement:`Typography intent ${index} defines hierarchy behavior without naming a final family.`,pressures:{expression:50+index}},
    imageLanguage:`image-language-${index}`, materialLanguage:`material-language-${index}`, motionLanguage:`motion-language-${index}`,
    interactionModel:`interaction-model-${index}`, responsiveStrategy:`responsive-strategy-${index}`,
    soundPolicy:'Silence is valid; sound requires a world-specific reason.',
    categoryTransferTest:{whyProjectSpecific:`project-specific-reason-${index}`,transferRisk:'medium'},
    antiPatterns:[`generic-pattern-${index}`,`decorative-pattern-${index}`], ...overrides
  };
}

test('Creative World exploration requires a review-ready Creative Thesis', () => {
  const output = buildCreativeWorldExploration({creativeThesis:{...thesis,reviewReady:false,status:'provisional'},authoredWorlds:[world('world-1'),world('world-2'),world('world-3')]});
  assert.equal(output.pass,false);
  assert.ok(output.findings.some((item)=>item.code==='creative-world-thesis-not-review-ready'));
});

test('3–5 complete worlds become ready for visual proof without selecting a winner', () => {
  const output = buildCreativeWorldExploration({creativeThesis:thesis,authoredWorlds:[world('world-1'),world('world-2'),world('world-3')]});
  assert.equal(output.pass,true);
  assert.equal(output.reviewReady,true);
  assert.equal(output.status,'ready-for-style-frame-proof');
  assert.equal(output.worlds.length,3);
  assert.ok(output.worlds.every((item)=>item.reviewReady===true));
  assert.ok(output.divergence.every((pair)=>pair.heuristicPass===true && pair.proofLevel==='structural-heuristic'));
  assert.equal(output.review.truth.humanSemanticDivergenceReviewed,false);
  assert.equal(output.selectedWorld,null);
  assert.equal(output.truth.selectedAutomatically,false);
});

test('cosmetic variants are rejected even when labels and typography differ', () => {
  const base = world('world-1');
  const cosmetic = world('world-2',{worldClass:base.worldClass,narrativeModel:base.narrativeModel,compositionModel:base.compositionModel,imageLanguage:base.imageLanguage,motionLanguage:base.motionLanguage,interactionModel:'slightly different pointer response',responsiveStrategy:base.responsiveStrategy,typographyIntent:{statement:'Different mood only.'}});
  const output = buildCreativeWorldExploration({creativeThesis:thesis,authoredWorlds:[base,cosmetic,world('world-3')]});
  assert.equal(output.pass,true);
  assert.equal(output.reviewReady,false);
  assert.ok(output.findings.some((item)=>item.code==='creative-world-cosmetic-variation'));
});

test('technology cannot become the Creative World concept', () => {
  const output = buildCreativeWorldExploration({creativeThesis:thesis,authoredWorlds:[world('world-1',{worldIdea:'A WebGL world where 3D spectacle is the concept.'}),world('world-2'),world('world-3')]});
  assert.equal(output.pass,false);
  assert.ok(output.findings.some((item)=>item.code==='creative-world-technology-became-concept'));
});

test('project specificity and signature behavior are required', () => {
  const output = buildCreativeWorldExploration({creativeThesis:thesis,authoredWorlds:[world('world-1',{signatureBehavior:'',categoryTransferTest:{}}),world('world-2'),world('world-3')]});
  assert.equal(output.reviewReady,false);
  assert.ok(output.findings.some((item)=>item.code==='creative-world-signature-behavior-missing'));
  assert.ok(output.findings.some((item)=>item.code==='creative-world-project-specificity-missing'));
});

test('selection cannot occur without explicit human and visual-proof confirmation', () => {
  const exploration = buildCreativeWorldExploration({creativeThesis:thesis,authoredWorlds:[world('world-1'),world('world-2'),world('world-3')]});
  const pending = selectCreativeWorld(exploration,{worldId:'world-2',humanConfirmed:true});
  assert.equal(pending.selectedWorld,null);
  assert.ok(pending.findings.some((item)=>item.code==='creative-world-visual-proof-review-required'));
});

test('visual-proof-backed human selection creates an authoritative world while later approvals stay false', () => {
  const exploration = buildCreativeWorldExploration({creativeThesis:thesis,authoredWorlds:[world('world-1'),world('world-2'),world('world-3')]});
  const selected = selectCreativeWorld(exploration,{worldId:'world-2',humanConfirmed:true,visualReviewConfirmed:true,visualEvidenceRefs:['artifact://style-frame/world-2'],rationale:'World 2 survives the comparative visual proof.'});
  assert.equal(selected.selectedWorld.id,'world-2');
  assert.equal(selected.selectedWorld.schema,'ai-studio-os/creative-world@1');
  assert.equal(selected.selectedWorld.selected,true);
  assert.equal(selected.selectedWorld.reviewReady,true);
  assert.equal(selected.selectedWorld.truth.humanCreativeSelectionConfirmed,true);
  assert.equal(selected.selectedWorld.truth.visualWorldProofReviewed,true);
  assert.equal(selected.selectedWorld.truth.styleFrameReviewComplete,true);
  assert.equal(selected.selectedWorld.truth.typographyApproved,false);
  assert.equal(selected.selectedWorld.truth.productionTechnologyApproved,false);
  assert.equal(selected.selection.selectedAutomatically,false);
});
