<script lang="ts">
	import type { CustomEmoji } from '$lib/social/types';
	import PetnameChip from './PetnameChip.svelte';
	import UnconfirmedChip from './UnconfirmedChip.svelte';
	import RelativeTime from './RelativeTime.svelte';
	import RichText from './RichText.svelte';
	import { profileHref } from './profile-links';

	type Props = {
		name?: string;
		nameEmojis?: CustomEmoji[];
		authName?: string;
		petname?: string;
		handle?: string;
		time?: string;
		createdAt?: string;
		authorUnconfirmed?: boolean;
		post?: { name?: string; nameEmojis?: CustomEmoji[]; authName?: string; petname?: string; authorUnconfirmed?: boolean; handle?: string; time?: string; createdAt?: string };
	};

	let { name, nameEmojis, authName, petname, authorUnconfirmed, handle, time, createdAt, post }: Props = $props();
	let unconfirmed = $derived(authorUnconfirmed ?? post?.authorUnconfirmed ?? false);
	let n = $derived(name ?? post?.name);
	let emojis = $derived(nameEmojis ?? post?.nameEmojis ?? []);
	// Petnames (meta/issues/petnames.md): when I've set one, the main name shows
	// THEIR self-chosen name and my petname renders as a separate chip — never
	// silently substituted (n === petname in that case, since displayName
	// prefers the local override).
	let pet = $derived(petname ?? post?.petname);
	let mainName = $derived(pet ? ((authName ?? post?.authName) || n) : n);
	let h = $derived(handle ?? post?.handle);
	let created = $derived(createdAt ?? post?.createdAt);
	let t = $derived(time ?? post?.time);
	let href = $derived(profileHref(h));
</script>

<div class="post-head">
	<span class="post-name" title={mainName}><RichText text={mainName} {emojis} linkMentions={false} /></span>
	{#if pet}<PetnameChip petname={pet} />{/if}
	{#if unconfirmed}<UnconfirmedChip />{/if}
	{#if href}
		<a class="post-handle" title={h} href={href}>{h}</a>
	{:else}
		<span class="post-handle" title={h}>{h}</span>
	{/if}
	<span class="post-time"><RelativeTime createdAt={created} fallback={t} /></span>
</div>
