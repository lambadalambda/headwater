<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import type { ComposerEmoji } from './composer';

	type UnicodeGroup = { id: string; label: string; items: string[] };
	type Anchor = { left?: number; top?: number; bottom?: number; placement?: 'above' | 'below' };
	type Props = {
		open: boolean;
		emojis?: ComposerEmoji[];
		unicodeGroups?: UnicodeGroup[];
		recents?: Array<string | ComposerEmoji>;
		anchor?: Anchor | null;
		onClose: () => void;
		onPick: (item: string | ComposerEmoji) => void;
		static?: boolean;
	};

	// Canonical unicode groups from the handoff emoji-data.jsx.
	const DEFAULT_UNICODE_GROUPS: UnicodeGroup[] = [
		{ id: 'smileys', label: 'Smileys & people', items: ['😀', '😁', '😂', '🤣', '😅', '😊', '😉', '😍', '😘', '😎', '🤔', '😴', '😭', '😡', '🥺', '🤗', '🙃', '😏', '😌', '😪', '🥹', '😢', '🥳', '🫡'] },
		{ id: 'animals', label: 'Animals & nature', items: ['🐱', '🐶', '🦊', '🐰', '🐻', '🐼', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🦄', '🐝', '🦋', '🐢', '🐍', '🦖', '🦔', '🐧'] },
		{ id: 'food', label: 'Food & drink', items: ['🍕', '🍔', '🍟', '🌭', '🍿', '🥯', '🍞', '🥐', '🥨', '🥞', '🧀', '🍳', '🥚', '🥓', '🍣', '🍙', '🍡', '🍩', '☕', '🍵'] },
		{ id: 'travel', label: 'Travel & places', items: ['🚗', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍', '🛺', '🚲', '🛴', '✈', '🚀'] },
		{ id: 'objects', label: 'Objects & tech', items: ['⌚', '📱', '💻', '⌨', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💾', '💿', '📀', '📼', '📷', '📹', '🎥', '📽', '📺', '📡'] }
	];

	let {
		open,
		emojis = [],
		unicodeGroups = DEFAULT_UNICODE_GROUPS,
		recents = [],
		anchor = null,
		onClose,
		onPick,
		static: isStatic = false
	}: Props = $props();

	let picker = $state<HTMLDivElement | null>(null);
	let searchInput = $state<HTMLInputElement | null>(null);
	let tab = $state('recent');
	let search = $state('');
	let selectedIndex = $state(0);

	let packs = $derived([...new Set(emojis.map((emoji) => emoji.pack ?? 'custom'))]);
	let sidebar = $derived([
		{ id: 'recent', label: 'Recent', kind: 'recent' as const },
		...packs.map((pack) => ({ id: `custom:${pack}`, label: pack, kind: 'custom' as const, pack })),
		...unicodeGroups.map((group) => ({ id: `uni:${group.id}`, label: group.label, kind: 'unicode' as const, group }))
	]);
	let activeEntry = $derived(sidebar.find((entry) => entry.id === tab) ?? sidebar[0]);
	let cells = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (q) {
			return [
				...emojis.filter((emoji) => emoji.shortcode.toLowerCase().includes(q) || (emoji.pack ?? '').toLowerCase().includes(q)),
				...unicodeGroups.flatMap((group) => group.id.includes(q) || group.label.toLowerCase().includes(q) ? group.items : [])
			];
		}
		if (tab === 'recent') {
			const fallback = emojis.slice(0, 3);
			return recents.length > 0 ? recents.map((recent) => typeof recent === 'string' && recent.length > 4 ? emojis.find((emoji) => emoji.shortcode === recent) ?? recent : recent) : [...fallback, '🔥', '❤️', '✨'];
		}
		if (tab.startsWith('custom:')) {
			const pack = tab.slice(7);
			return emojis.filter((emoji) => (emoji.pack ?? 'custom') === pack);
		}
		if (tab.startsWith('uni:')) {
			return unicodeGroups.find((group) => group.id === tab.slice(4))?.items ?? [];
		}
		return [];
	});
	let pickerStyle = $derived.by(() => {
		if (isStatic) return undefined;
		const style: string[] = [];
		const pickerHeight = 420 + 16;
		const viewH = typeof window === 'undefined' ? 800 : window.innerHeight;
		const spaceAbove = anchor?.top ?? 0;
		const spaceBelow = anchor?.bottom == null ? 0 : viewH - anchor.bottom;
		const placement = anchor?.placement ?? (spaceAbove >= pickerHeight ? 'above' : spaceBelow >= pickerHeight ? 'below' : spaceAbove > spaceBelow ? 'above' : 'below');
		if (anchor?.left != null) style.push(`left:${Math.max(8, Math.min(anchor.left, (typeof window === 'undefined' ? 800 : window.innerWidth) - 388))}px`);
		if (placement === 'below' && anchor?.bottom != null) style.push(`top:${anchor.bottom + 8}px`);
		else if (anchor?.top != null) style.push(`top:${anchor.top}px`, 'transform:translateY(-100%) translateY(-8px)');
		return style.join(';');
	});

	const isCustomEmoji = (item: string | ComposerEmoji): item is ComposerEmoji => typeof item !== 'string';
	const pick = (item: string | ComposerEmoji) => {
		onPick(item);
		onClose();
	};
	const clampSelectedIndex = () => {
		if (cells.length === 0) selectedIndex = 0;
		else if (selectedIndex >= cells.length) selectedIndex = cells.length - 1;
	};
	const gridColumns = () => {
		const grid = picker?.querySelector('.ep-grid');
		if (!grid) return 5;
		return Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
	};
	const handlePickerKeydown = (event: KeyboardEvent) => {
		if (cells.length === 0 && event.key === 'Enter') {
			event.preventDefault();
			return;
		}
		if (cells.length === 0) return;
		const columns = gridColumns();
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(cells.length - 1, selectedIndex + (event.key === 'ArrowDown' ? columns : 1));
			return;
		}
		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(0, selectedIndex - (event.key === 'ArrowUp' ? columns : 1));
			return;
		}
		if (event.key === 'Home') {
			event.preventDefault();
			selectedIndex = 0;
			return;
		}
		if (event.key === 'End') {
			event.preventDefault();
			selectedIndex = cells.length - 1;
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			pick(cells[selectedIndex]);
		}
	};

	onMount(() => {
		const onDoc = (event: MouseEvent) => {
			if (!open || isStatic || !picker || picker.contains(event.target as Node)) return;
			if ((event.target as Element | null)?.closest('[data-emoji-trigger]')) return;
			onClose();
		};
		const onKey = (event: KeyboardEvent) => {
			if (open && !isStatic && event.key === 'Escape') onClose();
		};
		document.addEventListener('mousedown', onDoc);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onDoc);
			document.removeEventListener('keydown', onKey);
		};
	});

	$effect(() => {
		if (!open || isStatic) return;
		search = '';
		selectedIndex = 0;
		setTimeout(() => searchInput?.focus(), 30);
	});

	$effect(() => {
		search;
		tab;
		selectedIndex = 0;
	});

	$effect(() => {
		cells;
		clampSelectedIndex();
	});

	$effect(() => {
		selectedIndex;
		picker?.querySelector('.ep-cell.sel')?.scrollIntoView({ block: 'nearest' });
	});
</script>

{#if open || isStatic}
	<div bind:this={picker} class="ep-picker" class:static={isStatic} style={pickerStyle} role="dialog" aria-label="Emoji picker">
		<aside class="ep-side">
			{#each sidebar as entry (entry.id)}
				<button type="button" class="ep-side-item" class:on={entry.id === tab && !search} aria-pressed={entry.id === tab && !search} onclick={() => { search = ''; tab = entry.id; }}>
					<span class="ep-side-i">
						{#if entry.kind === 'custom'}
							<span class="ep-side-swatch">{#if emojis.find((emoji) => (emoji.pack ?? 'custom') === entry.pack)?.url}<img src={emojis.find((emoji) => (emoji.pack ?? 'custom') === entry.pack)?.url} alt="" />{/if}</span>
						{:else}
							<span class="ep-side-glyph">{entry.kind === 'recent' ? '◷' : entry.group.items[0] ?? '☺'}</span>
						{/if}
					</span>
					<span class="ep-side-t">{entry.label}</span>
				</button>
			{/each}
		</aside>
		<div class="ep-main">
			<label class="ep-search">
				<Icon name="search" width={14} height={14} />
				<input bind:this={searchInput} bind:value={search} aria-label="Search emoji" placeholder="Search…" spellcheck="false" onkeydown={handlePickerKeydown} />
			</label>
			<div class="ep-pack-l">{search ? `"${search}"` : activeEntry?.label}<span class="ep-pack-count">{cells.length}</span></div>
			<div class="ep-grid">
				{#if cells.length === 0}<div class="ep-empty">No matches.</div>{/if}
				{#each cells as cell, index (`${isCustomEmoji(cell) ? cell.shortcode : cell}-${index}`)}
					<button type="button" class="ep-cell" class:sel={index === selectedIndex} title={isCustomEmoji(cell) ? `:${cell.shortcode}:` : cell} aria-label={isCustomEmoji(cell) ? `:${cell.shortcode}:` : cell} aria-pressed={index === selectedIndex} onclick={() => pick(cell)} onkeydown={handlePickerKeydown}>
						{#if isCustomEmoji(cell)}
							<span class="me-emoji ep-cell-cx"><img src={cell.url} alt={`:${cell.shortcode}:`} /></span>
						{:else}
							<span class="ep-cell-uni">{cell}</span>
						{/if}
					</button>
				{/each}
			</div>
			<div class="ep-foot"><span class="ep-foot-l">{activeEntry?.kind === 'custom' ? `:${activeEntry.label}:` : activeEntry?.label}</span><span class="ep-foot-r">Click to insert</span></div>
		</div>
	</div>
{/if}
