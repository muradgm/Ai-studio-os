# Motion Intelligence V2 exact Creative World binding

The public Motion Intelligence V2 runtime wraps the reasoning core with a persisted exact-content boundary for the selected Creative World.

The boundary stores only an opaque fingerprint plus project/world identity. It does **not** serialize the selected Creative World or any full canonical-authority payload into the project artifact.

The public snapshot chain is:

```text
selected Creative World content fingerprint
+ core Motion V2 Brief snapshot
        ↓
public Motion V2 Brief snapshot
        ↓
core reasoning-set snapshot
        ↓
public reasoning-set snapshot
        ↓
core V2→V1 handoff snapshot
        ↓
public handoff snapshot
```

Fresh review recomputes canonical Creative World authority and the exact selected-world fingerprint. A world that changes semantically while retaining the same stable world ID therefore invalidates older Motion V2 Briefs, reasoning sets, and handoffs.

The original Motion V2 reasoning implementation is retained byte-for-byte in `runtime-core.mjs`; `runtime.mjs` is the public provenance/binding boundary. Fingerprints remain deterministic drift evidence only. They are not signatures, creative approval, human selection, or production authority.
