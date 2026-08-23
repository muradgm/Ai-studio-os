# Motion System contract

Motion is a product-state system, not decorative polish.

Core principle:

> Motion explains observable system state. It must never invent work, progress, reasoning, specialist activity, authority, or completion that the runtime cannot prove.

The approved AI Council constitution sharpens this further:

> Observable state becomes useful structure. Temporary activity should disappear when work resolves; evidence, decisions, authority, outcomes, and memory should remain as durable product state.

## Hybrid inheritance

- **Counterpoint** owns reading, conversation, and calm content transitions.
- **Decision Spine** owns provenance, progression, relationships, decision history, and memory history.
- **Threshold** owns authority changes, approval, risk, blocked/destructive operations, external mutation, and consequential failure.

No independent fourth motion art direction is allowed.

## Operational state and motion role are orthogonal

The production model must never force every transition into a work-state bucket.

### Operational state

Operational state answers: **what is the system actually doing right now?**

Allowed values:

- `none` — no technical/semantic operation should be claimed;
- `loading` — a technical resource or view is not ready;
- `working` — Council is performing a known runtime operation;
- `reasoning-status` — an inspectable high-level reasoning lifecycle stage is active;
- `execution-progress` — Council is modifying or validating real state after authority was granted.

The four non-`none` operational states remain distinct and useful. `none` prevents transition-only events from making false work claims.

### Motion role

Motion role answers: **what product transition may this event cause?**

Examples include:

- `content-transition`;
- `context-registration`;
- `evidence-registration`;
- `coordination-transition`;
- `comparison-transition`;
- `authority-transition`;
- `verification-transition`;
- `result-transition`;
- `failure-transition`;
- `lineage-transition`;
- `memory-transition`;
- `navigation-transition`;
- `none`.

These axes are independent.

Canonical examples:

```text
approval-required
operationalState: none
motionRole: authority-transition

ui-project-navigation-opened
operationalState: none
motionRole: navigation-transition

evidence-source-added
operationalState: working
motionRole: evidence-registration

validation-started
operationalState: execution-progress
motionRole: none

execution-completed
operationalState: none
motionRole: lineage-transition
```

`eventVocabulary[].class` is legacy V1 authoring data only. Canonical runtime output must remove it and resolve semantics through `motion-event-taxonomy-v1.json`.

## Runtime truth rules

- Named work stages require matching runtime events.
- Specialist names require actual participant events.
- Completed checkmarks require completed events.
- Future steps may be shown only when they come from a known plan.
- Unknown progress may not use percentage completion.
- Percentages are allowed only for deterministic totals supplied by the runtime.
- Raw chain-of-thought, simulated internal thoughts, and invented agent dialogue are forbidden.
- Proof fixtures must identify themselves as fixtures; proof animation must not be represented as production telemetry.
- `approval-required` may not claim execution is active.
- Navigation transitions may not claim loading unless an independent resource request is actually pending.
- Motion may be browser-proof-ready and human-approved before runtime adapters exist, but production readiness remains blocked until real event adapters are wired and interaction proof passes.

## Required primitives

The system must define and prove:

- message submission;
- task understanding;
- project-context loading;
- evidence acquisition;
- Council review;
- strategy comparison;
- long-running work;
- structured-answer reveal;
- verification;
- critic interruption;
- approval boundary;
- execution;
- validation;
- success;
- failure;
- decision lineage;
- memory update;
- panel transition;
- mobile navigation;
- reduced-motion behavior.

## Timing hierarchy

- micro interactions: 100–180ms;
- content transitions: 180–320ms;
- context/lineage: 300–500ms;
- authority transitions: 400–700ms.

These are behavioral ranges, not pixel-locked choreography. Information becoming available should feel responsive; consequence may be more deliberate because semantics changed. Working-status copy must not churn rapidly.

## Product-native review spine

The human-review proof should tell the product story through six primary moments:

1. request submission;
2. project context becoming stable;
3. evidence registering into provenance;
4. structured recommendation resolving;
5. advice crossing into approval authority;
6. approved execution validating and becoming history.

Mobile project/thread continuity is an auxiliary required proof.

## Reduced motion

Reduced motion is semantic equivalence, not a lesser experience.

Remove nonessential translation, drawing, looping movement, and staged delay while preserving:

- status wording;
- hierarchy;
- authority boundaries;
- progress truth;
- provenance and final relationships;
- focus and control availability;
- durable end state.

## Proof requirements

Motion System cannot become review-ready from prose alone. Exact Chromium proof must demonstrate:

- integration on the same eight frozen canonical AI Council screens;
- runtime-state fixture scenarios;
- event-evidence gating;
- the orthogonal event taxonomy;
- reduced-motion equivalence;
- authority transitions;
- execution success and failure;
- lineage and memory transitions;
- mobile simplification.

Browser proof proves choreography and state semantics, not production runtime integration. Production release still requires real runtime event adapters and real component interaction proof.

## Hard failures

Reject Motion System if it introduces any of the following:

- generic glowing AI orb as the work-state solution;
- fake neural/network particles;
- animated agent avatars or conversations that did not occur;
- generic typing dots for every state;
- fake percentage completion;
- invented internal thoughts;
- constant ambient motion;
- animated strategy scores while evaluation is active;
- consequence language leaking into normal navigation/conversation;
- celebratory execution/verification effects;
- mobile animation that restores desktop complexity;
- motion that implies completion before a completed runtime event exists;
- approval represented as execution progress before authorization;
- navigation represented as technical loading without a pending resource.

## Human approval versus production readiness

`humanMotionApproval = true` means:

> Yes. This is the Motion System language AI Council will develop.

It does **not** mean runtime or production interaction work is complete.

The following may be true together:

```text
humanMotionApproval = true
motionCreativeDirectionFrozen = true
motionRuntimeTaxonomyResolved = true
motionProductionReady = false
runtimeEventAdaptersImplemented = false
productionInteractionProofComplete = false
finalVisualSystemApproved = false
```

Human approval freezes the constitution, not exact easing curves, every duration, icon animation, latency/cancellation behavior, or final implementation technology.

## Truth boundary

Structural/browser proof alone does not set human approval.

A separate dated human approval artifact may set `humanMotionApproval = true` after the product-native proof has been inspected. That approval still must keep production readiness and final Visual System approval false until independently proven.
