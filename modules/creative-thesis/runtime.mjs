function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function sourceEntries(prefix, values = []) {
  return cleanList(values).map((value, index) => ({ id: `${prefix}-${index + 1}`, value }));
}

function inspirationAntiReferences(inspiration = {}) {
  return cleanList(inspiration?.lanes?.antiReferences ?? inspiration?.antiReferences ?? []);
}

function opportunityGaps(inspiration = {}) {
  return cleanList(inspiration?.opportunityGaps ?? []);
}

function unresolvedUnknowns(inspiration = {}) {
  return cleanList(inspiration?.unresolvedUnknowns ?? []);
}

function normalizeAudience(audience) {
  if (typeof audience === 'string') return clean(audience) || null;
  if (!audience || typeof audience !== 'object' || Array.isArray(audience)) return null;
  const label = clean(audience.label ?? audience.primary ?? audience.name);
  return label || null;
}

function authoredText(candidate, key, fallback = '') {
  const value = candidate?.[key];
  if (typeof value === 'string') return clean(value) || fallback;
  if (value && typeof value === 'object') return clean(value.statement ?? value.label ?? value.value) || fallback;
  return fallback;
}

function authoredExpressionTests(candidate, defaults) {
  const authored = candidate?.expressionTests;
  if (!authored || typeof authored !== 'object' || Array.isArray(authored)) return defaults;
  return { ...defaults, ...Object.fromEntries(Object.entries(authored).filter(([, value]) => clean(value))) };
}

export function reviewCreativeThesis(thesis = {}) {
  const findings = [];
  const truths = Array.isArray(thesis.sourceTruths) ? thesis.sourceTruths : [];
  const rejections = Array.isArray(thesis.categoryRejections) ? thesis.categoryRejections : [];
  const principles = Array.isArray(thesis.principles) ? thesis.principles : [];
  const expressionTests = thesis.expressionTests && typeof thesis.expressionTests === 'object'
    ? thesis.expressionTests
    : {};

  if (!clean(thesis.intent)) findings.push(finding('blocker', 'creative-thesis-intent-missing', 'Creative Thesis requires a project intent/problem statement.'));
  if (!truths.length) findings.push(finding('blocker', 'creative-thesis-truth-anchor-missing', 'Creative Thesis requires at least one real business/product truth.'));
  if (!clean(thesis.governingIdea?.statement)) findings.push(finding('blocker', 'creative-thesis-governing-idea-missing', 'Creative Thesis requires one governing creative idea.'));
  if (!clean(thesis.creativeTension?.label)) findings.push(finding('major', 'creative-thesis-tension-weak', 'Creative Thesis should define a useful creative tension rather than a single aesthetic trait.'));
  if (!thesis.sourceOpportunity?.id || !clean(thesis.sourceOpportunity?.value)) findings.push(finding('major', 'creative-thesis-opportunity-gap-missing', 'Creative Thesis should be anchored to a documented opportunity gap.'));
  if (rejections.length < 2) findings.push(finding('major', 'creative-thesis-anti-generic-evidence-thin', 'Creative Thesis needs at least two explicit category defaults or anti-principles to reject.'));
  if (principles.length < 3) findings.push(finding('major', 'creative-thesis-principles-thin', 'Creative Thesis needs enough principles to guide downstream art direction decisions.'));

  for (const lane of ['typography', 'image', 'motion', 'interaction', 'responsive']) {
    if (!clean(expressionTests[lane])) findings.push(finding('major', 'creative-thesis-expression-test-missing', `Creative Thesis is missing the ${lane} expression test.`, { lane }));
  }

  if (!clean(thesis.technologyPolicy) || !/serve|serves|service|tool/i.test(thesis.technologyPolicy)) {
    findings.push(finding('major', 'creative-thesis-technology-policy-missing', 'Creative Thesis must state that implementation technology serves the idea rather than defining it.'));
  }

  if (!clean(thesis.competitorTransferTest?.question) || !clean(thesis.competitorTransferTest?.passCondition)) {
    findings.push(finding('major', 'creative-thesis-transfer-test-missing', 'Creative Thesis requires an explicit competitor-transfer test for ownability.'));
  }

  const genericTechTerms = /\b(three\.?js|webgl|webgpu|gsap|rive|blender|houdini|shader|scrolltrigger)\b/i;
  if (genericTechTerms.test(clean(thesis.governingIdea?.statement))) {
    findings.push(finding('blocker', 'creative-thesis-technology-became-concept', 'The governing idea is expressed as an implementation technology rather than a creative idea.'));
  }

  if (thesis.authorship?.mode === 'deterministic-scaffold') {
    findings.push(finding('major', 'creative-thesis-authored-judgment-required', 'The deterministic thesis scaffold is structurally useful but cannot substitute for authored creative judgment. An art-direction agent or human must author/select the governing idea before it becomes review-ready.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  const status = blockers.length
    ? 'blocked'
    : majors.length
      ? 'provisional'
      : 'ready-for-creative-direction-review';

  return {
    stage: 'creative-thesis-review',
    status,
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    findings,
    truth: {
      humanCreativeApproval: false,
      creativeThesisFrozen: false,
      structuralReviewOnly: true
    }
  };
}

export function buildCreativeThesis({
  projectId,
  intent,
  businessTruths = [],
  inspiration = {},
  traits = [],
  antiPrinciples = [],
  audience,
  commercialObjective,
  authoredCandidate = null
} = {}) {
  const normalizedIntent = clean(intent);
  const truths = sourceEntries('truth', businessTruths);
  const normalizedTraits = cleanList(traits);
  const gaps = opportunityGaps(inspiration);
  const antiReferences = inspirationAntiReferences(inspiration);
  const explicitAntiPrinciples = cleanList(antiPrinciples);
  const authoredAntiPrinciples = cleanList(authoredCandidate?.antiPrinciples ?? authoredCandidate?.categoryRejections ?? []);
  const categoryRejections = [...new Set([...explicitAntiPrinciples, ...antiReferences, ...authoredAntiPrinciples])];
  const unresolved = unresolvedUnknowns(inspiration);
  const primaryAudience = normalizeAudience(authoredCandidate?.audience ?? audience);
  const objective = clean(authoredCandidate?.commercialObjective ?? commercialObjective) || null;
  const sourceOpportunity = gaps.length ? { id: 'opportunity-1', value: gaps[0] } : null;
  const tensionTraits = normalizedTraits.slice(0, 2);
  const fallbackTension = tensionTraits.length >= 2
    ? `${tensionTraits[0]} × ${tensionTraits[1]}`
    : tensionTraits[0] || '';
  const truthAnchor = truths[0]?.value ?? '';

  const scaffoldIdea = sourceOpportunity
    ? `Make “${sourceOpportunity.value}” the organizing experience idea, not a decorative layer.`
    : normalizedIntent
      ? 'Make the project-specific truth in the brief the organizing experience idea rather than defaulting to category aesthetics.'
      : '';
  const governingIdeaStatement = authoredText(authoredCandidate, 'governingIdea', scaffoldIdea);
  const tensionLabel = authoredText(authoredCandidate, 'creativeTension', fallbackTension);
  const authoredStatement = clean(authoredCandidate?.statement);

  const statementParts = [governingIdeaStatement];
  if (tensionLabel) statementParts.push(`Creative tension: ${tensionLabel}.`);
  if (truthAnchor) statementParts.push(`Truth anchor: ${truthAnchor}`);
  const statement = authoredStatement || statementParts.filter(Boolean).join(' ');

  const defaultExpressionTests = {
    typography: sourceOpportunity ? `Typography should make “${sourceOpportunity.value}” feel structurally present through hierarchy, pacing, and composition—not through a pasted decorative font style.` : 'Typography must express the governing idea through hierarchy, pacing, and composition rather than trend mimicry.',
    image: 'Imagery must either provide truthful project evidence or extend the governing idea without fabricating documentary truth.',
    motion: 'Motion must show a meaningful state, relationship, sequence, or material behavior implied by the governing idea; decorative motion alone does not pass.',
    interaction: 'Interaction must reinforce how the governing idea behaves when a person explores, chooses, compares, reveals, or navigates.',
    sound: 'Sound is optional. If used, it must reinforce rhythm, material, environment, or narrative state; silence is preferable to ornamental audio.',
    responsive: 'Mobile and reduced-motion variants must preserve the governing idea even when spatial, pointer, or cinematic behaviors are removed.'
  };

  const authoredPrinciples = cleanList(authoredCandidate?.principles ?? []);
  const fallbackPrinciples = [
    sourceOpportunity ? `Turn the opportunity “${sourceOpportunity.value}” into an experience rule that can affect more than layout.` : '',
    tensionLabel ? `Use ${tensionLabel} as a decision tension; do not average the two sides into a neutral middle.` : '',
    truths.length ? 'Every expressive decision must remain compatible with the recorded business/product truths.' : '',
    'Prefer one memorable governing idea over a pile of fashionable treatments.',
    'Let each medium express the same thesis differently rather than repeating one visual motif everywhere.'
  ].filter(Boolean);

  const technologyPolicy = clean(authoredCandidate?.technologyPolicy)
    || 'Implementation tools serve the governing idea. WebGL, Three.js, GSAP, Rive, 3D, video, AI generation, and other capabilities are selected only when they materially improve that idea.';

  const thesis = {
    schema: 'ai-studio-os/creative-thesis@1',
    stage: 'creative-thesis',
    projectId: clean(projectId) || null,
    intent: normalizedIntent,
    audience: primaryAudience,
    commercialObjective: objective,
    authorship: {
      mode: authoredCandidate ? 'authored-candidate' : 'deterministic-scaffold',
      supplied: Boolean(authoredCandidate),
      humanCreativeApproval: false
    },
    governingIdea: {
      statement: governingIdeaStatement,
      singular: true,
      sourceOpportunityId: sourceOpportunity?.id ?? null
    },
    statement,
    creativeTension: {
      label: tensionLabel,
      traits: tensionTraits
    },
    whyThisProject: clean(authoredCandidate?.whyThisProject) || (truths.length
      ? `The idea is constrained by ${truths.length} recorded project truth${truths.length === 1 ? '' : 's'} and the documented opportunity gap; it is not licensed by category convention alone.`
      : ''),
    sourceTruths: truths,
    sourceOpportunity,
    categoryRejections,
    principles: authoredPrinciples.length ? authoredPrinciples : fallbackPrinciples,
    antiPrinciples: categoryRejections,
    expressionTests: authoredExpressionTests(authoredCandidate, defaultExpressionTests),
    technologyPolicy,
    competitorTransferTest: {
      question: clean(authoredCandidate?.competitorTransferTest?.question) || 'Could a direct competitor reuse this thesis unchanged without losing the project truth that makes it meaningful?',
      passCondition: clean(authoredCandidate?.competitorTransferTest?.passCondition) || 'A strong thesis should fail unchanged transfer: removing its source truths or opportunity gap should materially weaken or alter the idea.',
      evidenceRefs: [
        ...truths.slice(0, 3).map((item) => item.id),
        ...(sourceOpportunity ? [sourceOpportunity.id] : [])
      ]
    },
    alternativesConsidered: Array.isArray(authoredCandidate?.alternativesConsidered)
      ? authoredCandidate.alternativesConsidered.map((item) => ({
        idea: clean(item?.idea ?? item?.statement),
        rejectedBecause: clean(item?.rejectedBecause ?? item?.reason)
      })).filter((item) => item.idea)
      : [],
    selectionRationale: clean(authoredCandidate?.selectionRationale) || null,
    unresolvedRisks: [
      ...unresolved,
      ...(!primaryAudience ? ['primary audience not explicitly supplied to Creative Thesis'] : []),
      ...(!objective ? ['commercial objective not explicitly supplied to Creative Thesis'] : []),
      ...(inspiration?.evidenceReady === false ? ['inspiration reference evidence is not yet complete'] : [])
    ],
    truth: {
      humanCreativeApproval: false,
      creativeThesisFrozen: false,
      generatedFromSuppliedTruthAndInspiration: true,
      authoredCandidateSupplied: Boolean(authoredCandidate)
    }
  };

  const review = reviewCreativeThesis(thesis);
  return {
    ...thesis,
    status: review.status,
    pass: review.pass,
    reviewReady: review.reviewReady,
    findings: review.findings,
    review
  };
}
