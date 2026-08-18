// v1.1 Asset Registry: stable version records plus bounded surgical patching.

const FINAL_RIGHTS = new Set(['owned', 'cleared', 'licensed']);
const REVIEW_STATES = new Set(['unreviewed', 'needs-revision', 'approved', 'rejected']);

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildAssetRegistry({ assetSpecs = [], gateway, modePlan, existing = [] } = {}) {
  const findings = [];
  const entries = [...existing];
  const keys = new Set();
  for (const entry of existing) {
    const assetId = String(entry.assetId ?? '').trim();
    const version = Number(entry.version);
    if (!assetId) findings.push({ severity: 'blocker', code: 'registry-existing-asset-id-missing' });
    if (!Number.isInteger(version) || version < 1) findings.push({ severity: 'blocker', code: 'registry-version-invalid', assetId, version: entry.version });
    const key = `${assetId}@${version}`;
    if (keys.has(key)) findings.push({ severity: 'blocker', code: 'registry-version-duplicate', assetId, version });
    keys.add(key);
  }
  const assignmentById = new Map((gateway?.assignments ?? []).map((assignment) => [assignment.assetId, assignment]));

  for (const spec of assetSpecs) {
    const assetId = String(spec.id ?? '').trim();
    if (!assetId) {
      findings.push({ severity: 'blocker', code: 'registry-asset-id-missing' });
      continue;
    }
    const version = Number(spec.version ?? 1);
    if (!Number.isInteger(version) || version < 1) {
      findings.push({ severity: 'blocker', code: 'registry-version-invalid', assetId, version: spec.version });
      continue;
    }
    const key = `${assetId}@${version}`;
    if (keys.has(key)) {
      findings.push({ severity: 'blocker', code: 'registry-version-duplicate', assetId, version });
      continue;
    }
    keys.add(key);

    const assignment = assignmentById.get(assetId);
    const reviewStatus = spec.reviewStatus ?? 'unreviewed';
    const status = assignment?.action === 'route' ? (nonEmpty(spec.outputEvidence) ? 'produced' : 'planned')
      : assignment?.action === 'capture-required' ? 'capture-required'
      : 'blocked';

    if (!nonEmpty(spec.continuityId)) findings.push({ severity: 'major', code: 'registry-continuity-id-missing', assetId });
    if (!nonEmpty(spec.directionRef)) findings.push({ severity: 'major', code: 'registry-direction-ref-missing', assetId });
    if (modePlan?.mode === 'production' && !FINAL_RIGHTS.has(spec.rightsStatus)) findings.push({ severity: 'blocker', code: 'registry-rights-unresolved', assetId });
    if (spec.truthSensitive && spec.hasRealSource && !nonEmpty(spec.sourceEvidence)) findings.push({ severity: 'blocker', code: 'registry-source-evidence-missing', assetId });
    if (!REVIEW_STATES.has(reviewStatus)) findings.push({ severity: 'blocker', code: 'registry-review-status-invalid', assetId, reviewStatus });
    if (reviewStatus === 'approved' && !nonEmpty(spec.outputEvidence)) findings.push({ severity: 'blocker', code: 'registry-approved-output-evidence-missing', assetId });
    const patchAttempts = Number(spec.patchAttempts ?? 0);
    if (!Number.isInteger(patchAttempts) || patchAttempts < 0) findings.push({ severity: 'blocker', code: 'registry-patch-attempts-invalid', assetId, patchAttempts: spec.patchAttempts });

    entries.push({
      assetId,
      version,
      type: spec.type,
      purpose: spec.purpose,
      operation: spec.operation,
      status,
      adapterId: assignment?.adapterId ?? null,
      provider: assignment?.provider ?? null,
      model: assignment?.model ?? null,
      continuityId: spec.continuityId,
      directionRef: spec.directionRef,
      truthSensitive: Boolean(spec.truthSensitive),
      sourceAssetIds: spec.sourceAssetIds ?? [],
      sourceEvidence: spec.sourceEvidence ?? null,
      rightsStatus: spec.rightsStatus ?? 'unresolved',
      instructionRef: spec.instructionRef ?? null,
      dependencies: spec.dependencies ?? [],
      reviewStatus,
      outputEvidence: spec.outputEvidence ?? null,
      artifactHash: spec.artifactHash ?? null,
      cost: {
        estimated: spec.estimatedCost ?? null,
        actual: spec.actualCost ?? null,
        currency: spec.costCurrency ?? null
      },
      createdAt: spec.createdAt ?? null,
      patchAttempts
    });
  }

  return {
    stage: 'asset-registry',
    entries,
    findings,
    pass: !findings.some((finding) => ['blocker', 'major'].includes(finding.severity))
  };
}

export function buildAssetPatchPlan({ registry, findings = [], maxAttempts = 3 } = {}) {
  const outputFindings = [];
  const patchRequests = [];
  const safeMaxAttempts = Number(maxAttempts);
  if (!Number.isInteger(safeMaxAttempts) || safeMaxAttempts < 1) {
    return {
      stage: 'asset-patch',
      patchRequests,
      findings: [{ severity: 'blocker', code: 'patch-attempt-limit-invalid', maxAttempts }],
      pass: false
    };
  }
  const entryById = new Map();
  for (const entry of registry?.entries ?? []) {
    const current = entryById.get(entry.assetId);
    if (!current || Number(entry.version) > Number(current.version)) entryById.set(entry.assetId, entry);
  }

  for (const finding of findings) {
    if (finding.validated !== true || !['blocker', 'major'].includes(finding.severity)) continue;
    const assetId = String(finding.assetId ?? '').trim();
    const entry = entryById.get(assetId);
    if (!entry) {
      outputFindings.push({ severity: 'blocker', code: 'patch-asset-not-found', assetId });
      continue;
    }
    if (entry.patchAttempts >= safeMaxAttempts) {
      outputFindings.push({ severity: 'blocker', code: 'patch-attempt-limit', assetId, attempts: entry.patchAttempts });
      continue;
    }
    if (entry.status === 'capture-required') {
      outputFindings.push({ severity: 'major', code: 'patch-cannot-replace-required-capture', assetId });
      continue;
    }
    if (entry.status === 'blocked') {
      outputFindings.push({ severity: 'major', code: 'patch-asset-not-actionable', assetId });
      continue;
    }
    patchRequests.push({
      assetId,
      fromVersion: entry.version,
      targetVersion: entry.version + 1,
      requestedChange: finding.requestedChange ?? finding.code,
      preserve: {
        continuityId: entry.continuityId,
        directionRef: entry.directionRef,
        truthSensitive: entry.truthSensitive,
        sourceAssetIds: entry.sourceAssetIds
      },
      nextPatchAttempts: entry.patchAttempts + 1,
      integrationReviewRequired: true
    });
  }

  return {
    stage: 'asset-patch',
    patchRequests,
    findings: outputFindings,
    pass: !outputFindings.some((finding) => ['blocker', 'major'].includes(finding.severity))
  };
}
