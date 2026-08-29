# AI Studio OS architecture-document instructions

These rules extend the repository root `AGENTS.md` for `docs/architecture/`.

## Status must be explicit
Architecture documents explain the system; they do not create runtime authority.

Always distinguish among:
- implemented and enforced now
- accepted direction but not implemented
- proposed/exploratory
- deferred
- deprecated/historical

Do not describe roadmap capability as current capability.

## Keep docs bound to executable truth
When a canonical boundary changes:
- update the architecture description that owns it;
- identify the runtime/schema/validator that enforces it;
- preserve the rationale and important rejected alternatives;
- keep diagrams and prose consistent with executable behavior;
- call out migration or compatibility implications.

Prefer linking to canonical contracts, schemas, modules, and skills over duplicating large implementation details.

## Authority language
- A diagram arrow does not create authority.
- A roadmap item does not imply production readiness.
- A proposed schema name must not be described as emitted until code actually emits it.
- Human selection/approval remains a human event even when documentation describes the expected flow.

## Editing discipline
- Update the narrowest relevant document.
- Avoid rewriting unrelated architecture history for stylistic consistency.
- If code and documentation disagree, report the disagreement explicitly and fix the authoritative source rather than papering over it.
