---
name: qa-runtime
description: Build and evaluate functional, regression, permission-boundary, failure-recovery, accessibility, and observability QA from the changed surface.
---

# qa-runtime

## Procedure
1. Derive required QA dimensions from risk and surfaces.
2. Test the intended flow plus invalid, boundary, failure, and regression paths.
3. Exercise permission boundaries separately for authorization-sensitive changes.
4. Exercise failure recovery for writes and migrations.
5. Include accessibility for UI changes and observability checks for high-risk changes.
6. Missing required dimensions block release.
