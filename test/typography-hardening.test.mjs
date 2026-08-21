import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGoogleFontsCss2Url } from '../modules/typography/export.mjs';
import { critiqueTypographySystem } from '../modules/typography/system-intelligence.mjs';
import { buildTypographySystem } from '../modules/typography/runtime.mjs';

test('Google Fonts CSS2 export preserves declared variable-axis ranges and ordering', () => {
  const url = buildGoogleFontsCss2Url([
    {
      family:'Roboto Flex',
      source:'google-fonts',
      variable:true,
      weights:[400,600],
      axes:[
        { tag:'wght', start:100, end:1000 },
        { tag:'opsz', start:8, end:144 },
        { tag:'GRAD', start:-200, end:150 }
      ]
    }
  ]);
  assert.equal(
    url,
    'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght,GRAD@8..144,100..1000,-200..150&display=swap'
  );
});

test('built-in cliché pairs use the same canonical key as runtime lookup', () => {
  const system = {
    display:{
      font:{ family:'Playfair Display', category:'serif' },
      scores:{ business:{score:90}, production:{score:90}, distinctiveness:{score:80} }
    },
    body:{
      font:{ family:'Montserrat', category:'sans-serif' },
      scores:{ business:{score:90}, production:{score:90}, distinctiveness:{score:80} }
    },
    utility:null,
    pairing:{ score:90 }
  };
  const review = critiqueTypographySystem(system);
  assert.equal(review.dimensions.cliche.risk, 'high');
  assert.ok(review.findings.some((finding)=>finding.code === 'typography-pair-cliche-risk'));
});

test('single-family runtime keeps utility on the selected family instead of introducing a third family', () => {
  const font = {
    family:'Unified Sans',
    provider:'google-fonts',
    category:'sans-serif',
    variants:['regular','500','600','700'],
    subsets:['latin'],
    files:{ regular:'https://fonts.example/unified.ttf' },
    axes:[{ tag:'wght', start:300, end:800 }]
  };
  const result = buildTypographySystem({
    catalog:[font],
    business:{ type:'software', model:'b2b', positioning:'professional' },
    brand:{ traits:['technical','minimal'] },
    requirements:{ languages:['en'] },
    pairing:{ strategy:'single-family', minScore:60, minSystemScore:60 }
  });
  assert.equal(result.pass, true);
  assert.equal(result.selection.display.family, 'Unified Sans');
  assert.equal(result.selection.body.family, 'Unified Sans');
  assert.equal(result.selection.utility.family, 'Unified Sans');
});
