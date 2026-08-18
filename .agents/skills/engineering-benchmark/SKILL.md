---
name: engineering-benchmark
description: Run deterministic Engineering Runtime regression fixtures and report which safety or release invariant failed.
---

# engineering-benchmark

## Procedure
1. Load the benchmark input and expected invariants.
2. Run the Engineering Runtime without weakening the fixture.
3. Verify stages, risk level, security controls, QA dimensions, and release readiness.
4. Report exact failures.
5. Treat benchmark regressions as blockers for the epoch that introduced them.
