# Benchmark 011 — Creative / Motion Capability Dogfood V1

This is a **capability experiment**, not a fixture benchmark and not a CI quality claim.

Its purpose is to test whether the merged AI Studio OS creative reasoning stack materially improves Motion output under controlled conditions.

## Phase 0 — freeze the upstream creative context

Start from `brief-source.json`.

Run the normal canonical upstream path once:

```text
Project Truth
→ Creative Thesis deliberation
→ human Thesis approval
→ Creative World exploration
→ human World selection
→ canonical Creative World
```

Then freeze the selected Creative World reference and exact fingerprint into the dogfood experiment brief.

The same canonical World must be used by every trial. Dogfood is not allowed to give later conditions a stronger upstream art direction.

## Conditions

```text
A — Motion V1 baseline
B — Motion V2 + qualified core Motion knowledge
C — Motion V2 + full qualified Motion knowledge corpus
D — Motion V2 + full qualified Motion knowledge + verified Transfer→Synthesis egress
E — direct-model creative control
```

Each condition runs three times.

The direct-model control receives the same project/World context and comparable generation/time/token/model policy budget, but does not receive the AI Studio OS Motion reasoning architecture.

## Why Transfer is not isolated as a separate Motion condition

The merged Motion V2 boundary consumes qualified Knowledge and optional verified Synthesis. It does not directly consume a raw Transfer candidate. Synthesis itself requires verified Transfer Candidate Egress.

This benchmark tests the actual merged architecture instead of inventing a new Transfer→Motion production path for the experiment.

## Evidence

Every trial must provide real evidence for:

- 3+ Motion hypotheses;
- 15+ temporal studies;
- browser execution;
- mobile reinterpretation;
- reduced-motion reinterpretation;
- source/reasoning snapshot;
- runtime trace.

No fixture reference may be presented as real capability evidence.

## Review

Reviewers receive only a blinded packet. They do not see condition IDs, layer names, runtime traces or original artifact names before submitting their review.

Every candidate is judged independently across the canonical qualitative dimensions defined by `modules/creative-motion-capability-dogfood`.

There is deliberately no single overall creative score and no automatic winner.

## Decision gate

After unblinding, the evidence must support an explicit human roadmap decision:

```text
productize-next

or

targeted-capability-pass

or

architecture-leverage-not-proven

or

inconclusive
```

That decision determines whether the next major slice is productization (Artifact Library / Interactive Editing) or a targeted intelligence improvement.

## Not part of this benchmark

- Spatial Intelligence
- Artifact Library implementation
- Interactive Editing implementation
- embeddings / semantic retrieval
- Delivery Gateway
- automatic creative approval
- automatic code patching during the experiment

Do not change the tested intelligence while collecting the A/B/C/D/E evidence. Run first, diagnose second, improve third.
