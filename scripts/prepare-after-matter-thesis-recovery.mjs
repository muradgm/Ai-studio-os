import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAfterMatterThesisRecovery } from '../benchmarks/011-creative-motion-capability-dogfood/canonical-authority-recovery/thesis-recovery.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const benchmarkRoot = path.join(root, 'benchmarks', '011-creative-motion-capability-dogfood');
const brief = JSON.parse(await fs.readFile(path.join(benchmarkRoot, 'runs', 'after-matter-phase0', 'dogfood-brief.json'), 'utf8'));
const packet = buildAfterMatterThesisRecovery(brief);
const outputPath = path.join(benchmarkRoot, 'canonical-authority-recovery', 'creative-thesis-review-packet.json');

if (packet.deliberation.reviewReady !== true || packet.proposedCreativeThesis.reviewReady !== true || packet.truth.humanCreativeApproval !== false) {
  throw new Error('After Matter Thesis recovery packet did not remain structurally review-ready and awaiting explicit human approval.');
}

await fs.writeFile(outputPath, `${JSON.stringify(packet, null, 2)}\n`);
console.log(JSON.stringify({ status: packet.status, outputPath: path.relative(root, outputPath).split(path.sep).join('/'), thesisFingerprint: packet.proposedCreativeThesisFingerprint, humanCreativeApproval: packet.truth.humanCreativeApproval, geminiGenerationUsed: packet.truth.geminiGenerationUsed }, null, 2));
