# Creative World Runtime

## Why this exists

AI Studio OS already has strong execution infrastructure after a direction is approved: production routing, browser builds, motion/realtime capabilities, responsive evidence, performance/accessibility gates, and bounded patch loops.

The current quality bottleneck is earlier: understanding the real product, then turning product truth and research into an exceptional, ownable creative idea and visual world before implementation begins.

The Creative World Runtime closes that gap.

## Target flow

```text
PROJECT / REPOSITORY / BUSINESS SOURCES
        ↓
PRODUCT UNDERSTANDING
        ↓
PRODUCT EVIDENCE + UNCERTAINTY GATE
        ↓
RESEARCH + INSPIRATION EVIDENCE
        ↓
CREATIVE THESIS
        ↓
CREATIVE WORLD DIVERGENCE
        ↓
STYLE FRAMES
        ↓
TYPOGRAPHY / IMAGE / MATERIAL LANGUAGE
        ↓
MOTION LANGUAGE
        ↓
INTERACTION CHOREOGRAPHY
        ↓
SOUND LANGUAGE WHEN JUSTIFIED
        ↓
RESPONSIVE ART DIRECTION
        ↓
INDEPENDENT CREATIVE REVIEW
        ↓
APPROVED EXPERIENCE DIRECTION
        ↓
EXISTING CREATIVE ENGINEERING RUNTIME
```

Technology is downstream. WebGL, Three.js, GSAP, Rive, Blender, video, generative imagery, and other tools are capabilities selected only after the product is understood and the creative idea earns them.

## Slice 0 — Product Understanding v1

Status: implemented on `feature/product-understanding-v1`.

Purpose: prevent AI Studio OS from generating visual worlds from a name, category, screenshot, or thin brief before it can explain what the product actually is.

The slice adds:

- `modules/product-understanding/CONTRACT.md`
- `modules/product-understanding/runtime.mjs`
- `.agents/skills/product-understanding/SKILL.md`
- a fail-closed Product Understanding gate before brand-defining creative routes
- Creative Runtime blocking semantics before inspiration / Creative Thesis
- evidence coverage and confidence requirements
- AI Council as the first repository-driven dogfood Product Understanding report
- regression coverage for missing mechanics/evidence, authorship, routing order, and downstream blocking

### Gate truth boundary

The runtime can normalize and validate an authored report. It does not pretend a template or a product name is senior product understanding.

A report becomes `ready-for-creative-thesis` only when:

- concrete project/product evidence is mapped to required dimensions,
- product mechanics, users, jobs, differentiation, trust/governance, perception and non-negotiables are explicit,
- material unknowns remain visible,
- authorship is evidence-backed,
- confidence is at least `0.75`,
- there are no blocker or major findings.

If the report is not ready:

```text
DO NOT CREATE CREATIVE THESIS
DO NOT CREATE CREATIVE WORLDS
DO NOT GENERATE ART DIRECTION
```

## Slice 1 — Creative Thesis v1

Status: implemented.

Purpose: force one project-specific governing idea between Product Understanding / Inspiration and Creative Direction.

The slice adds:

- `modules/creative-thesis/CONTRACT.md`
- `modules/creative-thesis/runtime.mjs`
- `.agents/skills/creative-thesis/SKILL.md`
- routing before Creative Direction for brand-defining workflows
- skill-registry entry
- Creative Runtime integration
- Du Bonheur benchmark binding
- regression coverage for truth anchors, anti-generic rules, technology neutrality, authored-vs-scaffold state, and fail-closed approval semantics

### Truth boundary

The runtime can create a **deterministic scaffold**, but it intentionally marks that state `provisional`. A scaffold is not creative authorship.

A thesis can become structurally `ready-for-creative-direction-review` only when an authored candidate is supplied and passes the contract. Even then:

- human creative approval remains false;
- the thesis is not frozen;
- downstream art direction still needs independent review.

This prevents deterministic template prose from being mistaken for high-quality creative judgment.

## Planned / continuing slices

### Slice 2 — Creative World exploration
Generate 3–5 genuinely different visual-world hypotheses from one reviewed thesis. Difference must occur at the world/concept level, not palette/type/layout reskins.

### Slice 3 — Style-frame production
Produce high-fidelity opening, narrative, product, transition, information, and closing states before implementation.

### Slice 4 — Creative-direction review
Independent lenses for thesis fit, originality, visual ownership, typography/composition, asset language, and category-transfer risk.

### Slice 5 — Motion language
Define authored rhythm, easing, state change, continuity, entrance/exit behavior, signature motion, and reduced-motion equivalents before GSAP/Rive/realtime implementation.

### Slice 6 — Interaction choreography
Storyboard scroll, pointer, click/tap, scene change, continuity, and mobile substitutions as experience behavior rather than generic animation requests.

### Slice 7 — Responsive art direction
Preserve the creative idea across mobile/tablet/desktop rather than merely stacking the desktop layout.

### Slice 8 — Asset-production language
Decide what must be captured, retouched, illustrated, filmed, modeled, simulated, generated, or left absent; maintain provenance and rights truth.

### Slice 9 — Full-site production benchmark
Dogfood the entire Product Understanding → Creative World → Creative Engineering path on complete real projects and judge the final experience, not only pipeline completion.

## Benchmark principle

`Product name ≠ Product understanding.`

`Engineering pass ≠ Creative pass.`

A build can be responsive, fast, accessible, and technically correct while still being generic or visually weak. Creative release requires a separate approval gate.
