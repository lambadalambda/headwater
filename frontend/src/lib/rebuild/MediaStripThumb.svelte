<script lang="ts">
	import type { RenderableAttachment } from './attachments';
	import { primeVideoPreviewFrame } from './videoPreview';

	type Props = {
		att: RenderableAttachment;
	};

	let { att }: Props = $props();

	const onPreviewMetadata = (event: Event) => {
		if (!(event.currentTarget instanceof HTMLVideoElement)) return;
		primeVideoPreviewFrame(event.currentTarget);
	};
</script>

{#if att.kind === 'photo'}
	<img src={att.src} alt="" />
{:else if att.kind === 'video'}
	{#if att.src}
		<!-- svelte-ignore a11y_media_has_caption -->
		<video class="media-strip-preview" src={att.src} poster={att.posterUrl} muted playsinline preload="metadata" aria-hidden="true" tabindex="-1" onloadedmetadata={onPreviewMetadata}></video>
		<!-- svelte-ignore a11y_media_has_caption -->
		<video class="media-strip-duotone" src={att.src} poster={att.posterUrl} muted playsinline preload="metadata" aria-hidden="true" tabindex="-1" onloadedmetadata={onPreviewMetadata}></video>
	{:else if att.posterUrl}
		<img src={att.posterUrl} alt="" />
		<img class="media-strip-duotone" src={att.posterUrl} alt="" aria-hidden="true" />
	{:else}
		<div class="mst-video-bg"></div>
	{/if}
	<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color:white;position:relative;z-index:1;margin-left:1px"><path d="M7 5l12 7-12 7V5z"/></svg>
{:else if att.kind === 'audio'}
	<div class="mst-audio-bg">
		{#if att.cover}
			<img src={att.cover} alt="" />
		{:else}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="16" height="16" style="color:rgba(255,255,255,0.7)"><path d="M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" stroke-linejoin="round"/></svg>
		{/if}
	</div>
{/if}
