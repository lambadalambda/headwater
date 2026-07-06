import { describe, expect, it } from 'vitest';
import {
  buildBoostText,
  buildQuotedText,
  buildReplyText,
  parseMarkers,
  parseQuotedAuthor,
} from '../src/protocol.js';

const REF = { mid: 'abc123@nine.testrun.org', addr: 'bob@nine.testrun.org' };

describe('buildReplyText / parseMarkers (reply round-trip)', () => {
  it('appends a reply marker as the final line', () => {
    const text = buildReplyText('hello there', REF);
    expect(text).toBe('hello there\n\n↳re abc123@nine.testrun.org bob@nine.testrun.org');
  });

  it('round-trips: parseMarkers recovers the body and reply ref', () => {
    const text = buildReplyText('hello there', REF);
    const parsed = parseMarkers(text);
    expect(parsed.body).toBe('hello there');
    expect(parsed.reply).toEqual(REF);
    expect(parsed.boost).toBeUndefined();
  });

  it('round-trips multi-line bodies', () => {
    const text = buildReplyText('line one\nline two', REF);
    const parsed = parseMarkers(text);
    expect(parsed.body).toBe('line one\nline two');
    expect(parsed.reply).toEqual(REF);
  });
});

describe('buildBoostText / parseMarkers (boost round-trip)', () => {
  it('is just the marker, no body', () => {
    const text = buildBoostText(REF);
    expect(text).toBe('♻ abc123@nine.testrun.org bob@nine.testrun.org');
  });

  it('round-trips: parseMarkers recovers the boost ref with empty body', () => {
    const text = buildBoostText(REF);
    const parsed = parseMarkers(text);
    expect(parsed.body).toBe('');
    expect(parsed.boost).toEqual(REF);
    expect(parsed.reply).toBeUndefined();
  });
});

describe('parseMarkers tolerance', () => {
  it('treats plain text with no marker as a plain body', () => {
    const parsed = parseMarkers('just a normal post');
    expect(parsed).toEqual({ body: 'just a normal post' });
  });

  it('does not treat a reply-marker-shaped line in the middle of text as a marker', () => {
    const text = 'look at this:\n↳re abc123@nine.testrun.org bob@nine.testrun.org\nmore stuff after';
    const parsed = parseMarkers(text);
    expect(parsed).toEqual({ body: text });
  });

  it('does not treat a boost-marker-shaped prefix as a marker unless it is the whole text', () => {
    const text = '♻ abc123@nine.testrun.org bob@nine.testrun.org\nplus extra commentary';
    const parsed = parseMarkers(text);
    expect(parsed).toEqual({ body: text });
  });

  it('ignores malformed reply marker lines (missing addr)', () => {
    const text = 'hello\n\n↳re onlymid';
    const parsed = parseMarkers(text);
    expect(parsed).toEqual({ body: text });
  });

  it('ignores malformed boost marker (missing addr)', () => {
    const parsed = parseMarkers('♻ onlymid');
    expect(parsed).toEqual({ body: '♻ onlymid' });
  });

  it('handles empty string', () => {
    expect(parseMarkers('')).toEqual({ body: '' });
  });

  it('does not choke on a mid or addr containing no spaces but odd chars', () => {
    const ref = { mid: '<weird+id.123@sub.nine.testrun.org>', addr: 'a.b+tag@nine.testrun.org' };
    const text = buildReplyText('body text', ref);
    expect(parseMarkers(text)).toEqual({ body: 'body text', reply: ref });
  });
});

describe('buildQuotedText / parseQuotedAuthor', () => {
  it('builds "<authorName>: <capped text>"', () => {
    expect(buildQuotedText('alice', 'hello world', 120)).toBe('alice: hello world');
  });

  it('caps the text at the given length with an ellipsis', () => {
    const long = 'x'.repeat(200);
    const quoted = buildQuotedText('alice', long, 120);
    expect(quoted.startsWith('alice: ')).toBe(true);
    expect(quoted.length).toBeLessThanOrEqual('alice: '.length + 120 + 1); // +1 for the ellipsis char
  });

  it('parseQuotedAuthor recovers the author and text (best-effort)', () => {
    const quoted = buildQuotedText('alice', 'hello world', 120);
    expect(parseQuotedAuthor(quoted)).toEqual({ authorName: 'alice', text: 'hello world' });
  });

  it('parseQuotedAuthor falls back when there is no "name: " prefix', () => {
    expect(parseQuotedAuthor('just some text')).toEqual({
      authorName: null,
      text: 'just some text',
    });
  });

  it('parseQuotedAuthor handles a colon inside the text without a real author prefix gracefully', () => {
    // "authorName: text" pattern requires a short-ish name before the first colon;
    // best-effort: this is ambiguous, but should not throw and should return *something* sane.
    const result = parseQuotedAuthor('note: remember to buy milk');
    expect(result.text).toContain('remember to buy milk');
  });

  it('round-trips through build/parse', () => {
    const quoted = buildQuotedText('Bob Ross', 'happy little trees', 500);
    expect(parseQuotedAuthor(quoted)).toEqual({ authorName: 'Bob Ross', text: 'happy little trees' });
  });
});
