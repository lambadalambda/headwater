<script lang="ts">
	import type { LightboxAttribution, RenderableAttachment } from './attachments';
	import { attachmentTitle } from './attachments';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';
	import MediaStripThumb from './MediaStripThumb.svelte';
	import MediaStripKindBadge from './MediaStripKindBadge.svelte';
	import RichText from './RichText.svelte';
	import VideoAttachment from './VideoAttachment.svelte';
	import AudioAttachment from './AudioAttachment.svelte';

	type Props = {
		attachments: RenderableAttachment[];
		startIdx: number;
		attribution?: LightboxAttribution | null;
		onClose: () => void;
		onIdx: (i: number) => void;
	};

	let { attachments, startIdx, attribution = null, onClose, onIdx }: Props = $props();
	let att = $derived(attachments[startIdx]);
	let total = $derived(attachments.length);

	const prev = () => onIdx(Math.max(0, startIdx - 1));
	const next = () => onIdx(Math.min(total - 1, startIdx + 1));
</script>

<div
	class="lightbox-bg"
	role="button"
	tabindex="0"
	aria-label="Close lightbox"
	onclick={(e) => {
		if (e.target === e.currentTarget) onClose();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') onClose();
	}}
>
	<div class="lightbox" role="dialog" aria-modal="true" aria-label="Attachment lightbox">
		<div class="lightbox-head">
			<div class="lightbox-attr">
				{#if attribution}
					<Avatar variant="post" avClass={attribution.avClass} avBanner={attribution.avBanner} size={36} />
					<div class="lightbox-meta">
						<div class="lightbox-name"><RichText text={attribution.name} emojis={attribution.nameEmojis} linkMentions={false} /> <span>{attribution.handle}</span></div>
						<div class="lightbox-count">
							{startIdx + 1} of {total} ·{' '}
							{attachmentTitle(att)}
						</div>
					</div>
				{/if}
			</div>
			<div class="lightbox-tools">
				<button class="lightbox-btn lightbox-close" onclick={onClose} aria-label="Close">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
				</button>
			</div>
		</div>
		<div class="lightbox-body">
			{#if startIdx > 0}
				<button class="lightbox-nav lightbox-nav-l" onclick={prev} aria-label="Previous">
					<Icon name="arrowL" width={16} height={16} />
				</button>
			{/if}
		<div class="lightbox-viewer">
			{#key startIdx}
				{#if att.kind === 'photo'}
					<img class="lightbox-photo" src={att.src} alt={att.alt || ''} />
				{:else if att.kind === 'video'}
					<div class="lightbox-video"><VideoAttachment video={att} /></div>
				{:else if att.kind === 'audio'}
					<div class="lightbox-audio"><AudioAttachment audio={att} /></div>
				{/if}
			{/key}
		</div>
			{#if startIdx < total - 1}
				<button class="lightbox-nav lightbox-nav-r" onclick={next} aria-label="Next">
					<Icon name="arrowR" width={16} height={16} />
				</button>
			{/if}
		</div>
		{#if total > 1}
			<div class="lightbox-strip">
				{#each attachments as a, i}
					<button
						class="lightbox-thumb mst-{a.kind}{i === startIdx ? ' sel' : ''}"
						onclick={() => onIdx(i)}
						title={attachmentTitle(a)}
					>
						<MediaStripThumb att={a} />
						<MediaStripKindBadge kind={a.kind} />
					</button>
				{/each}
			</div>
		{/if}
		<div class="lightbox-foot">
			<span><kbd>←</kbd> <kbd>→</kbd> navigate</span>
			<span><kbd>Esc</kbd> close</span>
		</div>
	</div>
</div>
