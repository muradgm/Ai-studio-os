#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTraderFrameIconProductionProof } from '../projects/traderframe/icon-production-proof-v1/runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'artifacts/traderframe/icon-production-proof-v1');

const result = await runTraderFrameIconProductionProof({ repoRoot:root, outputDir });
const summary = {
  stage:result.stage,
  status:result.status,
  pass:result.pass,
  projectId:'traderframe',
  iconDna:{ id:result.iconDna.id, status:result.iconDna.status },
  icons:result.counts.icons,
  files:result.counts.files,
  outputDir:result.outputDir,
  review:{
    status:result.familyReview.status,
    approval:result.familyReview.approval,
    blockers:result.familyReview.findings.filter((item) => String(item.severity).toLowerCase() === 'blocker').length
  },
  artifactGraph:{ pass:result.graph.pass, nodes:result.graph.counts?.artifacts ?? result.artifacts.length }
};

console.log(JSON.stringify(summary, null, 2));
if (!result.pass) process.exitCode = 1;
