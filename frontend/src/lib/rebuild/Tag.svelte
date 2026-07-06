<script lang="ts">
	type Props = {
		className?: string;
		href?: string;
		children?: import('svelte').Snippet;
	};

	let { className = '', href, children }: Props = $props();
</script>

<a class="tag {className}" {href}>{@render children?.()}</a>
