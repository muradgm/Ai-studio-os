# Creative World Runtime

## Why this exists
AI Studio OS is stronger after a direction is chosen than it is at creating the direction. The Creative World Runtime closes that gap by forcing project truth → one governing thesis → materially different worlds → visual proof → human selection before production art direction and engineering.

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
COMPARABLE VISUAL / STYLE-FRAME PROOF
        ↓
HUMAN WORLD SELECTION
        ↓
TYPOGRAPHY / IMAGE / MATERIAL ART DIRECTION
        ↓
MOTION LANGUAGE
        ↓
INTERACTION CHOREOGRAPHY
        ↓
RESPONSIVE ART DIRECTION
        ↓
INDEPENDENT CREATIVE REVIEW
        ↓
APPROVED EXPERIENCE DIRECTION
        ↓
EXISTING CREATIVE ENGINEERING RUNTIME
```

Technology is downstream. WebGL, Three.js, GSAP, Rive, Blender, video and generation capabilities are selected only after the creative idea earns them.

## Slice 1 — Creative Thesis v1
Status: merged to `main` through PR #36.

Creative Thesis inserts one project-specific governing idea before downstream art direction. Deterministic scaffolds remain provisional; authored judgment is required for review-ready state.

## Slice 2 — Creative World Exploration v1
Status: mainline integration branch.

Purpose: require 3–5 authored experience worlds that differ at the structural world level, not by palette/type/layout reskin.

Adds:
- `modules/creative-world/CONTRACT.md`
- `modules/creative-world/runtime.mjs`
- `.agents/skills/creative-world-exploration/SKILL.md`
- canonical `ai-studio-os/creative-world@1`
- structural divergence heuristic across world class, narrative, composition, image, motion, interaction and responsive behavior
- explicit `signatureBehavior` and project-specific category-transfer evidence
- technology-neutrality gate
- typography-intent handoff compatible with Typography Intelligence on `main`
- no automatic world selection
- visual-proof-before-selection gate
- Du Bonheur benchmark with three authored worlds and no fabricated winner

### Important limitation
Deterministic field differences are only a structural heuristic. They catch obvious reskins but do not prove semantic or creative divergence. Human/visual review remains required.

### Selection boundary
A world cannot become authoritative from prose alone. Selection requires an explicit world id, human confirmation, visual review confirmation, and real visual evidence references. A selected world still does not imply typography or production-technology approval.

### Typography integration
Typography Intelligence is now on `main`. Its authority contract accepts a Creative World only when `schema === ai-studio-os/creative-world@1`, `reviewReady === true`, and `selected === true`. Slice 2 produces exactly that shape only after visual review-backed human selection.

## Next slices
### Slice 3 — Style-frame / visual-world proof
Produce comparable opening, product/sensory, information/utility, transition and mobile states for **every viable world before selection**.

### Slice 4 — Creative-direction review
Independent lenses for thesis fit, originality, ownership, typography/composition, asset language, and category-transfer risk.

### Slice 5 — Motion language
Define rhythm, easing, state change, continuity, signature motion and reduced-motion equivalents before implementation.

### Slice 6 — Interaction choreography
Storyboard scroll, pointer, click/tap, scene changes and mobile substitutions as experience behavior.

### Slice 7 — Responsive art direction
Preserve the creative idea across mobile/tablet/desktop rather than stacking desktop.

### Slice 8 — Asset-production language
Decide what must be captured, retouched, illustrated, filmed, modeled, simulated, generated or left absent while preserving provenance/rights truth.

### Slice 9 — Full-site production benchmark
Dogfood the complete Creative World → Creative Engineering path on Du Bonheur and judge the final experience, not only pipeline completion.

## Benchmark principle
**Engineering pass ≠ Creative pass. Structural readiness ≠ visual approval.**
