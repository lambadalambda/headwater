import { rmSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { readAccounts } from '../../src/config.js';
import { openTransport, type DeltaChatTransport } from '../../src/transport/deltachat.js';

/**
 * Real federation over nine.testrun.org: alice publishes a feed,
 * bob follows it via the invite link, alice posts, bob sees the post.
 * Slow by nature (real SMTP/IMAP + securejoin handshake).
 */
describe('federation over chatmail', () => {
  const accounts = readAccounts();
  const transports: DeltaChatTransport[] = [];

  afterAll(() => {
    for (const transport of transports) transport.close();
  });

  it('delivers a post from alice to her follower bob', async () => {
    rmSync('data/it-alice', { recursive: true, force: true });
    rmSync('data/it-bob', { recursive: true, force: true });

    const alice = await openTransport('data/it-alice', accounts['main']!);
    const bob = await openTransport('data/it-bob', accounts['peer']!);
    transports.push(alice, bob);

    // bob follows alice's feed
    const invite = await alice.feedInvite();
    expect(invite).toMatch(/^(OPENPGP4FPR|https?):/i);
    const joinDone = alice.waitForEvent(
      'SecurejoinInviterProgress',
      120_000,
      (event) => event.progress === 1000,
    );
    await bob.follow(invite);
    await joinDone;

    // alice posts to her feed
    const text = `hello bob, this is post ${Date.now()}`;
    const posted = await alice.post(text);
    expect(posted.text).toBe(text);

    // the post arrives in bob's home timeline (poll: delivery is store-and-forward)
    const deadline = Date.now() + 180_000;
    let arrived;
    while (arrived === undefined && Date.now() < deadline) {
      const timeline = await bob.timeline({ limit: 20 });
      arrived = timeline.find((msg) => msg.text === text);
      if (arrived === undefined) await new Promise((r) => setTimeout(r, 3000));
    }
    expect(arrived).toBeDefined();
    expect(arrived?.sender.address).toBe(accounts['main']!.addr);
    expect(arrived?.showPadlock).toBe(true); // e2e encrypted
  }, 300_000);
});
