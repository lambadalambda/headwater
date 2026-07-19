<script lang="ts">
	import type { PhotoAttachment } from './attachments';

	type Props = {
		photos: PhotoAttachment[];
		onOpen?: (i: number) => void;
	};

	let { photos, onOpen }: Props = $props();
	let n = $derived(Math.min(photos.length, 4));
	let revealed = $state<Record<number, boolean>>({});
	let readySources = $state<Record<string, string>>({});
	const retryDelays = [1000, 2000, 4000, 8000];

	const isPending = (photo: PhotoAttachment) => Boolean(photo.downloadState && photo.downloadState !== 'Done');
	const shouldProbe = (photo: PhotoAttachment) =>
		photo.downloadState === 'Available' || photo.downloadState === 'Failure' || photo.downloadState === 'InProgress';
	const pendingLabel = (photo: PhotoAttachment) =>
		photo.downloadState === 'Undecipherable'
			? 'Attachment unavailable'
			: photo.downloadState === 'Failure'
				? 'Retrying download'
				: 'Downloading';
	const retryUrl = (src: string, attempt: number) => {
		if (attempt === 0) return src;
		const separator = src.includes('?') ? '&' : '?';
		return `${src}${separator}headwater_retry=${attempt}`;
	};
	const formatBytes = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		const units = ['KB', 'MB', 'GB'];
		let value = bytes / 1024;
		let unit = 0;
		while (value >= 1024 && unit < units.length - 1) {
			value /= 1024;
			unit += 1;
		}
		return `${Number(value.toFixed(1))} ${units[unit]}`;
	};

	$effect(() => {
		const pending = photos.filter((photo) => shouldProbe(photo) && !readySources[photo.src]);
		const timers = new Set<number>();
		const probes = new Set<HTMLImageElement>();
		let active = true;

		const probe = (photo: PhotoAttachment, attempt: number) => {
			if (!active) return;
			const image = new Image();
			probes.add(image);
			image.onload = () => {
				probes.delete(image);
				if (active) readySources = { ...readySources, [photo.src]: image.src };
			};
			image.onerror = () => {
				probes.delete(image);
				if (!active || attempt >= retryDelays.length) return;
				const timer = window.setTimeout(() => {
					timers.delete(timer);
					probe(photo, attempt + 1);
				}, retryDelays[attempt]);
				timers.add(timer);
			};
			image.src = retryUrl(photo.src, attempt);
		};

		pending.forEach((photo) => probe(photo, 0));
		return () => {
			active = false;
			timers.forEach((timer) => window.clearTimeout(timer));
			probes.forEach((image) => {
				image.onload = null;
				image.onerror = null;
			});
		};
	});

	const handleClick = (i: number, p: PhotoAttachment) => {
		if (p.cw && !revealed[i]) {
			revealed = { ...revealed, [i]: true };
			return;
		}
		if (isPending(p) && !readySources[p.src]) return;
		onOpen?.(i);
	};
</script>

<div class="post-photos n{n}" data-post-ignore>
	{#each photos.slice(0, 4) as p, i}
		<button
			type="button"
			class="ph{p.cw && !revealed[i] ? ' cw' : ''}{isPending(p) && !readySources[p.src] ? ' pending' : ''}"
			aria-disabled={isPending(p) && !readySources[p.src] && (!p.cw || revealed[i])}
			onclick={() => handleClick(i, p)}
		>
			{#if isPending(p) && !readySources[p.src]}
				<span class="ph-pending" data-testid="pending-photo" role="status">
					<span class="ph-pending-name">{p.filename || 'Image attachment'}</span>
					{#if p.fileBytes !== undefined}<span class="ph-pending-size">{formatBytes(p.fileBytes)}</span>{/if}
					<span class="ph-pending-state">{pendingLabel(p)}</span>
				</span>
			{:else}
				{@const src = readySources[p.src] ?? p.src}
				<span class="ph-visual">
					<img class="ph-img ph-raw" {src} alt={p.alt || ''} loading="lazy" />
					<img class="ph-img ph-duotone" {src} alt="" aria-hidden="true" loading="lazy" />
				</span>
			{/if}
		</button>
	{/each}
</div>
