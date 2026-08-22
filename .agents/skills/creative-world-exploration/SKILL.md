---
name: creative-world-exploration
description: Turn one reviewed Creative Thesis into 3–5 genuinely different experience-world hypotheses and prepare them for comparable visual proof before selection.
category: task
version: 1.0
---

# creative-world-exploration

## Purpose
Create several fundamentally different interpretations of the same Creative Thesis and make their differences explicit enough to justify visual proof. A Creative World is a coherent point of view about how the experience behaves. It is not a reskin.

## When to use
- after `creative-thesis` is structurally review-ready;
- before typography family approval, motion choreography, interaction choreography, or creative engineering;
- when a project needs real art-direction divergence rather than cosmetic alternatives.

## Inputs required
- one `ai-studio-os/creative-thesis@1` thesis with `reviewReady: true`;
- business/product truths and unresolved risks carried by the thesis;
- opportunity gaps and category rejections;
- relevant real asset constraints.

## Operating principles
- One thesis, several worlds.
- Diverge in behavior, not decoration.
- Technology remains downstream.
- Typography is intent at this stage; do not freeze families.
- Truth constrains expression.
- Mobile is part of the world.
- Structural checks can reject obvious reskins but cannot prove creative difference.
- **Do not select from prose alone.** Viable worlds advance to comparable visual/style-frame proof before human selection.
- Structural readiness is not visual approval.

## Workflow
1. Restate the thesis without implementation nouns.
2. Name project non-negotiables.
3. Create 3–5 world premises.
4. Give each world one `signatureBehavior` that can survive beyond a single layout/effect.
5. Define narrative, composition, image/material, motion, interaction, responsive behavior, and typography intent.
6. Run a category-transfer test: explain why the world belongs to this project.
7. Run pairwise structural divergence; rewrite obvious reskins.
8. Run technology deletion.
9. Run mobile deletion.
10. Prepare all viable worlds for comparable visual proof.
11. Only after proof review, record explicit human selection and evidence references.

## Deliverables
Each world must contain id, label, worldIdea, interpretationOfThesis, signatureBehavior, worldClass, narrativeModel, compositionModel, typographyIntent, imageLanguage, materialLanguage, motionLanguage, interactionModel, responsiveStrategy, soundPolicy, categoryTransferTest, at least two antiPatterns, and unresolved risks.

The exploration also returns pairwise structural heuristic evidence and preserves `selectedAutomatically: false`.

## Typography intent guidance
Good intent describes hierarchy character, role behavior, measurable pressures, and anti-patterns without naming final families. Weak intent names a font or uses category clichés as the whole idea.

## Review criteria
A review-ready exploration has 3–5 complete authored worlds, preserves one thesis, contains no obvious structural reskins, keeps technology downstream, preserves truth/mobile behavior, explains project specificity, and has not selected a winner from prose.

## Failure modes
- A/B/C are the same layout in different colors.
- “Editorial,” “cinematic,” or “minimal” is the whole premise.
- 3D/WebGL is the concept.
- Worlds differ only in adjectives while narrative and interaction are the same.
- Final font families are frozen early.
- Deterministic string differences are mistaken for human creative proof.
- The safest/easiest build wins automatically.
- A world is selected before visual proof is reviewed.

## Handoffs
- `creative-thesis` supplies governing idea and truth boundary.
- `art-direction` authors worlds and visual proofs.
- `creative-skeptic` challenges genericity and category transfer.
- Typography Intelligence consumes only a review-ready + selected world.
- style-frame proof is the next visual gate before selection.
