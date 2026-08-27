const RETRYABLE_DENSE_CODES = new Set([
  'motion-proof-dense-video-timeline-mismatch'
]);

function findingsOf(result = {}) {
  return Array.isArray(result?.findings) ? result.findings : [];
}

export function classifyDenseAttempt(result = {}) {
  const findings = findingsOf(result);
  const verified = result?.verified === true && findings.length === 0;
  const retryable = !verified
    && findings.length > 0
    && findings.every((item) => RETRYABLE_DENSE_CODES.has(item?.code));

  return {
    verified,
    retryable,
    hardFailure: !verified && !retryable,
    findings
  };
}

function numericMatch(message, pattern, fallback) {
  const match = String(message ?? '').match(pattern);
  const value = Number(match?.[1]);
  return Number.isFinite(value) ? value : fallback;
}

export function denseAttemptDiagnosticScore(result = {}) {
  const message = findingsOf(result).map((item) => item?.message ?? '').join(' ');
  const submittedCoverage = numericMatch(message, /submitted coverage ([\d.]+)%/i, 0);
  const independentCoverage = numericMatch(message, /independent coverage ([\d.]+)%/i, 0);
  const monotonicCoverage = numericMatch(message, /monotonic coverage ([\d.]+)%/i, 0);
  const matchedSpan = numericMatch(message, /matched-span ratio ([\d.]+)%/i, 0);
  const submittedGap = numericMatch(message, /submitted max raw gap (\d+)/i, 99);
  const independentGap = numericMatch(message, /independent max raw gap (\d+)/i, 99);
  const drift = numericMatch(message, /max terminal-relative drift ([\d.]+)/i, 99);

  const weakestCoverage = Math.min(submittedCoverage, independentCoverage, monotonicCoverage, matchedSpan);
  return weakestCoverage - (Math.max(submittedGap, independentGap) * 2) - (drift * 10);
}

export function selectCompleteDenseAttempt(attempts = []) {
  const normalized = Array.isArray(attempts) ? attempts : [];
  const classifications = normalized.map(classifyDenseAttempt);
  const hardFailureIndex = classifications.findIndex((item) => item.hardFailure);
  if (hardFailureIndex >= 0) {
    return {
      verified: false,
      selectedAttemptIndex: null,
      hardFailureIndex,
      retryableOnly: false
    };
  }

  const selectedAttemptIndex = classifications.findIndex((item) => item.verified);
  if (selectedAttemptIndex >= 0) {
    return {
      verified: true,
      selectedAttemptIndex,
      hardFailureIndex: null,
      retryableOnly: false
    };
  }

  return {
    verified: false,
    selectedAttemptIndex: null,
    hardFailureIndex: null,
    retryableOnly: classifications.length > 0 && classifications.every((item) => item.retryable)
  };
}

export function bestDenseAttempt(attempts = []) {
  const normalized = Array.isArray(attempts) ? attempts : [];
  if (!normalized.length) return null;
  let best = normalized[0];
  let bestScore = denseAttemptDiagnosticScore(best);
  for (const candidate of normalized.slice(1)) {
    const score = denseAttemptDiagnosticScore(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}
