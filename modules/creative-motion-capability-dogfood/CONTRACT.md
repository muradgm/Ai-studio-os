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

The module may bind an experiment, verify condition execution, blind candidate identities, collect independent qualitative review and expose diagnostic differences between conditions.

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

It reports two different facts and never upgrades one into the other:

- `declaredControlParity`: every trial declares the same model, sampling, attempts, token and time policy;
- `verifiedRuntimeControlParity`: every trial supplies trace-bound runtime-control evidence matching those declared values.

Capability interpretation requires both. Runtime-control evidence contains the trace reference and fingerprint, an evidence reference, and the observed policy values. This verifies the supplied runtime evidence binding; it does not claim cryptographic proof of the external runtime.

Independent replicates are allowed to converge on identical output. Replication tests execution variability; it must not force artificial output diversity.

## Condition execution authority

A condition label is not evidence that the named architecture actually ran.

Before capability interpretation, Dogfood V1 freshly verifies condition-specific source artifacts:

```text
A
Motion V1 exploration
→ fresh Motion V1 review
→ exact real temporal proof

B / C / D
Motion V2 reasoning set
→ fresh V2 review with original authority inputs
→ exact V2→V1 exploration handoff review
→ exact real temporal proof

E
isolated direct-model hypothesis generation
→ V1-shaped exploration contract validation only
→ exact same real temporal proof harness
```

Condition A additionally requires a V1-only isolation record bound to the exact exploration. It records whether Knowledge, Transfer, Synthesis, or Motion V2 participated. Until V1 generation has a first-class isolated runtime boundary, this is explicit operator-attested evidence rather than cryptographic proof. A V1-shaped exploration by itself is not sufficient.

For B/C/D the knowledge profile is locked:

- B uses the declared eight-principle core profile;
- C uses the complete qualified Motion V2 corpus;
- D uses the same complete corpus plus non-empty verified Synthesis evidence.

B and C fail if Synthesis evidence leaks into the condition.

D fails if the existing V2 provenance chain cannot freshly reverify the supplied Synthesis evidence.

## Direct-model control boundary

Condition E is a creative-generation control, not an escape from evidence requirements.

The model receives the same frozen brief and Creative World and authors hypotheses directly without Creative Knowledge, Transfer, Synthesis or Motion V2 reasoning.

After generation, those hypotheses may use only the common V1 contract-validation and temporal-proof machinery so the rendered comparison receives the same browser/media authority as the Studio conditions.

Until AI Studio OS has a first-class isolated direct-model runner, the fact that upstream Studio reasoning was bypassed remains explicitly operator-attested rather than cryptographically proven.

That limitation stays visible in the execution receipt.

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

For A/B/C/D, the existing Motion proof verifier must freshly confirm exact browser-temporal evidence and bind it to the exact exploration being tested.

For E, the same V1 temporal proof verifier is used after direct-model hypothesis generation.

Fixture-only Motion proof cannot qualify as dogfood capability evidence.

The harness does not create or fake these artifacts. Missing real evidence blocks capability interpretation.

## Gemini prototype transport

`gemini-runner.mjs` is a deliberately narrow, developer-only transport for one
bounded Gemini request. It exists to establish traceable execution before the
formal 15-trial experiment; it is not a Tool Gateway expansion or a new Motion
authority path.

The runner:

- reads `GEMINI_API_KEY` and `GEMINI_FREE_MODEL` only from its execution
  environment;
- sends the key only as an `x-goog-api-key` request header and excludes it from
  result records;
- accepts one request per invocation, with a fixed temperature policy and an
  explicit token/time budget;
- requires an upstream condition-specific instruction and an operator-supplied
  architecture declaration rather than inferring reasoning-layer participation;
- emits request/response fingerprints, model, usage metadata and the canonical
  runtime-control record; and
- returns `prototypeOnly: true`, `reviewReady: false`, and
  `capabilityEvidenceReady: false` on every result.

`npm run preflight:after-matter-gemini` makes one unscored direct-model
Condition E transport request and writes its local record below `artifacts/`.
That record is intentionally ignored by Git. It is neither a formal Condition E
trial nor a substitute for V1-shaped exploration validation, browser-temporal
proof, mobile/reduced-motion evidence, blind review, or capability
interpretation.

## Formal execution runner

The formal 15-trial executor is a separate pre-proof layer. It first enrolls a
Gemini model by snapshotting the provider Model resource, including the
requested model, provider resource name/version, advertised generation methods,
token limits and metadata fingerprint. Mutable `*-latest` aliases are rejected
for formal execution.

The execution plan binds exactly A1–E3, one explicit source-material bundle per
condition, a fixed one-request model/temperature/token/time policy, and unique
runtime trace/evidence references. It runs trials serially with no automatic
retry, fallback model or manual result substitution. A produced run remains
pre-proof evidence only: condition-specific source validation, rendered temporal
proof, blind packet construction and human review still occur afterwards.

## Protocol review versus capability review

Dogfood V1 deliberately separates two things:

### Protocol review

Proves that:

- the experiment shape is fixed;
- candidates are blinded;
- condition mapping is not exposed to reviewers;
- every qualitative dimension is reviewed;
- packet/mapping drift is rejected.

A protocol review alone is **not capability evidence**.

### Capability review

Requires protocol review **plus** a freshly recomputed execution receipt proving that each A/B/C/D/E trial is bound to the correct source architecture and rendered evidence.

Only capability review may support the later human roadmap decision.

## Blind review

A structurally review-ready experiment can produce a deterministic blind packet.

The public reviewer packet exposes only opaque candidate IDs and neutral evidence aliases per candidate. Condition identity, trial ID, runtime trace, source fingerprint, original evidence reference, hypothesis count, temporal-study count, and proof/runtime metadata stay out of the packet and in the separate unblinding map or source evidence.

Review order is deterministic from the bound blind seed so it can be reproduced without presenting A/B/C/D/E ordering to reviewers.

The final capability interpretation freshly rebuilds the private mapping from the original experiment and blind seed. A caller-supplied relabelled mapping is not trusted.

The protocol truth is explicit:

```text
blindReviewProtocolEnforced = true
reviewerConditionIdentityHidden = true
unblindingMappingSeparated = true
blindSubmissionPrecedesUnblindingAttested = true
blindSequenceCryptographicallyProven = false
```

The first three are enforced by packet construction and mapping separation. Submission order remains a required reviewer attestation in V1, not a cryptographically proven event sequence.

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
