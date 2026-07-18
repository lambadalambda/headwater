import { describe, expect, it } from 'vitest';
import {
  createDesktopBootstrapVerifier,
  signDesktopBootstrapProof,
} from '../src/desktop-bootstrap.js';

const key = 'k'.repeat(43);
const now = 1_800_000_000_000;

describe('desktop bootstrap proof', () => {
  it('accepts one short-lived operation-bound proof exactly once', () => {
    const verifier = createDesktopBootstrapVerifier({ key, now: () => now });
    const proof = signDesktopBootstrapProof({
      key,
      operation: 'signup',
      nonce: 'n'.repeat(22),
      expiresAt: now + 30_000,
    });

    expect(verifier.verify(proof, 'signup')).toBe(true);
    expect(verifier.verify(proof, 'signup')).toBe(false);
  });

  it('rejects missing, malformed, expired, distant, and wrong-operation proofs', () => {
    const verifier = createDesktopBootstrapVerifier({ key, now: () => now });
    const proof = (operation: 'signup' | 'restore' | 'oauth-register', expiresAt: number, nonce: string) =>
      signDesktopBootstrapProof({ key, operation, nonce, expiresAt });

    expect(verifier.verify(undefined, 'signup')).toBe(false);
    expect(verifier.verify('not-a-proof', 'signup')).toBe(false);
    expect(verifier.verify(proof('signup', now, 'a'.repeat(22)), 'signup')).toBe(false);
    expect(verifier.verify(proof('signup', now + 61_000, 'b'.repeat(22)), 'signup')).toBe(false);
    expect(verifier.verify(proof('restore', now + 30_000, 'c'.repeat(22)), 'signup')).toBe(false);
  });
});
