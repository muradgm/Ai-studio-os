import fs from 'node:fs';
import path from 'node:path';

export function resolveLocalViteCli(repoRoot) {
  if (!repoRoot) throw new Error('repoRoot is required');
  const cli = path.join(path.resolve(repoRoot), 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(cli)) {
    throw new Error(`Local Vite CLI not found at ${cli}. Run npm install first.`);
  }
  return cli;
}

export function createViteInvocation({
  repoRoot,
  mode = 'dev',
  appRoot,
  host = '0.0.0.0',
  outDir = null,
  emptyOutDir = true
} = {}) {
  if (!appRoot) throw new Error('appRoot is required');
  if (!['dev', 'build'].includes(mode)) throw new Error(`Unsupported Vite mode: ${mode}`);

  const args = [resolveLocalViteCli(repoRoot)];
  if (mode === 'build') args.push('build');
  args.push(appRoot);

  if (mode === 'dev') {
    args.push('--host', host);
  } else {
    if (outDir) args.push('--outDir', outDir);
    if (emptyOutDir) args.push('--emptyOutDir');
  }

  return Object.freeze({
    executable: process.execPath,
    args: Object.freeze(args),
    shell: false
  });
}
