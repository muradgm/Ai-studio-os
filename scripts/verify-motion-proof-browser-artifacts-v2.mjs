import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 32;
const MAX_VISUAL_MEAN_DELTA = 5;
const MAX_VISUAL_OUTLIER_SHARE = 0.01;
const MAX_TEMPORAL_VISUAL_MEAN_DELTA = 5;
const MAX_TEMPORAL_VISUAL_OUTLIER_SHARE = 0.03;
const MAX_FRAME_COUNT_DELTA = 4;
const VIDEO_SAMPLE_STEP_SECONDS = 0.04;
const VIDEO_LEAD_SECONDS = 0.75;
const MIN_TEMPORAL_MATCHES = 4;
const MIN_TEMPORAL_COVERAGE = 0.18;
const MIN_TEMPORAL_SPAN_SECONDS = 0.12;
const MIN_VISIBLE_MOTION_MEAN_DELTA = 0.75;
const MIN_VISIBLE_MOTION_OUTLIER_SHARE = 0.001;

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

function temporallyBound(distance) {
  return distance.meanDelta <= MAX_TEMPORAL_VISUAL_MEAN_DELTA
    && distance.outlierShare <= MAX_TEMPORAL_VISUAL_OUTLIER_SHARE;
}

function visiblyDifferent(distance) {
  return distance.meanDelta >= MIN_VISIBLE_MOTION_MEAN_DELTA
    || distance.outlierShare >= MIN_VISIBLE_MOTION_OUTLIER_SHARE;
}

function contextOptions(planned, viewport, recordVideoDir = null) {
  return {
    viewport,
    hasTouch: planned.input === 'touch',
    isMobile: planned.viewport === 'mobile',
    reducedMotion: planned.input === 'reduced-motion' ? 'reduce' : 'no-preference',
    ...(recordVideoDir ? { recordVideo: { dir: recordVideoDir, size: viewport } } : {})
  };
}

async function applyPlannedInput(page, planned) {
  if (planned.input === 'pointer') await page.click('[data-interaction-target]', { timeout: 5_000 });
  if (planned.input === 'touch') await page.tap('[data-interaction-target]', { timeout: 5_000 });
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
    worldName: `motion-proof-verifier-${Date.now()}`,
    grantUniveralAccess: false
  });
  await cdp.send('Runtime.evaluate', {
    contextId: executionContextId,
    expression: `(() => {
      globalThis.__motionVerifierFrameCount = 0;
      globalThis.__motionVerifierFrameCounting = true;
      const tick = () => {
        if (!globalThis.__motionVerifierFrameCounting) return;
        globalThis.__motionVerifierFrameCount += 1;
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
      globalThis.__motionVerifierFrameCounting = false;
      return globalThis.__motionVerifierFrameCount;
    })()`,
    returnByValue: true
  });
  return Number(response?.result?.value);
}

async function replaySourceState(browser, target, planned, viewport) {
  const context = await browser.newContext(contextOptions(planned, viewport));
  const page = await context.newPage();
  let frameCounter = null;
  try {
    await page.goto(pathToFileURL(target.sourcePath).href, { waitUntil: 'load', timeout: 15_000 });
    const domStudyId = await page.locator('[data-study]').first().getAttribute('data-study').catch(() => null);
    frameCounter = await startIndependentFrameCounter(context, page);
    await applyPlannedInput(page, planned);
    await page.waitForFunction(() => window.__motionCreativeProof?.startedAt !== null, null, { timeout: 15_000 });
    await page.waitForFunction(() => window.__motionCreativeProof?.done === true, null, { timeout: 15_000 });
    const independentlyObservedFrameCount = await stopIndependentFrameCounter(frameCounter);
    frameCounter = null;
    const state = await page.evaluate(() => structuredClone(window.__motionCreativeProof));
    const finalPng = await page.screenshot({ type: 'png' });
    return { domStudyId, independentlyObservedFrameCount, state, finalPng };
  } finally {
    if (frameCounter) {
      try { await stopIndependentFrameCounter(frameCounter); } catch {}
    }
    await context.close();
  }
}

async function recordIndependentReplayVideo(browser, target, planned, viewport) {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-motion-video-replay-'));
  let context = null;
  try {
    context = await browser.newContext(contextOptions(planned, viewport, tempRoot));
    const page = await context.newPage();
    await page.goto(pathToFileURL(target.sourcePath).href, { waitUntil: 'load', timeout: 15_000 });
    const domStudyId = await page.locator('[data-study]').first().getAttribute('data-study').catch(() => null);
    await applyPlannedInput(page, planned);
    await page.waitForFunction(() => window.__motionCreativeProof?.startedAt !== null, null, { timeout: 15_000 });
    await page.waitForFunction(() => window.__motionCreativeProof?.done === true, null, { timeout: 15_000 });
    const state = await page.evaluate(() => structuredClone(window.__motionCreativeProof));
    const video = page.video();
    if (!video) throw new Error('independent replay video was not created');
    await context.close();
    context = null;
    const videoPath = await video.path();
    const bytes = await fs.readFile(videoPath);
    return { bytes, state, domStudyId };
  } finally {
    if (context) {
      try { await context.close(); } catch {}
    }
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
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

async function loadVideoBytes(page, selector, bytes) {
  const dataUrl = `data:video/webm;base64,${bytes.toString('base64')}`;
  await page.locator(selector).evaluate((video, src) => {
    video.src = src;
    video.load();
  }, dataUrl);
  return waitForMediaMetadata(page, selector);
}

async function decodedVideoFramesAtTimes(page, selector, requestedTimes = []) {
  return page.locator(selector).evaluate(async (video, { width, height, requestedTimes }) => {
    video.muted = true;
    const samples = [];
    const seek = async (targetTime) => {
      const clamped = Math.max(0.01, Math.min(targetTime, Math.max(0.01, video.duration - 0.01)));
      if (Math.abs(video.currentTime - clamped) >= 0.001 || video.readyState < 2) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('video seek timeout')), 10_000);
          const done = () => { clearTimeout(timer); resolve(); };
          const fail = () => { clearTimeout(timer); reject(new Error('video seek decode error')); };
          video.addEventListener('seeked', done, { once: true });
          video.addEventListener('error', fail, { once: true });
          video.currentTime = clamped;
        });
      }
      if (video.readyState < 2) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('video frame decode timeout')), 10_000);
          video.addEventListener('loadeddata', () => { clearTimeout(timer); resolve(); }, { once: true });
          video.addEventListener('error', () => { clearTimeout(timer); reject(new Error('video frame decode error')); }, { once: true });
        });
      }
      return clamped;
    };

    for (const requestedTime of requestedTimes) {
      if (!Number.isFinite(requestedTime)) continue;
      const targetTime = await seek(requestedTime);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(video, 0, 0, width, height);
      samples.push({
        requestedTime,
        targetTime,
        pixels: Array.from(context.getImageData(0, 0, width, height).data)
      });
    }
    return samples;
  }, { width: SAMPLE_WIDTH, height: SAMPLE_HEIGHT, requestedTimes });
}

function endAnchorTimes(duration) {
  return [0.7, 0.5, 0.35, 0.22, 0.12, 0.05]
    .map((offset) => duration - offset)
    .filter((time) => time > 0.01 && time < duration);
}

async function bestFinalAnchor(page, selector, media, finalPixels) {
  const samples = await decodedVideoFramesAtTimes(page, selector, endAnchorTimes(media.duration));
  if (!samples.length) return null;
  const scored = samples.map((sample) => ({
    ...sample,
    distance: visualDistance(finalPixels, sample.pixels)
  }));
  const earliestVerifiedTerminal = scored
    .filter((sample) => visuallyBound(sample.distance))
    .sort((left, right) => left.targetTime - right.targetTime)[0];
  if (earliestVerifiedTerminal) return earliestVerifiedTerminal;
  return scored.sort((left, right) => left.distance.meanDelta - right.distance.meanDelta
    || left.distance.outlierShare - right.distance.outlierShare)[0];
}

function temporalTimes(anchorTime, durationSeconds) {
  const windowStart = Math.max(0.01, anchorTime - durationSeconds - VIDEO_LEAD_SECONDS);
  const windowEnd = Math.max(windowStart, anchorTime);
  const times = [];
  for (let time = windowStart; time <= windowEnd + 0.0001; time += VIDEO_SAMPLE_STEP_SECONDS) times.push(time);
  if (!times.length || times[times.length - 1] < windowEnd - 0.005) times.push(windowEnd);
  return times;
}

function sequenceProgressive(samples) {
  for (let left = 0; left < samples.length; left += 1) {
    for (let right = left + 1; right < samples.length; right += 1) {
      if (visiblyDifferent(visualDistance(samples[left].pixels, samples[right].pixels))) return true;
    }
  }
  return false;
}

function matchedProgression(samples, matches, indexKey) {
  const matchedSamples = matches.map((match) => samples[match[indexKey]]).filter(Boolean);
  return sequenceProgressive(matchedSamples);
}

function orderedVideoBinding(submittedSamples, independentSamples, requiredSpanSeconds, requireProgression) {
  const leftCount = submittedSamples.length;
  const rightCount = independentSamples.length;
  if (!leftCount || !rightCount) {
    return { verified: false, matches: [], leftSpan: 0, rightSpan: 0, leftProgressive: false, rightProgressive: false, requiredMatches: MIN_TEMPORAL_MATCHES };
  }

  const scores = Array.from({ length: leftCount + 1 }, () => new Uint16Array(rightCount + 1));
  for (let left = 1; left <= leftCount; left += 1) {
    for (let right = 1; right <= rightCount; right += 1) {
      const distance = visualDistance(submittedSamples[left - 1].pixels, independentSamples[right - 1].pixels);
      const diagonal = temporallyBound(distance) ? scores[left - 1][right - 1] + 1 : 0;
      scores[left][right] = Math.max(diagonal, scores[left - 1][right], scores[left][right - 1]);
    }
  }

  const matches = [];
  let left = leftCount;
  let right = rightCount;
  while (left > 0 && right > 0) {
    const distance = visualDistance(submittedSamples[left - 1].pixels, independentSamples[right - 1].pixels);
    if (temporallyBound(distance) && scores[left][right] === scores[left - 1][right - 1] + 1) {
      matches.push({ leftIndex: left - 1, rightIndex: right - 1, distance });
      left -= 1;
      right -= 1;
    } else if (scores[left - 1][right] >= scores[left][right - 1]) {
      left -= 1;
    } else {
      right -= 1;
    }
  }
  matches.reverse();

  const requiredMatches = Math.max(
    MIN_TEMPORAL_MATCHES,
    Math.ceil(Math.min(leftCount, rightCount) * MIN_TEMPORAL_COVERAGE)
  );
  const leftSpan = matches.length > 1
    ? submittedSamples[matches[matches.length - 1].leftIndex].targetTime - submittedSamples[matches[0].leftIndex].targetTime
    : 0;
  const rightSpan = matches.length > 1
    ? independentSamples[matches[matches.length - 1].rightIndex].targetTime - independentSamples[matches[0].rightIndex].targetTime
    : 0;
  const leftProgressive = matchedProgression(submittedSamples, matches, 'leftIndex');
  const rightProgressive = matchedProgression(independentSamples, matches, 'rightIndex');

  return {
    verified: matches.length >= requiredMatches
      && leftSpan >= requiredSpanSeconds
      && rightSpan >= requiredSpanSeconds
      && (!requireProgression || (leftProgressive && rightProgressive)),
    matches,
    leftSpan,
    rightSpan,
    leftProgressive,
    rightProgressive,
    requiredMatches
  };
}

async function verifyComparisonTarget(browser, target) {
  const comparisonPaths = Array.isArray(target.comparisonPaths) ? target.comparisonPaths : [];
  const expectedVideoPaths = Array.isArray(target.expectedVideoPaths) ? target.expectedVideoPaths : [];
  const expectedUrls = new Set(expectedVideoPaths.map((file) => pathToFileURL(file).href));
  const observedUrls = new Set();
  const findings = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });

  try {
    if (!comparisonPaths.length || !expectedUrls.size) {
      findings.push({ code: 'motion-proof-independent-comparison-target-invalid', message: 'Browser comparison verification requires comparison HTML and the exact rendered WebM set.' });
      return { studyId: null, verified: false, findings };
    }

    for (const comparisonPath of comparisonPaths) {
      const page = await context.newPage();
      try {
        await page.goto(pathToFileURL(comparisonPath).href, { waitUntil: 'load', timeout: 15_000 });
        const inspection = await page.evaluate(() => {
          const sources = [];
          let visibleVideoCount = 0;
          let emptyVisibleVideoCount = 0;
          const effectivelyVisible = (element) => {
            let node = element;
            let effectiveOpacity = 1;
            while (node && node.nodeType === Node.ELEMENT_NODE) {
              const style = getComputedStyle(node);
              const opacity = Number.parseFloat(style.opacity || '1');
              if (node.hidden
                || style.display === 'none'
                || style.visibility === 'hidden'
                || style.visibility === 'collapse'
                || style.contentVisibility === 'hidden'
                || !Number.isFinite(opacity)) return false;
              effectiveOpacity *= opacity;
              if (effectiveOpacity <= 0.001) return false;
              node = node.parentElement;
            }
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && element.getClientRects().length > 0;
          };
          for (const video of document.querySelectorAll('video')) {
            if (!effectivelyVisible(video)) continue;
            visibleVideoCount += 1;
            const videoSources = [];
            if (video.hasAttribute('src') && video.getAttribute('src')?.trim()) videoSources.push(video.src);
            for (const source of video.querySelectorAll('source')) {
              if (source.hasAttribute('src') && source.getAttribute('src')?.trim()) videoSources.push(source.src);
            }
            if (!videoSources.length) emptyVisibleVideoCount += 1;
            sources.push(...videoSources);
          }
          return { sources, visibleVideoCount, emptyVisibleVideoCount };
        });
        if (inspection.visibleVideoCount === 0) findings.push({ code: 'motion-proof-independent-comparison-visible-video-missing', message: 'Comparison HTML must render actual effectively visible video elements in the browser.', comparisonRef: comparisonPath });
        if (inspection.emptyVisibleVideoCount > 0) findings.push({ code: 'motion-proof-independent-comparison-visible-video-source-missing', message: 'Every visible comparison video must resolve to a concrete media source.', comparisonRef: comparisonPath });
        for (const source of inspection.sources) observedUrls.add(source);
      } catch (error) {
        findings.push({ code: 'motion-proof-independent-comparison-browser-error', message: `Independent comparison DOM verification failed: ${error?.message ?? 'unknown error'}`, comparisonRef: comparisonPath });
      } finally {
        await page.close();
      }
    }

    const missingUrls = [...expectedUrls].filter((url) => !observedUrls.has(url));
    const unexpectedUrls = [...observedUrls].filter((url) => !expectedUrls.has(url));
    if (missingUrls.length || unexpectedUrls.length) {
      findings.push({ code: 'motion-proof-independent-comparison-dom-coverage-mismatch', message: `Visible browser comparison media must exactly match the rendered WebM set (missing ${missingUrls.length}, unexpected ${unexpectedUrls.length}).` });
    }
  } finally {
    await context.close();
  }

  return { studyId: null, verified: findings.length === 0, findings };
}

async function verifyStudyTarget(browser, target) {
  const planned = target.planned ?? {};
  const timelineContract = target.timelineContract ?? {};
  const viewport = planned.viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1100, height: 720 };
  const findings = [];

  try {
    if (!sameContract(timelineContract.viewport ?? null, viewport)) findings.push({ code: 'motion-proof-independent-timeline-viewport-mismatch', message: 'Claimed browser timeline viewport does not match the planned browser context.' });
    if (planned.input === 'reduced-motion' && timelineContract.reducedMotionMedia !== true) findings.push({ code: 'motion-proof-independent-timeline-reduced-motion-mismatch', message: 'Claimed reduced-motion timeline was not recorded under reduced-motion media.' });

    const sourceReplay = await replaySourceState(browser, target, planned, viewport);
    const replay = sourceReplay.state;
    if (sourceReplay.domStudyId !== planned.id) findings.push({ code: 'motion-proof-independent-source-dom-binding-mismatch', message: 'Replayed source DOM is not bound to the planned study.' });
    if (replay?.sourceStudyId !== planned.id || replay?.studyId !== planned.id) findings.push({ code: 'motion-proof-independent-source-study-mismatch', message: 'Independent browser replay did not execute the planned study identity.' });
    if (!sameContract(replay?.appliedCreativeIntent ?? null, planned.creativeIntent ?? null)) findings.push({ code: 'motion-proof-independent-source-intent-mismatch', message: 'Independent browser replay did not apply the planned creative intent.' });
    if (!(replay?.completedAt > replay?.startedAt) || !(replay?.frameCount > 1)) findings.push({ code: 'motion-proof-independent-source-temporal-invalid', message: 'Independent browser replay did not demonstrate positive temporal execution across multiple animation frames.' });
    if (planned.input === 'reduced-motion' && replay?.reducedMotionMedia !== true) findings.push({ code: 'motion-proof-independent-reduced-motion-media-mismatch', message: 'Independent browser replay did not execute under reduced-motion media.' });

    const claimedFrameCount = Number(timelineContract.animationFrameCount);
    if (!Number.isInteger(claimedFrameCount)
      || claimedFrameCount <= 1
      || !Number.isInteger(sourceReplay.independentlyObservedFrameCount)
      || sourceReplay.independentlyObservedFrameCount <= 1
      || Math.abs(sourceReplay.independentlyObservedFrameCount - claimedFrameCount) > MAX_FRAME_COUNT_DELTA) {
      findings.push({ code: 'motion-proof-independent-timeline-frame-count-mismatch', message: `Claimed animation frame count must match an isolated-world independent requestAnimationFrame counter within ±${MAX_FRAME_COUNT_DELTA} frames (claimed ${claimedFrameCount}, independently observed ${sourceReplay.independentlyObservedFrameCount}).` });
    }

    if (!sameContract(traceContract(replay?.trace ?? []), traceContract(timelineContract.trace ?? []))) {
      findings.push({ code: 'motion-proof-independent-timeline-trace-mismatch', message: 'Caller timeline trace does not match the independently replayed browser event contract.' });
    }
    const replayDurationMs = Number(replay?.completedAt) - Number(replay?.startedAt);
    if (!(timelineContract.durationMs > 0) || !(replayDurationMs > 0) || Math.abs(replayDurationMs - timelineContract.durationMs) > 300) {
      findings.push({ code: 'motion-proof-independent-timeline-duration-mismatch', message: 'Claimed timeline duration is not consistent with independently replayed browser execution.' });
    }

    const decodeContext = await browser.newContext({ viewport });
    const decodePage = await decodeContext.newPage();
    try {
      const replaySignature = await imageSignature(decodePage, sourceReplay.finalPng);
      const captureBytes = await fs.readFile(target.capturePath);
      const captureSignature = await imageSignature(decodePage, captureBytes);
      if (captureSignature.width !== viewport.width || captureSignature.height !== viewport.height) findings.push({ code: 'motion-proof-independent-capture-viewport-mismatch', message: 'Decoded PNG dimensions do not match the planned browser viewport.' });
      const captureDistance = visualDistance(replaySignature.pixels, captureSignature.pixels);
      if (!visuallyBound(captureDistance)) findings.push({ code: 'motion-proof-independent-capture-replay-mismatch', message: `Claimed PNG end frame is not pixel-bound to the independently replayed source state (mean delta ${captureDistance.meanDelta.toFixed(2)}, outlier share ${captureDistance.outlierShare.toFixed(4)}).` });

      const submittedBytes = await fs.readFile(target.videoPath);
      const independentRecording = await recordIndependentReplayVideo(browser, target, planned, viewport);
      if (independentRecording.domStudyId !== planned.id
        || independentRecording.state?.studyId !== planned.id
        || independentRecording.state?.sourceStudyId !== planned.id
        || !sameContract(independentRecording.state?.appliedCreativeIntent ?? null, planned.creativeIntent ?? null)) {
        findings.push({ code: 'motion-proof-independent-video-source-binding-mismatch', message: 'The separately recorded independent replay did not execute the exact planned source identity and creative intent.' });
      }

      await decodePage.setContent('<!doctype html><video id="submitted" muted playsinline preload="auto"></video><video id="independent" muted playsinline preload="auto"></video>', { waitUntil: 'load' });
      const submittedMedia = await loadVideoBytes(decodePage, '#submitted', submittedBytes);
      const independentMedia = await loadVideoBytes(decodePage, '#independent', independentRecording.bytes);
      const mediaValid = (media) => media.videoWidth > 0 && media.videoHeight > 0 && media.duration > 0 && media.readyState >= 1;
      if (!mediaValid(submittedMedia)) {
        findings.push({ code: 'motion-proof-independent-video-decode-invalid', message: 'Chromium could not decode a non-empty temporal WebM with valid dimensions and duration.' });
      } else {
        if (submittedMedia.videoWidth !== viewport.width || submittedMedia.videoHeight !== viewport.height) findings.push({ code: 'motion-proof-independent-video-viewport-mismatch', message: 'Decoded WebM dimensions do not match the planned browser viewport.' });
        const submittedDurationMs = submittedMedia.duration * 1000;
        if (timelineContract.durationMs > 0 && (submittedDurationMs < timelineContract.durationMs * 0.75 || submittedDurationMs > timelineContract.durationMs + 5000)) findings.push({ code: 'motion-proof-independent-video-duration-mismatch', message: 'Decoded WebM duration is not plausibly bound to the claimed browser timeline.' });
      }
      if (!mediaValid(independentMedia)) findings.push({ code: 'motion-proof-independent-replay-video-decode-invalid', message: 'The separately recorded exact-source replay did not produce a decodable temporal WebM.' });
      else if (independentMedia.videoWidth !== viewport.width || independentMedia.videoHeight !== viewport.height) findings.push({ code: 'motion-proof-independent-replay-video-viewport-mismatch', message: 'The separately recorded exact-source replay does not match the planned viewport.' });

      if (mediaValid(submittedMedia) && mediaValid(independentMedia)) {
        const submittedAnchor = await bestFinalAnchor(decodePage, '#submitted', submittedMedia, captureSignature.pixels);
        const independentAnchor = await bestFinalAnchor(decodePage, '#independent', independentMedia, captureSignature.pixels);
        if (!submittedAnchor) findings.push({ code: 'motion-proof-independent-video-frame-missing', message: 'Decoded WebM did not yield a comparable final frame.' });
        else if (!visuallyBound(submittedAnchor.distance)) findings.push({ code: 'motion-proof-independent-video-replay-mismatch', message: `Decoded WebM does not visually bind to the replay-verified end frame (best mean delta ${submittedAnchor.distance.meanDelta.toFixed(2)}, outlier share ${submittedAnchor.distance.outlierShare.toFixed(4)}).` });
        if (!independentAnchor || !visuallyBound(independentAnchor.distance)) findings.push({ code: 'motion-proof-independent-replay-video-final-mismatch', message: 'The separately recorded exact-source replay does not bind to the independently replayed final state.' });

        if (submittedAnchor && independentAnchor && visuallyBound(submittedAnchor.distance) && visuallyBound(independentAnchor.distance)) {
          const durationSeconds = Math.max(0.001, Number(timelineContract.durationMs) / 1000);
          const submittedSamples = await decodedVideoFramesAtTimes(decodePage, '#submitted', temporalTimes(submittedAnchor.targetTime, durationSeconds));
          const independentSamples = await decodedVideoFramesAtTimes(decodePage, '#independent', temporalTimes(independentAnchor.targetTime, durationSeconds));
          const independentProgressive = sequenceProgressive(independentSamples);
          const requireProgression = planned.input !== 'reduced-motion' || independentProgressive;
          if (planned.input !== 'reduced-motion' && !independentProgressive) {
            findings.push({ code: 'motion-proof-independent-source-visible-motion-missing', message: 'A clean separately recorded replay of the exact source did not expose materially distinct temporal visual states.' });
          }
          const requiredSpan = Math.max(MIN_TEMPORAL_SPAN_SECONDS, Math.min(durationSeconds * 0.2, 0.35));
          const binding = orderedVideoBinding(submittedSamples, independentSamples, requiredSpan, requireProgression);
          if (!binding.verified) {
            findings.push({
              code: 'motion-proof-independent-video-timeline-mismatch',
              message: `Submitted WebM does not bind to the separately recorded exact-source motion sequence (${binding.matches.length}/${binding.requiredMatches} required ordered matches, submitted span ${binding.leftSpan.toFixed(2)}s, independent span ${binding.rightSpan.toFixed(2)}s, submitted progression ${binding.leftProgressive ? 'present' : 'missing'}, independent progression ${binding.rightProgressive ? 'present' : 'missing'}).`
            });
          }
        }
      }
    } finally {
      await decodeContext.close();
    }
  } catch (error) {
    findings.push({ code: 'motion-proof-independent-browser-replay-error', message: `Independent browser replay failed: ${error?.message ?? 'unknown error'}` });
  }

  return { studyId: planned.id ?? null, verified: findings.length === 0, findings };
}

async function verifyTarget(browser, target) {
  if (target?.kind === 'comparison') return verifyComparisonTarget(browser, target);
  return verifyStudyTarget(browser, target);
}

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Verifier input path is required.');
const payload = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const targets = Array.isArray(payload.targets) ? payload.targets : [];
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const target of targets) results.push(await verifyTarget(browser, target));
} finally {
  await browser.close();
}
const findings = results.flatMap((result) => result.findings.map((item) => ({ ...item, studyId: result.studyId ?? null })));
process.stdout.write(JSON.stringify({ verified: targets.length > 0 && findings.length === 0, results, findings }));