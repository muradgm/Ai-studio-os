# Creative Intelligence Foundation V1

## Status

Implementation architecture for the shared creative reasoning substrate that follows Motion Creative Intelligence V1.

This layer strengthens what AI Studio OS knows and how it reasons. It does **not** replace or weaken the existing creative authority chain.

## Build sequence

```text
Motion Creative Intelligence V1
→ Creative Intelligence Foundation V1
→ Creative Knowledge representation / graph
→ Creative Transfer Intelligence
→ Creative Synthesis Intelligence
→ Motion Intelligence V2
→ serious motion benchmarks / dogfood
→ Spatial Creative Intelligence V1
→ camera / geometry / materials / physics / production intelligence
```

## Constitutional boundary

```text
KNOWLEDGE != AUTHORITY
REFERENCE != DIRECTION
PATTERN != SOLUTION
TREND != JUSTIFICATION
TECHNOLOGY != CONCEPT
CRITIC SCORE != SELECTION
```

The Foundation is advisory infrastructure beneath project-specific creative authority.

It cannot:

- select a Creative Thesis;
- select a Creative World;
- declare a Creative Direction canonical;
- record human approval on behalf of a human;
- authorize technical planning;
- authorize production.

Existing human and proof boundaries remain downstream.

## Three-layer model

```text
KNOWLEDGE
What Studio knows and how qualified that knowledge is.

INTELLIGENCE
How Studio reasons with selected knowledge and project truth.

CRAFT
How specialist systems construct and execute the result.
```

Knowledge does not become authority because it is well sourced, popular, recent, aesthetically attractive, or highly confident.

## V1 objective

Foundation V1 establishes the contracts needed for deeper intelligence without prematurely building the full knowledge graph.

It provides:

1. typed Creative Knowledge entries;
2. provenance and confidence qualification;
3. works / fails conditions;
4. counterexamples and diagnostics;
5. relationships and conflicts;
6. reference decomposition hooks;
7. shared Foundation constitution;
8. project-specific evidence selection;
9. project-scope isolation;
10. explicit Creative Reasoning moves;
11. causal, analogy, contradiction, appropriateness, genericity, transfer, synthesis and critique reasoning types;
12. uncertainty and falsifier requirements;
13. fail-closed authority boundaries.

The full graph, retrieval strategy, learned transfer engine and synthesis engine remain later slices.

## Creative Knowledge entry

Canonical artifact:

```text
ai-studio-os/creative-knowledge-entry@1
```

A serious entry records:

- stable identity;
- evidence kind;
- domain;
- definition / claim;
- causal rationale: why it works;
- perceptual effects;
- conditions where it works;
- conditions where it fails;
- creative variables;
- cross-domain applications;
- failure modes;
- counterexamples;
- diagnostics;
- relationships;
- provenance;
- confidence;
- confidence basis;
- scope;
- project identity when project-scoped;
- transferability;
- transfer decomposition for references / trends.

A label such as `use strong contrast`, `editorial layout`, `liquid gradient`, or `cinematic motion` is not qualified knowledge.

## Knowledge kinds

V1 distinguishes:

```text
principle
historical-precedent
current-trend
project-observation
benchmark-learning
human-preference
uncertain-inference
```

These categories must not collapse into one undifferentiated memory pool.

### Principle

A generalizable creative or perceptual claim with causal rationale and boundaries.

### Historical precedent

A reference used to learn a transferable principle. The recognizable surface package is not permission to copy it.

### Current trend

Evidence about current practice or market movement. Trend status alone is never creative justification.

### Project observation

Evidence scoped to one project. It cannot silently transfer into another project.

### Benchmark learning

A lesson supported by controlled or inspectable benchmark evidence.

### Human preference

A recorded preference or approval fact. It may be evidence about what a human chose, but the knowledge entry itself cannot manufacture or extend authority.

### Uncertain inference

A useful hypothesis whose uncertainty must remain visible.

## Scope model

```text
general
project
benchmark
human
```

A shared Foundation may contain project-scoped entries from many projects.

The isolation rule applies when creating a project reasoning context:

> A project may select project-scoped knowledge only when the knowledge project identity matches the current project identity.

This keeps the shared substrate usable without leaking project-specific observations across boundaries.

## Provenance and confidence

Every active entry needs identifiable provenance.

At minimum:

```text
sourceId
sourceType
```

Reference-like evidence should retain a concrete `sourceRef`.

Confidence is constrained to `0..1`, but the number is not enough. It also requires a written confidence basis.

Confidence means:

> How strongly does the available evidence support using this item as qualified creative evidence within its declared scope?

It does **not** mean:

- probability that a design will be good;
- authority to select a direction;
- permission to ignore counterevidence;
- approval strength.

## Relationships

V1 supports:

```text
reinforces
conflicts-with
depends-on
qualifies
counterexample-to
derived-from
```

Relationship targets must resolve inside the same library snapshot.

This is deliberately smaller than a future knowledge graph. V1 proves the relationship semantics before adding graph infrastructure.

## Reference decomposition firewall

Historical precedents and current trends require explicit separation between causal logic and surface signature.

Required fields:

```text
transferablePrinciples
surfaceSignature
mustStrip
adaptationRules
copyRisks
```

The intended process is:

```text
reference
→ identify causal creative principle
→ identify recognizable surface signature
→ state what must be stripped
→ state adaptation logic
→ identify imitation risk
→ only then allow project-context reasoning
```

This prevents retrieval from becoming style cloning.

## Shared Foundation artifact

Canonical artifact:

```text
ai-studio-os/creative-intelligence-foundation@1
```

It binds:

- the qualified knowledge library;
- the constitutional rules;
- the explicit non-authority truth boundary.

Caller-controlled constitution changes are blockers.

For example, changing:

```text
knowledgeIsAuthority = false
```

to:

```text
knowledgeIsAuthority = true
```

must invalidate the Foundation rather than create a new authority path.

## Project reasoning context

Canonical artifact:

```text
ai-studio-os/creative-intelligence-context@1
```

A context binds reasoning to:

- one project identity;
- one explicit purpose / decision question;
- current project truths;
- project constraints;
- one reviewed Foundation snapshot;
- an explicit subset of relevant knowledge.

Every selected knowledge reference explains:

```text
role
relevance
projectFit
caution
```

The selection step matters. A reasoning move may not cite arbitrary knowledge from the library merely because it exists.

Project truth remains the grounding layer. Retrieved knowledge cannot redefine the project.

## Creative Reasoning Frame

Canonical artifact:

```text
ai-studio-os/creative-reasoning-frame@1
```

Reasoning moves are explicit and inspectable.

Supported V1 types:

```text
causal
analogy
abstraction
contradiction
appropriateness
genericity
transfer
synthesis
critique
```

A move may include:

- claim;
- causal explanation;
- selected knowledge references;
- project-truth references;
- counterevidence references;
- creative consequence;
- uncertainty;
- falsifier;
- explicit rejection rationale.

## Reasoning rules

### Causal reasoning

A causal claim must explain mechanism, not merely correlation.

Bad:

> Large type feels premium.

Better:

> Concentrating scale contrast can establish first fixation when surrounding hierarchy remains quieter; if all surfaces use the same contrast, the effect collapses.

### Analogy / transfer

Analogy, transfer and synthesis must reconnect to current project truth.

A reference may inspire a principle; it cannot become project direction merely because it is attractive.

### Transfer / synthesis falsifier

Transfer and synthesis require an explicit falsifier.

Examples:

- reject if the adaptation begins reproducing the reference surface signature;
- reject if scan speed deteriorates;
- reject if the idea loses the project-specific governing tension;
- reject if the solution becomes equally plausible for a direct competitor.

### Critique

Critique must state what is rejected and why.

A negative score or generic `does not work` judgment is insufficient.

### Uncertainty

Every serious reasoning move keeps meaningful uncertainty visible.

The Foundation must not turn uncertain inference into fact through confident wording.

## Relationship to Creative Thesis

Creative Thesis remains authoritative according to its existing deliberation and human-approval boundary.

Foundation V1 can provide qualified evidence and reasoning inputs such as:

```text
project truth
+ qualified creative knowledge
+ causal reasoning
+ cross-domain analogy
+ contradiction reasoning
+ genericity / appropriateness checks
→ better thesis hypotheses
```

But Foundation V1 cannot select or approve the thesis.

## Relationship to Creative World

Creative World remains the project-specific creative universe.

Foundation V1 should eventually help worlds defend:

- perceptual strategy;
- composition theory;
- typography and color behavior;
- image philosophy;
- material logic;
- spatial philosophy;
- motion philosophy;
- interaction philosophy;
- cultural / cross-domain principles;
- genericity and imitation risks;
- causal rationale.

It does not select the world.

## Relationship to Drawing Intelligence

Keep the existing Brain / Hand boundary:

```text
Creative Knowledge
→ Creative reasoning
→ Drawing Intelligence
→ semantic drawing hypothesis
→ Geometry Intent
→ Vector Geometry
→ rendered proof
→ downstream review / human authority
```

Foundation V1 may improve metaphor choice, visual-vocabulary reasoning, proportion judgment and family logic. It cannot emit exact vector authority or approve an icon system.

## Relationship to Motion Intelligence

Motion Creative Intelligence V1 remains the authority/proof skeleton.

Future Motion Intelligence V2 should consume richer Foundation knowledge about:

- attention choreography;
- temporal composition;
- pacing and rhythm;
- stillness;
- perceived physical character;
- spatial choreography;
- interaction choreography;
- cinematic and editing language;
- typographic and image motion;
- responsive reinterpretation;
- reduced-motion equivalence;
- performance reasoning.

V2 deepens the brain rather than replacing Motion V1 authority.

## Relationship to Spatial Creative Intelligence

Spatial expansion comes after the shared intelligence layer, Transfer / Synthesis and deeper Motion work.

Three.js, WebGL/WebGPU, shaders, Blender and physics engines remain production technologies, not creative concepts.

## V1 failure conditions

Foundation V1 fails if:

- knowledge can set approval or production truth;
- cached `reviewReady` or `productionApproved` flags survive fresh review;
- invalid schemas are normalized into valid authority;
- project-scoped knowledge can be selected across projects;
- a reasoning move can cite knowledge that was never selected into its context;
- references can enter reasoning without surface-signature decomposition;
- confidence has no evidence basis;
- principles omit failure conditions and counterexamples;
- transfer / synthesis can proceed without project grounding or falsifiers;
- the system requires every project to traverse a giant visible taxonomy;
- taxonomy completeness is mistaken for creative quality.

## V1 non-goals

Do not build yet:

- a large persisted knowledge graph;
- vector embeddings / retrieval ranking as authority;
- automated web trend ingestion as creative direction;
- autonomous Creative Thesis or Creative World selection;
- Transfer Intelligence as a full specialist engine;
- Synthesis Intelligence as a full specialist engine;
- Motion Intelligence V2;
- Spatial Creative Intelligence V1;
- one runtime module for every creative discipline.

## Validation strategy

The V1 regression suite should prove at least:

1. rich qualified principles are usable;
2. thin labels remain provisional;
3. references require causal / surface decomposition;
4. raw authority fabrication is rejected before normalization;
5. relationship targets resolve;
6. constitutional rules cannot be weakened by callers;
7. one shared Foundation can hold several project scopes;
8. project contexts cannot select another project's scoped knowledge;
9. contexts explicitly bind their selected evidence;
10. reasoning cannot inject unselected knowledge;
11. causal claims expose mechanism;
12. transfer / synthesis require project truth and falsifiers;
13. uncertainty remains explicit;
14. reasoning cannot manufacture downstream approval.

## Next slice after V1

Once Foundation V1 is stable and dogfooded, proceed to **Creative Knowledge representation / graph**.

That next slice should solve storage, retrieval, relationships, conflict handling, provenance evolution and evidence freshness without changing the constitutional authority model proven here.
