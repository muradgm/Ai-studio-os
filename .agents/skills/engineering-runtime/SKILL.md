---
name: engineering-runtime
description: Run implementation planning, code review, security, QA, and release readiness as one evidence-driven engineering workflow.
---

# engineering-runtime

## Procedure
1. Load the approved spec, architecture context, and intended outcome.
2. Classify change risk before implementation.
3. Define affected surfaces, invariants, required tests, rollback, and observability requirements.
4. Review implementation independently for correctness/regression risk.
5. Run a separate security review derived from the actual change surface.
6. Run QA across required user/system boundaries.
7. Release only when every blocking gate passes.
