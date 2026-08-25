import { authoredCandidateFromDeliberation } from './intelligence.mjs';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function finding(severity, code, message, evidence = {}) {
  return { severity, code, message, evidence };
}

export function reviewCreativeThesisAuthority({ deliberation, thesis } = {}) {
  const findings = [];

  if (deliberation?.schema !== 'ai-studio-os/creative-thesis-deliberation@1') {
    findings.push(finding('blocker', 'creative-thesis-authority-deliberation-schema-invalid', 'Canonical Creative Thesis authority requires the Creative Thesis deliberation contract.'));
  }
  if (deliberation?.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-thesis-authority-deliberation-not-ready', 'Canonical Creative Thesis authority requires a review-ready deliberation.'));
  }
  if (thesis?.schema !== 'ai-studio-os/creative-thesis@1') {
    findings.push(finding('blocker', 'creative-thesis-authority-thesis-schema-invalid', 'Canonical Creative Thesis authority requires creative-thesis@1.'));
  }
  if (thesis?.reviewReady !== true) {
    findings.push(finding('blocker', 'creative-thesis-authority-thesis-not-ready', 'Canonical Creative Thesis authority requires a review-ready thesis.'));
  }

  const candidate = authoredCandidateFromDeliberation(deliberation);
  if (!candidate) {
    findings.push(finding('blocker', 'creative-thesis-authority-candidate-unavailable', 'The deliberation must produce a traceable authored thesis candidate.'));
  } else {
    if (clean(thesis?.governingIdea) !== clean(candidate.governingIdea)) {
      findings.push(finding('blocker', 'creative-thesis-authority-governing-idea-drift', 'The authoritative thesis governing idea does not match the deliberation-authored candidate.', {
        expected: candidate.governingIdea,
        actual: thesis?.governingIdea ?? null
      }));
    }
    if (clean(thesis?.creativeTension) !== clean(candidate.creativeTension)) {
      findings.push(finding('blocker', 'creative-thesis-authority-tension-drift', 'The authoritative thesis creative tension does not match the deliberation-authored candidate.', {
        expected: candidate.creativeTension,
        actual: thesis?.creativeTension ?? null
      }));
    }
  }

  if (deliberation?.projectId && thesis?.projectId && deliberation.projectId !== thesis.projectId) {
    findings.push(finding('blocker', 'creative-thesis-authority-project-drift', 'Deliberation and thesis belong to different projects.', {
      deliberationProjectId: deliberation.projectId,
      thesisProjectId: thesis.projectId
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
      projectId: thesis.projectId ?? deliberation.projectId ?? null,
      governingIdea: thesis.governingIdea,
      creativeTension: thesis.creativeTension,
      deliberationSchema: deliberation.schema,
      thesisSchema: thesis.schema,
      humanApproved: true
    },
    truth: {
      deliberationCanSelfApprove: false,
      humanCreativeApprovalRequired: true,
      arbitraryThesisObjectAccepted: false
    }
  };
}
