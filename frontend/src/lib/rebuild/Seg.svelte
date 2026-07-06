<script lang="ts">
	type SegOption = string | { value: string; label: string };
	type Props = {
		options: SegOption[];
		value?: string;
		onchange?: (value: string) => void;
		className?: string;
	};

	let { options, value = '', onchange, className = '' }: Props = $props();

	const resolveValue = (o: SegOption) => typeof o === 'string' ? o : o.value;
	const resolveLabel = (o: SegOption) => typeof o === 'string' ? o : o.label;
</script>

<div class="seg {className}">
	{#each options as option (resolveValue(option))}
		<button
			type="button"
			class={value === resolveValue(option) ? 'active' : ''}
			onclick={() => onchange?.(resolveValue(option))}
		>
			{resolveLabel(option)}
		</button>
	{/each}
</div>
