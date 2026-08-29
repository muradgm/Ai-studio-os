# AI Studio OS module instructions

These rules extend the repository root `AGENTS.md` for code under `modules/`.

## Runtime contract layers
Keep these stages explicit when they exist in a workflow:
- input/scaffold
- authored candidate
- review
- rendered or executed evidence
- human decision
- canonical authority
- technical/production handoff

Do not collapse these stages into one object or let an earlier stage impersonate a later one.

## Authority boundaries
- Module outputs may not self-authorize consequential downstream use.
- Revalidate canonical upstream authority at public consequential boundaries instead of trusting cached `reviewReady`, `selected`, `approved`, or equivalent flags.
- Human selection/approval must remain an explicit human event and must bind to the exact candidate it selects.
- Bind project IDs, source IDs, selected candidate IDs, evidence IDs, and schema versions where they are part of authority.
- Detect mutation/drift between review/evidence/approval and downstream consumption.
- Prefer the repository's existing canonical authority validator over a second weaker validator.
- Public exported helpers must not create a weaker bypass around the canonical path.

## Schema discipline
- Give provisional and canonical artifacts different semantics and, when appropriate, different schemas.
- Do not label a plan, scaffold, hypothesis, or candidate with a schema that implies final authority.
- Schema validators should validate structure; authority validators should recompute authority. Do not confuse the two.
- Compatibility behavior must be explicit. Legacy context must not accidentally activate a stricter/new execution mode unless the contract says so.

## Specialist intelligence
- Specialists inherit upstream Product/Creative Thesis/Creative World authority and interpret it with domain expertise.
- Specialists are expected to add craft, taste, restraint, critique, and technically credible options; they are not passive formatters.
- Specialists may not invent a competing upstream creative universe merely because a technically impressive option exists.
- Keep creative intent separate from technology selection. A motion/spatial/material requirement does not by itself select GSAP, Three.js, WebGL, WebGPU, Blender, a physics engine, or a shader implementation.
- When changing domain semantics, read the corresponding `.agents/skills/**/SKILL.md` and relevant architecture document first. Domain procedures belong there; do not duplicate large specialist playbooks into module code comments or this file.

## Creative-production boundaries
- Provider choice is an implementation decision made from capability, availability, budget, evidence, and task priority—not vendor identity as product doctrine.
- Truth-sensitive real products or people require real-source editing/capture when documentary truth is claimed.
- Generated or edited production assets need stable identity, versioning, provenance/rights state, and dependency linkage appropriate to the workflow.
- Rendered proof must be real rendered evidence, not a proof plan or a claimed boolean.
- Motion, spatial, multimodal, and interactive modules must preserve accessibility, reduced-motion, continuity, and performance constraints where relevant.
- Observation/learning modules must keep weak or correlational evidence from becoming durable causal truth.

## Review behavior
- Maker and reviewer responsibilities remain separate.
- Reviewer findings should distinguish blockers/major defects from minor issues and taste preferences where the domain uses that taxonomy.
- Unresolved blockers cannot be averaged away by strong scores elsewhere.
- Repeated patch/regeneration loops require diagnosis; endless retries are a process failure, not progress.

## Tests for consequential module changes
Include the applicable negative cases:
- forged/self-asserted authority flags
- missing project/source identity
- selected-candidate mismatch
- missing or substituted evidence
- post-review/post-approval mutation
- weaker alternate exported API
- legacy compatibility behavior

Use real builders/validators for valid authority chains rather than fabricating valid objects by hand.
