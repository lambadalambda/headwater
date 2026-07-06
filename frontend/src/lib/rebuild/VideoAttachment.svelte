<script lang="ts">
	import VaporBanner from './VaporBanner.svelte';
	import type { VideoAttachment as VideoAtt } from './attachments';
	import { parseDur, fmtDur } from './attachments';
	import { primeVideoPreviewFrame, resetVideoPreviewOnPlay } from './videoPreview';

	type Props = {
		video: VideoAtt;
	};

	let { video }: Props = $props();
	let playing = $state(false);
	let muted = $state(true);
	let progress = $state(0.18);
	let seeded = $state(false);
	let previewPrimed = $state(false);
	let duotoneVideo = $state<HTMLVideoElement | null>(null);

	let dur = $derived(video.duration ?? (video.src ? '' : '2:14'));
	let total = $derived(dur ? parseDur(dur) : 0);
	let cur = $derived(fmtDur(total * progress));

	$effect(() => {
		if (!seeded) {
			progress = video.start ?? 0.18;
			seeded = true;
		}
	});

	$effect(() => {
		if (!playing) return;
		const t = setInterval(() => {
			progress = progress >= 1 ? 0 : progress + 0.008;
		}, 80);
		return () => clearInterval(t);
	});

	const onPreviewMetadata = (event: Event) => {
		if (!(event.currentTarget instanceof HTMLVideoElement)) return;
		previewPrimed = primeVideoPreviewFrame(event.currentTarget);
	};
	const onOverlayMetadata = (event: Event) => {
		if (!(event.currentTarget instanceof HTMLVideoElement)) return;
		primeVideoPreviewFrame(event.currentTarget);
	};
	const syncDuotoneFrame = (source: HTMLVideoElement) => {
		if (!duotoneVideo || !Number.isFinite(source.currentTime)) return;
		try {
			duotoneVideo.currentTime = source.currentTime;
		} catch {
			// Remote video can reject seeks until enough data is buffered.
		}
	};

	const onNativePlay = (event: Event) => {
		if (!(event.currentTarget instanceof HTMLVideoElement)) return;
		playing = true;
		previewPrimed = resetVideoPreviewOnPlay(event.currentTarget, previewPrimed);
	};
	const onNativeStop = (event: Event) => {
		if (event.currentTarget instanceof HTMLVideoElement) syncDuotoneFrame(event.currentTarget);
		playing = false;
	};
	const onNativeSeeked = (event: Event) => {
		if (!playing && event.currentTarget instanceof HTMLVideoElement) syncDuotoneFrame(event.currentTarget);
	};
</script>

<div class="post-video" class:playing data-post-ignore>
	<div class="pv-frame">
		{#if video.src}
			<!-- svelte-ignore a11y_media_has_caption -->
			<video class="pv-native" src={video.src} poster={video.posterUrl} controls preload="metadata" title={video.title ?? 'Video attachment'} onloadedmetadata={onPreviewMetadata} onplay={onNativePlay} onpause={onNativeStop} onended={onNativeStop} onseeked={onNativeSeeked}></video>
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={duotoneVideo} class="pv-duotone" src={video.src} poster={video.posterUrl} muted playsinline preload="metadata" aria-hidden="true" tabindex="-1" onloadedmetadata={onOverlayMetadata}></video>
		{:else}
			<VaporBanner variant={video.poster || 'sunset'} />
			<div class="pv-scrim {playing ? 'on' : ''}"></div>
			{#if !playing}
				<button class="pv-play" onclick={() => (playing = true)} aria-label="Play">
					<svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style="margin-left:3px"><path d="M7 5l12 7-12 7V5z"/></svg>
				</button>
			{/if}
		{/if}
		<div class="pv-chip pv-chip-tl">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M15 8l5-3v14l-5-3M3 7h12v10H3z" stroke-linejoin="round"/></svg>
			<span>VIDEO</span>
		</div>
		{#if dur}
			<div class="pv-chip pv-chip-tr">{dur}</div>
		{/if}
		{#if video.cc}
			<div class="pv-chip pv-chip-bl">CC</div>
		{/if}
		{#if !video.src}
			<div class="pv-controls">
				<button class="pv-ctrl" onclick={() => (playing = !playing)}>
					{#if playing}
						<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M7 5l12 7-12 7V5z"/></svg>
					{/if}
				</button>
				<div class="pv-time">{cur} <span>/ {dur}</span></div>
				<div class="pv-scrub">
					<div class="pv-scrub-bar"><div class="pv-scrub-fill" style="width:{progress * 100}%"></div></div>
				</div>
				<button class="pv-ctrl" onclick={() => (muted = !muted)} title={muted ? 'Unmute' : 'Mute'}>
					{#if muted}
						<svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 5L6 9H3v6h3l5 4V5zM16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
					{:else}
						<svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M11 5L6 9H3v6h3l5 4V5zM15 9a4 4 0 010 6M18 6a8 8 0 010 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
					{/if}
				</button>
				<button class="pv-ctrl" title="Fullscreen">
					<svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
			</div>
		{/if}
	</div>
	{#if video.caption}
		<div class="pv-caption">{video.caption}</div>
	{/if}
</div>
