function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(values = []) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function normalizeHypothesis(candidate = {}, index = 0) {
  return {
    id: clean(candidate.id) || `thesis-hypothesis-${index + 1}`,
    statement: clean(candidate.statement ?? candidate.governingIdea),
    tension: clean(candidate.tension ?? candidate.creativeTension),
    truthRefs: cleanList(candidate.truthRefs),
    opportunityRefs: cleanList(candidate.opportunityRefs),
    crossDomainConnections: cleanList(candidate.crossDomainConnections),
    experientialConsequences: cleanList(candidate.experientialConsequences),
    commercialConsequences: cleanList(candidate.commercialConsequences),
    antiGenericClaims: cleanList(candidate.antiGenericClaims),
    risks: cleanList(candidate.risks),
    critique: cleanList(candidate.critique)
  };
}

function tokenSet(value) {
  return new Set(clean(value).toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
}

function conceptualOverlap(a, b) {
  const left = tokenSet(`${a.statement} ${a.tension}`);
  const right = tokenSet(`${b.statement} ${b.tension}`);
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / Math.min(left.size, right.size);
}

export function reviewCreativeThesisDeliberation(deliberation = {}) {
  const findings = [];
  const hypotheses = Array.isArray(deliberation.hypotheses) ? deliberation.hypotheses : [];
  const contradictions = cleanList(deliberation.contradictions);
  const sourceTruths = cleanList(deliberation.sourceTruths);
  const selectedId = clean(deliberation.selection?.hypothesisId);
  const selected = hypotheses.find((item) => item.id === selectedId);

  if (contradictions.length < 2) {
    findings.push(finding('major', 'creative-thesis-contradiction-mining-thin', 'Creative Thesis deliberation should expose at least two productive contradictions grounded in the project.'));
  }
  if (hypotheses.length < 3) {
    findings.push(finding('major', 'creative-thesis-hypothesis-divergence-thin', 'Creative Thesis deliberation requires at least three materially different thesis hypotheses before convergence.', { count: hypotheses.length }));
  }

  for (let i = 0; i < hypotheses.length; i += 1) {
    const hypothesis = hypotheses[i];
    if (!hypothesis.statement || !hypothesis.tension) {
      findings.push(finding('major', 'creative-thesis-hypothesis-incomplete', 'Each thesis hypothesis needs a governing statement and productive tension.', { hypothesisId: hypothesis.id }));
    }
    if (!hypothesis.truthRefs.length) {
      findings.push(finding('major', 'creative-thesis-hypothesis-ungrounded', 'Each thesis hypothesis must cite project truth.', { hypothesisId: hypothesis.id }));
    } else if (hypothesis.truthRefs.some((ref) => !sourceTruths.includes(ref))) {
      findings.push(finding('blocker', 'creative-thesis-hypothesis-truth-ref-invalid', 'A thesis hypothesis cites truth that is not present in the deliberation source truth set.', { hypothesisId: hypothesis.id, truthRefs: hypothesis.truthRefs }));
    }
    if (!hypothesis.crossDomainConnections.length) {
      findings.push(finding('major', 'creative-thesis-cross-domain-reasoning-missing', 'Each thesis hypothesis should test at least one relevant cross-domain connection or structural analogy.', { hypothesisId: hypothesis.id }));
    }
    if (!hypothesis.experientialConsequences.length) {
      findings.push(finding('major', 'creative-thesis-hypothesis-not-experiential', 'Each thesis hypothesis must state how it changes the experience, not only the visual treatment.', { hypothesisId: hypothesis.id }));
    }
    if (!hypothesis.antiGenericClaims.length) {
      findings.push(finding('major', 'creative-thesis-hypothesis-anti-generic-missing', 'Each thesis hypothesis must identify at least one category/default behavior it resists.', { hypothesisId: hypothesis.id }));
    }
    if (!hypothesis.critique.length) {
      findings.push(finding('major', 'creative-thesis-hypothesis-uncriticized', 'Each thesis hypothesis must survive explicit adversarial critique.', { hypothesisId: hypothesis.id }));
    }

    for (let j = i + 1; j < hypotheses.length; j += 1) {
      const overlap = conceptualOverlap(hypothesis, hypotheses[j]);
      if (overlap > 0.72) {
        findings.push(finding('major', 'creative-thesis-hypotheses-too-similar', 'Thesis hypotheses are lexical/conceptual variants rather than meaningfully divergent interpretations.', {
          left: hypothesis.id,
          right: hypotheses[j].id,
          overlap
        }));
      }
    }
  }

  if (!selected) {
    findings.push(finding('blocker', 'creative-thesis-deliberation-selection-missing', 'Deliberation must identify the thesis hypothesis recommended for authorship.'));
  }
  if (selected && !clean(deliberation.selection?.rationale)) {
    findings.push(finding('major', 'creative-thesis-deliberation-rationale-missing', 'The selected hypothesis requires a comparative selection rationale.'));
  }
  if (selected && !clean(deliberation.selection?.competitorTransferJudgment)) {
    findings.push(finding('major', 'creative-thesis-ownability-judgment-missing', 'The selected hypothesis requires an explicit competitor-transfer/ownability judgment.'));
  }
  if (selected && !clean(deliberation.selection?.strategicRelevanceJudgment)) {
    findings.push(finding('major', 'creative-thesis-strategic-relevance-missing', 'The selected hypothesis requires an explicit strategic relevance judgment.'));
  }
  if (selected && !clean(deliberation.selection?.experientialPotentialJudgment)) {
    findings.push(finding('major', 'creative-thesis-experiential-potential-missing', 'The selected hypothesis requires an explicit experiential potential judgment.'));
  }

  if (deliberation.synthesis?.statement) {
    const synthesisRefs = cleanList(deliberation.synthesis.sourceHypothesisIds);
    if (synthesisRefs.length < 2) {
      findings.push(finding('major', 'creative-thesis-synthesis-source-thin', 'A synthesis thesis must name at least two source hypotheses so synthesis is distinguishable from an untraceable rewrite.'));
    }
    if (synthesisRefs.some((id) => !hypotheses.some((item) => item.id === id))) {
      findings.push(finding('blocker', 'creative-thesis-synthesis-source-invalid', 'A synthesis thesis references a hypothesis that is not part of the deliberation.', { sourceHypothesisIds: synthesisRefs }));
    }
    if (!clean(deliberation.synthesis.rationale)) {
      findings.push(finding('major', 'creative-thesis-synthesis-rationale-missing', 'A synthesis thesis requires a rationale explaining what each source hypothesis contributes.'));
    }
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  const majors = findings.filter((item) => item.severity === 'major');
  return {
    schema: 'ai-studio-os/creative-thesis-deliberation-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0 && majors.length === 0,
    status: blockers.length ? 'blocked' : majors.length ? 'provisional' : 'ready-for-thesis-authorship',
    findings,
    truth: {
      structuralDeliberationReviewOnly: true,
      humanCreativeApproval: false,
      selectedHypothesisAuthoredAsThesis: false
    }
  };
}

export function buildCreativeThesisDeliberation({
  projectId,
  businessTruths = [],
  opportunityGaps = [],
  contradictions = [],
  hypotheses = [],
  selection = null,
  synthesis = null
} = {}) {
  const normalizedHypotheses = (Array.isArray(hypotheses) ? hypotheses : []).map(normalizeHypothesis);
  const deliberation = {
    schema: 'ai-studio-os/creative-thesis-deliberation@1',
    stage: 'creative-thesis-deliberation',
    projectId: clean(projectId) || null,
    sourceTruths: cleanList(businessTruths),
    sourceOpportunities: cleanList(opportunityGaps),
    contradictions: cleanList(contradictions),
    hypotheses: normalizedHypotheses,
    synthesis: synthesis && typeof synthesis === 'object' ? {
      statement: clean(synthesis.statement),
      sourceHypothesisIds: cleanList(synthesis.sourceHypothesisIds),
      rationale: clean(synthesis.rationale)
    } : null,
    selection: selection && typeof selection === 'object' ? {
      hypothesisId: clean(selection.hypothesisId),
      rationale: clean(selection.rationale),
      competitorTransferJudgment: clean(selection.competitorTransferJudgment),
      strategicRelevanceJudgment: clean(selection.strategicRelevanceJudgment),
      experientialPotentialJudgment: clean(selection.experientialPotentialJudgment)
    } : null,
    truth: {
      generatedHypothesesAreCandidatesOnly: true,
      humanCreativeApproval: false,
      thesisFrozen: false
    }
  };
  const review = reviewCreativeThesisDeliberation(deliberation);
  return { ...deliberation, review, pass: review.pass, reviewReady: review.reviewReady, status: review.status, findings: review.findings };
}

export function authoredCandidateFromDeliberation(deliberation = {}) {
  const selected = (deliberation.hypotheses ?? []).find((item) => item.id === deliberation.selection?.hypothesisId);
  if (!selected || deliberation.reviewReady !== true) return null;
  const governingIdea = clean(deliberation.synthesis?.statement) || selected.statement;
  return {
    governingIdea,
    creativeTension: selected.tension,
    selectionRationale: deliberation.selection.rationale,
    alternativesConsidered: (deliberation.hypotheses ?? [])
      .filter((item) => item.id !== selected.id)
      .map((item) => ({ idea: item.statement, rejectedBecause: item.critique.join(' ') || 'Not selected after comparative thesis deliberation.' })),
    whyThisProject: `Selected through project-grounded thesis deliberation. ${deliberation.selection.strategicRelevanceJudgment}`,
    principles: [
      ...selected.experientialConsequences,
      ...selected.commercialConsequences,
      ...selected.antiGenericClaims
    ].filter(Boolean),
    competitorTransferTest: {
      question: 'Could a direct competitor reuse this governing idea unchanged without losing the project truth that makes it meaningful?',
      passCondition: deliberation.selection.competitorTransferJudgment
    }
  };
}
