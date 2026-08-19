import path from 'node:path';
import { spawn } from 'node:child_process';

function assertAbsoluteLocalPath(value, label) {
  if (!value || !path.isAbsolute(value)) throw new Error(`${label} must be an absolute local path`);
  if (String(value).includes('\0')) throw new Error(`${label} contains an invalid null byte`);
  return path.normalize(value);
}

export function createBlenderJob(input = {}) {
  const sourceFile = assertAbsoluteLocalPath(input.sourceFile, 'sourceFile');
  const scriptFile = assertAbsoluteLocalPath(input.scriptFile, 'scriptFile');
  const outputDir = assertAbsoluteLocalPath(input.outputDir, 'outputDir');
  if (path.extname(sourceFile).toLowerCase() !== '.blend') throw new Error('sourceFile must be a .blend file');
  if (path.extname(scriptFile).toLowerCase() !== '.py') throw new Error('scriptFile must be a .py file');

  return {
    id: input.id ?? `blender-${Date.now()}`,
    command: input.command ?? 'blender',
    sourceFile,
    scriptFile,
    outputDir,
    format: input.format ?? 'glb',
    purpose: input.purpose ?? 'web-asset',
    args: [
      '--background', sourceFile,
      '--python', scriptFile,
      '--', '--output', outputDir, '--format', input.format ?? 'glb'
    ]
  };
}

export async function executeBlenderJob(job, options = {}) {
  const spawnImpl = options.spawnImpl ?? spawn;
  return await new Promise((resolve) => {
    const child = spawnImpl(job.command, job.args, { shell: false, cwd: options.cwd, env: options.env ?? process.env });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (error) => resolve({ pass: false, code: 'blender-unavailable', error: error.message, stdout, stderr }));
    child.on('close', (code) => resolve({ pass: code === 0, code: code === 0 ? 'ok' : 'blender-job-failed', exitCode: code, stdout, stderr }));
  });
}

export function createThreeDAssetManifest(input = {}) {
  return {
    id: input.id ?? null,
    source: input.source ?? null,
    truthSensitive: Boolean(input.truthSensitive),
    rights: input.rights ?? 'unresolved',
    geometry: {
      triangles: input.triangles ?? null,
      drawCalls: input.drawCalls ?? null,
      lods: input.lods ?? []
    },
    textures: {
      maxDimension: input.maxTextureDimension ?? null,
      compressed: Boolean(input.compressedTextures),
      format: input.textureFormat ?? null
    },
    delivery: {
      format: input.format ?? 'glb',
      draco: Boolean(input.draco),
      meshopt: Boolean(input.meshopt),
      fallback: input.fallback ?? null
    }
  };
}
