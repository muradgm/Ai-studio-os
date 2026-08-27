import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MOTION_VERIFIER_PATH = path.join(REPO_ROOT, 'scripts', 'verify-motion-proof-browser-artifacts-v2.mjs');
const REDUCED_MOTION_VERIFIER_PATH = path.join(REPO_ROOT, 'scripts', 'verify-motion-proof-reduced-motion-artifacts-v2.mjs');
const COMPARISON_VISIBILITY_VERIFIER_PATH = path.join(REPO_ROOT, 'scripts', 'verify-motion-proof-comparison-visibility.mjs');

function blocker(code, message, evidence = {}) {
  return { severity: 'blocker', code, message, evidence };
}

function runVerifier(verifierPath, targets, tempRoot, label) {
  if (!targets.length) return { verified: true, findings: [] };

  const inputPath = path.join(tempRoot, `${label}-verification-input.json`);
  fs.writeFileSync(inputPath, JSON.stringify({ targets }));
  const execution = spawnSync(process.execPath, [verifierPath, inputPath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 300_000,
    maxBuffer: 20 * 1024 * 1024
  });

  if (execution.error || execution.status !== 0) {
    return {
      verified: false,
      findings: [{
        code: 'motion-proof-independent-browser-verifier-failed',
        message: `${label} Chromium verification must succeed before browser proof can become authoritative.`,
        verifierLabel: label,
        status: execution.status ?? null,
        signal: execution.signal ?? null,
        error: execution.error?.message ?? null,
        stderr: String(execution.stderr ?? '').slice(-4000)
      }]
    };
  }

  try {
    const result = JSON.parse(execution.stdout || '{}');
    return {
      verified: result?.verified === true,
      findings: Array.isArray(result?.findings) ? result.findings.map((item) => ({ ...item, verifierLabel: label })) : []
    };
  } catch (error) {
    return {
      verified: false,
      findings: [{
        code: 'motion-proof-independent-browser-verifier-output-invalid',
        message: `${label} Chromium verifier must emit valid JSON.`,
        verifierLabel: label,
        error: error?.message ?? null
      }]
    };
  }
}

export function verifyIndependentMotionProofBrowserArtifacts(targets = []) {
  if (!Array.isArray(targets) || !targets.length) {
    return {
      verified: false,
      findings: [blocker('motion-proof-independent-browser-targets-missing', 'Real Motion proof requires independently replayable browser verification targets.')]
    };
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-studio-motion-proof-'));

  try {
    const comparisonTargets = targets.filter((target) => target?.kind === 'comparison');
    const reducedMotionTargets = targets.filter((target) => target?.kind !== 'comparison' && target?.planned?.input === 'reduced-motion');
    const motionTargets = targets.filter((target) => target?.kind !== 'comparison' && target?.planned?.input !== 'reduced-motion');

    const motionResult = runVerifier(MOTION_VERIFIER_PATH, motionTargets, tempRoot, 'motion-temporal-authority');
    const reducedMotionResult = runVerifier(REDUCED_MOTION_VERIFIER_PATH, reducedMotionTargets, tempRoot, 'reduced-motion-terminal-state-authority');
    const comparisonResult = runVerifier(COMPARISON_VISIBILITY_VERIFIER_PATH, comparisonTargets, tempRoot, 'comparison-visibility-authority');
    const rawFindings = [...motionResult.findings, ...reducedMotionResult.findings, ...comparisonResult.findings];

    const findings = rawFindings.map((item) => {
      const studyId = item?.studyId ?? null;
      const baseMessage = item?.message || 'Independent browser verification failed.';
      return blocker(
        item?.code || 'motion-proof-independent-browser-verification-failed',
        studyId ? `[${studyId}] ${baseMessage}` : baseMessage,
        {
          studyId,
          comparisonRef: item?.comparisonRef ?? null,
          verifierLabel: item?.verifierLabel ?? null,
          verifierMessage: item?.message ?? null,
          status: item?.status ?? null,
          signal: item?.signal ?? null,
          error: item?.error ?? null,
          stderr: item?.stderr ?? null
        }
      );
    });

    const verified = motionResult.verified === true
      && reducedMotionResult.verified === true
      && comparisonResult.verified === true
      && findings.length === 0;

    if (!verified && findings.length === 0) {
      findings.push(blocker('motion-proof-independent-browser-verification-unproven', 'Independent Chromium verification did not prove the rendered Motion evidence.'));
    }

    return { verified, findings };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}