function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map((value)=>clean(value)).filter(Boolean))];
}

function objectOrEmpty(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? structuredClone(value) : {};
}

function normalizeCategoryMap(value = {}) {
  const result = {};
  for (const role of ['display','body','utility']) {
    const categories = cleanList(value?.[role] ?? []).map((item)=>item.toLowerCase());
    if (categories.length) result[role] = categories;
  }
  return result;
}

function normalizeDescriptorTargets(value = {}) {
  const output = {};
  for (const role of ['display','body','utility']) {
    const roleTargets = value?.[role];
    if (!roleTargets || typeof roleTargets !== 'object' || Array.isArray(roleTargets)) continue;
    const normalized = {};
    for (const [descriptor, target] of Object.entries(roleTargets)) {
      if (Number.isFinite(target)) normalized[descriptor] = { target:Number(target), tolerance:20 };
      else if (target && typeof target === 'object' && Number.isFinite(target.target)) {
        normalized[descriptor] = {
          target:Number(target.target),
          tolerance:Number.isFinite(target.tolerance) ? Math.max(1, Math.min(100, Number(target.tolerance))) : 20
        };
      }
    }
    if (Object.keys(normalized).length) output[role] = normalized;
  }
  return output;
}

function normalizePressureOverrides(value = {}) {
  const output = {};
  for (const key of ['trust','expression','readingDensity','warmth','technicality','formality','accessibility','distinctiveness']) {
    if (Number.isFinite(value?.[key])) output[key] = Math.max(0, Math.min(100, Number(value[key])));
  }
  return output;
}

function evaluateCreativeWorld(world, findings) {
  if (!world) return { supplied:false, authoritative:false, id:null, intent:{} };
  const id = clean(world.id ?? world.worldId);
  const schema = clean(world.schema);
  const schemaSupported = !schema || schema === 'ai-studio-os/creative-world@1';
  const reviewReady = world.reviewReady === true;
  const selected = world.selected === true;
  const authoritative = Boolean(id && schemaSupported && reviewReady && selected);

  if (schema && !schemaSupported) {
    findings.push({ severity:'blocker', code:'typography-intent-creative-world-schema-unsupported', schema });
  } else if (!authoritative) {
    findings.push({
      severity:'minor',
      code:'typography-intent-creative-world-not-authoritative',
      id:id || null,
      reviewReady,
      selected,
      reason:!id ? 'world-id-missing' : !reviewReady ? 'world-not-review-ready' : !selected ? 'world-not-selected' : 'world-not-authoritative'
    });
  }

  return {
    supplied:true,
    authoritative,
    id:id || null,
    schema:schema || null,
    reviewReady,
    selected,
    intent:authoritative ? objectOrEmpty(world.typographyIntent ?? world.typography) : {}
  };
}

export function buildTypographyIntent({ creativeThesis = null, creativeWorld = null, explicit = null } = {}) {
  const thesis = creativeThesis && typeof creativeThesis === 'object' && !Array.isArray(creativeThesis) ? creativeThesis : null;
  const world = creativeWorld && typeof creativeWorld === 'object' && !Array.isArray(creativeWorld) ? creativeWorld : null;
  const authored = explicit && typeof explicit === 'object' && !Array.isArray(explicit) ? explicit : {};

  const thesisSupplied = Boolean(thesis);
  const findings = [];
  if (thesisSupplied && thesis.schema !== 'ai-studio-os/creative-thesis@1') {
    findings.push({ severity:'blocker', code:'typography-intent-creative-thesis-schema-unsupported' });
  }
  if (thesisSupplied && thesis.reviewReady !== true) {
    findings.push({ severity:'blocker', code:'typography-intent-creative-thesis-not-review-ready', status:thesis.status ?? null });
  }

  const worldState = evaluateCreativeWorld(world, findings);
  const worldIntent = worldState.intent;
  const statement = clean(
    authored.statement
    ?? worldIntent.statement
    ?? thesis?.expressionTests?.typography
  );
  const governingIdea = clean(thesis?.governingIdea?.statement);
  const creativeTension = clean(thesis?.creativeTension?.label);
  const antiPatterns = cleanList([
    ...(thesis?.categoryRejections ?? []),
    ...(thesis?.antiPrinciples ?? []),
    ...(worldIntent.antiPatterns ?? worldIntent.avoid ?? []),
    ...(authored.antiPatterns ?? authored.avoid ?? [])
  ]);
  const roleDirectives = {
    ...objectOrEmpty(worldIntent.roles),
    ...objectOrEmpty(authored.roles)
  };
  const preferredCategories = normalizeCategoryMap({
    ...objectOrEmpty(worldIntent.preferredCategories),
    ...objectOrEmpty(authored.preferredCategories)
  });
  const avoidCategories = cleanList([
    ...(worldIntent.avoidCategories ?? []),
    ...(authored.avoidCategories ?? [])
  ]).map((value)=>value.toLowerCase());
  const descriptorTargets = normalizeDescriptorTargets({
    ...objectOrEmpty(worldIntent.descriptorTargets),
    ...objectOrEmpty(authored.descriptorTargets)
  });
  const pressureOverrides = normalizePressureOverrides({
    ...objectOrEmpty(worldIntent.pressures),
    ...objectOrEmpty(authored.pressures)
  });

  const enabled = Boolean(thesis || worldState.authoritative || statement || Object.keys(roleDirectives).length || Object.keys(descriptorTargets).length);
  const authority = worldState.authoritative && Object.keys(worldIntent).length
    ? 'selected-creative-world'
    : thesis
      ? 'creative-thesis'
      : Object.keys(authored).length
        ? 'explicit-typography-intent'
        : 'business-constraints-only';

  return {
    stage:'typography-intent',
    schema:'ai-studio-os/typography-intent@1',
    enabled,
    authority,
    statement:statement || null,
    governingIdea:governingIdea || null,
    creativeTension:creativeTension || null,
    antiPatterns,
    roleDirectives,
    preferredCategories,
    avoidCategories,
    descriptorTargets,
    pressureOverrides,
    provenance:{
      creativeThesisSchema:thesis?.schema ?? null,
      creativeThesisStatus:thesis?.status ?? null,
      creativeThesisReviewReady:thesis?.reviewReady ?? null,
      creativeWorldId:worldState.id,
      creativeWorldSchema:worldState.schema,
      creativeWorldReviewReady:worldState.reviewReady ?? null,
      creativeWorldSelected:worldState.selected ?? null,
      creativeWorldAuthoritative:worldState.authoritative
    },
    findings,
    pass:!findings.some((item)=>item.severity === 'blocker')
  };
}
