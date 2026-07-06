<script lang="ts">
	import type { RenderableAttachment } from './attachments';
	import { attachmentTitle } from './attachments';
	import MediaStripThumb from './MediaStripThumb.svelte';
	import MediaStripKindBadge from './MediaStripKindBadge.svelte';
	import VideoAttachment from './VideoAttachment.svelte';
	import AudioAttachment from './AudioAttachment.svelte';

	type Props = {
		attachments: RenderableAttachment[];
		onOpen?: (i: number) => void;
	};

	let { attachments, onOpen }: Props = $props();
	let heroIdx = $state(0);
	let hero = $derived(attachments[heroIdx]);
</script>

<div class="media-hero-wrap" data-post-ignore>
	<div class="media-hero">
		{#if hero.kind === 'photo'}
			<button class="media-hero-photo" onclick={() => onOpen?.(heroIdx)} title="Open">
				<img src={hero.src} alt={hero.alt || ''} />
				<span class="media-hero-expand">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="12" height="12"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</span>
			</button>
		{:else if hero.kind === 'video'}
			<VideoAttachment video={hero} />
		{:else if hero.kind === 'audio'}
			<AudioAttachment audio={hero} />
		{/if}
	</div>
	<div class="media-strip">
		{#each attachments as a, i}
			<button
				class="media-strip-tile {i === heroIdx ? 'sel' : ''} mst-{a.kind}"
				onclick={() => (heroIdx = i)}
				title={attachmentTitle(a)}
			>
				<MediaStripThumb att={a} />
				<MediaStripKindBadge kind={a.kind} />
			</button>
		{/each}
	</div>
</div>
