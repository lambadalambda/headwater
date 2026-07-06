<script lang="ts">
	import { onMount } from 'svelte';
	import type { ComposerPollDraft } from './composer';

	type Props = {
		poll: ComposerPollDraft;
		onPollChange: (poll: ComposerPollDraft) => void;
		onRemove: () => void;
		focusOnMount?: boolean;
		idPrefix?: string;
	};

	let { poll, onPollChange, onRemove, focusOnMount = false, idPrefix = 'composer-poll' }: Props = $props();
	let panel: HTMLDivElement | null = null;
	let durationId = $derived(`${idPrefix}-duration`);
	let votingId = $derived(`${idPrefix}-voting`);

	const setPoll = (patch: Partial<ComposerPollDraft>) => onPollChange({ ...poll, ...patch });
	const setChoice = (index: number, value: string) => setPoll({ choices: poll.choices.map((choice, i) => i === index ? value : choice) });
	const addChoice = () => {
		if (poll.choices.length >= 6) return;
		setPoll({ choices: [...poll.choices, ''] });
	};
	const removeChoice = (index: number) => {
		if (poll.choices.length <= 2) return;
		setPoll({ choices: poll.choices.filter((_, i) => i !== index) });
	};

	onMount(() => {
		if (focusOnMount) panel?.querySelector<HTMLInputElement>('.composer-poll-input')?.focus();
	});
</script>

<div class="composer-poll" bind:this={panel}>
	<div class="composer-poll-head">
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true">
			<path d="M3 4h10M3 8h10M3 12h6" />
			<path d="M11 11l1.5 1.5L15 10" />
		</svg>
		Poll · 2–6 choices
		<button type="button" class="composer-poll-x" onclick={onRemove} title="Remove poll" aria-label="Remove poll">
			<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="13" height="13" aria-hidden="true">
				<path d="M4 4l8 8M12 4l-8 8" />
			</svg>
		</button>
	</div>

	{#each poll.choices as choice, i}
		<div class="composer-poll-opt">
			<span class="composer-poll-handle" aria-hidden="true">
				<svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
					<circle cx="6" cy="4" r="1" /><circle cx="10" cy="4" r="1" />
					<circle cx="6" cy="8" r="1" /><circle cx="10" cy="8" r="1" />
					<circle cx="6" cy="12" r="1" /><circle cx="10" cy="12" r="1" />
				</svg>
			</span>
			<input
				class="composer-poll-input"
				aria-label={`Poll choice ${i + 1}`}
				value={choice}
				placeholder={`Choice ${i + 1}`}
				maxlength="50"
				oninput={(event) => setChoice(i, event.currentTarget.value)}
			/>
			<span class="composer-poll-counter" class:over={choice.length > 40}>{choice.length}/50</span>
			<button
				type="button"
				class="composer-poll-rm"
				class:disabled={poll.choices.length <= 2}
				disabled={poll.choices.length <= 2}
				onclick={() => removeChoice(i)}
				aria-label={`Remove choice ${i + 1}`}
			>
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="12" height="12" aria-hidden="true">
					<path d="M4 4l8 8M12 4l-8 8" />
				</svg>
			</button>
		</div>
	{/each}

	<button type="button" class="composer-poll-add" class:disabled={poll.choices.length >= 6} disabled={poll.choices.length >= 6} onclick={addChoice}>
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" width="12" height="12" aria-hidden="true">
			<path d="M8 3v10M3 8h10" />
		</svg>
		Add choice
	</button>

	<div class="composer-poll-settings">
		<div class="composer-poll-setting">
			<label class="composer-poll-setting-l" for={durationId}>Duration</label>
			<select id={durationId} class="composer-poll-select" value={poll.duration} onchange={(event) => setPoll({ duration: event.currentTarget.value })}>
				<option value="5m">5 minutes</option>
				<option value="1h">1 hour</option>
				<option value="6h">6 hours</option>
				<option value="24h">24 hours</option>
				<option value="3d">3 days</option>
				<option value="7d">7 days</option>
			</select>
		</div>
		<div class="composer-poll-setting">
			<label class="composer-poll-setting-l" for={votingId}>Voting</label>
			<select id={votingId} class="composer-poll-select" value={poll.multi ? 'multi' : 'single'} onchange={(event) => setPoll({ multi: event.currentTarget.value === 'multi' })}>
				<option value="single">Single choice</option>
				<option value="multi">Multiple choices</option>
			</select>
		</div>
		<button type="button" class="composer-poll-toggle" aria-pressed={poll.hideUntil} onclick={() => setPoll({ hideUntil: !poll.hideUntil })}>
			<span class="pp-tog" class:on={poll.hideUntil}></span>
			<span>Hide totals until poll ends</span>
		</button>
	</div>
</div>
