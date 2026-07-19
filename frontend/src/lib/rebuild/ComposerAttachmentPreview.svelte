<script lang="ts">
	import { composerUploadBadge, type ComposerUpload } from './composer';

	type Props = {
		upload: ComposerUpload;
		disabled?: boolean;
		onRemove?: (localId: string) => void;
		onAltText?: (localId: string, description: string) => void;
	};

	let { upload, disabled = false, onRemove, onAltText }: Props = $props();
	let imageAlt = $derived(upload.status === 'uploaded' && upload.media.description?.trim() ? upload.media.description : `Preview of ${upload.name}`);
</script>

<article class="composer-upload-row composer-upload-card" class:error={upload.status === 'error'} data-testid="composer-attachment" aria-label={`${upload.name}, image attachment`} title={upload.error}>
	<div class="composer-upload-preview photo">
		{#if upload.previewUrl}
			<img class="composer-upload-media" src={upload.previewUrl} alt={imageAlt} />
		{:else}
			<div class="composer-upload-fallback"><strong>{composerUploadBadge(upload.kind)}</strong><span>Preview unavailable</span></div>
		{/if}
		<span class="composer-upload-kind">{composerUploadBadge(upload.kind)}</span>
	</div>
	<div class="composer-upload-meta">
		<div class="composer-upload-head">
			<div class="composer-upload-name" title={upload.name}>{upload.name}</div>
			<button type="button" class="composer-upload-rm" aria-label={`Remove ${upload.name}`} disabled={disabled || !onRemove} onclick={() => onRemove?.(upload.localId)}>×</button>
		</div>
		<div class="composer-upload-prog-row">
			<div class="composer-upload-bar" role="progressbar" aria-label={`Upload progress for ${upload.name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={upload.progress}><span style={`width:${upload.progress}%`}></span></div>
			<span class="composer-upload-pct">{upload.status === 'error' ? 'Error' : `${upload.progress}%`}</span>
		</div>
		{#if upload.error}<div class="composer-upload-error">{upload.error}</div>{/if}
		{#if upload.status === 'uploaded' && onAltText}
			<label class="composer-upload-alt-wrap"><span>Alt text</span><input class="composer-upload-alt" type="text" placeholder="Describe for screen readers" aria-label={`Alt text for ${upload.name}`} value={upload.media.description ?? ''} {disabled} onchange={(event) => onAltText(upload.localId, event.currentTarget.value)} /></label>
		{/if}
	</div>
</article>
