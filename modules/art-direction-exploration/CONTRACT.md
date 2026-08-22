# Art Direction Exploration v1

## Purpose

Take one explicitly selected experience thesis and create 3–5 materially different visual/interaction interpretations **without changing the selected experience behavior**.

This stage exists because selecting a Creative World does not approve its current art direction.

## Input contract

Required:

- one `ai-studio-os/experience-thesis-lock@1` with `humanExperienceThesisSelectionConfirmed: true`;
- the selected Creative World referenced by the lock;
- 3–5 authored art-direction candidates.

## Locked vs free

The lock owns the governing experience sequence and principles.

The art director is free to reinterpret:

- composition;
- typography behavior;
- color;
- shapes;
- imagery;
- materials;
- spatial metaphor;
- motion expression;
- interaction expression;
- sound policy.

No candidate may silently rewrite the locked experience sequence.

## Candidate contract

Each candidate must provide:

- `id`, `label`, `premise`;
- `spatialModel`;
- `compositionModel`;
- `typographicBehavior`;
- `colorBehavior`;
- `imageRole`;
- `materialModel`;
- `motionMetaphor`;
- `interactionExpression`;
- `responsiveExpression`;
- at least two `antiPatterns`.

## Divergence gate

Candidates must differ across at least five of these dimensions:

1. spatial model;
2. composition;
3. typography behavior;
4. color behavior;
5. image role;
6. material model;
7. motion metaphor;
8. interaction expression;
9. responsive expression.

Different colors on the same layout do not count.

## Truth boundary

This stage may produce visual proof but may not claim:

- selected art direction;
- human visual approval;
- approved typography;
- approved production technology;
- production readiness.

The selected experience thesis is locked. The art direction is not.
