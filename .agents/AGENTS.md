# AI Studio OS skill-authoring instructions

These rules extend the repository root `AGENTS.md` for `.agents/` and its skill catalog.

## Skill architecture
Specialist skills use four categories:
- `role`: professional judgment and domain expertise
- `task`: repeatable bounded operation
- `review`: independent evaluation
- `recipe`: staged composition of existing roles/tasks/reviews

Do not let a recipe become a giant prompt that erases specialist boundaries.

## Routing and independence
- Use `kernel/skill-registry.json` as the active catalog and `lib/skill-router.mjs` for minimal deterministic routing.
- Do not invoke every plausible specialist. Default routing should remain narrow and proportional to task risk.
- Low-risk narrow work should stay minimal. Moderate-risk work needs independent review where the contract requires it. High-risk consequential creative work may require skeptic/Council involvement.
- A maker skill cannot approve its own output.
- Reviewer findings should separate blocker/major/minor execution issues from taste preferences and distinguish strategic mismatch from implementation defect.

## Skill contract
Every catalogued specialist `SKILL.md` should define, as applicable:
- Purpose
- When to use / when not to use
- Inputs required
- Operating principles
- Workflow or procedure
- Deliverables
- Review criteria
- Failure modes
- Handoffs

Keep instructions specific enough to change behavior, not generic professional-role prose.

## Where knowledge belongs
- Put reusable domain procedure and craft knowledge in the relevant `SKILL.md`.
- Put repository-wide invariants in root `AGENTS.md`.
- Put subtree-specific engineering constraints in the nearest nested `AGENTS.md`.
- Put architecture/status/rationale in `docs/architecture/`.
- Do not duplicate a large domain playbook across `AGENTS.md` and `SKILL.md`; link or require the skill instead.

## Skill-sprawl gate
Add a new skill only when a real project demonstrates a recurring judgment/operation gap that cannot be cleanly solved by improving an existing skill.

Promote skill changes from validated project failures, Council findings, benchmark regressions, user corrections, or recurring production constraints—not from one-off taste preferences.

Before adding a skill:
1. inspect adjacent existing skills;
2. define the unique responsibility and handoff boundary;
3. prove why extending an existing skill is insufficient;
4. register it only if it has a real routing/use case;
5. add or update tests/fixtures for routing or contract behavior when applicable.

## Domain integrity
Detailed logo, vector, motion, multimodal, observation, WebGL/3D, image, typography, and other specialist rules belong in their existing domain skills. Preserve those rules when refactoring the surrounding instruction architecture.
