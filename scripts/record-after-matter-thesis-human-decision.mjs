import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCreativeThesisHumanDecision, reviewCreativeThesisAuthority } from '../modules/creative-thesis/authority.mjs';
import { buildAfterMatterThesisRecovery } from '../benchmarks/011-creative-motion-capability-dogfood/canonical-authority-recovery/thesis-recovery.mjs';

const APPROVED_THESIS_FINGERPRINT = '03f2924c14696c25fd1724522a434b79a19b8f46a13f0d8447b17732d48d8ca1';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const benchmarkRoot = path.join(root, 'benchmarks', '011-creative-motion-capability-dogfood');
const recoveryRoot = path.join(benchmarkRoot, 'canonical-authority-recovery');
const brief = JSON.parse(await fs.readFile(path.join(benchmarkRoot, 'runs', 'after-matter-phase0', 'dogfood-brief.json'), 'utf8'));
const recovery = buildAfterMatterThesisRecovery(brief);

if (recovery.proposedCreativeThesisFingerprint !== APPROVED_THESIS_FINGERPRINT) {
  throw new Error('The current After Matter Thesis does not match the explicitly approved Thesis fingerprint.');
}

const decision = buildCreativeThesisHumanDecision({
  deliberation: recovery.deliberation,
  thesis: recovery.proposedCreativeThesis,
  decision: 'refine-candidate',
  sourceCandidateId: 'trace-as-evidence-system',
  rationale: 'The trace-as-evidence recommendation contained a strong project-specific principle but prematurely promoted Friction Index’s trace-navigation mechanism into Thesis authority. The human refinement preserves accumulated material change as evidence of lived time while leaving the Creative World layer free to determine how that evidence organizes the experience.',
  refinementSummary: 'Generalize the Thesis from trace-navigation into accumulated material change as evidence, preserving the later Creative World decision about how that evidence organizes the experience.',
  humanConfirmed: true,
  decidedAt: '2026-08-31T13:35:27Z',
  evidenceRef: 'artifact://benchmarks/011-creative-motion-capability-dogfood/canonical-authority-recovery/human-thesis-decision.json'
});
const authority = reviewCreativeThesisAuthority({ deliberation: recovery.deliberation, thesis: recovery.proposedCreativeThesis, humanDecision: decision });

if (!authority.reviewReady) throw new Error(`The recorded After Matter human decision did not establish Thesis authority: ${authority.findings.map((item) => item.code).join(', ')}`);

const outputPath = path.join(recoveryRoot, 'human-thesis-decision.json');
await fs.writeFile(outputPath, `${JSON.stringify({ ...decision, provenance: { kind: 'explicit-operator-supplied-human-creative-decision', cryptographicallyAuthenticatedHumanIdentity: false, sourceStatement: 'I approve the After Matter Creative Thesis at fingerprint 03f2924c14696c25fd1724522a434b79a19b8f46a13f0d8447b17732d48d8ca1' } }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath: path.relative(root, outputPath).split(path.sep).join('/'), decisionFingerprint: decision.decisionFingerprint, approvedThesisFingerprint: decision.approvedThesisFingerprint, status: authority.status }, null, 2));
