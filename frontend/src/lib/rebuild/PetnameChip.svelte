<script lang="ts">
	// The petname pill (meta/issues/petnames.md): MY local, key-bound name for a
	// contact, rendered as chip CHROME (background + tag glyph) after their
	// self-chosen name — deliberately not plain text, so a display name
	// containing pill-lookalike characters doesn't pass as one.
	let { petname }: { petname: string } = $props();
</script>

<span class="petname-chip" data-testid="petname-chip" title="Your petname for this contact">
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="9" height="9" aria-hidden="true">
		<path d="M2 2h5l7 7-5 5-7-7z" />
		<circle cx="5.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
	</svg>
	<span class="petname-chip-text">{petname}</span>
</span>
