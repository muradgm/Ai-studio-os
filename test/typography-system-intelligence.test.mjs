import test from 'node:test';
import assert from 'node:assert/strict';

import { critiqueTypographySystem, rankTypographySystems } from '../modules/typography/system-intelligence.mjs';
import { buildTypographySystem } from '../modules/typography/runtime.mjs';

function candidate(family, category, {
  business=85, production=90, distinctiveness=85, descriptors={}
}={}) {
  return {
    font:{ family, category, variants:['regular','500','600','700'], subsets:['latin','latin-ext'], files:{regular:'x'}, intelligence:{ evidenceBacked:true, confidence:90, descriptors, sources:[{type:'test',reference:`fixture://${family}`,confidence:90}] } },
    scores:{ total:88, business:{score:business}, production:{score:production}, distinctiveness:{score:distinctiveness} }
  };
}

function system(display, body, utility=null, pairingScore=86) {
  return { overall:86, display, body, utility, pairing:{score:pairingScore,evidenceLevel:'evidence-backed-structural'} };
}

test('system critique rejects a known cliche pair even when component scores are strong', () => {
  const output = critiqueTypographySystem(system(
    candidate('Playfair Display','serif'),
    candidate('Montserrat','sans-serif')
  ));
  assert.equal(output.pass, false);
  assert.ok(output.findings.some((finding)=>finding.code === 'typography-pair-cliche-risk'));
});

test('system critique rewards controlled measured role separation', () => {
  const output = critiqueTypographySystem(system(
    candidate('Distinct Serif','serif',{descriptors:{xHeight:52,width:48,strokeContrast:75,roundness:58}}),
    candidate('Calm Sans','sans-serif',{descriptors:{xHeight:60,width:55,strokeContrast:30,roundness:67}}),
    candidate('Utility Mono','monospace')
  ), { strategy:{pressures:{technicality:72}} });
  assert.ok(output.dimensions.roleSeparation.score >= 80);
  assert.equal(output.pass, true);
});

test('single-family strategy is not falsely rejected for using one family', () => {
  const shared = candidate('Variable Family','sans-serif');
  const output = critiqueTypographySystem(system(shared, shared, null, 94), { pairingStrategy:'single-family' });
  assert.ok(output.dimensions.roleSeparation.score >= 80);
  assert.equal(output.findings.some((finding)=>finding.code === 'typography-role-separation-weak'), false);
});

test('ranking prefers system-level quality over raw component overall', () => {
  const cliche = system(candidate('Playfair Display','serif'), candidate('Montserrat','sans-serif'));
  cliche.overall = 95;
  const distinctive = system(candidate('Distinct Serif','serif'), candidate('Calm Sans','sans-serif'));
  distinctive.overall = 84;
  const ranked = rankTypographySystems([cliche, distinctive]);
  assert.equal(ranked[0].system.display.font.family, 'Distinct Serif');
});

test('runtime blocks when every candidate system has a major critique finding', () => {
  const catalog = [
    {family:'Playfair Display',category:'serif',variants:['regular','500','600','700'],subsets:['latin'],files:{regular:'x'},provider:'google-fonts'},
    {family:'Montserrat',category:'sans-serif',variants:['regular','500','600','700'],subsets:['latin'],files:{regular:'x'},provider:'google-fonts'}
  ];
  const output = buildTypographySystem({
    catalog,
    business:{ preferredCategories:{display:['serif'],body:['sans-serif']} },
    requirements:{languages:['en']},
    pairing:{minScore:50,minSystemScore:50},
    candidateLimit:2
  });
  assert.equal(output.pass, false);
  assert.equal(output.findings[0].code, 'typography-no-acceptable-system');
  assert.ok(output.alternatives.length > 0);
});
