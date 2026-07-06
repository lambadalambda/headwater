<script lang="ts">
	import { adaptCustomEmojis, htmlToPlainText } from '$lib/pleroma/ui';
	import type { PleromaAccount } from '$lib/pleroma/types';
	import Avatar from './Avatar.svelte';
	import NowPlayingLine from './NowPlayingLine.svelte';
	import RichText from './RichText.svelte';
	import VaporBanner from './VaporBanner.svelte';

	type Props = {
		account?: PleromaAccount | null;
		instanceUrl?: string;
	};

	let { account = null, instanceUrl = '' }: Props = $props();

	const defaultStats = [
		{ label: 'Posts', value: '1,248' },
		{ label: 'Following', value: '312' },
		{ label: 'Followers', value: '1,921' },
	];
	const countFormatter = new Intl.NumberFormat('en');
	const displayName = (nextAccount: PleromaAccount) => nextAccount.display_name.trim() || nextAccount.username || nextAccount.acct;
	const instanceHost = (url: string) => {
		try {
			return new URL(url).hostname;
		} catch {
			return '';
		}
	};
	const accountHandle = (nextAccount: PleromaAccount, url: string) => {
		const acct = nextAccount.acct.replace(/^@/, '');
		if (acct.includes('@')) return `@${acct}`;

		const host = instanceHost(url);
		return host ? `@${acct}@${host}` : `@${acct}`;
	};
	const accountBio = (nextAccount: PleromaAccount) => htmlToPlainText(nextAccount.note).trim() || 'No bio yet';
	const accountStats = (nextAccount: PleromaAccount) => [
		{ label: 'Posts', value: countFormatter.format(nextAccount.statuses_count) },
		{ label: 'Following', value: countFormatter.format(nextAccount.following_count) },
		{ label: 'Followers', value: countFormatter.format(nextAccount.followers_count) },
	];
	const name = $derived(account ? displayName(account) : 'dreambyte');
	const handle = $derived(account ? accountHandle(account, instanceUrl) : '@dreambyte@pleroma.social');
	const nameEmojis = $derived(account ? adaptCustomEmojis(account.emojis) : []);
	const bio = $derived(account ? accountBio(account) : 'living in a soft world');
	const stats = $derived(account ? accountStats(account) : defaultStats);
	const headerUrl = $derived(account?.header || account?.header_static || null);
	const avatarUrl = $derived(account?.avatar || account?.avatar_static || null);
</script>

<div class="card" data-testid="profile-mini">
	<div class="profile-mini-banner">
		{#if headerUrl}
			<img class="profile-mini-header" src={headerUrl} alt="" />
		{:else}
			<VaporBanner variant="pixel-window" />
		{/if}
	</div>
	<div class="profile-mini-info">
		<Avatar variant="plain" className="profile-mini-avatar" avatarUrl={avatarUrl} alt={`${name} avatar`} />
		<div class="profile-mini-name"><RichText text={name} emojis={nameEmojis} /></div>
		<div class="profile-mini-handle">{handle}</div>
		<div class="profile-mini-bio">{bio}</div>
		{#if !account}
			<NowPlayingLine playing track="pacific hour" artist="neon.cassette" tint="#a48bd9" />
		{/if}
	</div>
	<div class="stat-row">
		{#each stats as stat}
			<div class="stat">
				<div class="stat-label">{stat.label}</div>
				<div class="stat-value">{stat.value}</div>
			</div>
		{/each}
	</div>
</div>
