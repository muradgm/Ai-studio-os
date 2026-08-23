# Creative World Exploration Contract v1

## Purpose

Creative World Exploration turns one structurally reviewed Creative Thesis into **3–5 genuinely different experience-world hypotheses** before typography approval, motion choreography, or implementation technology are chosen.

A Creative World is not a palette, a font choice, a layout skin, or a WebGL idea. It is a coherent interpretation of the same thesis with consequences for narrative, composition, image/material language, typography intent, motion, interaction, and responsive behavior.

## Canonical flow

```text
REVIEWED CREATIVE THESIS
        ↓
3–5 AUTHORED CREATIVE WORLDS
        ↓
STRUCTURAL HEURISTIC REVIEW
        ↓
COMPARABLE VISUAL / STYLE-FRAME PROOF
        ↓
HUMAN / CREATIVE-DIRECTOR WORLD SELECTION
        ↓
SELECTED CREATIVE WORLD
        ↓
TYPOGRAPHY / IMAGE / MOTION / INTERACTION ART DIRECTION
```

The key rule is: **prose does not win before visual proof.**

## Input requirements

- `creativeThesis.schema === "ai-studio-os/creative-thesis@1"`
- `creativeThesis.reviewReady === true`
- 3–5 authored world candidates for a review-ready exploration set
- every candidate references the same Creative Thesis
- unresolved project truth remains unresolved

A runtime may produce an authoring brief when authored worlds are absent, but it must not fabricate creative authorship or claim that an empty/template exploration is review-ready.

## Creative World schema

A normalized world uses:

```text
schema: ai-studio-os/creative-world@1
id
label
worldIdea
interpretationOfThesis
signatureBehavior
worldClass
narrativeModel
compositionModel
typographyIntent
imageLanguage
materialLanguage
motionLanguage
interactionModel
responsiveStrategy
soundPolicy
categoryTransferTest
antiPatterns
thesisRef
reviewReady
selected
truth
```

`signatureBehavior` is the experience behavior that makes the world more than an adjective set. `categoryTransferTest.whyProjectSpecific` must explain why the world belongs to this project rather than being reusable category styling.

## Structural dimensions

Each world must make authored decisions across at least these dimensions:

1. `worldClass`
2. `narrativeModel`
3. `compositionModel`
4. `imageLanguage`
5. `motionLanguage`
6. `interactionModel`
7. `responsiveStrategy`

Typography intent and material language must also be present.

## Divergence gate and limitation

Every pair of candidates should differ materially in at least **four of seven** structural dimensions.

The deterministic runtime can detect obvious identical/reskinned fields, but string inequality is only a **structural heuristic**. It does not prove semantic or creative divergence. The contract therefore preserves:

```text
proofLevel: structural-heuristic
humanSemanticDivergenceReviewed: false
```

A later creative/visual review must still judge whether the worlds actually feel different.

These do not count as sufficient divergence by themselves:

- color changes
- serif vs sans-serif
- light vs dark
- more or less motion
- centered vs left-aligned hero
- swapping animation libraries
- adding/removing 3D while preserving the same experience logic

## Technology boundary

Implementation technology is downstream. WebGL/WebGPU, Three.js, GSAP, Rive, Blender/Houdini, shaders, or generative AI may later serve a world but may not be the world idea or primary differentiator.

## Typography boundary

A Creative World authors **typography intent**, not final families. It may specify role behavior, hierarchy character, justified category preferences, descriptor targets, pressures, and anti-patterns. Final family selection belongs to Typography Intelligence + Typography Art Direction.

A selected world becomes typography authority only when it is:

```text
schema: ai-studio-os/creative-world@1
reviewReady: true
selected: true
```

## Review state

`reviewReady: true` means the candidate set is structurally complete enough to proceed to comparable visual proof. It does not mean the worlds are creatively approved or genuinely divergent in human judgment.

## Selection boundary

No automated score may select a world. A world becomes `selected: true` only when selection supplies:

```text
worldId
humanConfirmed === true
visualReviewConfirmed === true
visualEvidenceRefs: [at least one real proof reference]
```

This prevents a persuasive prose description from becoming authoritative before visual evidence exists.

Even after selection:

```text
typographyApproved: false
productionTechnologyApproved: false
```

## Failure modes

Block or hold when the thesis is missing/not review-ready; candidate count is outside 3–5; structural dimensions are missing; candidates are obvious cosmetic variants; technology becomes the concept; project specificity is missing; a winner is inferred automatically; human selection is fabricated; visual proof is absent; or typography families are frozen prematurely.

## Truth rule

**Engineering pass ≠ Creative pass. Structural readiness ≠ semantic divergence proof ≠ visual approval.**
