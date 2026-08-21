# Creative World Exploration Contract v1

## Purpose

Creative World Exploration turns one structurally reviewed Creative Thesis into **3–5 genuinely different experience-world hypotheses** before style frames, typography selection, motion choreography, or implementation technology are chosen.

A Creative World is not a palette, a font choice, a layout skin, or a WebGL idea. It is a coherent interpretation of the same thesis with consequences for narrative, composition, image/material language, typography intent, motion, interaction, and responsive behavior.

## Canonical flow

```text
REVIEWED CREATIVE THESIS
        ↓
3–5 AUTHORED CREATIVE WORLDS
        ↓
STRUCTURAL DIVERGENCE REVIEW
        ↓
HUMAN / CREATIVE-DIRECTOR WORLD SELECTION
        ↓
SELECTED CREATIVE WORLD
        ↓
STYLE FRAMES + TYPOGRAPHY / IMAGE / MOTION / INTERACTION
```

## Input requirements

- `creativeThesis.schema === "ai-studio-os/creative-thesis@1"`
- `creativeThesis.reviewReady === true`
- 3–5 authored world candidates for a review-ready exploration set
- every candidate must reference the same Creative Thesis rather than silently changing the governing idea
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
antiPatterns
thesisRef
reviewReady
selected
truth
```

### Structural dimensions

Each world must make authored decisions across at least these dimensions:

1. `worldClass` — the kind of experience world being proposed.
2. `narrativeModel` — how information or story progresses.
3. `compositionModel` — how space, hierarchy, rhythm, and density behave.
4. `imageLanguage` — how truthful imagery, illustration, abstraction, or absence is treated.
5. `motionLanguage` — what movement means and how it behaves.
6. `interactionModel` — how users reveal, compare, choose, navigate, or manipulate states.
7. `responsiveStrategy` — how the idea survives mobile and reduced-motion constraints.

Typography intent and material language must also be present, but structural divergence is measured on the seven dimensions above.

## Divergence gate

Every pair of candidate worlds must differ materially in at least **four of seven** structural dimensions.

Differences must be conceptual/behavioral. These do **not** count as meaningful divergence by themselves:

- color changes;
- serif vs sans-serif;
- light vs dark;
- more or less motion;
- centered vs left-aligned hero;
- swapping one animation library for another;
- adding/removing 3D while preserving the same experience logic.

If two worlds are mostly the same world with cosmetic treatment changes, the exploration remains provisional.

## Technology boundary

Implementation technology is downstream.

The following may not become the world idea or its primary differentiator:

- WebGL / WebGPU;
- Three.js;
- GSAP / ScrollTrigger;
- Rive;
- Blender / Houdini;
- shaders;
- generative AI;
- "3D experience" as a standalone concept.

A later production plan may select those capabilities when a world actually requires them.

## Typography boundary

A Creative World may author **typography intent**, not silently freeze a final family.

Good world-level typography intent can specify:

- role behavior;
- hierarchy character;
- category preference when justified;
- desired measured descriptors;
- density / expression / warmth / technicality pressures;
- anti-patterns.

Final font family selection belongs to Typography Intelligence + Typography Art Direction.

## Review state

`reviewReady: true` means the world is structurally complete enough for a human/independent creative review.

It does **not** mean:

- the world is selected;
- style frames have passed;
- typography is approved;
- motion is approved;
- production technology is approved;
- the world is ready to ship.

## Selection boundary

No runtime score may auto-select a world.

A world becomes `selected: true` only when an explicit selection input declares:

```text
worldId
humanConfirmed === true
```

The resulting selected-world contract must preserve:

- the thesis reference;
- selection provenance;
- all unresolved risks;
- `styleFrameReviewComplete: false` until that later slice exists.

## Failure modes

Block or hold when:

- Creative Thesis is missing or not review-ready;
- candidate count is outside 3–5 for a claimed review-ready set;
- a candidate is missing structural dimensions;
- worlds are cosmetic variants;
- a candidate silently changes the thesis;
- technology becomes the creative concept;
- category clichés replace project-specific reasoning;
- selection is inferred from an automated score;
- human selection is fabricated;
- typography families are frozen before typography art-direction review.

## Truth rule

**Engineering pass ≠ Creative pass. Structural world readiness ≠ visual approval.**
