<script lang="ts">
	type Props = {
		checked?: boolean;
		onchange?: (value: boolean) => void;
		ariaLabel?: string;
	};

	let { checked = false, onchange, ariaLabel }: Props = $props();
</script>

<div
	class="toggle {checked ? 'on' : ''}"
	role="switch"
	aria-checked={checked}
	aria-label={ariaLabel}
	tabindex="0"
	onclick={() => onchange?.(!checked)}
	onkeydown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onchange?.(!checked); } }}
></div>
