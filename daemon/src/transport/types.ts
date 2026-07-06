import type { T } from '@deltachat/jsonrpc-client';

export type TimelineQuery = {
  limit: number;
  maxId?: number;
  minId?: number;
};

export type PostOptions = {
  file?: string;
  /** Freeform quote bubble (deltanet wire convention: reply/boost embeds). */
  quotedText?: string;
};

/**
 * What the Mastodon API layer needs from the federation transport.
 * Kept narrow so the API server can be unit-tested with a fake.
 */
export interface Transport {
  self(): Promise<T.Contact>;
  /** Feed messages across all subscribed feeds, newest first. */
  timeline(query: TimelineQuery): Promise<T.Message[]>;
  message(msgId: number): Promise<T.Message | null>;
  post(text: string, opts?: PostOptions): Promise<T.Message>;
  /** Invite link others use to follow (join) our feed. */
  feedInvite(): Promise<string>;
  /** Join someone else's feed from their invite link. Returns the chat id. */
  follow(invite: string): Promise<number>;
  contact(contactId: number): Promise<T.Contact | null>;
  avatarPath(contactId: number): Promise<string | null>;
  /** Initial + stable color for the avatar placeholder; null if the contact is unknown. */
  contactBadge(contactId: number): Promise<{ initial: string; color: string } | null>;
  blobPath(msgId: number): Promise<string | null>;
  /** Real follower/following/post counts for the self account. */
  stats(): Promise<{ followers: number; following: number; statuses: number }>;
  /** The message's global email Message-ID (rfc724Mid), or null if it can't be resolved. */
  messageMid(msgId: number): Promise<string | null>;
  /** Send a 1:1 DM to a contact (creating the chat if needed), e.g. the reply-notify copy. */
  sendControlDm(contactId: number, text: string, quotedText?: string): Promise<void>;
  /** Delete a message for all recipients (used to implement unreblog). */
  deleteMessage(msgId: number): Promise<void>;
}
