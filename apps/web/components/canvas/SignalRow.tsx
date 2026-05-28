'use client';

import {
  ArrowUpRight,
  Briefcase,
  Building,
  Users,
  TrendingUp,
  RefreshCw,
  Megaphone,
  CircleDollarSign,
  Plug,
  type LucideIcon,
} from 'lucide-react';
import type { SignalBrief } from '@ikan/shared/types';
import { formatRelativeTime } from '@/lib/utils';

const KIND_ICON: Record<string, LucideIcon> = {
  office_opening: Building,
  hiring_spike: TrendingUp,
  mobility_hire: Users,
  hr_hire: Users,
  leadership_change: Users,
  funding: CircleDollarSign,
  acquisition: Plug,
  layoff: TrendingUp,
  client_win: Briefcase,
  market_entry: Building,
  expansion_announce: Megaphone,
  product_launch: Megaphone,
  partnership_announce: Plug,
};

const KIND_LABEL: Record<string, string> = {
  office_opening: 'office',
  hiring_spike: 'hiring',
  mobility_hire: 'mobility hire',
  hr_hire: 'hr hire',
  leadership_change: 'leadership',
  funding: 'funding',
  acquisition: 'acquisition',
  layoff: 'layoff',
  client_win: 'client win',
  market_entry: 'market entry',
  expansion_announce: 'expansion',
  product_launch: 'product',
  partnership_announce: 'partnership',
};

/**
 * SignalRow — one row per signal in the canvas. Compact, with a kind icon
 * (custom per signal type), a headline, the "why it matters" italicized
 * (display serif for a touch of magazine quality), and a timestamp.
 */
export function SignalRow({ s }: { s: SignalBrief }) {
  const Icon = KIND_ICON[s.kind] ?? RefreshCw;
  const label = KIND_LABEL[s.kind] ?? s.kind;
  const recencyClass =
    Date.now() - new Date(s.occurredAt).getTime() < 7 * 86400_000
      ? 'text-[var(--color-accent)]'
      : 'text-[var(--color-text-4)]';

  return (
    <li className="animate-rise group flex items-start gap-3 rounded-md border border-transparent px-2.5 py-2.5 hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]/50">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-elev-2)] text-[var(--color-accent)]">
        <Icon className="size-3.5" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="chip text-[10px]">{label}</span>
          {s.companyName && (
            <span className="truncate text-[12.5px] text-[var(--color-text-3)]">{s.companyName}</span>
          )}
          <span className={`ml-auto shrink-0 font-mono text-[10.5px] ${recencyClass}`}>
            {formatRelativeTime(s.occurredAt)}
          </span>
        </div>
        <p className="mt-1 text-[13.5px] leading-snug text-[var(--color-text)]">{s.title}</p>
        {s.whyItMatters && (
          <p className="font-display mt-1 text-[12.5px] italic leading-snug text-[var(--color-text-3)]">
            “{s.whyItMatters}”
          </p>
        )}
      </div>
      <a
        href={s.url}
        target="_blank"
        rel="noreferrer"
        className="ml-2 shrink-0 rounded-full p-1 text-[var(--color-text-4)] opacity-0 transition-opacity hover:bg-[var(--color-surface-elev)] hover:text-[var(--color-accent)] group-hover:opacity-100"
        aria-label="Open source"
        onClick={(e) => e.stopPropagation()}
      >
        <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
      </a>
    </li>
  );
}
