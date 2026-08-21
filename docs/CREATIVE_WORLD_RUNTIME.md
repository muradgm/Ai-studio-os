# Creative World Runtime

## Why this exists

AI Studio OS already has strong execution infrastructure after a direction is approved: production routing, browser builds, motion/realtime capabilities, responsive evidence, performance/accessibility gates, and bounded patch loops.

The current quality bottleneck is earlier: turning project truth and research into an exceptional, ownable creative idea and visual world before implementation begins.

The Creative World Runtime closes that gap.

## Target flow

```text
BUSINESS / PRODUCT TRUTH
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

Technology is downstream. WebGL, Three.js, GSAP, Rive, Blender, video, generative imagery, and other tools are capabilities selected only after the creative idea earns them.

## Slice 1 — Creative Thesis v1

Status: implemented on `feature/creative-thesis-v1`.

Purpose: force one project-specific governing idea between Inspiration and Creative Direction.

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

## Planned slices

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
Dogfood the entire Creative World → Creative Engineering path on a complete Du Bonheur experience and judge the final experience, not only pipeline completion.

## Benchmark principle

`Engineering pass ≠ Creative pass.`

A build can be responsive, fast, accessible, and technically correct while still being generic or visually weak. Creative release requires a separate approval gate.