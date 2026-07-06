<script lang="ts">
	type Props = {
		className?: string;
		children?: import('svelte').Snippet;
	};

	let { className = '', children }: Props = $props();
</script>

<span class="pill {className}">{@render children?.()}</span>
