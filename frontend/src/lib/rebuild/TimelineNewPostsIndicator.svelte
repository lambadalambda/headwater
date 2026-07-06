<script lang="ts">
	import Button from './Button.svelte';

	type Props = {
		count: number;
		onActivate: () => void;
	};

	let { count, onActivate }: Props = $props();
</script>

{#if count > 0}
	<div class="timeline-new-posts" aria-live="polite">
		<Button variant="secondary" className="timeline-new-posts-button" onclick={onActivate}>
			{count} new posts
		</Button>
	</div>
{/if}
