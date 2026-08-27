import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

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

    video.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const viewportRect = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const ownRects = video.getClientRects();
    if (!ownRects.length) return { geometricallyVisible: false, sources: [] };
    const videoRect = video.getBoundingClientRect();
    if (!(videoRect.width > 0.5 && videoRect.height > 0.5)) return { geometricallyVisible: false, sources: [] };

    let visibleRect = intersect(videoRect, viewportRect);
    if (!positive(visibleRect)) return { geometricallyVisible: false, sources: [] };

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
        || !Number.isFinite(opacity)) return { geometricallyVisible: false, sources: [] };

      effectiveOpacity *= opacity;
      effectiveFilterOpacity *= parseFilterOpacity(style.filter);
      if (effectiveOpacity <= 0.001 || effectiveFilterOpacity <= 0.001) return { geometricallyVisible: false, sources: [] };

      if (node !== video) {
        const ancestorRect = node.getBoundingClientRect();
        const clipsX = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX);
        const clipsY = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowY);
        if (clipsX) visibleRect = { ...visibleRect, left: Math.max(visibleRect.left, ancestorRect.left), right: Math.min(visibleRect.right, ancestorRect.right) };
        if (clipsY) visibleRect = { ...visibleRect, top: Math.max(visibleRect.top, ancestorRect.top), bottom: Math.min(visibleRect.bottom, ancestorRect.bottom) };
        if (!positive(visibleRect)) return { geometricallyVisible: false, sources: [] };
      }
      node = node.parentElement;
    }

    if (!positive(visibleRect)) return { geometricallyVisible: false, sources: [] };

    const sources = [];
    if (video.hasAttribute('src') && video.getAttribute('src')?.trim()) sources.push(video.src);
    for (const source of video.querySelectorAll('source')) {
      if (source.hasAttribute('src') && source.getAttribute('src')?.trim()) sources.push(source.src);
    }

    return { geometricallyVisible: true, sources };
  }, filterOpacity.toString());
}

async function videoContributesRenderedPixels(page, index) {
  const locator = page.locator('video').nth(index);
  const originalOpacity = await locator.evaluate((video) => ({
    value: video.style.getPropertyValue('opacity'),
    priority: video.style.getPropertyPriority('opacity')
  }));

  const shown = await locator.screenshot({ type: 'png', animations: 'disabled' });
  try {
    // Opacity preserves geometry and the exact screenshot rectangle. If an opaque
    // overlay fully occludes the candidate, removing only the video's paint does
    // not alter the rendered pixels and the candidate cannot satisfy authority.
    await locator.evaluate((video) => video.style.setProperty('opacity', '0', 'important'));
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const hidden = await locator.screenshot({ type: 'png', animations: 'disabled' });
    return !shown.equals(hidden);
  } finally {
    await locator.evaluate((video, original) => {
      if (!original.value) video.style.removeProperty('opacity');
      else video.style.setProperty('opacity', original.value, original.priority || '');
    }, originalOpacity);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  }
}

async function inspectComparisonPage(page) {
  const sources = [];
  let visibleVideoCount = 0;
  let emptyVisibleVideoCount = 0;
  const videoCount = await page.locator('video').count();

  for (let index = 0; index < videoCount; index += 1) {
    const candidate = await inspectVideoCandidate(page, index);
    if (!candidate.geometricallyVisible) continue;
    if (!await videoContributesRenderedPixels(page, index)) continue;

    visibleVideoCount += 1;
    if (!candidate.sources.length) emptyVisibleVideoCount += 1;
    sources.push(...candidate.sources);
  }

  return { sources, visibleVideoCount, emptyVisibleVideoCount };
}

async function verifyComparisonTarget(browser, target) {
  const comparisonPaths = Array.isArray(target?.comparisonPaths) ? target.comparisonPaths : [];
  const expectedVideoPaths = Array.isArray(target?.expectedVideoPaths) ? target.expectedVideoPaths : [];
  const expectedUrls = new Set(expectedVideoPaths.map((file) => pathToFileURL(file).href));
  const observedUrls = new Set();
  const findings = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });

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
        const inspection = await inspectComparisonPage(page);
        if (inspection.visibleVideoCount === 0) findings.push({ code: 'motion-proof-independent-comparison-visible-video-missing', message: 'Comparison HTML must present actual effectively visible, pixel-contributing video elements when each candidate is brought into review view.', comparisonRef: comparisonPath });
        if (inspection.emptyVisibleVideoCount > 0) findings.push({ code: 'motion-proof-independent-comparison-visible-video-source-missing', message: 'Every effectively visible comparison video must resolve to a concrete media source.', comparisonRef: comparisonPath });
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
      findings.push({ code: 'motion-proof-independent-comparison-dom-coverage-mismatch', message: `Effectively visible comparison media must exactly match the rendered WebM set (missing ${missingUrls.length}, unexpected ${unexpectedUrls.length}).` });
    }
  } finally {
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