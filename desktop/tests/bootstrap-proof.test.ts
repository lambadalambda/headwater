import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createDesktopBootstrapProof } from '../src/bootstrap-proof.js';

describe('desktop bootstrap proof signing', () => {
  it('creates the exact short-lived operation-bound wire proof', () => {
    const key = 'k'.repeat(43);
    const now = 1_800_000_000_000;
    const nonce = 'n'.repeat(22);
    const expiresAt = now + 30_000;
    const payload = `v1\0signup\0${expiresAt}\0${nonce}`;
    const mac = createHmac('sha256', Buffer.from(key, 'base64url')).update(payload).digest('base64url');

    expect(createDesktopBootstrapProof({ key, operation: 'signup', now: () => now, randomNonce: () => nonce }))
      .toBe(`v1.signup.${expiresAt}.${nonce}.${mac}`);
  });

  it('rejects malformed bootstrap keys', () => {
    expect(() => createDesktopBootstrapProof({ key: 'short', operation: 'restore' })).toThrow(/bootstrap key/i);
  });
});
