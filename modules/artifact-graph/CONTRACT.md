# Universal Artifact + Artifact Graph Contract

The Artifact layer is the shared production record for AI Studio OS. It exists above provider-specific outputs and below product surfaces such as the Command Center, Brand Kit, delivery packaging, review, memory and future production adapters.

## Core rule

An artifact is not a card in the UI and it is not a promise that a file will exist later. It is a versioned production record that points to what was actually made, how it was made, what it depends on, what evidence exists, and whether downstream work can still trust it.

## Universal Artifact

Every artifact uses `ai-studio-os/artifact@1` and carries, where applicable:

- stable `id` and immutable `version`
- `kind` and optional `format`
- project and Brand DNA binding
- production, review and release state
- source / creator / recipe information
- dependency declarations
- provenance and rights
- real file references and previews
- measurements, reviews and findings
- cost and timestamps
- arbitrary typed metadata

Approved/frozen artifacts require a produced file reference. A release state cannot be used to invent production evidence.

## Dependencies

Dependencies are explicit edges rather than hidden prose. Each dependency may declare:

- exact `artifactRef` (`id@version`) or an artifact id that resolves to the latest available version
- semantic `relation` such as `derived-from`, `uses`, `renders`, `documents`, `calibrates`, or `implements`
- whether it is required
- downstream impact if the dependency changes: `stale`, `review`, or `none`

Required missing dependencies block the graph. Optional missing dependencies remain visible risk. Cycles block the graph.

## Change propagation

Changing a dependency never silently mutates descendants. The graph emits a deterministic change plan:

- `stale` means the dependent artifact must be regenerated or explicitly rebound
- `review` means the dependent artifact remains present but must be re-reviewed
- `none` means the edge is informational and does not invalidate the dependent

A change plan is evidence for the production queue; it is not itself a patch.

## Compatibility

The v1.1 Asset Registry remains valid during migration. `artifactFromAssetRegistryEntry()` converts existing registry entries into the universal Artifact shape so current creative-production flows do not need a flag-day rewrite.

## Non-negotiable invariants

- Never fabricate files, rights, provenance, measurements or reviews.
- Never silently retarget an exact version dependency.
- Never let an approved/frozen artifact point to no produced file.
- Never hide missing required dependencies.
- Never allow dependency cycles to pass.
- Never mutate downstream artifacts merely because an upstream artifact changed; emit an impact plan first.
