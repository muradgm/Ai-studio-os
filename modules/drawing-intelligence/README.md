# Drawing Intelligence V1

## Purpose

Drawing Intelligence is the reasoning layer above deterministic Vector Geometry.

It owns **what should be drawn and why**. Vector Geometry continues to own **how approved intent becomes exact SVG/vector construction**.

The governing sequence is:

`SEMANTIC INTENT → DRAWING INTELLIGENCE → GEOMETRY INTENT → VECTOR GEOMETRY → RENDER → INDEPENDENT REVIEW → HUMAN AUTHORITY`

Drawing Intelligence must never become a freeform SVG generator or a self-approving visual model.

## Brain / hand split

### Drawing Intelligence — brain

Owns:

- semantic decomposition;
- familiarity vs originality decision;
- learned visual-vocabulary collision checks;
- design-memory checks against previously rejected metaphors;
- metaphor hypotheses;
- semantic primitive planning;
- size-specific information budgets;
- rendered visual-critique contract;
- geometry handoff intent.

### Vector Geometry — hand

Owns:

- exact coordinates;
- curves and control points;
- stroke/fill construction;
- intersections and layers;
- optical correction;
- target-size vector variants;
- normalized SVG;
- geometry validation and artifact integrity.

Drawing Intelligence output must not contain raw SVG path data. Its geometry handoff is a semantic primitive plan that a vector specialist converts into a canonical geometry spec.

## V1 schemas

- `ai-studio-os/drawing-intelligence@1` — semantic brief, metaphor candidates and structured primitive plans.
- `ai-studio-os/drawing-memory@1` — validated rejected/accepted metaphor memory with evidence.
- `ai-studio-os/drawing-geometry-intent@1` — size-specific handoff into Vector Geometry.
- `ai-studio-os/drawing-review@1` — rendered visual observations without human/final approval authority.

## Familiarity rule

Every drawing decision declares one of:

- `convention-first` — preserve a strongly learned metaphor; brand character comes from optical/family behavior.
- `brand-original-required` — no sufficiently useful learned metaphor exists; original semantic invention is justified.
- `hybrid-restrained` — start from a familiar metaphor and add only the minimum product-specific semantic modification.

A familiar control must not become less recognizable merely to advertise brand DNA.

## Learned visual vocabulary

V1 ships a small explicit collision vocabulary for common learned meanings:

- Git branch / merge / graph topology;
- crop / scan / focus frames;
- split-pane / alignment / docking / resize;
- security / authentication / access;
- retry / refresh;
- settings / properties;
- success / completion;
- generic navigation / action.

This is collision evidence, not a universal ontology and not automatic semantic proof. It should expand only from validated production failures or repeated user-review evidence.

## Drawing memory

Drawing memory exists to stop the system from rediscovering rejected metaphors.

A memory record needs:

- concept;
- rejected/accepted status;
- explicit visual cues;
- reason;
- evidence references when available.

Project memory can be stricter than generic vocabulary. For example, AI Council may reject branch/merge topology for Council and Decision because the target audience already reads it as Git.

## Size-specific information budget

Drawing Intelligence decides what semantic information deserves to survive by size.

Typical icon guidance:

- 24px: primary metaphor plus limited supporting structure;
- 16px: primary metaphor plus at most one meaningful distinction;
- 14px: silhouette and one essential semantic distinction; no decorative family devices.

The exact budget is authored per drawing brief and enforced before Vector Geometry receives the handoff.

## Visual critique boundary

Drawing Intelligence can define what rendered evidence must be inspected, but it cannot approve its own drawing.

A rendered review must record:

- label-blind resemblance;
- target-size observations;
- text-pair fit;
- actual UI-context fit;
- family/squint fit.

Independent design review chooses what should advance. Human approval remains downstream.

## AI Council benchmark

The first benchmark is the `Authority` icon because it exposed the recurring gap this subsystem is meant to solve.

Authority means:

> human permission boundary between advice and consequential action.

Known rejected semantic neighborhoods include:

- crosshair / alignment;
- split pane / docking;
- lock / shield / key security metaphors;
- continuous route/arrow crossing.

Drawing Intelligence should reject or flag those before the Vector Geometry engine spends time polishing them.
