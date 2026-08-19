---
name: responsive-immersive-adaptation
category: task
description: Re-authors an expressive desktop experience for mobile, tablet, reduced-motion, touch, and constrained devices instead of merely scaling it down.
---
# Responsive Immersive Adaptation

## Purpose
Preserve the concept across device classes by changing camera, composition, interaction, asset load, and motion intensity where necessary.

## When to use
Use for motion-heavy, spatial, scroll-led, WebGL, or editorial experiences whose desktop behavior cannot simply shrink into a phone viewport.

## Inputs required
Approved desktop direction, content priority, required viewports, touch/keyboard behavior, motion states, renderer/asset budgets, reduced-motion intent, and fallback assets.

## Operating principles
- Mobile is a separate composition, not a scaled desktop.
- Preserve meaning before preserving spectacle.
- Touch, viewport height, orientation, safe areas, thermal cost, and input precision change the design.
- Reduce scene complexity before shrinking essential UI.
- Reduced motion must retain the same information hierarchy.

## Workflow
1. Identify the concept’s non-negotiable meaning.
2. Define mobile/tablet composition and interaction states.
3. Adjust camera, crop, asset density, motion, and controls.
4. Author reduced-motion and low-performance variants.
5. Capture every required viewport in a real browser.
6. Inspect overflow, legibility, tap targets, content order, and motion behavior.
7. Patch failures and recapture.

## Deliverables
Viewport behavior matrix, mobile/tablet implementation, reduced-motion behavior, low-performance fallback, and browser-capture evidence.

## Review criteria
The concept survives, essential content stays readable/operable, interaction matches the input device, no horizontal overflow exists, and expensive effects are reduced where they no longer pay for themselves.

## Failure modes
Scaling canvas/CSS uniformly, hiding important content on mobile, desktop camera squeezed into portrait, hover-dependent controls, tiny typography, thermal-heavy effects, or “reduced motion” that removes context.

## Handoffs
Creative Developer, Motion Engineer, and Realtime WebGL Engineer collaborate. Responsive Motion Review, Accessibility Delivery Review, and Performance Budget Review approve independently.
