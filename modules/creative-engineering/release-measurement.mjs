import fs from 'node:fs/promises';
import { DEFAULT_VIEWPORTS } from './web-stack.mjs';

const round = (value, digits = 1) => Number.isFinite(value)
  ? Math.round(value * (10 ** digits)) / (10 ** digits)
  : null;

function viewportById(id = 'desktop') {
  return DEFAULT_VIEWPORTS.find((item) => item.id === id) ?? DEFAULT_VIEWPORTS.at(-1);
}

function releaseProbeInit() {
  const supported = new Set(globalThis.PerformanceObserver?.supportedEntryTypes ?? []);
  const state = {
    supported: [...supported],
    lcpMs: null,
    cls: 0,
    longTasks: 0,
    longTaskMs: 0
  };
  globalThis.__AI_STUDIO_RELEASE_PROBE__ = state;

  const observe = (type, callback) => {
    if (!supported.has(type)) return;
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries()));
      observer.observe({ type, buffered: true });
    } catch {
      // Unsupported observer configuration stays visible through the measured flag.
    }
  };

  observe('largest-contentful-paint', (entries) => {
    for (const entry of entries) state.lcpMs = entry.renderTime || entry.loadTime || entry.startTime || state.lcpMs;
  });

  observe('layout-shift', (entries) => {
    for (const entry of entries) {
      if (!entry.hadRecentInput) state.cls += entry.value ?? 0;
    }
  });

  observe('longtask', (entries) => {
    for (const entry of entries) {
      state.longTasks += 1;
      state.longTaskMs += entry.duration ?? 0;
    }
  });
}

function a11yIssue(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

async function auditDomAccessibility(page) {
  return page.evaluate(() => {
    const issues = [];
    const issue = (severity, code, message, evidence = {}) => issues.push({ severity, code, message, evidence });
    const visible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const labelledByText = (element) => {
      const ids = (element.getAttribute('aria-labelledby') ?? '').trim().split(/\s+/).filter(Boolean);
      return ids.map((id) => document.getElementById(id)?.textContent?.trim() ?? '').join(' ').trim();
    };
    const accessibleName = (element) => {
      const aria = element.getAttribute('aria-label')?.trim();
      if (aria) return aria;
      const labelled = labelledByText(element);
      if (labelled) return labelled;
      const title = element.getAttribute('title')?.trim();
      if (title) return title;
      if (element instanceof HTMLInputElement && ['button', 'submit', 'reset'].includes(element.type) && element.value.trim()) return element.value.trim();
      return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    };
    const hasFormLabel = (element) => {
      if (element.getAttribute('aria-label')?.trim() || labelledByText(element)) return true;
      if (element.closest('label')) return true;
      const id = element.id;
      if (!id) return false;
      return [...document.querySelectorAll('label[for]')].some((label) => label.getAttribute('for') === id && label.textContent?.trim());
    };

    if (!(document.documentElement.lang ?? '').trim()) {
      issue('major', 'document-language-missing', 'The document must declare a language.');
    }

    const ids = new Map();
    for (const element of document.querySelectorAll('[id]')) {
      const id = element.id;
      ids.set(id, (ids.get(id) ?? 0) + 1);
    }
    for (const [id, count] of ids) {
      if (count > 1) issue('major', 'duplicate-id', `Duplicate id '${id}' appears ${count} times.`, { id, count });
    }

    for (const element of document.querySelectorAll('button, a[href]')) {
      if (visible(element) && !accessibleName(element)) {
        issue('blocker', 'interactive-name-missing', `${element.tagName.toLowerCase()} is missing an accessible name.`, {
          tag: element.tagName.toLowerCase(),
          id: element.id || null
        });
      }
    }

    for (const element of document.querySelectorAll('input, textarea, select')) {
      if (visible(element) && !hasFormLabel(element)) {
        issue('major', 'form-label-missing', `${element.tagName.toLowerCase()} is missing a programmatic label.`, {
          id: element.id || null,
          type: element.getAttribute('type') || null
        });
      }
    }

    for (const image of document.querySelectorAll('img')) {
      if (visible(image) && !image.hasAttribute('alt')) {
        issue('major', 'image-alt-missing', 'Visible image is missing an alt attribute.', {
          src: image.getAttribute('src') || null
        });
      }
    }

    for (const frame of document.querySelectorAll('iframe')) {
      if (visible(frame) && !(frame.getAttribute('title') ?? '').trim()) {
        issue('major', 'iframe-title-missing', 'Visible iframe is missing a title.');
      }
    }

    for (const element of document.querySelectorAll('[tabindex]')) {
      const value = Number(element.getAttribute('tabindex'));
      if (Number.isFinite(value) && value > 0) {
        issue('major', 'positive-tabindex', 'Positive tabindex changes the natural keyboard order.', {
          tabindex: value,
          tag: element.tagName.toLowerCase()
        });
      }
    }

    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content')?.toLowerCase() ?? '';
    if (viewport.includes('user-scalable=no')) {
      issue('blocker', 'viewport-zoom-disabled', 'Viewport disables user zoom.');
    }

    const focusable = [...document.querySelectorAll('a[href], button, input, textarea, select, summary, [tabindex]')]
      .filter((element) => visible(element) && !element.matches(':disabled') && Number(element.getAttribute('tabindex') ?? 0) >= 0);

    return { issues, focusableCount: focusable.length };
  });
}

async function auditKeyboardPath(page, focusableCount, { maxSteps = 18 } = {}) {
  await page.evaluate(() => {
    const current = document.activeElement;
    if (current instanceof HTMLElement) current.blur();
    document.body.setAttribute('tabindex', '-1');
    document.body.focus({ preventScroll: true });
    document.body.removeAttribute('tabindex');
  });

  const observed = [];
  const steps = Math.min(Math.max(focusableCount, 1), maxSteps);
  for (let index = 0; index < steps; index += 1) {
    await page.keyboard.press('Tab');
    observed.push(await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      const style = getComputedStyle(element);
      const outlineWidth = Number.parseFloat(style.outlineWidth || '0');
      const outlineVisible = style.outlineStyle !== 'none' && outlineWidth >= 1;
      const shadowVisible = Boolean(style.boxShadow && style.boxShadow !== 'none');
      return {
        key: element.id || `${element.tagName.toLowerCase()}:${(element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 40)}`,
        indicatorVisible: outlineVisible || shadowVisible
      };
    }));
  }

  const actual = observed.filter(Boolean);
  const unique = new Set(actual.map((item) => item.key));
  const visibleIndicators = actual.filter((item) => item.indicatorVisible).length;
  const visibleRatio = actual.length ? visibleIndicators / actual.length : 1;
  const issues = [];

  if (focusableCount > 1 && unique.size < Math.min(3, focusableCount)) {
    issues.push(a11yIssue('blocker', 'keyboard-path-trapped', 'Keyboard traversal did not progress through the expected focus path.', {
      focusableCount,
      uniqueVisited: unique.size
    }));
  }

  if (actual.length && visibleRatio < 0.8) {
    issues.push(a11yIssue('major', 'focus-indicator-insufficient', 'Too many keyboard-focus states lack a visible outline or focus shadow.', {
      observed: actual.length,
      visibleIndicators,
      visibleRatio: round(visibleRatio, 3)
    }));
  }

  return {
    measured: true,
    focusableCount,
    visited: actual.length,
    uniqueVisited: unique.size,
    visibleIndicators,
    visibleRatio: round(visibleRatio, 3),
    issues
  };
}

async function sampleFrames(page, durationMs) {
  return page.evaluate(async (targetMs) => {
    const intervals = [];
    let previous = null;
    const start = performance.now();

    while (performance.now() - start < targetMs) {
      const timestamp = await new Promise((resolve) => requestAnimationFrame(resolve));
      if (previous !== null) intervals.push(timestamp - previous);
      previous = timestamp;
    }

    const stable = intervals.slice(2);
    if (!stable.length) return { fps: null, maxFrameMs: null, sampleFrames: 0 };
    const average = stable.reduce((sum, value) => sum + value, 0) / stable.length;
    return {
      fps: 1000 / average,
      maxFrameMs: Math.max(...stable),
      sampleFrames: stable.length
    };
  }, durationMs);
}

async function sampleInteraction(page, selector) {
  const target = page.locator(selector).first();
  if (await target.count() === 0) return null;

  await page.evaluate(() => {
    globalThis.__AI_STUDIO_RELEASE_PROBE__.interactionStart = performance.now();
  });
  await target.click({ timeout: 2500 });
  return page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return performance.now() - globalThis.__AI_STUDIO_RELEASE_PROBE__.interactionStart;
  });
}

async function measureReducedMotion(browser, url, viewport, options) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: options.waitUntil, timeout: options.timeoutMs });
    if (options.settleMs) await page.waitForTimeout(options.settleMs);
    return await page.evaluate(() => {
      const animations = document.getAnimations().map((animation) => {
        const timing = animation.effect?.getTiming?.() ?? {};
        const computed = animation.effect?.getComputedTiming?.() ?? {};
        const duration = Number(computed.duration ?? timing.duration ?? 0);
        const iterations = Number(timing.iterations ?? 1);
        return {
          playState: animation.playState,
          duration: Number.isFinite(duration) ? duration : 0,
          iterations
        };
      });
      const continuous = animations.filter((animation) =>
        animation.playState === 'running' && (animation.iterations === Infinity || animation.duration > 250)
      );
      return {
        measured: true,
        mediaQuery: matchMedia('(prefers-reduced-motion: reduce)').matches,
        animationCount: animations.length,
        continuousAnimations: continuous.length,
        pass: matchMedia('(prefers-reduced-motion: reduce)').matches && continuous.length === 0,
        method: 'chromium-reduced-motion-animation-inspection'
      };
    });
  } finally {
    await context.close();
  }
}

export function summarizeAccessibilityIssues(issues = []) {
  return {
    blockers: issues.filter((item) => item.severity === 'blocker').length,
    majors: issues.filter((item) => item.severity === 'major').length,
    minors: issues.filter((item) => item.severity === 'minor').length
  };
}

export function synthesizeReleaseDecision({ findings = [], evidence = {}, requiredEvidence = [] } = {}) {
  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const unmeasuredEvidence = [...new Set(requiredEvidence)].filter((key) => {
    const value = evidence[key];
    return !(value && typeof value === 'object' && value.measured !== false);
  });
  const status = blockers.length || unmeasuredEvidence.length ? 'blocked' : majors.length ? 'review' : 'ready';
  return {
    status,
    productionReady: status === 'ready',
    blockerCount: blockers.length,
    majorCount: majors.length,
    requiredEvidence: [...new Set(requiredEvidence)],
    unmeasuredEvidence
  };
}

export function decideVisualRegression(comparisons = [], { threshold = 0.015 } = {}) {
  if (!comparisons.length) {
    return {
      measured: true,
      status: 'baseline-seed',
      pass: true,
      threshold,
      maxChangedRatio: null,
      comparisons: []
    };
  }
  const maxChangedRatio = Math.max(...comparisons.map((item) => Number.isFinite(item.changedRatio) ? item.changedRatio : 1));
  return {
    measured: true,
    status: 'compared',
    pass: comparisons.every((item) => item.dimensionsMatch !== false && Number.isFinite(item.changedRatio) && item.changedRatio <= threshold),
    threshold,
    maxChangedRatio: round(maxChangedRatio, 4),
    comparisons
  };
}

export function measurementFindings({ accessibility } = {}) {
  return [...(accessibility?.issues ?? [])];
}

export async function measureReleaseEvidence({
  url,
  viewport = viewportById('desktop'),
  interactionSelector = '[data-release-probe]'
} = {}, options = {}) {
  if (!url) throw new Error('url is required');
  const resolved = {
    waitUntil: options.waitUntil ?? 'networkidle',
    timeoutMs: options.timeoutMs ?? 30000,
    settleMs: options.settleMs ?? 220,
    runtimeSampleMs: options.runtimeSampleMs ?? 720,
    headless: options.headless !== false
  };
  const playwright = options.playwright ?? await import('playwright');
  const browser = await playwright.chromium.launch({ headless: resolved.headless });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  await page.addInitScript(releaseProbeInit);

  try {
    await page.goto(url, { waitUntil: resolved.waitUntil, timeout: resolved.timeoutMs });
    if (resolved.settleMs) await page.waitForTimeout(resolved.settleMs);

    const dom = await auditDomAccessibility(page);
    const interactionMs = await sampleInteraction(page, interactionSelector);
    const runtimeSample = await sampleFrames(page, resolved.runtimeSampleMs);
    const keyboard = await auditKeyboardPath(page, dom.focusableCount);
    const probe = await page.evaluate(() => ({ ...globalThis.__AI_STUDIO_RELEASE_PROBE__ }));
    const memoryBytes = await page.evaluate(() => Number(globalThis.performance?.memory?.usedJSHeapSize ?? NaN));
    const reducedMotion = await measureReducedMotion(browser, url, viewport, resolved);

    const accessibilityIssues = [...dom.issues, ...keyboard.issues];
    const a11yCounts = summarizeAccessibilityIssues(accessibilityIssues);
    const webVitals = {
      measured: Number.isFinite(probe.lcpMs) && Number.isFinite(interactionMs) && Number.isFinite(probe.cls),
      lcpMs: round(probe.lcpMs, 1),
      inpMs: round(interactionMs, 1),
      cls: round(probe.cls, 4),
      method: {
        lcp: 'PerformanceObserver/largest-contentful-paint',
        inp: 'Playwright safe click to second animation frame lab proxy',
        cls: 'PerformanceObserver/layout-shift'
      },
      note: 'INP is a controlled lab interaction proxy, not field CrUX data.'
    };

    const runtime = {
      measured: Number.isFinite(runtimeSample.fps) && Number.isFinite(runtimeSample.maxFrameMs) && Number.isFinite(probe.longTasks),
      fps: round(runtimeSample.fps, 1),
      maxFrameMs: round(runtimeSample.maxFrameMs, 1),
      longTasks: probe.longTasks,
      longTaskMs: round(probe.longTaskMs, 1),
      sampleFrames: runtimeSample.sampleFrames,
      usedJsHeapMb: Number.isFinite(memoryBytes) ? round(memoryBytes / (1024 * 1024), 1) : null,
      method: 'requestAnimationFrame sample + PerformanceObserver/longtask'
    };

    const accessibility = {
      measured: true,
      ...a11yCounts,
      issues: accessibilityIssues,
      keyboard,
      method: 'DOM semantics + keyboard traversal + focus-indicator baseline',
      scope: 'Automated release baseline; not a substitute for a complete manual WCAG audit.'
    };

    return { webVitals, runtime, accessibility, reducedMotion };
  } finally {
    await context.close();
    await browser.close();
  }
}

async function comparePngBuffers(page, current, baseline, { sampleStride = 4, channelThreshold = 16 } = {}) {
  return page.evaluate(async ({ currentData, baselineData, sampleStride, channelThreshold }) => {
    const load = (src) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
    const [currentImage, baselineImage] = await Promise.all([
      load(`data:image/png;base64,${currentData}`),
      load(`data:image/png;base64,${baselineData}`)
    ]);

    const dimensionsMatch = currentImage.width === baselineImage.width && currentImage.height === baselineImage.height;
    if (!dimensionsMatch) {
      return {
        dimensionsMatch: false,
        width: currentImage.width,
        height: currentImage.height,
        baselineWidth: baselineImage.width,
        baselineHeight: baselineImage.height,
        changedRatio: 1
      };
    }

    const width = currentImage.width;
    const height = currentImage.height;
    const currentCanvas = document.createElement('canvas');
    const baselineCanvas = document.createElement('canvas');
    currentCanvas.width = baselineCanvas.width = width;
    currentCanvas.height = baselineCanvas.height = height;
    const currentContext = currentCanvas.getContext('2d', { willReadFrequently: true });
    const baselineContext = baselineCanvas.getContext('2d', { willReadFrequently: true });
    currentContext.drawImage(currentImage, 0, 0);
    baselineContext.drawImage(baselineImage, 0, 0);
    const currentPixels = currentContext.getImageData(0, 0, width, height).data;
    const baselinePixels = baselineContext.getImageData(0, 0, width, height).data;

    let changed = 0;
    let sampled = 0;
    for (let pixel = 0; pixel < width * height; pixel += sampleStride) {
      const offset = pixel * 4;
      const delta = Math.max(
        Math.abs(currentPixels[offset] - baselinePixels[offset]),
        Math.abs(currentPixels[offset + 1] - baselinePixels[offset + 1]),
        Math.abs(currentPixels[offset + 2] - baselinePixels[offset + 2]),
        Math.abs(currentPixels[offset + 3] - baselinePixels[offset + 3])
      );
      if (delta > channelThreshold) changed += 1;
      sampled += 1;
    }

    return {
      dimensionsMatch: true,
      width,
      height,
      sampledPixels: sampled,
      changedPixels: changed,
      changedRatio: sampled ? changed / sampled : 0
    };
  }, {
    currentData: current.toString('base64'),
    baselineData: baseline.toString('base64'),
    sampleStride,
    channelThreshold
  });
}

export async function compareVisualCaptureFiles(currentCaptures = [], baselineCaptures = [], options = {}) {
  const threshold = options.threshold ?? 0.015;
  const current = currentCaptures.filter((item) => item.reducedMotion);
  const baseline = new Map(
    baselineCaptures.filter((item) => item.reducedMotion).map((item) => [item.viewport?.id, item])
  );

  if (!baseline.size) return decideVisualRegression([], { threshold });

  const playwright = options.playwright ?? await import('playwright');
  const browser = await playwright.chromium.launch({ headless: options.headless !== false });
  const page = await browser.newPage();
  const comparisons = [];

  try {
    for (const capture of current) {
      const viewportId = capture.viewport?.id;
      const previous = baseline.get(viewportId);
      if (!previous?.screenshot) {
        comparisons.push({ viewport: viewportId ?? 'unknown', dimensionsMatch: false, changedRatio: 1, missingBaseline: true });
        continue;
      }
      const [currentBuffer, baselineBuffer] = await Promise.all([
        fs.readFile(capture.screenshot),
        fs.readFile(previous.screenshot)
      ]);
      const compared = await comparePngBuffers(page, currentBuffer, baselineBuffer, options);
      comparisons.push({
        viewport: viewportId ?? 'unknown',
        ...compared,
        changedRatio: round(compared.changedRatio, 4)
      });
    }
  } finally {
    await browser.close();
  }

  return decideVisualRegression(comparisons, { threshold });
}
