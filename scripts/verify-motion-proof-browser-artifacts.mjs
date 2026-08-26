import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 32;
const MAX_VISUAL_MEAN_DELTA = 5;
const MAX_VISUAL_OUTLIER_SHARE = 0.01;
const MAX_TEMPORAL_VISUAL_MEAN_DELTA = 5;
const MAX_TEMPORAL_VISUAL_OUTLIER_SHARE = 0.03;
const MAX_FRAME_COUNT_DELTA = 4;
const TEMPORAL_SAMPLE_FRACTIONS = [0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8, 0.88];
const TEMPORAL_VIDEO_SAMPLE_STEP_SECONDS = 0.02;
const TEMPORAL_VIDEO_LEAD_SECONDS = 0.75;
const MIN_TEMPORAL_MATCHES = 4;
const MIN_TEMPORAL_VIDEO_SPAN_SECONDS = 0.12;
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
  for (let i = 0; i < left.length; i += 4) {
    const dr = Math.abs(left[i] - right[i]);
    const dg = Math.abs(left[i + 1] - right[i + 1]);
    const db = Math.abs(left[i + 2] - right[i + 2]);
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
  return distance.meanDelta >= MIN_VISIBLE_MOTION_MEAN_DELTA || distance.outlierShare >= MIN_VISIBLE_MOTION_OUTLIER_SHARE;
}

function orderedTemporalBinding(replaySamples, videoSamples) {
  const replayCount = replaySamples.length;
  const videoCount = videoSamples.length;
  if (!replayCount || !videoCount) return { verified: false, matches: [], spanSeconds: 0, visuallyProgressive: false };

  const scores = Array.from({ length: replayCount + 1 }, () => new Uint16Array(videoCount + 1));
  for (let replayIndex = 1; replayIndex <= replayCount; replayIndex += 1) {
    for (let videoIndex = 1; videoIndex <= videoCount; videoIndex += 1) {
      const distance = visualDistance(replaySamples[replayIndex - 1].pixels, videoSamples[videoIndex - 1].pixels);
      const diagonal = temporallyBound(distance) ? scores[replayIndex - 1][videoIndex - 1] + 1 : 0;
      scores[replayIndex][videoIndex] = Math.max(
        diagonal,
        scores[replayIndex - 1][videoIndex],
        scores[replayIndex][videoIndex - 1]
      );
    }
  }

  const matches = [];
  let replayIndex = replayCount;
  let videoIndex = videoCount;
  while (replayIndex > 0 && videoIndex > 0) {
    const replaySample = replaySamples[replayIndex - 1];
    const videoSample = videoSamples[videoIndex - 1];
    const distance = visualDistance(replaySample.pixels, videoSample.pixels);
    const diagonalScore = scores[replayIndex - 1][videoIndex - 1] + 1;
    if (temporallyBound(distance) && scores[replayIndex][videoIndex] === diagonalScore) {
      matches.push({
        replayIndex: replayIndex - 1,
        videoIndex: videoIndex - 1,
        fraction: replaySample.fraction,
        replayElapsedMs: replaySample.elapsedMs,
        videoTime: videoSample.targetTime,
        distance
      });
      replayIndex -= 1;
      videoIndex -= 1;
    } else if (scores[replayIndex - 1][videoIndex] >= scores[replayIndex][videoIndex - 1]) {
      replayIndex -= 1;
    } else {
      videoIndex -= 1;
    }
  }
  matches.reverse();

  const spanSeconds = matches.length > 1 ? matches[matches.length - 1].videoTime - matches[0].videoTime : 0;
  let visuallyProgressive = false;
  for (let left = 0; left < matches.length && !visuallyProgressive; left += 1) {
    for (let right = left + 1; right < matches.length; right += 1) {
      const leftPixels = videoSamples[matches[left].videoIndex].pixels;
      const rightPixels = videoSamples[matches[right].videoIndex].pixels;
      if (visiblyDifferent(visualDistance(leftPixels, rightPixels))) {
        visuallyProgressive = true;
        break;
      }
    }
  }

  const minimumMatches = Math.min(MIN_TEMPORAL_MATCHES, replayCount);
  return {
    verified: matches.length >= minimumMatches
      && spanSeconds >= MIN_TEMPORAL_VIDEO_SPAN_SECONDS
      && visuallyProgressive,
    matches,
    spanSeconds,
    visuallyProgressive
  };
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

async function captureReplayTemporalSamples(page, claimedDurationMs) {
  const samples = [];
  if (!(claimedDurationMs > 0)) return samples;

  for (const fraction of TEMPORAL_SAMPLE_FRACTIONS) {
    const targetElapsedMs = claimedDurationMs * fraction;
    await page.waitForFunction(({ targetElapsedMs }) => {
      const proof = window.__motionCreativeProof;
      if (!proof || proof.startedAt === null) return false;
      return proof.done === true || performance.now() - proof.startedAt >= targetElapsedMs;
    }, { targetElapsedMs }, { timeout: 15_000 });

    const timing = await page.evaluate(() => {
      const proof = window.__motionCreativeProof;
      return {
        done: proof?.done === true,
        elapsedMs: proof?.startedAt === null ? null : performance.now() - proof.startedAt
      };
    });

    if (!(timing.elapsedMs >= 0)) break;
    const png = await page.screenshot({ type: 'png' });
    const signature = await imageSignature(page, png);
    samples.push({ fraction, targetElapsedMs, elapsedMs: timing.elapsedMs, done: timing.done, pixels: signature.pixels });
  }

  return samples;
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

async function verifyComparisonTarget(browser, target) {
  const comparisonPaths = Array.isArray(target.comparisonPaths) ? target.comparisonPaths : [];
  const expectedVideoPaths = Array.isArray(target.expectedVideoPaths) ? target.expectedVideoPaths : [];
  const expectedUrls = new Set(expectedVideoPaths.map((file) => pathToFileURL(file).href));
  const observedUrls = new Set();
  const findings = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });

  try {
    if (!comparisonPaths.length || !expectedUrls.size) {
      findings.push({
        code: 'motion-proof-independent-comparison-target-invalid',
        message: 'Browser comparison verification requires comparison HTML and the exact rendered WebM set.'
      });
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

        if (inspection.visibleVideoCount === 0) {
          findings.push({
            code: 'motion-proof-independent-comparison-visible-video-missing',
            message: 'Comparison HTML must render actual effectively visible video elements in the browser.',
            comparisonRef: comparisonPath
          });
        }
        if (inspection.emptyVisibleVideoCount > 0) {
          findings.push({
            code: 'motion-proof-independent-comparison-visible-video-source-missing',
            message: 'Every visible comparison video must resolve to a concrete media source.',
            comparisonRef: comparisonPath
          });
        }
        for (const source of inspection.sources) observedUrls.add(source);
      } catch (error) {
        findings.push({
          code: 'motion-proof-independent-comparison-browser-error',
          message: `Independent comparison DOM verification failed: ${error?.message ?? 'unknown error'}`,
          comparisonRef: comparisonPath
        });
      } finally {
        await page.close();
      }
    }

    const missingUrls = [...expectedUrls].filter((url) => !observedUrls.has(url));
    const unexpectedUrls = [...observedUrls].filter((url) => !expectedUrls.has(url));
    if (missingUrls.length || unexpectedUrls.length) {
      findings.push({
        code: 'motion-proof-independent-comparison-dom-coverage-mismatch',
        message: `Visible browser comparison media must exactly match the rendered WebM set (missing ${missingUrls.length}, unexpected ${unexpectedUrls.length}).`
      });
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
  const context = await browser.newContext({
    viewport,
    hasTouch: planned.input === 'touch',
    isMobile: planned.viewport === 'mobile',
    reducedMotion: planned.input === 'reduced-motion' ? 'reduce' : 'no-preference'
  });
  const page = await context.newPage();
  const findings = [];
  let independentFrameCounter = null;

  try {
    if (!sameContract(timelineContract.viewport ?? null, viewport)) findings.push({ code: 'motion-proof-independent-timeline-viewport-mismatch', message: 'Claimed browser timeline viewport does not match the planned browser context.' });
    if (planned.input === 'reduced-motion' && timelineContract.reducedMotionMedia !== true) findings.push({ code: 'motion-proof-independent-timeline-reduced-motion-mismatch', message: 'Claimed reduced-motion timeline was not recorded under reduced-motion media.' });

    await page.goto(pathToFileURL(target.sourcePath).href, { waitUntil: 'load', timeout: 15_000 });
    const domStudyId = await page.locator('[data-study]').first().getAttribute('data-study').catch(() => null);
    if (domStudyId !== planned.id) findings.push({ code: 'motion-proof-independent-source-dom-binding-mismatch', message: 'Replayed source DOM is not bound to the planned study.' });

    independentFrameCounter = await startIndependentFrameCounter(context, page);
    if (planned.input === 'pointer') await page.click('[data-interaction-target]', { timeout: 5_000 });
    if (planned.input === 'touch') await page.tap('[data-interaction-target]', { timeout: 5_000 });
    await page.waitForFunction(() => window.__motionCreativeProof?.startedAt !== null, null, { timeout: 15_000 });

    const replayTemporalSamples = await captureReplayTemporalSamples(page, Number(timelineContract.durationMs));
    await page.waitForFunction(() => window.__motionCreativeProof?.done === true, null, { timeout: 15_000 });
    const independentlyObservedFrameCount = await stopIndependentFrameCounter(independentFrameCounter);
    independentFrameCounter = null;

    const replay = await page.evaluate(() => structuredClone(window.__motionCreativeProof));
    if (replay?.sourceStudyId !== planned.id || replay?.studyId !== planned.id) findings.push({ code: 'motion-proof-independent-source-study-mismatch', message: 'Independent browser replay did not execute the planned study identity.' });
    if (!sameContract(replay?.appliedCreativeIntent ?? null, planned.creativeIntent ?? null)) findings.push({ code: 'motion-proof-independent-source-intent-mismatch', message: 'Independent browser replay did not apply the planned creative intent.' });
    if (!(replay?.completedAt > replay?.startedAt) || !(replay?.frameCount > 1)) findings.push({ code: 'motion-proof-independent-source-temporal-invalid', message: 'Independent browser replay did not demonstrate positive temporal execution across multiple animation frames.' });
    if (planned.input === 'reduced-motion' && replay?.reducedMotionMedia !== true) findings.push({ code: 'motion-proof-independent-reduced-motion-media-mismatch', message: 'Independent browser replay did not execute under reduced-motion media.' });

    const claimedFrameCount = Number(timelineContract.animationFrameCount);
    if (!Number.isInteger(claimedFrameCount)
      || claimedFrameCount <= 1
      || !Number.isInteger(independentlyObservedFrameCount)
      || independentlyObservedFrameCount <= 1
      || Math.abs(independentlyObservedFrameCount - claimedFrameCount) > MAX_FRAME_COUNT_DELTA) {
      findings.push({
        code: 'motion-proof-independent-timeline-frame-count-mismatch',
        message: `Claimed animation frame count must match an isolated-world independent requestAnimationFrame counter within ±${MAX_FRAME_COUNT_DELTA} frames (claimed ${claimedFrameCount}, independently observed ${independentlyObservedFrameCount}).`
      });
    }

    const replayTrace = traceContract(replay?.trace ?? []);
    const claimedTrace = traceContract(timelineContract.trace ?? []);
    if (!sameContract(replayTrace, claimedTrace)) findings.push({ code: 'motion-proof-independent-timeline-trace-mismatch', message: 'Caller timeline trace does not match the independently replayed browser event contract.' });

    const replayDurationMs = Number(replay?.completedAt) - Number(replay?.startedAt);
    if (!(timelineContract.durationMs > 0) || !(replayDurationMs > 0) || Math.abs(replayDurationMs - timelineContract.durationMs) > 300) {
      findings.push({ code: 'motion-proof-independent-timeline-duration-mismatch', message: 'Claimed timeline duration is not consistent with independently replayed browser execution.' });
    }

    const replayPng = await page.screenshot({ type: 'png' });
    const replaySignature = await imageSignature(page, replayPng);
    const captureBytes = await fs.readFile(target.capturePath);
    const captureSignature = await imageSignature(page, captureBytes);
    if (captureSignature.width !== viewport.width || captureSignature.height !== viewport.height) findings.push({ code: 'motion-proof-independent-capture-viewport-mismatch', message: 'Decoded PNG dimensions do not match the planned browser viewport.' });
    const captureDistance = visualDistance(replaySignature.pixels, captureSignature.pixels);
    if (!visuallyBound(captureDistance)) {
      findings.push({ code: 'motion-proof-independent-capture-replay-mismatch', message: `Claimed PNG end frame is not pixel-bound to the independently replayed source state (mean delta ${captureDistance.meanDelta.toFixed(2)}, outlier share ${captureDistance.outlierShare.toFixed(4)}).` });
    }

    const preFinalDistances = replayTemporalSamples
      .filter((sample) => sample.elapsedMs < Number(timelineContract.durationMs) * 0.95)
      .map((sample) => visualDistance(sample.pixels, replaySignature.pixels));
    if (planned.input !== 'reduced-motion' && !preFinalDistances.some(visiblyDifferent)) {
      findings.push({
        code: 'motion-proof-independent-source-visible-motion-missing',
        message: 'Independent replay did not expose a materially distinct pre-final visual state; requestAnimationFrame callbacks alone are not temporal visual proof.'
      });
    }

    const videoBytes = await fs.readFile(target.videoPath);
    const videoDataUrl = `data:video/webm;base64,${videoBytes.toString('base64')}`;
    await page.setContent('<!doctype html><video id="proof-video" muted playsinline preload="auto"></video>', { waitUntil: 'load' });
    await page.locator('#proof-video').evaluate((video, src) => { video.src = src; video.load(); }, videoDataUrl);
    const media = await waitForMediaMetadata(page, '#proof-video');
    if (!(media.videoWidth > 0) || !(media.videoHeight > 0) || !(media.duration > 0) || media.readyState < 1) {
      findings.push({ code: 'motion-proof-independent-video-decode-invalid', message: 'Chromium could not decode a non-empty temporal WebM with valid dimensions and duration.' });
    } else {
      if (media.videoWidth !== viewport.width || media.videoHeight !== viewport.height) findings.push({ code: 'motion-proof-independent-video-viewport-mismatch', message: 'Decoded WebM dimensions do not match the planned browser viewport.' });
      const videoDurationMs = media.duration * 1000;
      if (timelineContract.durationMs > 0 && (videoDurationMs < timelineContract.durationMs * 0.75 || videoDurationMs > timelineContract.durationMs + 5000)) {
        findings.push({ code: 'motion-proof-independent-video-duration-mismatch', message: 'Decoded WebM duration is not plausibly bound to the claimed browser timeline.' });
      }

      const anchorTimes = [0.35, 0.18, 0.05]
        .map((offset) => media.duration - offset)
        .filter((time) => time > 0.01 && time < media.duration);
      const anchorSamples = await decodedVideoFramesAtTimes(page, '#proof-video', anchorTimes);
      if (!anchorSamples.length) {
        findings.push({ code: 'motion-proof-independent-video-frame-missing', message: 'Decoded WebM did not yield a comparable temporal frame.' });
      } else {
        const anchors = anchorSamples.map((sample) => ({
          ...sample,
          distance: visualDistance(captureSignature.pixels, sample.pixels)
        })).sort((left, right) => left.distance.meanDelta - right.distance.meanDelta || left.distance.outlierShare - right.distance.outlierShare);
        const bestAnchor = anchors[0];
        if (!visuallyBound(bestAnchor.distance)) {
          findings.push({ code: 'motion-proof-independent-video-replay-mismatch', message: `Decoded WebM does not visually bind to the replay-verified end frame (best mean delta ${bestAnchor.distance.meanDelta.toFixed(2)}, outlier share ${bestAnchor.distance.outlierShare.toFixed(4)}).` });
        } else if (replayTemporalSamples.length) {
          const claimedDurationSeconds = Number(timelineContract.durationMs) / 1000;
          const windowStart = Math.max(0.01, bestAnchor.targetTime - claimedDurationSeconds - TEMPORAL_VIDEO_LEAD_SECONDS);
          const windowEnd = Math.max(windowStart, bestAnchor.targetTime);
          const temporalVideoTimes = [];
          for (let time = windowStart; time <= windowEnd + 0.0001; time += TEMPORAL_VIDEO_SAMPLE_STEP_SECONDS) temporalVideoTimes.push(time);
          if (temporalVideoTimes[temporalVideoTimes.length - 1] < windowEnd - 0.005) temporalVideoTimes.push(windowEnd);
          const temporalVideoSamples = await decodedVideoFramesAtTimes(page, '#proof-video', temporalVideoTimes);
          const sequenceBinding = orderedTemporalBinding(replayTemporalSamples, temporalVideoSamples);
          if (!sequenceBinding.verified) {
            findings.push({
              code: 'motion-proof-independent-video-timeline-mismatch',
              message: `Decoded WebM does not contain enough independently replayed visual states in temporal order (${sequenceBinding.matches.length}/${replayTemporalSamples.length} states bound, ${sequenceBinding.spanSeconds.toFixed(2)}s matched span, visual progression ${sequenceBinding.visuallyProgressive ? 'present' : 'missing'}).`
            });
          }
        }
      }
    }
  } catch (error) {
    findings.push({ code: 'motion-proof-independent-browser-replay-error', message: `Independent browser replay failed: ${error?.message ?? 'unknown error'}` });
  } finally {
    if (independentFrameCounter) {
      try { await stopIndependentFrameCounter(independentFrameCounter); } catch {}
    }
    await context.close();
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