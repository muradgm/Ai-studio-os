# Style Frame Proof Contract v2

## Purpose

Style Frame Proof turns a structurally review-ready Creative World set into **comparable visual evidence before human selection**.

It exists to prevent persuasive prose from becoming art-direction authority.

## Canonical flow

```text
PRODUCT UNDERSTANDING
→ CREATIVE THESIS
→ 3–5 CREATIVE WORLDS
→ STRUCTURAL REVIEW
→ STYLE FRAME PROOF PLAN
→ EXACT BROWSER RENDERS
→ SAME-MOMENT COMPARISON
→ HUMAN VISUAL REVIEW
→ WORLD SELECTION
```

## Inputs

- `ai-studio-os/creative-world-exploration@1`
- exploration `reviewReady === true`
- 3–5 candidate worlds
- 4–7 project-specific proof moments
- at least one mobile proof moment

Each proof moment requires:

- `id`
- `label`
- `viewport`
- `width`
- `height`
- `purpose`
- a concrete `productState` for project-specific runs

## What a proof frame carries

Every frame remains bound to:

- Creative Thesis reference
- Creative World idea
- signature behavior
- composition model
- typography intent
- image language
- material language
- motion language
- interaction model
- responsive strategy
- the exact product moment being tested

## Typography boundary

Pre-selection frames use proxy/system typography only.

```text
typographyApproved: false
```

Final family selection remains downstream of world selection and Typography Intelligence.

## Image truth boundary

Documentary imagery must be:

```text
real-source
OR
explicit-placeholder
```

A style frame may use abstract or non-documentary material studies, but it may not fabricate a real product/person/place as evidence.

## Exact-render requirement

Visual proof must preserve the actual authored composition.

Required evidence:

- exact browser raster for every frame
- matching HTML source for every frame
- same-moment comparison outputs
- proof manifest
- both desktop and mobile coverage

Image-model redraws are not equivalent to browser proof because they can reinterpret layout, typography, geometry, or copy.

## Selection boundary

Style Frame Proof may expose weak worlds, but it may not choose a winner.

It may not claim:

```text
humanVisualApproval: true
humanWorldSelectionConfirmed: true
selectedWorldId: <anything>
typographyApproved: true
productionTechnologyApproved: true
productionReady: true
```

A later human action selects, rejects, or requests revision after seeing the proof.

## Evidence output

`buildVisualProofEvidence()` turns completed browser renders into:

```text
ai-studio-os/style-frame-proof-evidence@2
```

The evidence can become the `visualProof` source consumed by the Creative World catalog only after every required frame has exact image/source evidence.

`reviewReady` means the evidence set is complete enough for human visual review. It does **not** mean a human approved the visuals.

## Failure modes

Block or hold when:

- Creative World exploration is missing or not review-ready;
- fewer than 3 or more than 5 worlds are supplied;
- project proof moments are incomplete;
- mobile proof is absent;
- world/moment coverage is incomplete;
- typography is prematurely frozen;
- documentary truth policy is weakened;
- a frame fabricates human approval;
- a world is selected automatically or before proof;
- generated evidence lacks exact browser image/source references.

## Core truth rule

**Structural readiness ≠ visual quality. Browser proof readiness ≠ human approval. Human selection ≠ production readiness.**
