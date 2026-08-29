# AI Studio OS fixture instructions

These rules extend the repository root `AGENTS.md` for code under `fixtures/`.

## Fixture truth
Fixtures must represent states that the real runtime can legitimately produce, unless the fixture is explicitly adversarial/invalid.

- Build valid canonical authority with real builders/validators whenever practical.
- Never fabricate human approval or selection.
- Never fabricate rendered/executed evidence and present it as real evidence.
- Never use cached truth flags to bypass the underlying authority contract.
- Keep project, source, candidate, hypothesis, proof, and evidence IDs deterministic and internally consistent.
- Mark synthetic/test-only evidence explicitly when a test needs it.
- A schema/authority change requires affected fixture producers and consumers to migrate together.
- Prefer one shared canonical fixture helper over multiple subtly inconsistent hand-built copies.

## Adversarial fixtures
Invalid fixtures should make the violated invariant obvious. Prefer changing one dimension at a time—identity, schema, evidence, mutation, approval, or provenance—so failures remain diagnostic.

## Stability
Avoid timestamps, random IDs, provider-specific noise, or environment-sensitive data unless the behavior under test specifically requires them.
