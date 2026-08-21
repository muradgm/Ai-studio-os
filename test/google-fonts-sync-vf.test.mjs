import test from 'node:test';
import assert from 'node:assert/strict';

import { syncGoogleFontsCatalog } from '../modules/typography/google-fonts-sync.mjs';

test('Google Fonts sync requests VF capability by default', async () => {
  let received = null;
  const provider = { list: async () => ({ provider:'google-fonts', count:0, fonts:[] }) };
  const sync = async (options) => {
    received = options;
    return { provider:'google-fonts', count:0, fonts:[] };
  };
  await syncGoogleFontsCatalog({ provider, sync });
  assert.equal(received.capability, 'VF');
  assert.equal(received.sort, 'popularity');
  assert.equal(received.forceRefresh, true);
});
