# Epoch 003 — Engineering Runtime

## Goal
Turn implementation, review, security, QA, and release discipline into connected executable gates.

## Capabilities
- risk classification from the change surface
- implementation plans with invariants, tests, rollback, and observability needs
- independent code-review severity gates
- security controls derived from auth/data/API/file/PII surfaces
- QA dimensions derived from risk and changed surfaces
- release readiness that blocks on failed upstream evidence
- Benchmark 002 for a permission-sensitive workspace role update

## Non-goals
- deploying production services
- replacing project-specific CI/CD or threat modeling
- pretending a deterministic checklist can inspect code it has not actually read

The runtime structures and gates evidence. Real code review still requires the actual diff, tests, logs, and repository context.
