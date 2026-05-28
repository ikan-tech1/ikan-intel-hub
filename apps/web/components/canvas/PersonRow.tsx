'use client';

import Link from 'next/link';
import { Linkedin, ArrowUpRight } from 'lucide-react';
import type { PersonBrief, ContactPointBrief } from '@ikan/shared/types';
import { ContactChip } from './ContactChip';

/**
 * PersonRow — compact one-line row used inside the People section of the
 * canvas. Avatar + name + role + location + LinkedIn chip + contact chips.
 *
 * Designed for high-density lists; the row clicks through to /p/[slug] for
 * the full person page.
 */
export function PersonRow({
  p,
  contacts = [],
}: {
  p: PersonBrief;
  contacts?: ContactPointBrief[];
}) {
  const initial = (p.fullName?.[0] ?? '?').toUpperCase();

  return (
    <li className="animate-rise group relative">
      <Link
        href={`/p/${p.slug}`}
        className="flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2 transition-colors hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface)]/50"
      >
        <div
          className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface-elev-2)] font-mono text-[12px] text-[var(--color-text-2)]"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[14px] text-[var(--color-text)]">{p.fullName}</span>
            {p.currentTitle && (
              <span className="truncate text-[12.5px] text-[var(--color-text-3)]">· {p.currentTitle}</span>
            )}
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--color-text-4)]">
            {p.currentCompanyName && <span className="truncate">{p.currentCompanyName}</span>}
            {p.locationCity && (
              <span>
                <span className="mx-1">·</span>
                {p.locationCity}
              </span>
            )}
            {p.currentDepartment && (
              <span className="text-[var(--color-text-3)]">
                <span className="mx-1">·</span>
                {p.currentDepartment.toLowerCase()}
              </span>
            )}
          </div>
        </div>
        {p.linkedinUrl && (
          <a
            href={p.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 rounded-full p-1.5 text-[var(--color-text-3)] hover:bg-[var(--color-surface-elev)] hover:text-[var(--color-accent)]"
            aria-label="Open LinkedIn"
            title="Open LinkedIn (snippet-only data shown here; install the extension for full profile)"
          >
            <Linkedin className="size-3.5" strokeWidth={1.6} />
          </a>
        )}
        <ArrowUpRight
          className="size-3.5 shrink-0 text-[var(--color-text-4)] opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
          strokeWidth={1.8}
        />
      </Link>
      {contacts.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5 pl-12">
          {contacts.map((c) => (
            <ContactChip key={c.id} c={c} />
          ))}
        </div>
      )}
    </li>
  );
}
