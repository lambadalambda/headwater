import type { PleromaProfileView } from '$lib/pleroma/ui';
import type { CustomEmoji } from '$lib/social/types';
import type { Attachment, BannerVariant, PostLike } from './attachments';

export type ProfilePost = PostLike & {
	id: string | number;
	actionStatusId?: string;
	threadStatusId?: string;
	name: string;
	nameEmojis?: CustomEmoji[];
	handle: string;
	time: string;
	createdAt?: string;
	avClass?: string;
	avBanner?: BannerVariant;
	avatarUrl?: string | null;
	body: string;
	bodyEmojis?: CustomEmoji[];
	addressees?: string[];
	attachments?: Attachment[];
	replies: number;
	boosts: number;
	favs: number;
	copyJson?: unknown;
	actions: { reply: boolean; boost: boolean; fav: boolean };
};

export type ProfileMediaItem =
	| { kind: 'photo'; src: string; alt?: string }
	| { kind: 'video'; src?: string; alt?: string; title?: string }
	| { kind: 'audio'; title: string };

export type ProfileData = {
	profile: PleromaProfileView;
	posts: ProfilePost[];
	replies: ProfilePost[];
	pinned: ProfilePost[];
	media: ProfileMediaItem[];
};
