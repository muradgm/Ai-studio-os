import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runTraderFrameIconCreativeLoopProof } from '../projects/traderframe/icon-creative-loop-v1/orchestrator.mjs';
import {
  buildTraderFrameRenderEvidenceHtml,
  exploreTraderFrameIconDirections,
  renderTraderFrameDirectionPreview,
  traderFrameCreativeLoopIcons,
  traderFrameIconDirections,
  traderFrameIconSemanticMap,
  traderFrameIconTargetSizes
} from '../projects/traderframe/icon-creative-loop-v1/runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function runProof() {
  const outputDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'traderframe-icon-creative-loop-'));
  const result = await runTraderFrameIconCreativeLoopProof({ repoRoot: root, outputDir, captureBrowserEvidence: false });
  return { result, outputDir };
}

test('creative loop explores three non-cosmetic directions and selects Gate + Decision explicitly', () => {
  const exploration = exploreTraderFrameIconDirections();
  assert.equal(exploration.pass, true, JSON.stringify(exploration.findings));
  assert.equal(exploration.directions.length, 3);
  assert.equal(exploration.selectedDirectionId, 'gate-decision');
  assert.equal(exploration.rejected.length, 2);
  assert.ok(exploration.rejected.every((item) => item.rejectedBecause.length > 20));
  assert.ok(exploration.diversity.maxPrimitiveJaccard < 0.7, JSON.stringify(exploration.diversity));
  assert.equal(new Set(exploration.directions.map((direction) => direction.id)).size, 3);
  assert.ok(exploration.reviews.every((review) => Number.isFinite(review.total)));
});

test('anti-generic semantic map names category defaults instead of silently using them', () => {
  const ids = traderFrameCreativeLoopIcons.map(([id]) => id);
  assert.deepEqual(Object.keys(traderFrameIconSemanticMap), ids);
  for (const id of ids) {
    const semantic = traderFrameIconSemanticMap[id];
    assert.ok(semantic.intent.length > 20);
    assert.ok(semantic.forbiddenDefaults.length >= 3, `${id} needs explicit category-default rejection`);
    assert.ok(semantic.selectedDecomposition.length >= 3, `${id} needs a selected semantic decomposition`);
  }
  assert.ok(traderFrameIconSemanticMap['risk-review'].forbiddenDefaults.includes('shield'));
  assert.ok(traderFrameIconSemanticMap['metric-report'].forbiddenDefaults.includes('bar-chart'));
  assert.ok(traderFrameIconSemanticMap['strategy-idea'].forbiddenDefaults.includes('lightbulb'));
});

test('all three direction previews are real, mechanically comparable SVG candidates', () => {
  assert.equal(traderFrameIconDirections.length, 3);
  for (const direction of traderFrameIconDirections) {
    const svg = renderTraderFrameDirectionPreview(direction.id);
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /stroke-width="1\.5"/);
    assert.match(svg, /stroke-linecap="square"/);
    assert.match(svg, /stroke-linejoin="miter"/);
    assert.match(svg, /currentColor/);
    assert.match(svg, new RegExp(`data-direction="${direction.id}"`));
    assert.equal((svg.match(/data-layer="event"/g) ?? []).length, 1);
  }
});

test('creative loop produces only the selected direction as the eight-icon calibration family', async () => {
  const { result, outputDir } = await runProof();
  assert.equal(result.pass, true, JSON.stringify(result.familyReview.findings));
  assert.equal(result.status, 'produced-awaiting-render-and-independent-review');
  assert.equal(result.counts.directions, 3);
  assert.equal(result.counts.directionPreviews, 3);
  assert.equal(result.counts.icons, 8);
  assert.equal(result.counts.renderCaptures, 0);
  assert.equal(result.exploration.selectedDirectionId, 'gate-decision');
  assert.equal(result.selectedDna.status, 'selected-candidate-not-frozen');
  assert.equal(result.manifest.frozen, false);
  assert.equal(result.manifest.renderEvidence.status, 'pending');
  assert.equal(result.productionExecution.previewPass, true);
  assert.equal(result.productionExecution.iconPass, true);

  for (const direction of traderFrameIconDirections) {
    assert.equal(fs.existsSync(path.join(outputDir, 'direction-previews', `${direction.id}.svg`)), true);
  }

  for (const [name] of traderFrameCreativeLoopIcons) {
    const file = path.join(outputDir, 'icons', `${name}.svg`);
    assert.equal(fs.existsSync(file), true, `${name} output must exist`);
    const svg = fs.readFileSync(file, 'utf8');
    assert.match(svg, /data-direction="gate-decision"/);
    assert.match(svg, /data-kind="calibration-icon"/);
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /stroke-width="1\.5"/);
    assert.match(svg, /stroke-linecap="square"/);
    assert.match(svg, /stroke-linejoin="miter"/);
    assert.match(svg, /currentColor/);
    assert.equal((svg.match(/data-layer="event"/g) ?? []).length, 1, `${name} must have exactly one semantic event layer`);
    assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}/, `${name} canonical SVG must stay palette-neutral`);
    assert.doesNotMatch(svg, /<text|<image|<script|<foreignObject/i, `${name} must remain font-free and vector-only`);
  }
});

test('creative loop preserves Artifact Graph truth and never fabricates visual approval', async () => {
  const { result, outputDir } = await runProof();
  assert.equal(result.graph.pass, true, JSON.stringify(result.graph.findings));
  assert.equal(result.productionExecution.previewPass, true);
  assert.equal(result.productionExecution.iconPass, true);
  assert.equal(result.productionExecution.finalGraphPass, true);
  assert.equal(result.manifest.orchestration.finalArtifactGraphAuthoritative, true);
  assert.equal(result.familyReview.status, 'review');
  assert.equal(result.familyReview.approval, 'independent-vector-and-user-visual-review-required');
  assert.equal(result.familyReview.renderEvidence.status, 'pending');
  assert.equal(result.manifest.truth.brokerIntegration, false);
  assert.equal(result.manifest.truth.autonomousExecution, false);
  assert.equal(result.manifest.truth.performanceClaims, false);
  assert.ok(result.manifest.limitations.some((item) => item.includes('deterministic')));

  for (const artifact of result.iconBatch.artifacts) {
    assert.equal(artifact.status, 'produced');
    assert.equal(artifact.reviewStatus, 'unreviewed');
    assert.equal(artifact.releaseStatus, 'unmeasured');
    assert.equal(artifact.creator.adapterId, 'local-svg');
    assert.equal(artifact.metadata.creativeApproval, false);
    assert.equal(artifact.metadata.canonicalApproval, false);
    assert.equal(artifact.metadata.selectedDirectionId, 'gate-decision');
    assert.equal(artifact.files.length, 1);
    assert.equal(fs.existsSync(artifact.files[0].ref), true);
    assert.match(artifact.files[0].hash, /^[a-f0-9]{64}$/);
  }

  for (const file of ['semantic-map.json', 'directions.json', 'selection-review.json', 'selected-icon-dna.json', 'family-review.json', 'manifest.json', path.join('render-evidence', 'index.html')]) {
    assert.equal(fs.existsSync(path.join(outputDir, file)), true, `${file} must exist`);
  }
  const manifestFile = JSON.parse(fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf8'));
  assert.equal(manifestFile.status, 'produced-awaiting-render-and-independent-review');
  assert.equal(manifestFile.orchestration.finalArtifactGraphAuthoritative, true);
});

test('render evidence index carries all declared small-size targets in monochrome and accent modes', async () => {
  const { result } = await runProof();
  const markups = Object.fromEntries(result.iconBatch.artifacts.map((artifact) => {
    const id = artifact.id.replace(/^traderframe-/, '').replace(/-creative-v1$/, '');
    return [id, fs.readFileSync(artifact.files[0].ref, 'utf8')];
  }));
  const html = buildTraderFrameRenderEvidenceHtml(markups);
  assert.deepEqual(traderFrameIconTargetSizes, [16, 20, 24, 32]);
  for (const size of traderFrameIconTargetSizes) {
    assert.match(html, new RegExp(`data-size="${size}"`));
    assert.match(html, new RegExp(`${size}px · monochrome`));
    assert.match(html, new RegExp(`${size}px · event accent`));
  }
  assert.match(html, /\[data-layer="event"\]\{color:#E54832\}/);
});
