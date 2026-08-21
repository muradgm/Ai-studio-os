import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildTypographyProductionConfig } from '../modules/typography/export.mjs';
import { buildTypographyConsumptionContract } from '../modules/design/typography-consumption.mjs';

const typography = {
  pass:true,
  selection:{
    display:{
      role:'display', family:'Roboto Flex', category:'sans-serif', fallback:'sans-serif', source:'google-fonts',
      variable:true, weights:[400,600], axes:[
        {tag:'opsz',start:8,end:144}, {tag:'wdth',start:25,end:151}, {tag:'wght',start:100,end:1000}, {tag:'GRAD',start:-200,end:150}
      ]
    },
    body:{
      role:'body', family:'Manrope', category:'sans-serif', fallback:'sans-serif', source:'google-fonts',
      variable:true, weights:[400,500,600], axes:[{tag:'wght',start:200,end:800}]
    },
    utility:null
  },
  application:{
    pass:true,
    ratio:1.2,
    mobileRatio:1.16,
    measure:{min:48,ideal:60,max:68,unit:'ch'},
    styles:{
      h1:{family:'Roboto Flex',sizePx:64,weight:600,lineHeight:1,trackingEm:-0.02,axes:{opsz:64,wdth:125,wght:600}},
      body:{family:'Manrope',sizePx:16,weight:400,lineHeight:1.55,trackingEm:0,axes:{wght:400}}
    },
    mobileStyles:{
      h1:{family:'Roboto Flex',sizePx:44,weight:600,lineHeight:1,trackingEm:-0.015,axes:{opsz:44,wdth:125,wght:600}},
      body:{family:'Manrope',sizePx:16,weight:400,lineHeight:1.5,trackingEm:0,axes:{wght:400}}
    }
  },
  systemCritique:{score:90},
  systems:[{pairing:{score:90}}],
  intelligence:{winnerEvidenceLevel:'evidence-backed-structural'}
};

typography.production = buildTypographyProductionConfig(typography);
const contract = buildTypographyConsumptionContract(typography);
assert.equal(contract.pass, true, `contract blocked: ${JSON.stringify(contract.findings)}`);
assert.ok(contract.production.css2Url.includes('Roboto+Flex:opsz,wdth,wght@'));
assert.ok(!contract.production.css2Url.includes('GRAD'), 'unused GRAD axis leaked into CSS2 request');
assert.ok(!contract.production.css2Url.includes('key='), 'Developer API key leaked into CSS2 URL');

const variableCss = contract.production.cssVariables;
const styleText = `
  :root { ${Object.entries(variableCss).map(([key,value])=>`${key}:${value};`).join('')} }
  body { font-family: var(--font-family-body); font-size: var(--type-body-size); font-weight: var(--type-body-weight); font-variation-settings: var(--type-body-variation-settings); }
  h1 { font-family: var(--font-family-display); font-size: var(--type-h1-size); font-weight: var(--type-h1-weight); font-variation-settings: var(--type-h1-variation-settings); }
`;

const html = `<!doctype html><html><head><link rel="stylesheet" href="${contract.production.css2Url}"><style>${styleText}</style></head><body><h1 id="display">Typography proof</h1><p id="body">Readable body proof.</p></body></html>`;

const browser = await chromium.launch({headless:true});
const page = await browser.newPage();
const requests = [];
page.on('request', (request)=>requests.push(request.url()));
try {
  await page.setContent(html, {waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);

  const evidence = await page.evaluate(() => {
    const display = getComputedStyle(document.querySelector('#display'));
    const body = getComputedStyle(document.querySelector('#body'));
    return {
      displayLoaded:document.fonts.check('600 64px "Roboto Flex"'),
      bodyLoaded:document.fonts.check('400 16px "Manrope"'),
      displayFamily:display.fontFamily,
      bodyFamily:body.fontFamily,
      displayVariation:display.fontVariationSettings,
      bodyVariation:body.fontVariationSettings
    };
  });

  assert.equal(evidence.displayLoaded, true, 'Roboto Flex did not load in Chromium');
  assert.equal(evidence.bodyLoaded, true, 'Manrope did not load in Chromium');
  assert.match(evidence.displayFamily, /Roboto Flex/i);
  assert.match(evidence.bodyFamily, /Manrope/i);
  assert.match(evidence.displayVariation, /opsz/i);
  assert.match(evidence.displayVariation, /wdth/i);
  assert.match(evidence.displayVariation, /wght/i);
  assert.doesNotMatch(evidence.displayVariation, /GRAD/i);
  assert.match(evidence.bodyVariation, /wght/i);

  const browserUrls = requests.join('\n');
  assert.match(browserUrls, /fonts\.googleapis\.com/);
  assert.match(browserUrls, /fonts\.gstatic\.com/);
  assert.doesNotMatch(browserUrls, /GOOGLE_FONTS_API_KEY|AIza|[?&]key=/i);

  console.log(JSON.stringify({pass:true, css2Url:contract.production.css2Url, evidence, requestCount:requests.length}, null, 2));
} finally {
  await browser.close();
}
