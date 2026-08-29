# AI Studio OS agent instructions

## Scope and precedence
This file defines repository-wide invariants. A nested `AGENTS.md` may add stricter local rules for its subtree, but it must not weaken these invariants.

Domain procedures belong in `.agents/skills/**/SKILL.md` and architecture documents. When a task changes domain semantics, read the relevant skill or architecture contract instead of relying on generic assumptions.

## Operating rule
Start from intent. Do not invoke modules, tools, skills, or workflows because they exist. Invoke the smallest sufficient capability because the task justifies it.

## Default decision loop
1. Clarify the intended outcome from available context.
2. Inspect the current implementation before proposing a parallel abstraction.
3. Route to the smallest sufficient workflow.
4. Separate analysis from recommendation and evidence from inference.
5. Use Council only for consequential, uncertain, expensive, or hard-to-reverse decisions.
6. For creative work, calibrate with inspiration before committing to art direction.
7. Preserve business/product truth, dissent, and the distinction between defects and taste preferences.
8. Evaluate before release and observe real outcomes before promoting durable lessons.

## Command semantics
- `question`: identify missing information and hidden assumptions.
- `analyze`: diagnose without prematurely solving.
- `council`: independent specialist review, cross-critique, challenge, synthesis.
- `critique`: find weaknesses in an artifact or proposal.
- `red-team`: attempt to falsify or break the leading solution.
- `review`: compare execution against agreed intent and criteria.
- `improve`: apply only validated improvements.

## Scope discipline
- Make the smallest coherent change that satisfies the task.
- Do not refactor adjacent code without a demonstrated need.
- If requested behavior already exists correctly, do not modify it.
- Reuse existing canonical validators, builders, adapters, and contracts before adding parallel logic.
- Stop when the acceptance criteria are satisfied; speculative future generalization is not completion work.

## Authority integrity
- Never trust self-asserted `reviewReady`, `selected`, `approved`, `productionReady`, or equivalent flags as consequential authority.
- Recompute consequential authority from canonical inputs at public consequential boundaries.
- Human decisions may never be fabricated, inferred from model output, or replaced by optimistic flags.
- Candidate, review, evidence, human-decision, canonical, and production artifacts must remain semantically distinct.
- Bind consequential artifacts to exact project/source/candidate identities where identity matters; detect post-review or post-approval drift.
- A maker cannot self-approve its own output. Independent review is a separate gate.
- Runtime evidence outranks cached truth flags.

## Evidence, truth, and compatibility
- Plans, prompts, and intended outputs are not execution evidence.
- Rendered/generated artifacts must exist before they are treated as rendered/generated evidence.
- Provenance must bind evidence to the artifact and inputs it claims to prove.
- Preserve existing public behavior unless the task explicitly changes it.
- Do not silently activate a new execution mode from ambiguous or legacy inputs.
- Schema changes require explicit compatibility and migration consideration.
- Truth-sensitive real products, people, measurements, rights, permissions, and business claims fail closed when required evidence is missing.

## Creative invariants
- Decompose references into transferable principles; never treat a reference as permission to reproduce its exact composition, geometry, mark, or style package.
- Do not average contradictory references into generic compromise; choose and justify a direction.
- Specialists interpret approved upstream creative/product authority while adding domain craft, taste, restraint, and critique. They do not invent a competing upstream creative universe.
- Technical capability is subordinate to creative and product intent. WebGL, 3D, shaders, motion, generation, or other sophisticated tooling is not a quality score.
- Motion and immersive work must consider reduced-motion, accessibility, device capability, and performance from the start.
- A high average evaluation score never overrides critical failures in authenticity, accessibility, brand fit, business clarity, rights, or authority integrity.

## Engineering and release
- Classify change risk before implementation; do not infer safety from diff size.
- Define invariants and required tests before considering a consequential change complete.
- Code review and security review are distinct when security-sensitive behavior is involved.
- Permission-sensitive changes require server-side authorization, least privilege, and auditability.
- State mutations require validation and a transaction or recovery boundary appropriate to their risk.
- High-risk releases require explicit rollback and observability plans.
- Release readiness is boolean evidence, not an averaged confidence score.

## Validation and completion
- Run the smallest relevant tests first; broaden validation after focused checks pass.
- Add regression coverage for corrected invariants and meaningful failure modes.
- Never weaken a valid assertion merely to make CI green.
- Use expensive browser/full-system proof when the change requires it or at convergence, not reflexively after every edit.
- Before finishing, review the diff for unnecessary changes, verify authority/security boundaries touched by the work, run applicable validation, and report remaining uncertainty truthfully.

## Quality bar
Prefer explicit tradeoffs, evidence, and testable claims over confident generic prose.
