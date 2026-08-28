# Creative Transfer Candidate Egress V1

## Purpose

Creative Transfer Hypothesis contains both candidate-facing reasoning and audit metadata. A maker-side review found that an exact source surface signature could be placed inside freeform audit fields such as an adaptation-rule action or copy-risk mitigation without entering the original hypothesis copy corpus.

V1 therefore adds a fail-closed downstream egress boundary rather than allowing Synthesis or specialist systems to consume the raw hypothesis artifact directly.

## Canonical downstream path

```text
Creative Transfer Hypothesis
        ↓ fresh independent provenance
Transfer Candidate Egress
        ↓ all-freeform literal copy scan
safe candidate projection OR null
        ↓
Creative Synthesis / later specialist reasoning
```

Raw Transfer Hypothesis is an inspectable reasoning/audit artifact. It is **not** the downstream creative payload.

## All-freeform scan

The egress gate checks every freeform field that may be carried into downstream reasoning:

- transfer claim;
- causal bridge;
- target consequence;
- adaptation actions;
- adaptation-rule action text;
- copy-risk mitigation text;
- uncertainty;
- falsifier.

The probe set is derived only from the selected primary source evidence:

```text
surfaceSignature + mustStrip
```

Comparison uses Unicode NFKC normalization, case normalization, punctuation/whitespace normalization and literal phrase matching.

## Fail-closed behavior

If source provenance is invalid or any selected-source surface signature is reproduced in downstream freeform text:

```text
candidate = null
reviewReady = false
status = blocked
```

The blocked candidate artifact does not echo the offending source phrase. Diagnostics expose only a hit count.

This matters because the firewall should not become another surface-copy channel.

## Provenance boundary

Candidate emission independently re-verifies:

```text
Hypothesis
→ Transfer Brief
→ Retrieval
→ Creative Knowledge Graph
→ Creative Intelligence Foundation
```

A stale or forged cached provenance claim cannot authorize candidate emission.

## Truth boundary

Candidate egress proves only structural/provenance discipline and the literal all-freeform copy check.

It explicitly does not prove:

```text
semantic originality
causal correctness
creative quality
creative selection
production approval
```

The safe candidate remains advisory evidence for later Synthesis / specialist reasoning.

## Consumption rule

Downstream Creative Synthesis and specialist systems should consume the **Transfer Candidate Egress** artifact, not raw `creative-transfer-hypothesis@1` freeform fields.

This keeps audit metadata inspectable while preventing it from becoming an unreviewed creative-content bypass.
