'use client';

import { ArrowUpRight } from 'lucide-react';

/**
 * ExampleQueries — three terminal-style prompt cards under the empty hero.
 * Click to autofill + submit the chat. Each example demonstrates a different
 * agent capability so the user understands what the product does in 1 glance.
 */

const EXAMPLES = [
  {
    label: 'company brief',
    query: 'Tell me everything about Mercedes-Benz India — offices, recent signals, who runs HR.',
  },
  {
    label: 'contacts',
    query:
      'Find the global mobility leaders at multinationals in Bengaluru. Include emails and phones.',
  },
  {
    label: 'signal feed',
    query:
      'Which multinationals opened a new India office or made a major HR hire in the last 90 days?',
  },
] as const;

export function ExampleQueries({ onPick }: { onPick: (q: string) => void }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-3" aria-label="Example queries">
      {EXAMPLES.map((ex) => (
        <li key={ex.label}>
          <button
            type="button"
            onClick={() => onPick(ex.query)}
            className="group relative flex h-full w-full flex-col items-start gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/60 p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(184,255,102,0.35)] hover:bg-[var(--color-surface)]"
          >
            <span className="flex w-full items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--color-text-4)] group-hover:text-[var(--color-accent)]">
                {ex.label}
              </span>
              <ArrowUpRight
                className="size-3.5 text-[var(--color-text-4)] transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]"
                strokeWidth={1.8}
              />
            </span>
            <span className="text-[13.5px] leading-snug text-[var(--color-text-2)] group-hover:text-[var(--color-text)]">
              {ex.query}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
