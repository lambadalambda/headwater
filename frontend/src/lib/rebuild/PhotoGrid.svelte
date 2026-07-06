<script lang="ts">
	import type { PhotoAttachment } from './attachments';

	type Props = {
		photos: PhotoAttachment[];
		onOpen?: (i: number) => void;
	};

	let { photos, onOpen }: Props = $props();
	let n = $derived(Math.min(photos.length, 4));
	let revealed = $state<Record<number, boolean>>({});

	const handleClick = (i: number, p: PhotoAttachment) => {
		if (p.cw && !revealed[i]) {
			revealed = { ...revealed, [i]: true };
			return;
		}
		onOpen?.(i);
	};
</script>

<div class="post-photos n{n}" data-post-ignore>
	{#each photos.slice(0, 4) as p, i}
		<button
			type="button"
			class="ph{p.cw && !revealed[i] ? ' cw' : ''}"
			onclick={() => handleClick(i, p)}
		>
			<span class="ph-visual">
				<img class="ph-img ph-raw" src={p.src} alt={p.alt || ''} loading="lazy" />
				<img class="ph-img ph-duotone" src={p.src} alt="" aria-hidden="true" loading="lazy" />
			</span>
		</button>
	{/each}
</div>
