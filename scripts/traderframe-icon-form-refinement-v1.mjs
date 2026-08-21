import path from 'node:path';
import process from 'node:process';
import { runTraderFrameIconFormRefinementV1 } from '../projects/traderframe/icon-form-refinement-v1/driver.mjs';

const captureBrowserEvidence = !process.argv.includes('--no-browser-evidence');
const outputFlag = process.argv.findIndex((arg) => arg === '--output');
const outputDir = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;

const result = await runTraderFrameIconFormRefinementV1({
  repoRoot: process.cwd(),
  outputDir: outputDir ? path.resolve(outputDir) : undefined,
  captureBrowserEvidence
});

console.log(JSON.stringify({
  stage: result.stage,
  status: result.status,
  pass: result.pass,
  outputDir: result.outputDir,
  counts: result.counts,
  renderReview: result.renderReview ? {
    status: result.renderReview.status,
    pass: result.renderReview.pass,
    findings: result.renderReview.findings?.length ?? 0
  } : null,
  selectionGate: result.selectionGate ? {
    status: result.selectionGate.status,
    completed: result.selectionGate.completed,
    winner: result.selectionGate.winner
  } : null
}, null, 2));

if (!result.pass) process.exitCode = 1;
