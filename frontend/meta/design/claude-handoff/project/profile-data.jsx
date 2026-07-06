/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   I, VaporBanner, Avatar, PostBody, PostMedia, PostActions, PostShell, QuotedPost, PostCW */
const { useState: useStateP } = React;

// ============================================================
// Sample profile + posts
// ============================================================
const PROFILE = {
  displayName: 'soft.hertz ✦',
  username: 'soft.hertz',
  acct: '@soft.hertz@kolektiva.social',
  avClass: 'av-grad-3',
  bio: "field recordings + slow web · cassette decks · taipei.\nthe algorithm doesn't care about you. the timeline does.",
  fields: [
    { k: 'Pronouns', v: 'they / them' },
    { k: 'Location', v: 'Taipei, TW' },
    { k: 'Joined',   v: 'Feb 2023' },
    { k: 'Web',      v: 'softhertz.land', verified: true },
    { k: 'Instance', v: 'kolektiva.social' },
    { k: 'Lang',     v: 'en, zh-TW' },
  ],
  stats: { posts: 2148, following: 312, followers: 1921 },
};

const PINNED = [
  {
    id: 'p1', name: PROFILE.displayName, handle: PROFILE.acct, time: '3w',
    avClass: PROFILE.avClass, pinned: true,
    body: "the algorithm doesn't care about you. the timeline doesn't either. but the people in it do, and that's worth keeping.",
    replies: 142, boosts: 312, favs: 891,
    actions: { reply: false, boost: false, fav: true },
  },
  {
    id: 'p2', name: PROFILE.displayName, handle: PROFILE.acct, time: '2mo',
    avClass: PROFILE.avClass, pinned: true,
    body: "follow whoever you want. mute liberally. block when you need to. the timeline is yours to tend.",
    replies: 38, boosts: 124, favs: 612,
    actions: { reply: false, boost: false, fav: false },
  },
];

const POSTS = [
  {
    id: 1, name: PROFILE.displayName, handle: PROFILE.acct, time: '2h',
    avClass: PROFILE.avClass,
    body: "rain recording from this morning's walk — 11 minutes, two takes, the kettle made it onto the second one.",
    attachments: [
      { kind: 'audio', title: 'rain on glass · take 2', byline: 'soft.hertz · field · 2026',
        duration: '11:42', start: 0.18 },
    ],
    replies: 8, boosts: 24, favs: 86,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 2, name: PROFILE.displayName, handle: PROFILE.acct, time: '6h',
    avClass: PROFILE.avClass,
    body: "thinking about how the slow web isn't really slow — it's just the pace at which a person can actually pay attention. anything faster is the algorithm asking you to react before you've thought.",
    attachments: [],
    replies: 12, boosts: 38, favs: 142,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 3, name: PROFILE.displayName, handle: PROFILE.acct, time: '11h',
    avClass: PROFILE.avClass,
    body: "dusk in the alley behind the apartment. nothing happens for the first twenty seconds.",
    attachments: [
      { kind: 'photo', src: 'samples/cat-door.webp', alt: 'door with cat at dusk' },
    ],
    replies: 4, boosts: 11, favs: 73,
    actions: { reply: false, boost: false, fav: true },
  },
  {
    id: 4, name: PROFILE.displayName, handle: PROFILE.acct, time: '1d',
    avClass: PROFILE.avClass,
    body: "two photos from the same window, taken six months apart. the cat moved once.",
    attachments: [
      { kind: 'photo', src: 'samples/falco.png', alt: 'station platform at dusk' },
      { kind: 'photo', src: 'samples/dragon.png', alt: 'shrine path' },
    ],
    replies: 7, boosts: 19, favs: 104,
    actions: { reply: false, boost: false, fav: false },
  },
];

const REPLIES = [
  {
    id: 'r1', name: PROFILE.displayName, handle: PROFILE.acct, time: '5h',
    avClass: PROFILE.avClass,
    addressees: ['@datagram@retro.social'],
    body: "@datagram I was thinking of trying jan-nano next — let me know how qwen 0.5b holds up for you.",
    attachments: [],
    replies: 1, boosts: 0, favs: 4,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 'r2', name: PROFILE.displayName, handle: PROFILE.acct, time: '8h',
    avClass: PROFILE.avClass,
    addressees: ['@orbit@spacebear.net', '@gridwave@retro.social'],
    body: "@orbit yes please share the kettle clip. @gridwave you'll like the windowsill video too.",
    attachments: [],
    replies: 0, boosts: 1, favs: 8,
    actions: { reply: false, boost: false, fav: false },
  },
];

// Media-tab dataset — photos + audios + a video
const MEDIA = [
  { kind: 'photo', src: 'samples/cat-door.webp' },
  { kind: 'photo', src: 'samples/falco.png' },
  { kind: 'audio', title: 'rain on glass' },
  { kind: 'photo', src: 'samples/dragon.png' },
  { kind: 'photo', src: 'samples/flute-text.png' },
  { kind: 'audio', title: 'kettle whistle' },
  { kind: 'photo', src: 'samples/cats-pair.webp' },
  { kind: 'video', src: 'samples/falco.png' },
  { kind: 'audio', title: 'evening crickets' },
];

Object.assign(window, { PROFILE, PINNED, POSTS, REPLIES, MEDIA });
