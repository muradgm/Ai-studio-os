export function findStableTerminalAnchorIndex(finalBoundFlags = [], nearTerminalFlags = [], {
  minSuffixSamples = 3,
  maxConsecutiveGaps = 1
} = {}) {
  if (!Array.isArray(finalBoundFlags)
    || !Array.isArray(nearTerminalFlags)
    || finalBoundFlags.length !== nearTerminalFlags.length
    || finalBoundFlags.length < minSuffixSamples
    || minSuffixSamples < 1
    || maxConsecutiveGaps < 0) return -1;

  const tailStart = finalBoundFlags.length - minSuffixSamples;
  if (finalBoundFlags.slice(tailStart).some((value) => value !== true)) return -1;

  let anchorIndex = tailStart;
  let index = tailStart - 1;
  while (index >= 0) {
    if (finalBoundFlags[index] === true) {
      anchorIndex = index;
      index -= 1;
      continue;
    }

    let gapLength = 0;
    while (index >= 0 && finalBoundFlags[index] !== true) {
      gapLength += 1;
      if (gapLength > maxConsecutiveGaps || nearTerminalFlags[index] !== true) return anchorIndex;
      index -= 1;
    }

    if (index < 0) return anchorIndex;
    anchorIndex = index;
    index -= 1;
  }

  return anchorIndex;
}
