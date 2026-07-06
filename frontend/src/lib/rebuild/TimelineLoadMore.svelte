<script lang="ts">
	import type { TimelineLoadMoreStatus } from '$lib/pleroma/timeline-state';
	import Button from './Button.svelte';

	type RequestErrorView = {
		title: string;
		message: string;
		retryable: boolean;
	};
	type Props = {
		nextCursor: unknown | null;
		loadMoreStatus: TimelineLoadMoreStatus;
		loadMoreError?: RequestErrorView;
		onLoadMore: () => void;
		loadingLabel?: string;
		terminalLabel?: string;
		terminalDescription?: string;
	};

	let {
		nextCursor,
		loadMoreStatus,
		loadMoreError,
		onLoadMore,
		loadingLabel = 'Loading older posts',
		terminalLabel = 'No older posts',
		terminalDescription = 'You have reached the end of this loaded timeline.'
	}: Props = $props();
</script>

{#if loadMoreStatus === 'loading'}
	<div class="request-state request-pagination" role="status" aria-label="Timeline pagination status">{loadingLabel}</div>
{:else if loadMoreStatus === 'error' && loadMoreError}
	<div class="request-state request-error request-pagination">
		<h2>{loadMoreError.title}</h2>
		<p>{loadMoreError.message}</p>
		{#if loadMoreError.retryable}
			<Button variant="secondary" onclick={onLoadMore}>Retry load more</Button>
		{/if}
	</div>
{:else if nextCursor}
	<div class="request-state request-pagination">
		<Button variant="secondary" onclick={onLoadMore}>Load more</Button>
	</div>
{:else}
	<div class="timeline-terminal" data-testid="timeline-terminal">
		<span>{terminalLabel}</span>
		{#if terminalDescription}<small>{terminalDescription}</small>{/if}
	</div>
{/if}
