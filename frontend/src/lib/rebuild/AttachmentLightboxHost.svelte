<script lang="ts">
	import type { LightboxAttribution, RenderableAttachment } from './attachments';
	import AttachmentLightbox from './AttachmentLightbox.svelte';

	type LightboxState = {
		attachments: RenderableAttachment[];
		startIdx: number;
		attribution?: LightboxAttribution | null;
	};

	let state = $state<LightboxState | null>(null);

	$effect(() => {
		const onOpen = (e: CustomEvent<LightboxState>) => {
			state = { ...e.detail };
		};
		window.addEventListener('pn-open-lightbox', onOpen as EventListener);
		return () => window.removeEventListener('pn-open-lightbox', onOpen as EventListener);
	});

	$effect(() => {
		if (!state) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') state = null;
			else if (e.key === 'ArrowLeft')
				state = state
					? { ...state, startIdx: Math.max(0, state.startIdx - 1) }
					: null;
			else if (e.key === 'ArrowRight')
				state = state
					? { ...state, startIdx: Math.min(state.attachments.length - 1, state.startIdx + 1) }
					: null;
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	});
</script>

{#if state}
	<AttachmentLightbox
		{...state}
		onClose={() => (state = null)}
		onIdx={(i) => {
			if (state) state = { ...state, startIdx: i };
		}}
	/>
{/if}
