import { readFileSync } from 'node:fs';
import type { ChatmailCredentials } from './transport/deltachat.js';

export type AccountsFile = Record<string, ChatmailCredentials>;

export const readAccounts = (path = 'accounts.local.json'): AccountsFile =>
  JSON.parse(readFileSync(path, 'utf8'));
