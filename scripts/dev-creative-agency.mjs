import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];
let stopping = false;

function launch(command, args, label) {
  const child = spawn(command, args, { cwd: root, shell: false, stdio: 'inherit', windowsHide: false });
  children.push(child);
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

launch(process.execPath, ['apps/creative-agency/execution-server.mjs'], 'execution runtime');
launch(npm, ['run', 'dev:web'], 'Vite');

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
