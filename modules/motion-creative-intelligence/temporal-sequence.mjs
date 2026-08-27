function betterAlignment(left, right) {
  if (!left) return right;
  if (!right) return left;
  if (left.matches.length !== right.matches.length) return left.matches.length > right.matches.length ? left : right;
  if (left.driftSum !== right.driftSum) return left.driftSum < right.driftSum ? left : right;
  if (left.meanDeltaSum !== right.meanDeltaSum) return left.meanDeltaSum < right.meanDeltaSum ? left : right;
  if (left.outlierShareSum !== right.outlierShareSum) return left.outlierShareSum < right.outlierShareSum ? left : right;
  return left;
}

export function findOptimalMonotonicMatches(leftCount, rightCount, candidates = []) {
  if (!Number.isInteger(leftCount) || !Number.isInteger(rightCount) || leftCount < 0 || rightCount < 0 || !Array.isArray(candidates)) return [];

  const byPair = new Map();
  for (const candidate of candidates) {
    const left = Number(candidate?.left);
    const right = Number(candidate?.right);
    if (!Number.isInteger(left) || !Number.isInteger(right) || left < 0 || right < 0 || left >= leftCount || right >= rightCount) continue;
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
