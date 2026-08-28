// Legacy entrypoint retained for compatibility. The V2 verifier is the sole
// comparison-visibility authority implementation; importing it preserves the
// existing CLI contract and prevents security/behavior drift between versions.
import './verify-motion-proof-comparison-visibility-v2.mjs';
