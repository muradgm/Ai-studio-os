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

`local-svg` writes actual SVG files and records deterministic structural measurements, but it does **not** approve the design or declare a logo canonical.

Production guardrails:

- a valid positive `viewBox` is required
- scripts, inline event handlers, `foreignObject`, JavaScript URLs, and external network references are blocked
- vector-only masters reject embedded raster `<image>` content
- font-free masters reject live `<text>` nodes; typography must be converted to approved outlines upstream
- output paths are constrained to the configured local root
- successful output records SHA-256, bytes, structural measurements, and a real filesystem path
- `canonicalLogoApproval` and `creativeApproval` remain false; independent logo/vector/creative review is still required

## OpenAI image adapter

`openai-image` is an external network production adapter using OpenAI's Image API for routed raster generation/edit jobs.

Production rules:

- unavailable when `OPENAI_API_KEY` is absent; no silent provider fallback
- generation and edits use the provider image endpoints
- edit jobs accept auditable local filesystem source images only in this first slice
- decoded bytes must match the requested PNG/JPEG/WebP format before they are written
- output/source paths stay inside configured roots
- SHA-256, bytes, request id, provider/model, endpoint and output options remain on the Artifact
- provider success never implies creative approval, brand fit, rights clearance or release readiness
- tests use fake HTTP and credentials; CI makes no paid provider request

## ComfyUI image adapter

`comfyui-image` is the first local raster-production adapter. It drives a supplied ComfyUI API-format workflow through ComfyUI's native HTTP surface and converts the returned image into a universal Artifact.

Production rules:

- default endpoint `http://127.0.0.1:8188`; non-loopback endpoints require `allowRemote`
- this first slice supports routed `generate` jobs only
- jobs must provide a real ComfyUI API-format workflow graph
- execution uses `POST /prompt`, `GET /history/{prompt_id}`, then `GET /view`
- prompt-id keyed and `history[]` response forms are accepted
- a completed job without a real raster output is blocked
- output paths remain inside the configured artifact root
- SHA-256, bytes, prompt id, workflow/output node data, polling attempts and measured adapter duration remain on the Artifact
- local compute cost is recorded as unmeasured rather than fabricated as zero
- local execution does not imply creative or release approval

## Gemini image adapter

`gemini-image` is the second hosted raster provider and uses Google's current Gemini Interactions image-generation surface.

Production rules:

- defaults to `gemini-3.1-flash-image` (Nano Banana 2); supported explicit production choices are `gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image`, and `gemini-3-pro-image`
- unavailable when `GEMINI_API_KEY` is absent; no fallback provider is selected inside the adapter
- both generation and edit/reference jobs call `POST /v1beta/interactions`
- edit/reference images are auditable local files encoded as image input blocks; remote edit sources and files outside the configured source root are rejected in this slice
- inline interaction payloads are capped at the documented 20 MB request boundary; larger source workflows should later move through an explicit Files API adapter/ingest path
- response output can be read from the `output_image` convenience form or explicit `model_output` image blocks
- decoded output must be a recognized raster and match the requested PNG/JPEG output format before it is written
- output paths stay inside the configured artifact root
- current model capability differences are explicit: Flash Image supports 512/1K/2K/4K, Flash Lite Image is constrained to 1K, and Pro Image supports 1K/2K/4K
- aspect-ratio validation reflects the current Gemini image-model tables rather than silently coercing an unsupported ratio
- SHA-256, bytes, provider/model/request/interaction ids, aspect ratio, image size and reference-input counts remain on the Artifact
- `synthIdExpected` records the provider's current generated-image watermark policy as provenance metadata; it is not treated as a local watermark verification result
- Google Search/Image Search grounding is deliberately disabled in this first adapter, avoiding attribution-display obligations until grounded-image provenance is implemented explicitly
- generated output remains `produced / unreviewed / unmeasured`; provider success never means creative approval, rights clearance or release readiness
- tests use an injected fake HTTP boundary and fake credential; CI makes no live Gemini request

Provider-specific adapters are implementation boundaries, not quality rankings. Routing should eventually select among OpenAI, Gemini and local ComfyUI from declared capabilities, availability, cost/evidence and benchmarked production quality rather than vendor preference.
