import fs from 'node:fs/promises';
import path from 'node:path';
import { runTraderFrameIconCreativeLoop } from './runtime.mjs';

function executionPass(batch) {
  return Array.isArray(batch?.executions) && batch.executions.length > 0 && batch.executions.every((execution) => execution.pass === true);
}

export async function runTraderFrameIconCreativeLoopProof(options = {}) {
  const result = await runTraderFrameIconCreativeLoop(options);
  if (!result?.exploration?.pass) return result;

  const previewExecutionPass = executionPass(result.previewBatch);
  const iconExecutionPass = executionPass(result.iconBatch);
  const artifactPass = Array.isArray(result.artifacts) && result.artifacts.every((artifact) => artifact?.pass !== false);
  const graphPass = result.graph?.pass === true;
  const familyPass = result.familyReview?.pass === true;
  const pass = previewExecutionPass && iconExecutionPass && artifactPass && graphPass && familyPass;
  const renderCaptured = (result.renderArtifacts?.length ?? 0) > 0;
  const status = pass
    ? (renderCaptured ? 'produced-awaiting-independent-review' : 'produced-awaiting-render-and-independent-review')
    : 'blocked';

  const manifest = {
    ...structuredClone(result.manifest),
    status,
    orchestration: {
      finalArtifactGraphAuthoritative: true,
      previewExecutionsPass: previewExecutionPass,
      iconExecutionsPass: iconExecutionPass,
      previewBatchLocalGraphPass: result.previewBatch?.graph?.pass ?? null,
      iconBatchLocalGraphPass: result.iconBatch?.graph?.pass ?? null,
      note: 'Preview and icon jobs depend on upstream decision artifacts outside their local batch. The final cross-stage Artifact Graph is the authoritative dependency gate.'
    }
  };

  if (result.outputDir) {
    await fs.writeFile(path.join(result.outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }

  return {
    ...result,
    status,
    pass,
    manifest,
    productionExecution: {
      previewPass: previewExecutionPass,
      iconPass: iconExecutionPass,
      artifactPass,
      finalGraphPass: graphPass,
      familyPass
    }
  };
}
