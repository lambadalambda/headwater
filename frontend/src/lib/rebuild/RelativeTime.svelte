<script lang="ts">
	import { formatRelativeStatusTime } from '$lib/pleroma/ui';

	type Props = {
		createdAt?: string;
		fallback?: string;
		prefix?: string;
	};

	let { createdAt, fallback = '', prefix = '' }: Props = $props();
	let now = $state(Date.now());
	let label = $derived(createdAt ? formatRelativeStatusTime(createdAt, now) : fallback);

	$effect(() => {
		if (!createdAt || typeof window === 'undefined') return;

		now = Date.now();
		const timer = window.setInterval(() => {
			now = Date.now();
		}, 60_000);
		return () => window.clearInterval(timer);
	});
</script>

{#if label}{prefix}{label}{/if}
