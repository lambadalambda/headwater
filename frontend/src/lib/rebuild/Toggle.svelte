<script lang="ts">
	type Props = {
		checked?: boolean;
		onchange?: (value: boolean) => void;
	};

	let { checked = false, onchange }: Props = $props();
</script>

<div
	class="toggle {checked ? 'on' : ''}"
	role="switch"
	aria-checked={checked}
	tabindex="0"
	onclick={() => onchange?.(!checked)}
	onkeydown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onchange?.(!checked); } }}
></div>
