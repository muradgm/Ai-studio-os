---
name: style-frame-proof
description: Produce comparable browser-rendered visual proof for every Creative World before human selection, using five representative experience moments per world and preserving truth/approval boundaries.
category: task
version: 1.0
---

# style-frame-proof

## Purpose
Convert 3–5 structurally valid Creative Worlds into **visible evidence** before a creative director chooses one.

The job is not to complete the website. It is to answer: *when these worlds become actual compositions, which ones still have creative potential and which ones collapse into generic design?*

## When to use
- after `creative-world-exploration` is structurally review-ready;
- before human Creative World selection;
- before final Typography Intelligence selection, motion choreography, interaction choreography, or production technology;
- when prose descriptions alone are insufficient to judge art direction.

Do not use this stage to polish one favorite direction while starving the alternatives of effort.

## Inputs required
- one review-ready `ai-studio-os/creative-world-exploration@1`;
- all authored Creative World candidates;
- the shared Creative Thesis and truth boundary;
- real asset availability/provenance when known;
- unresolved image/rights/product unknowns;
- the five canonical proof moments.

## Operating principles
- **Same effort, different worlds.** Each candidate gets the same proof moments and comparable fidelity.
- **Visual proof before preference.** Do not select from prose and then rationalize the visual result.
- **Proxy type is not typography approval.** Use neutral/system proxies to express hierarchy intent; final family selection belongs downstream.
- **Never fabricate documentary product evidence.** If a real product image is unavailable, use an explicit placeholder or abstract material study.
- **Render the design, do not redraw it with an image model.** Evidence PNGs must be browser rasterizations of the actual HTML/CSS/SVG proof.
- **World difference must remain visible.** If three boards look like one template with different decoration, return to Creative World exploration.
- **Desktop beauty is insufficient.** Mobile must preserve the world behavior, not merely stack its sections.
- **Technology stays invisible as a premise.** The proof may be built with ordinary browser primitives even if later execution earns realtime 3D or richer motion.
- **Engineering pass is not creative approval.** Browser success only proves the frames exist and render correctly.

## Workflow
1. Confirm Creative World Exploration is review-ready and still unselected.
2. Build five frame specs for each world: opening, sensory, utility, transition, mobile.
3. Translate world narrative/composition/material rules into actual layout behavior.
4. Use proxy typography to demonstrate hierarchy, rhythm and role contrast without freezing families.
5. Represent truth-sensitive imagery only with real supplied assets or explicit source-required placeholders.
6. Render every frame in Chromium at its canonical viewport.
7. Produce same-moment comparison boards across all worlds.
8. Produce per-world overview boards so internal coherence can be judged.
9. Record exact output hashes, dimensions and source HTML in the manifest.
10. Present the evidence for human critique; do not rank or auto-select a winner.

## Deliverables
- five browser-rendered PNG frames per Creative World;
- matching HTML source for each frame;
- five cross-world comparison PNGs;
- per-world overview boards;
- manifest with SHA-256, dimensions and truth state;
- explicit statement that typography, imagery, world selection and production technology remain unapproved.

## Review criteria
Judge the visual evidence on two separate axes.

**Structural evidence:**
- all frame types exist for all worlds;
- exact viewport dimensions are correct;
- comparison boards include all worlds;
- no fabricated product photography or approval state exists;
- outputs are browser-rendered from their matching sources.

**Creative review:**
- does each world have an unmistakably different silhouette and spatial behavior?
- is the Creative Thesis still visible without reading explanatory prose?
- does the world have a coherent visual logic rather than a collection of stylish sections?
- do type hierarchy and image behavior feel authored rather than default?
- does the utility frame still belong to the same world as the hero?
- does mobile preserve the governing behavior?
- could the entire design move to a competitor unchanged?
- is any direction worth investing in further?

A structural pass cannot answer the creative questions.

## Failure modes
- using the same grid and swapping colors/fonts;
- showing only heroes and avoiding difficult utility states;
- treating a moodboard as a style frame;
- using AI-generated pastry photography as if it were Du Bonheur documentary evidence;
- selecting a world because its browser proof rendered without errors;
- approving a font family from proxy specimens;
- hiding weak mobile behavior;
- adding WebGL/3D simply to make one candidate look more expensive.

## Handoffs
- `creative-world-exploration` supplies the candidate worlds;
- `art-direction` owns the visual interpretation and later selection rationale;
- `creative-skeptic` may reject worlds that become generic once rendered;
- human/creative-director review selects, rejects, or requests another exploration pass;
- a selected world then feeds Typography Intelligence, high-fidelity style frames, motion language and creative engineering.
