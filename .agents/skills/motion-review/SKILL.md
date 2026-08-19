---
name: motion-review
description: Independently review motion for purpose, hierarchy, choreography, timing, state logic, accessibility, continuity, and performance rather than decorative novelty.
category: review
version: 1.0
---

# motion-review

## Purpose
Judge whether motion improves comprehension, interaction, narrative, and brand behavior without adding delay, distraction, fragility, or unnecessary technical cost.

## When to use
- Hero motion, scroll narratives, logo motion, UI transitions, 3D/product storytelling, brand-film sequences.
- Before public release of moderate/high-impact motion.

## Inputs required
- Motion principles and creative direction.
- Key-state/choreography specification.
- Prototype/render in intended viewport/device conditions.
- Reduced-motion behavior.
- Performance target and implementation constraints.

## Operating principles
- Review motion as a sequence of state changes, not as a collection of effects.
- Every major movement must have a purpose: orientation, feedback, hierarchy, narrative, causality, or brand expression.
- Motion that hides weak hierarchy is a design defect, not a solution.
- Reduced-motion must preserve meaning and access.
- Performance, interruption, replay, resize, and off-screen behavior are part of quality.
- Severity: BLOCKER / MAJOR / MINOR / TASTE.

## Workflow
1. Watch once without notes and record attention order and perceived purpose.
2. Compare the perceived sequence to the intended state/narrative model.
3. Inspect timing, easing consistency, overlap, pacing, idle behavior, and user control.
4. Test interruption: fast scroll, back navigation, resize, repeated interaction, reduced motion.
5. Identify decorative loops, scroll-jacking, long intros, camera movement without meaning, and competing simultaneous motion.
6. Check implementation/performance evidence where continuous WebGL/video/large media is involved.
7. Classify findings and return APPROVE / REVISE / REJECT.

## Deliverables
- Cold-watch attention/purpose summary.
- Choreography findings.
- Timing/easing findings.
- Interaction/interruption findings.
- Reduced-motion/accessibility findings.
- Performance risk findings.
- Decision and prioritized corrections.

## Review criteria
- Clear attention hierarchy.
- Motion purpose is perceptible without explanation.
- Responsive interaction and appropriate pacing.
- Consistent motion grammar.
- Reduced-motion equivalence.
- Realistic performance and implementation.
- No persistent decorative competition with content.

## Failure modes
- Calling all slow motion “cinematic.”
- Demanding more animation because a page feels static.
- Ignoring that users can scroll faster than the storyboard assumes.
- Approving a beautiful video that cannot become a responsive interaction.
- Treating reduced motion as `display:none` for meaningful content.
- Focusing on easing minutiae while the state sequence is conceptually weak.

## Handoffs
- `motion-designer` revises motion language.
- `motion-choreography` revises timed state order.
- `creative-critic` evaluates the broader creative role of motion.
- Engineering/performance review handles implementation-specific blockers.
