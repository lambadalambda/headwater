import type { TimelineCursor } from './types';

export type TimelineItem = {
	id: string | number;
};

export type TimelineLoadMoreStatus = 'idle' | 'loading' | 'error';

export type PaginatedTimelineSuccess<Item extends TimelineItem, ErrorView> = {
	status: 'success';
	data: Item[];
	nextCursor: TimelineCursor | null;
	loadMoreStatus: TimelineLoadMoreStatus;
	loadMoreError?: ErrorView;
};

export type PaginatedTimelineBaseState<ErrorView> =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'empty' }
	| { status: 'error'; error: ErrorView };

export type PaginatedTimelineState<Item extends TimelineItem, ErrorView> =
	| PaginatedTimelineBaseState<ErrorView>
	| PaginatedTimelineSuccess<Item, ErrorView>;

export const mergeTimelineItems = <Item extends TimelineItem>(current: Item[], next: Item[]) => {
	const seen = new Set(current.map((item) => item.id));
	return [
		...current,
		...next.filter((item) => {
			if (seen.has(item.id)) return false;
			seen.add(item.id);
			return true;
		})
	];
};

export const prependTimelineItems = <Item extends TimelineItem>(current: Item[], next: Item[]) => {
	const seen = new Set(current.map((item) => item.id));
	const uniqueNext = next.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});

	return [...uniqueNext, ...current];
};

export const queueNewerTimelineItems = <Item extends TimelineItem>(queued: Item[], current: Item[], incoming: Item[]) => {
	const currentIds = new Set(current.map((item) => item.id));
	const seenIncoming = new Set(currentIds);
	const uniqueIncoming = incoming.filter((item) => {
		if (seenIncoming.has(item.id)) return false;
		seenIncoming.add(item.id);
		return true;
	});
	const seen = new Set([...currentIds, ...uniqueIncoming.map((item) => item.id)]);
	const queuedOnly = queued.filter((item) => {
		if (seen.has(item.id)) return false;
		seen.add(item.id);
		return true;
	});

	return [...uniqueIncoming, ...queuedOnly];
};
