# Creative / Motion Capability Dogfood V1

## Purpose

This module tests whether the creative reasoning layers already built in AI Studio OS materially improve creative Motion output.

It is deliberately **not** another creative-authority layer and deliberately **not** a benchmark that passes because required fields exist.

The experiment asks a narrower question:

> Does the current reasoning architecture produce better motion work under the same project, brief, model policy and generation budget?

## Constitutional boundary

```text
STRUCTURAL PASS != CREATIVE QUALITY
RATING != AUTHORITY
DIAGNOSTIC DELTA != WINNER
DOGFOOD RESULT != CREATIVE DIRECTION
DOGFOOD RESULT != PRODUCTION APPROVAL
```

The module may bind an experiment, blind candidate identities, collect independent qualitative review and expose diagnostic differences between conditions.

It cannot:

- select a Motion Direction;
- approve a Creative World;
- manufacture human creative approval;
- authorize technical planning;
- authorize production;
- convert a numeric or ordinal diagnostic into creative authority.

## Fixed V1 conditions

Dogfood V1 uses five locked conditions with three trials each:

```text
A — Motion V1 baseline
B — Motion V2 + qualified core Motion knowledge
C — Motion V2 + full qualified Motion knowledge corpus
D — Motion V2 + full qualified Motion knowledge + verified Synthesis
E — direct-model creative control
```

Why V1 does **not** use a separate `V2 + Transfer only` condition:

The current merged Motion Intelligence V2 runtime accepts qualified Graph/Foundation knowledge plus optional verified Synthesis evidence. It does not expose a direct Transfer-input boundary. Creative Synthesis itself is built from verified Transfer Candidate Egress.

Dogfood must test the actual merged architecture rather than invent an experimental production path merely to preserve a hypothetical ablation table.

Therefore V1 measures:

- `A → B`: value of the V2 reasoning substrate;
- `B → C`: value of broader qualified Motion knowledge;
- `C → D`: value of the current Transfer→Synthesis egress as consumed by Motion V2;
- `E ↔ D`: architecture leverage versus a strong direct-model control.

If D materially differs from C, a later Transfer/Synthesis-specific experiment may isolate those upstream layers at their own boundary.

## Experimental controls

All 15 trials must bind the same:

- project ID;
- normalized brief snapshot;
- canonical Creative World reference and exact fingerprint;
- maximum generation attempts;
- token budget;
- wall-clock budget;
- model policy;
- temperature/sampling policy.

Each condition requires replicates `1`, `2`, and `3` exactly once.

The harness rejects budget drift, brief drift, project drift, duplicate trial IDs and missing evidence.

## Required evidence per trial

Every trial must expose:

- at least three serious Motion hypotheses;
- at least fifteen temporal studies;
- real browser evidence;
- mobile evidence;
- reduced-motion evidence;
- a unique evidence-bundle reference;
- a unique runtime-trace reference;
- an exact source/reasoning snapshot fingerprint.

The harness does not create or fake these artifacts. Missing real evidence blocks the experiment.

## Blind review

A review-ready experiment can produce a deterministic blind packet.

The public reviewer packet exposes opaque candidate IDs and neutral evidence aliases only. Condition identity, trial ID, runtime trace, source fingerprint and original evidence reference stay in a separate unblinding map.

Review order is deterministic from the bound blind seed so it can be reproduced without presenting A/B/C/D/E ordering to reviewers.

## Qualitative dimensions

Every candidate is reviewed independently on:

```text
concept-fidelity
originality
conceptual-divergence
temporal-hierarchy
rhythm
motion-necessity
stillness
physical-character
choreography
typography-motion
spatial-continuity
interaction-quality
mobile-reinterpretation
reduced-motion-equivalence
genericity-resistance
restraint-taste
production-plausibility
```

V1 uses the ordinal labels:

```text
weak
mixed
strong
exceptional
```

Every rating requires written rationale.

The runtime may translate those labels into diagnostic means solely to compare dimensions across conditions. It never computes one overall creative score.

## Human interpretation

The harness exposes dimension-by-dimension deltas and blinded top-choice counts.

It does **not** automatically declare a winner.

A roadmap decision remains explicit human interpretation with one of:

```text
productize-next
targeted-capability-pass
architecture-leverage-not-proven
inconclusive
```

That decision is roadmap evidence only. It does not become Creative Direction or production authority.

## Scope exclusions

Dogfood V1 does not add:

- Spatial Intelligence;
- Artifact Library;
- Interactive Artifact Editing;
- semantic/vector retrieval;
- a new provider layer;
- a new Motion authority path;
- automatic creative winner selection;
- automatic patching of weak intelligence during the experiment.

The experiment should run first. Capability changes should follow the evidence rather than contaminate the test while it is running.
