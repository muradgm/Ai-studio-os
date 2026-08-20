# Command Center Artifact State Contract

The Command Center is a projection of production truth. It must not invent progress, readiness, evidence, or artifact state that is absent from the Artifact Graph.

## Input

- one valid `ai-studio-os/artifact-graph@1`
- optional `changedRefs` used to preview deterministic downstream impact
- optional project/kind filters and queue limit

## Output

`ai-studio-os/command-center-state@1` containing:

- latest artifact records only (one current version per artifact id)
- a deterministic production queue ordered by consequence, not cosmetic importance
- explicit states: `blocked`, `stale`, `review`, `queued`, `produced`, `approved`, `released`
- actual file, preview, review, measurement and finding counts
- dependency/impact reasons when a change plan is supplied
- release summary using categorical truth (`blocked`, `review`, `unmeasured`, `ready`) rather than a synthetic percentage

## Rules

- A blocked Artifact Graph blocks Command Center state.
- `approved` is not equivalent to `released`.
- An approved/frozen artifact with unmeasured release state remains `approved`, not `ready` or `released`.
- Stale/review impact from the Artifact Graph must override a visually optimistic source status.
- Missing evidence is represented as missing/unmeasured; it is never inferred.
- Queue ordering is deterministic and prioritizes blockers, stale work and review work before queued/produced/approved artifacts.
- The projection never mutates the Artifact Graph.
