<script lang="ts">
	import Avatar from './Avatar.svelte';
	import RelativeTime from './RelativeTime.svelte';
	import { pickQuoteHero } from './attachments';
	import type { Attachment, BannerVariant } from './attachments';
	import type { CustomEmoji } from '$lib/social/types';
	import RichText from './RichText.svelte';

	type QuotedPostData = {
		href?: string;
		name?: string;
		nameEmojis?: CustomEmoji[];
		handle?: string;
		time?: string;
		createdAt?: string;
		avClass?: string;
		avBanner?: BannerVariant;
		avatarUrl?: string | null;
		body?: string;
		bodyEmojis?: CustomEmoji[];
		mentionAccts?: Record<string, string>;
		attachments?: Attachment[];
		replies?: number;
		boosts?: number;
		favs?: number;
	};

	type Props = {
		quoted: QuotedPostData | undefined;
	};

	let { quoted }: Props = $props();

	let hero = $derived(pickQuoteHero(quoted?.attachments));
	let extraCount = $derived((quoted?.attachments?.length || 0) - (hero ? 1 : 0));
	let domain = $derived(quoted?.handle ? quoted.handle.split('@').slice(-1)[0] : '');
</script>

{#snippet embeddedContents()}
	<div class="quoted-head">
		<Avatar variant="post" size={28} avClass={quoted?.avClass} avBanner={quoted?.avBanner} avatarUrl={quoted?.avatarUrl} alt={`${quoted?.name ?? quoted?.handle ?? 'User'} avatar`} className="quoted-av-sm" />
		<span class="quoted-name"><RichText text={quoted?.name} emojis={quoted?.nameEmojis} linkMentions={false} /></span>
		<span class="quoted-handle">{quoted?.handle}</span>
		<span class="quoted-time"><RelativeTime createdAt={quoted?.createdAt} fallback={quoted?.time} /></span>
		<span class="quoted-ext">↗</span>
	</div>
	<div class="quoted-text">
		<RichText text={quoted?.body} emojis={quoted?.bodyEmojis} mentionAccts={quoted?.mentionAccts} mentionClass="post-mention-inline" linkMentions={false} linkUrls />
	</div>
	<div class="quoted-foot">
		{#if quoted?.replies != null}<span>↩ {quoted.replies}</span>{/if}
		{#if quoted?.boosts != null}<span>↻ {quoted.boosts}</span>{/if}
		{#if quoted?.favs != null}<span>★ {quoted.favs}</span>{/if}
		<span class="quoted-foot-end">view original →</span>
	</div>
{/snippet}

{#snippet smartContents()}
	<div class="quoted-hero">
		{#if hero?.kind === 'photo'}
			<img src={hero.src} alt={hero.alt || ''} />
		{:else if hero?.kind === 'video'}
			<div class="quoted-hero-video-bg"></div>
			<svg viewBox="0 0 24 24" fill="currentColor" class="quoted-hero-play"><path d="M7 5l12 7-12 7V5z"/></svg>
		{:else if hero?.kind === 'audio'}
			<div class="quoted-hero-audio">
				{#if hero.cover}
					<img src={hero.cover} alt="" />
				{:else}
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="22" height="22" style="color:rgba(255,255,255,0.75)"><path d="M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" stroke-linejoin="round"/></svg>
				{/if}
			</div>
		{/if}
		{#if extraCount > 0}
			<span class="quoted-hero-more">+{extraCount}</span>
		{/if}
	</div>
	<div class="quoted-body">
		<div class="quoted-kicker">QUOTE{domain ? ' · ' + domain : ''}</div>
		<div class="quoted-text">
			<RichText text={quoted?.body} emojis={quoted?.bodyEmojis} mentionAccts={quoted?.mentionAccts} mentionClass="post-mention-inline" linkMentions={false} linkUrls />
		</div>
		<div class="quoted-attr">
			<Avatar variant="post" size={22} avClass={quoted?.avClass} avBanner={quoted?.avBanner} avatarUrl={quoted?.avatarUrl} alt={`${quoted?.name ?? quoted?.handle ?? 'User'} avatar`} />
			<span class="quoted-attr-name"><RichText text={quoted?.name} emojis={quoted?.nameEmojis} linkMentions={false} /></span>
			<span class="quoted-handle">{quoted?.handle}</span>
			<span class="quoted-time"><RelativeTime createdAt={quoted?.createdAt} fallback={quoted?.time} prefix="· " /></span>
		</div>
	</div>
{/snippet}

{#if quoted}
	{#if !hero}
		{#if quoted.href}
			<a class="quoted-card quoted-embedded" href={quoted.href} data-post-ignore>{@render embeddedContents()}</a>
		{:else}
			<div class="quoted-card quoted-embedded" data-post-ignore>{@render embeddedContents()}</div>
		{/if}
	{:else}
		{#if quoted.href}
			<a class="quoted-card quoted-smart" href={quoted.href} data-post-ignore>{@render smartContents()}</a>
		{:else}
			<div class="quoted-card quoted-smart" data-post-ignore>{@render smartContents()}</div>
		{/if}
	{/if}
{/if}
