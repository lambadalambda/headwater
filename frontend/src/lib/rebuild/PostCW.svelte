<script lang="ts">
	import { normalizeAttachments, type PostLike } from './attachments';

	type Props = {
		post: PostLike & {
			body?: string;
			handle?: string;
		};
		children: import('svelte').Snippet;
	};

	let { post, children }: Props = $props();
	let revealed = $state(false);

	let summary = $derived(typeof post.cw === 'string' ? post.cw.trim() : '');
	let attachments = $derived(normalizeAttachments(post));
	let attachmentChips = $derived.by(() => {
		const photos = attachments.filter((attachment) => attachment.kind === 'photo').length;
		const videos = attachments.filter((attachment) => attachment.kind === 'video').length;
		const audios = attachments.filter((attachment) => attachment.kind === 'audio').length;
		const polls = attachments.filter((attachment) => attachment.kind === 'poll').length;
		const chips: string[] = [];

		if (photos) chips.push(`${photos} ${photos === 1 ? 'photo' : 'photos'}`);
		if (videos) chips.push(`${videos} ${videos === 1 ? 'video' : 'videos'}`);
		if (audios) chips.push(`${audios} ${audios === 1 ? 'audio' : 'audios'}`);
		if (polls) chips.push(polls === 1 ? 'poll' : `${polls} polls`);

		return chips;
	});
	let words = $derived(post.body?.trim() ? post.body.trim().split(/\s+/).length : 0);
	let author = $derived(post.handle ? post.handle.split('@').filter(Boolean)[0] : 'author');
</script>

{#snippet glyph()}
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true">
		<path d="M8 1.5l7 12.5H1L8 1.5z" />
		<path d="M8 6v4M8 12v.5" />
	</svg>
{/snippet}

{#if !summary}
	{@render children()}
{:else if revealed}
	<div class="post-cw-revealed-summary">
		{@render glyph()}
		<span class="post-cw-revealed-l">CW</span>
		<span class="post-cw-revealed-text">{summary}</span>
		<button type="button" class="post-cw-revealed-hide" onclick={(event) => { event.stopPropagation(); revealed = false; }}>Hide</button>
	</div>
	{@render children()}
{:else}
	<div class="post-cw-card" data-post-ignore>
		<div class="post-cw-head">
			{@render glyph()}
			Content warning
		</div>
		<div class="post-cw-summary">{summary}</div>
		{#if attachmentChips.length > 0 || words > 0}
			<div class="post-cw-meta">
				<span>Hidden:</span>
				{#each attachmentChips as chip}
					<span class="post-cw-meta-chip">{chip}</span>
				{/each}
				{#if words > 0}
					<span class="post-cw-meta-chip">~{words} words</span>
				{/if}
			</div>
		{/if}
		<div class="post-cw-foot">
			<button type="button" class="post-cw-reveal" onclick={(event) => { event.stopPropagation(); revealed = true; }}>Show post</button>
			<button type="button" class="post-cw-link" disabled title="Always-show preferences are not implemented yet">Always show from @{author} -&gt;</button>
		</div>
	</div>
{/if}
