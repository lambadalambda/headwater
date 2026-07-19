<script lang="ts">
	import Icon from './Icon.svelte';
	import Toggle from './Toggle.svelte';

	type Props = {
		autoInsertAtTop: boolean;
		onAutoInsertChange: (value: boolean) => void;
	};

	let { autoInsertAtTop, onAutoInsertChange }: Props = $props();
	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);
	let trigger = $state<HTMLButtonElement | null>(null);

	const close = (restoreFocus = false) => {
		open = false;
		if (restoreFocus) trigger?.focus();
	};
	const handleWindowPointerdown = (event: PointerEvent) => {
		if (open && event.target instanceof Node && !root?.contains(event.target)) close();
	};
	const handleWindowKeydown = (event: KeyboardEvent) => {
		if (open && event.key === 'Escape') close(true);
	};
</script>

<svelte:window onpointerdown={handleWindowPointerdown} onkeydown={handleWindowKeydown} />

<div class="timeline-settings" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="tab-action"
		class:active={open}
		aria-label="Timeline settings"
		aria-expanded={open}
		aria-controls={open ? 'timeline-settings-popover' : undefined}
		onclick={() => (open = !open)}
	>
		<Icon name="sliders" width={16} height={16} />
	</button>
	{#if open}
		<div id="timeline-settings-popover" class="timeline-settings-popover" role="region" aria-label="Timeline settings">
			<div class="timeline-settings-heading">Timeline settings</div>
			<div class="timeline-settings-row">
				<div class="timeline-settings-copy">
					<div class="timeline-settings-label">Auto-add new posts</div>
					<div class="timeline-settings-description">Insert incoming posts automatically while you are at the top.</div>
				</div>
				<Toggle checked={autoInsertAtTop} onchange={onAutoInsertChange} ariaLabel="Automatically add new posts at the top" />
			</div>
		</div>
	{/if}
</div>
