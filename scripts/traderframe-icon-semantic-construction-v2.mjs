import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTraderFrameIconSemanticConstructionV2 } from '../projects/traderframe/icon-semantic-construction-v2/driver.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const captureBrowserEvidence = !process.argv.includes('--no-browser-evidence');

try {
  const result = await runTraderFrameIconSemanticConstructionV2({ repoRoot: root, captureBrowserEvidence });
  console.log(JSON.stringify({
    stage: result.stage,
    status: result.status,
    pass: result.pass,
    outputDir: result.outputDir,
    semantics: result.counts?.semantics ?? 0,
    candidates: result.counts?.candidates ?? 0,
    selected: result.counts?.selected ?? 0,
    renderCaptures: result.counts?.renderCaptures ?? 0,
    constructionReview: result.constructionReview ? { status: result.constructionReview.status, findings: result.constructionReview.findings.length } : null,
    renderReview: result.renderReview ? { status: result.renderReview.status, findings: result.renderReview.findings.length } : null,
    blindRecognitionReviewRequired: result.manifest?.blindReview?.required ?? true
  }, null, 2));
  if (!result.pass) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  console.error('TraderFrame semantic construction proof failed. Ensure Chromium is installed with: npx playwright install chromium');
  process.exitCode = 1;
}
