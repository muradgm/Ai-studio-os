const DEFAULT_TOKENS = {
  direct: { durationMs: [120, 220], easing: 'fast-out-controlled' },
  reveal: { durationMs: [450, 850], easing: 'decelerate' },
  ambient: { durationMs: [1800, 6000], easing: 'linear-or-gentle' }
};

export function buildMotionPacket({ traits = [], intensity = 4, signature = 'layer-reveal' } = {}) {
  const safeIntensity = Math.max(0, Math.min(10, intensity));
  return {
    stage: 'motion',
    personality: traits.length ? traits : ['precise', 'restrained', 'purposeful'],
    intensity: safeIntensity,
    tokens: DEFAULT_TOKENS,
    choreography: {
      hero: ['establish', 'reveal-primary-subject', 'reveal-message', 'reveal-action', 'settle-to-idle'],
      scroll: 'Use scroll-linked motion only when it reveals hierarchy, process, texture, or spatial relationship.',
      microinteractions: 'Immediate response first; personality second.'
    },
    signatureBehavior: signature,
    reducedMotion: {
      required: true,
      fallback: 'remove parallax/scrubbed travel; use static composition plus short opacity/state transitions'
    },
    performance: [
      'Prefer transform and opacity for frequent UI animation.',
      'Avoid continuous expensive effects without product value.',
      'Do not block navigation or primary actions behind choreography.',
      'Provide mobile-specific simplification where needed.'
    ]
  };
}
