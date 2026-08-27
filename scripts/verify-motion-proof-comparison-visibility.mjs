import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const MIN_PIXEL_CONTRIBUTION_RATIO = 0.05;
const PIXEL_DELTA_THRESHOLD = 12;
const CONTRIBUTION_SAMPLE_WIDTH = 160;
const CONTRIBUTION_SAMPLE_HEIGHT = 90;

function filterOpacity(filterValue) {
  if (!filterValue || filterValue === 'none') return 1;
  let product = 1;
  const pattern = /opacity\(([^)]+)\)/gi;
  let match = pattern.exec(filterValue);
  while (match) {
    const token = String(match[1] ?? '').trim();
    const value = token.endsWith('%') ? Number.parseFloat(token) / 100 : Number.parseFloat(token);
    if (!Number.isFinite(value)) return 0;
    product *= Math.max(0, Math.min(1, value));
    match = pattern.exec(filterValue);
  }
  return product;
}

async function inspectVideoCandidate(page, index) {
  const locator = page.locator('video').nth(index);
  return locator.evaluate(async (video, filterOpacitySource) => {
    const parseFilterOpacity = (0, eval)(`(${filterOpacitySource})`);
    const intersect = (left, right) => ({
      left: Math.max(left.left, right.left),
      top: Math.max(left.top, right.top),
      right: Math.min(left.right, right.right),
      bottom: Math.min(left.bottom, right.bottom)
    });
    const positive = (rect) => rect.right - rect.left > 0.5 && rect.bottom - rect.top > 0.5;
    const cssPath = (element) => {
      const parts = [];
      let node = element;
      while (node && node.nodeType === Node.ELEMENT_NODE) {
        if (node === document.documentElement) {
          parts.unshift('html');
          break;
        }
        const parent = node.parentElement;
        if (!parent) break;
        const childIndex = Array.from(parent.children).indexOf(node) + 1;
        parts.unshift(`${node.tagName.toLowerCase()}:nth-child(${childIndex})`);
        node = parent;
      }
      return parts.join(' > ');
    };

    video.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const viewportRect = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const ownRects = video.getClientRects();
    if (!ownRects.length) return { geometricallyVisible: false, currentSrc: '', cssPath: '', clip: null };
    const videoRect = video.getBoundingClientRect();
    if (!(videoRect.width > 0.5 && videoRect.height > 0.5)) return { geometricallyVisible: false, currentSrc: '', cssPath: '', clip: null };

    let visibleRect = intersect(videoRect, viewportRect);
    if (!positive(visibleRect)) return { geometricallyVisible: false, currentSrc: '', cssPath: '', clip: null };

    let node = video;
    let effectiveOpacity = 1;
    let effectiveFilterOpacity = 1;
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      const style = getComputedStyle(node);
      const opacity = Number.parseFloat(style.opacity || '1');
      if (node.hidden
        || style.display === 'none'
        || style.visibility === 'hidden'
        || style.visibility === 'collapse'
        || style.contentVisibility === 'hidden'
        || !Number.isFinite(opacity)) return { geometricallyVisible: false, currentSrc: '', cssPath: '', clip: null };

      effectiveOpacity *= opacity;
      effectiveFilterOpacity *= parseFilterOpacity(style.filter);
      if (effectiveOpacity <= 0.001 || effectiveFilterOpacity <= 0.001) return { geometricallyVisible: false, currentSrc: '', cssPath: '', clip: null };

      if (node !== video) {
        const ancestorRect = node.getBoundingClientRect();
        const clipsX = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX);
        const clipsY = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowY);
        if (clipsX) visibleRect = { ...visibleRect, left: Math.max(visibleRect.left, ancestorRect.left), right: Math.min(visibleRect.right, ancestorRect.right) };
        if (clipsY) visibleRect = { ...visibleRect, top: Math.max(visibleRect.top, ancestorRect.top), bottom: Math.min(visibleRect.bottom, ancestorRect.bottom) };
        if (!positive(visibleRect)) return { geometricallyVisible: false, currentSrc: '', cssPath: '', clip: null };
      }
      node = node.parentElement;
    }

    if (!positive(visibleRect)) return { geometricallyVisible: false, currentSrc: '', cssPath: '', clip: null };

    // Only the browser-selected source is reviewable. Nested fallback <source>
    // URLs that are not selected cannot satisfy comparison coverage.
    const currentSrc = video.currentSrc
      || (video.hasAttribute('src') && video.getAttribute('src')?.trim() ? video.src : '')
      || video.querySelector('source[src]')?.src
      || '';

    return {
      geometricallyVisible: true,
      currentSrc,
      cssPath: cssPath(video),
      clip: {
        x: visibleRect.left,
        y: visibleRect.top,
        width: visibleRect.right - visibleRect.left,
        height: visibleRect.bottom - visibleRect.top
      }
    };
  }, filterOpacity.toString());
}

async function pixelDifferenceRatio(analysisPage, shownBytes, hiddenBytes) {
  const shown = `data:image/png;base64,${shownBytes.toString('base64')}`;
  const hidden = `data:image/png;base64,${hiddenBytes.toString('base64')}`;
  return analysisPage.evaluate(async ({ shown, hidden, width, height, threshold }) => {
    const load = async (src) => {
      const image = new Image();
      image.src = src;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('comparison probe screenshot decode failed'));
      });
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      return context.getImageData(0, 0, width, height).data;
    };
    const [left, right] = await Promise.all([load(shown), load(hidden)]);
    let changed = 0;
    const pixels = width * height;
    for (let index = 0; index < left.length; index += 4) {
      const delta = Math.max(
        Math.abs(left[index] - right[index]),
        Math.abs(left[index + 1] - right[index + 1]),
        Math.abs(left[index + 2] - right[index + 2])
      );
      if (delta >= threshold) changed += 1;
    }
    return pixels ? changed / pixels : 0;
  }, {
    shown,
    hidden,
    width: CONTRIBUTION_SAMPLE_WIDTH,
    height: CONTRIBUTION_SAMPLE_HEIGHT,
    threshold: PIXEL_DELTA_THRESHOLD
  });
}

async function videoContribution(page, context, analysisPage, candidate) {
  if (!candidate?.cssPath || !candidate?.clip) return { ratio: 0, meaningful: false };
  const clip = {
    x: Math.max(0, candidate.clip.x),
    y: Math.max(0, candidate.clip.y),
    width: Math.max(1, candidate.clip.width),
    height: Math.max(1, candidate.clip.height)
  };
  const shown = await page.screenshot({ type: 'png', animations: 'disabled', clip });

  // The comparison page runs with JavaScript disabled. Hide the exact candidate
  // through a DevTools stylesheet rather than mutating its DOM/style attributes,
  // so CSS selectors such as video[style] and page MutationObservers cannot
  // react to the authority probe.
  const cdp = await context.newCDPSession(page);
  try {
    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { frameTree } = await cdp.send('Page.getFrameTree');
    const { styleSheetId } = await cdp.send('CSS.createStyleSheet', { frameId: frameTree.frame.id });
    await cdp.send('CSS.setStyleSheetText', {
      styleSheetId,
      text: `${candidate.cssPath}{opacity:0!important}`
    });
    await page.waitForTimeout(40);
    const hidden = await page.screenshot({ type: 'png', animations: 'disabled', clip });
    const ratio = await pixelDifferenceRatio(analysisPage, shown, hidden);
    return { ratio, meaningful: ratio >= MIN_PIXEL_CONTRIBUTION_RATIO };
  } finally {
    await cdp.detach().catch(() => {});
  }
}

async function inspectComparisonPage(page, context, analysisPage) {
  const sources = [];
  const contributionRatios = [];
  let visibleVideoCount = 0;
  let emptyVisibleVideoCount = 0;
  const videoCount = await page.locator('video').count();

  for (let index = 0; index < videoCount; index += 1) {
    const candidate = await inspectVideoCandidate(page, index);
    if (!candidate.geometricallyVisible) continue;
    const contribution = await videoContribution(page, context, analysisPage, candidate);
    if (!contribution.meaningful) continue;

    visibleVideoCount += 1;
    contributionRatios.push(contribution.ratio);
    if (!candidate.currentSrc) emptyVisibleVideoCount += 1;
    else sources.push(candidate.currentSrc);
  }

  return { sources, contributionRatios, visibleVideoCount, emptyVisibleVideoCount };
}

async function verifyComparisonTarget(browser, target) {
  const comparisonPaths = Array.isArray(target?.comparisonPaths) ? target.comparisonPaths : [];
  const expectedVideoPaths = Array.isArray(target?.expectedVideoPaths) ? target.expectedVideoPaths : [];
  const expectedUrls = new Set(expectedVideoPaths.map((file) => pathToFileURL(file).href));
  const observedUrls = new Set();
  const findings = [];

  // Untrusted comparison HTML is evidence, not executable authority. Page script
  // execution is unnecessary for the generated proof boards and would let the
  // artifact react to visibility probes.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, javaScriptEnabled: false });
  const analysisContext = await browser.newContext({ viewport: { width: CONTRIBUTION_SAMPLE_WIDTH, height: CONTRIBUTION_SAMPLE_HEIGHT } });
  const analysisPage = await analysisContext.newPage();
  await analysisPage.setContent('<!doctype html><html><body></body></html>');

  try {
    if (!comparisonPaths.length || !expectedUrls.size) {
      findings.push({ code: 'motion-proof-independent-comparison-target-invalid', message: 'Comparison visibility authority requires comparison HTML and the exact rendered WebM set.' });
      return { verified: false, findings };
    }

    for (const comparisonPath of comparisonPaths) {
      const page = await context.newPage();
      try {
        await fs.access(comparisonPath);
        await page.goto(pathToFileURL(comparisonPath).href, { waitUntil: 'load', timeout: 15_000 });
        const inspection = await inspectComparisonPage(page, context, analysisPage);
        if (inspection.visibleVideoCount === 0) findings.push({ code: 'motion-proof-independent-comparison-visible-video-missing', message: `Comparison HTML must present actual effectively visible video elements contributing at least ${(MIN_PIXEL_CONTRIBUTION_RATIO * 100).toFixed(0)}% of their review rectangle when each candidate is brought into view.`, comparisonRef: comparisonPath });
        if (inspection.emptyVisibleVideoCount > 0) findings.push({ code: 'motion-proof-independent-comparison-visible-video-source-missing', message: 'Every effectively visible comparison video must resolve to one browser-selected currentSrc.', comparisonRef: comparisonPath });
        for (const source of inspection.sources) observedUrls.add(source);
      } catch (error) {
        findings.push({ code: 'motion-proof-independent-comparison-browser-error', message: `Comparison visibility verification failed: ${error?.message ?? 'unknown error'}`, comparisonRef: comparisonPath });
      } finally {
        await page.close();
      }
    }

    const missingUrls = [...expectedUrls].filter((url) => !observedUrls.has(url));
    const unexpectedUrls = [...observedUrls].filter((url) => !expectedUrls.has(url));
    if (missingUrls.length || unexpectedUrls.length) {
      findings.push({ code: 'motion-proof-independent-comparison-dom-coverage-mismatch', message: `Effectively visible browser-selected comparison media must exactly match the rendered WebM set (missing ${missingUrls.length}, unexpected ${unexpectedUrls.length}).` });
    }
  } finally {
    await analysisContext.close();
    await context.close();
  }

  return { verified: findings.length === 0, findings };
}

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Comparison visibility verifier input path is required.');
const payload = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const targets = Array.isArray(payload.targets) ? payload.targets : [];
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const target of targets) results.push(await verifyComparisonTarget(browser, target));
} finally {
  await browser.close();
}
const findings = results.flatMap((result) => result.findings);
process.stdout.write(JSON.stringify({ verified: targets.length > 0 && findings.length === 0, results, findings }));
