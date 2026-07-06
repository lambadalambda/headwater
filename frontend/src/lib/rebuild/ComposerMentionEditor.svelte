<script lang="ts">
	import { onMount } from 'svelte';
	import Avatar from './Avatar.svelte';
	import { applyAvatarImageFallback } from './avatar';
	import type { ComposerEmoji, ComposerMentionAccount } from './composer';

	type PopState =
		| { type: 'mention'; query: string; accounts: ComposerMentionAccount[]; emojis?: never; top: number; left: number }
		| { type: 'emoji'; query: string; emojis: ComposerEmoji[]; accounts?: never; top: number; left: number }
		| null;
	type TriggerContext = { type: 'mention' | 'emoji'; query: string; range: Range; top: number; left: number };
	type Props = {
		id?: string;
		value: string;
		onInput: (value: string) => void;
		ariaLabel?: string;
		placeholder?: string;
		accounts?: ComposerMentionAccount[];
		emojis?: ComposerEmoji[];
		disabled?: boolean;
		autoFocus?: boolean;
		onMentionQuery?: (query: string) => void;
		onSubmit?: () => void;
		insertRequest?: { id: number; item: string | ComposerEmoji } | null;
};

	let {
		id = 'composer-mention-editor',
		value,
		onInput,
		ariaLabel = 'Post text',
		placeholder = "What's on your mind?",
		accounts = [],
		emojis = [],
		disabled = false,
		autoFocus = false,
		onMentionQuery,
		onSubmit,
		insertRequest = null
}: Props = $props();
	let editor: HTMLDivElement | null = null;
	let pop = $state<PopState>(null);
	let selectedIndex = $state(0);
	let triggerRange: Range | null = null;
	let handledInsertRequestId = 0;
	let listboxId = $derived(`${id}-suggestions`);
	let activeOptionId = $derived(pop ? `${listboxId}-${selectedIndex}` : undefined);
	const accountMatches = (query: string) => accounts.filter((account) =>
		account.username.toLowerCase().includes(query) ||
		account.acct.toLowerCase().includes(query) ||
		account.displayName.toLowerCase().includes(query)
	).slice(0, 5);
	const emojiMatches = (query: string) => emojis.filter((emoji) => emoji.shortcode.toLowerCase().includes(query)).slice(0, 5);
	let visibleAccounts = $derived(pop?.type === 'mention' ? accountMatches(pop.query) : []);
	let visibleEmojis = $derived(pop?.type === 'emoji' ? emojiMatches(pop.query) : []);

	const blockTags = new Set(['DIV', 'P']);

	const normalizeSerializedText = (text: string) => text.replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/^\n|\n$/g, '');

	const serialize = (root: HTMLElement | null) => {
		if (!root) return '';
		const out: string[] = [];
		const walk = (node: ChildNode) => {
			if (node.nodeType === Node.TEXT_NODE) {
				out.push(node.textContent ?? '');
				return;
			}
			if (!(node instanceof HTMLElement)) return;
			if (node.classList.contains('me-pill')) {
				out.push(`@${node.dataset.acct ?? ''}`);
				return;
			}
			if (node.classList.contains('me-emoji')) {
				out.push(`:${node.dataset.shortcode ?? ''}:`);
				return;
			}
			if (node.tagName === 'BR') {
				out.push('\n');
				return;
			}
			const isBlock = blockTags.has(node.tagName);
			if (isBlock && out.length > 0 && !out[out.length - 1].endsWith('\n')) out.push('\n');
			node.childNodes.forEach(walk);
			if (isBlock && out.length > 0 && !out[out.length - 1].endsWith('\n')) out.push('\n');
		};

		root.childNodes.forEach(walk);
		return normalizeSerializedText(out.join(''));
	};

	const placeCaretAfter = (node: Node) => {
		const range = document.createRange();
		range.setStartAfter(node);
		range.collapse(true);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	};

	const placeCaretAtEnd = () => {
		if (!editor) return;
		const range = document.createRange();
		range.selectNodeContents(editor);
		range.collapse(false);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
	};

	const appendText = (text: string) => editor?.appendChild(document.createTextNode(text));
	const lastTextNode = (node: Node): Text | null => {
		if (node.nodeType === Node.TEXT_NODE) return node as Text;
		for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
			const text = lastTextNode(node.childNodes[i]);
			if (text) return text;
		}
		return null;
	};
	const rangeTextNode = (range: Range): { node: Text; offset: number } | null => {
		const start = range.startContainer;
		if (start.nodeType === Node.TEXT_NODE) return { node: start as Text, offset: range.startOffset };
		if (!editor?.contains(start)) return null;

		const child = start.childNodes[Math.max(0, range.startOffset - 1)];
		const node = child ? lastTextNode(child) : null;
		return node ? { node, offset: node.textContent?.length ?? 0 } : null;
	};
	const ensureEditorRange = () => {
		if (!editor) return null;
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0 && editor.contains(selection.getRangeAt(0).startContainer)) return selection.getRangeAt(0);
		placeCaretAtEnd();
		return window.getSelection()?.rangeCount ? window.getSelection()?.getRangeAt(0) ?? null : null;
	};

	const createMentionAtom = (account: ComposerMentionAccount) => {
		const atom = document.createElement('span');
		atom.className = 'me-pill';
		atom.contentEditable = 'false';
		atom.dataset.acct = account.acct;
		atom.dataset.display = account.displayName;
		atom.title = `@${account.acct}`;

		const avatar = document.createElement('span');
		avatar.className = `me-pill-av ${account.avClass ?? ''}`.trim();
		if (account.avatarUrl) {
			const img = document.createElement('img');
			img.className = 'avatar-img';
			img.src = account.avatarUrl;
			img.alt = `${account.displayName || account.username} avatar`;
			img.loading = 'lazy';
			img.decoding = 'async';
			img.addEventListener('error', () => applyAvatarImageFallback(img, account.avClass), { once: true });
			avatar.appendChild(img);
		}
		atom.appendChild(avatar);

		const at = document.createElement('span');
		at.className = 'me-pill-at';
		at.textContent = '@';
		atom.appendChild(at);

		const handle = document.createElement('span');
		handle.className = 'me-pill-handle';
		handle.textContent = account.username;
		atom.appendChild(handle);

		return atom;
	};

	const createEmojiAtom = (emoji: ComposerEmoji) => {
		const atom = document.createElement('span');
		atom.className = 'me-emoji';
		atom.contentEditable = 'false';
		atom.dataset.shortcode = emoji.shortcode;
		atom.title = `:${emoji.shortcode}:`;
		atom.setAttribute('aria-label', `:${emoji.shortcode}:`);
		if (emoji.url) {
			const img = document.createElement('img');
			img.src = emoji.url;
			img.alt = `:${emoji.shortcode}:`;
			atom.appendChild(img);
		} else {
			atom.textContent = `:${emoji.shortcode}:`;
		}
		return atom;
	};

	const renderSerialized = (text: string) => {
		if (!editor) return;
		editor.innerHTML = '';
		let lastIndex = 0;
		const tokenRe = /(@[\w.-]+@[\w.-]+)|:([a-zA-Z0-9_+-]+):/g;
		for (const match of text.matchAll(tokenRe)) {
			if (match.index === undefined) continue;
			if (match.index > lastIndex) appendText(text.slice(lastIndex, match.index));
			const mentionAcct = match[1]?.slice(1);
			const emojiCode = match[2];
			const account = mentionAcct ? accounts.find((candidate) => candidate.acct === mentionAcct) : null;
			const emoji = emojiCode ? emojis.find((candidate) => candidate.shortcode === emojiCode) : null;
			if (account) editor.appendChild(createMentionAtom(account));
			else if (emoji) editor.appendChild(createEmojiAtom(emoji));
			else appendText(match[0]);
			lastIndex = match.index + match[0].length;
		}
		if (lastIndex < text.length) appendText(text.slice(lastIndex));
		placeCaretAtEnd();
	};

	const triggerContext = (): TriggerContext | null => {
		if (!editor) return null;
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return null;
		const range = selection.getRangeAt(0);
		if (!range.collapsed || !editor.contains(range.startContainer)) return null;
		const textPosition = rangeTextNode(range);
		if (!textPosition) return null;

		const { node, offset } = textPosition;
		const beforeCaret = (node.textContent ?? '').slice(0, offset);
		const rect = range.getBoundingClientRect();
		const editorRect = editor.getBoundingClientRect();
		const popoverWidth = Math.min(360, editorRect.width);
		const rawLeft = Math.max(0, rect.left - editorRect.left);
		const left = Math.min(rawLeft, Math.max(0, editorRect.width - popoverWidth));
		const top = Math.max(0, rect.bottom - editorRect.top + 6);

		let match = beforeCaret.match(/(^|\s)@([\w.-]*)$/);
		if (match) {
			const tokenRange = document.createRange();
			tokenRange.setStart(node, offset - match[2].length - 1);
			tokenRange.setEnd(node, offset);
			return { type: 'mention', query: match[2], range: tokenRange, top, left };
		}

		match = beforeCaret.match(/(^|\s):([\w+-]{2,})$/);
		if (match) {
			const tokenRange = document.createRange();
			tokenRange.setStart(node, offset - match[2].length - 1);
			tokenRange.setEnd(node, offset);
			return { type: 'emoji', query: match[2], range: tokenRange, top, left };
		}

		return null;
	};

	const updatePop = () => {
		const context = triggerContext();
		if (!context) {
			pop = null;
			triggerRange = null;
			return;
		}

		triggerRange = context.range;
		selectedIndex = 0;
		const query = context.query.toLowerCase();
		if (context.type === 'mention') {
			onMentionQuery?.(query);
			pop = {
				type: 'mention',
				query,
				left: context.left,
				top: context.top,
				accounts: []
			};
			return;
		}

		pop = {
			type: 'emoji',
			query,
			left: context.left,
			top: context.top,
			emojis: []
		};
	};

	const commitValue = () => {
		onInput(serialize(editor));
		updatePop();
	};

	const insertSelected = () => {
		if (!pop || !triggerRange) return;
		const item = pop.type === 'mention' ? accountMatches(pop.query)[selectedIndex] : emojiMatches(pop.query)[selectedIndex];
		if (!item) return;

		const atom = pop.type === 'mention'
			? createMentionAtom(item as ComposerMentionAccount)
			: createEmojiAtom(item as ComposerEmoji);
		const space = document.createTextNode('\u00a0');
		triggerRange.deleteContents();
		triggerRange.insertNode(space);
		triggerRange.insertNode(atom);
		placeCaretAfter(space);
		pop = null;
		triggerRange = null;
		onInput(serialize(editor));
	};

	const insertExternal = (item: string | ComposerEmoji) => {
		if (!editor) return;
		const range = ensureEditorRange();
		if (!range) return;
		editor.focus();
		range.deleteContents();
		const inserted = typeof item === 'string' ? document.createTextNode(item) : createEmojiAtom(item);
		const space = document.createTextNode('\u00a0');
		range.insertNode(space);
		range.insertNode(inserted);
		placeCaretAfter(space);
		pop = null;
		triggerRange = null;
		onInput(serialize(editor));
	};

	const handleKeydown = (event: KeyboardEvent) => {
		const count = pop?.type === 'mention' ? accountMatches(pop.query).length : pop?.type === 'emoji' ? emojiMatches(pop.query).length : 0;
		if (pop && count > 0) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				selectedIndex = (selectedIndex + 1) % count;
				return;
			}
			if (event.key === 'ArrowUp') {
				event.preventDefault();
				selectedIndex = (selectedIndex - 1 + count) % count;
				return;
			}
			if (event.key === 'Tab' || event.key === 'Enter') {
				event.preventDefault();
				insertSelected();
				return;
			}
		}
		if (event.key === 'Escape' && pop) {
			event.preventDefault();
			pop = null;
			triggerRange = null;
			return;
		}
		if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && onSubmit) {
			event.preventDefault();
			onSubmit();
		}
	};
	const handleKeyup = (event: KeyboardEvent) => {
		if ((event.key === 'Enter' || event.key === 'Tab') && pop) {
			event.preventDefault();
			insertSelected();
		}
	};

	onMount(() => {
		renderSerialized(value);
		if (autoFocus) editor?.focus();
	});

	$effect(() => {
		if (!editor) return;
		const current = serialize(editor);
		if (value !== current && (value === '' || document.activeElement !== editor)) renderSerialized(value);
	});

	$effect(() => {
		if (!insertRequest || insertRequest.id === handledInsertRequestId) return;
		handledInsertRequestId = insertRequest.id;
		insertExternal(insertRequest.item);
	});
</script>

<div class="me-editor-wrap">
	<div
		bind:this={editor}
		class="me-editor composer-input"
		contenteditable={!disabled}
		role="textbox"
		tabindex={disabled ? -1 : 0}
		aria-label={ariaLabel}
		aria-multiline="true"
		aria-disabled={disabled}
		aria-readonly={disabled}
		aria-autocomplete="list"
		aria-controls={pop ? listboxId : undefined}
		aria-activedescendant={activeOptionId}
		data-placeholder={placeholder}
		oninput={commitValue}
		onkeydown={handleKeydown}
		onkeyup={handleKeyup}
		onfocus={() => updatePop()}
		onblur={() => setTimeout(() => {
			if (document.activeElement !== editor) pop = null;
		}, 80)}
	></div>
	{#if pop?.type === 'mention'}
		<div class="me-pop" style={`left:${pop.left}px;top:${pop.top}px`}>
			<div class="me-pop-l">Suggestions · {visibleAccounts.length} result{visibleAccounts.length === 1 ? '' : 's'}</div>
			<div id={listboxId} role="listbox" aria-label="Mention suggestions">
				{#each visibleAccounts as account, index (account.id)}
					<button id={`${listboxId}-${index}`} type="button" role="option" aria-selected={index === selectedIndex} class="me-row" class:sel={index === selectedIndex} onmousedown={(event) => { event.preventDefault(); selectedIndex = index; insertSelected(); }}>
						<Avatar variant="plain" element="span" className="me-row-av" avClass={account.avClass} avatarUrl={account.avatarUrl} alt={`${account.displayName || account.username} avatar`} />
						<span class="me-row-name">{account.displayName}</span>
						<span class="me-row-acct">@{account.acct}</span>
						{#if index === selectedIndex}<span class="me-row-go"><span class="me-kbd">Tab</span></span>{/if}
					</button>
				{/each}
			</div>
			{#if visibleAccounts.length === 0}<div class="me-pop-empty">No matches for <code>@{pop.query}</code></div>{/if}
			<div class="me-pop-foot"><span class="me-kbd">↑↓</span> navigate · <span class="me-kbd">Tab</span> insert · <span class="me-kbd">Esc</span> dismiss</div>
		</div>
	{:else if pop?.type === 'emoji'}
		<div class="me-pop" style={`left:${pop.left}px;top:${pop.top}px`}>
			<div class="me-pop-l">Emoji · {visibleEmojis.length} match{visibleEmojis.length === 1 ? '' : 'es'}</div>
			<div id={listboxId} role="listbox" aria-label="Emoji suggestions">
				{#each visibleEmojis as emoji, index (emoji.shortcode)}
					<button id={`${listboxId}-${index}`} type="button" role="option" aria-selected={index === selectedIndex} class="me-row" class:sel={index === selectedIndex} onmousedown={(event) => { event.preventDefault(); selectedIndex = index; insertSelected(); }}>
						<span class="me-row-emoji"><img src={emoji.url} alt={`:${emoji.shortcode}:`} /></span>
						<span class="me-row-sc">:{emoji.shortcode}:</span>
						<span class="me-row-pack">{emoji.pack ?? 'custom'}</span>
						{#if index === selectedIndex}<span class="me-row-go"><span class="me-kbd">Tab</span></span>{/if}
					</button>
				{/each}
			</div>
			{#if visibleEmojis.length === 0}<div class="me-pop-empty">No matches for <code>:{pop.query}:</code></div>{/if}
			<div class="me-pop-foot"><span class="me-kbd">↑↓</span> navigate · <span class="me-kbd">Tab</span> insert · <span class="me-kbd">Esc</span> dismiss</div>
		</div>
	{/if}
</div>
