---
name: accessibility-delivery-review
category: review
description: Independently reviews expressive web builds for semantic access, keyboard/touch operability, focus, motion sensitivity, contrast, content equivalence, and fallback behavior.
---
# Accessibility Delivery Review

## Purpose
Ensure creative engineering does not turn essential content or interaction into a visual-only, pointer-only, or motion-dependent experience.

## When to use
Use before delivery of every production website/app, with extra scrutiny for canvas/WebGL, custom controls, motion-heavy storytelling, audio, and unusual navigation.

## Inputs required
Live build, content hierarchy, interaction map, reduced-motion behavior, keyboard/focus states, canvas/WebGL fallbacks, responsive evidence, and known accessibility exceptions.

## Operating principles
- Essential meaning belongs in accessible document/application structure, not pixels alone.
- Keyboard and touch are first-class inputs.
- Reduced-motion is authored behavior, not an afterthought.
- Canvas/WebGL visuals require equivalent accessible context when they convey essential meaning.
- Focus must remain visible and logically ordered.
- Decorative complexity never justifies inaccessible controls.

## Workflow
1. Inspect semantics and reading order.
2. Traverse key flows using keyboard only.
3. Inspect focus visibility, labels, roles, and control states.
4. Verify reduced-motion equivalence and absence of essential motion-only information.
5. Inspect canvas/WebGL fallback/context.
6. Check responsive zoom/reflow and obvious contrast/tap-target failures.
7. Classify findings and issue APPROVE / REVISE / REJECT.

## Deliverables
Verdict, blocker/major/minor findings, affected flows, evidence, and required re-test scope.

## Review criteria
Core content and actions remain perceivable and operable, focus/semantics are coherent, motion alternatives preserve meaning, and unusual visual systems have accessible equivalents.

## Failure modes
Treating accessibility as an automated score only, testing mouse only, hiding focus, replacing semantic controls with divs, canvas-only text, reduced-motion that removes content, or approving exceptions without documenting impact.

## Handoffs
Receives the live build from Creative Developer and motion/realtime specialists. Sends findings to the responsible maker and re-reviews only the affected flows plus regression-sensitive areas.
