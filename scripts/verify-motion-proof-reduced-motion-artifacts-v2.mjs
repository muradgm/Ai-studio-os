import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 32;
const MAX_VISUAL_MEAN_DELTA = 5;
const MAX_VISUAL_OUTLIER_SHARE = 0.01;
const MAX_FRAME_COUNT_DELTA = 4;
const TERMINAL_WINDOW_SECONDS = 0.28;
const TERMINAL_SAMPLE_COUNT = 5;
const TERMINAL_QUORUM_RATIO = 0.6;

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  }
  return value;
}

function sameContract(left, right) {
  return JSON.stringify(canonicalValue(left)) === JSON.stringify(canonicalValue(right));
}

function traceContract(trace = []) {
  return (Array.isArray(trace) ? trace : []).map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const { at: _at, ...rest } = entry;
    return canonicalValue(rest);
  });
}

function visualDistance(left = [], right = []) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || left.length === 0) {
    return { meanDelta: Infinity, outlierShare: 1 };
  }
  let total = 0;
  let channels = 0;
  let outliers = 0;
  const pixelCount = left.length / 4;
  for (let index = 0; index < left.length; index += 4) {
    const dr = Math.abs(left[index] - right[index]);
    const dg = Math.abs(left[index + 1] - right[index + 1]);
    const db = Math.abs(left[index + 2] - right[index + 2]);
    total += dr + dg + db;
    channels += 3;
    if (Math.max(dr, dg, db) > 32) outliers += 1;
  }
  return {
    meanDelta: channels ? total / channels : Infinity,
    outlierShare: pixelCount ? outliers / pixelCount : 1
  };
}

function visuallyBound(distance) {
  return distance.meanDelta <= MAX_VISUAL_MEAN_DELTA && distance.outlierShare <= MAX_VISUAL_OUTLIER_SHARE;
}

async function imageSignature(page, pngBytes) {
  const dataUrl = `data:image/png;base64,${pngBytes.toString('base64')}`;
  return page.evaluate(async ({ dataUrl, width, height }) => {
    const image = new Image();
    image.src = dataUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('image decode error'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      pixels: Array.from(context.getImageData(0, 0, width, height).data)
    };
  }, { dataUrl, width: SAMPLE_WIDTH, height: SAMPLE_HEIGHT });
}

async function startIndependentFrameCounter(context, page) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  const { frameTree } = await cdp.send('Page.getFrameTree');
  const { executionContextId } = await cdp.send('Page.createIsolatedWorld', {
    frameId: frameTree.frame.id,
    worldName: `motion-proof-reduced-v2-${Date.now()}`,
    grantUniveralAccess: false
  });
  await cdp.send('Runtime.evaluate', {
    contextId: executionContextId,
    expression: `(() => {
      globalThis.__motionReducedVerifierFrameCount = 0;
      globalThis.__motionReducedVerifierCounting = true;
      const tick = () => {
        if (!globalThis.__motionReducedVerifierCounting) return;
        globalThis.__motionReducedVerifierFrameCount += 1;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    })()`,
    returnByValue: true
  });
  return { cdp, executionContextId };
}

async function stopIndependentFrameCounter(counter) {
  if (!counter) return null;
  const response = await counter.cdp.send('Runtime.evaluate', {
    contextId: counter.executionContextId,
    expression: `(() => {
      globalThis.__motionReducedVerifierCounting = false;
      return globalThis.__motionReducedVerifierFrameCount;
    })()`,
    returnByValue: true
  });
  return Number(response?.result?.value);
}

async function waitForMediaMetadata(page, selector) {
  return page.locator(selector).evaluate(async (media) => {
    if (media.readyState < 1) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('media metadata timeout')), 10_000);
        media.addEventListener('loadedmetadata', () => { clearTimeout(timer); resolve(); }, { once: true });
        media.addEventListener('error', () => { clearTimeout(timer); reject(new Error('media decode error')); }, { once: true });
      });
    }
    return {
      readyState: media.readyState,
      duration: Number.isFinite(media.duration) ? media.duration : null,
      videoWidth: media.videoWidth ?? null,
      videoHeight: media.videoHeight ?? null
    };
  });
}

async function decodedVideoFramesAtTimes(page, selector, requestedTimes = []) {
  return page.locator(selector).evaluate(async (video, { width, height, requestedTimes }) => {
    video.muted = true;
    const samples = [];
    for (const requestedTime of requestedTimes) {
      if (!Number.isFinite(requestedTime)) continue;
      const targetTime = Math.max(0.01, Math.min(requestedTime, Math.max(0.01, video.duration - 0.01)));
      if (Math.abs(video.currentTime - targetTime) >= 0.001 || video.readyState < 2) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('video seek timeout')), 10_000);
          const done = () => { clearTimeout(timer); resolve(); };
          const fail = () => { clearTimeout(timer); reject(new Error('video seek decode error')); };
          video.addEventListener('seeked', done, { once: true });
          video.addEventListener('error', fail, { once: true });
          video.currentTime = targetTime;
        });
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(video, 0, 0, width, height);
      samples.push({ targetTime, pixels: Array.from(context.getImageData(0, 0, width, height).data) });
    }
    return samples;
  }, { width: SAMPLE_WIDTH, height: SAMPLE_HEIGHT, requestedTimes });
}

function terminalTimes(duration) {
  if (!(duration > 0)) return [];
  const finalTime = Math.max(0.01, duration - 0.01);
  const window = Math.min(TERMINAL_WINDOW_SECONDS, Math.max(0, finalTime - 0.01));
  const times = [];
  for (let index = TERMINAL_SAMPLE_COUNT - 1; index >= 0; index -= 1) {
    const ratio = TERMINAL_SAMPLE_COUNT === 1 ? 0 : index / (TERMINAL_SAMPLE_COUNT - 1);
    times.push(Math.max(0.01, finalTime - window * ratio));
  }
  times.push(finalTime);
  return [...new Set(times.map((time) => Number(time.toFixed(4))))].sort((a, b) => a - b);
}

async function verifyReducedMotionTarget(browser, target) {
  const planned = target?.planned ?? {};
  const timelineContract = target?.timelineContract ?? {};
  const viewport = planned.viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1100, height: 720 };
  const findings = [];
  const context = await browser.newContext({
    viewport,
    hasTouch: false,
    isMobile: planned.viewport === 'mobile',
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  let counter = null;

  try {
    if (planned.input !== 'reduced-motion') {
      findings.push({ code: 'motion-proof-reduced-authority-target-invalid', message: 'Reduced-motion authority verifier only accepts explicitly planned reduced-motion studies.' });
      return { studyId: planned.id ?? null, verified: false, findings };
    }
    if (!sameContract(timelineContract.viewport ?? null, viewport)) findings.push({ code: 'motion-proof-independent-timeline-viewport-mismatch', message: 'Claimed reduced-motion viewport does not match the independent browser context.' });
    if (timelineContract.reducedMotionMedia !== true) findings.push({ code: 'motion-proof-independent-timeline-reduced-motion-mismatch', message: 'Reduced-motion timeline must be recorded under prefers-reduced-motion: reduce.' });

    await page.goto(pathToFileURL(target.sourcePath).href, { waitUntil: 'load', timeout: 15_000 });
    const domStudyId = await page.locator('[data-study]').first().getAttribute('data-study').catch(() => null);
    if (domStudyId !== planned.id) findings.push({ code: 'motion-proof-independent-source-dom-binding-mismatch', message: 'Reduced-motion replay DOM is not bound to the planned study.' });

    counter = await startIndependentFrameCounter(context, page);
    await page.waitForFunction(() => window.__motionCreativeProof?.startedAt !== null, null, { timeout: 15_000 });
    await page.waitForFunction(() => window.__motionCreativeProof?.done === true, null, { timeout: 15_000 });
    const independentlyObservedFrameCount = await stopIndependentFrameCounter(counter);
    counter = null;
    const replay = await page.evaluate(() => structuredClone(window.__motionCreativeProof));

    if (replay?.sourceStudyId !== planned.id || replay?.studyId !== planned.id) findings.push({ code: 'motion-proof-independent-source-study-mismatch', message: 'Reduced-motion replay did not execute the planned source identity.' });
    if (replay?.reducedMotionMedia !== true) findings.push({ code: 'motion-proof-independent-reduced-motion-media-mismatch', message: 'Independent reduced-motion replay did not execute under reduced-motion media.' });
    if (!sameContract(replay?.appliedCreativeIntent ?? null, planned.creativeIntent ?? null)) findings.push({ code: 'motion-proof-independent-source-intent-mismatch', message: 'Reduced-motion replay did not apply the planned creative intent.' });
    if (!(replay?.completedAt > replay?.startedAt) || !(replay?.frameCount > 1)) findings.push({ code: 'motion-proof-independent-source-temporal-invalid', message: 'Reduced-motion replay did not execute a positive browser timeline.' });

    const claimedFrameCount = Number(timelineContract.animationFrameCount);
    if (!Number.isInteger(claimedFrameCount)
      || claimedFrameCount <= 1
      || !Number.isInteger(independentlyObservedFrameCount)
      || independentlyObservedFrameCount <= 1
      || Math.abs(independentlyObservedFrameCount - claimedFrameCount) > MAX_FRAME_COUNT_DELTA) {
      findings.push({ code: 'motion-proof-independent-timeline-frame-count-mismatch', message: `Claimed reduced-motion frame count must match the isolated-world counter within ±${MAX_FRAME_COUNT_DELTA} frames (claimed ${claimedFrameCount}, independently observed ${independentlyObservedFrameCount}).` });
    }

    if (!sameContract(traceContract(replay?.trace ?? []), traceContract(timelineContract.trace ?? []))) findings.push({ code: 'motion-proof-independent-timeline-trace-mismatch', message: 'Reduced-motion timeline trace does not match the independently replayed event contract.' });
    const replayDurationMs = Number(replay?.completedAt) - Number(replay?.startedAt);
    if (!(timelineContract.durationMs > 0) || !(replayDurationMs > 0) || Math.abs(replayDurationMs - timelineContract.durationMs) > 300) findings.push({ code: 'motion-proof-independent-timeline-duration-mismatch', message: 'Reduced-motion timeline duration is inconsistent with independent replay.' });

    const replayPng = await page.screenshot({ type: 'png' });
    const replaySignature = await imageSignature(page, replayPng);
    const captureBytes = await fs.readFile(target.capturePath);
    const captureSignature = await imageSignature(page, captureBytes);
    if (captureSignature.width !== viewport.width || captureSignature.height !== viewport.height) findings.push({ code: 'motion-proof-independent-capture-viewport-mismatch', message: 'Reduced-motion PNG dimensions do not match the planned viewport.' });
    const captureDistance = visualDistance(replaySignature.pixels, captureSignature.pixels);
    if (!visuallyBound(captureDistance)) findings.push({ code: 'motion-proof-independent-capture-replay-mismatch', message: `Reduced-motion end frame is not bound to independent replay (mean delta ${captureDistance.meanDelta.toFixed(2)}, outlier share ${captureDistance.outlierShare.toFixed(4)}).` });

    const videoBytes = await fs.readFile(target.videoPath);
    const videoDataUrl = `data:video/webm;base64,${videoBytes.toString('base64')}`;
    await page.setContent('<!doctype html><video id="proof-video" muted playsinline preload="auto"></video>', { waitUntil: 'load' });
    await page.locator('#proof-video').evaluate((video, src) => { video.src = src; video.load(); }, videoDataUrl);
    const media = await waitForMediaMetadata(page, '#proof-video');
    if (!(media.videoWidth > 0) || !(media.videoHeight > 0) || !(media.duration > 0) || media.readyState < 1) {
      findings.push({ code: 'motion-proof-independent-video-decode-invalid', message: 'Reduced-motion WebM must decode as non-empty browser evidence.' });
    } else {
      if (media.videoWidth !== viewport.width || media.videoHeight !== viewport.height) findings.push({ code: 'motion-proof-independent-video-viewport-mismatch', message: 'Reduced-motion WebM dimensions do not match the planned viewport.' });
      const videoDurationMs = media.duration * 1000;
      if (timelineContract.durationMs > 0 && (videoDurationMs < timelineContract.durationMs * 0.75 || videoDurationMs > timelineContract.durationMs + 5000)) findings.push({ code: 'motion-proof-independent-video-duration-mismatch', message: 'Reduced-motion WebM duration is not plausibly bound to the claimed browser timeline.' });

      const anchors = await decodedVideoFramesAtTimes(page, '#proof-video', terminalTimes(media.duration));
      const scored = anchors.map((sample) => ({ ...sample, distance: visualDistance(captureSignature.pixels, sample.pixels) }));
      const terminal = scored[scored.length - 1] ?? null;
      const boundCount = scored.filter((sample) => visuallyBound(sample.distance)).length;
      const requiredBoundCount = Math.max(1, Math.ceil(scored.length * TERMINAL_QUORUM_RATIO));
      if (!terminal || !visuallyBound(terminal.distance) || boundCount < requiredBoundCount) {
        findings.push({
          code: 'motion-proof-independent-video-replay-mismatch',
          message: `Reduced-motion WebM terminal state must bind to independent replay at the final decodable frame and across a sustained terminal-window quorum (${boundCount}/${scored.length} bound; ${requiredBoundCount} required).`
        });
      }
    }
  } catch (error) {
    findings.push({ code: 'motion-proof-independent-browser-replay-error', message: `Reduced-motion authority verification failed: ${error?.message ?? 'unknown error'}` });
  } finally {
    if (counter) {
      try { await stopIndependentFrameCounter(counter); } catch {}
    }
    await context.close();
  }

  return { studyId: planned.id ?? null, verified: findings.length === 0, findings };
}

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Reduced-motion verifier input path is required.');
const payload = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const targets = Array.isArray(payload.targets) ? payload.targets : [];
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const target of targets) results.push(await verifyReducedMotionTarget(browser, target));
} finally {
  await browser.close();
}
const findings = results.flatMap((result) => result.findings.map((item) => ({ ...item, studyId: result.studyId ?? null })));
process.stdout.write(JSON.stringify({ verified: targets.length > 0 && findings.length === 0, results, findings }));