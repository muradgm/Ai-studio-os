import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildArtifactGraph, createArtifact } from '../../../modules/artifact-graph/runtime.mjs';
import { createLocalDocumentAdapter } from '../../../modules/production-adapters/local-document-adapter.mjs';
import { createLocalSvgAdapter, inspectSvgMarkup } from '../../../modules/production-adapters/local-svg-adapter.mjs';
import { executeProductionBatch, executeProductionJob } from '../../../modules/production-adapters/runtime.mjs';
import {
  runTraderFrameIconCreativeLoop,
  traderFrameCreativeLoopIcons,
  traderFrameIconTargetSizes
} from '../icon-creative-loop-v1/runtime.mjs';

const PATCHABLE = new Set(['data-snapshot', 'backtest', 'metric-report', 'risk-review', 'learning-event']);
const MAX_PATCH_ATTEMPTS = 2;

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function median(values = []) {
  const sorted = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function severityRank(value) {
  return ({ blocker: 4, major: 3, minor: 2, taste: 1 })[String(value).toLowerCase()] ?? 0;
}

function commandCount(markup = '') {
  return [...markup.matchAll(/\sd="([^"]+)"/g)]
    .map((match) => (match[1].match(/[MLHVCSQTAZmlhvcsqtaz]/g) ?? []).length)
    .reduce((sum, count) => sum + count, 0);
}

function pathCount(markup = '') {
  return (markup.match(/<path\b/g) ?? []).length;
}

function basePath(markup = '') {
  const group = markup.match(/<g[^>]*data-layer="base"[^>]*>([\s\S]*?)<\/g>/);
  return group?.[1]?.match(/\sd="([^"]+)"/)?.[1] ?? '';
}

function gatePathCount(markup = '') {
  const groups = [...markup.matchAll(/<g[^>]*data-primitive="gate"[^>]*>([\s\S]*?)<\/g>/g)];
  return groups.reduce((sum, match) => sum + (match[1].match(/<path\b/g) ?? []).length, 0);
}

function finding(severity, code, message, data = {}) {
  return { severity, code, message, ...data };
}

function renderPatchedBody(name, attempt = 1) {
  const strict = attempt >= 2;
  const bodies = {
    'data-snapshot': `
    <g data-layer="base" data-primitive="frame-corner"><path id="snapshot-frame" d="M6 8v8h3M18 8v8h-3"/></g>
    <g data-layer="structure" data-primitive="trace"><path id="snapshot-trace" d="M9 12h6"/></g>
    <g data-layer="event" data-primitive="node"><path id="snapshot-node" d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`,
    backtest: strict ? `
    <g data-layer="base" data-primitive="gate"><path id="backtest-gate" d="M7 5v14"/></g>
    <g data-layer="structure" data-primitive="return"><path id="backtest-return" d="M7 8h10v8H11"/></g>
    <g data-layer="event" data-primitive="node"><path id="backtest-node" d="M11 13l3 3-3 3-3-3 3-3Z"/></g>` : `
    <g data-layer="base" data-primitive="gate"><path id="backtest-gate" d="M7 5v14"/></g>
    <g data-layer="structure" data-primitive="return"><path id="backtest-return" d="M7 8h10v8H12"/></g>
    <g data-layer="event" data-primitive="node"><path id="backtest-node" d="M12 13l3 3-3 3-3-3 3-3Z"/></g>`,
    'metric-report': `
    <g data-layer="base" data-primitive="trace"><path id="metric-trace-a" d="M5 8h14"/><path id="metric-trace-b" d="M5 16h14"/></g>
    <g data-layer="structure" data-primitive="gate"><path id="metric-gate-a" d="M9 6v4"/><path id="metric-gate-b" d="M15 14v4"/></g>
    <g data-layer="event" data-primitive="node"><path id="metric-node" d="M12 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'risk-review': `
    <g data-layer="base" data-primitive="trace"><path id="risk-trace" d="M5 12h9"/></g>
    <g data-layer="structure" data-primitive="gate"><path id="risk-gate" d="M15 5v5M15 14v5"/></g>
    <g data-layer="event" data-primitive="node"><path id="risk-held" d="M11 9l3 3-3 3-3-3 3-3Z"/></g>`,
    'learning-event': strict ? `
    <g data-layer="base" data-primitive="return"><path id="learning-return" d="M18 6v11h-8"/></g>
    <g data-layer="structure" data-primitive="trace"><path id="learning-reentry" d="M10 17H6v-4"/></g>
    <g data-layer="event" data-primitive="node"><path id="learning-node" d="M10 14l3 3-3 3-3-3 3-3Z"/></g>` : `
    <g data-layer="base" data-primitive="return"><path id="learning-return" d="M18 6v11h-6"/></g>
    <g data-layer="structure" data-primitive="trace"><path id="learning-reentry" d="M12 17H7v-5"/></g>
    <g data-layer="event" data-primitive="node"><path id="learning-node" d="M12 14l3 3-3 3-3-3 3-3Z"/></g>`
  };
  return bodies[name] ?? null;
}

export function renderTraderFramePatchedIcon(name, baselineMarkup, attempt = 1) {
  const body = renderPatchedBody(name, attempt);
  if (!body) return baselineMarkup;
  return `<svg xmlns="http://www.w3.org/2000/svg" data-direction="gate-decision" data-kind="calibration-icon" data-patch="visual-review-v1" data-patch-attempt="${attempt}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">${body}\n</svg>`;
}

export function reviewTraderFrameIconVisuals(markups, metrics = {}) {
  const semantic = [];
  const optical = [];
  const antiGeneric = [];
  const distinctiveness = [];

  const snapshotBase = basePath(markups['data-snapshot']);
  const metricBase = basePath(markups['metric-report']);
  if (snapshotBase && snapshotBase === metricBase) {
    semantic.push(finding('major', 'traderframe-icon-semantic-silhouette-collision', 'Data Snapshot and Metric Report share the same dominant trace silhouette and are not sufficiently differentiated.', { icons: ['data-snapshot', 'metric-report'], evidence: { sharedBasePath: snapshotBase } }));
  }

  const complexity = Object.fromEntries(Object.entries(markups).map(([id, markup]) => [id, { commands: commandCount(markup), paths: pathCount(markup) }]));
  const commandMedian = median(Object.values(complexity).map((item) => item.commands));
  const backtest = complexity.backtest;
  if (backtest && (backtest.paths >= 4 || backtest.commands > commandMedian * 1.45)) {
    optical.push(finding('major', 'traderframe-icon-small-size-complexity-risk', 'Backtest carries materially more path complexity than the family median and is likely to collapse at the smallest targets.', { icon: 'backtest', evidence: { ...backtest, familyMedianCommands: commandMedian } }));
  }

  const size24 = traderFrameIconTargetSizes.includes(24) ? 24 : traderFrameIconTargetSizes[0];
  const occupancies = Object.values(metrics).map((entry) => entry?.[size24]?.occupancy).filter(Number.isFinite);
  const occupancyMedian = median(occupancies);
  const learningOccupancy = metrics['learning-event']?.[size24]?.occupancy;
  if (Number.isFinite(learningOccupancy) && occupancyMedian > 0 && learningOccupancy > occupancyMedian * 1.28) {
    optical.push(finding('major', 'traderframe-icon-optical-density-outlier', 'Learning Event occupies materially more visual area than the family median and reads as a different optical family.', { icon: 'learning-event', evidence: { occupancy: learningOccupancy, familyMedianOccupancy: occupancyMedian, ratio: round(learningOccupancy / occupancyMedian) } }));
  }

  const riskGatePaths = gatePathCount(markups['risk-review']);
  if (riskGatePaths >= 2) {
    antiGeneric.push(finding('major', 'traderframe-icon-control-sliders-collision', 'Risk Review uses parallel gate strokes that can read as controls/sliders instead of a single review boundary.', { icon: 'risk-review', evidence: { gatePathCount: riskGatePaths } }));
  }

  const outcome = markups['outcome-logged'] ?? '';
  if (outcome.includes('data-primitive="frame-corner"') && outcome.includes('outcome-link')) {
    distinctiveness.push(finding('minor', 'traderframe-icon-outcome-register-integration', 'Outcome Logged keeps the terminal register corner visually separate from the resolved evidence node; integration should be checked in user review.', { icon: 'outcome-logged' }));
  }

  for (const [id, markup] of Object.entries(markups)) {
    const inspection = inspectSvgMarkup(markup, { requireFontFree: true, vectorOnly: true });
    for (const item of inspection.findings) {
      semantic.push({ ...item, icon: id });
    }
    const m16 = metrics[id]?.[16];
    const m24 = metrics[id]?.[24];
    if (m16 && m24 && Math.abs(m16.centerX - m24.centerX) > 0.1) {
      optical.push(finding('minor', 'traderframe-icon-optical-center-drift', `${id} shifts its rendered center materially between 16px and 24px.`, { icon: id, evidence: { center16: m16.centerX, center24: m24.centerX } }));
    }
  }

  const lenses = [
    { id: 'semantic-reviewer', findings: semantic },
    { id: 'optical-reviewer', findings: optical },
    { id: 'anti-generic-reviewer', findings: antiGeneric },
    { id: 'brand-distinctiveness-reviewer', findings: distinctiveness }
  ].map((lens) => ({
    ...lens,
    status: lens.findings.some((item) => severityRank(item.severity) >= severityRank('major')) ? 'changes-required' : 'reviewed'
  }));

  const findings = lenses.flatMap((lens) => lens.findings.map((item) => ({ ...item, reviewer: lens.id })));
  const blocking = findings.filter((item) => severityRank(item.severity) >= severityRank('major'));
  return {
    stage: 'traderframe-icon-visual-family-review',
    status: blocking.length ? 'changes-required' : 'review',
    pass: blocking.length === 0,
    approval: 'user-visual-and-independent-vector-review-required',
    lenses,
    metricsSummary: { size: size24, occupancyMedian, commandMedian },
    findings
  };
}

export function buildTraderFrameIconPatchPlan(review) {
  const icons = [];
  const reasons = {};
  for (const item of review?.findings ?? []) {
    if (severityRank(item.severity) < severityRank('major')) continue;
    const affected = item.icons ?? (item.icon ? [item.icon] : []);
    for (const icon of affected) {
      if (!PATCHABLE.has(icon)) continue;
      if (!icons.includes(icon)) icons.push(icon);
      (reasons[icon] ??= []).push({ code: item.code, reviewer: item.reviewer, severity: item.severity, message: item.message });
    }
  }
  return {
    stage: 'traderframe-icon-patch-plan',
    action: icons.length ? 'patch' : 'hold',
    maxAttempts: MAX_PATCH_ATTEMPTS,
    icons,
    reasons,
    preserveUnchangedIcons: traderFrameCreativeLoopIcons.map(([id]) => id).filter((id) => !icons.includes(id))
  };
}

export function applyTraderFrameIconPatch(markups, plan, attempt = 1) {
  const next = { ...markups };
  for (const icon of plan.icons ?? []) next[icon] = renderTraderFramePatchedIcon(icon, markups[icon], attempt);
  return next;
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
          const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
          const image = await load(src);
          ctx.clearRect(0, 0, size, size);
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

function comparisonHtml(before, after, reviews) {
  const rows = traderFrameIconTargetSizes.map((size) => {
    const renderSet = (label, markups) => `<div class="set"><h3>${label}</h3><div class="grid">${traderFrameCreativeLoopIcons.map(([id, title]) => `<figure><div class="icon" style="--s:${size}px">${markups[id]}</div><figcaption>${title}</figcaption></figure>`).join('')}</div></div>`;
    return `<section><h2>${size}px</h2>${renderSet('Before review', before)}${renderSet('After patch', after)}</section>`;
  }).join('');
  const counts = (review) => ({ major: review.findings.filter((item) => severityRank(item.severity) >= 3).length, minor: review.findings.filter((item) => severityRank(item.severity) === 2).length });
  return `<!doctype html><html><head><meta charset="utf-8"><title>TraderFrame visual review patch evidence</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#12100F;color:#F0EAE0;font:12px Arial,sans-serif}h1{margin:0 0 10px}p{color:#98958f}section{margin-top:32px;padding-top:18px;border-top:1px solid #272A26}h2{font-size:14px}.set{margin-top:18px}.set h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#918e88}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}figure{margin:0;min-height:110px;padding:12px 6px;border:1px solid #272A26;background:#171513;display:grid;place-items:center}.icon{width:var(--s);height:var(--s);color:#F0EAE0}.icon svg{width:100%;height:100%;display:block}.icon [data-layer="event"]{color:#E54832}figcaption{margin-top:10px;color:#8d8983;font-size:10px;text-align:center}</style></head><body><h1>TraderFrame · Icon Family Visual Review & Patch Loop v1</h1><p>Before: ${JSON.stringify(counts(reviews.before))} · After: ${JSON.stringify(counts(reviews.after))} · Candidate only; not user approved.</p>${rows}</body></html>`;
}

async function writeDocument(adapter, { id, title, outputPath, content, format = 'json', dependencies = [], metadata = {} }) {
  return executeProductionJob({
    job: {
      id, version: '1', kind: format === 'json' ? 'visual-review-document' : 'render-evidence-index', title,
      projectId: 'traderframe', operation: 'write-document', format, requiredCapabilities: [format === 'json' ? 'json' : 'text'], recipe: 'icon-system-recipe',
      dependencies, input: { format, outputPath, content }, metadata
    }, adapter
  });
}

async function captureComparison({ targetRoot, html, iconRefs }) {
  const indexPath = path.join(targetRoot, 'render-evidence', 'before-after.html');
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(indexPath, html, 'utf8');
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const artifacts = [];
  try {
    for (const size of traderFrameIconTargetSizes) {
      const page = await browser.newPage({ viewport: { width: 1180, height: 360 }, deviceScaleFactor: 1 });
      await page.setContent(html);
      const section = page.locator(`section:has(h2:text-is("${size}px"))`);
      const target = path.join(targetRoot, 'render-evidence', `before-after-${size}px.png`);
      await section.screenshot({ path: target });
      await page.close();
      const buffer = await fs.readFile(target);
      artifacts.push(createArtifact({
        id: `traderframe-icon-visual-patch-render-${size}px-v1`, version: '1', kind: 'icon-render-evidence', format: 'png',
        title: `TraderFrame icon visual patch before/after ${size}px`, projectId: 'traderframe', status: 'produced', reviewStatus: 'unreviewed', releaseStatus: 'unmeasured',
        dependencies: iconRefs.map((artifactRef) => ({ artifactRef, relation: 'renders', required: true, impact: 'review' })),
        creator: { type: 'browser-capture', adapterId: 'playwright-chromium', provider: 'local-browser' },
        provenance: { provider: 'local-browser', operation: 'chromium-screenshot', engine: 'playwright' }, rights: { status: 'project-generated' },
        files: [{ ref: target, role: 'evidence', format: 'png', hash: crypto.createHash('sha256').update(buffer).digest('hex'), bytes: buffer.byteLength }],
        metadata: { targetSize: size, comparison: 'before-after', userApproval: false }
      }));
    }
  } finally {
    await browser.close();
  }
  return { artifacts, indexPath };
}

function markupsFromBatch(batch) {
  return Object.fromEntries(batch.artifacts.map((artifact) => {
    const id = artifact.id.replace(/^traderframe-/, '').replace(/-creative-v1$/, '');
    return [id, artifact.files?.[0]?.ref];
  }).filter(([, ref]) => ref).map(([id, ref]) => [id, ref]));
}

async function loadMarkups(batch) {
  const refs = markupsFromBatch(batch);
  return Object.fromEntries(await Promise.all(Object.entries(refs).map(async ([id, ref]) => [id, await fs.readFile(ref, 'utf8')])));
}

export async function runTraderFrameIconVisualReviewPatch({ repoRoot, outputDir, captureBrowserEvidence = true } = {}) {
  const root = path.resolve(repoRoot || process.cwd());
  const targetRoot = path.resolve(outputDir || path.join(root, 'artifacts/traderframe/icon-visual-review-patch-v1'));
  const baseline = await runTraderFrameIconCreativeLoop({ repoRoot: root, outputDir: path.join(targetRoot, 'baseline'), captureBrowserEvidence: false });
  if (!baseline.pass) return { stage: 'traderframe-icon-visual-review-patch', status: 'blocked', pass: false, baseline };
  if (!captureBrowserEvidence) {
    return { stage: 'traderframe-icon-visual-review-patch', status: 'measurement-required', pass: false, baseline, findings: [finding('major', 'traderframe-icon-browser-measurement-required', 'Visual patch review requires Chromium pixel evidence before patching.')] };
  }

  const beforeMarkups = await loadMarkups(baseline.iconBatch);
  const beforeMetrics = await measureWithChromium(beforeMarkups);
  const beforeReview = reviewTraderFrameIconVisuals(beforeMarkups, beforeMetrics);
  let plan = buildTraderFrameIconPatchPlan(beforeReview);
  const initialPlan = structuredClone(plan);
  let currentMarkups = beforeMarkups;
  const attempts = [];
  let afterMetrics = beforeMetrics;
  let afterReview = beforeReview;

  for (let attempt = 1; attempt <= MAX_PATCH_ATTEMPTS && plan.icons.length; attempt += 1) {
    const candidate = applyTraderFrameIconPatch(currentMarkups, plan, attempt);
    const metrics = await measureWithChromium(candidate);
    const review = reviewTraderFrameIconVisuals(candidate, metrics);
    attempts.push({ attempt, patchedIcons: [...plan.icons], beforeMajorCount: afterReview.findings.filter((item) => severityRank(item.severity) >= 3).length, afterMajorCount: review.findings.filter((item) => severityRank(item.severity) >= 3).length, findings: review.findings });
    currentMarkups = candidate;
    afterMetrics = metrics;
    afterReview = review;
    plan = buildTraderFrameIconPatchPlan(review);
  }

  const svgAdapter = createLocalSvgAdapter({ rootDir: targetRoot });
  const finalJobs = traderFrameCreativeLoopIcons.map(([name, title, semantic]) => ({
    id: `traderframe-${name}-visual-patch-v1`, version: '1', kind: 'icon-master', title, projectId: 'traderframe', operation: 'generate', recipe: 'icon-system-recipe',
    requiredCapabilities: ['svg', 'vector', 'icon-master'], rights: { status: 'project-generated', legalReview: 'unresolved' },
    dependencies: [{ artifactRef: baseline.iconBatch.artifacts.find((artifact) => artifact.id === `traderframe-${name}-creative-v1`)?.ref, relation: PATCHABLE.has(name) ? 'patches' : 'preserves', required: true, impact: 'review' }],
    input: { svg: currentMarkups[name], outputPath: `icons/${name}.svg`, requireFontFree: true, vectorOnly: true },
    metadata: { semantic, selectedDirectionId: 'gate-decision', patchLoop: 'visual-review-v1', changedByPatchLoop: initialPlan.icons.includes(name), canonicalApproval: false, creativeApproval: false, userApproval: false }
  }));
  const assignments = finalJobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-svg' }));
  const finalBatch = await executeProductionBatch({ jobs: finalJobs, assignments, adapters: [svgAdapter] });
  const finalRefs = finalBatch.artifacts.map((artifact) => artifact.ref);

  const docAdapter = createLocalDocumentAdapter({ rootDir: targetRoot });
  const documents = [];
  const addDoc = async (spec) => { const execution = await writeDocument(docAdapter, spec); documents.push(execution.artifact); return execution; };
  await addDoc({ id: 'traderframe-icon-visual-metrics-before-v1', title: 'TraderFrame Icon Visual Metrics Before Patch', outputPath: 'metrics-before.json', content: { measured: true, engine: 'playwright-chromium-canvas', sizes: traderFrameIconTargetSizes, metrics: beforeMetrics } });
  await addDoc({ id: 'traderframe-icon-visual-review-before-v1', title: 'TraderFrame Icon Visual Review Before Patch', outputPath: 'review-before.json', content: beforeReview, metadata: { independentLensCount: beforeReview.lenses.length } });
  await addDoc({ id: 'traderframe-icon-patch-plan-v1', title: 'TraderFrame Icon Patch Plan', outputPath: 'patch-plan.json', content: initialPlan, metadata: { patchOnlyMajorOrBlocker: true, maxAttempts: MAX_PATCH_ATTEMPTS } });
  await addDoc({ id: 'traderframe-icon-patch-attempts-v1', title: 'TraderFrame Icon Patch Attempts', outputPath: 'patch-attempts.json', content: { attempts, cappedAt: MAX_PATCH_ATTEMPTS }, metadata: { boundedPatchLoop: true } });
  await addDoc({ id: 'traderframe-icon-visual-metrics-after-v1', title: 'TraderFrame Icon Visual Metrics After Patch', outputPath: 'metrics-after.json', content: { measured: true, engine: 'playwright-chromium-canvas', sizes: traderFrameIconTargetSizes, metrics: afterMetrics } });
  const reviewExecution = await addDoc({ id: 'traderframe-icon-visual-review-after-v1', title: 'TraderFrame Icon Visual Review After Patch', outputPath: 'review-after.json', content: afterReview, dependencies: finalRefs.map((artifactRef) => ({ artifactRef, relation: 'reviews', required: true, impact: 'review' })), metadata: { userVisualApprovalRequired: true } });

  const html = comparisonHtml(beforeMarkups, currentMarkups, { before: beforeReview, after: afterReview });
  const htmlExecution = await addDoc({ id: 'traderframe-icon-before-after-index-v1', title: 'TraderFrame Icon Before/After Render Index', outputPath: 'render-evidence/before-after.html', content: html, format: 'text', dependencies: finalRefs.map((artifactRef) => ({ artifactRef, relation: 'renders', required: true, impact: 'review' })) });
  const comparison = await captureComparison({ targetRoot, html, iconRefs: finalRefs });

  const blockingAfter = afterReview.findings.filter((item) => severityRank(item.severity) >= severityRank('major'));
  const improved = beforeReview.findings.filter((item) => severityRank(item.severity) >= severityRank('major')).length > blockingAfter.length;
  const manifest = {
    schema: 'ai-studio-os/traderframe-icon-visual-review-patch@1', projectId: 'traderframe', source: 'icon-creative-loop-v1',
    status: blockingAfter.length ? 'changes-still-required' : 'improved-awaiting-user-and-independent-review', frozen: false,
    reviewerLenses: beforeReview.lenses.map((lens) => lens.id), patchPolicy: { severities: ['blocker', 'major'], maxAttempts: MAX_PATCH_ATTEMPTS, surgical: true },
    initialMajorCount: beforeReview.findings.filter((item) => severityRank(item.severity) >= 3).length, finalMajorCount: blockingAfter.length, improved,
    patchedIcons: initialPlan.icons, preservedIcons: initialPlan.preserveUnchangedIcons,
    renderEvidence: { measured: true, sizes: traderFrameIconTargetSizes, index: 'render-evidence/before-after.html', screenshots: traderFrameIconTargetSizes.map((size) => `render-evidence/before-after-${size}px.png`) },
    finalReview: { status: afterReview.status, approval: afterReview.approval, findings: afterReview.findings },
    truth: { userApproved: false, iconDnaFrozen: false, independentVectorReviewComplete: false, brokerIntegration: false, autonomousExecution: false, performanceClaims: false },
    limitations: ['Visual measurements are local Chromium raster evidence, not human taste or legal approval.', 'The patch geometry is deterministic benchmark logic in v1; no external art-direction model is invoked.', 'Minor and taste findings remain visible but are not auto-patched under the bounded patch policy.']
  };
  const manifestExecution = await addDoc({ id: 'traderframe-icon-visual-patch-manifest-v1', title: 'TraderFrame Icon Visual Review Patch Manifest', outputPath: 'manifest.json', content: manifest, dependencies: [{ artifactRef: reviewExecution.artifact.ref, relation: 'packages-review', required: true, impact: 'stale' }, { artifactRef: htmlExecution.artifact.ref, relation: 'packages-render-index', required: true, impact: 'stale' }, ...finalRefs.map((artifactRef) => ({ artifactRef, relation: 'packages-icon', required: true, impact: 'stale' }))], metadata: { frozen: false, userApproval: false } });

  const artifacts = [...baseline.artifacts, ...finalBatch.artifacts, ...documents, ...comparison.artifacts];
  const graph = buildArtifactGraph(artifacts);
  const pass = baseline.pass && finalBatch.pass && documents.every((artifact) => artifact.pass) && graph.pass && blockingAfter.length === 0 && comparison.artifacts.length === traderFrameIconTargetSizes.length;
  return {
    stage: 'traderframe-icon-visual-review-patch', status: pass ? manifest.status : 'blocked', pass, outputDir: targetRoot,
    baseline, beforeMetrics, beforeReview, patchPlan: initialPlan, attempts, afterMetrics, afterReview, finalBatch, comparison, manifest, artifacts, graph,
    counts: { icons: traderFrameCreativeLoopIcons.length, patched: initialPlan.icons.length, attempts: attempts.length, renderCaptures: comparison.artifacts.length, beforeMajor: manifest.initialMajorCount, afterMajor: manifest.finalMajorCount }
  };
}

export { MAX_PATCH_ATTEMPTS as traderFrameIconPatchAttemptCap };
