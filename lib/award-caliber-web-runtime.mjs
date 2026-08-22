import { runCreativeQualityRuntime, validateAwardCaliberWebBenchmark } from '../modules/creative-quality/runtime.mjs';

export function runAwardCaliberWebRuntime(input = {}) {
  return runCreativeQualityRuntime(input);
}

export { validateAwardCaliberWebBenchmark };
