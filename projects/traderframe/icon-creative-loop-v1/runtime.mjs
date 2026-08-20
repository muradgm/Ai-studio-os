import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildArtifactGraph, createArtifact } from '../../../modules/artifact-graph/runtime.mjs';
import { createLocalDocumentAdapter } from '../../../modules/production-adapters/local-document-adapter.mjs';
import { createLocalSvgAdapter, inspectSvgMarkup } from '../../../modules/production-adapters/local-svg-adapter.mjs';
import { executeProductionBatch, executeProductionJob } from '../../../modules/production-adapters/runtime.mjs';

const TARGET_SIZES = [16, 20, 24, 32];
const ICONS = [
  ['strategy-idea', 'Strategy Idea', 'Frame the hypothesis before evidence work begins.'],
  ['data-snapshot', 'Data Snapshot', 'A bounded, reproducible market-data slice.'],
  ['backtest', 'Backtest', 'Replay the strategy against historical evidence.'],
  ['metric-report', 'Metric Report', 'Measured output and threshold evidence.'],
  ['risk-review', 'Risk Review', 'Explicit boundary review before operator action.'],
  ['operator-decision', 'Operator Decision', 'Human-controlled decision gate.'],
  ['outcome-logged', 'Outcome Logged', 'Record what happened after the decision.'],
  ['learning-event', 'Learning Event', 'Feed validated evidence back into the research loop.']
];

const SEMANTIC_MAP = Object.freeze({
  'strategy-idea': {
    intent: 'A hypothesis enters the evidence system but is not yet validated.',
    forbiddenDefaults: ['lightbulb', 'spark', 'brain'],
    selectedDecomposition: ['seed-node', 'evidence-trace', 'first-gate']
  },
  'data-snapshot': {
    intent: 'A reproducible evidence window is bounded in time and scope.',
    forbiddenDefaults: ['document', 'list', 'table'],
    selectedDecomposition: ['bounded-window', 'evidence-trace', 'sample-nodes']
  },
  backtest: {
    intent: 'Evidence is replayed through an earlier state before returning to review.',
    forbiddenDefaults: ['candlestick', 'line-chart', 'chart-in-box', 'rewind-arrow'],
    selectedDecomposition: ['return-trace', 'historical-gate', 're-entry-node']
  },
  'metric-report': {
    intent: 'Evidence is measured against declared thresholds rather than presented as decoration.',
    forbiddenDefaults: ['bar-chart', 'pie-chart', 'gauge'],
    selectedDecomposition: ['measurement-trace', 'measure-ticks', 'threshold-gate']
  },
  'risk-review': {
    intent: 'Evidence reaches a hard boundary that must be reviewed before action.',
    forbiddenDefaults: ['shield', 'warning-triangle', 'lock'],
    selectedDecomposition: ['incoming-trace', 'risk-gate', 'held-state']
  },
  'operator-decision': {
    intent: 'A human decision selects one branch only after the gate.',
    forbiddenDefaults: ['checkmark', 'person-hand', 'button'],
    selectedDecomposition: ['decision-gate', 'branch-point', 'selected-branch']
  },
  'outcome-logged': {
    intent: 'The selected branch resolves into a registered evidence state.',
    forbiddenDefaults: ['document', 'clipboard', 'checklist'],
    selectedDecomposition: ['resolved-branch', 'registered-node', 'terminal-frame']
  },
  'learning-event': {
    intent: 'Validated outcome evidence returns to the research system as a new learning input.',
    forbiddenDefaults: ['lightbulb', 'graduation-cap', 'brain', 'refresh-arrow'],
    selectedDecomposition: ['return-path', 'learning-node', 're-entry-gate']
  }
});

const DIRECTIONS = Object.freeze([
  {
    id: 'frame-signal',
    name: 'Frame + Signal',
    premise: 'Use open framing fragments and acquisition events to show that TraderFrame focuses noisy market information into controlled evidence.',
    primitives: ['open-frame', 'acquired-corner', 'focus-node', 'axis-break'],
    productLinks: ['frame', 'focus', 'evidence-context'],
    categoryCollisionRisk: 'medium',
    rubric: { productTruth: 8.1, proprietaryGrammar: 7.4, semanticRange: 7.8, smallSizeFeasibility: 9.0 },
    risks: ['Can drift toward crop/scan/focus UI conventions.', 'Weaker expression of GateZero operator governance.'],
    iconMetaphors: {
      'strategy-idea': 'seed node entering an open evidence frame',
      'data-snapshot': 'captured evidence window between frame fragments',
      backtest: 'signal path returning through an earlier frame edge',
      'metric-report': 'aligned evidence marks inside a framing axis',
      'risk-review': 'signal held against a framing boundary',
      'operator-decision': 'acquired corner resolving into a branch',
      'outcome-logged': 'resolved node registered to a terminal corner',
      'learning-event': 'signal returning to the originating frame'
    }
  },
  {
    id: 'evidence-trace',
    name: 'Evidence Trace',
    premise: 'Treat every product state as a trace moving through evidence nodes, thresholds, returns, and measured transitions.',
    primitives: ['trace', 'evidence-node', 'measure-tick', 'return', 'break'],
    productLinks: ['evidence', 'reproducibility', 'learning-loop', 'measurement'],
    categoryCollisionRisk: 'medium-low',
    rubric: { productTruth: 9.2, proprietaryGrammar: 8.2, semanticRange: 9.0, smallSizeFeasibility: 8.2 },
    risks: ['Can collapse into sparkline/chart language if traces become performance graphs.', 'Needs strict non-financial geometry to remain ownable.'],
    iconMetaphors: {
      'strategy-idea': 'seed node at the start of an unproven evidence trace',
      'data-snapshot': 'bounded sample nodes cut from a longer trace',
      backtest: 'trace folding backward through a historical state',
      'metric-report': 'trace intersecting declared measurement ticks',
      'risk-review': 'trace stopping at a threshold before continuation',
      'operator-decision': 'trace branching after a controlled threshold',
      'outcome-logged': 'selected trace ending in a registered evidence node',
      'learning-event': 'resolved trace returning as a new input'
    }
  },
  {
    id: 'gate-decision',
    name: 'Gate + Decision',
    premise: 'Make the protected decision loop visible: evidence approaches a gate, a controlled branch occurs, and validated outcomes can return as learning.',
    primitives: ['trace', 'gate', 'node', 'branch', 'return', 'frame-corner'],
    productLinks: ['GateZero', 'evidence-before-action', 'operator-control', 'risk-boundary', 'learning-loop'],
    categoryCollisionRisk: 'low',
    rubric: { productTruth: 10.0, proprietaryGrammar: 9.2, semanticRange: 9.4, smallSizeFeasibility: 9.0 },
    risks: ['Abstraction can become cryptic if every gate is drawn identically.', 'Requires optical variation without inventing new grammar.'],
    iconMetaphors: {
      'strategy-idea': 'seed node approaching the first evidence gate',
      'data-snapshot': 'sample nodes held inside a bounded gate window',
      backtest: 'trace returning through a historical gate before re-entry',
      'metric-report': 'measured trace resolving against a threshold gate',
      'risk-review': 'incoming evidence held at the risk gate',
      'operator-decision': 'branch selected only after the decision gate',
      'outcome-logged': 'selected branch resolving into a registered node',
      'learning-event': 'resolved evidence returning through a re-entry gate'
    }
  }
]);

const RISK_SCORE = Object.freeze({ low: 9.6, 'medium-low': 8.5, medium: 7.0, high: 4.0 });

function round(value) {
  return Math.round(value * 100) / 100;
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function directionCollisions(direction) {
  const collisions = [];
  for (const [icon, metaphor] of Object.entries(direction.iconMetaphors ?? {})) {
    const text = normalize(metaphor);
    for (const forbidden of SEMANTIC_MAP[icon]?.forbiddenDefaults ?? []) {
      if (text.includes(normalize(forbidden))) collisions.push({ icon, forbidden, metaphor });
    }
  }
  return collisions;
}

function reviewDirection(direction) {
  const collisions = directionCollisions(direction);
  const antiGeneric = Math.max(0, (RISK_SCORE[direction.categoryCollisionRisk] ?? 6) - collisions.length * 2.5);
  const scores = {
    productTruth: Number(direction.rubric.productTruth),
    proprietaryGrammar: Number(direction.rubric.proprietaryGrammar),
    semanticRange: Number(direction.rubric.semanticRange),
    smallSizeFeasibility: Number(direction.rubric.smallSizeFeasibility),
    antiGeneric: round(antiGeneric)
  };
  const total = round(
    scores.productTruth * 0.30 +
    scores.proprietaryGrammar * 0.25 +
    scores.semanticRange * 0.20 +
    scores.smallSizeFeasibility * 0.10 +
    scores.antiGeneric * 0.15
  );
  const findings = collisions.map((collision) => ({
    severity: 'blocker',
    code: 'traderframe-icon-direction-generic-default',
    message: `${direction.id}/${collision.icon} falls back to forbidden default '${collision.forbidden}'.`,
    evidence: collision
  }));
  return {
    directionId: direction.id,
    status: findings.length ? 'blocked' : 'reviewed',
    pass: findings.length === 0,
    scores,
    total,
    findings,
    risks: [...direction.risks]
  };
}

function jaccard(a = [], b = []) {
  const aa = new Set(a);
  const bb = new Set(b);
  const union = new Set([...aa, ...bb]);
  if (!union.size) return 1;
  let intersection = 0;
  for (const value of aa) if (bb.has(value)) intersection += 1;
  return intersection / union.size;
}

export function exploreTraderFrameIconDirections() {
  const reviews = DIRECTIONS.map(reviewDirection);
  const eligible = reviews.filter((review) => review.pass).sort((a, b) => b.total - a.total || a.directionId.localeCompare(b.directionId));
  const selectedReview = eligible[0] ?? null;
  const selected = DIRECTIONS.find((direction) => direction.id === selectedReview?.directionId) ?? null;
  const diversity = [];
  for (let index = 0; index < DIRECTIONS.length; index += 1) {
    for (let other = index + 1; other < DIRECTIONS.length; other += 1) {
      diversity.push({
        pair: [DIRECTIONS[index].id, DIRECTIONS[other].id],
        primitiveJaccard: round(jaccard(DIRECTIONS[index].primitives, DIRECTIONS[other].primitives))
      });
    }
  }
  const maxPrimitiveJaccard = Math.max(...diversity.map((item) => item.primitiveJaccard));
  const rejected = reviews
    .filter((review) => review.directionId !== selectedReview?.directionId)
    .map((review) => {
      const direction = DIRECTIONS.find((item) => item.id === review.directionId);
      const reason = review.pass
        ? `${direction.name} scored ${review.total}, below selected ${selected?.name} at ${selectedReview?.total}. ${direction.risks[0]}`
        : `${direction.name} failed the anti-generic gate: ${review.findings.map((item) => item.message).join(' ')}`;
      return { directionId: review.directionId, score: review.total, rejectedBecause: reason };
    });

  const findings = [];
  if (!selected) findings.push({ severity: 'blocker', code: 'traderframe-icon-direction-selection-missing', message: 'No icon direction survived anti-generic review.' });
  if (DIRECTIONS.length < 3) findings.push({ severity: 'blocker', code: 'traderframe-icon-direction-divergence-insufficient', message: 'At least three serious icon directions are required before convergence.' });
  if (maxPrimitiveJaccard >= 0.7) findings.push({ severity: 'blocker', code: 'traderframe-icon-direction-cosmetic-variants', message: 'Direction primitive vocabularies are too similar to count as genuine divergence.', evidence: { diversity } });

  return {
    stage: 'traderframe-icon-direction-exploration',
    status: findings.length ? 'blocked' : 'selected-candidate',
    pass: findings.length === 0,
    directions: DIRECTIONS.map((direction) => structuredClone(direction)),
    reviews,
    selectedDirectionId: selected?.id ?? null,
    selectedDirection: selected ? structuredClone(selected) : null,
    rejected,
    diversity: { comparisons: diversity, maxPrimitiveJaccard },
    findings,
    approval: 'candidate-selection-only-not-family-approval'
  };
}

function directionPreviewBody(directionId) {
  const previews = {
    'frame-signal': `
    <g data-layer="base" data-primitive="open-frame"><path id="preview-frame" d="M5 18V6h7"/></g>
    <g data-layer="structure" data-primitive="focus-node"><path id="preview-node" d="M12 9l3 3-3 3-3-3 3-3Z"/></g>
    <g data-layer="event" data-primitive="acquired-corner"><path id="preview-event" d="M16 6h3v3M19 15v3h-3"/></g>`,
    'evidence-trace': `
    <g data-layer="base" data-primitive="trace"><path id="preview-trace" d="M4 14h5l3-5 3 5h5"/></g>
    <g data-layer="structure" data-primitive="evidence-node"><path id="preview-node-a" d="M9 12l2 2-2 2-2-2 2-2Z"/><path id="preview-node-b" d="M15 12l2 2-2 2-2-2 2-2Z"/></g>
    <g data-layer="event" data-primitive="return"><path id="preview-event" d="M18 8h2v4h-4"/></g>`,
    'gate-decision': `
    <g data-layer="base" data-primitive="trace"><path id="preview-trace" d="M4 12h8"/></g>
    <g data-layer="structure" data-primitive="gate"><path id="preview-gate" d="M12 5v5M12 14v5"/><path id="preview-branch-b" d="M12 12h2l4 5h2"/></g>
    <g data-layer="event" data-primitive="branch"><path id="preview-event" d="M14 12l4-5h2"/></g>`
  };
  return previews[directionId];
}

function selectedIconBody(name) {
  const map = {
    'strategy-idea': `
    <g data-layer="base" data-primitive="trace"><path id="strategy-trace" d="M4 12h4"/></g>
    <g data-layer="structure" data-primitive="node"><path id="strategy-node" d="M10 9l3 3-3 3-3-3 3-3Z"/><path id="strategy-link" d="M13 12h3"/></g>
    <g data-layer="event" data-primitive="gate"><path id="strategy-gate" d="M17 6v4M17 14v4M17 10h3v4h-3"/></g>`,
    'data-snapshot': `
    <g data-layer="base" data-primitive="trace"><path id="snapshot-trace" d="M4 12h16"/></g>
    <g data-layer="structure" data-primitive="node"><path id="snapshot-node-a" d="M9 10l2 2-2 2-2-2 2-2Z"/><path id="snapshot-node-b" d="M15 10l2 2-2 2-2-2 2-2Z"/></g>
    <g data-layer="event" data-primitive="gate"><path id="snapshot-window" d="M6 7v10M18 7v10"/></g>`,
    backtest: `
    <g data-layer="base" data-primitive="return"><path id="backtest-return" d="M19 8h-8l-4 4 4 4h7"/></g>
    <g data-layer="structure" data-primitive="trace"><path id="backtest-reentry" d="M12 12H7V7h4"/><path id="backtest-node" d="M15 14l2 2-2 2-2-2 2-2Z"/></g>
    <g data-layer="event" data-primitive="gate"><path id="backtest-gate" d="M5 5v5M5 14v5"/></g>`,
    'metric-report': `
    <g data-layer="base" data-primitive="trace"><path id="metric-trace" d="M4 12h16"/></g>
    <g data-layer="structure" data-primitive="node"><path id="metric-tick-a" d="M8 9v6"/><path id="metric-tick-b" d="M12 10v4"/><path id="metric-tick-c" d="M16 8v8"/></g>
    <g data-layer="event" data-primitive="gate"><path id="metric-threshold" d="M18 6v12"/></g>`,
    'risk-review': `
    <g data-layer="base" data-primitive="trace"><path id="risk-trace" d="M4 12h8"/></g>
    <g data-layer="structure" data-primitive="gate"><path id="risk-gate-a" d="M14 5v5M14 14v5"/><path id="risk-gate-b" d="M18 8v8"/></g>
    <g data-layer="event" data-primitive="node"><path id="risk-held" d="M11 10l2 2-2 2-2-2 2-2Z"/></g>`,
    'operator-decision': `
    <g data-layer="base" data-primitive="trace"><path id="decision-trace" d="M4 12h8"/></g>
    <g data-layer="structure" data-primitive="gate"><path id="decision-gate" d="M12 5v5M12 14v5"/><path id="decision-branch-b" d="M12 12h2l4 5h2"/></g>
    <g data-layer="event" data-primitive="branch"><path id="decision-selected" d="M14 12l4-5h2"/></g>`,
    'outcome-logged': `
    <g data-layer="base" data-primitive="branch"><path id="outcome-trace" d="M4 12h7l4-4h2"/></g>
    <g data-layer="structure" data-primitive="node"><path id="outcome-node" d="M18 6l3 2-3 2-3-2 3-2Z"/><path id="outcome-link" d="M18 10v5"/></g>
    <g data-layer="event" data-primitive="frame-corner"><path id="outcome-register" d="M15 18h5v-5"/></g>`,
    'learning-event': `
    <g data-layer="base" data-primitive="return"><path id="learning-return" d="M7 6h9l3 3v6h-7l-4 4-3-3"/></g>
    <g data-layer="structure" data-primitive="node"><path id="learning-node" d="M12 9l3 3-3 3-3-3 3-3Z"/></g>
    <g data-layer="event" data-primitive="gate"><path id="learning-reentry" d="M5 14V7h5"/></g>`
  };
  return map[name];
}

function renderSvg(body, directionId, kind) {
  if (!body) throw new Error(`traderframe-icon-body-missing:${directionId}:${kind}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" data-direction="${directionId}" data-kind="${kind}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">${body}\n</svg>`;
}

export function renderTraderFrameDirectionPreview(directionId) {
  return renderSvg(directionPreviewBody(directionId), directionId, 'direction-preview');
}

export function renderTraderFrameSelectedIcon(name) {
  return renderSvg(selectedIconBody(name), 'gate-decision', 'calibration-icon');
}

export function createSelectedTraderFrameIconDna(baseDna, exploration) {
  const selected = exploration.selectedDirection;
  if (!exploration.pass || !selected) throw new Error('traderframe-icon-direction-selection-blocked');
  return {
    schema: 'ai-studio-os/icon-dna@1',
    id: 'traderframe-gate-decision-icons-v1-candidate',
    status: 'selected-candidate-not-frozen',
    projectId: 'traderframe',
    inherits: { id: baseDna.id, status: baseDna.status },
    selectedDirectionId: selected.id,
    premise: selected.premise,
    canvas: structuredClone(baseDna.canvas),
    safeArea: structuredClone(baseDna.safeArea),
    grid: structuredClone(baseDna.grid),
    stroke: structuredClone(baseDna.stroke),
    geometry: {
      ...structuredClone(baseDna.geometry),
      proprietaryPrimitives: [...selected.primitives],
      primitiveRule: 'A production icon must be decomposable into the selected primitive vocabulary; new primitives require a new calibration decision.',
      containerRule: 'Do not use generic enclosing boxes as a default semantic shortcut.',
      categoryRule: 'Trading-category symbols such as candlesticks, generic charts, shields, gauges, documents, and lightbulbs are rejected unless materially transformed into the selected system grammar.'
    },
    layers: structuredClone(baseDna.layers),
    color: structuredClone(baseDna.color),
    targetSizes: [...TARGET_SIZES],
    semanticMap: structuredClone(SEMANTIC_MAP),
    freezeGate: [
      'All eight calibration icons survive independent vector review.',
      '16/20/24/32 render evidence shows no collapsed semantic detail.',
      'The family remains recognizable without Terminal Red.',
      'No icon falls back to a forbidden category-default metaphor.',
      'User explicitly approves the visual family.'
    ]
  };
}

function collectPrimitives(markup) {
  return [...markup.matchAll(/data-primitive="([^"]+)"/g)].map((match) => match[1]);
}

export function reviewTraderFrameCreativeFamily(markups, dna, exploration, { renderEvidenceCaptured = false } = {}) {
  const findings = [];
  const selectedPrimitives = new Set(dna.geometry?.proprietaryPrimitives ?? []);
  if (dna.status !== 'selected-candidate-not-frozen') findings.push({ severity: 'blocker', code: 'traderframe-selected-icon-dna-status-invalid', message: `Expected selected-candidate-not-frozen, received '${dna.status}'.` });
  if (exploration.selectedDirectionId !== 'gate-decision') findings.push({ severity: 'blocker', code: 'traderframe-icon-direction-unexpected', message: `Expected evidence-selected gate-decision direction, received '${exploration.selectedDirectionId}'.` });

  const primitiveUsage = {};
  for (const [name, markup] of Object.entries(markups)) {
    const inspection = inspectSvgMarkup(markup, { requireFontFree: true, vectorOnly: true });
    findings.push(...inspection.findings.map((item) => ({ ...item, icon: name })));
    if (!markup.includes('data-direction="gate-decision"')) findings.push({ severity: 'blocker', code: 'traderframe-icon-direction-drift', message: `${name} is not built from the selected direction.`, icon: name });
    if (!markup.includes('viewBox="0 0 24 24"')) findings.push({ severity: 'blocker', code: 'traderframe-icon-viewbox-drift', message: `${name} is not 24×24.`, icon: name });
    if (!markup.includes('stroke-width="1.5"') || !markup.includes('stroke-linecap="square"') || !markup.includes('stroke-linejoin="miter"')) findings.push({ severity: 'blocker', code: 'traderframe-icon-stroke-drift', message: `${name} breaks the shared mechanical grammar.`, icon: name });
    if ((markup.match(/data-layer="event"/g) ?? []).length !== 1) findings.push({ severity: 'blocker', code: 'traderframe-icon-event-layer-invalid', message: `${name} must contain exactly one semantic event layer.`, icon: name });
    if (/#[0-9a-fA-F]{3,8}/.test(markup)) findings.push({ severity: 'blocker', code: 'traderframe-icon-hardcoded-color', message: `${name} hard-codes a palette color.`, icon: name });
    if (!markup.includes('currentColor')) findings.push({ severity: 'blocker', code: 'traderframe-icon-currentcolor-missing', message: `${name} must remain a currentColor master.`, icon: name });
    const used = collectPrimitives(markup);
    primitiveUsage[name] = used;
    for (const primitive of used) {
      if (!selectedPrimitives.has(primitive)) findings.push({ severity: 'blocker', code: 'traderframe-icon-primitive-drift', message: `${name} introduces uncalibrated primitive '${primitive}'.`, icon: name, primitive });
    }
    const semantic = SEMANTIC_MAP[name];
    const markupText = normalize(markup);
    for (const forbidden of semantic?.forbiddenDefaults ?? []) {
      if (markupText.includes(normalize(forbidden))) findings.push({ severity: 'blocker', code: 'traderframe-icon-generic-metaphor-leak', message: `${name} leaks forbidden category-default metaphor '${forbidden}'.`, icon: name });
    }
  }

  const blockers = findings.filter((item) => normalize(item.severity) === 'blocker');
  return {
    stage: 'traderframe-icon-creative-family-review',
    status: blockers.length ? 'blocked' : 'review',
    pass: blockers.length === 0,
    approval: 'independent-vector-and-user-visual-review-required',
    selectedDirectionId: exploration.selectedDirectionId,
    iconDnaStatus: dna.status,
    iconCount: Object.keys(markups).length,
    targetSizes: [...TARGET_SIZES],
    renderEvidence: { status: renderEvidenceCaptured ? 'captured' : 'pending', sizes: [...TARGET_SIZES] },
    primitiveUsage,
    findings
  };
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function buildTraderFrameRenderEvidenceHtml(markups) {
  const rows = TARGET_SIZES.map((size) => {
    const icons = ICONS.map(([id, title]) => `<figure><div class="icon" style="--icon-size:${size}px">${markups[id]}</div><figcaption>${escapeHtml(title)}</figcaption></figure>`).join('');
    const accented = ICONS.map(([id, title]) => `<figure><div class="icon accented" style="--icon-size:${size}px">${markups[id]}</div><figcaption>${escapeHtml(title)}</figcaption></figure>`).join('');
    return `<section data-size="${size}"><h2>${size}px · monochrome</h2><div class="grid">${icons}</div><h2>${size}px · event accent</h2><div class="grid">${accented}</div></section>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>TraderFrame icon render evidence</title><style>
  *{box-sizing:border-box}body{margin:0;padding:28px;background:#12100F;color:#F0EAE0;font:12px/1.3 Arial,sans-serif}section{margin:0 0 34px}h1{font-size:18px;margin:0 0 24px}h2{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#9a9995;margin:18px 0 10px}.grid{display:grid;grid-template-columns:repeat(8,minmax(92px,1fr));gap:8px}figure{margin:0;min-height:88px;border:1px solid #272A26;display:grid;place-items:center;padding:10px 6px;background:#171513}.icon{width:var(--icon-size);height:var(--icon-size);color:#F0EAE0}.icon svg{display:block;width:100%;height:100%}.icon.accented [data-layer="event"]{color:#E54832}figcaption{margin-top:8px;color:#8c8b87;text-align:center;font-size:10px}
  </style></head><body><h1>TraderFrame · Gate + Decision · calibration evidence</h1>${rows}</body></html>`;
}

async function writeDocumentArtifact(adapter, { id, title, outputPath, content, format = 'json', dependencies = [], metadata = {} }) {
  return executeProductionJob({
    job: {
      id,
      version: '1',
      kind: format === 'json' ? 'creative-decision-document' : 'render-evidence-index',
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

async function captureRenderEvidence({ targetRoot, markups, iconRefs }) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const artifacts = [];
  try {
    for (const size of TARGET_SIZES) {
      const page = await browser.newPage({ viewport: { width: 1180, height: 250 }, deviceScaleFactor: 1 });
      const icons = ICONS.map(([id, title]) => `<figure><div class="icon">${markups[id]}</div><figcaption>${escapeHtml(title)}</figcaption></figure>`).join('');
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#12100F;color:#F0EAE0;font:11px Arial,sans-serif}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}figure{margin:0;height:150px;border:1px solid #272A26;display:grid;place-items:center;padding:12px}.icon{width:${size}px;height:${size}px;color:#F0EAE0}.icon svg{width:100%;height:100%;display:block}.icon [data-layer="event"]{color:#E54832}figcaption{margin-top:12px;color:#8c8b87;text-align:center;font-size:10px}</style></head><body><div class="grid">${icons}</div></body></html>`);
      const target = path.join(targetRoot, 'render-evidence', `family-${size}px.png`);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await page.screenshot({ path: target, fullPage: true });
      await page.close();
      const buffer = await fs.readFile(target);
      artifacts.push(createArtifact({
        id: `traderframe-icon-render-${size}px-v1`,
        version: '1',
        kind: 'icon-render-evidence',
        format: 'png',
        title: `TraderFrame icon family ${size}px render evidence`,
        projectId: 'traderframe',
        status: 'produced',
        reviewStatus: 'unreviewed',
        releaseStatus: 'unmeasured',
        dependencies: iconRefs.map((artifactRef) => ({ artifactRef, relation: 'renders', required: true, impact: 'review' })),
        creator: { type: 'browser-capture', adapterId: 'playwright-chromium', provider: 'local-browser' },
        provenance: { provider: 'local-browser', operation: 'chromium-screenshot', engine: 'playwright' },
        rights: { status: 'project-generated' },
        files: [{ ref: target, role: 'evidence', format: 'png', hash: crypto.createHash('sha256').update(buffer).digest('hex'), bytes: buffer.byteLength }],
        metadata: { targetSize: size, deviceScaleFactor: 1, eventAccentPreview: '#E54832', canonicalSvgColorMode: 'currentColor' }
      }));
    }
  } finally {
    await browser.close();
  }
  return artifacts;
}

export async function runTraderFrameIconCreativeLoop({ repoRoot, outputDir, captureBrowserEvidence = false } = {}) {
  const root = path.resolve(repoRoot || process.cwd());
  const targetRoot = path.resolve(outputDir || path.join(root, 'artifacts/traderframe/icon-creative-loop-v1'));
  const baseDna = JSON.parse(await fs.readFile(path.join(root, 'assets/traderframe/icons/core-v1/icon-dna.json'), 'utf8'));
  const exploration = exploreTraderFrameIconDirections();
  if (!exploration.pass) {
    return { stage: 'traderframe-icon-creative-loop', status: 'blocked', pass: false, exploration, findings: exploration.findings };
  }
  const selectedDna = createSelectedTraderFrameIconDna(baseDna, exploration);
  const documentAdapter = createLocalDocumentAdapter({ rootDir: targetRoot });
  const svgAdapter = createLocalSvgAdapter({ rootDir: targetRoot });

  const semanticExecution = await writeDocumentArtifact(documentAdapter, {
    id: 'traderframe-icon-semantic-map-v1',
    title: 'TraderFrame Icon Semantic Map',
    outputPath: 'semantic-map.json',
    content: { schema: 'ai-studio-os/icon-semantic-map@1', projectId: 'traderframe', icons: SEMANTIC_MAP },
    metadata: { antiGenericDefaultsExplicit: true }
  });
  const directionsExecution = await writeDocumentArtifact(documentAdapter, {
    id: 'traderframe-icon-directions-v1',
    title: 'TraderFrame Icon Direction Exploration',
    outputPath: 'directions.json',
    content: { schema: 'ai-studio-os/icon-directions@1', directions: exploration.directions, diversity: exploration.diversity },
    dependencies: [{ artifactRef: semanticExecution.artifact.ref, relation: 'interprets', required: true, impact: 'review' }],
    metadata: { directionCount: exploration.directions.length }
  });
  const selectionExecution = await writeDocumentArtifact(documentAdapter, {
    id: 'traderframe-icon-selection-review-v1',
    title: 'TraderFrame Icon Direction Selection Review',
    outputPath: 'selection-review.json',
    content: exploration,
    dependencies: [{ artifactRef: directionsExecution.artifact.ref, relation: 'reviews', required: true, impact: 'stale' }],
    metadata: { selectedDirectionId: exploration.selectedDirectionId, approval: exploration.approval }
  });
  const dnaExecution = await writeDocumentArtifact(documentAdapter, {
    id: 'traderframe-selected-icon-dna-v1',
    title: 'TraderFrame Selected Icon DNA Candidate',
    outputPath: 'selected-icon-dna.json',
    content: selectedDna,
    dependencies: [{ artifactRef: selectionExecution.artifact.ref, relation: 'selected-by', required: true, impact: 'stale' }],
    metadata: { frozen: false, selectedDirectionId: exploration.selectedDirectionId }
  });

  const previewJobs = DIRECTIONS.map((direction) => ({
    id: `traderframe-direction-${direction.id}-preview-v1`,
    version: '1',
    kind: 'icon-direction-preview',
    title: `${direction.name} direction preview`,
    projectId: 'traderframe',
    operation: 'generate',
    recipe: 'icon-system-recipe',
    requiredCapabilities: ['svg', 'vector', 'icon-master'],
    dependencies: [{ artifactRef: directionsExecution.artifact.ref, relation: 'visualizes-direction', required: true, impact: 'review' }],
    rights: { status: 'project-generated', legalReview: 'unresolved' },
    input: { svg: renderTraderFrameDirectionPreview(direction.id), outputPath: `direction-previews/${direction.id}.svg`, requireFontFree: true, vectorOnly: true },
    metadata: { directionId: direction.id, conceptPreview: true, canonicalApproval: false, creativeApproval: false }
  }));
  const previewAssignments = previewJobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-svg' }));
  const previewBatch = await executeProductionBatch({ jobs: previewJobs, assignments: previewAssignments, adapters: [svgAdapter] });

  const markups = Object.fromEntries(ICONS.map(([name]) => [name, renderTraderFrameSelectedIcon(name)]));
  const iconJobs = ICONS.map(([name, title, semantic]) => ({
    id: `traderframe-${name}-creative-v1`,
    version: '1',
    kind: 'icon-master',
    title,
    projectId: 'traderframe',
    operation: 'generate',
    recipe: 'icon-system-recipe',
    requiredCapabilities: ['svg', 'vector', 'icon-master'],
    dependencies: [{ artifactRef: dnaExecution.artifact.ref, relation: 'inherits-icon-dna', required: true, impact: 'stale' }],
    rights: { status: 'project-generated', legalReview: 'unresolved' },
    input: { svg: markups[name], outputPath: `icons/${name}.svg`, requireFontFree: true, vectorOnly: true },
    metadata: {
      semantic,
      semanticDecomposition: SEMANTIC_MAP[name].selectedDecomposition,
      selectedDirectionId: exploration.selectedDirectionId,
      iconDnaId: selectedDna.id,
      iconDnaStatus: selectedDna.status,
      canonicalApproval: false,
      creativeApproval: false,
      productionProof: 'traderframe-icon-creative-loop-v1'
    }
  }));
  const iconAssignments = iconJobs.map((job) => ({ assetId: job.id, action: 'route', adapterId: 'local-svg' }));
  const iconBatch = await executeProductionBatch({ jobs: iconJobs, assignments: iconAssignments, adapters: [svgAdapter] });
  const iconRefs = iconBatch.artifacts.map((artifact) => artifact.ref);

  const htmlExecution = await writeDocumentArtifact(documentAdapter, {
    id: 'traderframe-icon-render-index-v1',
    title: 'TraderFrame Icon Render Evidence Index',
    outputPath: 'render-evidence/index.html',
    content: buildTraderFrameRenderEvidenceHtml(markups),
    format: 'text',
    dependencies: iconRefs.map((artifactRef) => ({ artifactRef, relation: 'renders', required: true, impact: 'review' })),
    metadata: { targetSizes: TARGET_SIZES, browserCaptureRequiredForPixelEvidence: true }
  });

  let renderArtifacts = [];
  if (captureBrowserEvidence) renderArtifacts = await captureRenderEvidence({ targetRoot, markups, iconRefs });
  const familyReview = reviewTraderFrameCreativeFamily(markups, selectedDna, exploration, { renderEvidenceCaptured: renderArtifacts.length === TARGET_SIZES.length });
  const reviewExecution = await writeDocumentArtifact(documentAdapter, {
    id: 'traderframe-icon-creative-family-review-v1',
    title: 'TraderFrame Icon Creative Family Review',
    outputPath: 'family-review.json',
    content: familyReview,
    dependencies: [
      { artifactRef: selectionExecution.artifact.ref, relation: 'reviews-selection', required: true, impact: 'review' },
      ...iconRefs.map((artifactRef) => ({ artifactRef, relation: 'reviews-icon', required: true, impact: 'review' }))
    ],
    metadata: { independentReviewRequired: true, userVisualApprovalRequired: true }
  });

  const manifest = {
    schema: 'ai-studio-os/traderframe-icon-creative-loop@1',
    projectId: 'traderframe',
    sourceProduct: 'GateZero research-only decision loop',
    status: previewBatch.pass && iconBatch.pass && familyReview.pass ? (renderArtifacts.length ? 'produced-awaiting-independent-review' : 'produced-awaiting-render-and-independent-review') : 'blocked',
    frozen: false,
    selectedDirection: { id: exploration.selectedDirectionId, score: exploration.reviews.find((item) => item.directionId === exploration.selectedDirectionId)?.total ?? null },
    rejectedDirections: exploration.rejected,
    iconDna: { id: selectedDna.id, status: selectedDna.status, source: 'selected-icon-dna.json' },
    calibrationCount: ICONS.length,
    directionPreviews: DIRECTIONS.map((direction) => ({ id: direction.id, file: `direction-previews/${direction.id}.svg` })),
    icons: ICONS.map(([name, title, semantic]) => ({ id: name, title, semantic, artifactId: `traderframe-${name}-creative-v1`, file: `icons/${name}.svg` })),
    renderEvidence: { status: renderArtifacts.length ? 'captured' : 'pending', sizes: TARGET_SIZES, index: 'render-evidence/index.html', files: renderArtifacts.map((artifact) => artifact.files[0]?.ref).filter(Boolean) },
    review: { status: familyReview.status, approval: familyReview.approval, findings: familyReview.findings },
    truth: {
      brokerIntegration: false,
      autonomousExecution: false,
      performanceClaims: false,
      note: 'This creative loop produces identity/UI vector candidates only. It does not alter GateZero trading scope.'
    },
    limitations: [
      'Direction generation and critique are deterministic in v1; no external reasoning model is invoked.',
      'Selected family remains a candidate until independent vector review and explicit user visual approval.',
      'Browser render capture is evidence for small-size inspection, not automatic creative approval.'
    ]
  };
  const manifestExecution = await writeDocumentArtifact(documentAdapter, {
    id: 'traderframe-icon-creative-loop-manifest-v1',
    title: 'TraderFrame Icon Creative Loop Manifest',
    outputPath: 'manifest.json',
    content: manifest,
    dependencies: [
      { artifactRef: reviewExecution.artifact.ref, relation: 'packages-review-state', required: true, impact: 'stale' },
      { artifactRef: dnaExecution.artifact.ref, relation: 'packages-icon-dna', required: true, impact: 'stale' },
      ...iconRefs.map((artifactRef) => ({ artifactRef, relation: 'packages-icon', required: true, impact: 'stale' }))
    ],
    metadata: { frozen: false, selectedDirectionId: exploration.selectedDirectionId }
  });

  const artifacts = [
    semanticExecution.artifact,
    directionsExecution.artifact,
    selectionExecution.artifact,
    dnaExecution.artifact,
    ...previewBatch.artifacts,
    ...iconBatch.artifacts,
    htmlExecution.artifact,
    ...renderArtifacts,
    reviewExecution.artifact,
    manifestExecution.artifact
  ];
  const graph = buildArtifactGraph(artifacts);
  const executionsPass = [semanticExecution, directionsExecution, selectionExecution, dnaExecution, htmlExecution, reviewExecution, manifestExecution].every((item) => item.pass);
  const pass = exploration.pass && previewBatch.pass && iconBatch.pass && familyReview.pass && executionsPass && graph.pass;

  return {
    stage: 'traderframe-icon-creative-loop',
    status: pass ? manifest.status : 'blocked',
    pass,
    outputDir: targetRoot,
    semanticMap: structuredClone(SEMANTIC_MAP),
    exploration,
    selectedDna,
    previewBatch,
    iconBatch,
    familyReview,
    renderArtifacts,
    manifest,
    artifacts,
    graph,
    counts: {
      directions: DIRECTIONS.length,
      directionPreviews: previewBatch.artifacts.length,
      icons: ICONS.length,
      renderCaptures: renderArtifacts.length,
      files: artifacts.reduce((sum, artifact) => sum + (artifact.files?.length ?? 0), 0)
    }
  };
}

export { DIRECTIONS as traderFrameIconDirections, ICONS as traderFrameCreativeLoopIcons, SEMANTIC_MAP as traderFrameIconSemanticMap, TARGET_SIZES as traderFrameIconTargetSizes };
