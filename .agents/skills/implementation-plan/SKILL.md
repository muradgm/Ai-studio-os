---
name: implementation-plan
description: Convert an approved specification into a bounded implementation plan with risk, invariants, derived tests, rollback, and observability requirements.
---

# implementation-plan

## Procedure
1. Identify changed surfaces and contracts.
2. Classify risk from permissions, writes, migrations, APIs, external I/O, PII, money, and impact.
3. State invariants that must remain true.
4. Derive baseline test obligations from sensitive surfaces, then add domain-specific tests from the specification.
5. Define the smallest safe implementation sequence.
6. Require rollback/recovery and observability proportionate to risk.
