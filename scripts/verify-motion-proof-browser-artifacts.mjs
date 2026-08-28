// Legacy entrypoint retained for compatibility. The V2 verifier is the sole
// normal-motion browser authority implementation; importing it preserves the
// existing CLI contract and prevents security/behavior drift between versions.
import './verify-motion-proof-browser-artifacts-v2.mjs';
