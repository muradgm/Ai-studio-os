import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const projectRoot = path.join(repoRoot, 'projects', 'ai-council');
const outputRoot = path.join(repoRoot, 'artifacts', 'ai-council', 'visual-system-v1-proof');
const canonicalRoot = path.join(outputRoot, 'canonical');
const stressRoot = path.join(outputRoot, 'stress');
const sourceRoot = path.join(outputRoot, 'source-html');
const approval = JSON.parse(await fs.readFile(path.join(projectRoot, 'visual-system-v1-human-approval.json'), 'utf8'));
const humanVisualApproved = approval?.truth?.humanVisualApproval === true && approval?.truth?.finalVisualSystemApproved === false;

const canonicalIds = [
  'project-home',
  'conversation',
  'structured-response',
  'evidence-context',
  'approval',
  'decision-detail',
  'project-memory',
  'mobile-conversation'
];
const stressIds = [
  'short-answer',
  'long-answer',
  'code-heavy-answer',
  'dense-evidence',
  'ten-plus-sources',
  'multi-stage-recommendation',
  'tool-execution',
  'error-state',
  'streaming-state',
  'very-long-project-memory'
];

const worldChrome = humanVisualApproved
  ? 'HYBRID V1 SELECTED · VISUAL SYSTEM V1 HUMAN-APPROVED DIRECTION'
  : 'HYBRID V1 SELECTED · VISUAL SYSTEM V1 CANDIDATE';
const approvalChrome = humanVisualApproved
  ? 'VISUAL SYSTEM V1 · PRODUCTION REFINEMENT · FINAL APPROVAL PENDING'
  : 'VISUAL SYSTEM V1 · HUMAN VISUAL APPROVAL PENDING';

const PROOF_CHROME_CSS = `
.worldmark,.proof{font-size:0!important;color:transparent!important}
.worldmark:after{content:'${worldChrome}'!important;font-family:Inter,Arial,sans-serif!important;font-size:8px!important;letter-spacing:.08em!important;text-transform:uppercase!important;color:var(--muted)!important}
.proof:after{content:'${approvalChrome}'!important;font-family:Inter,Arial,sans-serif!important;font-size:7px!important;letter-spacing:.07em!important;text-transform:uppercase!important;color:var(--muted)!important}
`;

function addFinalChrome(html) {
  const stripped = html.replace(/<style data-visual-system-final-chrome>[\s\S]*?<\/style>/gi, '');
  return stripped.replace('</head>', `<style data-visual-system-final-chrome>${PROOF_CHROME_CSS}</style></head>`);
}

async function waitFonts(page) {
  await page.waitForFunction(async () => {
    await document.fonts.ready;
    return document.fonts.check('16px Inter') && document.fonts.check('16px Newsreader') && document.fonts.check('13px "IBM Plex Mono"');
  }, null, { timeout: 20_000 });
}

async function render(page, sourcePath, imagePath, fullPage = false) {
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'networkidle' });
  await waitFonts(page);
  await page.screenshot({ path: imagePath, fullPage });
}

async function renderOverview(browser, { title, subtitle, ids, imageRoot, outputName }) {
  const items = ids.map((id) => `<figure><img src="${pathToFileURL(path.join(imageRoot, `${id}.png`)).href}"><figcaption>${id}</figcaption></figure>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#DDE1DC;font-family:Arial;padding:22px;color:#151A16}h1{font-size:24px;margin:0 0 5px}p{font-size:12px;color:#626762;margin:0 0 16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;background:#fff;border:1px solid #BDC4BD;padding:7px}img{width:100%;display:block}figcaption{font-size:11px;font-weight:700;padding:7px 2px}</style></head><body><h1>${title}</h1><p>${subtitle}</p><div class="grid">${items}</div></body></html>`;
  const sourcePath = path.join(outputRoot, `${outputName}.html`);
  const imagePath = path.join(outputRoot, `${outputName}.png`);
  await fs.writeFile(sourcePath, html);
  const page = await browser.newPage({ viewport: { width: 1540, height: 3400 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(sourcePath).href, { waitUntil: 'load' });
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 10_000 });
  await page.screenshot({ path: imagePath, fullPage: true });
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  for (const screenId of canonicalIds) {
    const sourcePath = path.join(sourceRoot, `canonical-${screenId}.html`);
    const html = addFinalChrome(await fs.readFile(sourcePath, 'utf8'));
    await fs.writeFile(sourcePath, html);
    const viewport = screenId === 'mobile-conversation' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await render(page, sourcePath, path.join(canonicalRoot, `${screenId}.png`));
    await page.close();
  }

  const streamingSource = path.join(sourceRoot, 'stress-streaming-state.html');
  let streamingHtml = await fs.readFile(streamingSource, 'utf8');
  streamingHtml = streamingHtml.replace(
    'High-level lifecycle state only · no hidden chain-of-thought telemetry',
    'Status reflects observable lifecycle state.'
  );
  await fs.writeFile(streamingSource, streamingHtml);
  const streamingPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await render(streamingPage, streamingSource, path.join(stressRoot, 'streaming-state.png'), true);
  await streamingPage.close();

  await renderOverview(browser, {
    title: 'AI Council Visual System V1 · canonical screens',
    subtitle: humanVisualApproved
      ? 'Hybrid V1 selected · visual language human-approved · production refinement and final approval remain open.'
      : 'Hybrid V1 selected · exact browser candidate · human visual approval still pending.',
    ids: canonicalIds,
    imageRoot: canonicalRoot,
    outputName: 'canonical-overview'
  });
  await renderOverview(browser, {
    title: 'AI Council Visual System V1 · stress states',
    subtitle: humanVisualApproved
      ? 'Approved visual language under production refinement · dense and edge cases remain part of the gate.'
      : 'Dense and edge cases are part of the visual-system gate, not late QA.',
    ids: stressIds,
    imageRoot: stressRoot,
    outputName: 'stress-overview'
  });

  const manifestPath = path.join(outputRoot, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  manifest.humanApprovalRef = {
    schema: approval.schema,
    sourceRef: 'projects/ai-council/visual-system-v1-human-approval.json',
    recordedAt: approval.approvalEvent?.recordedAt ?? null
  };
  manifest.status = humanVisualApproved ? 'human-visual-language-approved-production-refinement' : manifest.status;
  manifest.truth = {
    ...(manifest.truth ?? {}),
    humanVisualApproval: humanVisualApproved,
    visualSystemDirectionFrozen: humanVisualApproved,
    conceptualVisualSearchClosed: humanVisualApproved,
    motionHumanApproved: false,
    finalVisualSystemApproved: false
  };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`Finalized Visual System V1 proof chrome, streaming copy, and human-approval state: ${humanVisualApproved ? 'approved direction' : 'pending'}.`);
} finally {
  await browser.close();
}
