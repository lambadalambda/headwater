import { describe, expect, it, vi } from 'vitest';
import { normalizeRelayUrl, registerAccount } from '../src/signup.js';

describe('normalizeRelayUrl', () => {
  it('canonicalizes an HTTPS relay origin', () => {
    expect(normalizeRelayUrl('https://EXAMPLE.org:443/')).toBe('https://example.org');
  });

  it.each([
    'http://example.org',
    'file:///tmp/relay',
    'https://user:password@example.org',
    'https://example.org/path',
    'https://example.org?target=other',
    'https://example.org?',
    'https://example.org/#fragment',
    'https://example.org#',
    'https://example.org/./',
    'https://example.org/foo/..',
    'https://example.org/%2e',
    'https://example.org\\',
    'https:example.org',
    'https://example..org',
    ' https://example.org',
    'not a URL',
  ])('rejects an unsafe or ambiguous relay URL: %s', (relay) => {
    expect(() => normalizeRelayUrl(relay)).toThrow('invalid relay URL');
  });
});

describe('registerAccount', () => {
  it('POSTs to {relay}/new and returns the new credentials', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ email: 'new@nine.testrun.org', password: 'secret' }), {
        status: 200,
      }),
    );
    const creds = await registerAccount('https://nine.testrun.org/', fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://nine.testrun.org/new',
      expect.objectContaining({ method: 'POST', redirect: 'error' }),
    );
    expect(creds).toEqual({ addr: 'new@nine.testrun.org', password: 'secret' });
  });

  it('throws when registration fails', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 500 }));
    await expect(registerAccount('https://nine.testrun.org', fetchImpl)).rejects.toThrow(
      'registration failed with status 500',
    );
  });

  it('rejects an invalid relay before making a network request', async () => {
    const fetchImpl = vi.fn();
    await expect(registerAccount('http://127.0.0.1/admin', fetchImpl)).rejects.toThrow(
      'invalid relay URL',
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('times out registration requests', async () => {
    const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      }),
    );
    await expect(
      registerAccount('https://nine.testrun.org', fetchImpl, { timeoutMs: 5 }),
    ).rejects.toThrow('registration request timed out');
  });

  it('rejects a response declared larger than the response limit', async () => {
    let cancelled = false;
    const body = new ReadableStream({
      cancel: () => { cancelled = true; },
    });
    const fetchImpl = vi.fn(async () => new Response(body, {
      headers: { 'content-length': '1000' },
    }));
    await expect(
      registerAccount('https://nine.testrun.org', fetchImpl, { maxResponseBytes: 32 }),
    ).rejects.toThrow('registration response is too large');
    expect(cancelled).toBe(true);
  });

  it('rejects a streamed response larger than the response limit', async () => {
    let cancelled = false;
    const fetchImpl = vi.fn(async () => new Response(new ReadableStream({
      start: (controller) => controller.enqueue(new TextEncoder().encode('x'.repeat(100))),
      cancel: () => { cancelled = true; },
    })));
    await expect(
      registerAccount('https://nine.testrun.org', fetchImpl, { maxResponseBytes: 32 }),
    ).rejects.toThrow('registration response is too large');
    expect(cancelled).toBe(true);
  });

  it('cancels a stalled response body when the request times out', async () => {
    let cancelled = false;
    const fetchImpl = vi.fn(async () => new Response(new ReadableStream({
      cancel: () => { cancelled = true; },
    })));
    await expect(
      registerAccount('https://nine.testrun.org', fetchImpl, { timeoutMs: 5 }),
    ).rejects.toThrow('registration request timed out');
    expect(cancelled).toBe(true);
  });

  it('cancels non-success response bodies without including them in the error', async () => {
    let cancelled = false;
    const fetchImpl = vi.fn(async () => new Response(new ReadableStream({
      start: (controller) => controller.enqueue(new TextEncoder().encode('private upstream detail')),
      cancel: () => { cancelled = true; },
    }), { status: 500 }));
    await expect(registerAccount('https://nine.testrun.org', fetchImpl)).rejects.toThrow(
      'registration failed with status 500',
    );
    expect(cancelled).toBe(true);
  });

  it.each([
    ['not JSON', 'not-json'],
    ['missing password', JSON.stringify({ email: 'new@example.org' })],
    ['invalid address', JSON.stringify({ email: 'not-an-address', password: 'secret' })],
    ['invalid domain', JSON.stringify({ email: 'new@example..org', password: 'secret' })],
    ['control character', JSON.stringify({ email: 'new\u0000@example.org', password: 'secret' })],
    ['leading local dot', JSON.stringify({ email: '.new@example.org', password: 'secret' })],
    ['repeated local dot', JSON.stringify({ email: 'new..user@example.org', password: 'secret' })],
    ['invalid local punctuation', JSON.stringify({ email: 'new<admin>@example.org', password: 'secret' })],
    ['blank password', JSON.stringify({ email: 'new@example.org', password: '' })],
  ])('rejects an invalid registration response: %s', async (_label, body) => {
    const fetchImpl = vi.fn(async () => new Response(body));
    await expect(registerAccount('https://nine.testrun.org', fetchImpl)).rejects.toThrow(
      'invalid registration response',
    );
  });
});
