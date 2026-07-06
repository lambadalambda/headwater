import { describe, expect, it } from 'vitest';
import type { T } from '@deltachat/jsonrpc-client';
import {
  contactToAccount,
  messageToStatus,
  textToHtml,
  timelineLinkHeader,
} from '../src/mastodon/entities.js';

const BASE = 'http://localhost:4030';

export const makeContact = (over: Partial<T.Contact> = {}): T.Contact =>
  ({
    address: 'p6yalimhl@nine.testrun.org',
    color: '#ff0000',
    authName: 'alice',
    status: 'just testing',
    displayName: 'alice',
    id: 1,
    name: 'alice',
    profileImage: null,
    nameAndAddr: 'alice (p6yalimhl@nine.testrun.org)',
    isBlocked: false,
    isKeyContact: true,
    e2eeAvail: true,
    isVerified: false,
    verifierId: null,
    lastSeen: 0,
    wasSeenRecently: false,
    isBot: false,
    isProfileVerified: false,
    ...over,
  }) as T.Contact;

export const makeMessage = (over: Partial<T.Message> = {}): T.Message =>
  ({
    id: 42,
    chatId: 12,
    fromId: 1,
    quote: null,
    parentId: null,
    text: 'hello fediverse',
    isEdited: false,
    hasLocation: false,
    hasHtml: false,
    viewType: 'Text',
    state: 26,
    error: null,
    timestamp: 1751800000,
    sortTimestamp: 1751800000,
    receivedTimestamp: 1751800000,
    hasDeviatingTimestamp: false,
    subject: '',
    showPadlock: true,
    isInfo: false,
    isForwarded: false,
    isBot: false,
    systemMessageType: 'Unknown',
    infoContactId: null,
    duration: 0,
    dimensionsHeight: 0,
    dimensionsWidth: 0,
    overrideSenderName: null,
    sender: makeContact(),
    file: null,
    fileMime: null,
    fileBytes: 0,
    fileName: null,
    webxdcInfo: null,
    downloadState: 'Done',
    reactions: null,
    vcardContact: null,
    originalMsgId: null,
    savedMessageId: null,
    isSetupmessage: false,
    setupCodeBegin: null,
    videochatType: null,
    videochatUrl: null,
    ...over,
  }) as T.Message;

describe('textToHtml', () => {
  it('escapes html and converts newlines', () => {
    expect(textToHtml('a <b> &\nc')).toBe('<p>a &lt;b&gt; &amp;<br/>c</p>');
  });

  it('linkifies http(s) urls', () => {
    expect(textToHtml('see https://example.com/x now')).toBe(
      '<p>see <a href="https://example.com/x" rel="nofollow noopener">https://example.com/x</a> now</p>',
    );
  });
});

describe('contactToAccount', () => {
  it('maps a chatmail contact to a mastodon account', () => {
    const account = contactToAccount(makeContact(), BASE);
    expect(account.id).toBe('1');
    expect(account.username).toBe('p6yalimhl');
    expect(account.acct).toBe('p6yalimhl@nine.testrun.org');
    expect(account.display_name).toBe('alice');
    expect(account.note).toBe('<p>just testing</p>');
    expect(account.avatar).toBe(`${BASE}/deltanet/avatar/1`);
    expect(account.url).toBe(`${BASE}/deltanet/contact/1`);
    // fields the frontend reads must exist
    expect(account.followers_count).toBe(0);
    expect(account.statuses_count).toBe(0);
    expect(account.locked).toBe(false);
    expect(account.bot).toBe(false);
    expect(account.emojis).toEqual([]);
  });

  it('escapes html in the bio', () => {
    const account = contactToAccount(makeContact({ status: '<script>' }), BASE);
    expect(account.note).toBe('<p>&lt;script&gt;</p>');
  });
});

describe('messageToStatus', () => {
  it('maps a text message to a status', () => {
    const status = messageToStatus(makeMessage(), BASE);
    expect(status.id).toBe('42');
    expect(status.content).toBe('<p>hello fediverse</p>');
    expect(status.created_at).toBe('2025-07-06T11:06:40.000Z');
    expect(status.account.id).toBe('1');
    expect(status.visibility).toBe('public');
    expect(status.uri).toBe(`${BASE}/deltanet/message/42`);
    expect(status.media_attachments).toEqual([]);
    expect(status.reblog).toBeNull();
    expect(status.in_reply_to_id).toBeNull();
    expect(status.favourites_count).toBe(0);
    expect(status.pleroma.emoji_reactions).toEqual([]);
    expect(status.pleroma.local).toBe(true); // sender id 1 = DC self
  });

  it('marks messages from other contacts as remote', () => {
    const msg = makeMessage({ fromId: 11, sender: makeContact({ id: 11 }) });
    expect(messageToStatus(msg, BASE).pleroma.local).toBe(false);
  });

  it('maps replies via parentId', () => {
    const msg = makeMessage({ parentId: 40 });
    expect(messageToStatus(msg, BASE).in_reply_to_id).toBe('40');
  });

  it('exposes an image file as a media attachment', () => {
    const msg = makeMessage({
      file: '/blobs/x.png',
      fileMime: 'image/png',
      viewType: 'Image',
    });
    const status = messageToStatus(msg, BASE);
    expect(status.media_attachments).toEqual([
      {
        id: '42',
        type: 'image',
        url: `${BASE}/deltanet/blob/42`,
        preview_url: `${BASE}/deltanet/blob/42`,
        remote_url: null,
        description: null,
      },
    ]);
  });
});

describe('timelineLinkHeader', () => {
  it('builds next/prev links from the returned page', () => {
    const header = timelineLinkHeader(`${BASE}/api/v1/timelines/home`, ['50', '43', '42']);
    expect(header).toBe(
      `<${BASE}/api/v1/timelines/home?max_id=42>; rel="next", ` +
        `<${BASE}/api/v1/timelines/home?min_id=50>; rel="prev"`,
    );
  });

  it('returns null for an empty page', () => {
    expect(timelineLinkHeader(`${BASE}/x`, [])).toBeNull();
  });
});
