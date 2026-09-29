<script lang="ts">
	import { onMount } from 'svelte';
	import type { TurnMeta, TurnResponse } from '$lib/types';

	type Msg =
		| { kind: 'user'; id: number; text: string }
		| { kind: 'assistant'; id: number; text: string; meta: TurnMeta }
		| { kind: 'note'; id: number; text: string; tone: 'info' | 'error' };

	let messages: Msg[] = $state([]);
	let input = $state('');
	let busy = $state(false);
	let statusLine = $state<null | string>(null);
	let listEl: HTMLElement | null = $state(null);
	let inputEl: HTMLTextAreaElement | null = $state(null);
	let uid = 0;

	const DEMO_PROMPTS: { label: string; text: string }[] = [
		{ label: 'Greet', text: 'Hello.' },
		{ label: 'Store a fact', text: 'My project codename is Zephyr.' },
		{ label: 'Ask recall', text: 'What is my project codename?' },
		{ label: 'Off-corpus check', text: 'What is my favorite color?' }
	];

	onMount(async () => {
		inputEl?.focus();
		try {
			const res = await fetch('/api/health');
			if (res.ok) {
				const status = await res.json();
				statusLine =
					status.knowledge.state === 'ready'
						? null
						: `Knowledge retrieval is unavailable in this session (${status.knowledge.detail ?? 'not ready'}). Quellight will answer without it.`;
				messages.push({
					kind: 'note',
					id: uid++,
					tone: 'info',
					text:
						'Deterministic G1 proof mode — model: deterministic offline fixture through VICT. Knowledge answers come only from what you store in this session store.'
				});
			}
		} catch {
			messages.push({
				kind: 'note',
				id: uid++,
				tone: 'error',
				text: 'Could not reach the Quellight server.'
			});
		}
	});

	$effect(() => {
		if (listEl) {
			listEl.scrollTop = listEl.scrollHeight;
		}
	});

	async function send(text: string) {
		const content = text.trim();
		if (!content || busy) return;
		input = '';
		const echoNote: Msg = {
			kind: 'note',
			id: uid++,
			tone: 'info',
			text: 'Storing turn in durable knowledge and thinking…'
		};
		messages = [...messages, { kind: 'user', id: uid++, text: content }, echoNote];
		busy = true;
		const noteId = echoNote.id;
		try {
			const res = await fetch('/api/turn', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: content })
			});
			messages = messages.filter((m) => m.id !== noteId);
			if (!res.ok) {
				const err = (await res.json().catch(() => ({ message: res.statusText }))) as {
					message?: string;
				};
				messages = [
					...messages,
					{ kind: 'note', id: uid++, tone: 'error', text: err.message ?? `Request failed (${res.status}).` }
				];
			} else {
				const data = (await res.json()) as TurnResponse;
				if (data.kind === 'assistant') {
					const meta: TurnMeta = data.meta;
					messages = [...messages, { kind: 'assistant', id: uid++, text: data.text, meta }];
					if (meta.intakeDegraded) {
						messages = [
							...messages,
							{
								kind: 'note',
								id: uid++,
								tone: 'info',
								text: 'Durable knowledge intake failed for this turn; earlier knowledge still applies.'
							}
						];
					}
					if (meta.retrieval === 'unavailable') {
						messages = [
							...messages,
							{
								kind: 'note',
								id: uid++,
								tone: 'info',
								text: 'Knowledge retrieval was unavailable — answered without it. Nothing fabricated.'
							}
						];
					}
				}
			}
		} catch (e) {
			messages = messages.filter((m) => m.id !== noteId);
			messages = [
				...messages,
				{
					kind: 'note',
					id: uid++,
					tone: 'error',
					text: `Quellight could not be reached: ${e instanceof Error ? e.message : String(e)}`
				}
			];
		} finally {
			busy = false;
			inputEl?.focus();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			void send(input);
		}
	}
</script>

<svelte:head>
	<title>Quellight</title>
	<meta name="description" content="Quellight — your persistent cognitive partner (G1 walking slice)" />
</svelte:head>

<div class="shell">
	<header>
		<div class="brand">
			<span class="mark" aria-hidden="true">✦</span>
			<span class="name">Quellight</span>
			<span class="tagline">walking proof · G1</span>
		</div>
		{#if statusLine}
			<p class="status degraded">{statusLine}</p>
		{/if}
	</header>

	<main class="thread" bind:this={listEl} aria-live="polite">
		{#each messages as message (message.id)}
			{#if message.kind === 'user'}
				<div class="row user">
					<div class="bubble user">{message.text}</div>
				</div>
			{:else if message.kind === 'assistant'}
				<div class="row assistant">
					<div class="speaker">Quellight</div>
					<div class="bubble assistant">{message.text}</div>
					{#if message.meta.retrieval === 'used'}
						<div class="meta">answered using retrieved candidate context</div>
					{:else if message.meta.retrieval === 'miss'}
						<div class="meta">no candidate knowledge was retrieved for this turn</div>
					{/if}
				</div>
			{:else}
				<div class="row note">
					<div class="note-pill {message.tone}" role="status">{message.text}</div>
				</div>
			{/if}
		{/each}
		{#if busy}
			<div class="row assistant">
				<div class="speaker">Quellight</div>
				<div class="bubble assistant thinking" role="status">Thinking<span class="dots">…</span></div>
			</div>
		{/if}
	</main>

	<div class="chips" aria-label="Suggested demo prompts">
		{#each DEMO_PROMPTS as demo (demo.text)}
			<button class="chip" type="button" disabled={busy} onclick={() => void send(demo.text)}>
				{demo.label}
			</button>
		{/each}
	</div>

	<footer>
		<textarea
			bind:this={inputEl}
			bind:value={input}
			rows="2"
			placeholder="Message Quellight…"
			aria-label="Message Quellight"
			onkeydown={onKeydown}
			disabled={busy}
		></textarea>
		<button class="send" type="button" disabled={busy || input.trim().length === 0} onclick={() => void send(input)}>
			Send
		</button>
	</footer>
</div>

<style>
	.shell {
		max-width: 760px;
		margin: 0 auto;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: 1rem 1rem 0.75rem;
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
		letter-spacing: 0.01em;
		color: var(--ink-strong);
	}

	.tagline {
		color: var(--ink-muted);
		font-size: 0.8rem;
	}

	.status {
		margin: 0.5rem 0 0;
		font-size: 0.82rem;
		color: var(--note);
	}

	.thread-gap {
		height: 8px;
	}

	.thread {
		flex: 1;
		overflow-y: auto;
		padding: 1.4rem 0.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		max-width: 88%;
	}

	.row.user {
		align-self: flex-end;
		align-items: flex-end;
	}

	.row.assistant {
		align-self: flex-start;
	}

	.speaker {
		font-size: 0.74rem;
		font-weight: 650;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.bubble {
		padding: 0.65rem 0.9rem;
		border-radius: 14px;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}

	.bubble.user {
		background: var(--user-bubble);
		color: var(--accent-ink);
		border-bottom-right-radius: 4px;
	}

	.bubble.assistant {
		background: var(--assistant-bubble);
		border: 1px solid var(--border);
		color: var(--ink-strong);
		border-bottom-left-radius: 4px;
	}

	.bubble.thinking {
		color: var(--ink-muted);
		font-style: italic;
		border-style: dashed;
	}

	.meta {
		font-size: 0.74rem;
		color: var(--ink-muted);
	}

	.note-pill {
		align-self: center;
		font-size: 0.8rem;
		color: var(--note);
		background: var(--note-bg);
		border-radius: 999px;
		padding: 0.3rem 0.85rem;
		text-align: center;
	}

	.note-pill.error {
		color: var(--error);
		background: var(--error-bg);
	}

	.chips {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding: 0 0.25rem 0.65rem;
	}

	.chip {
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--ink);
		border-radius: 999px;
		font-size: 0.82rem;
		padding: 0.35rem 0.8rem;
		cursor: pointer;
	}

	.chip:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.chip:disabled {
		opacity: 0.5;
		cursor: default;
	}

	footer {
		display: flex;
		gap: 0.6rem;
		align-items: flex-end;
		padding: 0.55rem 0.25rem;
		border-top: 1px solid var(--border);
	}

	textarea {
		flex: 1;
		resize: none;
		font: inherit;
		padding: 0.55rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--surface);
		color: var(--ink-strong);
	}

	textarea:focus {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
	}

	.send {
		border: none;
		background: var(--accent);
		color: var(--accent-ink);
		font-weight: 600;
		border-radius: 10px;
		padding: 0.55rem 1.1rem;
		cursor: pointer;
	}

	.send:disabled {
		opacity: 0.45;
		cursor: default;
	}

	@media (max-width: 560px) {
		.row {
			max-width: 95%;
		}
	}
</style>