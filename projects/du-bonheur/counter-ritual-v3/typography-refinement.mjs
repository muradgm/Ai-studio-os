import fs from 'node:fs';

import { buildConversationTypographyExploration } from './runtime.mjs';

const refinement = JSON.parse(fs.readFileSync(new URL('./typography-finalist-refinement.json', import.meta.url)));

function pairKey(display, body) {
  return `${String(display).toLowerCase()}::${String(body).toLowerCase()}`;
}

function summarizeSystem(system) {
  return {
    display: system.display?.font?.family ?? null,
    body: system.body?.font?.family ?? null,
    utility: system.utility?.font?.family ?? null,
    systemScore: system.systemCritique?.score ?? null,
    pairingScore: system.pairing?.score ?? null,
    pairingEvidenceLevel: system.pairing?.evidenceLevel ?? null,
    findings: system.systemCritique?.findings ?? []
  };
}

export function buildConversationTypographyRefinement() {
  const exploration = buildConversationTypographyExploration();
  const findings = [];

  if (!exploration.pass) {
    findings.push({ severity:'blocker', code:'conversation-refinement-exploration-not-ready', details:exploration.findings });
  }
  if (exploration.truth?.typographySystemSelected === true || exploration.truth?.typographyApproved === true) {
    findings.push({ severity:'blocker', code:'conversation-refinement-upstream-approval-fabricated' });
  }
  if (refinement.truth?.humanTypographyWinnerSelected === true || refinement.truth?.typographyApproved === true) {
    findings.push({ severity:'blocker', code:'conversation-refinement-human-selection-fabricated' });
  }

  const available = new Map((exploration.systems ?? []).map((system) => [pairKey(system.display?.font?.family, system.body?.font?.family), system]));
  const finalists = refinement.finalists.map((candidate) => {
    const system = available.get(pairKey(candidate.display, candidate.body)) ?? null;
    if (!system) {
      findings.push({ severity:'blocker', code:'conversation-refinement-finalist-missing', finalistId:candidate.id, display:candidate.display, body:candidate.body });
    }
    if (system && system.utility?.font?.family !== candidate.utility) {
      findings.push({ severity:'blocker', code:'conversation-refinement-utility-drift', finalistId:candidate.id, expected:candidate.utility, actual:system.utility?.font?.family ?? null });
    }
    return {
      ...structuredClone(candidate),
      sourceSystem: system,
      sourceSummary: system ? summarizeSystem(system) : null
    };
  });

  const distinctDisplays = new Set(finalists.map((item) => item.display));
  const distinctBodies = new Set(finalists.map((item) => item.body));
  if (finalists.length !== 2 || distinctDisplays.size !== 2 || distinctBodies.size !== 2) {
    findings.push({ severity:'blocker', code:'conversation-refinement-finalist-diversity-invalid' });
  }

  for (const language of refinement.languageStress ?? []) {
    if (!['en','de','fr'].includes(language.lang)) findings.push({ severity:'blocker', code:'conversation-refinement-language-invalid', language });
    if (!language.prompt || !language.response || !language.utility) findings.push({ severity:'blocker', code:'conversation-refinement-language-copy-incomplete', language:language.id });
  }

  const blockers = findings.filter((finding) => finding.severity === 'blocker');
  return {
    schema:'ai-studio-os/conversation-typography-refinement@1',
    stage:'counter-ritual-conversation-typography-finalists',
    status:blockers.length ? 'blocked' : 'two-finalists-awaiting-human-art-direction-review',
    pass:blockers.length === 0,
    experienceThesis:'counter-ritual',
    artDirectionHypothesis:'the-conversation',
    upstream:{
      status:exploration.status,
      selectedCreativeWorld:exploration.selectedCreativeWorld?.id ?? null,
      typographyAuthority:exploration.typographyIntent?.authority ?? null,
      canonicalSelection:exploration.typographyRuntime?.selection ?? null
    },
    finalists,
    languageStress:structuredClone(refinement.languageStress ?? []),
    nomenclatureSpecimens:structuredClone(refinement.nomenclatureSpecimens ?? []),
    reviewLenses:structuredClone(refinement.reviewLenses ?? []),
    evidencePolicy:structuredClone(refinement.evidencePolicy ?? {}),
    findings,
    truth:{
      twoFinalistsAdvanced:blockers.length === 0,
      humanTypographyWinnerSelected:false,
      typographyApproved:false,
      artDirectionApproved:false,
      canonicalTypographyConsumptionProduced:false,
      productionReady:false
    }
  };
}

export { refinement as conversationTypographyRefinementSpec };
