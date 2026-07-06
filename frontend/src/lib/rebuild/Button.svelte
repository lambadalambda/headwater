<script lang="ts">
	type Variant = 'primary' | 'secondary' | 'follow' | 'upload' | 'ghost';
	type Props = {
		variant?: Variant;
		type?: 'button' | 'submit';
		className?: string;
		disabled?: boolean;
		children?: import('svelte').Snippet;
		onclick?: (e: MouseEvent) => void;
	};

	let { variant = 'primary', type = 'button', className = '', disabled = false, children, onclick }: Props = $props();

	const variantClass = (v: Variant) =>
		v === 'primary' ? 'btn-primary' :
		v === 'secondary' ? 'btn-secondary' :
		v === 'follow' ? 'btn-follow' :
		v === 'upload' ? 'btn-upload' :
		v === 'ghost' ? 'tab-action' :
		'';
</script>

<button
	{type}
	class="{variantClass(variant)} {className}"
	{disabled}
	{onclick}
>
	{@render children?.()}
</button>
