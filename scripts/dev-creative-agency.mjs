import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createViteInvocation } from '../lib/local-vite.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const children = [];
let stopping = false;

export function createDevProcessSpecs() {
  const vite = createViteInvocation({
    repoRoot: root,
    mode: 'dev',
    appRoot: 'apps/creative-agency',
    host: '0.0.0.0'
  });

  return [
    {
      label: 'execution runtime',
      command: process.execPath,
      args: ['apps/creative-agency/execution-server.mjs']
    },
    {
      label: 'Vite',
      command: vite.executable,
      args: [...vite.args]
    }
  ];
}

function launch(command, args, label) {
  const child = spawn(command, args, { cwd: root, shell: false, stdio: 'inherit', windowsHide: false });
  children.push(child);
  child.on('error', (error) => {
    if (stopping) return;
    console.error(`${label} failed to start: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    if (stopping) return;
    if (code && code !== 0) console.error(`${label} exited with code ${code}${signal ? ` (${signal})` : ''}`);
    stop(code ?? 0);
  });
  return child;
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 180).unref();
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  for (const spec of createDevProcessSpecs()) launch(spec.command, spec.args, spec.label);
  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));
}
