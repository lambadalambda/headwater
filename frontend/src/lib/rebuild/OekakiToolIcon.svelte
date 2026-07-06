<script lang="ts">
	export type OekakiToolId = 'brush' | 'pen' | 'eraser' | 'fill' | 'eyedrop' | 'rect' | 'circle' | 'line' | 'text';

	type Props = {
		tool: OekakiToolId;
	};

	let { tool }: Props = $props();
</script>

<svg viewBox="0 0 24 24" style="width:16px;height:16px" aria-hidden="true">
	{#if tool === 'brush'}
		<path d="M3 21l4-1 11.5-11.5a2.121 2.121 0 00-3-3L4 17l-1 4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none" />
	{:else if tool === 'pen'}
		<path d="M15 4l5 5L9 20l-5 1 1-5L16 5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none" />
	{:else if tool === 'eraser'}
		<path d="M3 18l8-8 5 5-3 5H8l-5-2zM11 10l7-7 3 3-7 7" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none" />
	{:else if tool === 'fill'}
		<path d="M4 12l8-8 8 8-8 8-8-8zM20 18c0 1.1-.9 2-2 2s-2-.9-2-2 2-4 2-4 2 2.9 2 4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none" />
	{:else if tool === 'eyedrop'}
		<path d="M14 4l6 6-3 3-1-1-8 8-4 1 1-4 8-8-1-1 2-4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none" />
	{:else if tool === 'rect'}
		<rect x="4" y="6" width="16" height="12" stroke="currentColor" stroke-width="1.6" fill="none" />
	{:else if tool === 'circle'}
		<circle cx="12" cy="12" r="7" stroke="currentColor" stroke-width="1.6" fill="none" />
	{:else if tool === 'line'}
		<path d="M4 20L20 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
	{:else if tool === 'text'}
		<path d="M5 5h14M12 5v14M8 19h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none" />
	{/if}
</svg>
