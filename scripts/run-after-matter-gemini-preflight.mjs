import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fingerprintCreativeValue } from '../modules/creative-intelligence-foundation/fingerprint.mjs';
import { buildGeminiMotionDogfoodBudget, createGeminiMotionDogfoodRunner } from '../modules/creative-motion-capability-dogfood/gemini-runner.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const briefPath = path.join(repoRoot, 'benchmarks', '011-creative-motion-capability-dogfood', 'runs', 'after-matter-phase0', 'dogfood-brief.json');
const model = String(process.env.GEMINI_FREE_MODEL ?? '').trim();
const brief = JSON.parse(await fs.readFile(briefPath, 'utf8'));

if (!process.env.GEMINI_API_KEY || !model) {
  throw new Error('GEMINI_API_KEY and GEMINI_FREE_MODEL are required. This command makes one live, unscored Gemini prototype request.');
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputRoot = path.join(repoRoot, 'artifacts', 'creative-motion-capability-dogfood', 'after-matter', 'gemini-preflight', timestamp);
const evidencePath = path.join(outputRoot, 'run.json');
const evidenceRef = path.relative(repoRoot, evidencePath).split(path.sep).join('/');
const traceRef = `artifact://${evidenceRef}#trace`;
const budget = buildGeminiMotionDogfoodBudget(model);

const instruction = [
  'This is an unscored prototype transport preflight for AI Studio OS, not a production direction.',
  'Return exactly one JSON object with a `hypotheses` array of three motion hypotheses.',
  'Each hypothesis needs `id`, `title`, `premise`, `motionBehavior`, `stillness`, `mobile`, `reducedMotion`, and `antiPatterns` fields.',
  'Use the following frozen brief. Do not claim browser proof, approval, production readiness, or creative authority.',
  JSON.stringify(brief)
].join('\n\n');

const runner = createGeminiMotionDogfoodRunner();
const result = await runner.runPrototype({
  trial: {
    trialId: `unscored-preflight-e-${timestamp}`,
    conditionId: 'E',
    projectId: brief.projectId,
    briefFingerprint: fingerprintCreativeValue(brief),
    runtimeTraceRef: traceRef,
    generationBudget: budget
  },
  generationInstruction: instruction,
  architectureDeclaration: {
    schema: 'ai-studio-os/direct-model-motion-control@1',
    operatorAttested: true,
    isolationEvidenceRef: evidenceRef,
    truth: {
      directModelCreativeGeneration: true,
      aiStudioKnowledgeUsed: false,
      aiStudioTransferUsed: false,
      aiStudioSynthesisUsed: false,
      aiStudioMotionV2Used: false,
      v1ContractValidationAndProofOnly: false
    }
  },
  runtimeEvidenceRef: evidenceRef
});

await fs.mkdir(outputRoot, { recursive: true });
await fs.writeFile(evidencePath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ status: result.status, evidenceRef, findingCodes: result.findings.map((item) => item.code), prototypeOnly: result.truth.prototypeOnly, reviewReady: result.truth.reviewReady }, null, 2));
if (result.status !== 'produced') process.exitCode = 1;
