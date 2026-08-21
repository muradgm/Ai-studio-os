import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTypographyIntent } from '../modules/typography/typography-intent.mjs';
import { buildTypographySystem } from '../modules/typography/runtime.mjs';

const thesis = {
  schema:'ai-studio-os/creative-thesis@1', reviewReady:true, status:'ready-for-creative-direction-review',
  governingIdea:{statement:'Tactile precision inside contemporary restraint.'},
  expressionTests:{typography:'Editorial tension without nostalgia.'}
};

const selectedWorld = {
  schema:'ai-studio-os/creative-world@1', id:'world-material-atelier', reviewReady:true, selected:true,
  typographyIntent:{ preferredCategories:{display:['serif'],body:['sans-serif']}, pressures:{expression:65} }
};

const catalog = [
  {provider:'google-fonts',family:'Newsreader',category:'serif',variants:['regular','500','600','700'],subsets:['latin','latin-ext'],files:{regular:'https://fonts.gstatic.com/newsreader.ttf'},axes:[]},
  {provider:'google-fonts',family:'Manrope',category:'sans-serif',variants:['regular','500','600','700'],subsets:['latin','latin-ext'],files:{regular:'https://fonts.gstatic.com/manrope.ttf'},axes:[]},
  {provider:'google-fonts',family:'IBM Plex Mono',category:'monospace',variants:['regular','500','600'],subsets:['latin','latin-ext'],files:{regular:'https://fonts.gstatic.com/plex.ttf'},axes:[]}
];

test('explicit art direction overriding a selected world gets its own authority and provenance', () => {
  const intent = buildTypographyIntent({
    creativeThesis:thesis,
    creativeWorld:selectedWorld,
    explicit:{preferredCategories:{display:['sans-serif']},pressures:{expression:95}}
  });
  assert.equal(intent.pass,true);
  assert.equal(intent.authority,'typography-art-direction');
  assert.equal(intent.preferredCategories.display[0],'sans-serif');
  assert.equal(intent.pressureOverrides.expression,95);
  assert.equal(intent.provenance.fieldAuthority.preferredCategories,'typography-art-direction');
  assert.ok(intent.provenance.overrideFields.includes('preferredCategories'));
  assert.ok(intent.provenance.overrideFields.includes('pressures'));
  assert.deepEqual(intent.provenance.layers,['creative-thesis','selected-creative-world','typography-art-direction']);
});

test('selected Creative World blocks canonicalization until typography art direction approves a system', () => {
  const pending = buildTypographySystem({catalog,creativeThesis:thesis,creativeWorld:selectedWorld,requirements:{languages:['de','en']},pairing:{minScore:60}});
  assert.equal(pending.pass,false);
  assert.equal(pending.findings[0].code,'typography-art-direction-review-required');
  assert.equal(pending.selection,null);
  assert.equal(pending.production,null);
  assert.ok(pending.artDirection.systems.length >= 1);

  const selectedSystemId = pending.artDirection.systems[0].systemId;
  const approved = buildTypographySystem({
    catalog,creativeThesis:thesis,creativeWorld:selectedWorld,requirements:{languages:['de','en']},pairing:{minScore:60},
    typographyArtDirection:{schema:'ai-studio-os/typography-art-direction-review@1',reviewReady:true,approved:true,selectedSystemId,rationale:'Best expression of the selected world in real specimen review.',reviewer:'creative-director'}
  });
  assert.equal(approved.pass,true);
  assert.equal(approved.artDirection.mode,'reviewed-selection');
  assert.equal(approved.artDirection.selectedSystemId,selectedSystemId);
  assert.ok(approved.production);
});
