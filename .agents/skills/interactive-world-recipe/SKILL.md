---
name: interactive-world-recipe
category: recipe
description: Orchestrates a realtime web world with spatial navigation, 3D asset production, interaction/state systems, motion, fallbacks, browser observation, and strict performance/accessibility delivery gates.
---
# Interactive World Recipe

## Purpose
Build a browser experience closer to a small realtime application/game world than a conventional page while retaining web accessibility, content, and delivery discipline.

## When to use
Use only when spatial exploration or realtime world interaction is central to the concept—not merely because 3D is visually attractive.

## Inputs required
World concept, navigation/task model, content map, scene/camera intent, interaction/input model, 3D asset plan, loading strategy, device matrix, fallback experience, reduced-motion behavior, performance budgets, and rights/provenance.

## Operating principles
- Treat the world as an application state system, not a long animation.
- Progressive loading and recovery are core UX.
- Keyboard, touch, pointer, and optional gamepad behavior must be intentional.
- Essential information cannot exist only as texture/canvas content.
- Physics is used only where interaction meaning needs it.
- Build a simpler accessible fallback rather than pretending every device can run the full world.
- Instrument before expanding scene complexity.

## Workflow
1. Validate why a realtime world is necessary.
2. Define world states, navigation, input, and content equivalents.
3. Create Creative Engineering Plan, renderer policy, and budgets.
4. Build static/accessible shell and loading/failure states.
5. Prepare optimized 3D assets.
6. Construct the minimum realtime scene and camera.
7. Add interactions/physics/motion incrementally with measurements.
8. Author mobile/reduced-motion/low-performance experiences.
9. Capture and exercise the actual browser artifact.
10. Run WebGL, Creative Development, Responsive Motion, Performance, and Accessibility reviews.
11. Patch within iteration cap, recapture, and release.

## Deliverables
Runnable world, semantic shell, scene/asset manifests, input/state maps, fallback experience, responsive/reduced-motion modes, performance evidence, browser captures, and review history.

## Review criteria
Spatial interaction is conceptually necessary, the world is stable and recoverable, content remains accessible, required devices have authored modes, realtime budgets pass, and independent reviewers have no unresolved blockers/majors.

## Failure modes
Portfolio-as-game with no reason, uncontrolled physics, long preloads, desktop keyboard assumptions, giant one-scene architecture, inaccessible canvas text, no respawn/recovery, missing low-end fallback, or equating 60 FPS on one machine with production readiness.

## Handoffs
Composes Product/Art/Motion direction with Creative Developer, Realtime WebGL Engineer, Motion Engineer, and 3D Technical Artist. WebGL, Creative Development, Responsive Motion, Performance, and Accessibility reviews are mandatory independent gates.
