import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runTraderFrameIconProductionProof,
  traderFrameDecisionLoopIcons
} from '../projects/traderframe/icon-production-proof-v1/runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function runProof() {
  const outputDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'traderframe-icon-proof-'));
  const result = await runTraderFrameIconProductionProof({ repoRoot:root, outputDir });
  return { result, outputDir };
}

test('TraderFrame production proof materializes eight GateZero decision-loop SVG masters', async () => {
  const { result, outputDir } = await runProof();
  assert.equal(result.pass, true, JSON.stringify(result.familyReview.findings));
  assert.equal(result.status, 'produced-awaiting-review');
  assert.equal(result.counts.icons, 8);
  assert.equal(traderFrameDecisionLoopIcons.length, 8);
  assert.deepEqual(traderFrameDecisionLoopIcons.map(([id]) => id), [
    'strategy-idea',
    'data-snapshot',
    'backtest',
    'metric-report',
    'risk-review',
    'operator-decision',
    'outcome-logged',
    'learning-event'
  ]);

  for (const [name] of traderFrameDecisionLoopIcons) {
    const file = path.join(outputDir, 'icons', `${name}.svg`);
    assert.equal(fs.existsSync(file), true, `${name} output must exist`);
    const svg = fs.readFileSync(file, 'utf8');
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /stroke-width="1\.5"/);
    assert.match(svg, /stroke-linecap="square"/);
    assert.match(svg, /stroke-linejoin="miter"/);
    assert.match(svg, /currentColor/);
    assert.equal((svg.match(/data-layer="event"/g) ?? []).length, 1, `${name} must have exactly one semantic event layer`);
    assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}/, `${name} must remain palette-neutral`);
    assert.doesNotMatch(svg, /<text|<image|<script|<foreignObject|\shref=/i, `${name} must remain font-free, vector-only and self-contained`);
  }
});

test('TraderFrame proof records real artifacts without fabricating approval or release readiness', async () => {
  const { result, outputDir } = await runProof();
  assert.equal(result.batch.pass, true);
  assert.equal(result.graph.pass, true);
  assert.equal(result.familyReview.status, 'review');
  assert.equal(result.familyReview.approval, 'independent-vector-and-user-visual-review-required');
  assert.equal(result.manifest.status, 'produced-awaiting-review');
  assert.equal(result.manifest.frozen, false);
  assert.equal(result.manifest.iconDna.status, 'review-candidate');
  assert.equal(result.manifest.truth.brokerIntegration, false);
  assert.equal(result.manifest.truth.autonomousExecution, false);
  assert.equal(result.manifest.truth.performanceClaims, false);

  const iconArtifacts = result.batch.artifacts;
  assert.equal(iconArtifacts.length, 8);
  for (const artifact of iconArtifacts) {
    assert.equal(artifact.status, 'produced');
    assert.equal(artifact.reviewStatus, 'unreviewed');
    assert.equal(artifact.releaseStatus, 'unmeasured');
    assert.equal(artifact.creator.adapterId, 'local-svg');
    assert.equal(artifact.metadata.creativeApproval, false);
    assert.equal(artifact.metadata.canonicalApproval, false);
    assert.equal(artifact.metadata.iconDnaStatus, 'review-candidate');
    assert.equal(artifact.files.length, 1);
    assert.equal(fs.existsSync(artifact.files[0].ref), true);
    assert.match(artifact.files[0].hash, /^[a-f0-9]{64}$/);
  }

  assert.equal(fs.existsSync(path.join(outputDir, 'manifest.json')), true);
  assert.equal(fs.existsSync(path.join(outputDir, 'calibration-review.json')), true);
  const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.frozen, false);
  assert.equal(manifest.icons.length, 8);
  assert.equal(result.counts.files, 10);
});
