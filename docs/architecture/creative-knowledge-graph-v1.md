# Creative Knowledge Representation / Graph V1

## Status

Implementation architecture for the deterministic Creative Knowledge representation and retrieval layer that follows Creative Intelligence Foundation V1.

This slice makes qualified creative knowledge persistable, related, freshness-aware, provenance-aware and safely retrievable without creating a new creative-authority path.

## Position in the roadmap

```text
Motion Creative Intelligence V1
→ Creative Intelligence Foundation V1
→ Creative Knowledge Representation / Graph V1
→ Creative Transfer Intelligence
→ Creative Synthesis Intelligence
→ Motion Intelligence V2
→ motion benchmarks / dogfood
→ Spatial Creative Intelligence V1
```

## Constitutional inheritance

Graph V1 inherits the Foundation constitution unchanged:

```text
KNOWLEDGE != AUTHORITY
REFERENCE != DIRECTION
PATTERN != SOLUTION
TREND != JUSTIFICATION
TECHNOLOGY != CONCEPT
CRITIC SCORE != SELECTION
```

Graph storage, graph relations, representation status, freshness, retrieval rank and provenance verification are evidence infrastructure only.

They cannot:

- select or approve a Creative Thesis;
- select a Creative World;
- declare Creative Direction canonical;
- manufacture human approval;
- authorize technical planning;
- authorize production.

## Core architecture

```text
reviewed Creative Intelligence Foundation
        ↓ exact source binding
Creative Knowledge Graph
        ↓ exact graph snapshot
representation state + evidence refs
        ↓
project + explicit asOf query
        ↓
scope / status / freshness / deterministic lexical filtering
        ↓
ranked primary evidence
        +
unranked visible conflict context
        ↓
project-safe evidence projection
        ↓
independent graph + Foundation provenance verification
        ↓
advisory evidence for later creative reasoning
```

## Why deterministic first

V1 intentionally does **not** begin with embeddings, vector databases or learned relevance scoring.

Before adding probabilistic retrieval, Studio needs deterministic answers to harder architectural questions:

- What is one unit of creative knowledge?
- Which relations are authored in the Foundation and which belong only to representation lineage?
- How is contradictory evidence preserved?
- Why was evidence disputed, deprecated or superseded?
- Why does a freshness boundary exist?
- When is evidence stale?
- How is project-scoped knowledge isolated?
- How is an exact project retrieval reconstructed from its source graph?
- What proves that a retrieved item came from the graph and Foundation claimed?

If those contracts are weak, smarter retrieval only makes weak provenance harder to inspect.

## Canonical graph artifact

```text
ai-studio-os/creative-knowledge-graph@1
```

The graph binds:

- exact Foundation snapshot fingerprint;
- exact Foundation knowledge-library fingerprint;
- one graph node for every review-ready Foundation knowledge entry;
- exact Foundation-authored relationships;
- narrowly scoped representation lineage;
- graph-level status and freshness annotations;
- representation evidence/policy references;
- deterministic graph snapshot fingerprint;
- explicit non-authority truth.

Graph V1 represents the exact review-ready Foundation knowledge ID set. It does not silently invent extra knowledge nodes or omit difficult evidence.

If the source Foundation is not review-ready, construction fails closed and emits no Foundation-derived graph nodes.

### Canonical graph envelope

The top-level graph shape is locked. Hidden caller fields are not permitted beside otherwise valid graph data.

The canonical artifact contains only the graph contract plus derived review fields:

```text
schema
stage
sourceBinding
nodes
edges
snapshotFingerprint
truth
findings
pass
reviewReady
status
```

Its truth contract is also fixed and explicitly states that representation provenance references are required and that neither graph structure nor retrieval rank grants creative authority.

## Nodes

Canonical node:

```text
ai-studio-os/creative-knowledge-graph-node@1
```

A node contains the exact normalized Foundation knowledge contract plus representation metadata.

Representation annotation fields are intentionally narrow:

```text
status
statusReason
freshUntil
supersededBy
representationNotes[]
evidenceRefs[]
```

Representation states:

```text
active
disputed
superseded
deprecated
```

### active

Usable evidence under its declared scope and freshness constraints.

### disputed

Still-visible evidence whose reliability, applicability or interpretation has a meaningful unresolved conflict.

Disputed evidence is not silently discarded merely because it complicates a clean answer.

A non-active status requires:

```text
statusReason
+
evidenceRefs[]
```

The graph therefore preserves not only *that* a representation changed, but at least one reference for *why* that state exists.

### superseded

Historical knowledge replaced by another node. It remains in the graph for lineage but is not emitted as current project evidence.

### deprecated

Knowledge intentionally retired from active use while retained for traceability.

## Relationships

Foundation-authored relation types remain:

```text
reinforces
conflicts-with
depends-on
qualifies
counterexample-to
derived-from
```

These edges are reconstructed exactly from the embedded Foundation knowledge contracts.

Graph storage may not add, omit or rewrite these relationships.

V1 adds only one representation-lineage edge:

```text
supersedes
```

A `supersedes` edge is not a new creative principle. It records representation lineage and must agree with node status in both directions:

```text
replacement --supersedes--> old
old.status = superseded
old.supersededBy = replacement
```

Supersession also requires evidence/provenance references.

## Representation-state provenance

Representation metadata can change what later reasoning sees, so representation changes cannot be provenance-free administrative flags.

Any non-active status must retain at least one evidence/provenance reference:

```text
status != active
→ evidenceRefs.length >= 1
```

Any explicit freshness boundary must also retain at least one evidence or policy reference:

```text
freshUntil != null
→ evidenceRefs.length >= 1
```

Examples of legitimate refs include review evidence, benchmark evidence, policy decisions, source-refresh records or other stable provenance references.

These refs are fingerprint-bound with the graph representation. They do **not** act as signatures and they do **not** grant authority.

Project retrieval intentionally omits representation provenance refs from its compact project-safe annotation projection; independent provenance is performed against the separately supplied graph.

## Freshness

Freshness belongs to the representation/query layer rather than mutating Foundation knowledge contracts.

For `current-trend` knowledge:

```text
Foundation provenance.capturedAt
+
Graph annotation.freshUntil
+
Graph annotation.evidenceRefs[]
+
Retrieval query.asOf
```

All timestamps must be timezone-qualified.

No ambient server clock participates in evidence validity.

A query can therefore be replayed later and produce the same freshness judgment for the same graph snapshot.

Trend status is still context, never creative justification.

## Deterministic retrieval

Canonical artifact:

```text
ai-studio-os/creative-knowledge-retrieval@1
```

V1 retrieval uses deterministic filtering and stable ordering.

Inputs include:

```text
projectId
asOf
purpose
domains[]
kinds[]
terms[]
limit
```

Ordering is deterministic:

1. active before disputed;
2. more exact token matches before fewer;
3. stable knowledge ID as final tie-breaker.

There is no model score, aesthetic score or embedding similarity in V1.

Retrieval rank is explicitly non-authoritative.

## Project-safe projection

The shared graph may contain project-scoped knowledge from several projects.

A project retrieval artifact must not become a side channel into another project's knowledge.

Therefore project payload creation follows a stronger boundary than graph storage.

### Foreign scoped nodes

Knowledge scoped to another project is removed **before** project payload construction.

It does not contribute to:

- results;
- conflict context;
- exclusion counts;
- visible graph-size aggregates.

### Source relationships

Retrieved entries do not copy the Foundation `relationships` array into the project payload.

The array is stripped:

```text
relationships = []
```

This matters because an otherwise visible Project A entry might contain a relationship target ID belonging to Project B.

Scope-safe visible relations are reintroduced only through retrieval-specific metadata.

### Hidden conflicts

If visible Project A evidence conflicts with knowledge hidden by project scope, retrieval may expose only:

```text
withheldConflictPresent = true
```

It must not expose:

- the hidden knowledge ID;
- hidden content;
- hidden provenance;
- a hidden-project conflict count.

The boolean communicates epistemic incompleteness without becoming a metadata side channel.

### Visible conflicts

Conflicts whose counterpart is visible in the same project scope are retained explicitly.

If the counterpart does not independently match the primary query, it appears as **unranked conflict context** rather than being silently discarded.

This prevents retrieval from manufacturing false consensus.

## Blocked-source rule

A structurally invalid graph is not allowed to influence a project payload and then merely mark that payload `blocked`.

The fail-closed rule is:

```text
source graph reviewReady = false
→ results = []
→ conflictContext = []
→ source-derived visible counts = 0
→ no graph-derived knowledge text / IDs / conflict metadata
```

The artifact may retain opaque source fingerprints and safe structural diagnostics, but no graph-derived project evidence.

This prevents blocked output from becoming an accidental exfiltration channel.

## Structural review versus provenance

A SHA-256 fingerprint detects exact-contract drift. It is **not** a signature and does not independently establish origin.

Graph provenance therefore requires the source Foundation to be supplied separately at the verification boundary.

Independent graph provenance recomputes:

- Foundation review;
- Foundation snapshot fingerprint;
- knowledge-library fingerprint;
- exact knowledge node ID membership;
- exact node content;
- graph structural diagnostics when attached.

The returned receipt contains fingerprints and verification state, not Foundation knowledge.

A caller-modified `findings` array cannot ride beside an otherwise valid graph and still pass independent provenance; attached diagnostics must equal the fresh graph review diagnostics.

## Retrieval provenance

Independent retrieval provenance requires:

```text
retrieval
+
source graph supplied separately
+
source Foundation supplied separately
```

Verification first re-establishes graph → Foundation provenance, then deterministically rebuilds the retrieval from the exact graph and query.

The claimed and rebuilt retrieval contracts must match exactly.

If the project artifact carries a compact `provenanceReceipt` or `provenanceReady` claim, those are independently recomputed as well. A modified receipt cannot be ignored merely because the underlying result set still matches.

Attached retrieval diagnostics are likewise rebound to a fresh structural review during independent provenance.

### Provenance failure rule

A graph may be structurally valid yet fail provenance against the independently supplied Foundation—for example, the same knowledge ID may contain different content.

The provenance-enabled builder therefore applies another fail-closed boundary:

```text
graph provenanceReady = false
→ returned project evidence is redacted to zero
→ provenanceReady = false
```

It does not return graph-derived content and merely attach a failed provenance warning afterward.

## Compact receipts

Project artifacts receive compact provenance receipts only.

They must not embed:

- full Foundation reviews;
- full graph reviews;
- full graph nodes;
- foreign project metadata.

Diagnostic review functions remain available separately for engineering inspection.

The compact receipt is part of the verified project envelope when present: independent provenance recomputes it rather than trusting cached receipt bytes.

## Truth boundary

Graph and retrieval artifacts remain advisory.

In particular:

```text
retrievalRankIsCreativeAuthority = false
creativeDirectionSelected = false
productionApproved = false
```

Neither higher confidence, newer evidence, more incoming edges, representation status, provenance readiness nor first retrieval rank can change those facts.

## V1 regression requirements

The slice should prove at least:

1. graph snapshot determinism;
2. Foundation relationship reconstruction;
3. raw node/edge schema and authority tampering fails before normalization can hide it;
4. hidden extra graph fields and top-level payload fields fail closed;
5. graph truth and derived review state cannot be caller-forged;
6. an invalid Foundation emits no Foundation-derived graph nodes;
7. trend freshness requires capturedAt, freshUntil, evidenceRefs and explicit asOf;
8. non-active representation states require reason + evidenceRefs;
9. stale trends are excluded deterministically;
10. disputed evidence remains visible;
11. superseded/deprecated evidence stays out of project retrieval;
12. supersession lineage is bidirectionally consistent;
13. foreign project knowledge does not enter project payloads or visible counts;
14. source relationships are stripped from retrieved entries;
15. visible conflicts are preserved as unranked context;
16. hidden-scope conflicts expose no ID/content/count;
17. structurally blocked graphs emit zero graph-derived project evidence;
18. same-ID Foundation drift fails independent graph provenance;
19. provenance failure emits zero graph-derived project evidence;
20. deterministic retrieval can be independently rebuilt;
21. reordered or altered results fail provenance;
22. compact provenance receipt/provenanceReady drift fails independent provenance;
23. caller-modified graph/retrieval diagnostics fail independent provenance;
24. rank, graph status and provenance cannot manufacture creative approval.

## V1 non-goals

Do not add yet:

- vector embeddings;
- semantic vector search;
- learned reranking;
- model-generated relevance scores;
- autonomous trend ingestion;
- automatic conflict resolution;
- confidence averaging across contradictory evidence;
- autonomous Creative Thesis / Creative World selection;
- full Creative Transfer Intelligence;
- full Creative Synthesis Intelligence.

## Next slice

After Graph V1 is stable and its project-isolation/provenance boundaries are proven, proceed to **Creative Transfer Intelligence**.

Transfer should consume qualified, scope-safe evidence and learn how to move causal principles across domains without copying source surface signatures. It must build on this graph rather than bypass its provenance, freshness, conflict and representation-state boundaries.
