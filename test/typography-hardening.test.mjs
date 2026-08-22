import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGoogleFontsCss2Url } from '../modules/typography/export.mjs';
import { critiqueTypographySystem } from '../modules/typography/system-intelligence.mjs';
import { buildTypographySystem } from '../modules/typography/runtime.mjs';
import { buildTypographyConsumptionContract, consumeTypographyContract } from '../modules/design/typography-consumption.mjs';

function unifiedFont() {
  return {
    family:'Unified Sans',
    provider:'google-fonts',
    category:'sans-serif',
    variants:['regular','500','600','700'],
    subsets:['latin'],
    files:{ regular:'https://fonts.example/unified.ttf' },
    axes:[{ tag:'wght', start:300, end:800 }]
  };
}

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
  const result = buildTypographySystem({
    catalog:[unifiedFont()],
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

test('runtime normalizes invalid limits and score thresholds instead of leaking Array.slice edge behavior', () => {
  const result = buildTypographySystem({
    catalog:[unifiedFont()],
    requirements:{ languages:['en'] },
    pairing:{ strategy:'single-family', minScore:-40, minSystemScore:140 },
    candidateLimit:-5,
    systemLimit:0
  });
  assert.equal(result.context?.limits?.candidateLimit ?? 8, 8);
  assert.equal(result.context?.limits?.systemLimit ?? 3, 3);
  if (result.context?.pairing) {
    assert.equal(result.context.pairing.minScore, 0);
    assert.equal(result.context.pairing.minSystemScore, 100);
  } else {
    assert.equal(result.findings[0].minSystemScore, 100);
  }
});

test('runtime rejects non-array market and exclusion inputs early', () => {
  assert.throws(
    () => buildTypographySystem({ catalog:[unifiedFont()], marketCommonPairs:'bad-input' }),
    /marketCommonPairs must be an array/
  );
  assert.throws(
    () => buildTypographySystem({ catalog:[unifiedFont()], avoidFamilies:{} }),
    /avoidFamilies must be an array/
  );
});

test('Google-backed consumption contract blocks when its loader is missing', () => {
  const contract = buildTypographyConsumptionContract({
    pass:true,
    selection:{
      display:{ family:'Display Sans', source:'google-fonts', weights:[600] },
      body:{ family:'Body Sans', source:'google-fonts', weights:[400] }
    },
    application:{ styles:{ h1:{family:'Display Sans'}, body:{family:'Body Sans'} } },
    production:{
      css2Url:null,
      cssVariables:{ '--font-family-display':"'Display Sans', sans-serif", '--font-family-body':"'Body Sans', sans-serif" },
      families:[]
    }
  });
  assert.equal(contract.status, 'blocked');
  assert.equal(contract.pass, false);
  assert.ok(contract.findings.some((finding)=>finding.code === 'typography-consumption-google-font-loader-missing'));
  const consumed = consumeTypographyContract(contract);
  assert.equal(consumed.pass, false);
});
