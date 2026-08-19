---
name: scroll-cinematic-recipe
description: Compose narrative, motion design, choreography, image/3D/video assets, scroll interaction, reduced-motion fallback, performance, and review into a buildable cinematic web sequence.
category: recipe
version: 1.0
---

# scroll-cinematic-recipe

## Purpose
Create a cinematic scroll experience that tells one coherent story and can survive real responsive implementation, accessibility requirements, and performance budgets.

## When to use
- Brand/product hero narratives, immersive launches, spatial product storytelling.
- Only when motion/scroll is central to the communication goal.

## Inputs required
- Approved creative direction and motion dials.
- Narrative goal and page context.
- Asset inventory and generation/capture needs.
- Target devices/browsers and performance budget.
- Reduced-motion requirement.

## Operating principles
- Scroll progress controls a narrative; it is not permission to animate everything.
- Design semantic states before interpolation.
- Keep text readable and user-controlled; avoid scroll-jacking.
- Live 3D/video must justify load, memory, battery, and rendering cost.
- Provide a meaningful static/reduced-motion path.
- The sequence should resolve into the product/page rather than exist as an unrelated showreel.

## Workflow
1. Define the beginning, transformation, and final useful state.
2. Storyboard 4–8 semantic beats with purpose and content hierarchy.
3. `motion-designer` defines motion grammar; `motion-choreography` specifies timing/progress ranges.
4. `image-director` specifies/generates source imagery; Production Planning selects 3D/video/code tools only as needed.
5. Prototype the highest-risk scene first: camera/3D transition, pinned scroll, or media morph.
6. Implement scroll mapping with interruption, resize, and return-state behavior.
7. Build reduced-motion and low-power fallbacks.
8. Measure load/render/runtime performance on realistic devices.
9. `motion-review` + `creative-critic` independently gate the result.
10. Integrate the sequence into the full page narrative and verify it does not delay the primary action.

## Deliverables
- Beat storyboard.
- State/progress map.
- Motion/choreography spec.
- Asset dependency list.
- Live/rendered media plan.
- Responsive/reduced-motion behavior.
- Performance budget and fallback plan.
- Independent review verdict.

## Review criteria
- Narrative remains clear at different scroll speeds.
- Motion feels authored by the brand rather than copied from a showcase trend.
- Users retain control.
- Essential content is accessible without animation.
- Performance cost is proportionate to communication value.
- Final state connects naturally to the product/interface/content.

## Failure modes
- Pinned scroll section that traps users.
- Generic 3D object floating while copy fades in.
- Dozens of effects without one narrative transformation.
- Critical content only visible at a precise scroll position.
- Desktop showpiece with unusable mobile behavior.
- Large video/WebGL running continuously off-screen.

## Handoffs
- Engineering implements the approved state/progress contract.
- Performance/accessibility QA can block release independently of creative approval.
- Asset Registry tracks the media and fallback versions used by the page.
