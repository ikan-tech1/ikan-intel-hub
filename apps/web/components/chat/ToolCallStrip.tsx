'use client';

import { Check, Loader2, X } from 'lucide-react';
import type { ToolCallView } from './useIkanChat';

const HUMAN_NAMES: Record<string, string> = {
  search_companies: 'Searching companies',
  search_persons: 'Searching people',
  search_signals: 'Searching signals',
  get_company_brief: 'Loading company brief',
  get_person_brief: 'Loading person brief',
  find_contacts: 'Resolving contacts',
  linkedin_lookup: 'Looking up LinkedIn',
  refresh_entity: 'Refreshing source data',
  add_to_list: 'Adding to list',
  create_list: 'Creating list',
  generate_outreach_brief: 'Drafting outreach brief',
  export_csv: 'Exporting CSV',
};

/**
 * ToolCallStrip — shows what the agent did mid-answer.
 *
 * Visible *under* the assistant message. Each tool gets a row: running shows
 * a pulsing dot, success a checkmark, error an X. Hover reveals the args
 * preview. This is the "radical transparency" promise from the plan.
 */
export function ToolCallStrip({ calls }: { calls: ToolCallView[] }) {
  if (calls.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5 border-l border-[var(--color-border-subtle)] pl-3">
      {calls.map((c, i) => (
        <li
          key={`${c.name}-${i}`}
          className="flex items-center gap-2 font-mono text-[11px] text-[var(--color-text-3)] animate-rise"
        >
          {c.state === 'running' ? (
            <Loader2 className="size-3 animate-spin text-[var(--color-accent)]" strokeWidth={2} />
          ) : c.state === 'success' ? (
            <Check className="size-3 text-[var(--color-verified)]" strokeWidth={2.2} />
          ) : (
            <X className="size-3 text-[var(--color-dnc)]" strokeWidth={2.2} />
          )}
          <span className="text-[var(--color-text-2)]">{HUMAN_NAMES[c.name] ?? c.name}</span>
          {c.argsPreview ? (
            <span className="truncate text-[var(--color-text-4)]" title={c.argsPreview}>
              · {c.argsPreview}
            </span>
          ) : null}
          {typeof c.durationMs === 'number' ? (
            <span className="ml-auto shrink-0 text-[var(--color-text-4)]">{c.durationMs}ms</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
