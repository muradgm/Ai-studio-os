import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  bestDenseAttempt,
  classifyDenseAttempt,
  selectCompleteDenseAttempt
} from '../modules/motion-creative-intelligence/dense-attempt-authority.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SINGLE_ATTEMPT_VERIFIER = path.join(here, 'verify-motion-proof-temporal-density.mjs');
const MAX_REPLAY_ATTEMPTS = 3;
const CHILD_TIMEOUT_MS = 300_000;

function studyKey(target = {}, index = 0) {
  return target?.planned?.id || `target-${index + 1}`;
}

async function runSingleAttempt(targets, root, attemptNumber) {
  const inputPath = path.join(root, `dense-attempt-${attemptNumber}.json`);
  await fs.writeFile(inputPath, JSON.stringify({ targets }));
  const execution = spawnSync(process.execPath, [SINGLE_ATTEMPT_VERIFIER, inputPath], {
    cwd: path.resolve(here, '..'),
    encoding: 'utf8',
    timeout: CHILD_TIMEOUT_MS,
    maxBuffer: 20 * 1024 * 1024
  });

  if (execution.error || execution.status !== 0) {
    return {
      ok: false,
      findings: [{
        code: 'motion-proof-dense-replay-attempt-failed',
        message: `Independent dense replay attempt ${attemptNumber} must execute successfully before Motion proof can become authoritative.`,
        status: execution.status ?? null,
        signal: execution.signal ?? null,
        error: execution.error?.message ?? null,
        stderr: String(execution.stderr ?? '').slice(-4000)
      }],
      results: []
    };
  }

  try {
    const parsed = JSON.parse(execution.stdout || '{}');
    return {
      ok: true,
      findings: Array.isArray(parsed?.findings) ? parsed.findings : [],
      results: Array.isArray(parsed?.results) ? parsed.results : []
    };
  } catch (error) {
    return {
      ok: false,
      findings: [{
        code: 'motion-proof-dense-replay-attempt-output-invalid',
        message: `Independent dense replay attempt ${attemptNumber} must emit valid JSON.`,
        error: error?.message ?? null
      }],
      results: []
    };
  }
}

function resultForStudy(attemptResult, studyId) {
  return attemptResult.results.find((item) => item?.studyId === studyId) ?? null;
}

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Dense Motion multi-replay verifier input path is required.');
const payload = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const targets = Array.isArray(payload.targets) ? payload.targets : [];
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-studio-motion-dense-multireplay-'));

const state = new Map(targets.map((target, index) => [studyKey(target, index), {
  target,
  attempts: [],
  verified: false,
  hardFailure: null
}]));

try {
  let pendingIds = [...state.keys()];

  for (let attemptNumber = 1; attemptNumber <= MAX_REPLAY_ATTEMPTS && pendingIds.length; attemptNumber += 1) {
    const pendingTargets = pendingIds.map((id) => state.get(id).target);
    const attempt = await runSingleAttempt(pendingTargets, root, attemptNumber);

    if (!attempt.ok) {
      for (const id of pendingIds) {
        state.get(id).hardFailure = attempt.findings.map((item) => ({ ...item, studyId: id }));
      }
      pendingIds = [];
      break;
    }

    const nextPending = [];
    for (const id of pendingIds) {
      const entry = state.get(id);
      const result = resultForStudy(attempt, id);
      if (!result) {
        entry.hardFailure = [{
          code: 'motion-proof-dense-replay-study-result-missing',
          message: `Independent dense replay attempt ${attemptNumber} did not return the requested study result.`,
          studyId: id
        }];
        continue;
      }

      const stamped = { ...result, attemptNumber };
      entry.attempts.push(stamped);
      const classification = classifyDenseAttempt(stamped);

      if (classification.hardFailure) {
        entry.hardFailure = classification.findings.map((item) => ({ ...item, attemptNumber }));
        continue;
      }

      const authority = selectCompleteDenseAttempt(entry.attempts);
      if (authority.verified) {
        entry.verified = true;
        continue;
      }

      if (classification.retryable && attemptNumber < MAX_REPLAY_ATTEMPTS) {
        nextPending.push(id);
      }
    }
    pendingIds = nextPending;
  }

  const results = [];
  const findings = [];

  for (const [studyId, entry] of state) {
    if (entry.hardFailure?.length) {
      const hardFindings = entry.hardFailure.map((item) => ({ ...item, studyId: item?.studyId ?? studyId }));
      findings.push(...hardFindings);
      results.push({ studyId, verified: false, attempts: entry.attempts.length, findings: hardFindings });
      continue;
    }

    const authority = selectCompleteDenseAttempt(entry.attempts);
    if (entry.verified && authority.verified) {
      results.push({
        studyId,
        verified: true,
        attempts: entry.attempts.length,
        selectedAttempt: authority.selectedAttemptIndex + 1,
        findings: []
      });
      continue;
    }

    const best = bestDenseAttempt(entry.attempts);
    const bestFindings = Array.isArray(best?.findings) && best.findings.length
      ? best.findings.map((item) => ({
          ...item,
          studyId: item?.studyId ?? studyId,
          message: `${item?.message ?? 'Dense temporal correspondence was not proven.'} No single independent replay satisfied the complete raw-density authority contract after ${entry.attempts.length} attempt(s); metrics are from the best single attempt and are not aggregated across attempts.`
        }))
      : [{
          code: 'motion-proof-dense-video-timeline-mismatch',
          message: `No single independent replay satisfied the complete raw-density authority contract after ${entry.attempts.length} attempt(s); attempt evidence is never aggregated.`,
          studyId
        }];
    findings.push(...bestFindings);
    results.push({ studyId, verified: false, attempts: entry.attempts.length, findings: bestFindings });
  }

  process.stdout.write(JSON.stringify({
    verified: targets.length > 0 && findings.length === 0 && results.every((item) => item.verified === true),
    maxReplayAttempts: MAX_REPLAY_ATTEMPTS,
    results,
    findings
  }));
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
