<script lang="ts">
	import { onMount } from 'svelte';

	let {
		value,
		onInput,
		onRemove,
		focusOnMount = false
	}: {
		value: string;
		onInput: (value: string) => void;
		onRemove: () => void;
		focusOnMount?: boolean;
	} = $props();

	let input: HTMLInputElement | null = null;

	onMount(() => {
		if (focusOnMount) input?.focus();
	});
</script>

<div class="composer-cw">
	<span class="composer-cw-l">
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M8 1.5l7 12.5H1L8 1.5z" />
			<path d="M8 6v4M8 12v.5" />
		</svg>
		CW
	</span>
	<input
		bind:this={input}
		class="composer-cw-input"
		aria-label="Content warning text"
		value={value}
		placeholder="One short line · what readers see before opening"
		maxlength="100"
		oninput={(event) => onInput(event.currentTarget.value)}
	/>
	<button type="button" class="composer-cw-x" onclick={onRemove} title="Remove CW" aria-label="Remove content warning">
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
			<path d="M4 4l8 8M12 4l-8 8" />
		</svg>
	</button>
</div>
