# AI Studio OS shared-library instructions

These rules extend the repository root `AGENTS.md` for code under `lib/`.

## Role of `lib/`
`lib/` is shared infrastructure and integration glue. Keep it deliberately boring, stable, and reusable.

## Boundaries
- Shared helpers must not invent domain authority or silently become a second orchestration layer.
- Do not embed specialist taste/policy in generic utilities when that policy belongs in a module, skill, or architecture contract.
- Prefer deterministic, side-effect-light functions with explicit inputs and outputs.
- Preserve public compatibility unless the task explicitly changes it.
- Do not silently infer a new execution mode from ambiguous or partial inputs.
- Consequential malformed inputs should fail closed rather than degrade into optimistic defaults.
- Avoid circular/domain-heavy dependency direction from generic helpers into specialist modules.
- Generalize only when there are at least two justified consumers or a canonical architecture requirement; do not build speculative abstractions for hypothetical future reuse.

## Authority and integration
- Shared integration code may transport or validate authority artifacts, but it must not manufacture approval, selection, review readiness, or evidence.
- If a library entry point gates production or another consequential action, recompute or call the canonical authority validator rather than trusting caller-supplied flags.
- Preserve exact identity/provenance fields when adapting artifacts across boundaries.
- Keep provider-specific adapters behind provider-neutral contracts where the architecture requires provider neutrality.

## Change discipline
- Inspect all current call sites before changing a shared contract.
- Add focused regression tests for compatibility and failure behavior.
- Prefer a narrow adapter or helper over broad rewrites of unrelated shared runtime code.
