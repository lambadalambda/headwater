import type { CustomEmoji } from '$lib/social/types';

const TEXT_TOKEN_RE = /(https?:\/\/[^\s<>"']+)|@[\w.]+(?:@[\w.-]+)?|:([A-Za-z0-9_+-]+):/gi;
const TRAILING_URL_PUNCTUATION = new Set(['.', ',', '!', '?', ';', ':']);
const TRAILING_URL_BRACKETS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

export type BodyPart =
	| string
	| { kind: 'link'; key: string; text: string; href: string }
	| { kind: 'mention'; key: string; text: string }
	| { kind: 'emoji'; key: string; shortcode: string; url: string; staticUrl?: string };

const countChar = (value: string, char: string) => value.split(char).length - 1;

const splitTrailingUrlPunctuation = (value: string) => {
	let text = value;
	let suffix = '';
	while (text) {
		const last = text.at(-1) ?? '';
		const matchingOpen = TRAILING_URL_BRACKETS[last];
		if (TRAILING_URL_PUNCTUATION.has(last) || (matchingOpen && countChar(text, last) > countChar(text, matchingOpen))) {
			suffix = last + suffix;
			text = text.slice(0, -1);
			continue;
		}

		break;
	}

	return { text, suffix };
};

const safeLink = (value: string) => {
	const { text, suffix } = splitTrailingUrlPunctuation(value);
	try {
		const url = new URL(text);
		return url.protocol === 'http:' || url.protocol === 'https:' ? { text, href: url.toString(), suffix } : null;
	} catch {
		return null;
	}
};

export const renderBodyText = (text: string | undefined, emojis: CustomEmoji[] = []): BodyPart[] => {
	if (!text) return [];
	const emojiByShortcode = new Map(emojis.map((emoji) => [emoji.shortcode, emoji]));
	const out: BodyPart[] = [];
	let lastIdx = 0;
	let match: RegExpExecArray | null;
	let key = 0;
	TEXT_TOKEN_RE.lastIndex = 0;
	while ((match = TEXT_TOKEN_RE.exec(text)) !== null) {
		const url = match[1];
		const shortcode = match[2];
		const emoji = shortcode ? emojiByShortcode.get(shortcode) : null;
		const link = url ? safeLink(url) : null;
		if ((shortcode && !emoji) || (url && !link)) continue;

		if (match.index > lastIdx) out.push(text.slice(lastIdx, match.index));
		if (link) {
			out.push({ kind: 'link', key: 'l' + key++, text: link.text, href: link.href });
			if (link.suffix) out.push(link.suffix);
		} else if (emoji) out.push({ kind: 'emoji', key: 'e' + key++, shortcode: emoji.shortcode, url: emoji.url, staticUrl: emoji.staticUrl });
		else {
			const text = match[0].replace(/[.,!?;:]+$/g, '');
			out.push({ kind: 'mention', key: 'm' + key++, text });
			if (text.length < match[0].length) out.push(match[0].slice(text.length));
		}
		lastIdx = match.index + match[0].length;
	}
	if (lastIdx < text.length) out.push(text.slice(lastIdx));
	return out;
};
