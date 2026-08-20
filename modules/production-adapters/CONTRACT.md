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

## Local SVG adapter

`local-svg` is the first vector-production adapter built on this contract. It writes an actual SVG file and records deterministic structural measurements, but it does **not** approve the design or declare a logo canonical.

Its production guardrails are deliberately strict:

- a valid positive `viewBox` is required
- scripts, inline event handlers, `foreignObject`, JavaScript URLs, and external network references are blocked
- vector-only masters reject embedded raster `<image>` content
- font-free masters reject live `<text>` nodes; typography must be converted to approved outlines upstream
- output paths are constrained to the configured local root
- successful output records SHA-256, bytes, structural measurements, and a real filesystem path
- `canonicalLogoApproval` and `creativeApproval` remain false; independent logo/vector/creative review is still required

This adapter proves file production and vector hygiene. It is not a substitute for logo integrity review, personalized-icon calibration review, or creative-direction judgment.

## OpenAI image adapter

`openai-image` is the first external network production adapter. It uses OpenAI's Image API and defaults to `gpt-image-2` for routed raster generation/edit jobs.

Production rules:

- the adapter is unavailable when `OPENAI_API_KEY` is not present; it never falls back to another provider
- generation uses the Image API generations endpoint and edit jobs use the Image API edits endpoint
- edit jobs accept auditable local filesystem source images only in this first slice; remote source URLs are rejected
- provider responses must include base64 image output, and the decoded bytes must match the requested PNG/JPEG/WebP format before they are written
- output paths remain constrained to the configured artifact root
- SHA-256, byte count, request id, provider/model, endpoint, output options, and source count remain on the normalized Artifact
- `gpt-image-2` transparent-background requests fail closed because that model does not currently support transparent output
- no provider call implies creative approval, brand fit, rights clearance, accessibility, or release readiness
- moderation/API failures are blockers; the adapter does not fabricate a fallback image
- tests use an injected fetch boundary and fake credential, so CI never requires a live OpenAI credential or paid request

The Image API integration follows the current OpenAI documentation contract: `gpt-image-2`, `/images/generations`, `/images/edits`, base64 image responses, configurable size/quality/format/compression/background, and high-fidelity edit inputs. Runtime availability still depends on a separately configured API credential.

## ComfyUI image adapter

`comfyui-image` is the first local raster-production adapter. It drives a supplied ComfyUI API-format workflow through ComfyUI's native HTTP surface and converts the resulting image into a universal Artifact.

Production rules:

- the default endpoint is `http://127.0.0.1:8188`; non-loopback endpoints are unavailable unless `allowRemote` is explicitly enabled
- this first slice supports routed `generate` jobs only; image editing/upload workflows are deferred until source-upload semantics are added deliberately
- jobs must provide a real ComfyUI API-format workflow graph; the adapter does not invent or silently repair a missing graph
- execution submits through `POST /prompt`, polls `GET /history/{prompt_id}`, and downloads the selected output through `GET /view`
- both prompt-id keyed history responses and the newer `history[]` response shape are accepted
- a completed execution without a real image output is blocked
- downloaded bytes must be a recognized PNG/JPEG/WebP raster before the file is accepted
- output paths remain constrained to the configured artifact root
- SHA-256, byte count, prompt id, workflow node count, output node id, provider filename, polling attempts, and measured adapter duration remain on the Artifact
- local compute cost is not fabricated as zero; it is recorded as unmeasured/estimated local compute
- successful local execution remains `produced / unreviewed / unmeasured`; it does not imply creative approval or release readiness

The adapter follows ComfyUI's native prompt/history/view execution pattern and keeps local execution as the default security boundary. Remote ComfyUI should require an explicit security decision rather than being enabled by configuration accident.
