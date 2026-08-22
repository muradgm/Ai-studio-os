---
name: creative-world-exploration
description: Turn one reviewed Creative Thesis into 3–5 genuinely different experience-world hypotheses before style frames, typography approval, motion choreography, or technology selection.
category: task
version: 1.0
---

# creative-world-exploration

## Purpose
Create several **fundamentally different interpretations of the same Creative Thesis** and make their differences explicit enough for a creative director to select one world before downstream execution begins.

A Creative World is a coherent point of view about how the experience behaves. It is not a reskin.

## When to use
- after `creative-thesis` is structurally review-ready;
- before style-frame production, typography family approval, motion language, interaction choreography, or creative engineering;
- when the project needs real art-direction divergence rather than one polished direction with cosmetic alternatives.

Do not invoke when a reviewed/selected Creative World already exists unless upstream truth or the Creative Thesis changed.

## Inputs required
- one `ai-studio-os/creative-thesis@1` thesis with `reviewReady: true`;
- business/product truths and unresolved risks carried by the thesis;
- opportunity gaps and category rejections from upstream research;
- relevant real asset constraints when they materially affect what worlds are possible.

## Operating principles
- **One thesis, several worlds.** Every candidate interprets the same governing idea; none may silently rewrite it.
- **Diverge in behavior, not decoration.** Narrative, composition, imagery, materiality, motion, interaction, and responsive logic should vary materially.
- **No palette theater.** Light/dark, serif/sans, centered/left, or stronger/weaker motion are not sufficient world differences.
- **Technology remains downstream.** WebGL, Three.js, GSAP, Rive, 3D, shaders, Blender, Houdini, or AI generation may later serve a world but may not define it.
- **Typography is intent at this stage.** Define role behavior, pressure, hierarchy, measurable character, and anti-patterns; do not freeze final font families.
- **Truth constrains expression.** A world may reinterpret evidence, cropping, rhythm, and material behavior, but it may not fabricate documentary truth.
- **Mobile is part of the world.** Each candidate must explain how its core idea survives without hover, large canvases, cinematic space, or unrestricted motion.
- **Selection is human.** Scores and structural checks can reject weak candidates; they cannot choose the winner.
- **Structural readiness is not visual approval.** Style frames are the next proof.

## Workflow
1. **Restate the thesis in one sentence.** Remove all implementation nouns.
2. **Name the non-negotiables.** What must every candidate preserve from project truth and the thesis?
3. **Create 3–5 world premises.** Each premise must answer: what kind of world is this, and how does it interpret the thesis?
4. **Define the structural profile.** For every world author narrative, composition, image/material, motion, interaction, and responsive behavior.
5. **Author typography intent.** Define hierarchy character, role behavior, category preference only when justified, descriptor pressures when useful, and anti-patterns.
6. **Run pairwise divergence.** If two worlds differ in fewer than four structural dimensions, kill or rewrite one.
7. **Run technology deletion.** Remove library/tool names; the world must remain coherent.
8. **Run competitor transfer.** If the world can move unchanged to a direct competitor while keeping equal meaning, strengthen its project-specific interpretation.
9. **Run mobile deletion.** Remove hover, cursor, wide-screen staging, and high-motion assumptions. The governing behavior must survive.
10. **Prepare selection review.** Present the worlds with strengths, risks, thesis fit, and explicit reasons not to choose each one.

## Deliverables
Each world should contain:
- `id` and `label`;
- `worldIdea`;
- `interpretationOfThesis`;
- `worldClass`;
- `narrativeModel`;
- `compositionModel`;
- `typographyIntent`;
- `imageLanguage`;
- `materialLanguage`;
- `motionLanguage`;
- `interactionModel`;
- `responsiveStrategy`;
- `soundPolicy`;
- at least two `antiPatterns`;
- unresolved risks.

The exploration set must also return pairwise divergence evidence and preserve `selectedAutomatically: false` until explicit human selection occurs.

## Typography intent guidance
Good typography intent sounds like:
- “Display type should create compressed editorial tension while body text remains highly legible and calm.”
- “Utility text should reuse the body family unless a second functional voice is justified.”
- “Avoid generic luxury high-contrast serif behavior unless the actual world logic earns it.”

Weak typography intent sounds like:
- “Use Playfair Display.”
- “Use a modern sans.”
- “Use mono for metadata because it looks technical.”

## Review criteria
A review-ready exploration should satisfy:
- 3–5 complete authored worlds;
- every world preserves the same thesis;
- every pair differs in at least four structural dimensions;
- no candidate is primarily a technology concept;
- no candidate is merely a palette/font/layout variant;
- typography intent is authored without freezing a family;
- image/material rules preserve truth;
- mobile/responsive behavior preserves the concept;
- anti-patterns are specific enough to stop generic execution;
- no winner has been automatically selected.

## Failure modes
- A/B/C are the same layout in different colors;
- “editorial,” “cinematic,” and “minimal” are used as entire world premises;
- 3D or WebGL is treated as the creative concept;
- every world uses the same narrative sequence and interaction model;
- final font families are frozen before visual specimens are reviewed;
- a high score is mistaken for creative approval;
- the safest/easiest-to-build world wins by default;
- mobile receives a stacked-down desktop afterthought.

## Handoffs
- `creative-thesis` supplies the governing idea and truth boundary;
- `art-direction` authors the candidate worlds and later style frames;
- `creative-skeptic` challenges genericity and competitor transfer on high-risk work;
- Typography Intelligence consumes only a reviewed + selected world and remains advisory until Typography Art Direction approves a system;
- style-frame production is the next visual proof after human world selection.
