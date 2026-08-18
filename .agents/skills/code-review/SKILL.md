---
name: code-review
description: Review implementation evidence for correctness, regressions, passing tests, maintainability, and scope with severity-based merge gates.
---

# code-review

## Procedure
1. Read the actual diff and relevant surrounding code when available.
2. Compare the change against the approved spec and invariants.
3. Verify every required test has an explicit passing result; test presence alone is insufficient.
4. Classify findings as blocker, major, minor, or taste.
5. Keep security-specific findings visible but route them through security-review too.
6. Do not approve with blocker/major findings, missing test results, or failing required tests.
