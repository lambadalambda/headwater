<script lang="ts">
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';
	import RichText from './RichText.svelte';
	import { profileHref } from './profile-links';
	import type { PleromaChatMessageView, PleromaRequestErrorView } from '$lib/pleroma/ui';
	import type { CustomEmoji } from '$lib/social/types';

	type ChatPartner = {
		name: string;
		nameEmojis?: CustomEmoji[];
		handle: string;
		avatarUrl?: string | null;
	};

	type Props = {
		partner: ChatPartner;
		messages: PleromaChatMessageView[];
		draft: string;
		sending?: boolean;
		error?: PleromaRequestErrorView | null;
		onDraftInput: (value: string) => void;
		onSend: () => void;
		onDeleteMessage?: (messageId: string) => void;
	};

	let { partner, messages, draft, sending = false, error = null, onDraftInput, onSend, onDeleteMessage }: Props = $props();
	let scroller = $state<HTMLDivElement | null>(null);
	let partnerHref = $derived(profileHref(partner.handle));
	let partnerAvatar = $derived({
		name: partner.name,
		handle: partner.handle,
		avatarUrl: partner.avatarUrl,
		avClass: partner.avatarUrl ? 'av-orb' : 'av-grad-2'
	});
	let canSend = $derived(Boolean(draft.trim()) && !sending);

	$effect(() => {
		void messages.length;
		if (scroller) scroller.scrollTop = scroller.scrollHeight;
	});

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'Enter' || event.shiftKey) return;
		event.preventDefault();
		if (canSend) onSend();
	};
</script>

<div class="chat-thread" data-testid="chat-thread">
	<div class="chat-thread-head">
		<a class="chat-thread-back" href="/app/messages" aria-label="Back to conversations"><Icon name="reply" width={14} height={14} /></a>
		<Avatar post={partnerAvatar} alt={`${partner.name} avatar`} size={32} className="chat-thread-av" />
		<div class="chat-thread-id">
			<div class="chat-thread-name"><RichText text={partner.name} emojis={partner.nameEmojis} linkMentions={false} /></div>
			{#if partnerHref}
				<a class="chat-thread-handle" href={partnerHref}>{partner.handle}</a>
			{:else}
				<div class="chat-thread-handle">{partner.handle}</div>
			{/if}
		</div>
	</div>

	<div class="chat-thread-scroll" bind:this={scroller} data-testid="chat-messages">
		{#if messages.length === 0}
			<div class="chat-thread-empty">No messages yet. Say hi!</div>
		{/if}
		{#each messages as message (message.id)}
			<div class="chat-msg" class:own={message.own}>
				<div class="chat-msg-bubble">
					{#if message.body}
						<div class="chat-msg-body"><RichText text={message.body} emojis={message.bodyEmojis} linkMentions={false} linkUrls /></div>
					{/if}
					{#if message.attachment}
						{#if message.attachment.type === 'image' && (message.attachment.previewUrl || message.attachment.url)}
							<a class="chat-msg-attachment" href={message.attachment.url} target="_blank" rel="noopener noreferrer">
								<img src={message.attachment.previewUrl || message.attachment.url} alt={message.attachment.description ?? 'Attached image'} loading="lazy" decoding="async" />
							</a>
						{:else}
							<a class="chat-msg-file" href={message.attachment.url} target="_blank" rel="noopener noreferrer">{message.attachment.filename ?? 'Attachment'}</a>
						{/if}
					{/if}
				</div>
				<div class="chat-msg-meta">
					<span title={message.fullTime}>{message.time}</span>
					{#if message.own && onDeleteMessage}
						<button type="button" class="chat-msg-delete" aria-label="Delete message" onclick={() => onDeleteMessage(message.id)}>Delete</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if error}
		<div class="status-action-error chat-thread-error" role="alert">
			<strong>{error.title}</strong>
			<span>{error.message}</span>
		</div>
	{/if}

	<form class="chat-thread-composer" aria-label={`Message ${partner.handle}`} onsubmit={(event) => { event.preventDefault(); if (canSend) onSend(); }}>
		<textarea
			class="chat-thread-input"
			rows="1"
			placeholder={`Message ${partner.handle}...`}
			aria-label="Message text"
			value={draft}
			disabled={sending}
			oninput={(event) => onDraftInput(event.currentTarget.value)}
			onkeydown={handleKeydown}
		></textarea>
		<button type="submit" class="chat-thread-send" disabled={!canSend}>{sending ? 'Sending...' : 'Send'}</button>
	</form>
</div>
