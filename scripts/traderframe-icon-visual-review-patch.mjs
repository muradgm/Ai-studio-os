import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTraderFrameIconVisualReviewPatchV1 } from '../projects/traderframe/icon-visual-review-patch-v1/driver.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  const result = await runTraderFrameIconVisualReviewPatchV1({ repoRoot: root });
  console.log(JSON.stringify({
    stage: result.stage,
    status: result.status,
    pass: result.pass,
    outputDir: result.outputDir,
    icons: result.counts?.icons ?? 0,
    patched: result.counts?.patched ?? 0,
    attempts: result.counts?.attempts ?? 0,
    renderCaptures: result.counts?.renderCaptures ?? 0,
    beforeMajor: result.counts?.beforeMajor ?? null,
    afterMajor: result.counts?.afterMajor ?? null,
    finalReview: result.afterReview ? { status: result.afterReview.status, approval: result.afterReview.approval, findings: result.afterReview.findings.length } : null
  }, null, 2));
  if (!result.pass) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  console.error('TraderFrame icon visual review patch failed. Ensure Chromium is installed with: npx playwright install chromium');
  process.exitCode = 1;
}
