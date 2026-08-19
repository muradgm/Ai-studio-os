---
name: motion-choreography
description: Convert approved motion principles into timed key states, transitions, camera behavior, hierarchy, pacing, and reduced-motion equivalents.
category: task
version: 1.0
---

# motion-choreography

## Purpose
Turn motion direction into a buildable sequence. Define what changes, in what order, for how long, and why, before implementation or media generation begins.

## When to use
- Hero sequences, scroll narratives, logo motion, interface transitions, product demos, brand-film sections.
- When animation ideas exist but timing, state order, hierarchy, or handoffs are vague.

## Inputs required
- Motion principles and creative direction.
- Start/end states and narrative or interaction goal.
- Asset/state dependencies.
- Target duration, viewport/device constraints, performance budget.
- Reduced-motion requirement.

## Operating principles
- Key states first; interpolation second.
- One dominant movement at a time unless simultaneous motion communicates a real relationship.
- Choreography should reveal hierarchy and causality.
- Duration follows comprehension and physical character, not a universal easing preset.
- Scroll-linked motion must remain understandable at different scroll velocities.
- Never require motion to access essential information.

## Workflow
1. Define state 0 and the final meaningful state.
2. Break the sequence into semantic beats.
3. Assign one dominant action and supporting actions to each beat.
4. Specify timing ranges, easing character, spatial origin, and overlap.
5. Add camera movement only when it improves spatial understanding or narrative emphasis.
6. Define interruption, resize, replay/idle, and reduced-motion behavior.
7. Check total duration and pacing against the user's ability to read/react.
8. Produce implementation-ready state/timing notes.

## Deliverables
- Beat/state table.
- Timecodes or normalized progress ranges.
- Element hierarchy per beat.
- Easing/spatial notes.
- Camera behavior where relevant.
- Interaction and interruption rules.
- Reduced-motion sequence.

## Review criteria
- Every movement has a named purpose.
- The eye knows where to look.
- Sequence works without excessive waiting.
- State changes can be implemented deterministically.
- Reduced-motion retains meaning.

## Failure modes
- “Animate smoothly” with no states.
- Everything starts at once.
- Long cinematic intro before the user can act.
- Camera movement disconnected from content.
- Scroll animation that breaks when users scroll quickly.
- No definition for returning to idle or revisiting the section.

## Handoffs
- `motion-designer` owns the motion language.
- `motion-review` judges the timed result independently.
- Engineering receives the state machine, durations, easing intent, and fallback rules.
