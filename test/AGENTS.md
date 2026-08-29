# AI Studio OS test instructions

These rules extend the repository root `AGENTS.md` for code under `test/`.

## What tests prove
Tests should prove public behavior, invariants, authority boundaries, and meaningful failure modes—not incidental implementation details.

## Valid fixtures and builders
- Prefer real runtime builders, validators, and canonical fixture helpers for valid authority chains.
- Do not create a supposedly valid authority object by hand-setting `reviewReady: true`, `selected: true`, `approved: true`, `productionReady: true`, or equivalent flags.
- Hand-shaped invalid objects are encouraged for adversarial tests.
- Keep project/source/candidate/evidence identities internally consistent on happy paths.

## Regression policy
Every corrected correctness, authority, provenance, compatibility, security, or evidence-integrity bug should gain a regression test.

When a test fails after hardening:
1. determine whether the runtime violates the intended invariant;
2. determine whether the fixture encoded an invalid shortcut;
3. determine whether the test asserted incidental behavior rather than the contract;
4. only then modify runtime, fixture, or assertion.

Never relax a valid invariant merely to restore green CI.

## Consequential negative cases
When applicable, cover:
- forged/self-asserted truth flags
- missing project/source identity
- selected-candidate mismatch
- missing or substituted rendered evidence
- post-review or post-approval mutation
- schema/version drift
- weaker alternate public APIs
- malformed consequential inputs
- backward-compatibility behavior for legacy inputs

## Execution order
- Run the smallest focused test set first.
- Run the broader suite after focused tests pass.
- Use browser/render/full-CI evidence when the changed contract requires it or at convergence.
- A flaky or environment-dependent proof must be identified as such; do not silently reinterpret it as a deterministic pass.
