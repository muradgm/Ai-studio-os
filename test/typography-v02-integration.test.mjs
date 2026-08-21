import test from 'node:test';
import assert from 'node:assert/strict';

import { supportsLanguages, resolveLanguageRequirements } from '../modules/typography/scoring.mjs';
import { buildTypographyIntent } from '../modules/typography/typography-intent.mjs';
import { buildTypographySystem } from '../modules/typography/runtime.mjs';
import { buildTypographyApplication } from '../modules/typography/application-intelligence.mjs';
import { buildTypographyProductionConfig } from '../modules/typography/export.mjs';
import { buildTypographyConsumptionContract } from '../modules/design/typography-consumption.mjs';
import { analyzeFontCatalog } from '../modules/typography/catalog-analysis.mjs';
import { loadTypographyRuntimeResources } from '../modules/typography/project-orchestrator.mjs';

test('language coverage resolves common missing languages and fails closed on ambiguous or unsupported requirements', () => {
  assert.equal(supportsLanguages({subsets:['arabic']}, ['fa']), true);
  assert.equal(supportsLanguages({subsets:['thai']}, ['th']), true);
  assert.equal(supportsLanguages({subsets:['latin-ext']}, ['cs']), true);
  assert.equal(supportsLanguages({subsets:['chinese-simplified','chinese-traditional']}, ['zh']), false);
  assert.equal(supportsLanguages({subsets:['latin']}, ['chr']), false);
  assert.ok(resolveLanguageRequirements(['zh']).some((item)=>item.resolved === false));
});

test('Creative Thesis becomes typography creative authority only when review-ready', () => {
  const thesis = {
    schema:'ai-studio-os/creative-thesis@1',
    status:'ready-for-creative-direction-review',
    reviewReady:true,
    projectId:'du-bonheur',
    governingIdea:{statement:'French precision made physically tactile inside contemporary Berlin restraint.'},
    creativeTension:{label:'tactile craft × urban restraint'},
    categoryRejections:['Parisian nostalgia','generic luxury serif behavior'],
    expressionTests:{typography:'Editorial enough to carry craft, but restrained and functional in navigation.'}
  };
  const intent = buildTypographyIntent({
    creativeThesis:thesis,
    creativeWorld:{
      id:'world-02',
      typographyIntent:{
        preferredCategories:{display:['serif','sans-serif'],body:['sans-serif']},
        descriptorTargets:{display:{strokeContrast:{target:55,tolerance:25}},body:{xHeight:{target:64,tolerance:12}}}
      }
    }
  });
  assert.equal(intent.pass, true);
  assert.equal(intent.authority, 'selected-creative-world');
  assert.match(intent.statement, /Editorial enough/i);
  assert.equal(intent.descriptorTargets.body.xHeight.target, 64);

  const blocked = buildTypographyIntent({creativeThesis:{...thesis,reviewReady:false,status:'provisional'}});
  assert.equal(blocked.pass, false);
  assert.ok(blocked.findings.some((item)=>item.code === 'typography-intent-creative-thesis-not-review-ready'));
});

test('typography runtime blocks unresolved language before candidate ranking', () => {
  const output = buildTypographySystem({
    catalog:[{family:'Example',provider:'google-fonts',category:'sans-serif',variants:['regular'],subsets:['latin'],files:{regular:'https://fonts.gstatic.com/example.ttf'},axes:[]}],
    requirements:{languages:['zh']}
  });
  assert.equal(output.pass, false);
  assert.equal(output.findings[0].code, 'typography-language-requirement-unresolved');
});

test('application intelligence uses measured x-height, width and vertical metrics', () => {
  const sharedDisplay = {family:'Display',weights:[600],variable:false,axes:[],intelligence:{descriptors:{capHeight:68,strokeContrast:75,width:52}}};
  const lowX = {
    family:'Body Low X',weights:[400,500,600],variable:false,axes:[],
    intelligence:{descriptors:{xHeight:45,width:68,ascender:76,descender:24,lineGap:4}}
  };
  const highX = {
    family:'Body High X',weights:[400,500,600],variable:false,axes:[],
    intelligence:{descriptors:{xHeight:74,width:44,ascender:72,descender:22,lineGap:0}}
  };
  const a = buildTypographyApplication({selection:{display:sharedDisplay,body:lowX},requirements:{interfaceDense:true}});
  const b = buildTypographyApplication({selection:{display:sharedDisplay,body:highX},requirements:{interfaceDense:true}});
  assert.ok(a.basePx > b.basePx, `expected low x-height font to receive larger body base: ${a.basePx} vs ${b.basePx}`);
  assert.ok(a.measure.ideal < b.measure.ideal, `expected wider glyphs to reduce line measure: ${a.measure.ideal} vs ${b.measure.ideal}`);
  assert.notEqual(a.styles.body.lineHeight, 1.55);
  assert.equal(a.opticalEvidence.body.xHeight, 45);
});

test('canonical contract rejects exact-family drift such as Inter versus Inter Tight', () => {
  const typography = {
    pass:true,
    selection:{display:{family:'Inter',source:'local'},body:{family:'Inter',source:'local'}},
    application:{styles:{h1:{family:'Inter'},body:{family:'Inter'}}},
    production:{
      css2Url:null,
      cssVariables:{'--font-family-display':"'Inter Tight', sans-serif",'--font-family-body':"'Inter', sans-serif"},
      families:[]
    }
  };
  const contract = buildTypographyConsumptionContract(typography);
  assert.equal(contract.pass, false);
  assert.ok(contract.findings.some((item)=>item.code === 'typography-contract-role-token-drift' && item.role === 'display'));
});

test('custom provider font analysis requires an explicit network policy and does not fetch by default', async () => {
  let fetched = false;
  const result = await analyzeFontCatalog([
    {family:'Remote Custom',provider:'custom-upload',files:{regular:'https://127.0.0.1/private.ttf'}}
  ], {
    fetchImpl:async()=>{ fetched = true; throw new Error('must not fetch'); },
    includeGlyphOutlines:false,
    includeStrokeAnalysis:false
  });
  assert.equal(fetched, false);
  assert.equal(result.unavailable, 1);
  assert.equal(result.results[0].reason, 'provider-network-policy-required');
});

test('project orchestration loads catalog and evidence caches explicitly', async () => {
  const catalogPath = '/virtual/catalog.json';
  const intelligencePath = '/virtual/intelligence.json';
  const readFile = async (path) => {
    if (path === catalogPath) return JSON.stringify({provider:'google-fonts',fetchedAt:'2026-08-21T10:00:00.000Z',fonts:[{family:'Manrope'}]});
    if (path === intelligencePath) return JSON.stringify({provider:'google-fonts',catalogFetchedAt:'2026-08-21T10:00:00.000Z',analyzedAt:'2026-08-21T10:05:00.000Z',evidence:[{family:'Manrope',descriptors:{xHeight:65},sources:[{type:'test',reference:'test',confidence:90}]}]});
    const error = new Error('missing'); error.code = 'ENOENT'; throw error;
  };
  const resources = await loadTypographyRuntimeResources({catalogCachePath:catalogPath,intelligenceCachePath:intelligencePath,readFile});
  assert.equal(resources.pass, true);
  assert.equal(resources.catalog.length, 1);
  assert.equal(resources.fontEvidence.length, 1);
});

test('production CSS2 requests only axes actually used by application styles', () => {
  const system = {
    selection:{
      display:{role:'display',family:'Roboto Flex',source:'google-fonts',fallback:'sans-serif',weights:[400,600],variable:true,axes:[
        {tag:'opsz',start:8,end:144},{tag:'wdth',start:25,end:151},{tag:'wght',start:100,end:1000},{tag:'GRAD',start:-200,end:150}
      ]},
      body:{role:'body',family:'Manrope',source:'google-fonts',fallback:'sans-serif',weights:[400,500],variable:true,axes:[{tag:'wght',start:200,end:800}]}
    },
    application:{pass:true,ratio:1.2,mobileRatio:1.16,measure:{ideal:60,max:68,unit:'ch'},styles:{
      h1:{family:'Roboto Flex',sizePx:64,lineHeight:1,trackingEm:-0.02,weight:600,axes:{opsz:64,wght:600}},
      body:{family:'Manrope',sizePx:16,lineHeight:1.55,trackingEm:0,weight:400,axes:{wght:400}}
    },mobileStyles:{}}
  };
  const production = buildTypographyProductionConfig(system);
  assert.match(production.css2Url, /Roboto\+Flex:opsz,wght@/);
  assert.doesNotMatch(production.css2Url, /GRAD|wdth/);
});
