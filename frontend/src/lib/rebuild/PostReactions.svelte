<script lang="ts">
	import type { PleromaReactionView } from '$lib/pleroma/ui';

	type Props = {
		reactions?: PleromaReactionView[];
		onToggle?: (reaction: PleromaReactionView) => void;
		onAdd?: (anchor: HTMLElement) => void;
	};

	let { reactions = [], onToggle, onAdd }: Props = $props();

	const ROT = [-1.6, 1.2, -0.7, 1.8, -1.3, 0.6];
	const reactionTitle = (reaction: PleromaReactionView) => (reaction.url ? `:${reaction.name}:` : reaction.name);
	const reactionLabel = (reaction: PleromaReactionView) =>
		`${reactionTitle(reaction)} · ${reaction.count} ${reaction.count === 1 ? 'reaction' : 'reactions'}${reaction.me ? ' · you reacted' : ''}`;
</script>

{#if reactions.length > 0}
	<div class="pm-reactions pm-v3c" data-testid="post-reactions">
		{#each reactions as reaction, index (reaction.name)}
			<div class="pm-v3c-cell">
				<button
					type="button"
					class="pm-stamp pm-v3c-stamp"
					class:you={reaction.me}
					style={`transform: rotate(${ROT[index % ROT.length]}deg)`}
					title={reactionTitle(reaction)}
					aria-label={reactionLabel(reaction)}
					aria-pressed={reaction.me}
					disabled={!onToggle}
					onclick={() => onToggle?.(reaction)}
				>
					<span class="pm-stamp-art">
						{#if reaction.url}
							<img class="pm-v3c-custom" src={reaction.url} alt={`:${reaction.name}:`} loading="lazy" decoding="async" />
						{:else}
							<span class="pm-emoji pm-v3c-emoji">{reaction.glyph}</span>
						{/if}
					</span>
				</button>
				<div class="pm-v3c-count" class:you={reaction.me}>{reaction.count}</div>
			</div>
		{/each}
		<div class="pm-v3c-cell">
			<button type="button" class="pm-stamp pm-v3c-stamp pm-v3c-add" style="transform: rotate(-0.6deg)" title={onAdd ? 'Add reaction' : 'Sign in to react'} aria-label="Add reaction" aria-haspopup={onAdd ? 'dialog' : undefined} disabled={!onAdd} data-emoji-trigger onclick={(event) => onAdd?.(event.currentTarget)}>
				<span class="pm-stamp-art">
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="11" height="11" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
				</span>
			</button>
			<div class="pm-v3c-count pm-v3c-count-add">add</div>
		</div>
	</div>
{/if}
