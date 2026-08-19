export const CREATIVE_ENGINEERING_VERSION = '1.3.0';

export const WEB_STACK = Object.freeze({
  three: { package: 'three', version: '^0.185.1', role: 'realtime-3d', required: false },
  gsap: { package: 'gsap', version: '^3.15.0', role: 'motion-timeline', required: false },
  rive: { package: '@rive-app/canvas', version: '^2.39.1', role: 'vector-state-animation', required: false },
  playwright: { package: 'playwright', version: '^1.62.1', role: 'browser-observation', required: true }
});

export const DEFAULT_VIEWPORTS = Object.freeze([
  { id: 'mobile', width: 390, height: 844, deviceScaleFactor: 1 },
  { id: 'tablet', width: 834, height: 1112, deviceScaleFactor: 1 },
  { id: 'desktop', width: 1440, height: 1000, deviceScaleFactor: 1 }
]);

export const DEFAULT_DELIVERY_BUDGETS = Object.freeze({
  webVitals: { lcpMs: 2500, inpMs: 200, cls: 0.1 },
  runtime: { minFps: 55, maxFrameMs: 22, maxLongTasks: 0 },
  bundle: { initialJsKb: 400, initialCssKb: 120 },
  accessibility: { blockers: 0, majors: 0 },
  responsive: { requiredViewports: ['mobile', 'tablet', 'desktop'] }
});

export function createWebStackManifest({ needs = [], allowWebGPU = true } = {}) {
  const requested = new Set(needs);
  const packages = [WEB_STACK.playwright];
  if (requested.has('3d') || requested.has('webgl') || requested.has('webgpu')) packages.push(WEB_STACK.three);
  if (requested.has('motion') || requested.has('scroll')) packages.push(WEB_STACK.gsap);
  if (requested.has('rive') || requested.has('vector-motion')) packages.push(WEB_STACK.rive);

  return {
    version: CREATIVE_ENGINEERING_VERSION,
    rendererPreference: requested.has('3d') || requested.has('webgl') || requested.has('webgpu')
      ? { preferred: allowWebGPU ? 'webgpu' : 'webgl2', fallback: 'webgl2' }
      : null,
    packages: packages.map((entry) => ({ ...entry })),
    rule: 'Capabilities are selected because the experience needs them; no library is a visual style.'
  };
}
