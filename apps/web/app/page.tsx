'use client';

import { useState } from 'react';
import { TopBar } from '@/components/shell/TopBar';
import { StatusStrip } from '@/components/shell/StatusStrip';
import { ParticleField } from '@/components/hero/ParticleField';
import { ChatInput } from '@/components/hero/ChatInput';
import { ExampleQueries } from '@/components/hero/ExampleQueries';
import { ChatColumn } from '@/components/chat/ChatColumn';
import { CanvasColumn } from '@/components/canvas/CanvasColumn';
import { useIkanChat } from '@/components/chat/useIkanChat';

/**
 * Home — the hero / chat / canvas all in one. Two states:
 *
 *   [empty]   centered hero with serif title, mono subtitle, large pill input,
 *             particle background, three example prompts. The product's
 *             first impression.
 *
 *   [active]  the hero collapses; the page splits into chat (left, max-w-2xl)
 *             and a live canvas (right, flex-1). The input pins to the bottom
 *             of the chat column and stays available for follow-ups.
 *
 * Transition between states is implicit: messages.length === 0 → empty mode.
 * Sending a message instantly shifts to active mode (the bubble + canvas).
 */
export default function Home() {
  const chat = useIkanChat({ threadId: null });
  const empty = chat.messages.length === 0;
  const [draft, setDraft] = useState('');

  const handleSubmit = (text: string) => {
    void chat.send(text);
  };

  const handlePickExample = (q: string) => {
    setDraft(q);
    void chat.send(q);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar threadCount={0} />

      <main className="flex flex-1 flex-col">
        {empty ? <HeroEmpty onSubmit={handleSubmit} onPickExample={handlePickExample} draftSeed={draft} /> : (
          <SplitView
            chat={chat}
            onSubmit={handleSubmit}
          />
        )}
      </main>

      <StatusStrip
        tokensUsed={0}
        tokensCap={1_000_000}
        activeJobs={chat.streaming ? 1 : 0}
        provider="NIM"
      />
    </div>
  );
}

/* --------------------------- Empty (hero) state --------------------------- */

function HeroEmpty({
  onSubmit,
  onPickExample,
  draftSeed,
}: {
  onSubmit: (q: string) => void;
  onPickExample: (q: string) => void;
  draftSeed: string;
}) {
  return (
    <section className="relative flex flex-1 flex-col items-center justify-center px-5 pb-24 pt-12">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <ParticleField density={70} className="opacity-90" />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <span
          className="chip mb-5"
          aria-label="India-first intelligence terminal"
        >
          <span className="size-1.5 rounded-full bg-[var(--color-accent)]" />
          india-first · cited · agentic
        </span>

        <h1 className="font-display text-[64px] leading-[0.95] tracking-[-0.02em] text-[var(--color-text)] md:text-[80px]">
          Ikan <span className="italic text-[var(--color-accent)]">Intel.</span>
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-text-3)]">
          the india b2b intelligence terminal
        </p>

        <p className="mt-6 max-w-xl text-[14.5px] leading-relaxed text-[var(--color-text-2)]">
          Type any company or person — Ikan synthesizes a structured, source-cited brief
          from public web, news, careers boards, and LinkedIn snippets.
          Built for BD, mobility, and account-based outreach in India.
        </p>

        <div className="mt-8 w-full max-w-2xl">
          <ChatInput onSubmit={onSubmit} initialValue={draftSeed} />
        </div>

        <div className="mt-6 w-full max-w-2xl">
          <ExampleQueries onPick={onPickExample} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[10.5px] text-[var(--color-text-4)]">
          <span>powered by NVIDIA NIM</span>
          <span>·</span>
          <span>llama 3.3 70b agent</span>
          <span>·</span>
          <span>nv-embedqa-e5 retrieval</span>
          <span>·</span>
          <span>postgres + pgvector</span>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Active split view --------------------------- */

function SplitView({
  chat,
  onSubmit,
}: {
  chat: ReturnType<typeof useIkanChat>;
  onSubmit: (q: string) => void;
}) {
  return (
    <div className="grid flex-1 grid-cols-1 gap-6 px-5 pb-24 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Chat column */}
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-text-4)]">
          <span>chat</span>
          <span>{chat.streaming ? 'streaming…' : 'idle'}</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <ChatColumn messages={chat.messages} />
        </div>
        <div className="sticky bottom-12 -mb-3 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)] to-transparent pb-3 pt-6">
          <ChatInput onSubmit={onSubmit} isStreaming={chat.streaming} placeholder="Ask a follow-up — refine, search wider, or pivot to a new entity." />
        </div>
      </div>

      {/* Canvas column */}
      <aside className="flex min-h-0 flex-col gap-4 lg:border-l lg:border-[var(--color-border-subtle)] lg:pl-6">
        <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-text-4)]">
          <span>canvas</span>
          <span>
            {chat.canvas.companyOrder.length}c · {chat.canvas.personOrder.length}p ·{' '}
            {chat.canvas.signalOrder.length}s
          </span>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <CanvasColumn canvas={chat.canvas} isActive={chat.streaming} />
        </div>
        {chat.error && (
          <div className="rounded-md border border-[var(--color-dnc)]/40 bg-[var(--color-dnc)]/10 px-3 py-2 font-mono text-[12px] text-[var(--color-dnc)]">
            {chat.error}
          </div>
        )}
      </aside>
    </div>
  );
}
