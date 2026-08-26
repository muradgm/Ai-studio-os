import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

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

    await page.goto(pathToFileURL(target.videoPath).href, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForSelector('video', { timeout: 10_000 });
    const media = await waitForMediaMetadata(page, 'video');
    if (!(media.videoWidth > 0) || !(media.videoHeight > 0) || !(media.duration > 0) || media.readyState < 1) {
      findings.push({ code: 'motion-proof-independent-video-decode-invalid', message: 'Chromium could not decode a non-empty temporal WebM with valid dimensions and duration.' });
    } else {
      if (media.videoWidth !== viewport.width || media.videoHeight !== viewport.height) findings.push({ code: 'motion-proof-independent-video-viewport-mismatch', message: 'Decoded WebM dimensions do not match the planned browser viewport.' });
      const videoDurationMs = media.duration * 1000;
      if (timelineContract.durationMs > 0 && (videoDurationMs < timelineContract.durationMs * 0.75 || videoDurationMs > timelineContract.durationMs + 5000)) {
        findings.push({ code: 'motion-proof-independent-video-duration-mismatch', message: 'Decoded WebM duration is not plausibly bound to the claimed browser timeline.' });
      }
      await page.locator('video').evaluate(async (video) => {
        video.muted = true;
        const targetTime = Math.min(Math.max(video.duration * 0.5, 0.01), Math.max(video.duration - 0.01, 0.01));
        if (targetTime > 0 && Number.isFinite(targetTime)) {
          await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('video seek timeout')), 10_000);
            video.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true });
            video.addEventListener('error', () => { clearTimeout(timer); reject(new Error('video seek decode error')); }, { once: true });
            video.currentTime = targetTime;
          });
        }
      });
    }

    await page.goto(pathToFileURL(target.capturePath).href, { waitUntil: 'load', timeout: 15_000 });
    await page.waitForSelector('img', { timeout: 10_000 });
    const image = await page.locator('img').first().evaluate((img) => ({ width: img.naturalWidth, height: img.naturalHeight, complete: img.complete }));
    if (!image.complete || !(image.width > 0) || !(image.height > 0)) findings.push({ code: 'motion-proof-independent-capture-decode-invalid', message: 'Chromium could not decode the PNG end-frame evidence.' });
    if (image.width !== viewport.width || image.height !== viewport.height) findings.push({ code: 'motion-proof-independent-capture-viewport-mismatch', message: 'Decoded PNG dimensions do not match the planned browser viewport.' });
  } catch (error) {
    findings.push({ code: 'motion-proof-independent-browser-replay-error', message: error?.message ?? 'Independent browser replay failed.' });
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
