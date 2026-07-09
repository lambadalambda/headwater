<script lang="ts">
	// Key confirmation (meta/issues/key-confirmation.md): the author's signature
	// verified, but this node holds no pinned key for their address yet —
	// attribution is self-certifying only. Rendered as chip chrome so a display
	// name can't mimic it; disappears once the background key confirmation pins
	// the author (or the content is dropped on a conflicting pin).
</script>

<span class="unconfirmed-chip" data-testid="unconfirmed-chip" title="Signature not yet confirmed with this author — attribution is provisional">
	<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="9" height="9" aria-hidden="true">
		<circle cx="8" cy="8" r="6" />
		<path d="M8 5.5v3" />
		<circle cx="8" cy="11" r="0.5" fill="currentColor" stroke="none" />
	</svg>
	<span class="unconfirmed-chip-text">unconfirmed</span>
</span>
