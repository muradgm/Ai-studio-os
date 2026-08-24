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
  buildAuthorityVectorArtifact,
  inspectAuthoritySvgIntegrity
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
    const svgPath = path.join(svgDir, svgName);
    await fs.writeFile(svgPath, vector.svg);
    const emittedSvg = await fs.readFile(svgPath, 'utf8');
    const readbackIntegrity = inspectAuthoritySvgIntegrity(emittedSvg, { candidateId, targetSize: size });
    const fileRoundTripExact = emittedSvg === vector.svg;
    if (readbackIntegrity.status !== 'ready' || !fileRoundTripExact) {
      throw new Error(`Authority emitted SVG readback failed for ${candidateId}@${size}: ${JSON.stringify({ readbackIntegrity, fileRoundTripExact })}`);
    }
    artifacts.push({
      candidateId,
      metaphor: candidate.metaphor,
      size,
      svgRef: `svg/${svgName}`,
      svg: emittedSvg,
      retainedSemanticDeviceIds: vector.retainedSemanticDeviceIds,
      primitiveIds: vector.primitiveIds,
      relationshipCount: vector.relationshipCount,
      vectorSpecValidation: vector.vectorSpecValidation,
      emittedSvgIntegrity: readbackIntegrity,
      fileRoundTripExact
    });
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function inlineSvg(candidateId, size, { className = '' } = {}) {
  const item = artifacts.find((artifact) => artifact.candidateId === candidateId && artifact.size === size);
  if (!item) return '';
  const attributes = `data-authority-glyph="true" data-candidate-id="${candidateId}" data-size="${size}" class="authority-glyph ${className}"`;
  return item.svg.replace('<svg ', `<svg ${attributes} `);
}
function icon(candidateId, size, display = 72) {
  return `<div class="icon-cell"><div class="icon-stage" style="width:${display}px;height:${display}px">${inlineSvg(candidateId, size)}</div><div class="size">${size}px</div></div>`;
}
function commonCss() {
  return `<style>
    *{box-sizing:border-box} body{margin:0;background:#f6f5f1;color:#171816;font-family:Inter,Arial,sans-serif}.page{padding:52px 58px 64px;min-height:100vh}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#666b64;margin-bottom:12px}.title{font-family:Georgia,serif;font-size:40px;font-weight:500;line-height:1.05;margin:0 0 12px}.sub{max-width:920px;font-size:14px;line-height:1.5;color:#555a53;margin-bottom:36px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.card{background:#fff;border:1px solid #d8dad4;border-radius:12px;padding:24px}.card h2{font-family:Georgia,serif;font-weight:500;font-size:24px;margin:0 0 8px}.metaphor{font-size:12px;line-height:1.5;color:#666b64;min-height:56px}.sizes{display:flex;align-items:flex-end;gap:18px;margin:28px 0 22px}.icon-cell{text-align:center}.icon-stage{display:grid;place-items:center;background:#fafafa;border:1px solid #ecece7;border-radius:10px;color:#171816}.size{font:11px/1.2 ui-monospace,SFMono-Regular,monospace;color:#777c75;margin-top:7px}.devices{border-top:1px solid #ecece7;padding-top:14px;font-size:11px;line-height:1.7;color:#5d625b}.state-grid{display:grid;grid-template-columns:160px repeat(4,1fr);gap:10px;align-items:stretch}.state-head,.state-cell,.candidate-name{background:#fff;border:1px solid #d8dad4;border-radius:10px;min-height:88px;padding:14px}.state-head{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#676c65;display:flex;align-items:center}.candidate-name{font-family:Georgia,serif;font-size:18px;display:flex;align-items:center}.state-cell{display:flex;gap:12px;align-items:center;font-size:13px}.state-cell .glyph{width:44px;height:44px;border-radius:9px;background:#fafafa;display:grid;place-items:center;color:#171816}.note{margin-top:26px;font-size:12px;color:#626760}.truth{margin-top:30px;padding:14px 16px;border-left:3px solid #222;font:12px/1.6 ui-monospace,SFMono-Regular,monospace;background:#efeee9}.approval-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.approval-card{background:#fff;border:1px solid #d7d8d2;border-radius:14px;overflow:hidden}.approval-top{padding:18px 20px;border-bottom:1px solid #ecece7;display:flex;align-items:center;justify-content:space-between}.approval-state{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:650;color:#a43f2e}.approval-body{padding:22px 20px}.approval-body h2{font-family:Georgia,serif;font-size:22px;font-weight:500;margin:0 0 10px}.approval-body p{font-size:13px;line-height:1.5;color:#5d625b;margin:0 0 18px}.approval-meta{padding:12px 14px;background:#f5f4ef;border-radius:9px;font:11px/1.55 ui-monospace,SFMono-Regular,monospace;color:#555a53}.approval-actions{display:flex;justify-content:flex-end;gap:8px;padding:16px 20px;border-top:1px solid #ecece7}.btn{border:1px solid #cfd1cb;background:#fff;border-radius:8px;padding:8px 12px;font-size:12px}.btn.primary{background:#1f211f;color:#fff;border-color:#1f211f}.authority-glyph{display:block;flex:none}
  </style>`;
}

const overviewHtml = `<!doctype html><html><head><meta charset="utf-8">${commonCss()}</head><body><main class="page"><div class="eyebrow">Drawing Intelligence V1 · Authority production test</div><h1 class="title">State-neutral Authority metaphors</h1><p class="sub">Three semantic plans passed Drawing Memory and learned-vocabulary blocking. Geometry below is deterministic Vector Geometry output from size-filtered Geometry Intent. SVG is inlined from the exact emitted artifact bytes. No candidate is selected or recommended by this proof.</p><section class="grid">${AUTHORITY_PRODUCTION_CANDIDATES.map((candidateId) => {
  const candidate = plan.candidates.find((item) => item.id === candidateId);
  const rows = artifacts.filter((item) => item.candidateId === candidateId);
  return `<article class="card"><h2>${escapeHtml(candidateId.replaceAll('-', ' '))}</h2><div class="metaphor">${escapeHtml(candidate.metaphor)}</div><div class="sizes">${plan.targetSizes.map((size) => icon(candidateId, size)).join('')}</div><div class="devices">${rows.map((row) => `${row.size}px → ${escapeHtml(row.retainedSemanticDeviceIds.join(' · '))} · ${row.primitiveIds.length} primitives · ${row.relationshipCount} relations`).join('<br>')}</div></article>`;
}).join('')}</section><div class="truth">selectedCandidate = null<br>humanIconSelection = false<br>humanIconSystemApproval = false<br>executionAuthority = vector-geometry</div></main></body></html>`;

const stateLabels = ['Authority', 'Approval required', 'Authorized', 'Rejected'];
const stateHtml = `<!doctype html><html><head><meta charset="utf-8">${commonCss()}</head><body><main class="page"><div class="eyebrow">Stable master composition test</div><h1 class="title">State belongs outside the Authority glyph</h1><p class="sub">Each row repeats the exact same 16px emitted SVG across four product labels. Approval/authorization/rejection state is intentionally not encoded in master geometry.</p><section class="state-grid"><div></div>${stateLabels.map((label) => `<div class="state-head">${label}</div>`).join('')}${AUTHORITY_PRODUCTION_CANDIDATES.map((candidateId) => `<div class="candidate-name">${candidateId.replaceAll('-', ' ')}</div>${stateLabels.map((label) => `<div class="state-cell"><div class="glyph">${inlineSvg(candidateId, 16)}</div><span>${label}</span></div>`).join('')}`).join('')}</section><p class="note">Visual System and Motion System may change color, emphasis, labels and transitions by state. The canonical Authority geometry remains unchanged.</p></main></body></html>`;

const approvalHtml = `<!doctype html><html><head><meta charset="utf-8">${commonCss()}</head><body><main class="page"><div class="eyebrow">Product-context proof</div><h1 class="title">Approval Request · same content, same state, different Authority metaphor</h1><p class="sub">The Authority master remains state-neutral. Consequence vermilion is applied by the surrounding Approval Required state, not encoded into SVG geometry.</p><section class="approval-grid">${AUTHORITY_PRODUCTION_CANDIDATES.map((candidateId) => `<article class="approval-card"><div class="approval-top"><div class="approval-state">${inlineSvg(candidateId, 16)}<span>Approval required</span></div><span class="size">${candidateId}</span></div><div class="approval-body"><h2>Apply repository changes?</h2><p>The Council recommends updating the runtime contract. This crosses from advisory judgment into a consequential repository mutation and requires explicit human authority.</p><div class="approval-meta">Scope: modules/drawing-intelligence<br>Action: modify repository files<br>Validation: required after execution</div></div><div class="approval-actions"><button class="btn">Reject</button><button class="btn primary">Review changes</button></div></article>`).join('')}</section></main></body></html>`;

await fs.writeFile(path.join(htmlDir, 'overview.html'), overviewHtml);
await fs.writeFile(path.join(htmlDir, 'state-composition.html'), stateHtml);
await fs.writeFile(path.join(htmlDir, 'approval-request.html'), approvalHtml);

async function assertRenderedGlyphs(page, expectedCount, label) {
  const report = await page.locator('svg[data-authority-glyph="true"]').evaluateAll((nodes) => nodes.map((svg) => {
    const rect = svg.getBoundingClientRect();
    const group = svg.querySelector('g');
    const ink = group ? group.getBBox() : { width: 0, height: 0 };
    return {
      candidateId: svg.getAttribute('data-candidate-id'),
      size: Number(svg.getAttribute('data-size')),
      width: rect.width,
      height: rect.height,
      inkWidth: ink.width,
      inkHeight: ink.height,
      shapeCount: svg.querySelectorAll('line,circle,rect,path,polygon,polyline').length
    };
  }));
  if (report.length !== expectedCount) throw new Error(`${label}: expected ${expectedCount} rendered glyphs, found ${report.length}`);
  for (const item of report) {
    if (!(item.width > 0 && item.height > 0 && (item.inkWidth > 0 || item.inkHeight > 0) && item.shapeCount > 0)) {
      throw new Error(`${label}: empty or non-rendered Authority glyph: ${JSON.stringify(item)}`);
    }
  }
  return { label, expectedCount, actualCount: report.length, pass: true, glyphs: report };
}

const browserReports = [];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1050 }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(htmlDir, 'overview.html')}`);
  browserReports.push(await assertRenderedGlyphs(page, AUTHORITY_PRODUCTION_CANDIDATES.length * plan.targetSizes.length, 'overview'));
  await page.screenshot({ path: path.join(out, 'overview.png'), fullPage: true });

  await page.goto(`file://${path.join(htmlDir, 'state-composition.html')}`);
  browserReports.push(await assertRenderedGlyphs(page, AUTHORITY_PRODUCTION_CANDIDATES.length * stateLabels.length, 'state-composition'));
  await page.screenshot({ path: path.join(out, 'state-composition.png'), fullPage: true });

  await page.goto(`file://${path.join(htmlDir, 'approval-request.html')}`);
  browserReports.push(await assertRenderedGlyphs(page, AUTHORITY_PRODUCTION_CANDIDATES.length, 'approval-request'));
  await page.screenshot({ path: path.join(out, 'approval-request.png'), fullPage: true });

  for (const candidateId of AUTHORITY_PRODUCTION_CANDIDATES) {
    const candidate = plan.candidates.find((item) => item.id === candidateId);
    const rows = artifacts.filter((item) => item.candidateId === candidateId);
    const html = `<!doctype html><html><head><meta charset="utf-8">${commonCss()}</head><body><main class="page"><div class="eyebrow">Authority candidate · exact browser proof</div><h1 class="title">${candidateId.replaceAll('-', ' ')}</h1><p class="sub">${escapeHtml(candidate.metaphor)}</p><section class="card"><div class="sizes">${plan.targetSizes.map((size) => icon(candidateId, size, 96)).join('')}</div><div class="devices">${rows.map((row) => `${row.size}px retains: ${escapeHtml(row.retainedSemanticDeviceIds.join(' · '))}<br>primitives: ${escapeHtml(row.primitiveIds.join(' · '))}<br>relationships: ${row.relationshipCount}`).join('<br><br>')}</div></section><div class="truth">known blocker collisions = 0<br>human selection = false</div></main></body></html>`;
    const sourcePath = path.join(htmlDir, `${candidateId}.html`);
    await fs.writeFile(sourcePath, html);
    await page.goto(`file://${sourcePath}`);
    browserReports.push(await assertRenderedGlyphs(page, plan.targetSizes.length, `candidate-${candidateId}`));
    await page.screenshot({ path: path.join(candidateDir, `${candidateId}.png`), fullPage: true });
  }
} finally {
  await browser.close();
}

const vectorSpecValidationPassed = artifacts.every((item) => item.vectorSpecValidation.status === 'ready');
const emittedSvgIntegrityPassed = artifacts.every((item) => item.emittedSvgIntegrity.status === 'ready' && item.fileRoundTripExact);
const surfaceNeutralSvg = artifacts.every((item) => item.emittedSvgIntegrity.surfaceNeutral === true);
const browserGlyphRenderPassed = browserReports.every((report) => report.pass === true);
const exactBrowserProof = browserGlyphRenderPassed;
const sizeBudgetExecutionEnforced = artifacts.every((item) => {
  const budget = plan.sizeBudgets[String(item.size)] ?? plan.sizeBudgets[item.size];
  const candidate = plan.candidates.find((entry) => entry.id === item.candidateId);
  const retained = new Set(item.retainedSemanticDeviceIds);
  const expectedPrimitiveIds = candidate.primitivePlan.primitives.filter((primitive) => retained.has(primitive.semanticDeviceId)).map((primitive) => primitive.id);
  const expectedRelationshipCount = candidate.primitivePlan.relationships.filter((relationship) => retained.has(relationship.semanticDeviceId)).length;
  return item.retainedSemanticDeviceIds.length === budget.maxSemanticDevices
    && JSON.stringify(item.primitiveIds) === JSON.stringify(expectedPrimitiveIds)
    && item.relationshipCount === expectedRelationshipCount;
});
const requiredStateTokens = ['approval-required', 'authorized', 'withheld', 'granted', 'executing', 'execution-state'];
const stateNeutralSemanticContractPassed = requiredStateTokens.every((token) => plan.semanticIntent.mustNotEncode?.includes(token));
const stateNeutralMasterCompositionProved = stateNeutralSemanticContractPassed && browserReports.some((report) => report.label === 'state-composition' && report.pass);
const drawingPlanPassed = memory.pass && plan.pass && plan.reviewReady;
const pass = drawingPlanPassed
  && vectorSpecValidationPassed
  && emittedSvgIntegrityPassed
  && surfaceNeutralSvg
  && browserGlyphRenderPassed
  && sizeBudgetExecutionEnforced
  && stateNeutralMasterCompositionProved;

const manifest = {
  schema: 'ai-studio-os/drawing-intelligence-authority-production-proof@1',
  projectId: 'ai-council',
  conceptId: 'authority',
  status: pass ? 'ready-for-independent-render-review' : 'blocked',
  pass,
  reviewReady: pass,
  drawingPlan: { id: plan.id, fingerprint: plan.planFingerprint },
  candidates: plan.candidates.map((candidate) => ({
    id: candidate.id,
    status: candidate.status,
    recommendationEligibility: candidate.recommendationEligibility,
    blockerCollisions: candidate.collisions.filter((item) => item.severity === 'BLOCKER')
  })),
  targetSizes: plan.targetSizes,
  truth: {
    drawingPlanPassed,
    vectorSpecValidationPassed,
    emittedSvgIntegrityPassed,
    surfaceNeutralSvg,
    browserGlyphRenderPassed,
    exactBrowserProof,
    sizeBudgetExecutionEnforced,
    stateNeutralSemanticContractPassed,
    stateNeutralMasterCompositionProved
  },
  browserRenderReports: browserReports,
  recommendedCandidate: null,
  humanSelectedCandidate: null,
  humanIconSelection: false,
  humanIconSystemApproval: false,
  finalVisualSystemApproved: false,
  evidence: {
    overview: 'overview.png',
    stateComposition: 'state-composition.png',
    approvalRequest: 'approval-request.png',
    candidateBoards: AUTHORITY_PRODUCTION_CANDIDATES.map((id) => `candidates/${id}.png`),
    svgCount: artifacts.length,
    standaloneSvgRefs: artifacts.map((item) => item.svgRef)
  }
};
await fs.writeFile(path.join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
if (!pass) throw new Error(`Authority Drawing Intelligence proof failed derived truth gates: ${JSON.stringify(manifest.truth)}`);
console.log(`Authority Drawing Intelligence proof rendered: ${out}`);
