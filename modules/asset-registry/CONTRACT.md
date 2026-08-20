# Asset Registry & Patch Contract

**Input:** asset specs, tool assignments, production mode, existing asset history, and validated asset findings.

**Output:** stable versioned records with review state, output evidence/hash, cost fields, provenance, rights, direction, continuity, and dependencies, plus bounded targeted patch requests.

**Block:** malformed or duplicate versions (including existing history), unresolved production rights, missing real-source evidence, missing direction/continuity anchors, invalid review/patch metadata, approved output without evidence, invalid patch target, capture-required or blocked asset treated as regenerable, or patch-attempt limit.

## Migration boundary

This v1.1 registry remains the creative-production compatibility layer. New cross-runtime production state should use the universal Artifact + Artifact Graph contract under `modules/artifact-graph/`. Existing registry entries can be converted through `artifactFromAssetRegistryEntry()`; do not duplicate or silently rewrite historical registry versions during migration.
