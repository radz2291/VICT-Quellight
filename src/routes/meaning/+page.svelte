<script lang="ts">
	import type { MeaningInspectorData, MeaningRecordView } from '$lib/types';

	let data: MeaningInspectorData | null = $state(null);
	let errorLine = $state<null | string>(null);
	let busyId = $state<null | string>(null);
	let decisionNote = $state<null | string>(null);

	const ORIGIN_LABEL: Record<string, string> = {
		user_stated: 'User stated',
		agent_inferred: 'AI inferred'
	};

	async function load() {
		errorLine = null;
		try {
			const res = await fetch('/api/meaning');
			if (!res.ok) {
				const err = (await res.json().catch(() => ({ message: res.statusText }))) as {
					message?: string;
				};
				errorLine = err.message ?? `Request failed (${res.status}).`;
				return;
			}
			data = (await res.json()) as MeaningInspectorData;
		} catch (e) {
			errorLine = e instanceof Error ? e.message : String(e);
		}
	}

	async function decide(record: MeaningRecordView, decision: 'accept' | 'reject') {
		busyId = record.id;
		decisionNote = null;
		try {
			const res = await fetch('/api/meaning/decision', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ recordId: record.id, decision })
			});
			const body = (await res.json().catch(() => ({}))) as {
				message?: string;
				projectionDegraded?: boolean;
				projectionDetail?: string;
			};
			if (!res.ok) {
				decisionNote = body.message ?? `Request failed (${res.status}).`;
			} else if (body.projectionDegraded) {
				decisionNote = `Decision recorded. Semantic retrieval projection is currently degraded${
					body.projectionDetail ? ` (${body.projectionDetail})` : ''
				}.`;
			} else {
				decisionNote =
					decision === 'accept'
						? 'Accepted: the meaning is now established and eligible for context.'
						: 'Rejected: the meaning will not be used as context.';
			}
			await load();
		} catch (e) {
			decisionNote = e instanceof Error ? e.message : String(e);
		} finally {
			busyId = null;
		}
	}

	function provenance(record: MeaningRecordView): string {
		const base = `${ORIGIN_LABEL[record.origin] ?? record.origin} · source: ${record.sourceReference}`;
		return base;
	}

	function projectionLabel(record: MeaningRecordView): string {
		switch (record.projectionState) {
			case 'projected':
				return 'semantic retrieval: projected';
			case 'failed':
				return `semantic retrieval: degraded${record.projectionDetail ? ` — ${record.projectionDetail}` : ''}`;
			default:
				return record.decisionState === 'accepted'
					? 'semantic retrieval: pending'
					: 'not eligible for retrieval';
		}
	}

	void load();
</script>

<svelte:head>
	<title>Meaning inspector — Quellight</title>
	<meta
		name="description"
		content="Inspect Quellight's durable meaning: current, proposed, and history with provenance."
	/>
</svelte:head>

<div class="shell">
	<header>
		<div class="brand">
			<span class="mark" aria-hidden="true">✦</span>
			<span class="name">Meaning inspector</span>
			<a class="nav-link" href="/">← Conversation</a>
		</div>
		<p class="hint">
			Canonical Quellight meaning (VICT Application Data). Only accepted and current meaning becomes
			active context; correction preserves the full history.
		</p>
	</header>

	{#if errorLine}
		<div class="pill error" role="status">{errorLine}</div>
	{/if}
	{#if decisionNote}
		<div class="pill" role="status">{decisionNote}</div>
	{/if}

	<main>
		{#if data}
			<section aria-label="Known and current meaning">
				<h2>Known / Current</h2>
				{#if data.current.length === 0}
					<p class="empty">Nothing established yet.</p>
				{:else}
					<ul class="cards">
						{#each data.current as record (record.id)}
							<li class="card">
								<div class="key">{record.semanticKey}</div>
								<div class="value">{record.value}</div>
								<div class="prov">{provenance(record)}</div>
								<div class="state">{projectionLabel(record)}</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section aria-label="Proposed meaning">
				<h2>Proposed</h2>
				{#if data.proposed.length === 0}
					<p class="empty">No proposals waiting.</p>
				{:else}
					<ul class="cards">
						{#each data.proposed as record (record.id)}
							<li class="card">
								<div class="key">{record.semanticKey}</div>
								<div class="value">{record.value}</div>
								<div class="prov">{provenance(record)} · inferred, awaiting your decision</div>
								<div class="actions">
									<button
										type="button"
										disabled={busyId !== null}
										onclick={() => void decide(record, 'accept')}>Accept</button
									>
									<button
										type="button"
										class="secondary"
										disabled={busyId !== null}
										onclick={() => void decide(record, 'reject')}>Reject</button
									>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section aria-label="History">
				<h2>History</h2>
				{#if data.history.length === 0}
					<p class="empty">No superseded or rejected meaning.</p>
				{:else}
					<ul class="cards">
						{#each data.history as record (record.id)}
							<li class="card muted">
								<div class="key">{record.semanticKey}</div>
								<div class="value">{record.value}</div>
								<div class="prov">
									{record.effectiveState === 'superseded' && record.supersededBy
										? `Superseded by “${record.supersededBy.value}” (${record.supersededBy.semanticKey})`
										: (ORIGIN_LABEL[record.origin] ?? record.origin)}
									· {provenance(record)}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{:else if !errorLine}
			<p class="empty">Loading meaning…</p>
		{/if}
	</main>
</div>

<style>
	.shell {
		max-width: 760px;
		margin: 0 auto;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: 1rem 1rem 2rem;
	}

	header {
		padding: 0.35rem 0.25rem 0.8rem;
		border-bottom: 1px solid var(--border);
	}

	.brand {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
	}

	.mark {
		color: var(--accent);
	}

	.name {
		font-size: 1.15rem;
		font-weight: 650;
		color: var(--ink-strong);
	}

	.nav-link {
		margin-left: auto;
		font-size: 0.82rem;
		color: var(--accent);
		text-decoration: none;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.2rem 0.7rem;
	}

	.nav-link:hover,
	.nav-link:focus-visible {
		border-color: var(--accent);
	}

	.hint {
		margin: 0.5rem 0 0;
		font-size: 0.82rem;
		color: var(--note);
	}

	.pill {
		align-self: center;
		font-size: 0.8rem;
		color: var(--note);
		background: var(--note-bg);
		border-radius: 999px;
		padding: 0.3rem 0.85rem;
		text-align: center;
		margin: 0.6rem 0 0;
	}

	.pill.error {
		color: var(--error);
		background: var(--error-bg);
	}

	main {
		padding: 1rem 0.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
	}

	h2 {
		font-size: 0.86rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-muted);
		margin: 0 0 0.5rem;
	}

	.empty {
		color: var(--ink-muted);
		font-size: 0.86rem;
		margin: 0.2rem 0;
	}

	.cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 0.7rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.card.muted {
		opacity: 0.75;
	}

	.key {
		font-size: 0.78rem;
		font-weight: 650;
		color: var(--accent);
	}

	.value {
		color: var(--ink-strong);
		overflow-wrap: break-word;
	}

	.prov {
		font-size: 0.76rem;
		color: var(--ink-muted);
		overflow-wrap: break-word;
	}

	.state {
		font-size: 0.76rem;
		color: var(--note);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	.actions button {
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--accent-ink);
		font-weight: 600;
		font-size: 0.82rem;
		border-radius: 8px;
		padding: 0.3rem 0.9rem;
		cursor: pointer;
	}

	.actions button.secondary {
		background: var(--surface);
		color: var(--accent);
	}

	.actions button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
