import { fingerprintCreativeValue } from '../creative-intelligence-foundation/fingerprint.mjs';

const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
const TEMPERATURE = 0.7;

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function integer(value) { return Number.isInteger(value) && value > 0 ? value : null; }
function finding(severity, code, message, evidence = {}) { return { severity, code, message, evidence }; }

function safeErrorMessage(error, secret) {
  const value = text(error?.message) || 'Gemini request failed without a readable error message.';
  return secret ? value.split(secret).join('[redacted]') : value;
}

function safeUsageMetadata(value = {}) {
  return {
    promptTokenCount: integer(value?.promptTokenCount),
    candidatesTokenCount: integer(value?.candidatesTokenCount),
    totalTokenCount: integer(value?.totalTokenCount),
    cachedContentTokenCount: integer(value?.cachedContentTokenCount)
  };
}

function normalizeBudget(value = {}) {
  return {
    maxGenerationAttempts: integer(value?.maxGenerationAttempts),
    tokenBudget: integer(value?.tokenBudget),
    wallClockSeconds: integer(value?.wallClockSeconds),
    modelPolicyId: text(value?.modelPolicyId),
    temperaturePolicyId: text(value?.temperaturePolicyId)
  };
}

function normalizeTrial(value = {}) {
  return {
    trialId: text(value?.trialId),
    conditionId: text(value?.conditionId).toUpperCase(),
    projectId: text(value?.projectId),
    briefFingerprint: text(value?.briefFingerprint),
    runtimeTraceRef: text(value?.runtimeTraceRef),
    generationBudget: normalizeBudget(value?.generationBudget)
  };
}

function responseText(response = {}) {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((part) => text(part?.text)).filter(Boolean).join('\n').trim();
}

function parseStructuredDraft(response = {}) {
  const rawText = responseText(response);
  if (!rawText) return { rawText: '', draft: null, error: 'Gemini returned no candidate text.' };
  try {
    const draft = JSON.parse(rawText);
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return { rawText, draft: null, error: 'Gemini structured output must be a JSON object.' };
    return { rawText, draft, error: '' };
  } catch {
    return { rawText, draft: null, error: 'Gemini returned text that is not valid JSON.' };
  }
}

function normalizeModelIdentity(value = {}) {
  return {
    schema: 'ai-studio-os/gemini-model-identity@1',
    requestedModel: text(value?.requestedModel),
    providerModelName: text(value?.providerModelName),
    providerBaseModelId: text(value?.providerBaseModelId),
    providerVersion: text(value?.providerVersion),
    supportedGenerationMethods: Array.isArray(value?.supportedGenerationMethods) ? value.supportedGenerationMethods.map(text).filter(Boolean).sort() : [],
    inputTokenLimit: integer(value?.inputTokenLimit),
    outputTokenLimit: integer(value?.outputTokenLimit),
    providerMetadataFingerprint: text(value?.providerMetadataFingerprint),
    capturedAt: text(value?.capturedAt)
  };
}

function isMutableLatestAlias(model) {
  return /(?:^|-)latest$/i.test(text(model));
}

export function buildGeminiMotionDogfoodBudget(model, overrides = {}) {
  const normalizedModel = text(model);
  return {
    maxGenerationAttempts: integer(overrides.maxGenerationAttempts) ?? 1,
    tokenBudget: integer(overrides.tokenBudget) ?? 1200,
    wallClockSeconds: integer(overrides.wallClockSeconds) ?? 60,
    modelPolicyId: `gemini/${normalizedModel}@dogfood-v1`,
    temperaturePolicyId: 'gemini-fixed-temperature-0.7@dogfood-v1'
  };
}

export function createGeminiMotionDogfoodRunner({
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_FREE_MODEL,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  apiRoot = GEMINI_API_ROOT
} = {}) {
  const configuredApiKey = text(apiKey);
  const configuredModel = text(model);
  const configuredApiRoot = text(apiRoot).replace(/\/+$/, '');

  async function inspectModelIdentity() {
    const findings = [];
    if (!configuredApiKey) findings.push(finding('blocker', 'gemini-dogfood-api-key-missing', 'GEMINI_API_KEY is required to inspect a Gemini model identity.'));
    if (!configuredModel) findings.push(finding('blocker', 'gemini-dogfood-model-missing', 'GEMINI_FREE_MODEL is required to inspect a Gemini model identity.'));
    if (typeof fetchImpl !== 'function') findings.push(finding('blocker', 'gemini-dogfood-fetch-missing', 'A fetch implementation is required for Gemini execution.'));
    if (isMutableLatestAlias(configuredModel)) findings.push(finding('blocker', 'gemini-dogfood-mutable-model-alias', 'Formal dogfood execution rejects a mutable Gemini latest alias. Configure a provider-stable model name, then enroll its provider metadata.'));
    if (findings.length) return { schema: 'ai-studio-os/gemini-model-identity@1', status: 'blocked', findings };

    const endpoint = `${configuredApiRoot}/models/${encodeURIComponent(configuredModel)}`;
    let response;
    let body;
    try {
      response = await fetchImpl(endpoint, { method: 'GET', headers: { 'x-goog-api-key': configuredApiKey } });
      body = await response.json();
    } catch (error) {
      return {
        schema: 'ai-studio-os/gemini-model-identity@1',
        status: 'blocked',
        findings: [finding('blocker', 'gemini-dogfood-model-inspection-failed', safeErrorMessage(error, configuredApiKey))]
      };
    }
    if (!response.ok) {
      return {
        schema: 'ai-studio-os/gemini-model-identity@1',
        status: 'blocked',
        findings: [finding('blocker', 'gemini-dogfood-model-inspection-rejected', 'Gemini rejected the model identity inspection request.', { status: response.status, responseFingerprint: fingerprintCreativeValue(body ?? null) })]
      };
    }

    const identity = normalizeModelIdentity({
      requestedModel: configuredModel,
      providerModelName: body?.name,
      providerBaseModelId: body?.baseModelId,
      providerVersion: body?.version,
      supportedGenerationMethods: body?.supportedGenerationMethods,
      inputTokenLimit: body?.inputTokenLimit,
      outputTokenLimit: body?.outputTokenLimit,
      providerMetadataFingerprint: fingerprintCreativeValue(body),
      capturedAt: now().toISOString()
    });
    if (!identity.providerModelName || !identity.providerVersion) findings.push(finding('blocker', 'gemini-dogfood-provider-version-missing', 'Gemini model inspection did not expose a provider model name and version, so formal execution cannot bind provider identity.'));
    if (!identity.supportedGenerationMethods.includes('generateContent')) findings.push(finding('blocker', 'gemini-dogfood-generate-content-unsupported', 'The enrolled Gemini model does not advertise generateContent support.'));
    return { ...identity, status: findings.length ? 'blocked' : 'enrolled', findings };
  }

  async function runPrototype({ trial, generationInstruction, architectureDeclaration, runtimeEvidenceRef }) {
    const normalizedTrial = normalizeTrial(trial);
    const normalizedInstruction = text(generationInstruction);
    const normalizedRuntimeEvidenceRef = text(runtimeEvidenceRef);
    const findings = [];

    if (!configuredApiKey) findings.push(finding('blocker', 'gemini-dogfood-api-key-missing', 'GEMINI_API_KEY is required for a live Gemini dogfood preflight.'));
    if (!configuredModel) findings.push(finding('blocker', 'gemini-dogfood-model-missing', 'GEMINI_FREE_MODEL is required for a live Gemini dogfood preflight.'));
    if (typeof fetchImpl !== 'function') findings.push(finding('blocker', 'gemini-dogfood-fetch-missing', 'A fetch implementation is required for Gemini execution.'));
    if (!normalizedTrial.trialId || !normalizedTrial.conditionId || !normalizedTrial.projectId || !normalizedTrial.briefFingerprint || !normalizedTrial.runtimeTraceRef) findings.push(finding('blocker', 'gemini-dogfood-trial-incomplete', 'Prototype execution requires a trial ID, condition ID, project ID, brief fingerprint and runtime-trace reference.'));
    if (!normalizedInstruction) findings.push(finding('blocker', 'gemini-dogfood-instruction-missing', 'Prototype execution requires the condition-specific generation instruction prepared upstream.'));
    if (!architectureDeclaration || typeof architectureDeclaration !== 'object' || Array.isArray(architectureDeclaration)) findings.push(finding('blocker', 'gemini-dogfood-architecture-declaration-missing', 'Prototype execution requires an explicit architecture declaration; this runner cannot infer which reasoning layers were used.'));
    if (!normalizedRuntimeEvidenceRef) findings.push(finding('blocker', 'gemini-dogfood-runtime-evidence-ref-missing', 'Prototype execution requires the output evidence reference that will contain its trace.'));

    const budget = normalizedTrial.generationBudget;
    const expectedBudget = buildGeminiMotionDogfoodBudget(configuredModel, budget);
    if (!budget.maxGenerationAttempts || !budget.tokenBudget || !budget.wallClockSeconds || !budget.modelPolicyId || !budget.temperaturePolicyId) findings.push(finding('blocker', 'gemini-dogfood-budget-incomplete', 'Prototype execution requires explicit model, sampling, attempt, token and time budgets.'));
    if (budget.modelPolicyId !== expectedBudget.modelPolicyId || budget.temperaturePolicyId !== expectedBudget.temperaturePolicyId) findings.push(finding('blocker', 'gemini-dogfood-policy-model-drift', 'The declared policy must bind this exact Gemini model and the fixed dogfood temperature policy.'));
    if (budget.maxGenerationAttempts !== 1) findings.push(finding('blocker', 'gemini-dogfood-retry-policy-invalid', 'The Gemini dogfood runner permits one request per invocation; retries require a separately recorded run.'));

    const truth = {
      prototypeOnly: true,
      creativeDirectionApproved: false,
      productionApproved: false,
      reviewReady: false,
      capabilityEvidenceReady: false,
      technicalPlanningApproved: false,
      providerFallbackUsed: false,
      architectureExecutionCryptographicallyProven: false
    };
    if (findings.length) return { schema: 'ai-studio-os/gemini-motion-dogfood-run@1', status: 'blocked', truth, trial: normalizedTrial, findings };

    const endpoint = `${configuredApiRoot}/models/${encodeURIComponent(configuredModel)}:generateContent`;
    const requestBody = {
      contents: [{ role: 'user', parts: [{ text: normalizedInstruction }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: TEMPERATURE,
        maxOutputTokens: budget.tokenBudget
      }
    };
    const requestRecord = {
      endpoint,
      method: 'POST',
      model: configuredModel,
      generationConfig: requestBody.generationConfig,
      bodyFingerprint: fingerprintCreativeValue(requestBody),
      architectureDeclarationFingerprint: fingerprintCreativeValue(architectureDeclaration)
    };
    const startedAt = now().toISOString();
    const startedMs = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), budget.wallClockSeconds * 1000);

    let response;
    let responseBody;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': configuredApiKey
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      responseBody = await response.json();
    } catch (error) {
      clearTimeout(timeout);
      return {
        schema: 'ai-studio-os/gemini-motion-dogfood-run@1',
        status: 'blocked',
        truth,
        trial: normalizedTrial,
        request: requestRecord,
        findings: [finding('blocker', error?.name === 'AbortError' ? 'gemini-dogfood-timeout' : 'gemini-dogfood-request-failed', safeErrorMessage(error, configuredApiKey))]
      };
    }
    clearTimeout(timeout);

    const completedAt = now().toISOString();
    const elapsedMs = Date.now() - startedMs;
    if (!response.ok) {
      return {
        schema: 'ai-studio-os/gemini-motion-dogfood-run@1',
        status: 'blocked',
        truth,
        trial: normalizedTrial,
        request: requestRecord,
        trace: { provider: 'gemini', model: configuredModel, startedAt, completedAt, elapsedMs, responseStatus: response.status, responseFingerprint: fingerprintCreativeValue(responseBody ?? null) },
        findings: [finding('blocker', 'gemini-dogfood-provider-rejected-request', 'Gemini rejected the prototype request.', { status: response.status })]
      };
    }

    const parsed = parseStructuredDraft(responseBody);
    if (parsed.error) findings.push(finding('blocker', 'gemini-dogfood-structured-output-invalid', parsed.error));
    const trace = {
      schema: 'ai-studio-os/gemini-motion-dogfood-trace@1',
      provider: 'gemini',
      model: configuredModel,
      startedAt,
      completedAt,
      elapsedMs,
      responseStatus: response.status,
      requestFingerprint: requestRecord.bodyFingerprint,
      responseFingerprint: fingerprintCreativeValue(responseBody),
      usageMetadata: safeUsageMetadata(responseBody?.usageMetadata)
    };
    const runtimeControl = {
      schema: 'ai-studio-os/dogfood-runtime-control@1',
      runtimeTraceRef: normalizedTrial.runtimeTraceRef,
      runtimeTraceFingerprint: fingerprintCreativeValue(trace),
      runtimeEvidenceRef: normalizedRuntimeEvidenceRef,
      ...budget
    };

    return {
      schema: 'ai-studio-os/gemini-motion-dogfood-run@1',
      status: findings.length ? 'blocked' : 'produced',
      truth,
      trial: normalizedTrial,
      architectureDeclaration,
      request: requestRecord,
      trace,
      runtimeControl,
      generatedDraft: parsed.draft,
      generatedTextFingerprint: fingerprintCreativeValue(parsed.rawText),
      findings
    };
  }

  return Object.freeze({ inspectModelIdentity, runPrototype });
}
