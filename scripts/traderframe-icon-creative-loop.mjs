import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTraderFrameIconCreativeLoopProof } from '../projects/traderframe/icon-creative-loop-v1/orchestrator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const captureBrowserEvidence = !process.argv.includes('--no-browser-evidence');

try {
  const result = await runTraderFrameIconCreativeLoopProof({ repoRoot: root, captureBrowserEvidence });
  console.log(JSON.stringify({
    stage: result.stage,
    status: result.status,
    pass: result.pass,
    outputDir: result.outputDir,
    directions: result.counts?.directions ?? 0,
    selectedDirectionId: result.exploration?.selectedDirectionId ?? null,
    directionPreviews: result.counts?.directionPreviews ?? 0,
    icons: result.counts?.icons ?? 0,
    renderCaptures: result.counts?.renderCaptures ?? 0,
    files: result.counts?.files ?? 0,
    review: result.familyReview ? { status: result.familyReview.status, approval: result.familyReview.approval, blockers: result.familyReview.findings.filter((item) => String(item.severity).toLowerCase() === 'blocker').length } : null,
    productionExecution: result.productionExecution ?? null
  }, null, 2));
  if (!result.pass) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  console.error('TraderFrame icon creative loop failed. If the error is a missing Playwright browser, run: npx playwright install chromium');
  process.exitCode = 1;
}
