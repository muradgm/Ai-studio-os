# AI Studio OS — Specialist Skill Architecture v1.2

## Purpose

Skills encode repeatable professional judgment. They are not personas, decorative prompts, or a reason to invoke more agents. A skill must improve a concrete decision, creation task, review, or multi-discipline workflow.

The architecture has four categories:

1. **Role skills** — how a specialist thinks and what they are accountable for.
2. **Task skills** — how a specific piece of work is performed.
3. **Review skills** — how work is independently judged and what blocks approval.
4. **Recipe skills** — how several roles/tasks/reviews compose into a coherent delivery workflow.

## Core rule

`ROUTE MINIMALLY → MAKE → REVIEW INDEPENDENTLY → REVISE ONLY VALIDATED FAILURES`

Do not invoke every skill that appears relevant. Select the smallest set that materially improves the outcome.

## Skill contract

Every catalogued `SKILL.md` must contain:

- Purpose
- When to use
- Inputs required
- Operating principles
- Workflow
- Deliverables
- Review criteria
- Failure modes
- Handoffs

A new skill is rejected if it lacks a distinct responsibility, duplicates an existing skill, or cannot name a real project use case.

## Category boundaries

### Role

Answers: **How should this specialist reason?**

Role skills own professional judgment and tradeoffs. They should not prescribe a whole project workflow and should not self-approve their own output.

Examples: art direction, brand strategy, logo design, motion design, copywriting, product design, Drawing Intelligence, vector geometry.

`creative-skeptic` remains a role skill, but the router invokes it in a separate **challenger lane**. This prevents adversarial review from consuming a required maker slot.

### Task

Answers: **How do we perform this exact operation?**

Task skills are narrower than roles. They define inputs, steps, constraints, and output format for one repeatable activity.

Examples: logo exploration, motion choreography, landing-page layout, headline writing, hero-section design, icon-system construction.

### Review

Answers: **Is this work good enough, and why?**

Review skills must be independent from the maker skill. Findings use `BLOCKER / MAJOR / MINOR / TASTE`. A review must separate strategic mismatch from execution defects.

A review-only route does not invoke maker roles, task skills, or recipes. It receives the artifact and its approved context, then judges independently.

Examples: logo review, motion review, copy review, brand-fit review, creative critique, vector geometry review.

### Recipe

Answers: **How do multiple disciplines produce one deliverable?**

Recipes compose skills but do not replace them. Recipes define stage order, gates, required artifacts, and handoffs. An explicitly requested unknown/inactive recipe is a routing error and blocks rather than silently disappearing.

Examples: brand identity, landing page, scroll cinematic, logo system, icon system.

## Routing policy

- Low-risk, narrow tasks: one role + one task skill; review only if output is public/important.
- Moderate-risk creative work: up to three **maker role** skills + relevant task skills + at least one independent review.
- High-risk or brand-defining work: preserve the needed maker set and add at most one challenger (`creative-skeptic`), domain-specific review, and Council when decisions are expensive or hard to reverse.
- Review-only routes contain reviewers/challengers, never makers/tasks/recipes.
- Recipes may activate several stages, but each stage still obeys minimal routing.
- Never use a reviewer as evidence that its own maker output is correct.
- Never resolve disagreement by averaging aesthetics. Record the tradeoff and choose deliberately.

## Drawing Intelligence subsystem

Drawing Intelligence was added after a separate recurring gap became clear during AI Council icon work: the system could construct precise vector geometry, but it could still spend too much effort polishing the **wrong metaphor**.

Examples that exposed the gap included:

- Council / Decision forms drifting into Git branch/merge vocabulary for a developer audience;
- Provenance drifting into crop/scan/focus vocabulary;
- Authority drifting into crosshair, split-pane, docking, security, or generic route semantics.

These are not geometry defects. They are **pre-geometry design-judgment defects**.

`drawing-intelligence` therefore owns:

- semantic decomposition;
- convention-first versus brand-original decisions;
- learned visual-vocabulary collision checks;
- evidence-backed drawing memory of rejected/accepted metaphors;
- metaphor hypothesis generation;
- semantic primitive planning;
- size-specific information budgets;
- rendered-review requirements;
- structured geometry-intent handoff.

It does **not** own exact SVG coordinates and cannot self-approve its output.

### Brain / hand source of truth

For difficult semantic drawing:

`APPROVED PRODUCT / BRAND INTENT → DRAWING INTELLIGENCE PLAN → GEOMETRY INTENT → VECTOR GEOMETRY SPEC → NORMALIZED SVG → INDEPENDENT REVIEW → ARTIFACT INTEGRITY`

For already-settled conventional controls, the Drawing Intelligence stage may be skipped rather than manufacturing unnecessary novelty.

The executable Drawing Intelligence contract lives in `modules/drawing-intelligence/runtime.mjs`.

## Vector Geometry subsystem

The vector subsystem was added after a real recurring gap became clear: existing logo/icon skills could decide **what** a symbol should be, but no specialist owned exact mathematical construction across SVG coordinates, complex corners, Bézier handles, layers, overlaps, and multi-size icon families.

It adds:

- `vector-geometry-engineer` — role
- `icon-system-construction` — task
- `vector-geometry-review` — review
- `icon-system-recipe` — recipe

Drawing Intelligence now sits upstream when semantic intent is unresolved or collision-prone; Vector Geometry remains the deterministic execution authority.

### Geometry source of truth

`DRAWING INTELLIGENCE HANDOFF (when needed) → GEOMETRY SPEC → NORMALIZED SVG → VECTOR REVIEW → SVG INTEGRITY`

The geometry spec sits above SVG and should record:

- frame/canvas dimensions;
- viewBox and origin;
- grid/subgrid;
- safe area;
- geometric and optical center;
- exact anchor/control-point coordinates;
- angle/radius/corner/terminal families;
- cubic Bézier continuity targets;
- stable shape IDs;
- logical z/layer order;
- masks/clips/overlaps;
- minimum gaps/clearances;
- target-size matrix and optical variants;
- pivots/anchors/paths for motion handoff.

Logical `z` means deterministic SVG layer/paint order. It does not turn SVG into real 3D geometry. Real `x/y/z` scene geometry must be projected by a 3D/motion system before vector output.

The executable math/validation layer lives in `lib/vector-geometry.mjs` and includes cubic Bézier point/derivative/curvature math, C0/C1/C2 join classification, deterministic logical-z ordering, and vector-spec validation.

## Anti-sprawl rule

Do not add a new role merely because a job title exists in industry. Add it only when an existing skill repeatedly fails because a distinct body of judgment is missing.

Before adding a skill, answer:

1. What decision does this skill make that no current skill owns?
2. What input does it require?
3. What artifact does it return?
4. What failure modes does it catch?
5. Which real project demonstrated the need?

Drawing Intelligence meets this bar because AI Council exposed repeated semantic-metaphor failures that neither Product Design nor Vector Geometry owned cleanly: Product Design knew what Authority meant; Vector Geometry could draw it precisely; neither layer owned systematic learned-symbol collision reasoning and pre-geometry drawing plans.

If those answers are weak for future candidates, improve an existing skill instead.

## Core catalog notes

Drawing Intelligence is an active **role** skill and should be routed only for drawings where semantic invention or collision risk materially changes the outcome. It should not consume a maker slot for settled conventional controls.

The machine-readable current catalog is authoritative in `kernel/skill-registry.json`.

## Future specialist candidates

Video direction, sound design, voice direction, retouch specialization, typography, 3D direction, and creative frontend engineering should be promoted into this catalog only when live projects demonstrate a recurring judgment gap. Existing runtime skills continue to handle those capabilities meanwhile.

## Learning

Skill files are living operational knowledge. Update them only from validated evidence: repeated project failures, Council findings, benchmark regressions, user corrections, or proven production constraints. Do not promote one subjective preference into a global rule without recurrence.

Drawing Memory follows the same rule: rejected or accepted visual cues should be stored only when backed by real review evidence, not one unvalidated aesthetic preference.
