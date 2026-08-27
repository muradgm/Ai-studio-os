import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

import { findStableTerminalAnchorIndex } from '../modules/motion-creative-intelligence/terminal-anchor.mjs';
import { verifyIndependentMotionProofBrowserArtifacts } from '../modules/motion-creative-intelligence/browser-proof-verifier.mjs';

test('stable terminal anchoring does not cross a real transition after an earlier final-looking transient', () => {
  const finalBoundFlags = [false, true, true, true, false, true, true, true, true];
  const nearTerminalFlags = [false, true, true, true, false, true, true, true, true];

  assert.equal(findStableTerminalAnchorIndex(finalBoundFlags, nearTerminalFlags), 5);
});

test('stable terminal anchoring can cross one near-terminal codec-noise sample inside a sustained final suffix', () => {
  const finalBoundFlags = [false, true, true, true, false, true, true, true, true];
  const nearTerminalFlags = [false, true, true, true, true, true, true, true, true];

  assert.equal(findStableTerminalAnchorIndex(finalBoundFlags, nearTerminalFlags), 1);
});

test('comparison authority can pixel-probe a legitimate video on a long scrolled review board', (t) => {
  const executable = chromium.executablePath();
  if (!executable || !fs.existsSync(executable)) {
    t.skip('Playwright Chromium is not installed for this unit-test phase.');
    return;
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'motion-proof-long-comparison-'));
  try {
    const videoPath = path.join(root, 'study.webm');
    const comparisonPath = path.join(root, 'comparison.html');
    fs.writeFileSync(videoPath, 'comparison-long-board-path-binding');
    fs.writeFileSync(comparisonPath, `<!doctype html><html><head><style>
      html,body{margin:0;background:#111;color:#fff}
      .spacer{height:5200px}
      video{display:block;width:640px;height:360px;margin:0 auto 120px;background:#234}
    </style></head><body><div class="spacer"></div><video controls src="./study.webm"></video></body></html>`);

    const review = verifyIndependentMotionProofBrowserArtifacts([{
      kind: 'comparison',
      comparisonPaths: [comparisonPath],
      expectedVideoPaths: [videoPath]
    }]);

    assert.equal(review.verified, true, review.findings.map((item) => `${item.code}: ${item.message}`).join('\n'));
    assert.equal(review.findings.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
