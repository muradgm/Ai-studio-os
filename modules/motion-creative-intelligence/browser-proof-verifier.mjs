import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const VERIFIER_PATH = path.join(REPO_ROOT, 'scripts', 'verify-motion-proof-browser-artifacts.mjs');

function blocker(code, message, evidence = {}) {
  return { severity: 'blocker', code, message, evidence };
}

export function verifyIndependentMotionProofBrowserArtifacts(targets = []) {
  if (!Array.isArray(targets) || !targets.length) {
    return {
      verified: false,
      findings: [blocker('motion-proof-independent-browser-targets-missing', 'Real Motion proof requires independently replayable browser verification targets.')]
    };
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-studio-motion-proof-'));
  const inputPath = path.join(tempRoot, 'verification-input.json');

  try {
    fs.writeFileSync(inputPath, JSON.stringify({ targets }));
    const execution = spawnSync(process.execPath, [VERIFIER_PATH, inputPath], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 180_000,
      maxBuffer: 20 * 1024 * 1024
    });

    if (execution.error || execution.status !== 0) {
      return {
        verified: false,
        findings: [blocker(
          'motion-proof-independent-browser-verifier-failed',
          'Independent Chromium replay/media decoding must succeed before browser proof can become authoritative.',
          {
            status: execution.status ?? null,
            signal: execution.signal ?? null,
            error: execution.error?.message ?? null,
            stderr: String(execution.stderr ?? '').slice(-4000)
          }
        )]
      };
    }

    let result = null;
    try {
      result = JSON.parse(execution.stdout || '{}');
    } catch (error) {
      return {
        verified: false,
        findings: [blocker('motion-proof-independent-browser-verifier-output-invalid', 'Independent browser verifier must emit valid JSON.', { error: error?.message ?? null })]
      };
    }

    const findings = (Array.isArray(result?.findings) ? result.findings : []).map((item) => blocker(
      item?.code || 'motion-proof-independent-browser-verification-failed',
      item?.message || 'Independent browser verification failed.',
      { studyId: item?.studyId ?? null }
    ));

    if (result?.verified !== true && findings.length === 0) {
      findings.push(blocker('motion-proof-independent-browser-verification-unproven', 'Independent Chromium replay/media decoding did not prove the rendered Motion evidence.'));
    }

    return { verified: result?.verified === true && findings.length === 0, findings };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}
