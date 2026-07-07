import { registerAccount, type NewAccountCredentials } from '../../src/signup.js';
import {
  openTransport,
  type ChatmailCredentials,
  type DeltaChatTransport,
  type OpenTransportOptions,
} from '../../src/transport/deltachat.js';
import { resolveTestRelayConfig, type TestRelayConfig } from '../../src/testenv/relay-config.js';

/**
 * Shared integration-suite plumbing so all four tests target the same relay
 * without repeating the branch logic.
 *
 * `RELAY` is resolved once from the environment (which globalSetup populated
 * from `relay.sh up` when running against the local podman relay). The two
 * wrappers below hide the testrun-vs-local difference:
 *
 * - `register()` POSTs to the resolved relay's `/new`.
 * - `openRelayTransport()` opens a transport, passing explicit IMAP/SMTP
 *   params (with self-signed-cert acceptance) for the local relay, or letting
 *   autoconfig run for the testrun path.
 */
export const RELAY: TestRelayConfig = resolveTestRelayConfig(process.env);

// The local relay uses a self-signed certificate. Node's global fetch (used by
// registerAccount) has no per-call "accept invalid cert" knob, so relax TLS
// verification process-wide for the local path only. This is confined to the
// dedicated integration test worker and never affects production code paths.
if (!RELAY.isTestrun) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export const register = (): Promise<NewAccountCredentials> => registerAccount(RELAY.relayUrl);

export const openRelayTransport = (
  dataDir: string,
  creds: ChatmailCredentials,
  options: OpenTransportOptions = {},
): Promise<DeltaChatTransport> =>
  openTransport(dataDir, creds, options, RELAY.transportParams ?? undefined);
