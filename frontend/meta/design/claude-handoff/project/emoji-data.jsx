/* global React */
// ============================================================
// emoji-data.jsx
// Shared mock dataset for the :shortcode autocomplete and the
// full emoji picker. Mirrors the shape of /api/v1/custom_emojis
// — { shortcode, url, static_url, category } — so swapping in
// the real endpoint is a one-line change in `searchEmoji`.
// ============================================================

window.CUSTOM_EMOJI = [
  { shortcode: 'sad',           pack: 'stolen', swatch: 'em-cx-sad',     label: 'sad face yellow' },
  { shortcode: 'same',          pack: 'stolen', swatch: 'em-cx-same',    label: 'SAME bold green' },
  { shortcode: 'sadcat',        pack: 'stolen', swatch: 'em-cx-sadcat',  label: 'crying cat photo' },
  { shortcode: 'sadday',        pack: 'stolen', swatch: 'em-cx-sadday',  label: 'green hair anime' },
  { shortcode: 'sakura',        pack: 'stolen', swatch: 'em-cx-sakura',  label: 'pink hair anime' },
  { shortcode: 'blobcat',       pack: 'blobs',  swatch: 'em-cx-blobcat', label: 'blobcat smile' },
  { shortcode: 'blobcatlove',   pack: 'blobs',  swatch: 'em-cx-blobl',   label: 'blobcat hearts' },
  { shortcode: 'blobthumbsup',  pack: 'blobs',  swatch: 'em-cx-blobtu',  label: 'blobcat thumbs up' },
  { shortcode: 'catshrug',      pack: 'blobs',  swatch: 'em-cx-shrug',   label: 'cat shrug' },
  { shortcode: 'partyparrot',   pack: 'party',  swatch: 'em-cx-party',   label: 'animated parrot' },
  { shortcode: 'pleromasummer', pack: 'pl',     swatch: 'em-cx-summer',  label: 'pleroma sunset' },
  { shortcode: 'fediverse',     pack: 'pl',     swatch: 'em-cx-fedi',    label: 'fediverse logo' },
  { shortcode: 'thinking',      pack: 'misc',   swatch: 'em-cx-think',   label: 'thinking face' },
  { shortcode: 'crt',           pack: 'misc',   swatch: 'em-cx-crt',     label: 'CRT pixel' },
  { shortcode: 'cassette',      pack: 'misc',   swatch: 'em-cx-cass',    label: 'tape cassette' },
  { shortcode: 'pcmaster',      pack: 'misc',   swatch: 'em-cx-pc',      label: 'beige PC' },
];

window.UNICODE_GROUPS = [
  { id: 'smileys', label: 'Smileys & people', items: ['😀','😁','😂','🤣','😅','😊','😉','😍','😘','😎','🤔','😴','😭','😡','🥺','🤗','🙃','😏','😌','😪','🥹','😢','🥳','🫡'] },
  { id: 'animals', label: 'Animals & nature', items: ['🐱','🐶','🦊','🐰','🐻','🐼','🦁','🐯','🐮','🐷','🐸','🐵','🦄','🐝','🦋','🐢','🐍','🦖','🦔','🐧'] },
  { id: 'food',    label: 'Food & drink',     items: ['🍕','🍔','🍟','🌭','🍿','🥯','🍞','🥐','🥨','🥞','🧀','🍳','🥚','🥓','🍣','🍙','🍡','🍩','☕','🍵'] },
  { id: 'travel',  label: 'Travel & places',  items: ['🚗','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍','🛺','🚲','🛴','✈','🚀'] },
  { id: 'objects', label: 'Objects & tech',   items: ['⌚','📱','💻','⌨','🖥','🖨','🖱','🖲','🕹','🗜','💾','💿','📀','📼','📷','📹','🎥','📽','📺','📡'] },
];

// Recents — would come from localStorage in production
window.EMOJI_RECENTS = ['🔥','❤️','😂','sad','blobcat','✨','partyparrot','sakura'];

// Mock searcher — would be swapped for a call against the custom-emoji
// manifest cached at boot time.
window.searchEmoji = function searchEmoji(q) {
  if (!q) return window.CUSTOM_EMOJI.slice(0, 5);
  const lq = q.toLowerCase();
  return window.CUSTOM_EMOJI
    .filter(e =>
      e.shortcode.toLowerCase().includes(lq) ||
      (e.label || '').toLowerCase().includes(lq)
    )
    .slice(0, 6);
};

// Helper: create a DOM atom for a custom emoji that survives
// contenteditable manipulation (used by mention-editor + picker).
window.makeEmojiAtom = function makeEmojiAtom(emoji) {
  const wrap = document.createElement('span');
  wrap.className = 'me-emoji ' + (emoji.swatch || ('em-cx-' + emoji.shortcode));
  wrap.setAttribute('contenteditable', 'false');
  wrap.setAttribute('data-shortcode', emoji.shortcode);
  wrap.setAttribute('title', ':' + emoji.shortcode + ':');
  const inner = document.createElement('span');
  inner.className = 'me-emoji-i';
  inner.textContent = emoji.shortcode.slice(0, 2).toUpperCase();
  wrap.appendChild(inner);
  return wrap;
};

// Helper: render a custom-emoji "image" for read-only React surfaces.
window.EmojiAtom = function EmojiAtom({ emoji, size = 20 }) {
  const sw = emoji.swatch || ('em-cx-' + emoji.shortcode);
  return (
    <span className={"me-emoji " + sw}
      style={{width: size, height: size, ['--em-fs']: Math.max(7, Math.floor(size * 0.36)) + 'px'}}
      title={':' + emoji.shortcode + ':'}>
      <span className="me-emoji-i">
        {emoji.shortcode.slice(0, 2).toUpperCase()}
      </span>
    </span>
  );
};
