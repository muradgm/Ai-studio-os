import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTypographyConsumptionContract, consumeTypographyContract } from '../modules/design/typography-consumption.mjs';
import { buildDesignPacket } from '../modules/design/runtime.mjs';

function readyTypography() {
  return {
    pass:true,
    selection:{
      display:{ family:'Newsreader', fallback:'serif', weights:[400,600], variable:true, axes:[{tag:'opsz',start:6,end:72}], source:'google-fonts' },
      body:{ family:'Manrope', fallback:'sans-serif', weights:[400,500,600], variable:true, axes:[{tag:'wght',start:200,end:800}], source:'google-fonts' },
      utility:{ family:'IBM Plex Mono', fallback:'monospace', weights:[400,500], variable:false, axes:[], source:'google-fonts' }
    },
    application:{
      styles:{
        h1:{ role:'display', fontSize:'clamp(2.75rem, 6vw, 5.5rem)', lineHeight:0.96, letterSpacing:'-0.03em' },
        h2:{ role:'display', fontSize:'clamp(2rem, 4vw, 3.5rem)', lineHeight:1.02, letterSpacing:'-0.02em' },
        body:{ role:'body', fontSize:'1.0625rem', lineHeight:1.58, letterSpacing:'0em' },
        lead:{ role:'body', fontSize:'1.25rem', lineHeight:1.48, letterSpacing:'-0.005em' },
        nav:{ role:'utility', fontSize:'0.875rem', lineHeight:1.2, letterSpacing:'0.01em' },
        button:{ role:'utility', fontSize:'0.9375rem', lineHeight:1.1, letterSpacing:'0.005em' },
        metadata:{ role:'utility', fontSize:'0.8125rem', lineHeight:1.3, letterSpacing:'0.02em' }
      },
      measure:{ body:'68ch', max:'72ch' }
    },
    production:{
      css2Url:'https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600&family=Manrope:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap',
      cssVariables:{
        '--font-family-display':"'Newsreader', serif",
        '--font-family-body':"'Manrope', sans-serif",
        '--font-family-utility':"'IBM Plex Mono', monospace",
        '--type-h1-size':'clamp(2.75rem, 6vw, 5.5rem)',
        '--type-body-size':'1.0625rem'
      },
      families:[
        {role:'display',family:'Newsreader',weights:[400,600],source:'google-fonts'},
        {role:'body',family:'Manrope',weights:[400,500,600],source:'google-fonts'},
        {role:'utility',family:'IBM Plex Mono',weights:[400,500],source:'google-fonts'}
      ]
    },
    systemCritique:{ score:91 },
    systems:[{ pairing:{ score:93 } }],
    intelligence:{ winnerEvidenceLevel:'evidence-backed-structural' }
  };
}

test('consumption contract makes approved typography a downstream source of truth', () => {
  const contract = buildTypographyConsumptionContract(readyTypography());
  assert.equal(contract.schema, 'ai-studio-os/typography-consumption@1');
  assert.equal(contract.pass, true);
  assert.equal(contract.roles.body.family, 'Manrope');
  assert.equal(contract.integration.cssVariableSourceOfTruth, true);
  assert.equal(contract.integration.recomputeTypographyInConsumer, false);
  assert.equal(contract.production.cssVariables['--type-body-size'], '1.0625rem');
  assert.equal(contract.provenance.evidenceLevel, 'evidence-backed-structural');
});

test('design packet carries the canonical consumption contract when typography is ready', () => {
  const packet = buildDesignPacket({
    direction:{ directionStatement:'Warm editorial precision', traits:['warm'], antiPrinciples:[] },
    typography:readyTypography()
  });
  assert.equal(packet.typography.consumption.schema, 'ai-studio-os/typography-consumption@1');
  assert.equal(packet.typography.consumption.roles.display.family, 'Newsreader');
  assert.equal(packet.typography.application.styles.body.fontSize, '1.0625rem');
});

test('legacy design packet remains unchanged when typography is not supplied', () => {
  const packet = buildDesignPacket({ direction:{ directionStatement:'Legacy', traits:[], antiPrinciples:[] } });
  assert.equal(typeof packet.typography.display, 'string');
  assert.equal('consumption' in packet.typography, false);
});

test('consumer blocks malformed or not-ready contracts instead of silently recomputing typography', () => {
  const consumed = consumeTypographyContract({ schema:'ai-studio-os/typography-consumption@1', pass:false, roles:{body:{family:'Manrope'}}, production:{cssVariables:{}} });
  assert.equal(consumed.enabled, true);
  assert.equal(consumed.pass, false);
  assert.ok(consumed.findings.some((item)=>item.code === 'typography-contract-not-ready'));
});

test('consumer blocks role/token drift', () => {
  const contract = buildTypographyConsumptionContract(readyTypography());
  contract.production.cssVariables['--font-family-body'] = "'Inter', sans-serif";
  const consumed = consumeTypographyContract(contract);
  assert.equal(consumed.pass, false);
  assert.ok(consumed.findings.some((item)=>item.code === 'typography-contract-role-token-drift' && item.role === 'body'));
});

test('consumer is a no-op for legacy surfaces without a typography contract', () => {
  const consumed = consumeTypographyContract(null, { surface:'landing-page' });
  assert.equal(consumed.enabled, false);
  assert.equal(consumed.pass, true);
  assert.deepEqual(consumed.cssVariables, {});
});
