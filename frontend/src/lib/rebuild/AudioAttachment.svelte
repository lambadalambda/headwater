<script lang="ts">
	import type { AudioAttachment as AudioAtt } from './attachments';
	import { parseDur, fmtDur } from './attachments';

	type Props = {
		audio: AudioAtt;
	};

	let { audio }: Props = $props();
	let audioElement = $state<HTMLAudioElement | null>(null);
	let playing = $state(false);
	let progress = $state(0.32);
	let seeded = $state(false);
	let sourceDuration = $state('');
	let sourceStartApplied = $state(false);

	let dur = $derived((audio.duration ?? sourceDuration) || (audio.src ? '' : '3:42'));
	let total = $derived(dur ? parseDur(dur) : 0);
	let cur = $derived(dur ? fmtDur(total * progress) : '');

	$effect(() => {
		if (!seeded) {
			progress = audio.start ?? (audio.src ? 0 : 0.32);
			seeded = true;
		}
	});

	$effect(() => {
		if (!playing || audio.src) return;
		const t = setInterval(() => {
			progress = progress >= 1 ? 0 : progress + 0.005;
		}, 100);
		return () => clearInterval(t);
	});

	$effect(() => {
		audio.src;
		audio.start;
		sourceDuration = '';
		sourceStartApplied = false;
	});

	let BARS = $derived(Array.from({ length: 56 }, (_, i) => {
		const seed = (audio.title || 'a').length;
		const v =
			Math.sin(i * 0.7 + seed) * 0.5 +
			Math.sin(i * 0.31 + seed * 0.4) * 0.3 +
			Math.cos(i * 1.1) * 0.2;
		return Math.max(0.18, Math.min(1, Math.abs(v) + 0.25));
	}));

	let playedIdx = $derived(Math.ceil(progress * BARS.length) - 1);
	let sliderValue = $derived(Math.round(progress * 100));
	let sliderText = $derived(dur ? `${cur} / ${dur}` : `${sliderValue}%`);

	let audioLabel = $derived(audio.title ?? audio.filename ?? 'Audio attachment');
	const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

	const setAudioProgress = (nextProgress: number) => {
		progress = clampProgress(nextProgress);
		if (audioElement && Number.isFinite(audioElement.duration) && audioElement.duration > 0) {
			audioElement.currentTime = progress * audioElement.duration;
		}
	};

	const syncFromSource = () => {
		if (!audioElement || !Number.isFinite(audioElement.duration) || audioElement.duration <= 0) return;
		if (!sourceStartApplied && audio.start != null) {
			sourceStartApplied = true;
			audioElement.currentTime = clampProgress(audio.start) * audioElement.duration;
		}
		sourceDuration = fmtDur(audioElement.duration);
		progress = clampProgress(audioElement.currentTime / audioElement.duration);
	};

	const toggle = () => {
		const nextPlaying = !playing;
		playing = nextPlaying;

		if (!audioElement) return;
		if (!nextPlaying) {
			audioElement.pause();
			return;
		}

		void audioElement.play().catch(() => {
			playing = false;
		});
	};

	const finishSource = () => {
		playing = false;
		progress = 0;
	};

	const seek = (e: PointerEvent) => {
		const el = e.currentTarget as HTMLElement;
		const r = el.getBoundingClientRect();
		const p = (e.clientX - r.left) / r.width;
		setAudioProgress(p);
	};

	const seekWithKeyboard = (e: KeyboardEvent) => {
		const step = e.shiftKey ? 0.1 : 0.05;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			setAudioProgress(progress - step);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			setAudioProgress(progress + step);
		} else if (e.key === 'Home') {
			e.preventDefault();
			setAudioProgress(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			setAudioProgress(1);
		}
	};
</script>

<div class="post-audio" data-post-ignore>
	<button
		class="pa-cover"
		type="button"
		onclick={toggle}
		aria-label={playing ? 'Pause' : 'Play'}
	>
		{#if audio.cover}
			<img src={audio.cover} alt="" class="pa-cover-img" />
		{/if}
		<span class="pa-cover-icon">
			{#if playing}
				<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-left:1px"><path d="M7 5l12 7-12 7V5z"/></svg>
			{/if}
		</span>
	</button>
	{#if audio.src}
		<audio
			class="pa-source"
			bind:this={audioElement}
			src={audio.src}
			preload="metadata"
			aria-label={audioLabel}
			onloadedmetadata={syncFromSource}
			ondurationchange={syncFromSource}
			onloadeddata={syncFromSource}
			ontimeupdate={syncFromSource}
			onplay={() => (playing = true)}
			onpause={() => (playing = false)}
			onended={finishSource}
		></audio>
	{/if}
	<div
		class="pa-bars"
		role="slider"
		tabindex="0"
		aria-label="Seek audio"
		aria-valuemin="0"
		aria-valuemax="100"
		aria-valuenow={sliderValue}
		aria-valuetext={sliderText}
		onpointerdown={seek}
		onkeydown={seekWithKeyboard}
	>
		{#each BARS as h, i}
			<span class="pa-bar {i <= playedIdx ? 'played' : ''}" style="height:{h * 100}%"></span>
		{/each}
	</div>
	<div class="pa-meta">
		<div class="pa-text">
			<span class="pa-title">{audio.title ?? audio.filename ?? 'audio'}</span>
			{#if audio.byline}
				<span class="pa-by"> · {audio.byline}</span>
			{/if}
		</div>
		{#if dur}
			<span class="pa-time">{cur} / {dur}</span>
		{/if}
	</div>
</div>
