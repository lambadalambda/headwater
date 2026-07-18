import { createHmac, timingSafeEqual } from 'node:crypto';

export type DesktopBootstrapOperation = 'signup' | 'restore' | 'oauth-register';

const bootstrapKey = (value: string): Buffer => {
  if (!/^[A-Za-z0-9_-]{43}$/.test(value)) throw new Error('invalid desktop bootstrap key');
  const decoded = Buffer.from(value, 'base64url');
  if (decoded.byteLength !== 32) throw new Error('invalid desktop bootstrap key');
  return decoded;
};

const payload = (operation: DesktopBootstrapOperation, expiresAt: number, nonce: string): string =>
  `v1\0${operation}\0${expiresAt}\0${nonce}`;

export const signDesktopBootstrapProof = (input: Readonly<{
  key: string;
  operation: DesktopBootstrapOperation;
  expiresAt: number;
  nonce: string;
}>): string => {
  if (!Number.isSafeInteger(input.expiresAt) || !/^[A-Za-z0-9_-]{22}$/.test(input.nonce)) {
    throw new Error('invalid desktop bootstrap proof input');
  }
  const mac = createHmac('sha256', bootstrapKey(input.key))
    .update(payload(input.operation, input.expiresAt, input.nonce))
    .digest('base64url');
  return `v1.${input.operation}.${input.expiresAt}.${input.nonce}.${mac}`;
};

export const createDesktopBootstrapVerifier = (input: Readonly<{
  key: string;
  now?: () => number;
  maxLifetimeMs?: number;
}>) => {
  const key = bootstrapKey(input.key);
  const now = input.now ?? Date.now;
  const maxLifetimeMs = input.maxLifetimeMs ?? 60_000;
  const consumed = new Map<string, number>();

  const verify = (proof: string | undefined, expectedOperation: DesktopBootstrapOperation): boolean => {
    const currentTime = now();
    for (const [nonce, expiresAt] of consumed) {
      if (expiresAt <= currentTime) consumed.delete(nonce);
    }
    const match = /^v1\.(signup|restore|oauth-register)\.(\d{13})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/.exec(proof ?? '');
    if (!match || match[1] !== expectedOperation) return false;
    const expiresAt = Number(match[2]);
    const nonce = match[3] as string;
    if (!Number.isSafeInteger(expiresAt) || expiresAt <= currentTime || expiresAt > currentTime + maxLifetimeMs) return false;
    if (consumed.has(nonce)) return false;
    const expected = createHmac('sha256', key)
      .update(payload(expectedOperation, expiresAt, nonce))
      .digest();
    const actual = Buffer.from(match[4] as string, 'base64url');
    if (actual.byteLength !== expected.byteLength || !timingSafeEqual(actual, expected)) return false;
    consumed.set(nonce, expiresAt);
    return true;
  };

  return { verify };
};
