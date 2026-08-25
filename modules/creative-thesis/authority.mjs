import { authoredCandidateFromDeliberation, reviewCreativeThesisDeliberation } from './intelligence.mjs';
import { reviewCreativeThesis } from './runtime.mjs';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

function thesisGoverningIdea(thesis = {}) {
  return clean(thesis?.governingIdea?.statement ?? thesis?.governingIdea);
}

function thesisCreativeTension(thesis = {}) {
  return clean(thesis?.creativeTension?.label ?? thesis?.creativeTension);
}

export function reviewCreativeThesisAuthority({ deliberation, thesis } = {}) {
  const findings = [];

  if (deliberation?.schema !== 'ai-studio-os/creative-thesis-deliberation@1') {
    findings.push(finding('blocker', 'creative-thesis-authority-deliberation-schema-invalid', 'Canonical Creative Thesis authority requires the Creative Thesis deliberation contract.'));
  }
  const recomputedDeliberationReview = reviewCreativeThesisDeliberation(deliberation ?? {});
  if (recomputedDeliberationReview.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-thesis-authority-deliberation-not-ready', 'Canonical Creative Thesis authority requires deliberation that remains review-ready when structurally re-reviewed at the authority boundary.', {
      findingCodes: recomputedDeliberationReview.findings.map((item) => item.code)
    }));
  }

  if (thesis?.schema !== 'ai-studio-os/creative-thesis@1') {
    findings.push(finding('blocker', 'creative-thesis-authority-thesis-schema-invalid', 'Canonical Creative Thesis authority requires creative-thesis@1.'));
  }
  const recomputedThesisReview = reviewCreativeThesis(thesis ?? {});
  if (recomputedThesisReview.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-thesis-authority-thesis-not-ready', 'Canonical Creative Thesis authority requires a thesis that remains review-ready when structurally re-reviewed at the authority boundary.', {
      findingCodes: recomputedThesisReview.findings.map((item) => item.code)
    }));
  }

  const candidate = recomputedDeliberationReview.reviewReady === true
    ? authoredCandidateFromDeliberation({ ...deliberation, reviewReady: true })
    : null;
  if (!candidate) {
    findings.push(finding('blocker', 'creative-thesis-authority-candidate-unavailable', 'The re-reviewed deliberation must produce a traceable authored thesis candidate.'));
  } else {
    const actualIdea = thesisGoverningIdea(thesis);
    const actualTension = thesisCreativeTension(thesis);
    if (actualIdea !== clean(candidate.governingIdea)) {
      findings.push(finding('blocker', 'creative-thesis-authority-governing-idea-drift', 'The authoritative thesis governing idea does not match the deliberation-authored candidate.', {
        expected: candidate.governingIdea,
        actual: actualIdea || null
      }));
    }
    if (actualTension !== clean(candidate.creativeTension)) {
      findings.push(finding('blocker', 'creative-thesis-authority-tension-drift', 'The authoritative thesis creative tension does not match the deliberation-authored candidate.', {
        expected: candidate.creativeTension,
        actual: actualTension || null
      }));
    }
  }

  const deliberationProjectId = clean(deliberation?.projectId);
  const thesisProjectId = clean(thesis?.projectId);
  if (!deliberationProjectId || !thesisProjectId) {
    findings.push(finding('blocker', 'creative-thesis-authority-project-identity-missing', 'Canonical Creative Thesis authority requires both deliberation and thesis to carry explicit project identity.', {
      deliberationProjectId: deliberationProjectId || null,
      thesisProjectId: thesisProjectId || null
    }));
  } else if (deliberationProjectId !== thesisProjectId) {
    findings.push(finding('blocker', 'creative-thesis-authority-project-drift', 'Deliberation and thesis belong to different projects.', {
      deliberationProjectId,
      thesisProjectId
    }));
  }

  const humanApproved = thesis?.truth?.humanCreativeApproval === true
    || thesis?.humanCreativeApproval === true
    || thesis?.approval?.humanCreativeApproval === true;
  if (!humanApproved) {
    findings.push(finding('blocker', 'creative-thesis-authority-human-approval-missing', 'Deliberation may recommend a thesis, but canonical authority still requires explicit human creative approval.'));
  }

  const blockers = findings.filter((item) => item.severity === 'blocker');
  return {
    schema: 'ai-studio-os/creative-thesis-authority-review@1',
    pass: blockers.length === 0,
    reviewReady: blockers.length === 0,
    status: blockers.length ? 'blocked' : 'authoritative',
    findings,
    authority: blockers.length ? null : {
      kind: 'canonical-creative-thesis',
      projectId: thesisProjectId,
      governingIdea: thesisGoverningIdea(thesis),
      creativeTension: thesisCreativeTension(thesis),
      deliberationSchema: deliberation.schema,
      thesisSchema: thesis.schema,
      humanApproved: true
    },
    truth: {
      deliberationRecomputedAtAuthorityBoundary: true,
      thesisRecomputedAtAuthorityBoundary: true,
      deliberationProjectIdentityRequired: true,
      deliberationCanSelfApprove: false,
      humanCreativeApprovalRequired: true,
      arbitraryThesisObjectAccepted: false
    }
  };
}
