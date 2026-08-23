import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { buildProductUXArchitecture } from '../modules/product-ux-architecture/runtime.mjs';
import { buildProductUXArchitectureReference } from '../modules/product-ux-architecture/reference.mjs';
import { buildCanonicalInterfaceFixture, buildCanonicalInterfaceFixtureReference } from '../modules/interface-world-proof/fixture.mjs';
import { buildHybridConstitution, buildHybridProofPlan, buildHybridProofEvidence } from '../modules/interface-world-proof/hybrid.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const baselineRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'canonical-interface-world-proof-v1');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'hybrid-v1-head-to-head-proof');
const framesRoot = path.join(outputRoot, 'frames');
const sourceRoot = path.join(outputRoot, 'source-html');
const comparisonRoot = path.join(outputRoot, 'comparisons');

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const architecture = buildProductUXArchitecture(await readJson(path.join(projectRoot, 'product-ux-architecture.json')));
const architectureRef = buildProductUXArchitectureReference(architecture);
const fixture = buildCanonicalInterfaceFixture(await readJson(path.join(projectRoot, 'canonical-ux-fixture.json')), { architectureRef });
const fixtureRef = buildCanonicalInterfaceFixtureReference(fixture, { architectureRef });
const constitution = buildHybridConstitution(await readJson(path.join(projectRoot, 'hybrid-constitution-v1.json')), { architectureRef, fixtureRef });
const plan = buildHybridProofPlan({ constitution });
const baselineManifest = await readJson(path.join(baselineRoot, 'manifest.json'));

if (!constitution.reviewReady) throw new Error(`Hybrid Constitution is not ready: ${constitution.findings.map((item) => item.code).join(', ')}`);
if (!plan.reviewReady) throw new Error(`Hybrid proof plan is not ready: ${plan.findings.map((item) => item.code).join(', ')}`);

await fs.rm(outputRoot, { recursive: true, force: true });
for (const dir of [framesRoot, sourceRoot, comparisonRoot]) await fs.mkdir(dir, { recursive: true });

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 24);
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function semanticSource(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\sdata-proof-world="[^"]*"/gi, '')
    .replace(/\sdata-proof-screen="[^"]*"/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/<body\s*>/i, '<body>')
    .trim();
}

const HYBRID_CSS = `
  :root{
    --bg:#f2efe7!important;
    --surface:#fbf9f3!important;
    --ink:#19201c!important;
    --muted:#70736c!important;
    --line:rgba(25,32,28,.16)!important;
    --accent:#345f4c!important;
    --accent2:#6d5877!important;
    --consequence:#b84b35;
    --display:Georgia,'Times New Roman',serif!important;
    --body:Arial,Helvetica,sans-serif!important;
  }
  body{background:var(--bg);color:var(--ink)}
  .shell{grid-template-columns:194px minmax(0,1fr) 270px!important}
  .side{background:color-mix(in srgb,var(--surface) 78%,transparent)!important;border-right:1px solid var(--line)!important;padding:20px 16px!important}
  .side .brand{font-family:var(--display)!important;font-size:18px!important;font-weight:400!important;letter-spacing:-.035em!important}
  .side h6{color:var(--muted)!important;margin-top:21px!important}
  .nav{padding:8px 6px!important;color:color-mix(in srgb,var(--ink) 82%,transparent)}
  .nav.active{font-weight:700!important}
  .nav.active:before{left:-16px!important;width:2px!important;background:var(--accent)!important}
  .top{height:62px!important;margin:0 30px!important;border-bottom:1px solid var(--line)!important}
  .top .path{font-family:var(--body)!important;font-size:11px!important;letter-spacing:.01em!important}
  .center{inset:62px 0 0!important}
  .context{background:color-mix(in srgb,var(--surface) 66%,transparent)!important;border-left:1px solid var(--line)!important;padding:22px 20px!important}
  .context .small,.context .clean li{font-size:10px!important;color:var(--muted)!important}
  .tabrow{gap:14px!important}.tabrow b{color:var(--ink)!important;border-bottom:1px solid var(--ink)!important}
  .content{padding:34px 38px!important}
  .eyebrow{color:var(--accent)!important;letter-spacing:.12em!important}
  .hero{font-family:var(--display)!important;font-size:50px!important;font-weight:400!important;line-height:.96!important;letter-spacing:-.047em!important;max-width:850px}
  .bodycopy{font-size:15px!important;line-height:1.62!important;color:color-mix(in srgb,var(--ink) 90%,transparent)}
  .card,.assistant-panel,.memory-item{background:transparent!important;border:0!important;border-top:1px solid var(--line)!important;padding:15px 0!important;box-shadow:none!important;margin-left:0!important}
  .card:before,.assistant-panel:before,.memory-item:before{display:none!important}
  .card.emphasis{border-top:2px solid var(--accent)!important}.card.secondary{border-top:2px solid var(--accent2)!important}
  .card h3,.memory-item h3{font-family:var(--display)!important;font-weight:400!important;font-size:20px!important;line-height:1.22!important}
  .section-label,.micro{letter-spacing:.12em!important}
  .status-row{font-size:9px!important;padding:8px 0!important}.status-row b{font-weight:700!important}
  .button{border-color:color-mix(in srgb,var(--ink) 78%,transparent)!important;background:transparent!important;color:var(--ink)!important}
  .button.primary{background:var(--ink)!important;color:var(--bg)!important;border-color:var(--ink)!important}
  .pill{border-color:var(--line)!important;color:color-mix(in srgb,var(--ink) 82%,transparent)!important}
  .composer{border:1px solid var(--line)!important;background:var(--surface)!important;border-radius:14px!important;box-shadow:0 8px 28px rgba(25,32,28,.05)!important}
  .send{background:var(--ink)!important;color:var(--bg)!important;border-radius:50%!important}
  .worldmark{font-size:0!important;color:transparent!important}
  .worldmark:after{content:'Hybrid V1 · head-to-head proof';font-size:8px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}

  body[data-proof-screen='project-home'] .hero{max-width:690px}
  body[data-proof-screen='project-home'] .card.emphasis{position:relative;padding-left:18px!important;border-top:1px solid var(--line)!important;border-left:3px solid var(--accent)!important}
  body[data-proof-screen='project-home'] .card.emphasis:before{display:block!important;content:'';position:absolute;left:-7px;top:20px;width:10px;height:10px;border:2px solid var(--accent);background:var(--bg);border-radius:50%}

  body[data-proof-screen='conversation'] .assistant-panel,
  body[data-proof-screen='structured-response'] .assistant-panel,
  body[data-proof-screen='evidence-context'] .assistant-panel{border-top:1px solid var(--ink)!important;padding:18px 0 0!important}
  body[data-proof-screen='conversation'] .assistant-panel .bodycopy,
  body[data-proof-screen='structured-response'] .assistant-panel .bodycopy,
  body[data-proof-screen='evidence-context'] .assistant-panel .bodycopy{font-family:var(--display)!important;font-size:17px!important;line-height:1.52!important;max-width:690px}
  body[data-proof-screen='structured-response'] .recommend-grid{gap:22px!important}
  body[data-proof-screen='structured-response'] .recommend-grid .card{padding-top:12px!important}
  body[data-proof-screen='evidence-context'] .context{background:color-mix(in srgb,var(--surface) 52%,transparent)!important}

  body[data-proof-screen='approval']{--accent:var(--consequence)!important}
  body[data-proof-screen='approval'] .content{border-top:7px solid var(--consequence)!important;padding-top:27px!important}
  body[data-proof-screen='approval'] .eyebrow{color:var(--consequence)!important;font-weight:700!important}
  body[data-proof-screen='approval'] .approval-grid{border-top:1px solid var(--ink)!important;padding-top:18px!important}
  body[data-proof-screen='approval'] .card.emphasis{border-top:3px solid var(--consequence)!important}
  body[data-proof-screen='approval'] .button.primary{background:var(--consequence)!important;border-color:var(--consequence)!important;color:#fff!important}
  body[data-proof-screen='approval'] .hero{font-size:48px!important;max-width:780px}

  body[data-proof-screen='decision-detail'] .decision-grid{position:relative;padding-left:24px!important}
  body[data-proof-screen='decision-detail'] .decision-grid:before{content:'';position:absolute;left:5px;top:6px;bottom:8px;width:1px;background:var(--accent)}
  body[data-proof-screen='decision-detail'] .card.emphasis,
  body[data-proof-screen='decision-detail'] .card.secondary{position:relative;padding-left:16px!important}
  body[data-proof-screen='decision-detail'] .card.emphasis:before,
  body[data-proof-screen='decision-detail'] .card.secondary:before{display:block!important;content:'';position:absolute;left:-25px;top:19px;width:9px;height:9px;border:2px solid var(--accent);background:var(--bg);border-radius:50%}
  body[data-proof-screen='decision-detail'] .bodycopy{font-family:var(--display)!important;font-size:16px!important;line-height:1.56!important}

  body[data-proof-screen='project-memory'] .memory-grid{gap:24px!important}
  body[data-proof-screen='project-memory'] .memory-item{padding-top:14px!important}
  body[data-proof-screen='project-memory'] .memory-item.emphasis{border-top:2px solid var(--accent)!important}
  body[data-proof-screen='project-memory'] .memory-item.secondary{border-top:2px solid var(--accent2)!important}
  body[data-proof-screen='project-memory'] .removal-note{border-left:2px solid var(--accent)!important;background:color-mix(in srgb,var(--surface) 60%,transparent)!important;padding:12px 14px!important}

  body[data-proof-screen='mobile-conversation'] .mobile-top{background:var(--surface)!important;border-bottom:1px solid var(--line)!important}
  body[data-proof-screen='mobile-conversation'] .mobile-top b{font-family:var(--display)!important;font-weight:400!important}
  body[data-proof-screen='mobile-conversation'] .assistant-panel{border:0!important;border-top:1px solid var(--ink)!important;padding:14px 0 0!important}
  body[data-proof-screen='mobile-conversation'] .assistant-panel .bodycopy{font-family:var(--display)!important;font-size:17px!important;line-height:1.5!important}
  body[data-proof-screen='mobile-conversation'] .mobile-card{border:0!important;border-top:1px solid var(--line)!important;background:transparent!important;padding:10px 0 0!important}
  body[data-proof-screen='mobile-conversation'] .mobile-composer{border-radius:14px!important}
`;

function hybridize(baselineHtml, screenId) {
  const withCss = baselineHtml.replace('</head>', `<style data-hybrid-v1>${HYBRID_CSS}</style></head>`);
  return withCss.replace(/<body([^>]*)>/i, (_match, attrs) => `<body${attrs} data-proof-world="hybrid-v1" data-proof-screen="${screenId}">`);
}

async function renderBoard(page, sourcePath, imagePath) {
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 10_000 });
  await page.screenshot({ path: imagePath, fullPage: true });
}

const browser = await chromium.launch({ headless: true });
const renderedFrames = [];
const semanticByScreen = {};
try {
  for (const screenId of plan.screenIds) {
    const baselineSourcePath = path.join(baselineRoot, 'source-html', `decision-spine-${screenId}.html`);
    const baselineImagePath = path.join(baselineRoot, 'frames', `decision-spine-${screenId}.png`);
    const baselineHtml = await fs.readFile(baselineSourcePath, 'utf8');
    await fs.access(baselineImagePath);

    const semanticFingerprint = hash(semanticSource(baselineHtml));
    const candidateHtml = hybridize(baselineHtml, screenId);
    const candidateSemanticFingerprint = hash(semanticSource(candidateHtml));
    if (candidateSemanticFingerprint !== semanticFingerprint) {
      throw new Error(`Hybrid changed semantic markup for ${screenId}: ${semanticFingerprint} != ${candidateSemanticFingerprint}`);
    }
    semanticByScreen[screenId] = semanticFingerprint;

    const frameId = `${constitution.candidateId}-${screenId}`;
    const sourcePath = path.join(sourceRoot, `${frameId}.html`);
    const imagePath = path.join(framesRoot, `${frameId}.png`);
    await fs.writeFile(sourcePath, candidateHtml);

    const viewport = screenId === 'mobile-conversation' ? fixture.viewports.mobile : fixture.viewports.desktop;
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
    await page.screenshot({ path: imagePath, fullPage: false });
    await page.close();

    renderedFrames.push({
      frameId,
      screenId,
      imageRef: path.relative(repoRoot, imagePath).split(path.sep).join('/'),
      sourceRef: path.relative(repoRoot, sourcePath).split(path.sep).join('/'),
      semanticFingerprint
    });
  }

  const comparisonRefs = [];
  for (const screenId of plan.screenIds) {
    const mobile = screenId === 'mobile-conversation';
    const baselineImage = pathToFileURL(path.join(baselineRoot, 'frames', `decision-spine-${screenId}.png`)).href;
    const hybridImage = pathToFileURL(path.join(framesRoot, `${constitution.candidateId}-${screenId}.png`)).href;
    const board = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#deded9;font-family:Arial;padding:20px;color:#171717}h1{font-size:22px;margin:0 0 6px}p{font-size:12px;color:#666;margin:0 0 14px}.grid{display:grid;grid-template-columns:${mobile ? '390px 390px' : '1fr 1fr'};gap:14px;align-items:start}figure{margin:0;background:#fff;border:1px solid #bbb;padding:7px}img{width:100%;display:block}figcaption{font-size:12px;font-weight:700;padding:8px 2px 1px}</style></head><body><h1>${esc(screenId)} · Decision Spine vs Hybrid V1</h1><p>Same architecture · same fixture · same semantic markup · presentation only changes</p><div class="grid"><figure><img src="${baselineImage}"><figcaption>Decision Spine · 8.98 baseline</figcaption></figure><figure><img src="${hybridImage}"><figcaption>Hybrid V1 · candidate</figcaption></figure></div></body></html>`;
    const sourcePath = path.join(comparisonRoot, `${screenId}-decision-spine-vs-hybrid.html`);
    const imagePath = path.join(comparisonRoot, `${screenId}-decision-spine-vs-hybrid.png`);
    await fs.writeFile(sourcePath, board);
    const page = await browser.newPage({ viewport: { width: mobile ? 840 : 1800, height: mobile ? 980 : 1220 }, deviceScaleFactor: 1 });
    await renderBoard(page, sourcePath, imagePath);
    await page.close();
    comparisonRefs.push(path.relative(repoRoot, imagePath).split(path.sep).join('/'));
  }

  const desktopIds = plan.screenIds.filter((screenId) => screenId !== 'mobile-conversation');
  const imageFor = (screenId) => pathToFileURL(path.join(framesRoot, `${constitution.candidateId}-${screenId}.png`)).href;
  const overview = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#deded9;font-family:Arial;padding:22px;color:#171717}h1{font-size:24px;margin:0 0 5px}p{font-size:12px;color:#666;margin:0 0 16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;background:white;border:1px solid #bbb;padding:7px}img{width:100%;display:block}figcaption{font-size:11px;font-weight:700;padding:7px 2px}.mobile{width:390px;margin-top:14px}</style></head><body><h1>AI Council Hybrid V1 · canonical eight-screen system</h1><p>Decision Spine structure + Counterpoint reading + Threshold only at consequence boundaries.</p><div class="grid">${desktopIds.map((screenId) => `<figure><img src="${imageFor(screenId)}"><figcaption>${esc(screenId)}</figcaption></figure>`).join('')}</div><figure class="mobile"><img src="${imageFor('mobile-conversation')}"><figcaption>mobile-conversation</figcaption></figure></body></html>`;
  const overviewSource = path.join(outputRoot, 'hybrid-v1-overview.html');
  const overviewImage = path.join(outputRoot, 'hybrid-v1-overview.png');
  await fs.writeFile(overviewSource, overview);
  const overviewPage = await browser.newPage({ viewport: { width: 1500, height: 3400 }, deviceScaleFactor: 1 });
  await renderBoard(overviewPage, overviewSource, overviewImage);
  await overviewPage.close();

  const proof = buildHybridProofEvidence({
    plan,
    baselineManifest,
    renderedFrames,
    comparisonRefs,
    overviewRef: path.relative(repoRoot, overviewImage).split(path.sep).join('/')
  });
  if (!proof.reviewReady) throw new Error(`Hybrid proof is incomplete: ${proof.findings.map((item) => item.code).join(', ')}`);

  const manifest = {
    ...proof,
    constitution: {
      schema: constitution.schema,
      candidateId: constitution.candidateId,
      constitutionFingerprint: constitution.constitutionFingerprint,
      baseline: constitution.baseline,
      sourceResponsibilities: constitution.sourceResponsibilities,
      screenHierarchy: constitution.screenHierarchy,
      proofQuestions: constitution.proofQuestions,
      hardFailConditions: constitution.hardFailConditions
    },
    semanticByScreen,
    comparisonQuestion: constitution.comparison.question,
    selection: null,
    selectedWorld: null,
    truth: {
      ...proof.truth,
      semanticMarkupIdenticalToDecisionSpine: true,
      humanWorldSelectionConfirmed: false,
      humanVisualApproval: false,
      finalVisualSystemApproved: false
    }
  };
  await fs.writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Rendered ${renderedFrames.length} Hybrid V1 frames and ${comparisonRefs.length} Decision Spine ↔ Hybrid comparison boards.`);
} finally {
  await browser.close();
}
