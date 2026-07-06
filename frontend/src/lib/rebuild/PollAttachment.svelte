<script lang="ts">
	import type { PollAttachment as PollAttachmentData } from './attachments';

	type PollChoiceView = {
		id: string;
		label: string;
		votes: number;
	};

	type Props = {
		poll: PollAttachmentData;
		onVote?: (pollId: string | undefined, choice: string | string[]) => void;
	};

	let { poll, onVote }: Props = $props();
	const inputInstanceId = $props.id();
	let picked = $state<Set<string>>(new Set());
	let forceResults = $state(false);

	let choices = $derived<PollChoiceView[]>((poll.choices ?? []).map((choice, index) => ({
		id: choice.id ?? String(index),
		label: choice.label,
		votes: choice.votes ?? 0
	})));
	let total = $derived(poll.totalVotes ?? choices.reduce((sum, choice) => sum + choice.votes, 0));
	let expired = $derived(Boolean(poll.expired));
	let vote = $derived(poll.myVote ?? null);
	let viewerVoted = $derived(Boolean(poll.voted) || vote !== null);
	let showResults = $derived(forceResults || expired || viewerVoted);
	let canReturnToVoting = $derived(forceResults && !expired && !viewerVoted);
	let canVote = $derived(Boolean(onVote));
	let inputName = $derived(`poll-${poll.id ?? 'attachment'}-${inputInstanceId}`);
	let winnerId = $derived.by(() => {
		const winner = choices.reduce<PollChoiceView | null>((best, choice) => {
			if (!best || choice.votes > best.votes) return choice;
			return best;
		}, null);

		return winner && winner.votes > 0 ? winner.id : null;
	});

	const isMyVote = (id: string) => Array.isArray(vote) ? vote.includes(id) : vote === id;
	const pct = (votes: number) => total > 0 ? Math.round((votes / total) * 100) : 0;
	const statusText = () => {
		if (expired) return poll.endedAgo ? `Ended ${poll.endedAgo}` : 'Ended';
		return poll.endsIn ? `Ends in ${poll.endsIn}` : 'Live';
	};
	const toggle = (id: string) => {
		const next = new Set(picked);
		if (poll.multi) {
			next.has(id) ? next.delete(id) : next.add(id);
		} else {
			next.clear();
			next.add(id);
		}
		picked = next;
	};
	const submit = () => {
		if (picked.size === 0 || !onVote) return;
		const choice = poll.multi ? [...picked] : [...picked][0];
		onVote(poll.id, choice);
	};
</script>

<div class="post-poll" data-post-ignore>
	{#if showResults}
		{#each choices as choice}
			{@const percent = pct(choice.votes)}
			<div class="post-poll-row {choice.id === winnerId ? 'winner' : ''} {isMyVote(choice.id) ? 'me' : ''}">
				<div>
					<div class="post-poll-label">
						{choice.label}
						{#if isMyVote(choice.id)}<span class="post-poll-you">You</span>{/if}
					</div>
					<div class="post-poll-track">
						<div class="post-poll-fill" style={`width:${percent}%`}></div>
					</div>
				</div>
				<div>
					<div class="post-poll-pct">{percent}%</div>
					<div class="post-poll-num">{choice.votes}</div>
				</div>
			</div>
		{/each}
		<div class="post-poll-meta">
			<span class="post-poll-pill {expired ? '' : 'live'}">
				<span class="pp-dot"></span>
				{statusText()}
			</span>
			<span>{total} {total === 1 ? 'vote' : 'votes'}</span>
			{#if viewerVoted}
				<span class="dot">·</span>
				<span>you voted</span>
			{/if}
		</div>
		{#if canReturnToVoting}
			<div class="post-poll-foot">
				<button type="button" class="post-poll-results-link" onclick={() => (forceResults = false)}>Back to voting</button>
			</div>
		{/if}
	{:else}
		<div role={poll.multi ? 'group' : 'radiogroup'} aria-label="Poll choices">
			{#each choices as choice}
				<label class="post-poll-vote-row {picked.has(choice.id) ? 'selected' : ''}">
					<input
						class="post-poll-native"
						type={poll.multi ? 'checkbox' : 'radio'}
						name={inputName}
						checked={picked.has(choice.id)}
						onchange={() => toggle(choice.id)}
					/>
					<span class={poll.multi ? 'post-poll-check' : 'post-poll-radio'} aria-hidden="true"></span>
					<span class="post-poll-vote-label">{choice.label}</span>
				</label>
			{/each}
		</div>
		<div class="post-poll-foot">
			<button
				type="button"
				class="post-poll-vote-btn"
				disabled={picked.size === 0 || !canVote}
				title={canVote ? undefined : 'Voting is unavailable in this view'}
				onclick={submit}
			>
				{poll.multi && picked.size > 1 ? `Vote · ${picked.size} selected` : 'Vote'}
			</button>
			<button type="button" class="post-poll-results-link" onclick={() => (forceResults = true)}>View results -&gt;</button>
			<span class="post-poll-foot-meta">{poll.endsIn ? `${poll.endsIn} left · ` : ''}{total} {total === 1 ? 'vote' : 'votes'}</span>
		</div>
	{/if}
</div>
