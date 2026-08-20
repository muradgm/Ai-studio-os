import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildArtifactGraph, createArtifact } from '../../../modules/artifact-graph/runtime.mjs';
import { createLocalDocumentAdapter } from '../../../modules/production-adapters/local-document-adapter.mjs';
import { createLocalSvgAdapter } from '../../../modules/production-adapters/local-svg-adapter.mjs';
import { executeProductionBatch, executeProductionJob } from '../../../modules/production-adapters/runtime.mjs';
import {
  runTraderFrameIconCreativeLoop,
  traderFrameCreativeLoopIcons,
  traderFrameIconTargetSizes
} from '../icon-creative-loop-v1/runtime.mjs';
import {
  applyTraderFrameIconPatch,
  buildTraderFrameIconPatchPlan,
  reviewTraderFrameIconVisuals,
  traderFrameIconPatchAttemptCap
} from './runtime.mjs';

function severityRank(value) {
  return ({ blocker: 4, major: 3, minor: 2, taste: 1 })[String(value).toLowerCase()] ?? 0;
}

function majorCount(review) {
  return (review?.findings ?? []).filter((item) => severityRank(item.severity) >= severityRank('major')).length;
}

function baselineMarkupRefs(batch) {
  return Object.fromEntries(batch.artifacts.map((artifact) => {
    const id = artifact.id.replace(/^traderframe-/, '').replace(/-creative-v1$/, '');
    return [id, artifact.files?.[0]?.ref];
  }).filter(([, ref]) => ref));
}

async function loadBaselineMarkups(batch) {
  const refs = baselineMarkupRefs(batch);
  return Object.fromEntries(await Promise.all(Object.entries(refs).map(async ([id, ref]) => [id, await fs.readFile(ref, 'utf8')])));
}

async function measureWithChromium(markups) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    return await page.evaluate(async ({ entries, sizes }) => {
      const load = (src) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });
      const metrics = {};
      for (const [id, original] of entries) {
        metrics[id] = {};
        const svg = original.replaceAll('currentColor', '#000000');
        for (const size of sizes) {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const image = await load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(image, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          let count = 0;
          let minX = size;
          let minY = size;
          let maxX = -1;
          let maxY = -1;
          let sumX = 0;
          let sumY = 0;
          for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
              const alpha = data[(y * size + x) * 4 + 3];
              if (alpha <= 24) continue;
              count += 1;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
              sumX += x;
              sumY += y;
            }
          }
          const width = count ? maxX - minX + 1 : 0;
          const height = count ? maxY - minY + 1 : 0;
          metrics[id][size] = {
            inkCoverage: count / (size * size),
            occupancy: (width * height) / (size * size),
            centerX: count ? (sumX / count) / Math.max(1, size - 1) : 0.5,
            centerY: count ? (sumY / count) / Math.max(1, size - 1) : 0.5,
            bbox: { minX, minY, maxX, maxY, width, height },
            pixelCount: count
          };
        }
      }
      return metrics;
    }, { entries: Object.entries(markups), sizes: traderFrameIconTargetSizes });
  } finally {
    await browser.close();
  }
}

function comparisonHtml(before, after, beforeReview, afterReview) {
  const rows = traderFrameIconTargetSizes.map((size) => {
    const renderSet = (label, markups) => `<div class="set"><h3>${label}</h3><div class="grid">${traderFrameCreativeLoopIcons.map(([id, title]) => `<figure><div class="icon" style="--s:${size}px">${markups[id]}</div><figcaption>${title}</figcaption></figure>`).join('')}</div></div>`;
    return `<section data-size="${size}"><h2>${size}px</h2>${renderSet('Before review', before)}${renderSet('After patch', after)}</section>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>TraderFrame visual review patch evidence</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#12100F;color:#F0EAE0;font:12px Arial,sans-serif}h1{margin:0 0 10px}p{color:#98958f}section{margin-top:32px;padding-top:18px;border-top:1px solid #272A26}h2{font-size:14px}.set{margin-top:18px}.set h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#918e88}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}figure{margin:0;min-height:110px;padding:12px 6px;border:1px solid #272A26;background:#171513;display:grid;place-items:center}.icon{width:var(--s);height:var(--s);color:#F0EAE0}.icon svg{width:100%;height:100%;display:block}.icon [data-layer="event"]{color:#E54832}figcaption{margin-top:10px;color:#8d8983;font-size:10px;text-align:center}</style></head><body><h1>TraderFrame · Icon Family Visual Review & Patch Loop v1</h1><p>Before major/blocker: ${majorCount(beforeReview)} · After major/blocker: ${majorCount(afterReview)} · Candidate only; not user approved.</p>${rows}</body></html>`;
}

async function writeDocument(adapter, { id, title, outputPath, content, format = 'json', dependencies = [], metadata = {} }) {
  return executeProductionJob({
    job: {
      id,
      version: '1',
      kind: format === 'json' ? 'visual-review-document' : 'render-evidence-index',
      title,
      projectId: 'traderframe',
      operation: 'write-document',
      format,
      requiredCapabilities: [format === 'json' ? 'json' : 'text'],
      recipe: 'icon-system-recipe',
      dependencies,
      input: { format, outputPath, content },
      metadata
    },
    adapter
  });
}

async function captureComparison({ targetRoot, html, iconRefs }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const artifacts = [];
  try {
    for (const size of traderFrameIconTargetSizes) {
      const page = await browser.newPage({ viewport: { width: 1180, height: 380 }, deviceScaleFactor: 1 });
      await page.setContent(html);
      const section = page.locator(`section[data-size="${size}"]`);
      const target = path.join(targetRoot, 'render-evidence', `before-after-${size}px.png`);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await section.screenshot({ path: target });
      await page.close();
      const buffer = await fs.readFile(target);
      artifacts.push(createArtifact({
        id: `traderframe-icon-visual-patch-render-${size}px-v1`,
        version: '1',
        kind: 'icon-render-evidence',
        format: 'png',
        title: `TraderFrame icon visual patch before/after ${size}px`,
        projectId: 'traderframe',
        status: 'produced',
        reviewStatus: 'unreviewed',
        releaseStatus: 'unmeasured',
        dependencies: iconRefs.map((artifactRef) => ({ artifactRef, relation: 'renders', required: true, impact: 'review' })),
        creator: { type: 'browser-capture', adapterId: 'playwright-chromium', provider: 'local-browser' },
        provenance: { provider: 'local-browser', operation: 'chromium-screenshot', engine: 'playwright' },
        rights: { status: 'project-generated' },
        files: [{ ref: target, role: 'evidence', format: 'png', hash: crypto.createHash('sha256').update(buffer).digest('hex'), bytes: buffer.byteLength }],
        metadata: { targetSize: size, comparison: 'before-after', userApproval: false }
      }));
    }
  } finally {
    await browser.close();
  }
  return artifacts;
}

export async function runTraderFrameIconVisualReviewPatchV1({ repoRoot, outputDir } = {}) {
  const root = path.resolve(repoRoot || process.cwd());
  const targetRoot = path.resolve(outputDir || path.join(root, 'artifacts/traderframe/icon-visual-review-patch-v1'));

  // Use the exact known-good PR #32 execution mode. The prior nested/no-browser
  // baseline invocation could materialize files while its manifest failed closed.
  const baseline = await runTraderFrameIconCreativeLoop({ repoRoot: root, captureBrowserEvidence: true });
  if (!baseline.pass) {
    return {
      stage: 'traderframe-icon-visual-review-patch',
      status: 'blocked',
      pass: false,
      findings: [{ severity: 'blocker', code: 'traderframe-icon-baseline-not-valid', message: 'The source creative-loop benchmark did not pass in its canonical execution mode.' }],
      baseline
    };
  }

  const beforeMarkups = await loadBaselineMarkups(baseline.iconBatch);
  const beforeMetrics = await measureWithChromium(beforeMarkups);
  const beforeReview = reviewTraderFrameIconVisuals(beforeMarkups, beforeMetrics);
  const initialPlan = buildTraderFrameIconPatchPlan(beforeReview);

  let currentMarkups = beforeMarkups;
  let afterMetrics = beforeMetrics;
  let afterReview = beforeReview;
  let activePlan = initialPlan;
  const attempts = [];

  for (let attempt = 1; attempt <= traderFrameIconPatchAttemptCap && activePlan.icons.length; attempt += 1) {
    const candidate = applyTraderFrameIconPatch(currentMarkups, activePlan, attempt);
    const candidateMetrics = await measureWithChromium(candidate);
    const candidateReview = reviewTraderFrameIconVisuals(candidate, candidateMetrics);
    attempts.push({
      attempt,
      patchedIcons: [...activePlan.icons],
      beforeMajorCount: majorCount(afterReview),
      afterMajorCount: majorCount(candidateReview),
      findings: candidateReview.findings
    });
    currentMarkups = candidate;
    afterMetrics = candidateMetrics;
    afterReview = candidateReview;
    activePlan = buildTraderFrameIconPatchPlan(candidateReview);
  }

  const svgAdapter = createLocalSvgAdapter({ rootDir: targetRoot });
  const finalJobs = traderFrameCreativeLoopIcons.map(([name, title, semantic]) => {
    const baselineArtifact = baseline.iconBatch.artifacts.find((artifact) => artifact.id === `traderframe-${name}-creative-v1`);
    return {
      id: `traderframe-${name}-visual-patch-v1`,
      version: '1',
      kind: 'icon-master',
      title,
      projectId: 'traderframe',
      operation: 'generate',
      recipe: 'icon-system-recipe',
      requiredCapabilities: ['svg', 'vector', 'icon-master'],
      rights: { status: 'project-generated', legalReview: 'unresolved' },
      dependencies: [{ artifactRef: baselineArtifact?.ref, relation: initialPlan.icons.includes(name) ? 'patches' : 'preserves', required: true, impact: 'review' }],
      input: { svg: currentMarkups[name], outputPath: `icons/${name}.svg`, requireFontFree: true, vectorOnly: true },
      metadata: {
        semantic,
        selectedDirectionId: 'gate-decision',
        patchLoop: 'visual-review-v1',
        changedByPatchLoop: initialPlan.icons.includes(name),
        canonicalApproval: false,
        creativeApproval: false,
        userApproval: false
      }
    };
  });
  const finalAssignments = finalJobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-svg' }));
  const finalBatch = await executeProductionBatch({ jobs: finalJobs, assignments: finalAssignments, adapters: [svgAdapter] });
  const finalRefs = finalBatch.artifacts.map((artifact) => artifact.ref);

  const documentAdapter = createLocalDocumentAdapter({ rootDir: targetRoot });
  const documentExecutions = [];
  const documentArtifacts = [];
  const addDocument = async (spec) => {
    const execution = await writeDocument(documentAdapter, spec);
    documentExecutions.push(execution);
    documentArtifacts.push(execution.artifact);
    return execution;
  };

  await addDocument({ id: 'traderframe-icon-visual-metrics-before-v1', title: 'TraderFrame Icon Visual Metrics Before Patch', outputPath: 'metrics-before.json', content: { measured: true, engine: 'playwright-chromium-canvas', sizes: traderFrameIconTargetSizes, metrics: beforeMetrics } });
  await addDocument({ id: 'traderframe-icon-visual-review-before-v1', title: 'TraderFrame Icon Visual Review Before Patch', outputPath: 'review-before.json', content: beforeReview, metadata: { independentLensCount: beforeReview.lenses.length } });
  await addDocument({ id: 'traderframe-icon-patch-plan-v1', title: 'TraderFrame Icon Patch Plan', outputPath: 'patch-plan.json', content: initialPlan, metadata: { patchOnlyMajorOrBlocker: true, maxAttempts: traderFrameIconPatchAttemptCap } });
  await addDocument({ id: 'traderframe-icon-patch-attempts-v1', title: 'TraderFrame Icon Patch Attempts', outputPath: 'patch-attempts.json', content: { attempts, cappedAt: traderFrameIconPatchAttemptCap }, metadata: { boundedPatchLoop: true } });
  await addDocument({ id: 'traderframe-icon-visual-metrics-after-v1', title: 'TraderFrame Icon Visual Metrics After Patch', outputPath: 'metrics-after.json', content: { measured: true, engine: 'playwright-chromium-canvas', sizes: traderFrameIconTargetSizes, metrics: afterMetrics } });
  const reviewExecution = await addDocument({
    id: 'traderframe-icon-visual-review-after-v1',
    title: 'TraderFrame Icon Visual Review After Patch',
    outputPath: 'review-after.json',
    content: afterReview,
    dependencies: finalRefs.map((artifactRef) => ({ artifactRef, relation: 'reviews', required: true, impact: 'review' })),
    metadata: { userVisualApprovalRequired: true }
  });

  const html = comparisonHtml(beforeMarkups, currentMarkups, beforeReview, afterReview);
  const htmlExecution = await addDocument({
    id: 'traderframe-icon-before-after-index-v1',
    title: 'TraderFrame Icon Before/After Render Index',
    outputPath: 'render-evidence/before-after.html',
    content: html,
    format: 'text',
    dependencies: finalRefs.map((artifactRef) => ({ artifactRef, relation: 'renders', required: true, impact: 'review' }))
  });
  const renderArtifacts = await captureComparison({ targetRoot, html, iconRefs: finalRefs });

  const blockingAfter = majorCount(afterReview);
  const improved = majorCount(beforeReview) > blockingAfter;
  const manifest = {
    schema: 'ai-studio-os/traderframe-icon-visual-review-patch@1',
    projectId: 'traderframe',
    source: 'artifacts/traderframe/icon-creative-loop-v1',
    status: blockingAfter ? 'changes-still-required' : 'improved-awaiting-user-and-independent-review',
    frozen: false,
    reviewerLenses: beforeReview.lenses.map((lens) => lens.id),
    patchPolicy: { severities: ['blocker', 'major'], maxAttempts: traderFrameIconPatchAttemptCap, surgical: true },
    initialMajorCount: majorCount(beforeReview),
    finalMajorCount: blockingAfter,
    improved,
    patchedIcons: initialPlan.icons,
    preservedIcons: initialPlan.preserveUnchangedIcons,
    renderEvidence: {
      measured: true,
      sizes: traderFrameIconTargetSizes,
      index: 'render-evidence/before-after.html',
      screenshots: traderFrameIconTargetSizes.map((size) => `render-evidence/before-after-${size}px.png`)
    },
    finalReview: { status: afterReview.status, approval: afterReview.approval, findings: afterReview.findings },
    truth: {
      userApproved: false,
      iconDnaFrozen: false,
      independentVectorReviewComplete: false,
      brokerIntegration: false,
      autonomousExecution: false,
      performanceClaims: false
    },
    limitations: [
      'Visual measurements are local Chromium raster evidence, not human taste or legal approval.',
      'Patch geometry is deterministic benchmark logic in v1; no external art-direction model is invoked.',
      'Minor and taste findings remain visible and are not auto-patched under the bounded patch policy.'
    ]
  };
  const manifestExecution = await addDocument({
    id: 'traderframe-icon-visual-patch-manifest-v1',
    title: 'TraderFrame Icon Visual Review Patch Manifest',
    outputPath: 'manifest.json',
    content: manifest,
    dependencies: [
      { artifactRef: reviewExecution.artifact.ref, relation: 'packages-review', required: true, impact: 'stale' },
      { artifactRef: htmlExecution.artifact.ref, relation: 'packages-render-index', required: true, impact: 'stale' },
      ...finalRefs.map((artifactRef) => ({ artifactRef, relation: 'packages-icon', required: true, impact: 'stale' }))
    ],
    metadata: { frozen: false, userApproval: false }
  });

  const artifacts = [...baseline.artifacts, ...finalBatch.artifacts, ...documentArtifacts, ...renderArtifacts];
  const graph = buildArtifactGraph(artifacts);
  const documentsPass = documentExecutions.every((execution) => execution.pass);
  const pass = baseline.pass && finalBatch.pass && documentsPass && manifestExecution.pass && graph.pass && blockingAfter === 0 && renderArtifacts.length === traderFrameIconTargetSizes.length;

  return {
    stage: 'traderframe-icon-visual-review-patch',
    status: pass ? manifest.status : 'blocked',
    pass,
    outputDir: targetRoot,
    baseline,
    beforeMetrics,
    beforeReview,
    patchPlan: initialPlan,
    attempts,
    afterMetrics,
    afterReview,
    finalBatch,
    renderArtifacts,
    manifest,
    artifacts,
    graph,
    counts: {
      icons: traderFrameCreativeLoopIcons.length,
      patched: initialPlan.icons.length,
      attempts: attempts.length,
      renderCaptures: renderArtifacts.length,
      beforeMajor: manifest.initialMajorCount,
      afterMajor: manifest.finalMajorCount
    }
  };
}
