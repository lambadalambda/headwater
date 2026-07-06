import type { T } from '@deltachat/jsonrpc-client';

const DC_CONTACT_ID_SELF = 1;

export type MastodonAccount = ReturnType<typeof contactToAccount>;
export type MastodonStatus = ReturnType<typeof messageToStatus>;

const escapeHtml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const URL_RE = /https?:\/\/[^\s<]+/g;

export const textToHtml = (text: string): string => {
  const linkified = escapeHtml(text).replaceAll(
    URL_RE,
    (url) => `<a href="${url}" rel="nofollow noopener">${url}</a>`,
  );
  return `<p>${linkified.replaceAll('\n', '<br/>')}</p>`;
};

/** First grapheme of a display name, uppercased; '?' for an empty name. */
export const initialOf = (displayName: string): string => {
  if (!displayName) return '?';
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const first = [...segmenter.segment(displayName)][0]?.segment ?? '?';
  return first.toUpperCase();
};

/** Placeholder avatar: the contact's initial on their stable color. */
export const avatarPlaceholderSvg = (initial: string, color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
  `<rect width="96" height="96" fill="${escapeHtml(color)}"/>` +
  `<text x="48" y="62" font-size="44" text-anchor="middle" fill="#fff" ` +
  `font-family="sans-serif">${escapeHtml(initial)}</text></svg>`;

/** Default profile header banner: a pleasant generated gradient. */
export const headerSvg = (): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500">` +
  `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
  `<stop offset="0%" stop-color="#2a3542"/>` +
  `<stop offset="100%" stop-color="#4a6a8a"/>` +
  `</linearGradient></defs>` +
  `<rect width="1500" height="500" fill="url(#g)"/></svg>`;

export const contactToAccount = (contact: T.Contact, baseUrl: string) => {
  const username = contact.address.split('@')[0] ?? contact.address;
  return {
    id: String(contact.id),
    username,
    acct: contact.address,
    display_name: contact.displayName,
    note: textToHtml(contact.status),
    url: `${baseUrl}/deltanet/contact/${contact.id}`,
    avatar: `${baseUrl}/deltanet/avatar/${contact.id}`,
    avatar_static: `${baseUrl}/deltanet/avatar/${contact.id}`,
    header: `${baseUrl}/deltanet/header.png`,
    header_static: `${baseUrl}/deltanet/header.png`,
    created_at: new Date(0).toISOString(),
    followers_count: 0,
    following_count: 0,
    statuses_count: 0,
    locked: false,
    bot: contact.isBot,
    discoverable: true,
    fields: [],
    emojis: [],
    source: { note: contact.status, fields: [] },
    pleroma: {
      is_admin: false,
      is_moderator: false,
      tags: [],
    },
  };
};

const mediaAttachments = (msg: T.Message, baseUrl: string, description: string | null) => {
  if (!msg.file || !msg.fileMime) return [];
  const kind = msg.fileMime.split('/')[0];
  const type =
    kind === 'image' ? 'image' : kind === 'video' ? 'video' : kind === 'audio' ? 'audio' : 'unknown';
  return [
    {
      id: String(msg.id),
      type,
      url: `${baseUrl}/deltanet/blob/${msg.id}`,
      preview_url: `${baseUrl}/deltanet/blob/${msg.id}`,
      remote_url: null,
      description,
    },
  ];
};

/**
 * `description` is the uploaded alt text for this message's attachment, if
 * we have it on hand (in-memory registry keyed by media/msg id) — chatmail
 * itself has no per-attachment alt text field.
 */
export const messageToStatus = (msg: T.Message, baseUrl: string, description: string | null = null) => ({
  id: String(msg.id),
  uri: `${baseUrl}/deltanet/message/${msg.id}`,
  url: `${baseUrl}/deltanet/message/${msg.id}`,
  content: textToHtml(msg.text),
  created_at: new Date(msg.timestamp * 1000).toISOString(),
  account: contactToAccount(msg.sender, baseUrl),
  in_reply_to_id: msg.parentId === null ? null : String(msg.parentId),
  in_reply_to_account_id: null,
  favourites_count: 0,
  reblogs_count: 0,
  replies_count: 0,
  favourited: false,
  reblogged: false,
  bookmarked: false,
  muted: false,
  pinned: false,
  media_attachments: mediaAttachments(msg, baseUrl, description),
  sensitive: false,
  spoiler_text: '',
  visibility: 'public' as const,
  language: null,
  reblog: null,
  application: { name: 'deltanet' },
  emojis: [],
  mentions: [],
  tags: [],
  card: null,
  poll: null,
  pleroma: {
    local: msg.sender.id === DC_CONTACT_ID_SELF,
    conversation_id: msg.chatId,
    emoji_reactions: [],
    quote: null,
    quote_id: null,
    quote_visible: false,
  },
});

/**
 * Mastodon-style pagination header. `ids` is the page being returned,
 * newest first; "next" pages older via max_id, "prev" newer via min_id.
 */
export const timelineLinkHeader = (url: string, ids: string[]): string | null => {
  const newest = ids[0];
  const oldest = ids[ids.length - 1];
  if (newest === undefined || oldest === undefined) return null;
  return `<${url}?max_id=${oldest}>; rel="next", <${url}?min_id=${newest}>; rel="prev"`;
};
