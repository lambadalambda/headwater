<script lang="ts">
	import Avatar from './Avatar.svelte';
	import RichText from './RichText.svelte';
	import type { PleromaChatView } from '$lib/pleroma/ui';

	type Props = {
		chat: PleromaChatView;
		href: string;
	};

	let { chat, href }: Props = $props();
	let avatarPost = $derived({
		name: chat.account.displayName,
		handle: chat.account.handle,
		avatarUrl: chat.account.avatarUrl,
		avClass: chat.account.avatarUrl ? 'av-orb' : 'av-grad-2'
	});
</script>

<a class="chat-row" class:unread={chat.unread > 0} {href} data-chat-id={chat.id} aria-label={`Conversation with ${chat.account.displayName}${chat.unread > 0 ? `, ${chat.unread} unread` : ''}`}>
	<Avatar post={avatarPost} alt={`${chat.account.displayName} avatar`} size={40} className="chat-row-av" />
	<div class="chat-row-main">
		<div class="chat-row-top">
			<span class="chat-row-name"><RichText text={chat.account.displayName} emojis={chat.account.emojis} linkMentions={false} /></span>
			<span class="chat-row-handle">{chat.account.handle}</span>
			<span class="chat-row-time">{chat.time}</span>
		</div>
		<div class="chat-row-bottom">
			<span class="chat-row-excerpt">{#if chat.lastMessage}{#if chat.lastMessageOwn}<span class="chat-row-you">You: </span>{/if}{chat.lastMessage}{:else}No messages yet{/if}</span>
			{#if chat.unread > 0}<span class="chat-row-unread">{chat.unread}</span>{/if}
		</div>
	</div>
</a>
