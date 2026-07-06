<script lang="ts">
	import type { PleromaProfileView } from '$lib/pleroma/ui';
	import RelativeTime from './RelativeTime.svelte';
	import type { ProfilePost } from './profile';

	type Props = {
		profile: PleromaProfileView;
		pinned?: ProfilePost[];
	};

	let { profile, pinned = [] }: Props = $props();
	const numberFormatter = new Intl.NumberFormat('en-US');
</script>

<div class="profile-side-rail" data-testid="profile-side-rail">
	<div class="card pp-side-card">
		<div class="pp-card-h">
			<span class="pp-card-title">Numbers</span>
			<span class="pp-card-meta">Stats</span>
		</div>
		<div class="pp-stats">
			<div class="pp-stat">
				<span class="pp-stat-v">{numberFormatter.format(profile.stats.posts)}</span>
				<span class="pp-stat-k">Posts</span>
			</div>
			<div class="pp-stat">
				<span class="pp-stat-v">{numberFormatter.format(profile.stats.following)}</span>
				<span class="pp-stat-k">Following</span>
			</div>
			<div class="pp-stat">
				<span class="pp-stat-v">{numberFormatter.format(profile.stats.followers)}</span>
				<span class="pp-stat-k">Followers</span>
			</div>
		</div>
	</div>

	{#if profile.fields.length > 0}
		<div class="card pp-side-card">
			<div class="pp-card-h">
				<span class="pp-card-title">Details</span>
				<span class="pp-card-meta">Fields</span>
			</div>
			<div class="pp-fields">
				{#each profile.fields as field (`${field.key}:${field.value}`)}
					<div class="pp-field-row">
						<span class="pp-field-k">{field.key}</span>
						<span class="pp-field-v" class:verified={field.verified}>{field.value}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if pinned.length > 1}
		<div class="card pp-side-card">
			<div class="pp-card-h">
				<span class="pp-card-title">Also pinned</span>
				<span class="pp-card-meta">{pinned.length - 1} more</span>
			</div>
			<div class="pp-mini-pinned">
				{#each pinned.slice(1) as post (post.id)}
					<div class="pp-mini-post">
						<div class="pp-mini-post-time">Pinned · <RelativeTime createdAt={post.createdAt} fallback={post.time} /></div>
						<div class="pp-mini-post-body">{post.body}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
