import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildArtifactGraph, createArtifact } from '../../../modules/artifact-graph/runtime.mjs';
import { createLocalDocumentAdapter } from '../../../modules/production-adapters/local-document-adapter.mjs';
import { createLocalSvgAdapter } from '../../../modules/production-adapters/local-svg-adapter.mjs';
import { executeProductionBatch, executeProductionJob } from '../../../modules/production-adapters/runtime.mjs';
import {
  CALIBRATION_ANCHORS,
  EXACT_RASTER_SIZE,
  FORM_DIRECTIONS,
  FORM_REVIEW_CRITERIA,
  FORM_TARGET_SIZES,
  buildFormSelectionGate,
  exactRasterPlan,
  renderFormCandidate,
  reviewFormRefinement
} from './spec.mjs';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

async function writeDocument(adapter, { id, title, outputPath, content, dependencies = [], metadata = {}, format = 'json' }) {
  return executeProductionJob({
    job: {
      id,
      version: '1',
      kind: format === 'json' ? 'form-refinement-document' : 'render-evidence-index',
      title,
      projectId: 'traderframe',
      operation: 'write-document',
      format,
      recipe: 'icon-system-recipe',
      requiredCapabilities: [format === 'json' ? 'json' : 'text'],
      dependencies,
      input: { format, outputPath, content },
      metadata
    },
    adapter
  });
}

function allMarkups() {
  return Object.fromEntries(FORM_DIRECTIONS.flatMap((direction) => CALIBRATION_ANCHORS.map((anchor) => [
    `${direction.id}/${anchor.iconId}`,
    renderFormCandidate(direction.id, anchor.iconId)
  ])));
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
      const result = {};
      for (const [id, original] of entries) {
        result[id] = {};
        const svg = original.replaceAll('currentColor', '#000000');
        for (const size of sizes) {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const image = await load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
          ctx.drawImage(image, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          let count = 0;
          let minX = size, minY = size, maxX = -1, maxY = -1, sumX = 0, sumY = 0;
          for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < size; x += 1) {
              const alpha = data[(y * size + x) * 4 + 3];
              if (alpha <= 24) continue;
              count += 1;
              minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
              sumX += x; sumY += y;
            }
          }
          const width = count ? maxX - minX + 1 : 0;
          const height = count ? maxY - minY + 1 : 0;
          result[id][size] = {
            pixelCount: count,
            inkCoverage: count / (size * size),
            occupancy: (width * height) / (size * size),
            centerX: count ? (sumX / count) / Math.max(1, size - 1) : 0.5,
            centerY: count ? (sumY / count) / Math.max(1, size - 1) : 0.5,
            bbox: { minX, minY, maxX, maxY, width, height }
          };
        }
      }
      return result;
    }, { entries: Object.entries(markups), sizes: FORM_TARGET_SIZES });
  } finally {
    await browser.close();
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function renderMetricReview(metrics) {
  const findings = [];
  const directionSummaries = {};
  for (const direction of FORM_DIRECTIONS) {
    const coverage24 = [];
    for (const anchor of CALIBRATION_ANCHORS) {
      const key = `${direction.id}/${anchor.iconId}`;
      for (const size of FORM_TARGET_SIZES) {
        const item = metrics[key]?.[size];
        if (!item || item.pixelCount < Math.max(4, Math.round(size / 3))) {
          findings.push({ severity: 'major', code: 'form-small-size-collapse', directionId: direction.id, iconId: anchor.iconId, size, message: `${direction.label} / ${anchor.label} has insufficient rendered evidence at ${size}px.` });
        }
        if (item && (item.centerX < 0.18 || item.centerX > 0.82 || item.centerY < 0.18 || item.centerY > 0.82)) {
          findings.push({ severity: 'minor', code: 'form-optical-center-risk', directionId: direction.id, iconId: anchor.iconId, size, message: `${direction.label} / ${anchor.label} has a strongly shifted optical center at ${size}px.` });
        }
      }
      const at24 = metrics[key]?.[24];
      if (at24) coverage24.push(at24.inkCoverage);
    }
    const mid = coverage24.length ? median(coverage24) : 0;
    const min = coverage24.length ? Math.min(...coverage24) : 0;
    const max = coverage24.length ? Math.max(...coverage24) : 0;
    directionSummaries[direction.id] = { medianInkCoverage24: mid, minInkCoverage24: min, maxInkCoverage24: max, spreadRatio24: min > 0 ? max / min : null };
    if (min > 0 && max / min > 2.1) findings.push({ severity: 'major', code: 'form-optical-mass-spread', directionId: direction.id, message: `${direction.label} has excessive optical-mass variation across the three calibration anchors.` });
  }
  const blocking = findings.filter((item) => ['blocker', 'major'].includes(item.severity));
  return {
    stage: 'traderframe-icon-form-render-review',
    status: blocking.length ? 'changes-required' : 'rendered-awaiting-human-form-direction-selection',
    pass: blocking.length === 0,
    findings,
    directionSummaries,
    criteria: FORM_REVIEW_CRITERIA,
    limitation: 'These measurements assess pixel survival, centering, and family mass only. They do not decide which formal direction is aesthetically strongest.'
  };
}

function comparisonHtml(markups, iconSize) {
  const sections = FORM_DIRECTIONS.map((direction) => {
    const cards = CALIBRATION_ANCHORS.map((anchor) => {
      const key = `${direction.id}/${anchor.iconId}`;
      return `<figure><div class="icon">${markups[key]}</div><figcaption><strong>${escapeHtml(anchor.label)}</strong><span>${escapeHtml(anchor.lockedSemanticConcept)}</span></figcaption></figure>`;
    }).join('');
    return `<section><header><h2>${escapeHtml(direction.label)}</h2><p>${escapeHtml(direction.intent)}</p><small>stroke ${direction.strokeWidth}</small></header><div class="row">${cards}</div></section>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#12100F;color:#F0EAE0;font:12px Arial,sans-serif}h1{margin:0 0 8px;font-size:22px}.lead{color:#8f8b85;margin-bottom:24px}section{border-top:1px solid #272A26;padding:20px 0}section header{display:grid;grid-template-columns:180px 1fr auto;gap:16px;align-items:start}h2{font-size:14px;margin:0}section p,small,figcaption span{color:#8f8b85;margin:0}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}figure{margin:0;background:#171513;border:1px solid #272A26;min-height:180px;display:grid;place-items:center;padding:18px}.icon{width:${iconSize}px;height:${iconSize}px;color:#F0EAE0}.icon svg{width:100%;height:100%;display:block}.icon [data-layer="event"]{color:#E54832}figcaption{display:grid;gap:4px;text-align:center;margin-top:12px}</style></head><body><h1>TraderFrame · Vector Form Refinement v1</h1><p class="lead">Semantic concepts are locked. This board compares formal execution only; no direction is approved automatically.</p>${sections}</body></html>`;
}

async function captureHtml({ targetRoot, html, fileName, title, viewport }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const target = path.join(targetRoot, 'render-evidence', fileName);
  try {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await page.setContent(html);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, fullPage: true });
  } finally {
    await browser.close();
  }
  return artifactForPng({ target, id: `traderframe-form-${fileName}`, title, kind: 'icon-form-render-evidence', metadata: { exactSvgRaster: false } });
}

function artifactForPng({ target, id, title, kind, metadata = {} }) {
  return fs.readFile(target).then((buffer) => createArtifact({
    id: id.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, ''),
    version: '1',
    kind,
    format: 'png',
    title,
    projectId: 'traderframe',
    status: 'produced',
    reviewStatus: 'unreviewed',
    releaseStatus: 'unmeasured',
    creator: { type: 'browser-capture', adapterId: 'playwright-chromium', provider: 'local-browser' },
    provenance: { provider: 'local-browser', operation: 'exact-svg-raster', engine: 'playwright-chromium' },
    rights: { status: 'project-generated' },
    files: [{ ref: target, role: 'evidence', format: 'png', hash: crypto.createHash('sha256').update(buffer).digest('hex'), bytes: buffer.byteLength }],
    metadata: { ...metadata, userApproval: false }
  }));
}

async function captureExactRaster({ targetRoot, directionId, iconId, svg, size = EXACT_RASTER_SIZE }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const target = path.join(targetRoot, 'exact-png', directionId, `${iconId}-${size}px.png`);
  try {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}body{display:grid;place-items:center}.stage{width:100%;height:100%;color:#F0EAE0}.stage svg{width:100%;height:100%;display:block}.stage [data-layer="event"]{color:#E54832}</style></head><body><div class="stage">${svg}</div></body></html>`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, omitBackground: true });
  } finally {
    await browser.close();
  }
  return artifactForPng({
    target,
    id: `traderframe-form-exact-${directionId}-${iconId}-${size}px`,
    title: `${directionId} · ${iconId} · exact ${size}px raster`,
    kind: 'icon-form-exact-raster',
    metadata: { directionId, iconId, rasterSize: size, exactSvgRaster: true, applicationColors: { foreground: '#F0EAE0', event: '#E54832', background: 'transparent' } }
  });
}

export async function runTraderFrameIconFormRefinementV1({ repoRoot, outputDir, captureBrowserEvidence = true } = {}) {
  const root = path.resolve(repoRoot || process.cwd());
  const targetRoot = path.resolve(outputDir || path.join(root, 'artifacts/traderframe/icon-form-refinement-v1'));
  const structuralReview = reviewFormRefinement();
  if (!structuralReview.pass) return { stage: 'traderframe-icon-form-refinement-v1', status: 'blocked', pass: false, structuralReview };

  const svgAdapter = createLocalSvgAdapter({ rootDir: targetRoot });
  const docAdapter = createLocalDocumentAdapter({ rootDir: targetRoot });
  const markups = allMarkups();

  const jobs = FORM_DIRECTIONS.flatMap((direction) => CALIBRATION_ANCHORS.map((anchor) => ({
    id: `traderframe-form-${direction.id}-${anchor.iconId}-v1`,
    version: '1',
    kind: 'icon-form-candidate',
    title: `${direction.label} · ${anchor.label}`,
    projectId: 'traderframe',
    operation: 'generate',
    recipe: 'icon-system-recipe',
    requiredCapabilities: ['svg', 'vector', 'icon-master'],
    rights: { status: 'project-generated', legalReview: 'unresolved' },
    input: { svg: markups[`${direction.id}/${anchor.iconId}`], outputPath: `candidate-previews/${direction.id}/${anchor.iconId}.svg`, requireFontFree: true, vectorOnly: true },
    metadata: { directionId: direction.id, semanticIconId: anchor.iconId, lockedSemanticConcept: anchor.lockedSemanticConcept, formalOnly: true, userSelected: false, userApproved: false }
  })));
  const assignments = jobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-svg' }));
  const batch = await executeProductionBatch({ jobs, assignments, adapters: [svgAdapter] });
  if (!batch.pass) return { stage: 'traderframe-icon-form-refinement-v1', status: 'blocked', pass: false, structuralReview, batch };

  const metrics = captureBrowserEvidence ? await measureWithChromium(markups) : {};
  const renderReview = captureBrowserEvidence ? renderMetricReview(metrics) : {
    stage: 'traderframe-icon-form-render-review',
    status: 'measurement-required',
    pass: false,
    findings: [{ severity: 'major', code: 'form-browser-evidence-required', message: 'Chromium evidence is required before human form selection.' }]
  };
  const selectionGate = buildFormSelectionGate();

  const docs = [];
  const addDoc = async (spec) => { const execution = await writeDocument(docAdapter, spec); docs.push(execution.artifact); return execution; };
  await addDoc({ id: 'traderframe-form-calibration-anchors-v1', title: 'TraderFrame Form Calibration Anchors v1', outputPath: 'calibration-anchors.json', content: { schema: 'ai-studio-os/icon-form-calibration-anchors@1', anchors: CALIBRATION_ANCHORS, semanticLock: true } });
  await addDoc({ id: 'traderframe-form-directions-v1', title: 'TraderFrame Form Directions v1', outputPath: 'form-directions.json', content: { schema: 'ai-studio-os/icon-form-directions@1', directions: FORM_DIRECTIONS, criteria: FORM_REVIEW_CRITERIA } });
  await addDoc({ id: 'traderframe-form-structural-review-v1', title: 'TraderFrame Form Structural Review v1', outputPath: 'structural-review.json', content: structuralReview });
  await addDoc({ id: 'traderframe-form-render-metrics-v1', title: 'TraderFrame Form Render Metrics v1', outputPath: 'render-metrics.json', content: { measured: captureBrowserEvidence, engine: captureBrowserEvidence ? 'playwright-chromium-canvas' : null, sizes: FORM_TARGET_SIZES, metrics } });
  await addDoc({ id: 'traderframe-form-render-review-v1', title: 'TraderFrame Form Render Review v1', outputPath: 'render-review.json', content: renderReview });
  await addDoc({ id: 'traderframe-form-selection-gate-v1', title: 'TraderFrame Human Form Selection Gate v1', outputPath: 'selection-gate.json', content: selectionGate, metadata: { humanSelectionRequired: true, autoWinnerForbidden: true } });
  await addDoc({ id: 'traderframe-form-exact-raster-plan-v1', title: 'TraderFrame Exact Raster Plan v1', outputPath: 'exact-raster-plan.json', content: { schema: 'ai-studio-os/icon-exact-raster-plan@1', renderer: 'playwright-chromium', reinterpretation: false, outputs: exactRasterPlan() } });

  const renderArtifacts = [];
  if (captureBrowserEvidence) {
    renderArtifacts.push(await captureHtml({ targetRoot, html: comparisonHtml(markups, 24), fileName: 'formal-comparison-24px.png', title: 'TraderFrame formal direction comparison 24px', viewport: { width: 980, height: 900 } }));
    renderArtifacts.push(await captureHtml({ targetRoot, html: comparisonHtml(markups, 64), fileName: 'formal-comparison-64px.png', title: 'TraderFrame formal direction comparison 64px', viewport: { width: 980, height: 1050 } }));
    for (const direction of FORM_DIRECTIONS) {
      for (const anchor of CALIBRATION_ANCHORS) {
        renderArtifacts.push(await captureExactRaster({ targetRoot, directionId: direction.id, iconId: anchor.iconId, svg: markups[`${direction.id}/${anchor.iconId}`] }));
      }
    }
  }

  const manifest = {
    schema: 'ai-studio-os/traderframe-icon-form-refinement@1',
    projectId: 'traderframe',
    status: structuralReview.pass && batch.pass && renderReview.pass ? 'produced-awaiting-human-form-direction-selection' : 'blocked',
    semanticSource: 'icon-semantic-construction-v2',
    semanticLock: true,
    calibrationAnchors: CALIBRATION_ANCHORS.map(({ iconId, lockedSemanticConcept }) => ({ iconId, lockedSemanticConcept })),
    directionCount: FORM_DIRECTIONS.length,
    candidateCount: jobs.length,
    exactRasterEvidence: captureBrowserEvidence ? exactRasterPlan() : [],
    selectionGate: { required: true, completed: false, winner: null, file: 'selection-gate.json' },
    truth: { userSelectedFormDirection: false, userApproved: false, fullFamilyReconstructed: false, iconDnaFrozen: false, independentVectorReviewComplete: false },
    limitations: [
      'This slice calibrates form on three locked semantic anchors only; it does not yet reconstruct all eight icons.',
      'No automated metric selects the winning visual direction.',
      'Exact PNGs are browser rasterizations of the SVG candidates; they are not AI image reinterpretations.'
    ]
  };
  await addDoc({ id: 'traderframe-form-manifest-v1', title: 'TraderFrame Icon Form Refinement Manifest v1', outputPath: 'manifest.json', content: manifest });

  const artifacts = [...batch.artifacts, ...docs, ...renderArtifacts];
  const graph = buildArtifactGraph(artifacts);
  const docsPass = docs.every((artifact) => artifact.pass);
  const expectedRenders = captureBrowserEvidence ? FORM_DIRECTIONS.length * CALIBRATION_ANCHORS.length + 2 : 0;
  const pass = structuralReview.pass && batch.pass && renderReview.pass && docsPass && graph.pass && (!captureBrowserEvidence || renderArtifacts.length === expectedRenders);
  return {
    stage: 'traderframe-icon-form-refinement-v1',
    status: pass ? manifest.status : 'blocked',
    pass,
    outputDir: targetRoot,
    structuralReview,
    renderReview,
    selectionGate,
    manifest,
    metrics,
    batch,
    graph,
    artifacts,
    counts: { anchors: CALIBRATION_ANCHORS.length, directions: FORM_DIRECTIONS.length, svgCandidates: jobs.length, exactRasters: captureBrowserEvidence ? FORM_DIRECTIONS.length * CALIBRATION_ANCHORS.length : 0, renderCaptures: renderArtifacts.length, files: artifacts.reduce((sum, artifact) => sum + (artifact.files?.length ?? 0), 0) }
  };
}
