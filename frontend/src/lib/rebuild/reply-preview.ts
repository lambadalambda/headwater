import type { CustomEmoji } from '$lib/social/types';

export type ReplyPreview = {
	name: string;
	nameEmojis?: CustomEmoji[];
	authName?: string;
	petname?: string;
	handle: string;
	time: string;
	createdAt?: string;
	avatarUrl?: string | null;
	avClass?: string;
	body: string;
	cw?: string;
	replyingTo?: string | null;
	replyingToName?: string;
	replyingToPetname?: string;
};

export type ReplyPreviewLoader = {
	available: () => boolean;
	identity: () => string;
	load: (statusId: string) => Promise<ReplyPreview | null>;
};

export const replyPreviewLoaderContext = Symbol('reply-preview-loader');
