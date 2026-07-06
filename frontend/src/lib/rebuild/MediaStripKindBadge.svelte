<script lang="ts">
	import Icon from './Icon.svelte';
	import type { RenderableAttachment } from './attachments';

	type Props = {
		kind: RenderableAttachment['kind'];
	};

	let { kind }: Props = $props();
</script>

<span class="media-strip-kind">
	{#if kind === 'photo'}
		<Icon name="image" width={9} height={9} />
	{:else if kind === 'video'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="9" height="9"><path d="M15 8l5-3v14l-5-3M3 7h12v10H3z" stroke-linejoin="round"/></svg>
	{:else if kind === 'audio'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="9" height="9"><path d="M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" stroke-linejoin="round"/></svg>
	{/if}
</span>
