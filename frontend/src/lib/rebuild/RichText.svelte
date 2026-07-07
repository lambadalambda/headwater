<script lang="ts">
	import type { CustomEmoji } from '$lib/social/types';
	import { renderBodyText } from './mentions';
	import { profileHref } from './profile-links';

	type Props = {
		text?: string;
		emojis?: CustomEmoji[];
		mentionClass?: string;
		linkMentions?: boolean;
		linkUrls?: boolean;
		mentionAccts?: Record<string, string>;
		/** Handle (lowercased) -> label to render instead of the raw token (petname/name). */
		mentionNames?: Record<string, string>;
	};

	let { text = '', emojis = [], mentionClass = '', linkMentions = true, linkUrls = false, mentionAccts = {}, mentionNames = {} }: Props = $props();
	let parts = $derived(renderBodyText(text, emojis));
	const mentionTarget = (mention: string) => mentionAccts[mention.toLowerCase()] ?? mention;
	// A mention token renders as the person's NAME when known (chatmail local
	// parts are random registration strings); the full handle stays the title.
	const mentionLabel = (mention: string) => {
		const name = mentionNames[mention.toLowerCase()] ?? mentionNames[mentionTarget(mention).toLowerCase()];
		return name ? `@${name}` : mention;
	};
</script>

{#each parts as part, i (typeof part === 'string' ? `t${i}` : part.key)}
	{#if typeof part === 'string'}
		{part}
	{:else if part.kind === 'emoji'}
		<img class="custom-emoji" src={part.url} alt={`:${part.shortcode}:`} title={`:${part.shortcode}:`} loading="lazy" decoding="async" />
	{:else if part.kind === 'link'}
		{#if linkUrls}
			<a class={mentionClass} href={part.href} target="_blank" rel="ugc noopener noreferrer">{part.text}</a>
		{:else}
			{part.text}
		{/if}
	{:else if linkMentions}
		<a class={mentionClass} href={profileHref(mentionTarget(part.text)) ?? undefined} title={mentionTarget(part.text)}>{mentionLabel(part.text)}</a>
	{:else}
		<span class={mentionClass}>{mentionLabel(part.text)}</span>
	{/if}
{/each}
