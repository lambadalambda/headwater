import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { serve } from '@hono/node-server';
import { readAccounts, writeAccount } from './config.js';
import { createApp, type AppContext } from './server.js';
import { registerAccount } from './signup.js';
import { openTransport, type ChatmailCredentials } from './transport/deltachat.js';
import type { Transport } from './transport/types.js';
import { createStore } from './store.js';
import type { T } from '@deltachat/jsonrpc-client';

const PORT = Number(process.env['PORT'] ?? 4030);
const ACCOUNT = process.env['DELTANET_ACCOUNT'] ?? 'main';
const DATA_DIR = process.env['DELTANET_DATA'] ?? `data/${ACCOUNT}`;
const BASE_URL = process.env['DELTANET_BASE_URL'] ?? `http://localhost:${PORT}`;
const ACCOUNTS_FILE = process.env['DELTANET_ACCOUNTS'] ?? 'accounts.local.json';
const STATIC_DIR_CONFIG = process.env['DELTANET_STATIC'] ?? '../frontend/build';
const STATIC_DIR = resolve(process.cwd(), STATIC_DIR_CONFIG);

// One deltanet wire-convention store per account data dir, shared between
// the transport's ingestion hook (timeline loads + IncomingMsg events) and
// the API layer's mapping/context assembly.
const store = createStore(join(DATA_DIR, 'deltanet-store.json'));

const announce = async (transport: Transport) => {
  const self = await transport.self();
  console.log(`logged in as ${self.displayName} <${self.address}>`);
  console.log(`your feed invite: ${await transport.feedInvite()}`);
};

let transport: Transport | null = null;

const ingestOnMessage = async (msg: T.Message) => {
  const t = transport;
  if (!t) return;
  const mid = await t.messageMid(msg.id);
  if (mid) store.ingestMessage(msg, mid);
};

const creds = readAccounts(ACCOUNTS_FILE)[ACCOUNT];
if (creds) {
  console.log(`configuring ${creds.addr} (data: ${DATA_DIR}) ...`);
  transport = await openTransport(DATA_DIR, creds, { onMessage: ingestOnMessage });
  await announce(transport);
} else {
  console.log(
    `no account "${ACCOUNT}" configured yet — POST /api/deltanet/signup to create one`,
  );
}

const ctx: AppContext = {
  getTransport: () => transport,
  signup: async (displayName, relay) => {
    const { addr, password } = await registerAccount(relay);
    const newCreds: ChatmailCredentials = { addr, password, displayName };
    writeAccount(ACCOUNTS_FILE, ACCOUNT, newCreds);
    const opened = await openTransport(DATA_DIR, newCreds, { onMessage: ingestOnMessage });
    transport = opened;
    await announce(opened);
    return opened;
  },
};

const staticDir = existsSync(STATIC_DIR) ? STATIC_DIR : undefined;
if (staticDir) console.log(`serving static frontend from ${staticDir}`);

serve({ fetch: createApp(ctx, { baseUrl: BASE_URL, staticDir, store }).fetch, port: PORT });
console.log(`deltanet: mastodon api on ${BASE_URL}`);
