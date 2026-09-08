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

## Non-goals for V1

- no model/provider picker as a primary product concept
- no hard-coded OpenAI/OpenRouter dependency
- no automatic provider fallback that hides an unavailable requested constraint
- no hidden-chain-of-thought exposure
- no human-approval inference from model output
- no autonomous production/release authorization
- no live paid provider call in CI
