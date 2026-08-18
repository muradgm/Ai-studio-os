---
name: release-review
description: Gate release on code review, security, QA, concrete rollback, and observability evidence rather than confidence or average scores.
---

# release-review

## Procedure
1. Collect the final implementation risk and upstream gate results.
2. Block if code review, security, or QA failed.
3. Require a concrete non-empty rollback/recovery plan for high-risk changes and migrations.
4. Require a concrete non-empty observability plan for non-low-risk changes and external dependencies.
5. Return explicit blockers and release-ready / blocked status.
6. Never average away a failed critical gate.
