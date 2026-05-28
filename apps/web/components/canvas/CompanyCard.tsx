'use client';

import Link from 'next/link';
import { ArrowUpRight, Building2, MapPin, Activity } from 'lucide-react';
import type { CompanyBrief } from '@ikan/shared/types';
import { formatRelativeTime } from '@/lib/utils';

/**
 * CompanyCard — top-level entity tile on the canvas. Information-dense but
 * paced: name + aliases up top, two lines for HQ + industry, a row of
 * meta chips (offices count, employee estimate, mobility relevance), and a
 * subtle "open" affordance that takes the user to /c/[slug].
 */
export function CompanyCard({ c }: { c: CompanyBrief }) {
  const mobilityPct = Math.round(c.mobilityRelevanceScore * 100);
  const mobilityHue =
    mobilityPct >= 80
      ? 'text-[var(--color-accent)]'
      : mobilityPct >= 50
        ? 'text-[var(--color-inferred)]'
        : 'text-[var(--color-text-3)]';

  return (
    <article className="animate-rise group surface relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30" />
      <div className="relative flex items-start justify-between gap-4 p-4 pb-2">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-elev-2)]">
            <Building2 className="size-4 text-[var(--color-text-3)]" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[15px] font-medium text-[var(--color-text)]">{c.name}</h3>
              {c.indiaPresence && (
                <span className="chip chip-accent shrink-0" title="India presence confirmed">india</span>
              )}
            </div>
            {c.aliases.length > 0 && (
              <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--color-text-4)]">
                {c.aliases.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/c/${c.slug}`}
          className="shrink-0 rounded-full border border-[var(--color-border-subtle)] p-1.5 text-[var(--color-text-3)] transition-all hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
          aria-label="Open company page"
        >
          <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
        </Link>
      </div>

      {c.description && (
        <p className="px-4 text-[13px] leading-relaxed text-[var(--color-text-2)]">
          {truncate(c.description, 180)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 p-4 pt-3">
        {(c.hqCity || c.hqCountry) && (
          <span className="chip">
            <MapPin className="size-3" strokeWidth={1.8} />
            {[c.hqCity, c.hqCountry].filter(Boolean).join(', ')}
          </span>
        )}
        {c.industry && <span className="chip">{c.industry.toLowerCase()}</span>}
        {c.sizeEstimate && <span className="chip">{c.sizeEstimate}</span>}
        {c.indiaOfficeCount > 0 && (
          <span className="chip">
            <Building2 className="size-3" strokeWidth={1.8} />
            {c.indiaOfficeCount} {c.indiaOfficeCount === 1 ? 'office' : 'offices'}
          </span>
        )}
        {c.recentSignalCount > 0 && (
          <span className="chip">
            <Activity className="size-3" strokeWidth={1.8} />
            {c.recentSignalCount} recent
          </span>
        )}
        <span className={`chip ml-auto ${mobilityHue}`} title="Mobility relevance">
          mobility {mobilityPct}%
        </span>
      </div>

      {c.offices.length > 0 && (
        <div className="border-t border-[var(--color-border-subtle)] px-4 py-2">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-4)]">
            offices
          </p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[var(--color-text-2)]">
            {c.offices.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center gap-1">
                <span className="size-1 rounded-full bg-[var(--color-accent)]/60" aria-hidden />
                <span>{o.city}</span>
                {o.state && <span className="text-[var(--color-text-4)]">· {o.state}</span>}
              </li>
            ))}
            {c.offices.length > 6 && (
              <li className="text-[var(--color-text-4)]">+{c.offices.length - 6} more</li>
            )}
          </ul>
        </div>
      )}

      <div className="border-t border-[var(--color-border-subtle)] px-4 py-1.5 font-mono text-[10px] text-[var(--color-text-4)]">
        updated {formatRelativeTime(c.freshnessAt)}
      </div>
    </article>
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}
