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
VISUAL WORLD PROOF
        ↓
HUMAN WORLD SELECTION
        ↓
HIGH-FIDELITY STYLE FRAMES
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

## Slice 2 — Creative World Exploration v1

Status: implemented on `feature/creative-world-exploration-v1`.

Purpose: take one reviewed Creative Thesis and require 3–5 authored experience worlds that differ at the **structural world level**, not by palette/type/layout reskin.

The slice adds:

- `modules/creative-world/CONTRACT.md`
- `modules/creative-world/runtime.mjs`
- `.agents/skills/creative-world-exploration/SKILL.md`
- a canonical `ai-studio-os/creative-world@1` candidate/selected-world contract
- pairwise structural divergence review across narrative, composition, image, motion, interaction, responsive behavior, and world class
- a technology-neutrality gate
- typography-intent handoff without premature family freezing
- explicit human-selection requirement; automated scoring cannot pick the winner
- Creative Runtime integration between Creative Thesis and Creative Direction
- Du Bonheur benchmark candidates that prove three materially different worlds while deliberately leaving selection unresolved
- focused tests for thesis readiness, cosmetic variants, technology-as-concept failure, and human selection truth

### Selection boundary

Creative World structural review can reject incomplete or cosmetic candidates, but it cannot choose the winning world.

A world becomes selected only when an explicit selection input provides:

```text
worldId
humanConfirmed === true
```

Even then:

```text
styleFrameReviewComplete: false
typographyApproved: false
productionTechnologyApproved: false
```

Selection means **advance this world to deeper visual proof**, not “the website is creatively approved.”

### Typography composition boundary

Creative World owns typography intent. Typography Intelligence later owns evidence-backed candidate search and measured application. A final typography system still requires Typography Art Direction / visual specimen review before canonicalization.

This is also where the open Typography Intelligence branch will eventually compose:

```text
Creative Thesis
→ Selected Creative World
→ Typography Intent
→ Typography Intelligence
→ Typography System Exploration
→ Visual / Optical Review
→ Canonical Consumption Contract
```

## Slice 3 — Visual World Proof / Style Frame Proof v1

Status: implemented on `feature/du-bonheur-style-frame-proof-v1`.

Purpose: make the candidate worlds visible **before selection** so a structurally valid world cannot win merely because its prose sounds good.

The slice adds:

- `modules/style-frame/CONTRACT.md`
- `modules/style-frame/runtime.mjs`
- `.agents/skills/style-frame-proof/SKILL.md`
- a canonical five-frame proof plan for every candidate world
- exact Chromium rasterization from HTML/CSS/SVG rather than image-model redraws
- source HTML beside every PNG
- same-moment cross-world comparison boards
- per-world overview boards
- CI artifact production for visual review
- explicit proxy typography and documentary-image truth boundaries
- regression coverage for frame coverage, mobile proof, selection truth and premature typography approval

### Canonical proof moments

Every Creative World receives:

1. Opening / Hero
2. Product / Sensory
3. Information / Utility
4. Narrative Transition
5. Mobile Interpretation

For the current Du Bonheur benchmark, three worlds therefore produce 15 individual frames plus five same-moment comparison boards and three world overview boards.

### Visual truth boundary

The proof uses browser-native layout, CSS and SVG with local/system typography proxies. It may use abstract non-documentary material studies, but it cannot fabricate a Du Bonheur product photograph when a real source is required.

The evidence manifest must remain:

```text
humanVisualApproval: false
humanWorldSelectionConfirmed: false
selectedWorldId: null
typographyApproved: false
productionTechnologyApproved: false
productionReady: false
```

A green browser proof means the proposed world is visible and comparable. It does **not** mean the world is creatively good.

## Planned slices

### Slice 4 — Creative-direction / visual-world review
Use independent lenses for thesis fit, originality, visual ownership, typography/composition, asset language, category-transfer risk and mobile preservation. The review may reject all worlds; selection is never mandatory.

### Slice 5 — High-fidelity selected-world style frames + Typography Art Direction
After human world selection, deepen the chosen world and compose it with Typography Intelligence through rendered specimens before any canonical font contract is accepted.

### Slice 6 — Motion language
Define authored rhythm, easing, state change, continuity, entrance/exit behavior, signature motion, and reduced-motion equivalents before GSAP/Rive/realtime implementation.

### Slice 7 — Interaction choreography
Storyboard scroll, pointer, click/tap, scene change, continuity, and mobile substitutions as experience behavior rather than generic animation requests.

### Slice 8 — Responsive art direction + asset-production language
Preserve the creative idea across mobile/tablet/desktop and decide what must be captured, retouched, illustrated, filmed, modeled, simulated, generated, or left absent while maintaining provenance and rights truth.

### Slice 9 — Full-site production benchmark
Dogfood the entire Creative World → Creative Engineering path on a complete Du Bonheur experience and judge the final experience, not only pipeline completion.

## Benchmark principle

`Engineering pass ≠ Creative pass.`

A build can be responsive, fast, accessible, and technically correct while still being generic or visually weak. Creative release requires a separate approval gate.
