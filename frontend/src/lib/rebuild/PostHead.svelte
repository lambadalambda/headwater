<script lang="ts">
	import type { CustomEmoji } from '$lib/social/types';
	import RelativeTime from './RelativeTime.svelte';
	import RichText from './RichText.svelte';
	import { profileHref } from './profile-links';

	type Props = {
		name?: string;
		nameEmojis?: CustomEmoji[];
		handle?: string;
		time?: string;
		createdAt?: string;
		post?: { name?: string; nameEmojis?: CustomEmoji[]; handle?: string; time?: string; createdAt?: string };
	};

	let { name, nameEmojis, handle, time, createdAt, post }: Props = $props();
	let n = $derived(name ?? post?.name);
	let emojis = $derived(nameEmojis ?? post?.nameEmojis ?? []);
	let h = $derived(handle ?? post?.handle);
	let created = $derived(createdAt ?? post?.createdAt);
	let t = $derived(time ?? post?.time);
	let href = $derived(profileHref(h));
</script>

<div class="post-head">
	<span class="post-name" title={n}><RichText text={n} {emojis} linkMentions={false} /></span>
	{#if href}
		<a class="post-handle" title={h} href={href}>{h}</a>
	{:else}
		<span class="post-handle" title={h}>{h}</span>
	{/if}
	<span class="post-time"><RelativeTime createdAt={created} fallback={t} /></span>
</div>
