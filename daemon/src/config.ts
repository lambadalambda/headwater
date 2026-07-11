import { readFileSync } from 'node:fs';
import type { ChatmailCredentials } from './transport/deltachat.js';
import { atomicWriteText, pathExists } from './durable-file.js';
import { acquireInterprocessLock } from './interprocess-lock.js';

export type AccountsFile = Record<string, ChatmailCredentials>;
export type AccountValue = ChatmailCredentials | null;

export class AccountConflictError extends Error {
  constructor(name: string) {
    super(`account credentials changed concurrently: ${name}`);
    this.name = 'AccountConflictError';
  }
}

const sameAccount = (left: AccountValue, right: AccountValue): boolean =>
  left === right || Boolean(
    left && right &&
    left.addr === right.addr &&
    left.password === right.password &&
    left.displayName === right.displayName,
  );

const writeAccounts = (path: string, accounts: AccountsFile): void =>
  atomicWriteText(path, `${JSON.stringify(accounts, null, 2)}\n`);

const withAccountsLock = <T>(path: string, operation: () => T): T => {
  const release = acquireInterprocessLock(`${path}.lock`);
  try {
    return operation();
  } finally {
    release();
  }
};

/** Reads the accounts file; an absent file just means "no accounts yet". */
export const readAccounts = (path = 'accounts.local.json'): AccountsFile =>
  pathExists(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};

/** Persists (or overwrites) one named account's credentials. */
export const writeAccount = (
  path: string,
  name: string,
  creds: ChatmailCredentials,
): void => {
  withAccountsLock(path, () => {
    const accounts = readAccounts(path);
    accounts[name] = creds;
    writeAccounts(path, accounts);
  });
};

/** Atomically updates one account entry while preserving unrelated writers. */
export const compareExchangeAccount = (
  path: string,
  name: string,
  expected: AccountValue,
  replacement: AccountValue,
): void => {
  withAccountsLock(path, () => {
    const accounts = readAccounts(path);
    const current = accounts[name] ?? null;
    if (sameAccount(current, replacement)) return;
    if (!sameAccount(current, expected)) throw new AccountConflictError(name);
    if (replacement === null) delete accounts[name];
    else accounts[name] = replacement;
    writeAccounts(path, accounts);
  });
};
