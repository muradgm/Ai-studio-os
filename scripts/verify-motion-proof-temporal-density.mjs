import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { findStableTerminalAnchorIndex } from '../modules/motion-creative-intelligence/terminal-anchor.mjs';
import { findOptimalMonotonicMatches } from '../modules/motion-creative-intelligence/temporal-sequence.mjs';

const SAMPLE_WIDTH = 48;
const SAMPLE_HEIGHT = 32;
const SAMPLE_STEP_SECONDS = 0.04;
const MAX_MEAN_DELTA = 5;
const MAX_OUTLIER_SHARE = 0.03;
const MAX_FINAL_MEAN_DELTA = 5;
const MAX_FINAL_OUTLIER_SHARE = 0.01;
const MAX_TIME_DRIFT_SECONDS = 0.08;
const MIN_BIDIRECTIONAL_COVERAGE = 0.78;
const MAX_CONSECUTIVE_UNMATCHED = 3;
const MIN_VISIBLE_MOTION_MEAN_DELTA = 0.75;
const MIN_VISIBLE_MOTION_OUTLIER_SHARE = 0.001;
const MAX_TERMINAL_REFERENCE_MEAN_DELTA = 1.5;
const MAX_TERMINAL_REFERENCE_OUTLIER_SHARE = 0.002;
const TERMINAL_SEARCH_PADDING_SECONDS = 2;
const MIN_TERMINAL_SUFFIX_SAMPLES = 3;
const MAX_TERMINAL_SUFFIX_CONSECUTIVE_GAPS = 1;

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  return value;
}

function sameContract(left, right) {
  return JSON.stringify(canonicalValue(left)) === JSON.stringify(canonicalValue(right));
}

function visualDistance(left = [], right = []) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) return { meanDelta: Infinity, outlierShare: 1 };
  let total = 0;
  let channels = 0;
  let outliers = 0;
  const pixels = left.length / 4;
  for (let index = 0; index < left.length; index += 4) {
    const dr = Math.abs(left[index] - right[index]);
    const dg = Math.abs(left[index + 1] - right[index + 1]);
    const db = Math.abs(left[index + 2] - right[index + 2]);
    total += dr + dg + db;
    channels += 3;
    if (Math.max(dr, dg, db) > 32) outliers += 1;
  }
  return { meanDelta: total / channels, outlierShare: outliers / pixels };
}

function temporalBound(distance) {
  return distance.meanDelta <= MAX_MEAN_DELTA && distance.outlierShare <= MAX_OUTLIER_SHARE;
}

function finalBound(distance) {
  return distance.meanDelta <= MAX_FINAL_MEAN_DELTA && distance.outlierShare <= MAX_FINAL_OUTLIER_SHARE;
}

function visiblyDifferent(distance) {
  return distance.meanDelta >= MIN_VISIBLE_MOTION_MEAN_DELTA || distance.outlierShare >= MIN_VISIBLE_MOTION_OUTLIER_SHARE;
}

function terminalReferenceNear(distance) {
  return distance.meanDelta <= MAX_TERMINAL_REFERENCE_MEAN_DELTA
    && distance.outlierShare <= MAX_TERMINAL_REFERENCE_OUTLIER_SHARE;
}

function progressive(samples) {
  for (let left = 0; left < samples.length; left += 1) {
    for (let right = left + 1; right < samples.length; right += 1) {
      if (visiblyDifferent(visualDistance(samples[left].pixels, samples[right].pixels))) return true;
    }
  }
  return false;
}

function averagePixels(samples = []) {
  const length = samples[0]?.pixels?.length ?? 0;
  if (!length || samples.some((sample) => !Array.isArray(sample?.pixels) || sample.pixels.length !== length)) return null;
  const sums = Array(length).fill(0);
  for (const sample of samples) {
    for (let index = 0; index < length; index += 1) sums[index] += sample.pixels[index];
  }
  return sums.map((value) => Math.round(value / samples.length));
}

function contextOptions(planned, viewport, recordDir = null) {
  return {
    viewport,
    hasTouch: planned.input === 'touch',
    isMobile: planned.viewport === 'mobile',
    reducedMotion: 'no-preference',
    ...(recordDir ? { recordVideo: { dir: recordDir, size: viewport } } : {})
  };
}

async function applyPlannedInput(page, planned) {
  if (planned.input === 'pointer') await page.click('[data-interaction-target]', { timeout: 5_000 });
  if (planned.input === 'touch') await page.tap('[data-interaction-target]', { timeout: 5_000 });
}

async function recordIndependentReplay(browser, target, planned, viewport) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-motion-dense-replay-'));
  let context;
  try {
    context = await browser.newContext(contextOptions(planned, viewport, root));
    const page = await context.newPage();
    await page.goto(pathToFileURL(target.sourcePath).href, { waitUntil: 'load', timeout: 15_000 });
    await applyPlannedInput(page, planned);
    await page.waitForFunction(() => window.__motionCreativeProof?.startedAt !== null, null, { timeout: 15_000 });
    await page.waitForFunction(() => window.__motionCreativeProof?.done === true, null, { timeout: 15_000 });
    const state = await page.evaluate(() => structuredClone(window.__motionCreativeProof));
    const video = page.video();
    if (!video) throw new Error('independent dense replay video missing');
    await context.close();
    context = null;
    const videoPath = await video.path();
    return { bytes: await fs.readFile(videoPath), state };
  } finally {
    if (context) {
      try { await context.close(); } catch {}
    }
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function imageSignature(page, bytes) {
  const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
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
    return Array.from(context.getImageData(0, 0, width, height).data);
  }, { dataUrl, width: SAMPLE_WIDTH, height: SAMPLE_HEIGHT });
}

async function loadVideo(page, selector, bytes) {
  const dataUrl = `data:video/webm;base64,${bytes.toString('base64')}`;
  await page.locator(selector).evaluate((video, src) => { video.src = src; video.load(); }, dataUrl);
  return page.locator(selector).evaluate(async (video) => {
    if (video.readyState < 1) await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('metadata timeout')), 10_000);
      video.addEventListener('loadedmetadata', () => { clearTimeout(timer); resolve(); }, { once: true });
      video.addEventListener('error', () => { clearTimeout(timer); reject(new Error('video decode error')); }, { once: true });
    });
    return { duration: video.duration, width: video.videoWidth, height: video.videoHeight, readyState: video.readyState };
  });
}

async function framesAt(page, selector, times) {
  return page.locator(selector).evaluate(async (video, { width, height, times }) => {
    const output = [];
    for (const requestedTime of times) {
      const targetTime = Math.max(0.01, Math.min(requestedTime, Math.max(0.01, video.duration - 0.01)));
      if (Math.abs(video.currentTime - targetTime) > 0.001 || video.readyState < 2) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('seek timeout')), 10_000);
          video.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
          video.addEventListener('error', () => { clearTimeout(timer); reject(new Error('seek decode error')); }, { once: true });
          video.currentTime = targetTime;
        });
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(video, 0, 0, width, height);
      output.push({ requestedTime, targetTime, pixels: Array.from(context.getImageData(0, 0, width, height).data) });
    }
    return output;
  }, { width: SAMPLE_WIDTH, height: SAMPLE_HEIGHT, times });
}

function terminalSearchTimes(mediaDuration, durationSeconds) {
  const start = Math.max(0.01, mediaDuration - durationSeconds - TERMINAL_SEARCH_PADDING_SECONDS);
  const end = Math.max(start, mediaDuration - 0.01);
  const times = [];
  for (let t = start; t <= end + 0.0001; t += SAMPLE_STEP_SECONDS) times.push(t);
  if (!times.length || times[times.length - 1] < end - 0.005) times.push(end);
  return times;
}

async function terminalAnchor(page, selector, media, finalPixels, durationSeconds) {
  const samples = await framesAt(page, selector, terminalSearchTimes(media.duration, durationSeconds));
  if (samples.length < MIN_TERMINAL_SUFFIX_SAMPLES) return null;

  const scoredToFinal = samples.map((sample) => ({
    ...sample,
    distance: visualDistance(sample.pixels, finalPixels)
  }));
  const strictTail = scoredToFinal.slice(-MIN_TERMINAL_SUFFIX_SAMPLES);
  if (strictTail.length < MIN_TERMINAL_SUFFIX_SAMPLES || strictTail.some((sample) => !finalBound(sample.distance))) return null;

  // PNG binding answers "did this video end at the proven final state?". The
  // semantic onset of that state is measured against the video's own verified
  // terminal tail so codec bias between a PNG screenshot and WebM frames cannot
  // make subtle motion look terminal from frame zero.
  const terminalPixels = averagePixels(strictTail);
  if (!terminalPixels) return null;
  const terminalDistances = samples.map((sample) => visualDistance(sample.pixels, terminalPixels));
  const settledFlags = terminalDistances.map((distance) => !visiblyDifferent(distance));
  const nearSettledFlags = terminalDistances.map((distance) => terminalReferenceNear(distance));
  const anchorIndex = findStableTerminalAnchorIndex(settledFlags, nearSettledFlags, {
    minSuffixSamples: MIN_TERMINAL_SUFFIX_SAMPLES,
    maxConsecutiveGaps: MAX_TERMINAL_SUFFIX_CONSECUTIVE_GAPS
  });

  return anchorIndex >= 0 ? scoredToFinal[anchorIndex] : null;
}

function logicalTimes(anchor, durationSeconds) {
  const start = Math.max(0.01, anchor - durationSeconds);
  const times = [];
  for (let t = start; t <= anchor + 0.0001; t += SAMPLE_STEP_SECONDS) times.push(t);
  if (!times.length || times[times.length - 1] < anchor - 0.005) times.push(anchor);
  return times;
}

function longestUnmatchedRun(count, matchedIndexes) {
  const matched = new Set(matchedIndexes);
  let longest = 0;
  let current = 0;
  for (let index = 0; index < count; index += 1) {
    if (matched.has(index)) current = 0;
    else {
      current += 1;
      longest = Math.max(longest, current);
    }
  }
  return longest;
}

function denseBinding(submitted, independent, submittedAnchor, independentAnchor) {
  const candidates = [];
  for (let left = 0; left < submitted.length; left += 1) {
    const leftRelative = submitted[left].targetTime - submittedAnchor;
    for (let right = 0; right < independent.length; right += 1) {
      const rightRelative = independent[right].targetTime - independentAnchor;
      const drift = Math.abs(leftRelative - rightRelative);
      if (drift > MAX_TIME_DRIFT_SECONDS) continue;
      const distance = visualDistance(submitted[left].pixels, independent[right].pixels);
      if (!temporalBound(distance)) continue;
      candidates.push({ left, right, drift, distance });
    }
  }

  // Authority requires an ordered temporal correspondence. Use a maximum-cardinality
  // monotonic alignment rather than greedy nearest-frame assignment so dropped or
  // duplicated codec frames cannot create false negatives, while reordered montage
  // frames cannot be matched out of sequence.
  const matches = findOptimalMonotonicMatches(submitted.length, independent.length, candidates);
  const leftCoverage = submitted.length ? matches.length / submitted.length : 0;
  const rightCoverage = independent.length ? matches.length / independent.length : 0;
  const leftGap = longestUnmatchedRun(submitted.length, matches.map((item) => item.left));
  const rightGap = longestUnmatchedRun(independent.length, matches.map((item) => item.right));
  const maxDrift = matches.length ? Math.max(...matches.map((item) => item.drift)) : Infinity;
  return {
    verified: leftCoverage >= MIN_BIDIRECTIONAL_COVERAGE
      && rightCoverage >= MIN_BIDIRECTIONAL_COVERAGE
      && leftGap <= MAX_CONSECUTIVE_UNMATCHED
      && rightGap <= MAX_CONSECUTIVE_UNMATCHED
      && maxDrift <= MAX_TIME_DRIFT_SECONDS
      && progressive(submitted)
      && progressive(independent),
    matches: matches.length,
    leftCoverage,
    rightCoverage,
    leftGap,
    rightGap,
    maxDrift
  };
}

async function verifyTarget(browser, target) {
  const planned = target?.planned ?? {};
  const timeline = target?.timelineContract ?? {};
  const findings = [];
  if (planned.input === 'reduced-motion') return { studyId: planned.id ?? null, verified: true, findings: [] };
  const viewport = planned.viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1100, height: 720 };
  try {
    const durationSeconds = Math.max(0.001, Number(timeline.durationMs) / 1000);
    const independent = await recordIndependentReplay(browser, target, planned, viewport);
    if (independent.state?.studyId !== planned.id || !sameContract(independent.state?.appliedCreativeIntent ?? null, planned.creativeIntent ?? null)) {
      findings.push({ code: 'motion-proof-dense-source-binding-mismatch', message: 'Dense temporal authority requires an independent replay of the exact study and creative intent.' });
      return { studyId: planned.id ?? null, verified: false, findings };
    }

    const decodeContext = await browser.newContext({ viewport });
    const page = await decodeContext.newPage();
    try {
      await page.setContent('<video id="submitted" muted playsinline preload="auto"></video><video id="independent" muted playsinline preload="auto"></video>');
      const submittedBytes = await fs.readFile(target.videoPath);
      const finalBytes = await fs.readFile(target.capturePath);
      const [submittedMedia, independentMedia, finalPixels] = await Promise.all([
        loadVideo(page, '#submitted', submittedBytes),
        loadVideo(page, '#independent', independent.bytes),
        imageSignature(page, finalBytes)
      ]);
      const valid = (media) => media.width === viewport.width && media.height === viewport.height && media.duration > 0 && media.readyState >= 1;
      if (!valid(submittedMedia) || !valid(independentMedia)) {
        findings.push({ code: 'motion-proof-dense-video-decode-invalid', message: 'Dense temporal authority requires decodable submitted and independent WebMs at the planned viewport.' });
      } else {
        const submittedAnchor = await terminalAnchor(page, '#submitted', submittedMedia, finalPixels, durationSeconds);
        const independentAnchor = await terminalAnchor(page, '#independent', independentMedia, finalPixels, durationSeconds);
        if (!submittedAnchor || !independentAnchor) {
          findings.push({ code: 'motion-proof-dense-terminal-binding-missing', message: 'Dense temporal authority requires both recordings to end in, and expose the semantic onset of, the replay-verified terminal state.' });
        } else {
          const submittedSamples = await framesAt(page, '#submitted', logicalTimes(submittedAnchor.targetTime, durationSeconds));
          const independentSamples = await framesAt(page, '#independent', logicalTimes(independentAnchor.targetTime, durationSeconds));
          const binding = denseBinding(submittedSamples, independentSamples, submittedAnchor.targetTime, independentAnchor.targetTime);
          if (!binding.verified) findings.push({
            code: 'motion-proof-dense-video-timeline-mismatch',
            message: `Submitted WebM lacks dense time-aligned correspondence with independent replay (matches ${binding.matches}, submitted coverage ${(binding.leftCoverage * 100).toFixed(1)}%, independent coverage ${(binding.rightCoverage * 100).toFixed(1)}%, submitted max gap ${binding.leftGap}, independent max gap ${binding.rightGap}, max drift ${Number.isFinite(binding.maxDrift) ? binding.maxDrift.toFixed(3) : 'n/a'}s).`
          });
        }
      }
    } finally {
      await decodeContext.close();
    }
  } catch (error) {
    findings.push({ code: 'motion-proof-dense-browser-error', message: `Dense temporal authority failed: ${error?.message ?? 'unknown error'}` });
  }
  return { studyId: planned.id ?? null, verified: findings.length === 0, findings };
}

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Dense Motion verifier input path is required.');
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
