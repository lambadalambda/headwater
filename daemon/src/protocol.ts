/**
 * deltanet wire convention v0 (see ../DEVLOG.md "experiment findings" +
 * "deltanet wire convention v0"). Replies and boosts are plain-text
 * conventions over the global email Message-ID (`rfc724Mid`), since native
 * cross-chat quotes/reactions are rejected by the chatmail core. These are
 * pure functions: no transport, no store, just text in/text out.
 */

/** Opaque email Message-ID + the address of the message's author. */
export type MsgRef = { mid: string; addr: string };

export type ParsedMarkers = {
  /** Body text with the marker line stripped (empty string if the whole text was a boost marker). */
  body: string;
  reply?: MsgRef;
  boost?: MsgRef;
};

const REPLY_PREFIX = '↳re ';
const BOOST_PREFIX = '♻ ';

/** A mid has no whitespace (it's an opaque Message-ID); addr is the trailing token. */
const MARKER_LINE_RE = /^(\S+) (\S+)$/;

export const buildReplyText = (body: string, ref: MsgRef): string =>
  `${body}\n\n${REPLY_PREFIX}${ref.mid} ${ref.addr}`;

export const buildBoostText = (ref: MsgRef): string => `${BOOST_PREFIX}${ref.mid} ${ref.addr}`;

const parseMarkerLine = (line: string): MsgRef | null => {
  const match = MARKER_LINE_RE.exec(line);
  if (!match) return null;
  const [, mid, addr] = match;
  if (!mid || !addr) return null;
  return { mid, addr };
};

/**
 * Tolerant parse: a reply marker must be the *final* line, preceded by a
 * blank line (as `buildReplyText` produces); a boost marker must be the
 * *entire* text. Anything else (marker-shaped text embedded elsewhere, or
 * malformed marker lines) is treated as plain body — we never misfire on
 * ordinary vanilla-DC messages that happen to contain similar glyphs.
 */
export const parseMarkers = (text: string): ParsedMarkers => {
  if (text.startsWith(BOOST_PREFIX)) {
    const rest = text.slice(BOOST_PREFIX.length);
    // Must be the whole text: no trailing newline/content after the marker.
    if (!rest.includes('\n')) {
      const boost = parseMarkerLine(rest);
      if (boost) return { body: '', boost };
    }
    return { body: text };
  }

  const lines = text.split('\n');
  const lastLine = lines[lines.length - 1] ?? '';
  if (lastLine.startsWith(REPLY_PREFIX)) {
    const reply = parseMarkerLine(lastLine.slice(REPLY_PREFIX.length));
    const precedingBlank = lines[lines.length - 2] === '';
    if (reply && precedingBlank) {
      const body = lines.slice(0, lines.length - 2).join('\n');
      return { body, reply };
    }
  }

  return { body: text };
};

/** Build the freeform `quotedText` bubble vanilla Delta Chat renders. */
export const buildQuotedText = (authorName: string, text: string, cap: number): string => {
  const capped = text.length > cap ? `${text.slice(0, cap)}…` : text;
  return `${authorName}: ${capped}`;
};

/**
 * Best-effort recovery of the author name + text from a quotedText bubble.
 * Looks for a "<name>: " prefix; if none is found (or it doesn't look like
 * a name), the whole string is treated as the text with a null author.
 */
export const parseQuotedAuthor = (
  quotedText: string,
): { authorName: string | null; text: string } => {
  const sepIndex = quotedText.indexOf(': ');
  if (sepIndex === -1) return { authorName: null, text: quotedText };
  const authorName = quotedText.slice(0, sepIndex);
  const text = quotedText.slice(sepIndex + 2);
  return { authorName, text };
};
