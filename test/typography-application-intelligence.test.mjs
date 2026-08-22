import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTypographyApplication } from '../modules/typography/application-intelligence.mjs';

const selection = {
  display:{ family:'Display VF', weights:[400,600,700], variable:true, axes:[{tag:'wght',start:300,end:800},{tag:'opsz',start:9,end:72},{tag:'wdth',start:75,end:125}] },
  body:{ family:'Body VF', weights:[400,500,600,700], variable:true, axes:[{tag:'wght',start:300,end:700},{tag:'opsz',start:8,end:48}] },
  utility:{ family:'Utility Mono', weights:[400,500,600], variable:false, axes:[] }
};

test('application intelligence builds responsive hierarchy from selected families', () => {
  const result = buildTypographyApplication({
    selection,
    strategy:{ pressures:{ expression:78, readingDensity:62, accessibility:70 } },
    requirements:{ languages:['en','de'] }
  });
  assert.equal(result.pass, true);
  assert.equal(result.styles.h1.family, 'Display VF');
  assert.equal(result.styles.body.family, 'Body VF');
  assert.equal(result.styles.nav.family, 'Utility Mono');
  assert.ok(result.styles.h1.sizePx > result.styles.body.sizePx * 2);
  assert.ok(result.mobileStyles.h1.sizePx < result.styles.h1.sizePx);
  assert.ok(result.measure.ideal <= 68);
});

test('long-form and accessibility pressures increase body comfort rather than display drama', () => {
  const result = buildTypographyApplication({
    selection,
    strategy:{ pressures:{ expression:45, readingDensity:85, accessibility:85 } },
    requirements:{ longForm:true }
  });
  assert.equal(result.pass, true);
  assert.ok(result.basePx >= 18);
  assert.ok(result.styles.body.lineHeight >= 1.6);
  assert.equal(result.measure.ideal, 66);
  assert.ok(result.ratio <= 1.2);
});

test('dense interfaces tighten scale and measure without shrinking body below floor', () => {
  const result = buildTypographyApplication({
    selection,
    strategy:{ pressures:{ expression:45, readingDensity:80, accessibility:60 } },
    requirements:{ interfaceDense:true }
  });
  assert.equal(result.pass, true);
  assert.ok(result.basePx >= 15);
  assert.equal(result.measure.ideal, 54);
  assert.ok(result.ratio < 1.2);
});

test('variable font axes are bounded by declared font ranges', () => {
  const result = buildTypographyApplication({
    selection,
    strategy:{ pressures:{ expression:90 } }
  });
  assert.ok(result.styles.h1.axes.opsz <= 72);
  assert.ok(result.styles.h1.axes.wght <= 800);
  assert.ok(result.styles.h1.axes.wdth <= 125);
  assert.ok(result.styles.body.axes.opsz <= 48);
  assert.equal('axes' in result.styles.nav, false);
});

test('missing selected roles block application safely', () => {
  const result = buildTypographyApplication({ selection:{ display:selection.display } });
  assert.equal(result.pass, false);
  assert.equal(result.findings[0].code, 'typography-application-selection-missing');
});
