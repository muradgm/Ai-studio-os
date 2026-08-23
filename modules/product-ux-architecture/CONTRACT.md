# Product UX Architecture V1 Contract

## Purpose

Product UX Architecture freezes the **user-facing product skeleton before visual direction** for interface-centric work.

It exists because internal runtime architecture must not automatically become application navigation or visual hierarchy. A sophisticated system can still require a simple user surface.

## Position in the pipeline

```text
Product / repository truth
→ Product Understanding
→ Product UX Architecture
→ Information Architecture approved
→ Research / Creative Thesis
→ Creative Worlds
→ Style Frame Proof
→ Human selection
→ High-fidelity UI
```

For non-interface creative work, this stage may be omitted. For an interface project that explicitly requires it, downstream creative work must fail closed until this artifact is review-ready.

## Required decisions

A review-ready artifact defines:

- governing experience principle;
- primary interaction model;
- major application-shell regions and dominance;
- global and project navigation;
- canonical screens and their purposes;
- primary vs secondary information per screen;
- primary actions and movement between screens;
- response / content anatomy where relevant;
- contextual panel behavior;
- progressive-disclosure hierarchy;
- context vs persistent-memory semantics;
- human authority over editable memory;
- reasoning-exposure policy;
- action / approval boundaries;
- primary journeys;
- non-negotiables and anti-patterns;
- evidence and authored provenance.

## Truth boundary

A Product UX Architecture pass means:

- information architecture may be frozen for comparative creative work;
- visual design is **not** approved;
- typography is **not** approved;
- no Creative World is selected;
- no hidden chain-of-thought becomes user-facing content;
- runtime/provider/tool topology is not automatically primary navigation.

## Progressive disclosure rule

For every internal capability ask:

1. Does the user need this to complete the current task? → show it.
2. Does it mainly build trust or explain a decision? → make it inspectable.
3. Is it primarily operational/debug telemetry? → keep it in developer inspection.

The contract should prevent an advanced AI product from becoming an infrastructure control panel by default.

## Interface proof requirement

Before creative worlds can meaningfully compete, they should be forced to express the **same canonical screens and flows**. A Creative World may change visual language, material, motion, and interaction character, but it may not silently replace the approved product skeleton.
