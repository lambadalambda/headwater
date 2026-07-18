import { createHmac, randomBytes } from 'node:crypto';

export type DesktopBootstrapOperation = 'signup' | 'restore' | 'oauth-register';

export const createDesktopBootstrapProof = (input: Readonly<{
  key: string;
  operation: DesktopBootstrapOperation;
  now?: () => number;
  randomNonce?: () => string;
}>): string => {
  if (!/^[A-Za-z0-9_-]{43}$/.test(input.key) || Buffer.from(input.key, 'base64url').byteLength !== 32) {
    throw new Error('invalid desktop bootstrap key');
  }
  const nonce = input.randomNonce?.() ?? randomBytes(16).toString('base64url');
  if (!/^[A-Za-z0-9_-]{22}$/.test(nonce)) throw new Error('invalid desktop bootstrap nonce');
  const expiresAt = (input.now ?? Date.now)() + 30_000;
  const payload = `v1\0${input.operation}\0${expiresAt}\0${nonce}`;
  const mac = createHmac('sha256', Buffer.from(input.key, 'base64url')).update(payload).digest('base64url');
  return `v1.${input.operation}.${expiresAt}.${nonce}.${mac}`;
};
