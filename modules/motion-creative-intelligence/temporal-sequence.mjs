function betterAlignment(left, right) {
  if (!left) return right;
  if (!right) return left;
  if (left.matches.length !== right.matches.length) return left.matches.length > right.matches.length ? left : right;
  if (left.driftSum !== right.driftSum) return left.driftSum < right.driftSum ? left : right;
  if (left.meanDeltaSum !== right.meanDeltaSum) return left.meanDeltaSum < right.meanDeltaSum ? left : right;
  if (left.outlierShareSum !== right.outlierShareSum) return left.outlierShareSum < right.outlierShareSum ? left : right;
  return left;
}

function validPair(candidate, leftCount, rightCount) {
  const left = Number(candidate?.left);
  const right = Number(candidate?.right);
  return Number.isInteger(left)
    && Number.isInteger(right)
    && left >= 0
    && right >= 0
    && left < leftCount
    && right < rightCount;
}

function longestUncoveredRun(count, coveredIndexes) {
  const covered = new Set(coveredIndexes);
  let longest = 0;
  let current = 0;
  for (let index = 0; index < count; index += 1) {
    if (covered.has(index)) current = 0;
    else {
      current += 1;
      longest = Math.max(longest, current);
    }
  }
  return longest;
}

export function findOptimalMonotonicMatches(leftCount, rightCount, candidates = []) {
  if (!Number.isInteger(leftCount) || !Number.isInteger(rightCount) || leftCount < 0 || rightCount < 0 || !Array.isArray(candidates)) return [];

  const byPair = new Map();
  for (const candidate of candidates) {
    const left = Number(candidate?.left);
    const right = Number(candidate?.right);
    if (!validPair(candidate, leftCount, rightCount)) continue;
    const key = `${left}:${right}`;
    const normalized = {
      ...candidate,
      left,
      right,
      drift: Number.isFinite(candidate?.drift) ? Number(candidate.drift) : Infinity,
      distance: {
        meanDelta: Number.isFinite(candidate?.distance?.meanDelta) ? Number(candidate.distance.meanDelta) : Infinity,
        outlierShare: Number.isFinite(candidate?.distance?.outlierShare) ? Number(candidate.distance.outlierShare) : Infinity
      }
    };
    const existing = byPair.get(key);
    if (!existing
      || normalized.drift < existing.drift
      || (normalized.drift === existing.drift && normalized.distance.meanDelta < existing.distance.meanDelta)
      || (normalized.drift === existing.drift && normalized.distance.meanDelta === existing.distance.meanDelta && normalized.distance.outlierShare < existing.distance.outlierShare)) {
      byPair.set(key, normalized);
    }
  }

  const memo = new Map();
  const solve = (left, right) => {
    if (left >= leftCount || right >= rightCount) return { matches: [], driftSum: 0, meanDeltaSum: 0, outlierShareSum: 0 };
    const key = `${left}:${right}`;
    if (memo.has(key)) return memo.get(key);

    let best = betterAlignment(solve(left + 1, right), solve(left, right + 1));
    const candidate = byPair.get(key);
    if (candidate) {
      const tail = solve(left + 1, right + 1);
      best = betterAlignment(best, {
        matches: [candidate, ...tail.matches],
        driftSum: candidate.drift + tail.driftSum,
        meanDeltaSum: candidate.distance.meanDelta + tail.meanDeltaSum,
        outlierShareSum: candidate.distance.outlierShare + tail.outlierShareSum
      });
    }

    memo.set(key, best);
    return best;
  };

  return solve(0, 0).matches;
}

export function evaluateDenseTemporalCoverage(leftCount, rightCount, candidates = []) {
  if (!Number.isInteger(leftCount)
    || !Number.isInteger(rightCount)
    || leftCount <= 0
    || rightCount <= 0
    || !Array.isArray(candidates)) {
    return {
      matches: [],
      leftCoverage: 0,
      rightCoverage: 0,
      monotonicCoverage: 0,
      leftGap: leftCount > 0 ? leftCount : 0,
      rightGap: rightCount > 0 ? rightCount : 0
    };
  }

  const validCandidates = candidates.filter((candidate) => validPair(candidate, leftCount, rightCount));
  const leftCovered = new Set(validCandidates.map((candidate) => Number(candidate.left)));
  const rightCovered = new Set(validCandidates.map((candidate) => Number(candidate.right)));
  const matches = findOptimalMonotonicMatches(leftCount, rightCount, validCandidates);
  const minimumSequenceLength = Math.min(leftCount, rightCount);

  return {
    matches,
    leftCoverage: leftCovered.size / leftCount,
    rightCoverage: rightCovered.size / rightCount,
    monotonicCoverage: minimumSequenceLength ? matches.length / minimumSequenceLength : 0,
    leftGap: longestUncoveredRun(leftCount, leftCovered),
    rightGap: longestUncoveredRun(rightCount, rightCovered)
  };
}
