'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from './useIkanChat';
import { ToolCallStrip } from './ToolCallStrip';
import { cn } from '@/lib/utils';

/**
 * ChatColumn — renders the conversation. User messages right-aligned in a
 * subtle elev surface; assistant streams inside a card with a soft left
 * accent border.
 *
 * Citation markers [N] within assistant text get linkified into clickable
 * pills, with hover-snippet via title attribute.
 */
export function ChatColumn({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {messages.map((m) =>
        m.role === 'user' ? <UserBubble key={m.id} text={m.text} /> : <AssistantBubble key={m.id} m={m} />,
      )}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-rise">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-elev)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--color-text)]">
        {text}
      </div>
    </div>
  );
}

function AssistantBubble({
  m,
}: {
  m: Extract<ChatMessage, { role: 'assistant' }>;
}) {
  return (
    <div className="animate-rise">
      <div className="mb-1.5 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-text-4)]">
        <span className="text-[var(--color-accent)]">Ikan</span>
        <span>·</span>
        <span>intel agent</span>
      </div>
      <div
        className={cn(
          'rounded-2xl rounded-tl-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/70 px-4 py-3.5',
          'border-l-2 border-l-[var(--color-accent)]/35',
          m.isStreaming && 'shadow-[inset_0_0_0_1px_rgba(184,255,102,0.06)]',
        )}
      >
        <div className="text-[14.5px] leading-7 text-[var(--color-text)]">
          <RenderedAssistantText text={m.text} citations={m.citations} streaming={m.isStreaming} />
        </div>
        <ToolCallStrip calls={m.toolCalls} />
      </div>
    </div>
  );
}

function RenderedAssistantText({
  text,
  citations,
  streaming,
}: {
  text: string;
  citations: Extract<ChatMessage, { role: 'assistant' }>['citations'];
  streaming: boolean;
}) {
  // Linkify [N] markers into citation pills.
  const parts: React.ReactNode[] = [];
  const re = /\[(\d{1,2})\]/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    parts.push(text.slice(lastIdx, m.index));
    const n = Number(m[1]);
    const c = citations.find((ci) => ci.marker === n);
    parts.push(
      <CitationPill key={`c-${i++}`} marker={n} url={c?.url} snippet={c?.snippet ?? null} />,
    );
    lastIdx = m.index + m[0].length;
  }
  parts.push(text.slice(lastIdx));

  return (
    <p className="whitespace-pre-wrap break-words">
      {parts}
      {streaming && <span className="terminal-cursor align-middle" />}
    </p>
  );
}

function CitationPill({
  marker,
  url,
  snippet,
}: {
  marker: number;
  url: string | undefined;
  snippet: string | null;
}) {
  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noreferrer"
      title={snippet ?? `Source ${marker}`}
      className="mx-0.5 inline-flex h-[18px] min-w-[20px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elev)] px-1.5 font-mono text-[10px] text-[var(--color-text-2)] no-underline transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
    >
      {marker}
    </a>
  );
}
