# Production Adapter Contract

Production adapters are execution boundaries. They turn an already-routed production job into real output files and normalize the result into `ai-studio-os/artifact@1`.

They are not planning modules and they are not permission to fabricate unavailable evidence.

## Adapter invariants

- Every adapter has a stable `id`, provider label, supported operations, capabilities, availability state, and one `execute()` function.
- Tool selection remains provider-agnostic. A routed assignment chooses an adapter by capability/availability/budget before execution.
- An adapter may only execute operations it explicitly declares.
- `available: false` fails closed; the runtime never silently substitutes an unregistered provider.
- Truth-sensitive final representations may not be generated from scratch.
- Edit operations require a real source file/reference.
- Successful execution must return at least one real file reference. An empty success response is blocked as `adapter-output-file-missing`.
- Provider/model/request metadata, rights, cost, and failures remain visible on the resulting Artifact.
- Produced output starts `unreviewed` and `unmeasured`. Adapter success never means creative approval or release readiness.
- Adapter exceptions are converted into blocker findings rather than crashing the whole production batch.
- Batch execution returns an Artifact Graph so dependency validity remains fail-closed.

## Normalized job shape

A production job should provide:

- `id`
- `version`
- `kind`
- `operation`
- `projectId`
- `brandDnaVersion` when applicable
- `requiredCapabilities[]`
- `dependencies[]`
- `input`
- `sourceFiles[]` for edit operations
- `truthSensitive`
- `rights`
- `metadata`

## Adapter result shape

An adapter `execute(job, context)` returns:

- `files[]` — real file/path/url references; at least one is required for success
- `previews[]`
- `measurements[]`
- `provenance`
- `rights`
- `cost`
- `metadata`
- optional `findings[]`

The runtime owns Artifact normalization and final pass/fail truth.