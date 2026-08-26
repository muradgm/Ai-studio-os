import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 32;
const MAX_VISUAL_MEAN_DELTA = 5;
const MAX_VISUAL_OUTLIER_SHARE = 0.01;

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

async function decodedVideoFrameSamples(page, selector) {
  return page.locator(selector).evaluate(async (video, { width, height }) => {
    video.muted = true;
    const offsets = [0.35, 0.18, 0.05];
    const samples = [];
    const seek = async (targetTime) => {
      if (Math.abs(video.currentTime - targetTime) < 0.001 && video.readyState >= 2) return;
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('video seek timeout')), 10_000);
        const done = () => { clearTimeout(timer); resolve(); };
        const fail = () => { clearTimeout(timer); reject(new Error('video seek decode error')); };
        video.addEventListener('seeked', done, { once: true });
        video.addEventListener('error', fail, { once: true });
        video.currentTime = targetTime;
      });
      if (video.readyState < 2) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('video frame decode timeout')), 10_000);
          video.addEventListener('loadeddata', () => { clearTimeout(timer); resolve(); }, { once: true });
          video.addEventListener('error', () => { clearTimeout(timer); reject(new Error('video frame decode error')); }, { once: true });
        });
      }
    };

    for (const offset of offsets) {
      const targetTime = Math.max(0.01, Math.min(video.duration - offset, video.duration - 0.01));
      if (!(targetTime > 0) || !Number.isFinite(targetTime)) continue;
      await seek(targetTime);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(video, 0, 0, width, height);
      samples.push({
        targetTime,
        pixels: Array.from(context.getImageData(0, 0, width, height).data)
      });
    }
    return samples;
  }, { width: SAMPLE_WIDTH, height: SAMPLE_HEIGHT });
}

async function verifyTarget(browser, target) {
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

  try {
    if (!sameContract(timelineContract.viewport ?? null, viewport)) findings.push({ code: 'motion-proof-independent-timeline-viewport-mismatch', message: 'Claimed browser timeline viewport does not match the planned browser context.' });
    if (planned.input === 'reduced-motion' && timelineContract.reducedMotionMedia !== true) findings.push({ code: 'motion-proof-independent-timeline-reduced-motion-mismatch', message: 'Claimed reduced-motion timeline was not recorded under reduced-motion media.' });

    await page.goto(pathToFileURL(target.sourcePath).href, { waitUntil: 'load', timeout: 15_000 });
    const domStudyId = await page.locator('[data-study]').first().getAttribute('data-study').catch(() => null);
    if (domStudyId !== planned.id) findings.push({ code: 'motion-proof-independent-source-dom-binding-mismatch', message: 'Replayed source DOM is not bound to the planned study.' });

    if (planned.input === 'pointer') await page.click('[data-interaction-target]', { timeout: 5_000 });
    if (planned.input === 'touch') await page.tap('[data-interaction-target]', { timeout: 5_000 });
    await page.waitForFunction(() => window.__motionCreativeProof?.done === true, null, { timeout: 15_000 });

    const replay = await page.evaluate(() => structuredClone(window.__motionCreativeProof));
    if (replay?.sourceStudyId !== planned.id || replay?.studyId !== planned.id) findings.push({ code: 'motion-proof-independent-source-study-mismatch', message: 'Independent browser replay did not execute the planned study identity.' });
    if (!sameContract(replay?.appliedCreativeIntent ?? null, planned.creativeIntent ?? null)) findings.push({ code: 'motion-proof-independent-source-intent-mismatch', message: 'Independent browser replay did not apply the planned creative intent.' });
    if (!(replay?.completedAt > replay?.startedAt) || !(replay?.frameCount > 1)) findings.push({ code: 'motion-proof-independent-source-temporal-invalid', message: 'Independent browser replay did not demonstrate positive temporal execution across multiple animation frames.' });
    if (planned.input === 'reduced-motion' && replay?.reducedMotionMedia !== true) findings.push({ code: 'motion-proof-independent-reduced-motion-media-mismatch', message: 'Independent browser replay did not execute under reduced-motion media.' });

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
      const samples = await decodedVideoFrameSamples(page, '#proof-video');
      if (!samples.length) {
        findings.push({ code: 'motion-proof-independent-video-frame-missing', message: 'Decoded WebM did not yield a comparable temporal frame.' });
      } else {
        const distances = samples.map((sample) => ({ targetTime: sample.targetTime, ...visualDistance(captureSignature.pixels, sample.pixels) }));
        const best = distances.sort((left, right) => left.meanDelta - right.meanDelta || left.outlierShare - right.outlierShare)[0];
        if (!visuallyBound(best)) {
          findings.push({ code: 'motion-proof-independent-video-replay-mismatch', message: `Decoded WebM does not visually bind to the replay-verified end frame (best mean delta ${best.meanDelta.toFixed(2)}, outlier share ${best.outlierShare.toFixed(4)}).` });
        }
      }
    }
  } catch (error) {
    findings.push({ code: 'motion-proof-independent-browser-replay-error', message: `Independent browser replay failed: ${error?.message ?? 'unknown error'}` });
  } finally {
    await context.close();
  }

  return { studyId: planned.id ?? null, verified: findings.length === 0, findings };
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

const findings = results.flatMap((result) => result.findings.map((item) => ({ ...item, studyId: result.studyId })));
process.stdout.write(JSON.stringify({ verified: targets.length > 0 && findings.length === 0, results, findings }));
