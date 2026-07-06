<script lang="ts">
	import type { AudioAttachment as AudioAtt } from './attachments';

	type Props = {
		audio: AudioAtt;
		onPlay?: () => void;
	};

	let { audio, onPlay }: Props = $props();
	let playing = $state(false);

	const toggle = (e: MouseEvent) => {
		e.stopPropagation();
		playing = !playing;
		onPlay?.();
	};

	let BARS = $derived(Array.from({ length: 38 }, (_, i) => {
		const seed = (audio.title || 'a').length;
		const v = Math.sin(i * 0.7 + seed) * 0.5 + Math.cos(i * 1.1) * 0.3;
		return Math.max(0.2, Math.min(1, Math.abs(v) + 0.3));
	}));
</script>

<div class="compact-audio" data-post-ignore>
	<button class="cap-play" onclick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
		{#if audio.cover}
			<img src={audio.cover} alt="" class="cap-play-img" />
		{/if}
		<span class="cap-play-icon">
			{#if playing}
				<svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11" style="margin-left:1px"><path d="M7 5l12 7-12 7V5z"/></svg>
			{/if}
		</span>
	</button>
	<div class="cap-meta">
		<div class="cap-t">{audio.title}</div>
		<div class="cap-by">{audio.byline}</div>
	</div>
	{#if audio.src}
		<audio class="cap-native" src={audio.src} controls preload="metadata" aria-label={audio.title ?? 'Audio attachment'}></audio>
	{:else}
		<div class="cap-wave">
			{#each BARS as h}
				<span style="height:{h * 100}%"></span>
			{/each}
		</div>
		<span class="cap-d">{audio.duration}</span>
	{/if}
</div>
