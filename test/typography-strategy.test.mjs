import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBusinessTypographyStrategy } from '../modules/typography/strategy.mjs';
import { buildTypographySystem, validateTypographyBenchmark } from '../modules/typography/runtime.mjs';

const catalog = [
  { id:'newsreader', provider:'google-fonts', family:'Newsreader', category:'serif', variants:['regular','500','600','700'], subsets:['latin','latin-ext'], files:{regular:'x'}, axes:[{tag:'wght',start:200,end:800}], descriptors:{xHeight:55,width:52,strokeContrast:68,roundness:45} },
  { id:'manrope', provider:'google-fonts', family:'Manrope', category:'sans-serif', variants:['regular','500','600','700','800'], subsets:['latin','latin-ext'], files:{regular:'x'}, axes:[{tag:'wght',start:200,end:800}], descriptors:{xHeight:66,width:55,strokeContrast:18,roundness:62} },
  { id:'plex', provider:'google-fonts', family:'IBM Plex Mono', category:'monospace', variants:['regular','500','600'], subsets:['latin','latin-ext'], files:{regular:'x'}, axes:[], descriptors:{xHeight:64,width:60,strokeContrast:10,roundness:42} },
  { id:'poppins', provider:'google-fonts', family:'Poppins', category:'sans-serif', variants:['regular','500','600','700'], subsets:['latin','latin-ext'], files:{regular:'x'}, axes:[], descriptors:{xHeight:67,width:58,strokeContrast:12,roundness:76} }
];

test('business strategy turns client context into typography pressures', () => {
  const strategy = buildBusinessTypographyStrategy({
    business:{ type:'French patisserie', industry:'hospitality food retail', model:'local-retail', positioning:'premium but accessible' },
    brand:{ traits:['warm','refined','artisanal','contemporary'] },
    requirements:{ languages:['de','fr','en'] }
  });
  assert.ok(strategy.pressures.warmth >= 70);
  assert.ok(strategy.pressures.expression >= 70);
  assert.ok(strategy.pressures.distinctiveness >= 70);
  assert.ok(strategy.pressures.accessibility >= 70);
});

test('explicit typography pressures override inferred defaults', () => {
  const strategy = buildBusinessTypographyStrategy({
    business:{ type:'luxury gallery', typographyPressures:{ expression:25, trust:92 } }
  });
  assert.equal(strategy.pressures.expression, 25);
  assert.equal(strategy.pressures.trust, 92);
});

test('typography benchmark validates client strategy and pairing threshold', () => {
  const output = buildTypographySystem({
    catalog,
    business:{ type:'French patisserie', industry:'hospitality food retail', model:'local-retail', positioning:'premium but accessible' },
    brand:{ traits:['warm','refined','artisanal','contemporary'] },
    requirements:{ languages:['de','fr','en'] },
    pairing:{ strategy:'contrast-with-coherence', minScore:75 },
    marketCommonFamilies:['Poppins']
  });
  const result = validateTypographyBenchmark(output, {
    pass:true,
    displayFamily:'Newsreader',
    bodyFamily:'Manrope',
    utilityFamily:'IBM Plex Mono',
    minPairingScore:85,
    excludedFamilies:['Poppins'],
    minPressures:[{key:'warmth',value:70},{key:'distinctiveness',value:70}]
  });
  assert.equal(result.pass, true, result.failures.join('\n'));
});

test('pairing threshold can block weak systems instead of silently selecting one', () => {
  const output = buildTypographySystem({
    catalog: catalog.map(({descriptors, ...font}) => font),
    business:{ type:'French patisserie' },
    requirements:{ languages:['de','fr','en'] },
    pairing:{ minScore:99 }
  });
  assert.equal(output.pass, false);
  assert.equal(output.findings[0].code, 'typography-no-valid-pairing');
});
