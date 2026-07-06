<script lang="ts">
	import type { PollAttachment as PollAttachmentData, PostLike } from './attachments';
	import { normalizeAttachments, pickAttachmentLayout } from './attachments';
	import PollAttachment from './PollAttachment.svelte';
	import PhotoGrid from './PhotoGrid.svelte';
	import VideoAttachment from './VideoAttachment.svelte';
	import AudioAttachment from './AudioAttachment.svelte';
	import CompactAudio from './CompactAudio.svelte';
	import MediaHeroStrip from './MediaHeroStrip.svelte';
	import VaporBanner from './VaporBanner.svelte';

	type Props = {
		post: PostLike;
		onOpen?: (i: number) => void;
		onVote?: (pollId: string | undefined, choice: string | string[]) => void;
	};

	let { post, onOpen, onVote }: Props = $props();
	let attachments = $derived(normalizeAttachments(post));
	let polls = $derived(attachments.filter((attachment): attachment is PollAttachmentData => attachment.kind === 'poll'));
	let layout = $derived(pickAttachmentLayout(attachments));
</script>

{#if post.media}
	<div class="post-media">
		<VaporBanner variant={post.media} />
	</div>
{/if}

{#if layout.type === 'single'}
	{@const a = layout.attachment}
	{#if a.kind === 'photo'}
		<PhotoGrid photos={[a]} onOpen={onOpen} />
	{:else if a.kind === 'video'}
		<VideoAttachment video={a} />
	{:else if a.kind === 'audio'}
		<AudioAttachment audio={a} />
	{/if}
{:else if layout.type === 'photoGrid'}
	<PhotoGrid photos={layout.photos} onOpen={onOpen} />
{:else if layout.type === 'photoAudio'}
	<div class="post-attach-combo">
		<PhotoGrid photos={[layout.photo]} onOpen={(i) => onOpen?.(i)} />
		<CompactAudio audio={layout.audio} onPlay={() => onOpen?.(1)} />
	</div>
{:else if layout.type === 'photosAudio'}
	<div class="post-attach-combo">
		<PhotoGrid photos={layout.photos} onOpen={onOpen} />
		<CompactAudio audio={layout.audio} onPlay={() => onOpen?.(layout.photos.length)} />
	</div>
{:else if layout.type === 'heroStrip'}
	<MediaHeroStrip attachments={layout.attachments} onOpen={onOpen} />
{/if}

{#each polls as poll}
	<PollAttachment {poll} onVote={onVote} />
{/each}
