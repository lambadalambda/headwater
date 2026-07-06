import type {
	SocialNotificationActor,
	SocialNotificationData,
	SocialNotificationKind,
	SocialNotificationPostRef
} from '$lib/social/types';

export type NotificationKind = SocialNotificationKind;
export type NotificationGlyph = 'star' | 'repeat' | 'reply' | 'at' | 'userPlus' | 'chart' | 'smile';
export type NotificationActor = SocialNotificationActor;
export type NotificationPostRef = SocialNotificationPostRef;
export type NotificationData = SocialNotificationData;

export type NotificationKindMeta = {
	label: string;
	icon: NotificationGlyph;
	tint: string;
};

export type NotificationTabId = 'all' | 'mention' | 'boost' | 'fav' | 'follow';

export const NOTIF_KINDS: Record<NotificationKind, NotificationKindMeta> = {
	fav: { label: 'favorited your post', icon: 'star', tint: 'var(--accent)' },
	boost: { label: 'boosted your post', icon: 'repeat', tint: '#7dc4be' },
	reply: { label: 'replied to you', icon: 'reply', tint: 'var(--accent-ink)' },
	mention: { label: 'mentioned you', icon: 'at', tint: 'var(--accent-ink)' },
	follow: { label: 'followed you', icon: 'userPlus', tint: '#a48bd9' },
	follow_req: { label: 'requested to follow you', icon: 'userPlus', tint: '#e0b97a' },
	poll: { label: 'a poll you voted in has ended', icon: 'chart', tint: 'var(--muted)' },
	reaction: { label: 'reacted to your post', icon: 'smile', tint: '#e0b97a' },
	unknown: { label: 'sent a notification', icon: 'chart', tint: 'var(--muted)' },
};

export const SAMPLE_NOTIFS: NotificationData[] = [
	{ id: 'n1', kind: 'mention', read: false, time: '4m', t: 1, who: [{ name: 'orbit', handle: '@orbit@spacebear.net', av: 'sunset' }], post: { excerpt: 'hey @dreambyte - does the gradient hold up in dusk? curious what you tried.', tStamp: '4m ago' } },
	{ id: 'n2', kind: 'fav', read: false, time: '12m', t: 12, who: [{ name: 'kestrel', av: 'city' }, { name: 'mossy', av: 'sunset' }, { name: 'datagram', av: 'space' }, { name: 'lumen', av: 'sunset' }], post: { excerpt: 'a placeholder is more honest than a guess.', tStamp: '2h ago' } },
	{ id: 'n3', kind: 'follow', read: false, time: '22m', t: 22, who: [{ name: 'static.gif', handle: '@staticgif@modem.zone', av: 'space' }], bio: 'chiptune & sleep noise · CC BY 4.0' },
	{ id: 'n4', kind: 'reply', read: true, time: '1h', t: 60, who: [{ name: 'datagram', handle: '@datagram@retro.social', av: 'space' }], post: { excerpt: 'around the time the algorithm replaced the timeline.', tStamp: '1h ago' }, on: 'we used to log off. when did that stop being a thing.' },
	{ id: 'n5', kind: 'boost', read: true, time: '2h', t: 120, who: [{ name: 'lumen', av: 'sunset' }, { name: 'mossy', av: 'city' }, { name: 'kestrel', av: 'sunset' }], post: { excerpt: 'living in a soft world. quietly federating.', tStamp: '6h ago' } },
	{ id: 'n6', kind: 'follow_req', read: true, time: '4h', t: 240, who: [{ name: 'unknown.peer', handle: '@unknown@strange.host', av: 'space' }], bio: 'no bio · 0 posts' },
	{ id: 'n7', kind: 'fav', read: true, time: '8h', t: 480, who: [{ name: 'orbit', av: 'sunset' }], post: { excerpt: 'cassette label + vinyl needle = the move?', tStamp: 'yesterday' } },
	{ id: 'n8', kind: 'mention', read: true, time: '1d', t: 1440, who: [{ name: 'mossy', handle: '@mossy@garden.cafe', av: 'city' }], post: { excerpt: 'tagging @dreambyte for the soft palette discussion - would love your take', tStamp: 'yesterday' } },
	{ id: 'n9', kind: 'poll', read: true, time: '1d', t: 1500, who: [{ name: 'kestrel', av: 'sunset' }], post: { excerpt: 'which side wins? warm cassette · cold terminal · spinning vinyl', tStamp: '2d ago' } },
	{ id: 'n10', kind: 'follow', read: true, time: '2d', t: 2880, who: [{ name: 'warm.process', handle: '@warmprocess@drift.fm', av: 'sunset' }], bio: 'ambient process music · slow web' },
	{ id: 'n11', kind: 'boost', read: true, time: '3d', t: 4320, who: [{ name: 'datagram', av: 'space' }], post: { excerpt: 'a placeholder is more honest than a guess.', tStamp: '3d ago' } },
	{ id: 'n12', kind: 'reply', read: true, time: '4d', t: 5760, who: [{ name: 'lumen', handle: '@lumen@candle.house', av: 'sunset' }], post: { excerpt: 'softer than i expected. in a good way.', tStamp: '4d ago' }, on: 'the dusk theme has been a long time coming.' },
];

export const NOTIF_TABS: { id: NotificationTabId; label: string }[] = [
	{ id: 'all', label: 'All' },
	{ id: 'mention', label: 'Mentions' },
	{ id: 'boost', label: 'Boosts' },
	{ id: 'fav', label: 'Favorites' },
	{ id: 'follow', label: 'Follows' },
];

export const filterNotifs = (list: NotificationData[], tab: NotificationTabId): NotificationData[] => {
	if (tab === 'all') return list;
	if (tab === 'follow') return list.filter((notification) => notification.kind === 'follow' || notification.kind === 'follow_req');
	if (tab === 'fav') return list.filter((notification) => notification.kind === 'fav' || notification.kind === 'reaction');
	return list.filter((notification) => notification.kind === tab);
};

export const cloneNotifications = (list: NotificationData[] = SAMPLE_NOTIFS): NotificationData[] =>
	list.map((notification) => ({
		...notification,
		who: notification.who.map((actor) => ({ ...actor })),
		post: notification.post ? { ...notification.post } : undefined,
	}));
