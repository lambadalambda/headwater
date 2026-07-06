import type { CustomEmoji } from '$lib/social/types';

export type BannerVariant = 'sunset' | 'pixel-window' | 'city' | 'space';

export const bannerVariants: BannerVariant[] = ['sunset', 'pixel-window', 'city', 'space'];

export const isBannerVariant = (value: string | undefined): value is BannerVariant =>
	bannerVariants.some((variant) => variant === value);

export type PhotoAttachment = {
	kind: 'photo';
	src: string;
	alt?: string;
	cw?: boolean;
	filename?: string;
};

export type VideoAttachment = {
	kind: 'video';
	src?: string;
	posterUrl?: string;
	poster?: BannerVariant;
	title?: string;
	duration?: string;
	cc?: boolean;
	caption?: string;
	start?: number;
	filename?: string;
};

export type AudioAttachment = {
	kind: 'audio';
	src?: string;
	title?: string;
	byline?: string;
	duration?: string;
	cover?: string;
	start?: number;
	filename?: string;
};

export type PollChoice = {
	id?: string;
	label: string;
	votes?: number;
};

export type PollAttachment = {
	kind: 'poll';
	id?: string;
	choices?: PollChoice[];
	totalVotes?: number;
	multi?: boolean;
	endsIn?: string;
	endedAgo?: string;
	myVote?: string | string[] | null;
	voted?: boolean;
	expired?: boolean;
};

export type RenderableAttachment = PhotoAttachment | VideoAttachment | AudioAttachment;
export type Attachment = RenderableAttachment | PollAttachment;

export type BoostAttribution = {
	name?: string;
	nameEmojis?: CustomEmoji[];
	handle?: string;
	time?: string;
	createdAt?: string;
	avClass?: string;
	avBanner?: BannerVariant;
	avatarUrl?: string | null;
};

export type LegacyPhotoAttachment = Omit<PhotoAttachment, 'kind'> & { kind?: 'photo' };
export type LegacyVideoAttachment = Omit<VideoAttachment, 'kind'> & { kind?: 'video' };
export type LegacyAudioAttachment = Omit<AudioAttachment, 'kind'> & { kind?: 'audio' };

export type PostLike = {
	cw?: string;
	attachments?: Attachment[];
	photos?: LegacyPhotoAttachment[];
	video?: LegacyVideoAttachment;
	audio?: LegacyAudioAttachment;
	media?: BannerVariant;
	avBanner?: BannerVariant;
	boostedBy?: BoostAttribution;
	[key: string]: unknown;
};

export type NoLayout = { type: 'none' };
export type SingleLayout = { type: 'single'; attachment: RenderableAttachment };
export type PhotoGridLayout = { type: 'photoGrid'; photos: PhotoAttachment[] };
export type PhotoAudioLayout = { type: 'photoAudio'; photo: PhotoAttachment; audio: AudioAttachment };
export type PhotosAudioLayout = { type: 'photosAudio'; photos: PhotoAttachment[]; audio: AudioAttachment };
export type HeroStripLayout = { type: 'heroStrip'; attachments: RenderableAttachment[] };

export type AttachmentLayout =
	| NoLayout
	| SingleLayout
	| PhotoGridLayout
	| PhotoAudioLayout
	| PhotosAudioLayout
	| HeroStripLayout;

export const isRenderableAttachment = (attachment: Attachment): attachment is RenderableAttachment => attachment.kind !== 'poll';

export const pickAttachmentLayout = (attachments: Attachment[] | undefined): AttachmentLayout => {
	const renderableAttachments = (attachments ?? []).filter(isRenderableAttachment);
	if (renderableAttachments.length === 0) return { type: 'none' };
	const photos = renderableAttachments.filter((a): a is PhotoAttachment => a.kind === 'photo');
	const videos = renderableAttachments.filter((a): a is VideoAttachment => a.kind === 'video');
	const audios = renderableAttachments.filter((a): a is AudioAttachment => a.kind === 'audio');

	if (renderableAttachments.length === 1) {
		return { type: 'single', attachment: renderableAttachments[0] };
	}
	if (photos.length === renderableAttachments.length && photos.length <= 4) {
		return { type: 'photoGrid', photos };
	}
	if (photos.length === 1 && audios.length === 1 && videos.length === 0) {
		return { type: 'photoAudio', photo: photos[0], audio: audios[0] };
	}
	if (photos.length >= 2 && photos.length <= 4 && audios.length === 1 && videos.length === 0) {
		return { type: 'photosAudio', photos, audio: audios[0] };
	}
	return { type: 'heroStrip', attachments: renderableAttachments };
};

export const normalizeAttachments = (post: PostLike): Attachment[] => {
	if (post.attachments) return post.attachments;
	const out: Attachment[] = [];
	if (post.photos) post.photos.forEach((p) => out.push({ ...p, kind: 'photo' }));
	if (post.video) out.push({ ...post.video, kind: 'video' });
	if (post.audio) out.push({ ...post.audio, kind: 'audio' });
	return out;
};

export const normalizeRenderableAttachments = (post: PostLike): RenderableAttachment[] => normalizeAttachments(post).filter(isRenderableAttachment);

export const attachmentTitle = (attachment: Attachment): string => {
	if (attachment.kind === 'photo') return attachment.filename || attachment.alt || 'photo';
	if (attachment.kind === 'video') return attachment.title || attachment.filename || 'video';
	if (attachment.kind === 'poll') return 'poll';
	return attachment.title || attachment.filename || 'audio';
};

export const parseDur = (s: string): number => {
	const [m, sec] = s.split(':').map(Number);
	return m * 60 + sec;
};

export const fmtDur = (t: number): string => {
	const m = Math.floor(t / 60);
	const s = Math.floor(t % 60);
	return m + ':' + String(s).padStart(2, '0');
};

export type LightboxAttribution = {
	name?: string;
	nameEmojis?: CustomEmoji[];
	handle?: string;
	avClass?: string;
	avBanner?: BannerVariant;
};

export const openLightbox = (
	attachments: RenderableAttachment[],
	startIdx = 0,
	attribution: LightboxAttribution | null = null
) => {
	window.dispatchEvent(
		new CustomEvent('pn-open-lightbox', {
			detail: { attachments, startIdx, attribution },
		})
	);
};

export const pickQuoteHero = (
	attachments: Attachment[] | undefined
): Attachment | null => {
	if (!attachments || !attachments.length) return null;
	const photo = attachments.find((a) => a.kind === 'photo');
	return photo || attachments.find((a) => a.kind !== 'poll') || null;
};
