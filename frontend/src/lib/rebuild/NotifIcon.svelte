<script lang="ts">
	import type { NotificationGlyph } from './notifications';

	type Props = {
		name: NotificationGlyph;
	};

	let { name }: Props = $props();
	const commonStyle = 'width:12px;height:12px';
</script>

{#if name === 'star'}
	<svg viewBox="0 0 24 24" fill="currentColor" style={commonStyle} aria-hidden="true">
		<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4.5L6 21l1.5-7.5L2 9h7l3-7z" />
	</svg>
{:else if name === 'repeat'}
	<svg viewBox="0 0 24 24" fill="none" style={commonStyle} aria-hidden="true">
		<path d="M4 9V7a2 2 0 012-2h11l-3-3M20 15v2a2 2 0 01-2 2H7l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{:else if name === 'reply'}
	<svg viewBox="0 0 24 24" fill="none" style={commonStyle} aria-hidden="true">
		<path d="M10 8L4 12l6 4M4 12h11a5 5 0 015 5v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{:else if name === 'at'}
	<svg viewBox="0 0 24 24" fill="none" style={commonStyle} aria-hidden="true">
		<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
		<path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-4 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	</svg>
{:else if name === 'userPlus'}
	<svg viewBox="0 0 24 24" fill="none" style={commonStyle} aria-hidden="true">
		<circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="2" />
		<path d="M3 20c0-3 3-5 6-5s6 2 6 5M18 8v6M21 11h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	</svg>
{:else if name === 'smile'}
	<svg viewBox="0 0 24 24" fill="none" style={commonStyle} aria-hidden="true">
		<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" />
		<path d="M8.5 14c.8 1.3 2 2 3.5 2s2.7-.7 3.5-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
		<circle cx="9" cy="9.5" r="0.6" fill="currentColor" stroke="currentColor" />
		<circle cx="15" cy="9.5" r="0.6" fill="currentColor" stroke="currentColor" />
	</svg>
{:else if name === 'chart'}
	<svg viewBox="0 0 24 24" fill="none" style={commonStyle} aria-hidden="true">
		<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	</svg>
{/if}
