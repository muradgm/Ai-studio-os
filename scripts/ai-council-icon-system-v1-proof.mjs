import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import {
  buildIconSemanticInventory,
  buildIconWorldExploration,
  buildIconCalibrationProofEvidence,
  auditIconDisplayPolicy,
  shouldDisplayIcon,
  REQUIRED_ICON_WORLDS,
  REQUIRED_CALIBRATION_ICONS,
  REQUIRED_SIZE_MATRIX,
  REQUIRED_CONFUSING_PAIRS,
  REQUIRED_LABEL_BLIND_PAIRS
} from '../modules/icon-system/runtime.mjs';
import { renderCalibrationSvg, validateCalibrationSvg } from '../modules/icon-system/calibration-glyphs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'icon-system-v1-calibration');
const svgRoot = path.join(outputRoot, 'svg');
const specimenRoot = path.join(outputRoot, 'specimens');
const interfaceRoot = path.join(outputRoot, 'interface');
const comparisonRoot = path.join(outputRoot, 'comparisons');
const denseRoot = path.join(outputRoot, 'dense-system');
const mobileRoot = path.join(outputRoot, 'mobile-composer');
const labelBlindRoot = path.join(outputRoot, 'label-blind');
const sourceRoot = path.join(outputRoot, 'source-html');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const visualApproval = await readJson(path.join(projectRoot, 'visual-system-v1-human-approval.json'));
const inventoryInput = await readJson(path.join(projectRoot, 'icon-semantic-inventory-v1.json'));
const explorationInput = await readJson(path.join(projectRoot, 'icon-world-exploration-v1.json'));
const visualSystem = await readJson(path.join(projectRoot, 'visual-system-v1.json'));

const inventory = buildIconSemanticInventory(inventoryInput, { visualSystemApproval: visualApproval });
if (!inventory.reviewReady) throw new Error(`Icon inventory is not ready: ${inventory.findings.map((item) => item.code).join(', ')}`);
const exploration = buildIconWorldExploration(explorationInput, { inventory });
if (!exploration.reviewReady) throw new Error(`Icon World exploration is not ready: ${exploration.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [svgRoot, specimenRoot, interfaceRoot, comparisonRoot, denseRoot, mobileRoot, labelBlindRoot, sourceRoot]) await fs.mkdir(dir, { recursive: true });
for (const worldId of REQUIRED_ICON_WORLDS) await fs.mkdir(path.join(svgRoot, worldId), { recursive: true });

const rel = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const iconById = new Map(inventory.icons.map((item) => [item.id, item]));
const worldById = new Map(exploration.worlds.map((item) => [item.id, item]));

const SUPPORT_GLYPHS = ['attach', 'send', 'inspect', 'back', 'action', 'edit', 'conversation', 'project-home'];
const contrastIds = [...new Set(REQUIRED_CONFUSING_PAIRS.flat())].filter((id) => !REQUIRED_CALIBRATION_ICONS.includes(id));
const allGlyphIds = [...new Set([...REQUIRED_CALIBRATION_ICONS, ...contrastIds, ...SUPPORT_GLYPHS])];

function supportSvg(worldId, iconId, title = '') {
  const attrs = {
    'quiver-construct': 'stroke-linecap="butt" stroke-linejoin="miter"',
    'editorial-sign': 'stroke-linecap="round" stroke-linejoin="round"',
    'provenance-glyph': 'stroke-linecap="square" stroke-linejoin="bevel"'
  }[worldId];
  const provenanceMark = worldId === 'provenance-glyph' ? '<rect x="18" y="18" width="2" height="2" fill="currentColor" stroke="none"/>' : '';
  const quiverCut = worldId === 'quiver-construct' ? '<path d="M18 5L20 7L18 9"/>' : '';
  const shapes = {
    attach: '<path d="M8 12.5L13.8 6.7C15.2 5.3 17.4 5.3 18.8 6.7C20.2 8.1 20.2 10.3 18.8 11.7L11.1 19.4C8.9 21.6 5.4 21.6 3.2 19.4C1 17.2 1 13.7 3.2 11.5L10.2 4.5"/>',
    send: '<path d="M3 5L21 12L3 19L7 12Z"/><path d="M7 12H16"/>',
    inspect: '<path d="M4 8V4H8M16 4H20V8M20 16V20H16M8 20H4V16"/><circle cx="12" cy="12" r="3.5"/>',
    back: '<path d="M19 12H5M10 6L4 12L10 18"/>',
    action: '<rect x="3" y="8" width="6" height="8"/><path d="M9 12H20M16 8L20 12L16 16"/>',
    edit: '<path d="M5 17.5L6 13.5L15.8 3.7L20.3 8.2L10.5 18L6.5 19Z"/><path d="M13.8 5.7L18.3 10.2"/>',
    conversation: '<path d="M4 5H20V16H10L6 20V16H4Z"/><path d="M8 9H16M8 12H14"/>',
    'project-home': '<path d="M4 11L12 4L20 11V20H5V11"/><path d="M9 20V14H15V20"/>'
  };
  const body = shapes[iconId];
  if (!body) throw new Error(`Unknown support glyph: ${iconId}`);
  const extra = iconId === 'action' || iconId === 'send' ? quiverCut : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" ${attrs} vector-effect="non-scaling-stroke"><title>${esc(title)}</title><g id="base">${body}</g><g id="semantic-mark">${extra}${provenanceMark}</g></svg>`;
}

function renderGlyphSvg(worldId, iconId, title) {
  try {
    return renderCalibrationSvg(worldId, iconId, { title });
  } catch (error) {
    if (!String(error?.message ?? '').includes('Unknown')) throw error;
    return supportSvg(worldId, iconId, title);
  }
}

const svgRefs = new Map();
const svgIntegrityFindings = [];
for (const worldId of REQUIRED_ICON_WORLDS) {
  for (const iconId of allGlyphIds) {
    const label = iconById.get(iconId)?.label ?? iconId;
    const svg = renderGlyphSvg(worldId, iconId, `${worldById.get(worldId).label}: ${label}`);
    const integrity = validateCalibrationSvg(svg);
    if (!integrity.pass) svgIntegrityFindings.push({ worldId, iconId, findings: integrity.findings });
    const file = path.join(svgRoot, worldId, `${iconId}.svg`);
    await fs.writeFile(file, svg);
    svgRefs.set(`${worldId}:${iconId}`, file);
  }
}
if (svgIntegrityFindings.length) throw new Error(`Calibration SVG integrity failed: ${JSON.stringify(svgIntegrityFindings)}`);

const tokens = visualSystem.color.tokens;
const baseCss = `
*{box-sizing:border-box}html,body{margin:0;background:${tokens.canvas};color:${tokens.ink};font-family:Inter,Arial,sans-serif}
body{padding:26px}.kicker{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:${tokens.mutedInk};font-weight:700}
h1{font-family:Georgia,serif;font-size:34px;font-weight:400;letter-spacing:-.025em;margin:8px 0 6px}p{color:${tokens.mutedInk};font-size:12px;line-height:1.55;margin:0}
.card{background:${tokens.surface};border:1px solid ${tokens.line};border-radius:12px}.label{font-size:11px;font-weight:650}.meta{font-size:9px;color:${tokens.mutedInk}}img.glyph{display:block}
`;
function svgUrl(worldId, iconId) {
  const ref = svgRefs.get(`${worldId}:${iconId}`);
  if (!ref) throw new Error(`Missing rendered glyph ${worldId}:${iconId}`);
  return pathToFileURL(ref).href;
}
function icon(worldId, iconId, size = 18, className = '') {
  return `<img class="glyph ${className}" src="${svgUrl(worldId, iconId)}" width="${size}" height="${size}" alt="">`;
}

function specimenHtml(worldId) {
  const world = worldById.get(worldId);
  const rows = REQUIRED_CALIBRATION_ICONS.map((iconId) => {
    const item = iconById.get(iconId);
    const sizes = REQUIRED_SIZE_MATRIX.map((size) => `<div class="size">${icon(worldId, iconId, size)}<span>${size}</span></div>`).join('');
    return `<div class="row"><div class="identity">${icon(worldId,iconId,32)}<div><b>${esc(item.label)}</b><small>${esc(item.semanticClass)} · ${esc(item.displayPriority)}</small></div></div><div class="sizes">${sizes}</div><div class="rule">${esc(item.recognitionRule)}</div></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}
  body{min-width:1240px}.header{max-width:1080px;margin:0 auto 24px}.world-note{margin-top:12px;max-width:760px}.specimen{max-width:1180px;margin:0 auto;border-top:1px solid ${tokens.ink}}.row{display:grid;grid-template-columns:260px 390px minmax(0,1fr);gap:20px;align-items:center;padding:16px 0;border-bottom:1px solid ${tokens.line}}.identity{display:flex;align-items:center;gap:14px}.identity b{font-size:12px}.identity small{display:block;font-size:9px;color:${tokens.mutedInk};margin-top:3px}.sizes{display:flex;align-items:end;gap:15px}.size{width:38px;height:52px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px}.size span{font:9px/1 monospace;color:${tokens.mutedInk}}.rule{font-size:10px;line-height:1.45;color:${tokens.mutedInk}}
  </style></head><body><header class="header"><div class="kicker">AI Council Icon System V1 · hardened calibration · no selection</div><h1>${esc(world.label)}</h1><p>${esc(world.idea)}</p><p class="world-note"><b>Risk:</b> ${esc(world.risk)}</p></header><main class="specimen">${rows}</main></body></html>`;
}

function interfaceHtml(worldId) {
  const world = worldById.get(worldId);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}
  body{padding:0;min-width:1280px}.shell{display:grid;grid-template-columns:210px minmax(0,1fr) 292px;min-height:900px}.side{border-right:1px solid ${tokens.line};padding:24px 18px;background:${tokens.surface}}.brand{font-weight:700;font-size:15px;margin-bottom:28px}.section{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:${tokens.mutedInk};margin:22px 0 8px}.nav{height:34px;display:flex;gap:10px;align-items:center;font-size:12px}.nav.active{font-weight:650}.main{padding:28px 42px 60px}.top{display:flex;justify-content:space-between;border-bottom:1px solid ${tokens.line};padding-bottom:14px;margin-bottom:28px}.top b{font-size:12px}.recommend{border-top:1px solid ${tokens.ink};padding-top:18px;max-width:760px}.recommend-head{display:flex;gap:12px;align-items:flex-start}.recommend h2{font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.08;margin:0 0 12px}.recommend p{font-size:14px;max-width:64ch;color:${tokens.ink}}.chips{display:flex;gap:8px;margin-top:18px}.chip{display:flex;align-items:center;gap:6px;border:1px solid ${tokens.line};border-radius:999px;padding:6px 9px;font-size:10px}.evidence{margin-top:34px;border-top:1px solid ${tokens.line}}.evidence-row{display:grid;grid-template-columns:22px 1fr 22px 90px;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid ${tokens.line};font-size:11px}.evidence-row span{color:${tokens.mutedInk};font-size:9px}.approval{margin-top:34px;border-top:4px solid ${tokens.consequence};padding-top:16px}.approval-title{display:flex;gap:10px;align-items:center;color:${tokens.consequence};font-size:10px;font-weight:750;letter-spacing:.05em}.approval-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.approval-grid div{padding:10px 0;border-top:1px solid ${tokens.line};font-size:10px}.memory{margin-top:34px;border-top:1px solid ${tokens.line};padding-top:16px}.memory-row{display:grid;grid-template-columns:22px 1fr 22px 110px;gap:10px;align-items:center;padding:11px 0;border-top:1px solid ${tokens.line};font-size:11px}.context{border-left:1px solid ${tokens.line};padding:24px 18px;background:color-mix(in srgb,${tokens.surface} 75%,transparent)}.context h3{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:${tokens.mutedInk};margin:0 0 12px}.context-block{border-top:1px solid ${tokens.line};padding:12px 0}.context-line{display:flex;gap:8px;align-items:center;font-size:10px;margin:8px 0}.proof{position:fixed;right:14px;bottom:12px;font-size:8px;text-transform:uppercase;letter-spacing:.08em;color:${tokens.mutedInk};background:${tokens.surface};border:1px solid ${tokens.line};padding:6px 9px;border-radius:999px}
  </style></head><body><div class="shell"><aside class="side"><div class="brand">AI Council</div><div class="section">Project</div><div class="nav active">${icon(worldId,'projects',16)} AI Council</div><div class="section">Conversations</div><div class="nav">${icon(worldId,'council',16)} Architecture</div><div class="nav">${icon(worldId,'decision',16)} Cognitive Reliability</div><div class="section">Global</div><div class="nav">${icon(worldId,'search',16)} Search</div><div class="nav">${icon(worldId,'memory',16)} Memory</div></aside><main class="main"><div class="top"><b>AI Council / Architecture</b><span class="meta">${esc(world.label)} · normal product context</span></div><section class="recommend"><div class="kicker">Structured recommendation</div><div class="recommend-head">${icon(worldId,'council',24)}<div><h2>Keep the current TypeScript control plane.</h2><p>The stronger risks are decision quality, evidence discipline, and authority boundaries—not language capability.</p></div></div><div class="chips"><div class="chip">${icon(worldId,'decision',14)} Decision</div><div class="chip">${icon(worldId,'provenance',14)} Provenance</div><div class="chip">${icon(worldId,'verification',14)} Verified</div></div></section><section class="evidence"><div class="section">Evidence</div><div class="evidence-row">${icon(worldId,'evidence',16)}<b>Architecture contract</b>${icon(worldId,'provenance',14)}<span>why used</span></div><div class="evidence-row">${icon(worldId,'evidence',16)}<b>Routing decision history</b>${icon(worldId,'verification',14)}<span>verified</span></div></section><section class="approval"><div class="approval-title">${icon(worldId,'authority',18)} APPROVAL REQUIRED · ADVICE ENDS HERE</div><div class="approval-grid"><div>Risk<br><b>Medium</b></div><div>Reversibility<br><b>High</b></div><div>Scope<br><b>Create branch + modify routing files</b></div><div>Authority<br><b>Human required</b></div></div></section><section class="memory"><div class="section">Project Memory</div><div class="memory-row">${icon(worldId,'memory',16)}<b>Routing remains advisory until benchmark passes.</b>${icon(worldId,'supersede',14)}<span>Supersede</span></div></section></main><aside class="context"><h3>Current Context</h3><div class="context-block"><div class="context-line">${icon(worldId,'projects',14)} AI Council</div><div class="context-line">${icon(worldId,'evidence',14)} Repository evidence</div><div class="context-line">${icon(worldId,'provenance',14)} Related decision history</div><div class="context-line">${icon(worldId,'verification',14)} Constraints verified</div></div><h3>Icon World</h3><div class="context-block"><p>${esc(world.signatureBehavior)}</p></div></aside></div><div class="proof">Icon calibration · exact browser · no human selection</div></body></html>`;
}

function comparisonHtml(iconId) {
  const item = iconById.get(iconId);
  const columns = REQUIRED_ICON_WORLDS.map((worldId) => {
    const world = worldById.get(worldId);
    const sizes = [14,16,18,24].map((size) => `<div class="cmp-size">${icon(worldId, iconId, size)}<span>${size}px</span></div>`).join('');
    return `<section class="world"><div class="kicker">${esc(world.label)}</div><div class="large">${icon(worldId, iconId, 48)}</div><div class="cmp-sizes">${sizes}</div><p>${esc(world.signatureBehavior)}</p></section>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}body{min-width:1000px}.head{max-width:940px;margin:0 auto 22px}.grid{max-width:940px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.world{background:${tokens.surface};border:1px solid ${tokens.line};padding:20px;min-height:270px}.large{height:78px;display:flex;align-items:center;justify-content:center}.cmp-sizes{display:flex;justify-content:center;align-items:flex-end;gap:18px;padding:12px 0 18px;border-top:1px solid ${tokens.line};border-bottom:1px solid ${tokens.line}}.cmp-size{display:flex;flex-direction:column;align-items:center;gap:7px}.cmp-size span{font:9px/1 monospace;color:${tokens.mutedInk}}.world p{font-size:10px;margin-top:14px}</style></head><body><header class="head"><div class="kicker">Same concept · same sizes · same semantics</div><h1>${esc(item.label)}</h1><p>${esc(item.meaning)}</p><p><b>Recognition rule:</b> ${esc(item.recognitionRule)}</p></header><main class="grid">${columns}</main></body></html>`;
}

function confusingPairsHtml() {
  const rows = REQUIRED_CONFUSING_PAIRS.map(([a,b]) => `<div class="pair"><div class="pair-title"><b>${esc(iconById.get(a)?.label ?? a)}</b><span>≠</span><b>${esc(iconById.get(b)?.label ?? b)}</b></div>${REQUIRED_ICON_WORLDS.map((worldId) => `<div class="pair-world"><span>${esc(worldById.get(worldId).label)}</span><div class="sizes">${[14,16,18].map((size)=>`<span>${icon(worldId,a,size)}${icon(worldId,b,size)}<small>${size}</small></span>`).join('')}</div></div>`).join('')}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}body{min-width:1180px}.head{max-width:1080px;margin:0 auto 20px}.pairs{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:14px}.pair{background:${tokens.surface};border:1px solid ${tokens.line};padding:16px}.pair-title{display:flex;gap:8px;align-items:center;font-size:12px;border-bottom:1px solid ${tokens.line};padding-bottom:10px;margin-bottom:8px}.pair-title span{color:${tokens.mutedInk}}.pair-world{display:grid;grid-template-columns:150px 1fr;align-items:center;padding:8px 0;border-top:1px solid ${tokens.line};font-size:10px}.sizes{display:flex;gap:18px;justify-content:flex-end}.sizes>span{display:grid;grid-template-columns:auto auto;gap:9px;align-items:center;position:relative;padding-bottom:12px}.sizes small{position:absolute;bottom:0;left:50%;font-size:7px;color:${tokens.mutedInk}}</style></head><body><header class="head"><div class="kicker">Expanded semantic collision gate · 14–18px</div><h1>Related concepts must remain distinguishable.</h1><p>The pair matrix includes collisions exposed by run #237, not only the original semantic brief.</p></header><main class="pairs">${rows}</main></body></html>`;
}

function labelBlindHtml(worldId) {
  const world = worldById.get(worldId);
  const contextNames = ['Coordination / judgment','Source / checked outcome','Permission / mutation','Replacement / reattempt','Origin / time','Navigation / durable knowledge'];
  const pairs = REQUIRED_LABEL_BLIND_PAIRS.map(([a,b],index) => `<div class="blind-row"><div><span>${contextNames[index]}</span><small>Nearest-neighbor recognition</small></div><div class="blind-icons">${icon(worldId,a,28)}${icon(worldId,b,28)}<div class="micro">${icon(worldId,a,14)}${icon(worldId,b,14)}</div></div></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}body{min-width:820px}.head,.board{max-width:760px;margin:0 auto}.head{margin-bottom:24px}.board{border-top:1px solid ${tokens.ink}}.blind-row{display:grid;grid-template-columns:1fr 190px;align-items:center;padding:17px 0;border-bottom:1px solid ${tokens.line}}.blind-row span{font-size:11px;font-weight:650}.blind-row small{display:block;margin-top:4px;color:${tokens.mutedInk};font-size:8px}.blind-icons{display:grid;grid-template-columns:50px 50px 70px;align-items:center;justify-content:end;gap:12px}.micro{display:flex;gap:13px;border-left:1px solid ${tokens.line};padding-left:14px}.convention{max-width:760px;margin:22px auto 0;border:1px solid ${tokens.line};padding:15px}.convention-icons{display:flex;gap:26px;margin-top:12px}</style></head><body><header class="head"><div class="kicker">Label-blind recognition · ${esc(world.label)}</div><h1>Meaning before caption.</h1><p>Brand-semantic nearest neighbors appear without their icon names. The 14px pair at right is the small-size check.</p></header><main class="board">${pairs}</main><section class="convention"><div class="kicker">Convention sanity · no labels</div><div class="convention-icons">${icon(worldId,'search',16)}${icon(worldId,'attach',16)}${icon(worldId,'send',16)}${icon(worldId,'back',16)}</div></section></body></html>`;
}

function projectsMemoryContextHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}body{min-width:1120px}.head,.grid{max-width:1040px;margin:0 auto}.head{margin-bottom:24px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.world{border:1px solid ${tokens.line};background:${tokens.surface};padding:16px}.nav,.memory{margin-top:14px;border-top:1px solid ${tokens.line};padding-top:12px}.row{display:flex;align-items:center;gap:10px;padding:8px 0;font-size:10px}.sizes{display:flex;gap:18px;margin-top:14px}.sizes div{display:flex;align-items:center;gap:8px;font-size:8px;color:${tokens.mutedInk}}</style></head><body><header class="head"><div class="kicker">Contextual collision test</div><h1>Projects ≠ Project Memory</h1><p>Collection/context switching must remain distinct from durable project truth at 14–18px and in a real memory row.</p></header><main class="grid">${REQUIRED_ICON_WORLDS.map((worldId)=>`<section class="world"><div class="kicker">${esc(worldById.get(worldId).label)}</div><div class="nav"><div class="row">${icon(worldId,'projects',16)}<b>Projects</b></div><div class="row">${icon(worldId,'memory',16)}<b>Project Memory</b></div></div><div class="sizes">${[14,16,18].map(size=>`<div>${icon(worldId,'projects',size)}${icon(worldId,'memory',size)}<span>${size}px</span></div>`).join('')}</div><div class="memory"><div class="row">${icon(worldId,'memory',16)}<span>Routing remains advisory until benchmark passes.</span></div></div></section>`).join('')}</main></body></html>`;
}

const opportunities = [];
function opportunity(id, iconId, flags = {}) {
  const item = iconById.get(iconId);
  const rendered = shouldDisplayIcon(item, flags);
  const entry = { id, iconId, ...flags, rendered };
  opportunities.push(entry);
  return entry;
}
const denseOps = {
  blocked: opportunity('dense-blocked','blocked',{ semanticSafety:true, repetitive:false }),
  authority: opportunity('dense-authority','authority',{ semanticSafety:true, repetitive:false }),
  action: opportunity('dense-action','action',{ addsInformation:true, repetitive:false }),
  verify: opportunity('dense-verify','verification',{ addsInformation:true, repetitive:false }),
  decision: opportunity('dense-decision','decision',{ addsInformation:true, repetitive:false }),
  provenanceA: opportunity('dense-provenance-a','provenance',{ addsInformation:true, repetitive:true }),
  provenanceB: opportunity('dense-provenance-b','provenance',{ addsInformation:true, repetitive:true }),
  evidenceA: opportunity('dense-evidence-a','evidence',{ addsInformation:true, repetitive:true }),
  evidenceB: opportunity('dense-evidence-b','evidence',{ addsInformation:true, repetitive:true }),
  supersedeA: opportunity('dense-supersede-a','supersede',{ addsInformation:true, repetitive:true }),
  editA: opportunity('dense-edit-a','edit',{ addsInformation:true, repetitive:true })
};
for (let i=0;i<30;i++) opportunity(`dense-memory-${i}`,'memory',{ addsInformation:false, repetitive:true });
for (let i=0;i<12;i++) if (![0,7].includes(i)) opportunity(`dense-evidence-${i}`,'evidence',{ addsInformation:false, repetitive:true });
const mobileOps = {
  back: opportunity('mobile-back','back',{ iconOnlyControl:true }),
  attach: opportunity('mobile-attach','attach',{ iconOnlyControl:true }),
  send: opportunity('mobile-send','send',{ iconOnlyControl:true }),
  inspect: opportunity('mobile-inspect','inspect',{ addsInformation:true }),
  evidence: opportunity('mobile-evidence','evidence',{ addsInformation:true }),
  authority: opportunity('mobile-authority','authority',{ semanticSafety:true }),
  projectHome: opportunity('mobile-project-home','project-home',{ addsInformation:true })
};
const policyAudit = auditIconDisplayPolicy({ inventory, opportunities });
if (!policyAudit.pass) throw new Error(`Icon display policy audit failed: ${JSON.stringify(policyAudit.findings)}`);
function policyGlyph(worldId, op, size=16) { return op?.rendered ? icon(worldId, op.iconId, size) : '<span class="icon-suppressed" aria-hidden="true"></span>'; }

function denseHtml(worldId) {
  const evidenceRows = Array.from({length:12},(_,i)=>{
    const op = i===0?denseOps.evidenceA:i===7?denseOps.evidenceB:opportunities.find(x=>x.id===`dense-evidence-${i}`);
    const prov = i===2?policyGlyph(worldId,denseOps.provenanceA,14):i===9?policyGlyph(worldId,denseOps.provenanceB,14):'';
    return `<div class="source-row"><span class="slot">${policyGlyph(worldId,op,14)}</span><div><b>${['Architecture contract','Routing decision history','Runtime adapter spec','Project memory contract','CI release evidence','Constraint ledger','Provider boundary','Approval semantics','Validation report','Conversation continuity','Tool execution trace','README architecture'][i]}</b><small>${i===5?'blocked by unresolved condition':i%3===0?'direct source':'supporting source'}</small></div><span>${prov}</span><small>${i%2?'Repository':'Decision record'}</small></div>`;
  }).join('');
  const memoryRows = Array.from({length:30},(_,i)=>{
    const memOp=opportunities.find(x=>x.id===`dense-memory-${i}`);
    const special=i===4?policyGlyph(worldId,denseOps.supersedeA,14):i===11?policyGlyph(worldId,denseOps.blocked,14):i===18?policyGlyph(worldId,denseOps.editA,14):'';
    return `<div class="memory-row"><span class="slot">${policyGlyph(worldId,memOp,14)}</span><div><b>${i+1}. ${i%4===0?'Routing remains advisory until reliability gate passes.':i%4===1?'Project context is loaded before task formulation.':i%4===2?'External mutation requires explicit authority.':'Verified outcomes update durable project memory.'}</b><small>${i===4?'Superseded · historical truth retained':i===11?'Disputed · needs review':i%3===0?'Confirmed':'Active'}</small></div><span>${special}</span><small>${i%5===0?'23 Aug':'22 Aug'}</small></div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}body{padding:0;min-width:1380px}.shell{display:grid;grid-template-columns:190px minmax(0,1fr) 300px;min-height:1500px}.side{border-right:1px solid ${tokens.line};background:${tokens.surface};padding:20px 15px}.brand{font-weight:700;margin-bottom:20px}.nav{height:30px;display:flex;align-items:center;gap:9px;font-size:10px}.main{padding:24px 34px}.top{display:flex;justify-content:space-between;border-bottom:1px solid ${tokens.line};padding-bottom:12px}.top h1{font-size:27px}.status-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}.status{border-top:1px solid ${tokens.line};padding:9px 0;font-size:9px}.status b{display:block;font-size:11px}.split{display:grid;grid-template-columns:1fr 1.12fr;gap:26px}.section-title{font-size:9px;text-transform:uppercase;letter-spacing:.08em;margin:18px 0 7px}.source-row,.memory-row{display:grid;grid-template-columns:20px 1fr 22px 74px;gap:8px;align-items:center;border-top:1px solid ${tokens.line};padding:7px 0;font-size:9px}.source-row b,.memory-row b{font-size:9px;font-weight:600}.source-row small,.memory-row small{display:block;color:${tokens.mutedInk};font-size:7px;margin-top:2px}.slot{width:16px;height:16px}.icon-suppressed{display:block;width:16px;height:16px}.tool{border-top:3px solid ${tokens.consequence};margin-top:18px;padding-top:10px}.tool-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px solid ${tokens.line};font-size:9px}.context{border-left:1px solid ${tokens.line};padding:22px 16px;background:color-mix(in srgb,${tokens.surface} 75%,transparent)}.context p{font-size:9px}.context .block{border-top:1px solid ${tokens.line};padding:10px 0}.proof{position:fixed;bottom:10px;right:12px;background:${tokens.surface};border:1px solid ${tokens.line};padding:5px 8px;border-radius:999px;font-size:7px}</style></head><body><div class="shell"><aside class="side"><div class="brand">AI Council</div><div class="nav">${icon(worldId,'projects',14)} Projects</div><div class="nav">${icon(worldId,'conversation',14)} Conversations</div><div class="nav">${icon(worldId,'search',14)} Search</div><div class="nav">Memory</div><div class="nav">Activity</div></aside><main class="main"><div class="top"><div><div class="kicker">Dense-system stress · identical icon opportunities</div><h1>Routing Intelligence V1</h1></div><span class="meta">${esc(worldById.get(worldId).label)}</span></div><div class="status-grid"><div class="status">Lifecycle<b>Active</b></div><div class="status">Confidence<b>High</b></div><div class="status">Authority<b>${policyGlyph(worldId,denseOps.authority,14)} Approval required</b></div><div class="status">Blocker<b>${policyGlyph(worldId,denseOps.blocked,14)} Reliability gate</b></div></div><div class="split"><section><div class="section-title">12 Evidence sources</div>${evidenceRows}<div class="tool"><div class="section-title">Tool execution</div><div class="tool-row">${policyGlyph(worldId,denseOps.action,14)}<span>Repository changes proposed</span><b>Pending approval</b></div><div class="tool-row">${policyGlyph(worldId,denseOps.verify,14)}<span>Validation plan</span><b>Ready</b></div><div class="tool-row">${policyGlyph(worldId,denseOps.decision,14)}<span>Decision reference</span><b>D-0241</b></div></div></section><section><div class="section-title">30 Project Memory records</div>${memoryRows}</section></div></main><aside class="context"><div class="kicker">Current context</div><div class="block"><b>Architecture</b><p>Control plane · TypeScript</p></div><div class="block"><b>Evidence</b><p>12 sources · 2 carry explicit evidence glyphs because the rest are redundant in this dense view.</p></div><div class="block"><b>Display policy</b><p>Optional Memory glyphs are suppressed across repetitive rows. Consequential blockers/authority remain visible.</p></div></aside></div><div class="proof">Dense-system proof · displayPriority enforced</div></body></html>`;
}

function mobileHtml(worldId) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss}body{padding:0;width:390px;min-height:844px;background:${tokens.canvas}.phone{width:390px;min-height:844px;position:relative;padding:14px 16px 18px}.top{height:48px;display:grid;grid-template-columns:32px 1fr 32px;align-items:center;border-bottom:1px solid ${tokens.line}}.iconbtn{width:30px;height:30px;border:0;background:transparent;display:grid;place-items:center}.project{text-align:center;font-size:11px;font-weight:650}.sheet{position:absolute;top:58px;left:12px;right:12px;background:${tokens.surface};border:1px solid ${tokens.line};border-radius:12px;padding:10px;box-shadow:0 12px 30px rgba(0,0,0,.06);z-index:2}.sheet-row{height:34px;display:flex;align-items:center;gap:9px;border-top:1px solid ${tokens.line};font-size:10px}.sheet-row:first-of-type{border-top:0}.conversation{padding:142px 2px 110px}.user{margin-left:auto;max-width:78%;background:${tokens.surface};border:1px solid ${tokens.line};padding:10px 12px;border-radius:12px;font-size:11px}.answer{margin-top:24px}.answer h1{font-size:25px}.evidence{margin-top:18px;border-top:1px solid ${tokens.line};padding-top:10px;display:flex;align-items:center;gap:8px;font-size:9px}.authority{margin-top:18px;border-top:3px solid ${tokens.consequence};padding-top:9px;display:flex;align-items:center;gap:8px;color:${tokens.consequence};font-size:9px;font-weight:700}.composer{position:absolute;left:12px;right:12px;bottom:12px;background:${tokens.surface};border:1px solid ${tokens.line};border-radius:14px;padding:10px}.input{font-size:10px;color:${tokens.mutedInk};height:34px}.tools{display:flex;align-items:center;gap:9px}.tools .send{margin-left:auto}.inspect{margin-left:auto;display:flex;gap:6px;align-items:center;color:${tokens.mutedInk};font-size:8px}.proof{position:absolute;right:12px;top:12px;font-size:6px;color:${tokens.mutedInk};transform:translateY(-9px)}</style></head><body><main class="phone"><div class="top"><button class="iconbtn">${policyGlyph(worldId,mobileOps.back,16)}</button><div class="project">Architecture ▾</div><span></span></div><section class="sheet"><div class="kicker">Project continuity</div><div class="sheet-row">${policyGlyph(worldId,mobileOps.projectHome,16)} Project Home</div><div class="sheet-row">Architecture · current thread</div><div class="sheet-row">Cognitive Reliability</div><div class="sheet-row">Memory Architecture</div><div class="sheet-row">New conversation</div></section><section class="conversation"><div class="user">Should cognitive routing become authoritative now?</div><div class="answer"><div class="kicker">Recommendation</div><h1>Keep routing advisory.</h1><p>Run shadow comparison first. The reliability gate is not yet proven.</p><div class="evidence">${policyGlyph(worldId,mobileOps.evidence,14)} <span>3 relevant sources</span><span class="inspect">${policyGlyph(worldId,mobileOps.inspect,14)} Inspect</span></div><div class="authority">${policyGlyph(worldId,mobileOps.authority,16)} APPROVAL REQUIRED FOR AUTHORITY TRANSFER</div></div></section><div class="composer"><div class="input">Ask AI Council…</div><div class="tools"><button class="iconbtn">${policyGlyph(worldId,mobileOps.attach,16)}</button><button class="iconbtn send">${policyGlyph(worldId,mobileOps.send,16)}</button></div></div><div class="proof">${esc(worldById.get(worldId).label)} · 390px</div></main></body></html>`;
}

async function screenshot(browser, html, sourceName, imagePath, viewport, fullPage = false) {
  const sourcePath = path.join(sourceRoot, sourceName);
  await fs.writeFile(sourcePath, html);
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 10_000 });
  await page.screenshot({ path: imagePath, fullPage });
  await page.close();
  return { sourceRef: rel(sourcePath), imageRef: rel(imagePath), exactBrowserProof: true };
}

const browser = await chromium.launch({ headless: true });
const worldEvidence = [];
const semanticComparisons = [];
const interfaceEvidence = [];
const denseEvidence = [];
const mobileEvidence = [];
const labelBlindEvidence = [];
let confusingPairsRef = null;
let projectsMemoryContextRef = null;
try {
  for (const worldId of REQUIRED_ICON_WORLDS) {
    const specimen = await screenshot(browser, specimenHtml(worldId), `specimen-${worldId}.html`, path.join(specimenRoot, `${worldId}.png`), { width: 1280, height: 1200 }, true);
    const interfaceShot = await screenshot(browser, interfaceHtml(worldId), `interface-${worldId}.html`, path.join(interfaceRoot, `${worldId}.png`), { width: 1440, height: 900 }, false);
    const denseShot = await screenshot(browser, denseHtml(worldId), `dense-${worldId}.html`, path.join(denseRoot, `${worldId}.png`), { width: 1440, height: 1500 }, true);
    const mobileShot = await screenshot(browser, mobileHtml(worldId), `mobile-${worldId}.html`, path.join(mobileRoot, `${worldId}.png`), { width: 390, height: 844 }, false);
    const blindShot = await screenshot(browser, labelBlindHtml(worldId), `label-blind-${worldId}.html`, path.join(labelBlindRoot, `${worldId}.png`), { width: 820, height: 900 }, true);
    worldEvidence.push({
      worldId,
      calibrationCoverage: `${REQUIRED_CALIBRATION_ICONS.length}/${REQUIRED_CALIBRATION_ICONS.length}`,
      sizeMatrixCoverage: `${REQUIRED_SIZE_MATRIX.length}/${REQUIRED_SIZE_MATRIX.length}`,
      specimenRef: specimen.imageRef,
      specimenSourceRef: specimen.sourceRef,
      interfaceRef: interfaceShot.imageRef,
      interfaceSourceRef: interfaceShot.sourceRef,
      svgDirectoryRef: rel(path.join(svgRoot, worldId)),
      svgIntegrityPass: true,
      exactBrowserProof: true
    });
    interfaceEvidence.push({ worldId, ...interfaceShot });
    denseEvidence.push({ worldId, ...denseShot });
    mobileEvidence.push({ worldId, ...mobileShot });
    labelBlindEvidence.push({ worldId, ...blindShot });
  }
  for (const iconId of REQUIRED_CALIBRATION_ICONS) {
    const shot = await screenshot(browser, comparisonHtml(iconId), `comparison-${iconId}.html`, path.join(comparisonRoot, `${iconId}.png`), { width: 1000, height: 560 }, false);
    semanticComparisons.push({ iconId, ...shot, worlds: REQUIRED_ICON_WORLDS, sizes: [14,16,18,24] });
  }
  confusingPairsRef = await screenshot(browser, confusingPairsHtml(), 'confusing-pairs.html', path.join(comparisonRoot, 'confusing-pairs.png'), { width: 1180, height: 1700 }, true);
  projectsMemoryContextRef = await screenshot(browser, projectsMemoryContextHtml(), 'projects-memory-context.html', path.join(comparisonRoot, 'projects-memory-context.png'), { width: 1120, height: 720 }, false);

  const proof = buildIconCalibrationProofEvidence({
    exploration,
    worldEvidence,
    semanticComparisons,
    interfaceEvidence,
    denseEvidence,
    mobileEvidence,
    labelBlindEvidence,
    displayPolicyAudit: policyAudit,
    confusingPairsRef
  });
  if (!proof.reviewReady) throw new Error(`Icon calibration hardening proof is incomplete: ${proof.findings.map((item) => item.code).join(', ')}`);

  const manifest = {
    ...proof,
    inventoryRef: { id: inventory.id, sourceRef: 'projects/ai-council/icon-semantic-inventory-v1.json', fingerprint: inventory.inventoryFingerprint },
    explorationRef: { id: exploration.id, sourceRef: 'projects/ai-council/icon-world-exploration-v1.json', fingerprint: exploration.explorationFingerprint },
    quiverLineAuthority: exploration.quiverLineAuthority,
    calibrationIconIds: REQUIRED_CALIBRATION_ICONS,
    renderedGlyphIds: allGlyphIds,
    sizeMatrix: REQUIRED_SIZE_MATRIX,
    criticalSizeRange: [14,16,18],
    confusingPairs: REQUIRED_CONFUSING_PAIRS,
    labelBlindPairs: REQUIRED_LABEL_BLIND_PAIRS,
    projectsMemoryContextRef,
    displayPolicy: inventory.displayPolicy,
    hybridRecommendationAllowed: false,
    svgIntegrityFindings,
    selectedWorld: null,
    selection: null,
    truth: {
      ...proof.truth,
      exactBrowserProof: true,
      svgIntegrityPass: true,
      quiverLineSelected: false,
      iconWorldHumanSelected: false,
      iconSystemHumanApproved: false,
      productionIconMastersComplete: false,
      appIconSystemAuthored: false,
      appIconHumanApproved: false,
      finalVisualSystemApproved: false
    }
  };
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`AI Council Icon Calibration Hardening V1: ${worldEvidence.length} worlds, dense/mobile/label-blind proof complete, no selection.`);
} finally {
  await browser.close();
}
