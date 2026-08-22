import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.resolve(here, '../../scripts/logo-integrity-inspect.mjs');

export function inspectLogoArtifacts({ canonicalSvg, candidateSvg, specJson, sizes = [16,32,64,128] } = {}) {
  if (!canonicalSvg || !candidateSvg || !specJson) {
    return { stage:'logo-artifact-integrity', status:'blocked', findings:['canonicalSvg, candidateSvg, and specJson are required'] };
  }
  const args = [script, '--canonical', path.resolve(canonicalSvg), '--candidate', path.resolve(candidateSvg), '--spec', path.resolve(specJson), '--sizes', sizes.join(',')];
  const result = spawnSync(process.execPath, args, { encoding:'utf8', maxBuffer:4 * 1024 * 1024 });
  if (result.error) return { stage:'logo-artifact-integrity', status:'blocked', findings:[`artifact inspector failed: ${result.error.message}`] };
  let parsed;
  try { parsed = JSON.parse((result.stdout || '').trim()); }
  catch { return { stage:'logo-artifact-integrity', status:'blocked', findings:[`artifact inspector returned invalid JSON: ${(result.stderr || result.stdout || '').trim()}`] }; }
  if (result.status !== 0) {
    const detail = parsed.detail ? `: ${parsed.detail}` : '';
    return { stage:'logo-artifact-integrity', status:'blocked', findings:[`${parsed.error || 'artifact inspector failed'}${detail}`], adapter:parsed };
  }
  return parsed;
}
