import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  canonicalPayload,
  fieldsFromEnvelope,
  sha256Bytes,
  sha256File,
  openAttestor,
  verify,
  CANONICAL_PAYLOAD_VERSION,
  type CanonicalFields,
} from '../src/attest.js';
import type { Envelope } from '../src/envelope.js';

const ADDR = 'alice@relay.example';
const UUID = '11111111-2222-4333-8444-555555555555';

const fields = (over: Partial<CanonicalFields> = {}): CanonicalFields => ({
  type: 'post',
  uuid: UUID,
  addr: ADDR,
  ts: 1700000000000,
  text: 'hello',
  refToken: '',
  mediaSha256: '',
  ...over,
});

/** The expected length-prefixed encoding of one field: `<utf8ByteLength>:<part>`. */
const lp = (part: string): string => `${Buffer.byteLength(part, 'utf8')}:${part}`;

describe('canonicalPayload', () => {
  it('is a fixed-order, length-prefixed, version-prefixed byte string', () => {
    const payload = canonicalPayload(fields());
    expect(payload.toString('utf8')).toBe(
      [CANONICAL_PAYLOAD_VERSION, 'post', UUID, ADDR, '1700000000000', 'hello', '', '']
        .map(lp)
        .join(''),
    );
  });

  it('renders absent parts as zero-length framed fields, keeping the field count constant', () => {
    const boost = canonicalPayload(
      fields({ type: 'boost', text: '', refToken: 'u:x', mediaSha256: '' }),
    );
    expect(boost.toString('utf8')).toBe(
      [CANONICAL_PAYLOAD_VERSION, 'boost', UUID, ADDR, '1700000000000', '', 'u:x', '']
        .map(lp)
        .join(''),
    );
  });

  it('length-prefixes with BYTE length, not code-unit length (multi-byte utf8 frames correctly)', () => {
    const payload = canonicalPayload(fields({ text: '♻' })).toString('utf8');
    expect(payload).toContain(`${Buffer.byteLength('♻', 'utf8')}:♻`);
    expect(Buffer.byteLength('♻', 'utf8')).not.toBe('♻'.length); // the distinction matters
  });

  it('is stable: same fields -> byte-identical payload', () => {
    expect(canonicalPayload(fields())).toEqual(canonicalPayload(fields()));
  });

  it('is injective across each field (changing any field changes the payload)', () => {
    const base = canonicalPayload(fields()).toString('utf8');
    expect(canonicalPayload(fields({ text: 'hell0' })).toString('utf8')).not.toBe(base);
    expect(canonicalPayload(fields({ addr: 'mallory@relay.example' })).toString('utf8')).not.toBe(base);
    expect(canonicalPayload(fields({ ts: 1700000000001 })).toString('utf8')).not.toBe(base);
    expect(canonicalPayload(fields({ refToken: UUID })).toString('utf8')).not.toBe(base);
    expect(canonicalPayload(fields({ mediaSha256: 'deadbeef' })).toString('utf8')).not.toBe(base);
  });

  it('is unambiguous across field boundaries: NUL-bearing re-splits do NOT collide', () => {
    // Under a bare join('\0') these two tuples produced IDENTICAL byte payloads
    // ("a\0b\0c" either way) — one signature verified two different envelopes,
    // letting anyone re-split attacker-controlled text/refToken fields. Length-
    // prefix framing makes each field self-delimiting, so they must differ.
    const first = canonicalPayload(fields({ text: 'a\u0000b', refToken: 'c' }));
    const second = canonicalPayload(fields({ text: 'a', refToken: 'b\u0000c' }));
    expect(first.equals(second)).toBe(false);
  });

  it('cannot be confused by field content that mimics the framing itself', () => {
    // A text that LOOKS like "…<len>:<next field>" must not collide with the
    // honest split (each frame consumes exactly its declared byte count).
    const tricky = canonicalPayload(fields({ text: `hello${lp('evil')}`, refToken: '' }));
    const honest = canonicalPayload(fields({ text: 'hello', refToken: 'evil' }));
    expect(tricky.equals(honest)).toBe(false);
  });
});

describe('fieldsFromEnvelope', () => {
  it('projects envelope fields, defaulting absent text/ref/media to empty strings', () => {
    const env: Envelope = { dn: 2, type: 'post', uuid: UUID, ts: 5, text: 'hi' };
    expect(fieldsFromEnvelope(env, ADDR)).toEqual({
      type: 'post',
      uuid: UUID,
      addr: ADDR,
      ts: 5,
      text: 'hi',
      refToken: '',
      mediaSha256: '',
    });
  });

  it('takes the ref key string and media sha256 when present', () => {
    const env: Envelope = {
      dn: 2,
      type: 'reply',
      uuid: UUID,
      ts: 5,
      text: 'hi',
      ref: { u: 'parent-uuid', addr: 'bob@x' },
      media: { sha256: 'abc123' },
    };
    const f = fieldsFromEnvelope(env, ADDR);
    expect(f.refToken).toBe('parent-uuid');
    expect(f.mediaSha256).toBe('abc123');
  });
});

describe('sha256', () => {
  it('sha256Bytes matches a known vector for empty input', () => {
    expect(sha256Bytes(new Uint8Array())).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('sha256File hashes a file the same as sha256Bytes of its content', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'attest-hash-'));
    const path = join(dir, 'blob.bin');
    const bytes = new Uint8Array([1, 2, 3, 4, 5]);
    writeFileSync(path, bytes);
    expect(await sha256File(path)).toBe(sha256Bytes(bytes));
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('openAttestor / sign / verify', () => {
  let dir: string;
  let keyPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'attest-key-'));
    keyPath = join(dir, 'deltanet-signing-key.json');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('generates + persists a keypair on first use, 0600', () => {
    const a = openAttestor(keyPath);
    const pub = a.publicKeyBase64();
    expect(pub).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(existsSync(keyPath)).toBe(true);
    // owner-only permissions (private key material)
    expect(statSync(keyPath).mode & 0o777).toBe(0o600);
  });

  it('is stable across reopen (same pubkey loaded from disk)', () => {
    const pub1 = openAttestor(keyPath).publicKeyBase64();
    const pub2 = openAttestor(keyPath).publicKeyBase64();
    expect(pub2).toBe(pub1);
  });

  it('signs an envelope and verify() accepts the round-trip', () => {
    const a = openAttestor(keyPath);
    const env: Envelope = { dn: 2, type: 'post', uuid: UUID, text: 'hello' };
    const { ts, pubkey, sig } = a.sign(env, ADDR);
    const signed: Envelope = { ...env, ts, pubkey, sig };
    expect(verify(signed, ADDR)).toBe(true);
  });

  it('round-trips text containing embedded NUL bytes (sign/verify against itself)', () => {
    const a = openAttestor(keyPath);
    const env: Envelope = { dn: 2, type: 'post', uuid: UUID, text: 'weird\u0000but\u0000legal' };
    const signed: Envelope = { ...env, ...a.sign(env, ADDR) };
    expect(verify(signed, ADDR)).toBe(true);
  });

  it('uses env.ts when already set, else stamps Date.now()', () => {
    const a = openAttestor(keyPath);
    const withTs = a.sign({ dn: 2, type: 'post', uuid: UUID, text: 'x', ts: 42 }, ADDR);
    expect(withTs.ts).toBe(42);
    const before = Date.now();
    const noTs = a.sign({ dn: 2, type: 'post', uuid: UUID, text: 'x' }, ADDR);
    expect(noTs.ts).toBeGreaterThanOrEqual(before);
  });

  it('never persists the private key material in the loggable pubkey', () => {
    const a = openAttestor(keyPath);
    expect(a.publicKeyBase64()).not.toContain('PRIVATE');
  });

  describe('tamper matrix -> verify false', () => {
    const signedEnv = (): Envelope => {
      const a = openAttestor(keyPath);
      const env: Envelope = {
        dn: 2,
        type: 'post',
        uuid: UUID,
        text: 'authentic',
        media: { sha256: 'aa' },
      };
      const { ts, pubkey, sig } = a.sign(env, ADDR);
      return { ...env, ts, pubkey, sig };
    };

    it('altered text', () => {
      expect(verify({ ...signedEnv(), text: 'tampered' }, ADDR)).toBe(false);
    });

    it('altered addr (wrong signer identity)', () => {
      expect(verify(signedEnv(), 'mallory@relay.example')).toBe(false);
    });

    it('altered media sha256', () => {
      expect(verify({ ...signedEnv(), media: { sha256: 'bb' } }, ADDR)).toBe(false);
    });

    it('wrong pubkey (a different key that did not sign)', () => {
      const other = openAttestor(join(dir, 'other-key.json'));
      expect(verify({ ...signedEnv(), pubkey: other.publicKeyBase64() }, ADDR)).toBe(false);
    });

    it('NUL re-split of the signed fields does NOT cross-verify (framing ambiguity)', () => {
      // The exact collision the length prefix exists to kill: sign a reply
      // whose text ends in "\0b" targeting ref "c", then present the SAME
      // signature over text "a" and ref "b\0c". Under join('\0') both
      // canonicalize to identical bytes and the signature transfers.
      const a = openAttestor(keyPath);
      const env: Envelope = {
        dn: 2,
        type: 'reply',
        uuid: UUID,
        text: 'a\u0000b',
        ref: { u: 'c', addr: 'bob@x' },
      };
      const signed: Envelope = { ...env, ...a.sign(env, ADDR) };
      expect(verify(signed, ADDR)).toBe(true); // the honest envelope verifies

      const resplit: Envelope = { ...signed, text: 'a', ref: { u: 'b\u0000c', addr: 'bob@x' } };
      expect(verify(resplit, ADDR), 'one signature must never verify two envelopes').toBe(false);
    });

    it('missing sig / pubkey / uuid / ts', () => {
      const s = signedEnv();
      expect(verify({ ...s, sig: undefined }, ADDR)).toBe(false);
      expect(verify({ ...s, pubkey: undefined }, ADDR)).toBe(false);
      expect(verify({ ...s, uuid: undefined }, ADDR)).toBe(false);
      expect(verify({ ...s, ts: undefined }, ADDR)).toBe(false);
    });

    it('garbage sig / pubkey never throws, returns false', () => {
      const s = signedEnv();
      expect(verify({ ...s, sig: 'not-base64-!!!' }, ADDR)).toBe(false);
      expect(verify({ ...s, pubkey: 'not-a-key' }, ADDR)).toBe(false);
    });
  });
});
