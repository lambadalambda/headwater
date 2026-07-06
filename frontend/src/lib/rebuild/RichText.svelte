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
	};

	let { text = '', emojis = [], mentionClass = '', linkMentions = true, linkUrls = false, mentionAccts = {} }: Props = $props();
	let parts = $derived(renderBodyText(text, emojis));
	const mentionTarget = (mention: string) => mentionAccts[mention.toLowerCase()] ?? mention;
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
		<a class={mentionClass} href={profileHref(mentionTarget(part.text)) ?? undefined} title={mentionTarget(part.text)}>{part.text}</a>
	{:else}
		<span class={mentionClass}>{part.text}</span>
	{/if}
{/each}
