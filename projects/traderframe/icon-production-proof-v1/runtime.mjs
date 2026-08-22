import fs from 'node:fs/promises';
import path from 'node:path';
import { buildArtifactGraph } from '../../../modules/artifact-graph/runtime.mjs';
import { createLocalDocumentAdapter } from '../../../modules/production-adapters/local-document-adapter.mjs';
import { createLocalSvgAdapter, inspectSvgMarkup } from '../../../modules/production-adapters/local-svg-adapter.mjs';
import { executeProductionBatch, executeProductionJob } from '../../../modules/production-adapters/runtime.mjs';

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

function iconBody(name) {
  const map = {
    'strategy-idea': `
    <g data-layer="base"><path id="strategy-frame" d="M4 18V6h8"/></g>
    <g data-layer="structure"><path id="strategy-core" d="M12 8l4 4-4 4-4-4 4-4Z"/></g>
    <g data-layer="event"><path id="strategy-event" d="M16 6h4v4"/></g>`,
    'data-snapshot': `
    <g data-layer="base"><path id="data-frame" d="M4 4v16h16"/></g>
    <g data-layer="structure"><path id="data-row-a" d="M7 8h8"/><path id="data-row-b" d="M7 12h10"/><path id="data-row-c" d="M7 16h6"/></g>
    <g data-layer="event"><path id="data-event" d="M17 7h3v3"/></g>`,
    backtest: `
    <g data-layer="base"><path id="backtest-frame" d="M5 5h14v14H5Z"/></g>
    <g data-layer="structure"><path id="backtest-path" d="M8 15l3-3 2 2 4-5"/><path id="backtest-axis" d="M8 8h4"/></g>
    <g data-layer="event"><path id="backtest-event" d="M8 8H5V5"/></g>`,
    'metric-report': `
    <g data-layer="base"><path id="metric-axis" d="M5 5v14h14"/></g>
    <g data-layer="structure"><path id="metric-bar-a" d="M8 16v-4"/><path id="metric-bar-b" d="M12 16V9"/><path id="metric-bar-c" d="M16 16V7"/></g>
    <g data-layer="event"><path id="metric-event" d="M7 8h12"/></g>`,
    'risk-review': `
    <g data-layer="base"><path id="risk-shell" d="M12 3l7 3v5c0 4.5-2.7 7.5-7 10-4.3-2.5-7-5.5-7-10V6l7-3Z"/></g>
    <g data-layer="structure"><path id="risk-band" d="M8 12h8"/></g>
    <g data-layer="event"><path id="risk-event" d="M12 8v8"/></g>`,
    'operator-decision': `
    <g data-layer="base"><path id="decision-spine" d="M5 5v14"/></g>
    <g data-layer="structure"><path id="decision-branch-a" d="M5 9h6l4-4h4"/><path id="decision-branch-b" d="M5 15h6l4 4h4"/></g>
    <g data-layer="event"><path id="decision-event" d="M15 5h4v4"/></g>`,
    'outcome-logged': `
    <g data-layer="base"><path id="outcome-frame" d="M5 4v16h14"/></g>
    <g data-layer="structure"><path id="outcome-row-a" d="M8 8h7"/><path id="outcome-row-b" d="M8 12h9"/><path id="outcome-row-c" d="M8 16h5"/></g>
    <g data-layer="event"><path id="outcome-event" d="M17 15h3v3h-3Z"/></g>`,
    'learning-event': `
    <g data-layer="base"><path id="learning-loop" d="M7 7h8l3 3v6h-8l-4-4V8"/></g>
    <g data-layer="structure"><path id="learning-core" d="M12 9l3 3-3 3-3-3 3-3Z"/></g>
    <g data-layer="event"><path id="learning-event" d="M15 6h4v4"/></g>`
  };
  return map[name];
}

function renderIcon(name) {
  const body = iconBody(name);
  if (!body) throw new Error(`unknown-traderframe-icon:${name}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">${body}
</svg>`;
}

function reviewIconFamily(markups, dna) {
  const findings = [];
  if (dna.status !== 'review-candidate') findings.push({ severity:'blocker', code:'traderframe-icon-dna-status-unexpected', message:`Expected review-candidate Icon DNA, received '${dna.status}'.` });
  if (JSON.stringify(dna.canvas?.viewBox) !== JSON.stringify([0,0,24,24])) findings.push({ severity:'blocker', code:'traderframe-icon-viewbox-drift', message:'TraderFrame calibration requires a 24×24 viewBox.' });
  if (dna.stroke?.width !== 1.5 || dna.stroke?.cap !== 'square' || dna.stroke?.join !== 'miter') findings.push({ severity:'blocker', code:'traderframe-icon-stroke-drift', message:'TraderFrame stroke grammar must remain 1.5 / square / miter.' });

  for (const [name, markup] of Object.entries(markups)) {
    const inspection = inspectSvgMarkup(markup, { requireFontFree:true, vectorOnly:true });
    findings.push(...inspection.findings.map((item) => ({ ...item, icon:name })));
    if (!markup.includes('viewBox="0 0 24 24"')) findings.push({ severity:'blocker', code:'traderframe-icon-viewbox-missing', message:`${name} is not 24×24.`, icon:name });
    if (!markup.includes('stroke-width="1.5"') || !markup.includes('stroke-linecap="square"') || !markup.includes('stroke-linejoin="miter"')) findings.push({ severity:'blocker', code:'traderframe-icon-stroke-missing', message:`${name} does not inherit the frozen calibration stroke grammar.`, icon:name });
    if ((markup.match(/data-layer="event"/g) ?? []).length !== 1) findings.push({ severity:'blocker', code:'traderframe-icon-event-layer-invalid', message:`${name} must contain exactly one semantic event layer.`, icon:name });
    if (/#[0-9a-fA-F]{3,8}/.test(markup)) findings.push({ severity:'blocker', code:'traderframe-icon-hardcoded-color', message:`${name} hard-codes a palette color instead of currentColor.`, icon:name });
    if (!markup.includes('currentColor')) findings.push({ severity:'blocker', code:'traderframe-icon-currentcolor-missing', message:`${name} must remain a monochrome currentColor master.`, icon:name });
  }

  const blockers = findings.filter((item) => String(item.severity).toLowerCase() === 'blocker');
  return {
    stage:'traderframe-icon-family-review',
    status:blockers.length ? 'blocked' : 'review',
    pass:blockers.length === 0,
    approval:'independent-vector-and-user-visual-review-required',
    iconDnaStatus:dna.status,
    iconCount:Object.keys(markups).length,
    findings
  };
}

export async function runTraderFrameIconProductionProof({ repoRoot, outputDir } = {}) {
  const root = path.resolve(repoRoot || process.cwd());
  const targetRoot = path.resolve(outputDir || path.join(root, 'artifacts/traderframe/icon-production-proof-v1'));
  const dnaPath = path.join(root, 'assets/traderframe/icons/core-v1/icon-dna.json');
  const dna = JSON.parse(await fs.readFile(dnaPath, 'utf8'));
  const markups = Object.fromEntries(ICONS.map(([name]) => [name, renderIcon(name)]));
  const familyReview = reviewIconFamily(markups, dna);

  const svgAdapter = createLocalSvgAdapter({ rootDir:targetRoot });
  const jobs = ICONS.map(([name, title, semantic]) => ({
    id:`traderframe-${name}-v1`,
    version:'1',
    kind:'icon-master',
    title,
    projectId:'traderframe',
    operation:'generate',
    recipe:'icon-system-recipe',
    requiredCapabilities:['svg','vector','icon-master'],
    rights:{ status:'project-generated', legalReview:'unresolved' },
    input:{ svg:markups[name], outputPath:`icons/${name}.svg`, requireFontFree:true, vectorOnly:true },
    metadata:{
      semantic,
      iconDnaId:dna.id,
      iconDnaStatus:dna.status,
      canonicalApproval:false,
      creativeApproval:false,
      productionProof:'traderframe-icon-system-v1'
    }
  }));
  const assignments = jobs.map((job) => ({ assetId:job.id, action:'route', adapterId:'local-svg' }));
  const batch = await executeProductionBatch({ jobs, assignments, adapters:[svgAdapter] });

  const manifest = {
    schema:'ai-studio-os/traderframe-icon-production-proof@1',
    projectId:'traderframe',
    sourceProduct:'GateZero research-only decision loop',
    iconDna:{ id:dna.id, status:dna.status, source:'assets/traderframe/icons/core-v1/icon-dna.json' },
    status:batch.pass && familyReview.pass ? 'produced-awaiting-review' : 'blocked',
    frozen:false,
    iconCount:ICONS.length,
    icons:ICONS.map(([name, title, semantic]) => ({
      id:name,
      title,
      semantic,
      artifactId:`traderframe-${name}-v1`,
      file:`icons/${name}.svg`
    })),
    review:{ status:familyReview.status, approval:familyReview.approval, findings:familyReview.findings },
    truth:{
      brokerIntegration:false,
      autonomousExecution:false,
      performanceClaims:false,
      note:'This proof creates identity/UI vector assets only. It does not alter GateZero trading scope.'
    }
  };

  const documentAdapter = createLocalDocumentAdapter({ rootDir:targetRoot });
  const manifestExecution = await executeProductionJob({
    job:{ id:'traderframe-icon-manifest-v1', version:'1', kind:'icon-system-manifest', title:'TraderFrame Icon Production Proof Manifest', projectId:'traderframe', operation:'write-document', format:'json', requiredCapabilities:['json'], recipe:'icon-system-recipe', input:{ format:'json', outputPath:'manifest.json', content:manifest }, metadata:{ frozen:false, iconDnaStatus:dna.status } },
    adapter:documentAdapter
  });
  const reviewExecution = await executeProductionJob({
    job:{ id:'traderframe-icon-review-v1', version:'1', kind:'icon-system-review', title:'TraderFrame Icon Calibration Review', projectId:'traderframe', operation:'write-document', format:'json', requiredCapabilities:['json'], recipe:'icon-system-recipe', input:{ format:'json', outputPath:'calibration-review.json', content:familyReview }, metadata:{ independentReviewRequired:true } },
    adapter:documentAdapter
  });

  const artifacts = [...batch.artifacts, manifestExecution.artifact, reviewExecution.artifact];
  const graph = buildArtifactGraph(artifacts);
  const pass = batch.pass && familyReview.pass && manifestExecution.pass && reviewExecution.pass && graph.pass;

  return {
    stage:'traderframe-icon-production-proof',
    status:pass ? 'produced-awaiting-review' : 'blocked',
    pass,
    outputDir:targetRoot,
    iconDna:dna,
    familyReview,
    batch,
    manifest,
    artifacts,
    graph,
    counts:{ icons:ICONS.length, files:artifacts.reduce((sum, artifact) => sum + (artifact.files?.length ?? 0), 0) }
  };
}

export { ICONS as traderFrameDecisionLoopIcons, renderIcon as renderTraderFrameDecisionLoopIcon, reviewIconFamily as reviewTraderFrameIconFamily };
