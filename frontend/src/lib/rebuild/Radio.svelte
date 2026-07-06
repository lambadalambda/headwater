<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { formatDuration, parseDuration, radioAlbum, RADIO_ALBUMS, type RadioView } from './radio';

	type Props = {
		inline?: boolean;
		forceOpen?: boolean;
		forceView?: RadioView;
	};

	let { inline = false, forceOpen = false, forceView = 'now' }: Props = $props();
	let open = $state(false);
	let visible = $state(true);
	let albumId = $state('outer-drive');
	let trackIdx = $state(0);
	let playing = $state(false);
	let progress = $state(0);
	let volume = $state(0.7);
	let view = $state<RadioView>('now');
	let progressTimer: number | undefined;

	let album = $derived(radioAlbum(albumId));
	let track = $derived(album.tracks[trackIdx] ?? album.tracks[0]);
	let totalSec = $derived(parseDuration(track.d));
	let elapsed = $derived(formatDuration(totalSec * progress));
	let className = $derived(`radio ${inline ? 'radio-inline ' : ''}${open ? 'open' : ''}`);

	const clearProgressTimer = () => {
		if (!progressTimer) return;
		window.clearInterval(progressTimer);
		progressTimer = undefined;
	};

	const next = () => {
		trackIdx = (trackIdx + 1) % album.tracks.length;
		progress = 0;
	};

	const prev = () => {
		trackIdx = (trackIdx - 1 + album.tracks.length) % album.tracks.length;
		progress = 0;
	};

	const togglePlay = () => {
		playing = !playing;
	};

	const pickAlbum = (id: string) => {
		albumId = id;
		trackIdx = 0;
		progress = 0;
		playing = true;
		view = 'now';
	};

	const pickTrack = (index: number) => {
		trackIdx = index;
		progress = 0;
		playing = true;
	};

	$effect(() => {
		clearProgressTimer();
		if (!playing) return;

		progressTimer = window.setInterval(() => {
			const nextProgress = progress + 0.4 / totalSec;
			if (nextProgress >= 1) {
				next();
				return;
			}
			progress = nextProgress;
		}, 400);

		return clearProgressTimer;
	});

	$effect(() => {
		if (typeof window === 'undefined') return;
		document.body.classList.toggle('pn-radio-playing', playing);
		window.dispatchEvent(new CustomEvent('pn-now-playing', {
			detail: {
				playing,
				track: { t: track.t, d: track.d },
				album: {
					title: album.title,
					artist: album.artist,
					year: album.year,
					tint: album.tint,
					genre: album.genre,
				},
			},
		}));
	});

	onMount(() => {
		open = forceOpen;
		view = forceView;
	});

	onDestroy(() => {
		clearProgressTimer();
		if (typeof document !== 'undefined') document.body.classList.remove('pn-radio-playing');
	});
</script>

{#if !visible}
	<button type="button" class="radio-revive" onclick={() => (visible = true)} title="Show radio" aria-label="Show radio">
		<svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px" aria-hidden="true"><path d="M4 11h16v9H4zM7 7l11-3M16 15h.01M9 16a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
	</button>
{:else}
	<div class={className} style={`--tint: ${album.tint};`}>
		<div class="radio-bar">
			<button type="button" class:playing class="radio-cover-sm" style={`background: ${album.coverGrad};`} onclick={() => (open = !open)} aria-label={open ? 'Collapse radio' : 'Open radio'} aria-expanded={open}>
				<span class="radio-cover-init">{album.coverInitial}</span>
				{#if playing}
					<span class="radio-eq" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
				{/if}
			</button>
			<button type="button" class="radio-bar-body" onclick={() => (open = !open)} aria-label={open ? 'Collapse radio details' : 'Expand radio details'}>
				<div class="radio-bar-eyebrow">
					<span class="radio-live-dot"></span>
					<span>PN.fm · {album.genre}</span>
				</div>
				<div class="radio-bar-title">{track.t}</div>
			</button>
			<button type="button" class="radio-bar-btn" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
				{#if playing}
					<svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="currentColor" style="width:13px;height:13px;margin-left:1px" aria-hidden="true"><path d="M7 5l12 7-12 7V5z" /></svg>
				{/if}
			</button>
			<button type="button" class="radio-bar-btn radio-bar-skip" onclick={next} aria-label="Next">
				<svg viewBox="0 0 24 24" fill="currentColor" style="width:11px;height:11px" aria-hidden="true"><path d="M5 5l9 7-9 7V5zM16 5h2v14h-2z" /></svg>
			</button>
			<button type="button" class="radio-bar-btn radio-bar-chev" onclick={() => (open = !open)} aria-label={open ? 'Collapse' : 'Expand'} aria-expanded={open}>
				<svg viewBox="0 0 24 24" fill="none" style={`width:11px;height:11px;${open ? 'transform:rotate(180deg)' : ''}`} aria-hidden="true"><path d="M6 15l6-6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</button>
			<div class="radio-bar-progress"><span style={`width: ${progress * 100}%;`}></span></div>
		</div>

		{#if open}
			<div class="radio-panel">
				<div class="radio-tabs">
					<button type="button" class:active={view === 'now'} class="radio-tab" aria-pressed={view === 'now'} onclick={() => (view = 'now')}>Now playing</button>
					<button type="button" class:active={view === 'albums'} class="radio-tab" aria-pressed={view === 'albums'} onclick={() => (view = 'albums')}>Albums <span class="radio-tab-c">{RADIO_ALBUMS.length}</span></button>
					<button type="button" class="radio-tab-x" onclick={() => { visible = false; open = false; }} title="Hide radio" aria-label="Hide radio">
						<svg viewBox="0 0 24 24" fill="none" style="width:13px;height:13px" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
					</button>
				</div>

				{#if view === 'now'}
					<div class="radio-now">
						<div class="radio-now-head">
							<div class="radio-cover-lg" style={`background: ${album.coverGrad};`}>
								<span class="radio-cover-lg-init">{album.coverInitial}</span>
								<div class:spin={playing} class="radio-disc-lg"><span></span></div>
							</div>
							<div class="radio-now-meta">
								<div class="radio-now-eye">
									<span class="radio-eye-dot"></span>
									<span>PN.fm · server radio · {album.genre}</span>
								</div>
								<div class="radio-now-track">{track.t}</div>
								<div class="radio-now-album">{album.title} <span>·</span> {album.artist} <span>·</span> {album.year}</div>
								<div class="radio-now-license">
									<svg viewBox="0 0 24 24" fill="none" style="width:11px;height:11px" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.4" /><path d="M9 10a3 3 0 116 0M9 14a3 3 0 106 0" stroke="currentColor" stroke-width="1.4" /></svg>
									<span>{album.license} · free to play, free to share</span>
								</div>
							</div>
						</div>

						<div class="radio-scrub-row">
							<span class="radio-time">{elapsed}</span>
							<div class="radio-scrub"><div class="radio-scrub-bar"><div class="radio-scrub-fill" style={`width: ${progress * 100}%;`}></div></div></div>
							<span class="radio-time radio-time-r">{track.d}</span>
						</div>

						<div class="radio-transport">
							<button type="button" class="radio-tx" title="Shuffle" aria-label="Shuffle">
								<svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px" aria-hidden="true"><path d="M16 3h5v5M21 3l-7 7M16 21h5v-5M21 21l-7-7M3 5l6 6M3 19l6-6 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
							</button>
							<button type="button" class="radio-tx" onclick={prev} aria-label="Previous">
								<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px" aria-hidden="true"><path d="M19 5l-9 7 9 7V5zM6 5h2v14H6z" /></svg>
							</button>
							<button type="button" class="radio-tx radio-tx-play" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
								{#if playing}
									<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
								{:else}
									<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;margin-left:2px" aria-hidden="true"><path d="M7 5l12 7-12 7V5z" /></svg>
								{/if}
							</button>
							<button type="button" class="radio-tx" onclick={next} aria-label="Next">
								<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px" aria-hidden="true"><path d="M5 5l9 7-9 7V5zM16 5h2v14h-2z" /></svg>
							</button>
							<button type="button" class="radio-tx" title="Loop" aria-label="Loop">
								<svg viewBox="0 0 24 24" fill="none" style="width:14px;height:14px" aria-hidden="true"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
							</button>
						</div>

						<div class="radio-vol-row">
							<svg viewBox="0 0 24 24" fill="none" style="width:13px;height:13px;color:var(--muted)" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5zM15 9a4 4 0 010 6M18 6a8 8 0 010 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
							<input type="range" min="0" max="1" step="0.01" bind:value={volume} class="radio-vol" aria-label="Volume" />
							<span class="radio-vol-l">{Math.round(volume * 100)}</span>
						</div>

						<div class="radio-tracklist">
							<div class="radio-tracklist-h">
								<span>Album · {album.title}</span>
								<span class="radio-tracklist-c">{album.tracks.length} tracks</span>
							</div>
							{#each album.tracks as albumTrack, i}
								<button type="button" class:cur={i === trackIdx} class="radio-track" onclick={() => pickTrack(i)}>
									<span class="radio-track-n">{String(i + 1).padStart(2, '0')}</span>
									<span class="radio-track-t">{albumTrack.t}</span>
									{#if i === trackIdx && playing}
										<span class="radio-eq sm" aria-hidden="true"><span></span><span></span><span></span></span>
									{/if}
									<span class="radio-track-d">{albumTrack.d}</span>
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="radio-albums">
						<div class="radio-albums-head">Curated by your instance · all tracks licensed for free play</div>
						{#each RADIO_ALBUMS as option (option.id)}
							<button type="button" class:sel={option.id === albumId} class="radio-album" onclick={() => pickAlbum(option.id)}>
								<div class="radio-album-cv" style={`background: ${option.coverGrad};`}><span>{option.coverInitial}</span></div>
								<div class="radio-album-meta">
									<div class="radio-album-t">{option.title}</div>
									<div class="radio-album-by">{option.artist} <span>·</span> {option.year}</div>
									<div class="radio-album-tags">
										<span class="radio-album-genre" style={`color: ${option.tint};`}>{option.genre}</span>
										<span class="radio-album-dot"></span>
										<span class="radio-album-lic">{option.license}</span>
										<span class="radio-album-dot"></span>
										<span>{option.tracks.length} tracks</span>
									</div>
								</div>
								<div class="radio-album-play">
									{#if option.id === albumId && playing}
										<span class="radio-eq sm" aria-hidden="true"><span></span><span></span><span></span></span>
									{:else}
										<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;margin-left:2px" aria-hidden="true"><path d="M7 5l12 7-12 7V5z" /></svg>
									{/if}
								</div>
							</button>
						{/each}
						<div class="radio-albums-foot">Tracks are loaded from your instance. <a href="#radio">Submit one →</a></div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
