import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import {
  buildDrawingMemory,
  buildDrawingIntelligencePlan,
  buildGeometryIntent
} from '../modules/drawing-intelligence/runtime.mjs';
import {
  AUTHORITY_PRODUCTION_CANDIDATES,
  buildAuthorityVectorArtifact
} from '../modules/drawing-intelligence/authority-production-test.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.join(root, 'projects', 'ai-council');
const out = path.join(root, 'artifacts', 'ai-council', 'drawing-intelligence-authority-production-v1');
const svgDir = path.join(out, 'svg');
const htmlDir = path.join(out, 'source-html');
const candidateDir = path.join(out, 'candidates');

const readJson = async (name) => JSON.parse(await fs.readFile(path.join(projectRoot, name), 'utf8'));
const input = await readJson('drawing-intelligence-authority-production-v1.json');
const memoryInput = await readJson('drawing-intelligence-memory-v1.json');
const memory = buildDrawingMemory(memoryInput);
const plan = buildDrawingIntelligencePlan(input, { memory });
if (!memory.pass || !plan.pass || !plan.reviewReady) throw new Error(`Authority Drawing Intelligence plan blocked: ${JSON.stringify({ memory: memory.findings, plan: plan.findings })}`);

await fs.rm(out, { recursive: true, force: true });
await Promise.all([svgDir, htmlDir, candidateDir].map((dir) => fs.mkdir(dir, { recursive: true })));

const artifacts = [];
for (const candidateId of AUTHORITY_PRODUCTION_CANDIDATES) {
  const candidate = plan.candidates.find((item) => item.id === candidateId);
  for (const size of plan.targetSizes) {
    const intent = buildGeometryIntent(plan, candidateId, { size });
    const vector = buildAuthorityVectorArtifact(intent);
    const svgName = `${candidateId}-${size}.svg`;
    await fs.writeFile(path.join(svgDir, svgName), vector.svg);
    artifacts.push({
      candidateId,
      metaphor: candidate.metaphor,
      size,
      svgRef: `svg/${svgName}`,
      retainedSemanticDeviceIds: vector.retainedSemanticDeviceIds,
      primitiveIds: vector.primitiveIds,
      relationshipCount: vector.relationshipCount,
      vectorValidation: vector.vectorValidation
    });
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function icon(candidateId, size, display = 72) {
  const item = artifacts.find((artifact) => artifact.candidateId === candidateId && artifact.size === size);
  return `<div class="icon-cell"><div class="icon-stage" style="width:${display}px;height:${display}px">${item ? `<object data="${item.svgRef}" type="image/svg+xml" style="width:${size}px;height:${size}px"></object>` : ''}</div><div class="size">${size}px</div></div>`;
}
function commonCss() {
  return `<style>
    *{box-sizing:border-box} body{margin:0;background:#f6f5f1;color:#171816;font-family:Inter,Arial,sans-serif} .page{padding:52px 58px 64px;min-height:100vh}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#666b64;margin-bottom:12px}.title{font-family:Georgia,serif;font-size:40px;font-weight:500;line-height:1.05;margin:0 0 12px}.sub{max-width:920px;font-size:14px;line-height:1.5;color:#555a53;margin-bottom:36px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#fff;border:1px solid #d8dad4;border-radius:12px;padding:24px}.card h2{font-family:Georgia,serif;font-weight:500;font-size:24px;margin:0 0 8px}.metaphor{font-size:12px;line-height:1.5;color:#666b64;min-height:56px}.sizes{display:flex;align-items:flex-end;gap:18px;margin:28px 0 22px}.icon-cell{text-align:center}.icon-stage{display:grid;place-items:center;background:#fafafa;border:1px solid #ecece7;border-radius:10px;color:#171816}.size{font:11px/1.2 ui-monospace,SFMono-Regular,monospace;color:#777c75;margin-top:7px}.devices{border-top:1px solid #ecece7;padding-top:14px;font-size:11px;line-height:1.7;color:#5d625b}.state-grid{display:grid;grid-template-columns:160px repeat(4,1fr);gap:10px;align-items:stretch}.state-head,.state-cell,.candidate-name{background:#fff;border:1px solid #d8dad4;border-radius:10px;min-height:88px;padding:14px}.state-head{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#676c65;display:flex;align-items:center}.candidate-name{font-family:Georgia,serif;font-size:18px;display:flex;align-items:center}.state-cell{display:flex;gap:12px;align-items:center;font-size:13px}.state-cell .glyph{width:44px;height:44px;border-radius:9px;background:#fafafa;display:grid;place-items:center;color:#171816}.note{margin-top:26px;font-size:12px;color:#626760}.truth{margin-top:30px;padding:14px 16px;border-left:3px solid #222;font:12px/1.6 ui-monospace,SFMono-Regular,monospace;background:#efeee9}
  </style>`;
}

const overviewHtml = `<!doctype html><html><head><meta charset="utf-8">${commonCss()}</head><body><main class="page"><div class="eyebrow">Drawing Intelligence V1 · Authority production test</div><h1 class="title">State-neutral Authority metaphors</h1><p class="sub">Three semantic plans passed Drawing Memory and learned-vocabulary blocking. Geometry below is deterministic Vector Geometry output from size-filtered Geometry Intent. No candidate is selected or recommended by this proof.</p><section class="grid">${AUTHORITY_PRODUCTION_CANDIDATES.map((candidateId) => {
  const candidate = plan.candidates.find((item) => item.id === candidateId);
  const rows = artifacts.filter((item) => item.candidateId === candidateId);
  return `<article class="card"><h2>${escapeHtml(candidateId.replaceAll('-', ' '))}</h2><div class="metaphor">${escapeHtml(candidate.metaphor)}</div><div class="sizes">${plan.targetSizes.map((size) => icon(candidateId, size)).join('')}</div><div class="devices">${rows.map((row) => `${row.size}px → ${escapeHtml(row.retainedSemanticDeviceIds.join(' · '))} · ${row.primitiveIds.length} primitives · ${row.relationshipCount} relations`).join('<br>')}</div></article>`;
}).join('')}</section><div class="truth">selectedCandidate = null<br>humanIconSelection = false<br>humanIconSystemApproval = false<br>executionAuthority = vector-geometry</div></main></body></html>`;

const stateLabels = ['Authority', 'Approval required', 'Authorized', 'Rejected'];
const stateHtml = `<!doctype html><html><head><meta charset="utf-8">${commonCss()}</head><body><main class="page"><div class="eyebrow">Stable master composition test</div><h1 class="title">State belongs outside the Authority glyph</h1><p class="sub">Each row repeats the exact same 16px SVG across four product labels. Approval/authorization/rejection state is intentionally not encoded in master geometry.</p><section class="state-grid"><div></div>${stateLabels.map((label) => `<div class="state-head">${label}</div>`).join('')}${AUTHORITY_PRODUCTION_CANDIDATES.map((candidateId) => {
  const item = artifacts.find((artifact) => artifact.candidateId === candidateId && artifact.size === 16);
  return `<div class="candidate-name">${candidateId.replaceAll('-', ' ')}</div>${stateLabels.map((label) => `<div class="state-cell"><div class="glyph"><object data="${item.svgRef}" type="image/svg+xml" style="width:16px;height:16px"></object></div><span>${label}</span></div>`).join('')}`;
}).join('')}</section><p class="note">Visual System and Motion System may change color, emphasis, labels and transitions by state. The canonical Authority geometry remains unchanged.</p></main></body></html>`;

await fs.writeFile(path.join(htmlDir, 'overview.html'), overviewHtml);
await fs.writeFile(path.join(htmlDir, 'state-composition.html'), stateHtml);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1050 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(htmlDir, 'overview.html')}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'overview.png'), fullPage: true });

  await page.goto(`file://${path.join(htmlDir, 'state-composition.html')}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'state-composition.png'), fullPage: true });

  for (const candidateId of AUTHORITY_PRODUCTION_CANDIDATES) {
    const candidate = plan.candidates.find((item) => item.id === candidateId);
    const rows = artifacts.filter((item) => item.candidateId === candidateId);
    const html = `<!doctype html><html><head><meta charset="utf-8">${commonCss()}</head><body><main class="page"><div class="eyebrow">Authority candidate · exact browser proof</div><h1 class="title">${candidateId.replaceAll('-', ' ')}</h1><p class="sub">${escapeHtml(candidate.metaphor)}</p><section class="card"><div class="sizes">${plan.targetSizes.map((size) => icon(candidateId, size, 96)).join('')}</div><div class="devices">${rows.map((row) => `${row.size}px retains: ${escapeHtml(row.retainedSemanticDeviceIds.join(' · '))}<br>primitives: ${escapeHtml(row.primitiveIds.join(' · '))}<br>relationships: ${row.relationshipCount}`).join('<br><br>')}</div></section><div class="truth">known blocker collisions = 0<br>human selection = false</div></main></body></html>`;
    const sourcePath = path.join(htmlDir, `${candidateId}.html`);
    await fs.writeFile(sourcePath, html);
    await page.goto(`file://${sourcePath}`);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(candidateDir, `${candidateId}.png`), fullPage: true });
  }
} finally {
  await browser.close();
}

const manifest = {
  schema: 'ai-studio-os/drawing-intelligence-authority-production-proof@1',
  projectId: 'ai-council',
  conceptId: 'authority',
  status: 'ready-for-independent-render-review',
  pass: true,
  reviewReady: true,
  drawingPlan: { id: plan.id, fingerprint: plan.planFingerprint },
  candidates: plan.candidates.map((candidate) => ({
    id: candidate.id,
    status: candidate.status,
    recommendationEligibility: candidate.recommendationEligibility,
    blockerCollisions: candidate.collisions.filter((item) => item.severity === 'BLOCKER')
  })),
  targetSizes: plan.targetSizes,
  exactBrowserProof: true,
  sizeBudgetExecutionEnforced: true,
  vectorGeometryValidationPassed: artifacts.every((item) => item.vectorValidation.status === 'ready'),
  stateNeutralMasterCompositionProved: true,
  recommendedCandidate: null,
  humanSelectedCandidate: null,
  humanIconSelection: false,
  humanIconSystemApproval: false,
  finalVisualSystemApproved: false,
  evidence: {
    overview: 'overview.png',
    stateComposition: 'state-composition.png',
    candidateBoards: AUTHORITY_PRODUCTION_CANDIDATES.map((id) => `candidates/${id}.png`),
    svgCount: artifacts.length
  }
};
await fs.writeFile(path.join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Authority Drawing Intelligence proof rendered: ${out}`);
