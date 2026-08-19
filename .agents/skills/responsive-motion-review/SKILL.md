---
name: responsive-motion-review
category: review
description: Independently reviews motion and immersive behavior across viewport classes, input modes, resize/orientation changes, reduced-motion settings, and constrained-device fallbacks.
---
# Responsive Motion Review

## Purpose
Verify that authored motion survives real device differences without becoming clipped, nauseating, unreadable, touch-hostile, or conceptually empty.

## When to use
Use for scroll choreography, page transitions, realtime scenes, camera movement, pinned sections, kinetic typography, and other motion whose behavior changes with viewport/input capability.

## Inputs required
Live build, viewport matrix, motion specification, reduced-motion equivalent, browser captures, touch/keyboard behavior, low-performance fallback, and known device constraints.

## Operating principles
- Responsive motion is re-authored, not uniformly scaled.
- Mobile viewport height and orientation changes are runtime events.
- Hover cannot be the only route to meaning.
- Reduced motion must preserve hierarchy and task completion.
- Pinned/scroll-linked sequences must not trap navigation or reading.
- Motion timing may change by device; narrative order should not drift accidentally.

## Workflow
1. Inspect required desktop/tablet/mobile captures.
2. Exercise touch, mouse, keyboard, resize, and orientation-sensitive behavior where applicable.
3. Compare full-motion and reduced-motion states.
4. Inspect clipping, overflow, pinning, interruption, and repeated-entry behavior.
5. Verify low-performance fallback preserves the key idea.
6. Classify findings and issue APPROVE / REVISE / REJECT.

## Deliverables
Viewport-by-viewport verdict, motion-state findings, reduced-motion assessment, input-mode issues, and required recapture targets.

## Review criteria
Motion remains coherent across required device classes, does not hide content or break navigation, respects motion preference, and adapts composition rather than simply shrinking coordinates.

## Failure modes
Desktop-only review, accepting clipped scenes, ignoring address-bar viewport changes, hover-only interactions, disabling all motion without preserving state meaning, or judging mobile from a resized desktop window alone.

## Handoffs
Receives builds from Motion Engineer, Creative Developer, and WebGL Engineer. Sends targeted findings into the patch loop and coordinates accessibility blockers with Accessibility Delivery Review.
