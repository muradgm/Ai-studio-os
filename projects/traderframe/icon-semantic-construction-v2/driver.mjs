import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildArtifactGraph, createArtifact } from '../../../modules/artifact-graph/runtime.mjs';
import { createLocalDocumentAdapter } from '../../../modules/production-adapters/local-document-adapter.mjs';
import { createLocalSvgAdapter } from '../../../modules/production-adapters/local-svg-adapter.mjs';
import { executeProductionBatch, executeProductionJob } from '../../../modules/production-adapters/runtime.mjs';
import {
  CANDIDATES,
  ICONS,
  SELECTED,
  SEMANTIC_BRIEFS,
  TARGET_SIZES,
  buildBlindReviewProtocol,
  renderSelectedSemanticIcon,
  renderSemanticCandidate,
  reviewSemanticConstruction
} from './spec.mjs';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

async function writeDocument(adapter, { id, title, outputPath, content, format = 'json', dependencies = [], metadata = {} }) {
  return executeProductionJob({
    job: {
      id,
      version: '1',
      kind: format === 'json' ? 'semantic-construction-document' : 'render-evidence-index',
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
    }, { entries: Object.entries(markups), sizes: TARGET_SIZES });
  } finally {
    await browser.close();
  }
}

function candidateBoardHtml() {
  const groups = ICONS.map(([iconId, title]) => {
    const cards = CANDIDATES[iconId].map((candidate) => {
      const selected = SELECTED[iconId] === candidate.id;
      return `<figure class="${selected ? 'selected' : ''}"><div class="icon">${renderSemanticCandidate(iconId, candidate.id)}</div><figcaption><strong>${escapeHtml(candidate.id)}</strong><span>${escapeHtml(candidate.primaryAnchor)}</span><small>heuristic ${candidate.heuristicScore.toFixed(1)} · ${selected ? 'selected' : 'candidate'}</small></figcaption></figure>`;
    }).join('');
    return `<section><h2>${escapeHtml(title)}</h2><p>${escapeHtml(SEMANTIC_BRIEFS[iconId].literalMeaning)}</p><div class="candidates">${cards}</div></section>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>TraderFrame semantic candidates</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#12100F;color:#F0EAE0;font:12px Arial,sans-serif}h1{font-size:22px;margin:0 0 8px}header p,section p{color:#8f8b85}section{margin-top:28px;padding-top:20px;border-top:1px solid #272A26}h2{font-size:14px}.candidates{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:760px}figure{margin:0;padding:18px;border:1px solid #272A26;background:#171513;display:grid;grid-template-columns:72px 1fr;align-items:center;gap:16px}.selected{border-color:#E54832}.icon{width:48px;height:48px;color:#F0EAE0}.icon svg{width:100%;height:100%}.icon [data-layer="event"]{color:#E54832}figcaption{display:grid;gap:5px}figcaption span,figcaption small{color:#8f8b85}</style></head><body><header><h1>TraderFrame · Semantic Construction v2</h1><p>Three recognition-first concepts per semantic. Heuristic scores rank construction candidates only; they are not human recognition results.</p></header>${groups}</body></html>`;
}

function selectedFamilyHtml(markups, size, { blind = false, protocol = null } = {}) {
  const ordered = blind ? protocol.order.map((item) => [item.iconId, String(item.number)]) : ICONS.map(([id, title]) => [id, title]);
  const cards = ordered.map(([iconId, label]) => `<figure><div class="icon">${markups[iconId]}</div><figcaption>${blind ? `#${label}` : escapeHtml(label)}</figcaption></figure>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:26px;background:#12100F;color:#F0EAE0;font:11px Arial,sans-serif}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}figure{margin:0;height:145px;border:1px solid #272A26;background:#171513;display:grid;place-items:center;padding:10px}.icon{width:${size}px;height:${size}px;color:#F0EAE0}.icon svg{width:100%;height:100%;display:block}.icon [data-layer="event"]{color:#E54832}figcaption{color:#908c86;font-size:10px;text-align:center;margin-top:10px}</style></head><body><div class="grid">${cards}</div></body></html>`;
}

async function captureHtml({ targetRoot, html, fileName, title, dependencies = [], metadata = {}, viewport = { width: 1180, height: 210 } }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const target = path.join(targetRoot, 'render-evidence', fileName);
  try {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await page.setContent(html);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, fullPage: true });
    await page.close();
  } finally {
    await browser.close();
  }
  const buffer = await fs.readFile(target);
  return createArtifact({
    id: `traderframe-semantic-${fileName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`,
    version: '1',
    kind: 'icon-render-evidence',
    format: 'png',
    title,
    projectId: 'traderframe',
    status: 'produced',
    reviewStatus: 'unreviewed',
    releaseStatus: 'unmeasured',
    dependencies,
    creator: { type: 'browser-capture', adapterId: 'playwright-chromium', provider: 'local-browser' },
    provenance: { provider: 'local-browser', operation: 'chromium-screenshot', engine: 'playwright' },
    rights: { status: 'project-generated' },
    files: [{ ref: target, role: 'evidence', format: 'png', hash: crypto.createHash('sha256').update(buffer).digest('hex'), bytes: buffer.byteLength }],
    metadata: { ...metadata, userApproval: false }
  });
}

function measurementReview(metrics) {
  const findings = [];
  for (const [iconId] of ICONS) {
    for (const size of TARGET_SIZES) {
      const item = metrics[iconId]?.[size];
      if (!item || item.pixelCount < Math.max(4, Math.round(size / 3))) findings.push({ severity: 'major', code: 'semantic-icon-small-size-collapse', iconId, size, message: `${iconId} has insufficient rendered evidence at ${size}px.` });
      if (item && (item.centerX < 0.22 || item.centerX > 0.78 || item.centerY < 0.22 || item.centerY > 0.78)) findings.push({ severity: 'minor', code: 'semantic-icon-optical-center-risk', iconId, size, message: `${iconId} has an unusually shifted optical center at ${size}px.` });
    }
  }
  const blocking = findings.filter((item) => ['blocker', 'major'].includes(item.severity));
  return {
    stage: 'traderframe-icon-semantic-render-review',
    status: blocking.length ? 'changes-required' : 'rendered-awaiting-blind-recognition-review',
    pass: blocking.length === 0,
    findings,
    limitation: 'Pixel survival and centering do not measure whether a human understands an icon.'
  };
}

export async function runTraderFrameIconSemanticConstructionV2({ repoRoot, outputDir, captureBrowserEvidence = true } = {}) {
  const root = path.resolve(repoRoot || process.cwd());
  const targetRoot = path.resolve(outputDir || path.join(root, 'artifacts/traderframe/icon-semantic-construction-v2'));
  const constructionReview = reviewSemanticConstruction();
  if (!constructionReview.pass) return { stage: 'traderframe-icon-semantic-construction-v2', status: 'blocked', pass: false, constructionReview };

  const svgAdapter = createLocalSvgAdapter({ rootDir: targetRoot });
  const docAdapter = createLocalDocumentAdapter({ rootDir: targetRoot });

  const candidateJobs = ICONS.flatMap(([iconId, title]) => CANDIDATES[iconId].map((candidate) => ({
    id: `traderframe-${iconId}-${candidate.id}-semantic-candidate-v2`,
    version: '1',
    kind: 'icon-semantic-candidate',
    title: `${title} · ${candidate.id}`,
    projectId: 'traderframe',
    operation: 'generate',
    recipe: 'icon-system-recipe',
    requiredCapabilities: ['svg', 'vector', 'icon-master'],
    rights: { status: 'project-generated', legalReview: 'unresolved' },
    input: { svg: renderSemanticCandidate(iconId, candidate.id), outputPath: `candidate-previews/${iconId}/${candidate.id}.svg`, requireFontFree: true, vectorOnly: true },
    metadata: { iconId, candidateId: candidate.id, primaryAnchor: candidate.primaryAnchor, heuristicScore: candidate.heuristicScore, selected: SELECTED[iconId] === candidate.id, userRecognitionTested: false }
  })));
  const candidateAssignments = candidateJobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-svg' }));
  const candidateBatch = await executeProductionBatch({ jobs: candidateJobs, assignments: candidateAssignments, adapters: [svgAdapter] });
  if (!candidateBatch.pass) return { stage: 'traderframe-icon-semantic-construction-v2', status: 'blocked', pass: false, constructionReview, candidateBatch };

  const selectedMarkups = Object.fromEntries(ICONS.map(([iconId]) => [iconId, renderSelectedSemanticIcon(iconId)]));
  const selectedJobs = ICONS.map(([iconId, title]) => ({
    id: `traderframe-${iconId}-semantic-v2`,
    version: '1',
    kind: 'icon-master-candidate',
    title,
    projectId: 'traderframe',
    operation: 'generate',
    recipe: 'icon-system-recipe',
    requiredCapabilities: ['svg', 'vector', 'icon-master'],
    rights: { status: 'project-generated', legalReview: 'unresolved' },
    input: { svg: selectedMarkups[iconId], outputPath: `icons/${iconId}.svg`, requireFontFree: true, vectorOnly: true },
    metadata: { iconId, semanticBrief: SEMANTIC_BRIEFS[iconId].literalMeaning, selectedConcept: SELECTED[iconId], recognitionFirst: true, canonicalApproval: false, creativeApproval: false, userRecognitionTested: false, userApproval: false }
  }));
  const selectedAssignments = selectedJobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-svg' }));
  const selectedBatch = await executeProductionBatch({ jobs: selectedJobs, assignments: selectedAssignments, adapters: [svgAdapter] });
  if (!selectedBatch.pass) return { stage: 'traderframe-icon-semantic-construction-v2', status: 'blocked', pass: false, constructionReview, candidateBatch, selectedBatch };
  const selectedRefs = selectedBatch.artifacts.map((artifact) => artifact.ref);

  const blind = buildBlindReviewProtocol();
  const metrics = captureBrowserEvidence ? await measureWithChromium(selectedMarkups) : {};
  const renderReview = captureBrowserEvidence ? measurementReview(metrics) : { stage: 'traderframe-icon-semantic-render-review', status: 'measurement-required', pass: false, findings: [{ severity: 'major', code: 'semantic-browser-evidence-required', message: 'Chromium evidence is required before blind recognition review.' }] };

  const docs = [];
  const addDoc = async (spec) => { const execution = await writeDocument(docAdapter, spec); docs.push(execution.artifact); return execution; };
  await addDoc({ id: 'traderframe-semantic-briefs-v2', title: 'TraderFrame Semantic Icon Briefs v2', outputPath: 'semantic-briefs.json', content: { schema: 'ai-studio-os/icon-semantic-briefs@2', briefs: SEMANTIC_BRIEFS } });
  await addDoc({ id: 'traderframe-semantic-candidates-v2', title: 'TraderFrame Semantic Icon Candidates v2', outputPath: 'candidates.json', content: { schema: 'ai-studio-os/icon-semantic-candidates@2', candidates: CANDIDATES, selected: SELECTED, scoreMeaning: 'construction heuristic only; not user recognition' } });
  await addDoc({ id: 'traderframe-semantic-construction-review-v2', title: 'TraderFrame Semantic Construction Review v2', outputPath: 'construction-review.json', content: constructionReview });
  await addDoc({ id: 'traderframe-semantic-render-metrics-v2', title: 'TraderFrame Semantic Render Metrics v2', outputPath: 'render-metrics.json', content: { measured: captureBrowserEvidence, engine: captureBrowserEvidence ? 'playwright-chromium-canvas' : null, sizes: TARGET_SIZES, metrics } });
  await addDoc({ id: 'traderframe-semantic-render-review-v2', title: 'TraderFrame Semantic Render Review v2', outputPath: 'render-review.json', content: renderReview, dependencies: selectedRefs.map((artifactRef) => ({ artifactRef, relation: 'reviews-render', required: true, impact: 'review' })) });
  await addDoc({ id: 'traderframe-semantic-blind-review-form-v2', title: 'TraderFrame Blind Recognition Review Form v2', outputPath: 'blind-review-form.json', content: { schema: blind.schema, method: blind.method, passGuidance: blind.passGuidance, responseTemplate: blind.responseTemplate }, metadata: { answerKeyExcluded: true, humanRecognitionRequired: true } });
  await addDoc({ id: 'traderframe-semantic-blind-review-key-v2', title: 'TraderFrame Blind Recognition Review Key v2', outputPath: 'blind-review-key.json', content: { schema: blind.schema, answerKey: blind.answerKey }, metadata: { revealAfterBlindReview: true } });

  const indexExecution = await addDoc({ id: 'traderframe-semantic-candidate-index-v2', title: 'TraderFrame Semantic Candidate Board v2', outputPath: 'render-evidence/candidate-board.html', content: candidateBoardHtml(), format: 'text' });

  const renderArtifacts = [];
  if (captureBrowserEvidence) {
    renderArtifacts.push(await captureHtml({ targetRoot, html: candidateBoardHtml(), fileName: 'candidate-board-24px.png', title: 'TraderFrame semantic candidate board', viewport: { width: 900, height: 1600 } }));
    for (const size of TARGET_SIZES) {
      renderArtifacts.push(await captureHtml({ targetRoot, html: selectedFamilyHtml(selectedMarkups, size), fileName: `selected-family-${size}px.png`, title: `TraderFrame selected semantic family ${size}px`, dependencies: selectedRefs.map((artifactRef) => ({ artifactRef, relation: 'renders', required: true, impact: 'review' })), metadata: { targetSize: size, labeled: true } }));
    }
    renderArtifacts.push(await captureHtml({ targetRoot, html: selectedFamilyHtml(selectedMarkups, 24, { blind: true, protocol: blind }), fileName: 'blind-review-24px.png', title: 'TraderFrame blind semantic recognition sheet 24px', dependencies: selectedRefs.map((artifactRef) => ({ artifactRef, relation: 'blind-recognition-renders', required: true, impact: 'review' })), metadata: { targetSize: 24, labelsHidden: true, answerKey: 'blind-review-key.json' } }));
  }

  const manifest = {
    schema: 'ai-studio-os/traderframe-icon-semantic-construction@2',
    projectId: 'traderframe',
    status: constructionReview.pass && selectedBatch.pass && renderReview.pass ? 'produced-awaiting-blind-human-recognition-review' : 'blocked',
    frozen: false,
    recognitionFirst: true,
    conceptsPerSemantic: 3,
    candidateCount: candidateJobs.length,
    selectedCount: selectedJobs.length,
    selected: SELECTED,
    blindReview: { required: true, completed: false, form: 'blind-review-form.json', answerKey: 'blind-review-key.json', render: 'render-evidence/blind-review-24px.png' },
    renderEvidence: { measured: captureBrowserEvidence, sizes: TARGET_SIZES, selectedFamily: TARGET_SIZES.map((size) => `render-evidence/selected-family-${size}px.png`), candidateBoard: 'render-evidence/candidate-board-24px.png' },
    truth: { userRecognitionTested: false, userApproved: false, iconDnaFrozen: false, independentVectorReviewComplete: false },
    limitations: [
      'Candidate generation and ranking are deterministic benchmark logic in v2; no external art-direction model is invoked.',
      'Heuristic candidate scores are not human recognizability scores.',
      'A green automated run only proves construction, SVG integrity, and small-size render survival. Human blind recognition remains required before semantic approval.'
    ]
  };
  const manifestExecution = await addDoc({ id: 'traderframe-semantic-manifest-v2', title: 'TraderFrame Semantic Icon Construction Manifest v2', outputPath: 'manifest.json', content: manifest, dependencies: [...selectedRefs.map((artifactRef) => ({ artifactRef, relation: 'packages-selected-icon', required: true, impact: 'stale' })), { artifactRef: indexExecution.artifact.ref, relation: 'packages-candidate-index', required: true, impact: 'stale' }] });

  const artifacts = [...candidateBatch.artifacts, ...selectedBatch.artifacts, ...docs, ...renderArtifacts];
  const graph = buildArtifactGraph(artifacts);
  const docsPass = docs.every((artifact) => artifact.pass);
  const pass = constructionReview.pass && candidateBatch.pass && selectedBatch.pass && renderReview.pass && docsPass && graph.pass && (!captureBrowserEvidence || renderArtifacts.length === TARGET_SIZES.length + 2);
  return {
    stage: 'traderframe-icon-semantic-construction-v2',
    status: pass ? manifest.status : 'blocked',
    pass,
    outputDir: targetRoot,
    constructionReview,
    renderReview,
    candidateBatch,
    selectedBatch,
    metrics,
    blindReview: blind,
    manifest,
    artifacts,
    graph,
    counts: { semantics: ICONS.length, candidates: candidateJobs.length, selected: selectedJobs.length, renderCaptures: renderArtifacts.length, files: artifacts.reduce((sum, artifact) => sum + (artifact.files?.length ?? 0), 0) }
  };
}
