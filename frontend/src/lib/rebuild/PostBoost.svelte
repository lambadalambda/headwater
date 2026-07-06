<script lang="ts">
	import Avatar from './Avatar.svelte';
	import RelativeTime from './RelativeTime.svelte';
	import RichText from './RichText.svelte';
	import type { BoostAttribution } from './attachments';
	import { profileHref } from './profile-links';

	type Props = {
		boostedBy?: BoostAttribution;
		children: import('svelte').Snippet;
	};

	let { boostedBy, children }: Props = $props();
	let href = $derived(profileHref(boostedBy?.handle));
</script>

{#if boostedBy}
	<div class="post-boost">
		<div class="post-boost-attr">
			<span class="post-boost-tag">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="9" height="9" aria-hidden="true">
					<path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5" />
				</svg>
				boost
			</span>
			<Avatar variant="post" size={18} avClass={boostedBy.avClass} avBanner={boostedBy.avBanner} avatarUrl={boostedBy.avatarUrl} alt={`${boostedBy.name ?? boostedBy.handle ?? 'Booster'} avatar`} profileHref={href} className="post-boost-av" />
			{#if href}
				<a class="post-boost-name" href={href}><RichText text={boostedBy.name ?? boostedBy.handle} emojis={boostedBy.nameEmojis} linkMentions={false} /></a>
			{:else}
				<span class="post-boost-name"><RichText text={boostedBy.name ?? boostedBy.handle} emojis={boostedBy.nameEmojis} linkMentions={false} /></span>
			{/if}
			{#if boostedBy.handle}
				{#if href}
					<a class="post-boost-handle" href={href}>{boostedBy.handle}</a>
				{:else}
					<span class="post-boost-handle">{boostedBy.handle}</span>
				{/if}
			{/if}
			{#if boostedBy.createdAt || boostedBy.time}
				<span class="post-boost-time"><RelativeTime createdAt={boostedBy.createdAt} fallback={boostedBy.time} /></span>
			{/if}
		</div>
		<div class="post-boost-postcol">
			{@render children()}
		</div>
	</div>
{:else}
	{@render children()}
{/if}
