---
name: benchmark-history
description: Track benchmark runs over commits, detect regressions, distinguish recovered from active failures, and preserve regression history.
---

# benchmark-history

## Procedure
1. Require benchmark ID, commit SHA, timestamp, and boolean pass state for each run.
2. Sort runs chronologically per benchmark.
3. Record every pass-to-fail transition as a regression event.
4. Mark only latest failing benchmarks as active regressions.
5. Keep recovered regression events in history for learning.
6. Block current runtime health on malformed history or active regressions.
