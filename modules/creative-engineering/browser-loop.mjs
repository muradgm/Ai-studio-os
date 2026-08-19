import fs from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_VIEWPORTS } from './web-stack.mjs';

function safeSlug(value) {
  return String(value ?? 'capture').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'capture';
}

export function createCapturePlan({ baseUrl, routes = ['/'], viewports = DEFAULT_VIEWPORTS, reducedMotion = [false, true] } = {}) {
  if (!baseUrl) throw new Error('baseUrl is required');
  const targets = [];
  for (const route of routes) {
    for (const viewport of viewports) {
      for (const reduce of reducedMotion) {
        targets.push({
          id: `${safeSlug(route)}-${viewport.id}-${reduce ? 'reduced' : 'full'}`,
          url: new URL(route, baseUrl).toString(),
          viewport: { ...viewport },
          reducedMotion: reduce
        });
      }
    }
  }
  return { baseUrl, targets };
}

export async function captureWithPlaywright(plan, options = {}) {
  const outputDir = options.outputDir ?? path.resolve('artifacts/browser-captures');
  const playwright = options.playwright ?? await import('playwright');
  const browser = await playwright.chromium.launch({ headless: options.headless !== false });
  const captures = [];
  await fs.mkdir(outputDir, { recursive: true });

  try {
    for (const target of plan.targets ?? []) {
      const context = await browser.newContext({
        viewport: { width: target.viewport.width, height: target.viewport.height },
        deviceScaleFactor: target.viewport.deviceScaleFactor ?? 1,
        reducedMotion: target.reducedMotion ? 'reduce' : 'no-preference'
      });
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', (error) => pageErrors.push(error.message));

      const response = await page.goto(target.url, { waitUntil: options.waitUntil ?? 'networkidle', timeout: options.timeoutMs ?? 30000 });
      if (options.settleMs) await page.waitForTimeout(options.settleMs);
      const file = path.join(outputDir, `${safeSlug(target.id)}.png`);
      await page.screenshot({ path: file, fullPage: options.fullPage ?? true });
      const documentState = await page.evaluate(() => ({
        title: document.title,
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        bodyOverflowX: getComputedStyle(document.body).overflowX,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches
      }));
      captures.push({
        id: target.id,
        url: target.url,
        status: response?.status() ?? null,
        screenshot: file,
        viewport: target.viewport,
        reducedMotion: target.reducedMotion,
        documentState,
        consoleErrors,
        pageErrors,
        pass: (response?.ok() ?? true) && !consoleErrors.length && !pageErrors.length
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return { stage: 'browser-capture', captures, pass: captures.every((capture) => capture.pass) };
}

export function buildResponsiveEvidence(captures = []) {
  const result = {};
  for (const capture of captures) {
    const id = capture.viewport?.id;
    if (!id || capture.reducedMotion) continue;
    const overflow = capture.documentState?.width > (capture.viewport?.width ?? Infinity) + 1;
    result[id] = {
      pass: capture.pass && !overflow,
      overflow,
      screenshot: capture.screenshot,
      pageErrors: capture.pageErrors,
      consoleErrors: capture.consoleErrors
    };
  }
  return result;
}
