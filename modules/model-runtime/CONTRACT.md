# Model Runtime V1 Contract

The model runtime gives AI Studio OS one provider-independent boundary for reasoning-model execution.

It does **not** make a model/provider part of product doctrine, and it does not turn model output into human or release authority.

## Core rule

> Providers are adapters, not architecture.

Product workflows should request a capability and operation. The runtime selects from registered providers by capability, availability, budget, and explicit priority.

## Supported first-slice operations

- `reason`
- `critique`
- `generate-structured`
- `tool-plan`

A future provider may support only a subset. Unsupported operations fail closed.

## Provider contract

Every registered provider must declare:

- stable `id`
- human-readable `provider` label
- `operations[]`
- `capabilities[]`
- optional `models[]`
- optional `defaultModel`
- `available`
- `costTier`
- `priority`
- one async `execute(task, context)` function

Provider identity may be recorded for provenance and observability, but routing must not select a vendor merely because of its name.

## Task contract

A model task may contain:

- `id`
- `operation`
- `requiredCapabilities[]`
- `budgetTier`: `free | low | medium | high`
- optional `preferredModel`
- `input`
- `metadata`

`preferredModel` is an explicit execution constraint. It is not permission to silently substitute a different incompatible provider/model.

## Routing contract

The runtime builds an auditable selection trace for every registered provider and records rejection reasons such as:

- `unavailable`
- `operation-mismatch`
- `capability-mismatch`
- `over-budget`
- `preferred-model-unavailable`

If no eligible provider remains, execution fails closed as `model-provider-unavailable`.

## Execution result

Successful provider execution is normalized to `ai-studio-os/model-result@1` with:

- task and operation identity
- provider/provider-adapter identity
- model identity when known
- normalized `output`
- usage/cost when actually measured or supplied
- provenance
- findings
- metadata
- fixed authority state

Provider exceptions become blocker findings rather than escaping the runtime.

## Authority boundary

Every normalized model result is candidate-only:

```text
candidateOnly   = true
humanApproved   = false
productionReady = false
releaseReady    = false
```

A provider response cannot override those fields. Model execution can author, analyze, critique, plan, or propose; it cannot fabricate human approval, canonical authority, production readiness, or release readiness.

## Development without paid API access

`createMockModelProvider()` supplies a deterministic, no-network, development-only provider. It exists so routing, project-state integration, UI/runtime plumbing, tests, and authority boundaries can be built before any paid provider is enabled.

The mock provider must never be represented as a live model call. Its provenance records `liveProviderCall: false` and its usage/cost remain unmeasured rather than fabricated.

## Future live adapters

OpenAI, OpenRouter, local models, or other providers should be added as separate adapters behind this contract. Adding a provider must not require rewriting creative, project, council, or production logic.

Credentials belong at the server/runtime boundary. They must never be embedded in browser code or project artifacts.

## Project-state execution slice

The existing Universal Artifact Graph owns shared versioned project production
records. Command Center is its projection, not another project kernel. The
canonical creative pipeline separately owns consequential creative handoffs;
this integration neither replaces nor grants that authority. Continuity owns
shot-level locks, and the execution-server job graph owns build/browser evidence.

`executeStudioModelTask({ graph, task, registry })` is an explicit, in-memory,
append-only transaction over the existing Artifact Graph. It revalidates artifact
structure with `createArtifact()` and dependencies with `buildArtifactGraph()`;
cached graph readiness is not sufficient. Source content is context, never an
assertion that a thesis/world/asset is approved. No domain approval is required
merely to author a provisional critique of that context.

```js
import { createArtifact, buildArtifactGraph } from '../artifact-graph/runtime.mjs';
import { createModelRegistry, createMockModelProvider, executeStudioModelTask } from './index.mjs';

const source = createArtifact({
  id: 'studio:brief', projectId: 'studio', kind: 'brief', status: 'produced',
  metadata: { brief: 'Explain our service clearly.' }
});
const graph = buildArtifactGraph([source]);
const result = await executeStudioModelTask({
  graph,
  task: {
    schema: 'ai-studio-os/studio-model-task@1',
    id: 'brief-critique-1', projectId: 'studio', sourceRef: source.ref,
    operation: 'critique', requiredCapabilities: ['reasoning', 'structured-output'],
    budgetTier: 'free', input: { question: 'What remains unclear?' }
  },
  registry: createModelRegistry([createMockModelProvider()])
});
// Adopt result.graph only when result.pass. Retain graph to roll back.
// result.state is the existing Command Center projection with a review item.
```

The Studio task schema requires explicit project identity, exact source ref,
operation, capabilities including `structured-output`, budget, and task `id`
(the existing model-runtime convention). `input` is optional JSON context.
Provider/model selectors, caller-supplied candidate identity, arbitrary metadata,
and approval flags are not accepted at this product boundary. Missing schema
never activates execution. Existing callers and graph schemas do not migrate.

Candidate identity is `${projectId}:model-candidate:${task.id}@1`. Reusing that
artifact id fails before execution; a revised attempt needs a new task id.
The runtime transports optional `projectId`, `sourceRef`, and `candidateRef`
bindings without requiring them from legacy non-project model tasks. Conflicting
response identities fail closed. Providers receive detached task context.

Successful execution requires structured JSON object output. The new universal
artifact has kind `model/candidate`, status `review`, reviewStatus `unreviewed`,
and releaseStatus `unmeasured`. Its `metadata.modelCandidate` payload uses
`ai-studio-os/model-candidate@1`, fixed candidate authority, and opaque authored
`content`. Even a critique is authored content awaiting independent review,
not a completed review record. Canonical-looking flags inside content are data,
not authority. Consumers must never promote that content by copying its flags.

Source, request, and content fingerprints provide provenance using the existing
fingerprint helper; they are not approval signatures. Exact dependency edges
reuse graph change propagation. Graph drift while execution is pending rejects
integration. No exported import/commit helper accepts caller-forged model results.

Provider metadata, findings, and arbitrary provenance remain in the diagnostic
model response and are never merged into project state. The candidate carries
only explicit identity and execution fields. No files, reviews, measurements,
rights clearance, human decisions, or rendered evidence are fabricated. Usage
and cost in this first Studio slice are unmeasured. Mock provenance is explicitly
`liveProviderCall:false`, `developmentOnly:true`.

Failures return the caller's graph unchanged with `candidate:null`; success
returns a new graph and existing Command Center review projection. This is a
local transaction boundary, not durable storage, a network API, a sandbox for
arbitrary adapter code, or a replacement for independent/domain review. A future
persisting caller must perform its own atomic revision check when adopting the
returned graph. No UI, server job, legacy workflow, or live adapter auto-activates.

## Non-goals for V1

- no model/provider picker as a primary product concept
- no hard-coded OpenAI/OpenRouter dependency
- no automatic provider fallback that hides an unavailable requested constraint
- no hidden-chain-of-thought exposure
- no human-approval inference from model output
- no autonomous production/release authorization
- no live paid provider call in CI
