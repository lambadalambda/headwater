<script lang="ts">
	import { onMount } from 'svelte';

	type NowPlayingState = {
		playing: boolean;
		track?: { t?: string; title?: string };
		album?: { artist?: string; tint?: string };
	};

	type Props = {
		playing?: boolean | undefined;
		track?: string;
		artist?: string;
		tint?: string;
		compact?: boolean;
		hidePausedLabel?: boolean;
	};

	let {
		playing,
		track,
		artist,
		tint,
		compact = false,
		hidePausedLabel = false,
	}: Props = $props();

	let nowPlaying = $state<NowPlayingState | null>(null);
	let resolvedPlaying = $derived(playing ?? nowPlaying?.playing ?? false);
	let resolvedTrack = $derived(track ?? nowPlaying?.track?.t ?? nowPlaying?.track?.title);
	let resolvedArtist = $derived(artist ?? nowPlaying?.album?.artist);
	let resolvedTint = $derived(tint ?? nowPlaying?.album?.tint ?? 'var(--accent-ink)');
	let className = $derived(`now-playing-line ${resolvedPlaying ? 'playing' : 'paused'}${compact ? ' compact' : ''}`);

	onMount(() => {
		const onNowPlaying = (event: Event) => {
			if (event instanceof CustomEvent) nowPlaying = event.detail as NowPlayingState;
		};
		window.addEventListener('pn-now-playing', onNowPlaying);
		return () => window.removeEventListener('pn-now-playing', onNowPlaying);
	});
</script>

{#if resolvedTrack && resolvedArtist}
	<div class={className} style={`--np-tint: ${resolvedTint};`}>
		<span class="np-glyph">
			{#if resolvedPlaying}
				<span class="np-eq" aria-hidden="true"><span></span><span></span><span></span></span>
			{:else}
				<svg viewBox="0 0 12 12" style="width:9px;height:9px" aria-hidden="true">
					<rect x="3" y="2" width="2" height="8" fill="currentColor" />
					<rect x="7" y="2" width="2" height="8" fill="currentColor" />
				</svg>
			{/if}
		</span>
		<span class="np-text">
			<span class="np-track">{resolvedTrack}</span>
			<span class="np-sep"> · </span>
			<span class="np-artist">{resolvedArtist}</span>
		</span>
		{#if !resolvedPlaying && !hidePausedLabel}
			<span class="np-state">paused</span>
		{/if}
	</div>
{/if}
