<script lang="ts">
	import Avatar from './Avatar.svelte';
	import ComposerCWPanel from './ComposerCWPanel.svelte';
	import ComposerMentionEditor from './ComposerMentionEditor.svelte';
	import ComposerPollPanel from './ComposerPollPanel.svelte';
	import EmojiPicker from './EmojiPicker.svelte';
	import Icon from './Icon.svelte';
	import type { PleromaRequestErrorView } from '$lib/pleroma/ui';
	import type { BannerVariant } from './attachments';
	import { composerUploadBadge, type ComposerEmoji, type ComposerMentionAccount, type ComposerPollDraft, type ComposerUpload } from './composer';

	export type InlineReplyComposerProps = {
		id?: string;
		targetHandle: string;
		targetName?: string;
		targetAvClass?: string;
		targetAvBanner?: BannerVariant;
		targetAvatarUrl?: string | null;
		draft: string;
		remaining: number;
		submitting?: boolean;
		error?: PleromaRequestErrorView | null;
		spoilerActive?: boolean;
		spoilerText?: string;
		poll?: ComposerPollDraft | null;
		pollValid?: boolean;
		accounts?: ComposerMentionAccount[];
		emojis?: ComposerEmoji[];
		uploads?: ComposerUpload[];
		onMentionQuery?: (query: string) => void;
		onFiles?: (files: FileList | File[]) => void;
		onRemoveUpload?: (localId: string) => void;
		onAltText?: (localId: string, description: string) => void;
		onSpoilerToggle?: () => void;
		onSpoilerInput?: (value: string) => void;
		onSpoilerRemove?: () => void;
		onPollToggle?: () => void;
		onPollChange?: (poll: ComposerPollDraft) => void;
		onPollRemove?: () => void;
		onDraftInput: (value: string) => void;
		onCancel: () => void;
		onSubmit: () => void;
	};

	let {
		id,
		targetHandle,
		targetName,
		targetAvClass,
		targetAvBanner,
		targetAvatarUrl,
		draft,
		remaining,
		submitting = false,
		error = null,
		spoilerActive = false,
		spoilerText = '',
		poll = null,
		pollValid = true,
		accounts = [],
		emojis = [],
		uploads = [],
		onMentionQuery,
		onFiles,
		onRemoveUpload,
		onAltText,
		onSpoilerToggle,
		onSpoilerInput,
		onSpoilerRemove,
		onPollToggle,
		onPollChange,
		onPollRemove,
		onDraftInput,
		onCancel,
		onSubmit
	}: InlineReplyComposerProps = $props();
	let fileInput = $state<HTMLInputElement | null>(null);
	let dragActive = $state(false);
	let dragCount = $state(0);
	let emojiPickerOpen = $state(false);
	let emojiPickerAnchor = $state<{ left?: number; top?: number; bottom?: number } | null>(null);
	let emojiRecents = $state<Array<string | ComposerEmoji>>([]);
	let insertRequest = $state<{ id: number; item: string | ComposerEmoji } | null>(null);
	let insertRequestId = 0;
	let formLabel = $derived(`Inline reply to ${targetHandle}`);
	let avatarAlt = $derived(`${targetName || targetHandle} avatar`);
	let targetAvatar = $derived({
		name: targetName,
		handle: targetHandle,
		avClass: targetAvClass,
		avBanner: targetAvBanner,
		avatarUrl: targetAvatarUrl
	});
	let uploadsPending = $derived(uploads.some((upload) => upload.status === 'uploading'));
	let hasUploadedMedia = $derived(uploads.some((upload) => upload.status === 'uploaded'));
	let mediaEnabled = $derived(Boolean(onFiles));
	let canSubmit = $derived((Boolean(draft.trim()) || hasUploadedMedia) && remaining >= 0 && (!poll || pollValid) && !submitting && !uploadsPending);

	const pickFiles = () => {
		if (submitting) return;
		fileInput?.click();
	};
	const handleFileChange = (event: Event) => {
		const input = event.currentTarget as HTMLInputElement;
		if (!submitting && input.files) onFiles?.(input.files);
		input.value = '';
	};
	const handleDragOver = (event: DragEvent) => {
		if (submitting || !onFiles || !event.dataTransfer?.types.includes('Files')) return;
		event.preventDefault();
		dragActive = true;
		dragCount = Math.max(1, event.dataTransfer.items.length || event.dataTransfer.files.length || 1);
	};
	const handleDragLeave = () => {
		dragActive = false;
		dragCount = 0;
	};
	const handleDrop = (event: DragEvent) => {
		if (submitting || !event.dataTransfer?.files.length || !onFiles) return;
		event.preventDefault();
		dragActive = false;
		dragCount = 0;
		onFiles(event.dataTransfer.files);
	};
	const handlePaste = (event: ClipboardEvent) => {
		const files = Array.from(event.clipboardData?.files ?? []);
		if (submitting || files.length === 0 || !onFiles) return;
		event.preventDefault();
		onFiles(files);
	};
	const emojiRecentKey = (item: string | ComposerEmoji) => typeof item === 'string' ? item : item.shortcode;
	const toggleEmojiPicker = (event: MouseEvent) => {
		if (submitting) return;
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		emojiPickerAnchor = { left: rect.left, top: rect.top, bottom: rect.bottom };
		emojiPickerOpen = !emojiPickerOpen;
	};
	const insertEmoji = (item: string | ComposerEmoji) => {
		emojiRecents = [item, ...emojiRecents.filter((recent) => emojiRecentKey(recent) !== emojiRecentKey(item))].slice(0, 12);
		insertRequestId += 1;
		insertRequest = { id: insertRequestId, item };
	};

	$effect(() => {
		if (submitting) emojiPickerOpen = false;
	});

</script>

<form {id} class="thread-inline-reply" aria-label={formLabel} onsubmit={(event) => { event.preventDefault(); onSubmit(); }} onpaste={handlePaste} ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}>
	<Avatar
		post={targetAvatar}
		alt={avatarAlt}
		size={32}
		className="thread-inline-reply-av"
	/>
	<div class="thread-inline-reply-main">
		<div class="thread-inline-reply-addr">
			<span>Replying to</span>
			<span class="thread-inline-reply-addr-chip">
				<Icon name="reply" width={10} height={10} />
				{targetHandle}
			</span>
		</div>
		<ComposerMentionEditor
			value={draft}
			onInput={onDraftInput}
			ariaLabel="Reply text"
			placeholder={`Reply to ${targetHandle}...`}
			disabled={submitting}
			autoFocus
			{accounts}
			{emojis}
			{insertRequest}
			{onMentionQuery}
			onSubmit={onSubmit}
		/>
		{#if mediaEnabled}
			<input bind:this={fileInput} class="sr-only" type="file" multiple tabindex="-1" aria-label="Attach reply media" accept="image/*,audio/*,video/*" onchange={handleFileChange} />
		{/if}
		{#if uploads.length > 0}
			<div class="composer-uploads thread-inline-reply-uploads" aria-live="polite">
				{#each uploads as upload (upload.localId)}
					<div class="composer-upload-row" class:error={upload.status === 'error'} title={upload.error}>
						<div class={`composer-upload-thumb ${upload.kind}`}>{composerUploadBadge(upload.kind)}</div>
						<div class="composer-upload-meta">
							<div class="composer-upload-name">{upload.name}</div>
							<div class="composer-upload-prog-row">
								<div class="composer-upload-bar" role="progressbar" aria-label={`Upload progress for ${upload.name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={upload.progress}><span style={`width:${upload.progress}%`}></span></div>
								<span class="composer-upload-pct">{upload.status === 'error' ? 'Error' : `${upload.progress}%`}</span>
							</div>
							{#if upload.error}<div class="composer-upload-error">{upload.error}</div>{/if}
							{#if upload.status === 'uploaded' && onAltText}
								<input class="composer-upload-alt" type="text" placeholder="Alt text (describe for screen readers)" aria-label={`Alt text for ${upload.name}`} value={upload.media.description ?? ''} disabled={submitting} onchange={(event) => onAltText(upload.localId, event.currentTarget.value)} />
							{/if}
						</div>
						<button type="button" class="composer-upload-rm" aria-label={`Remove ${upload.name}`} disabled={submitting} onclick={() => onRemoveUpload?.(upload.localId)}>×</button>
					</div>
				{/each}
			</div>
		{:else if mediaEnabled}
			<button type="button" class="composer-drop-slot thread-inline-reply-drop" class:active={dragActive} disabled={submitting} onclick={pickFiles}>
				<Icon name="upload" width={16} height={16} />
				<span>{#if dragActive}<strong>Drop to add {dragCount} {dragCount === 1 ? 'file' : 'files'}</strong> <span class="drop-copy-muted">· photos · audio · video</span>{:else}<strong>Drag &amp; drop</strong> <span class="drop-copy-muted">files to attach</span> <em>· or browse</em>{/if}</span>
			</button>
		{/if}
		{#if spoilerActive}
			<ComposerCWPanel value={spoilerText} onInput={(value) => onSpoilerInput?.(value)} onRemove={() => onSpoilerRemove?.()} focusOnMount />
		{/if}
		{#if poll}
			<ComposerPollPanel poll={poll} onPollChange={(nextPoll) => onPollChange?.(nextPoll)} onRemove={() => onPollRemove?.()} focusOnMount idPrefix={id ? `${id}-poll` : 'inline-reply-poll'} />
		{/if}
		<div class="thread-inline-reply-row">
			<button type="button" class="thread-inline-reply-tool" title="Image" aria-label="Image" disabled={!mediaEnabled || submitting} onclick={pickFiles}><Icon name="image" width={16} height={16} /></button>
			<button type="button" class="thread-inline-reply-tool" class:active={emojiPickerOpen} title="Emoji" aria-label="Emoji" aria-haspopup="dialog" aria-expanded={emojiPickerOpen} aria-pressed={emojiPickerOpen} disabled={submitting} data-emoji-trigger onclick={toggleEmojiPicker}><Icon name="smile" width={16} height={16} /></button>
			<button type="button" class="thread-inline-reply-tool" class:active={Boolean(poll)} title="Poll" aria-label="Poll" aria-pressed={Boolean(poll)} disabled={!onPollToggle || submitting} onclick={() => onPollToggle?.()}><Icon name="poll" width={16} height={16} /></button>
			<button type="button" class="thread-inline-reply-cw" class:active={spoilerActive} aria-label="Content warning" aria-pressed={spoilerActive} disabled={!onSpoilerToggle || submitting} onclick={() => onSpoilerToggle?.()}>CW</button>
			<span class="thread-inline-reply-spacer"></span>
			<button type="button" class="thread-inline-reply-cancel" disabled={submitting} onclick={onCancel}>Cancel</button>
			<span class="thread-inline-reply-count" class:over-limit={remaining < 0}>{remaining}</span>
			<button type="submit" class="thread-inline-reply-submit" disabled={!canSubmit}>{submitting ? 'Replying...' : 'Reply'}</button>
		</div>
		{#if error}
			<div class="status-action-error inline-reply-error" role="alert">
				<strong>{error.title}</strong>
				<span>{error.message}</span>
			</div>
		{/if}
		<EmojiPicker open={emojiPickerOpen} emojis={emojis} recents={emojiRecents} anchor={emojiPickerAnchor} onClose={() => (emojiPickerOpen = false)} onPick={insertEmoji} />
	</div>
</form>
