'use client';

import Link from 'next/link';
import { Bell, Command, ListChecks, Radio, Settings2, Sparkles } from 'lucide-react';

/**
 * TopBar — terminal-style navigation. Monospace breadcrumbs, accent crosshair
 * separator, minimal chrome. Sits above both columns of the chat hero.
 */
export function TopBar({
  threadCount = 0,
}: {
  threadCount?: number;
}) {
  return (
    <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="flex h-12 items-center justify-between gap-6 px-5">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-text)]">
            <Sparkles className="size-4 text-[var(--color-accent)]" strokeWidth={1.6} />
            <span>Ikan Intel</span>
            <span className="text-[var(--color-text-4)]">/</span>
            <span className="text-[var(--color-text-3)]">terminal</span>
          </Link>
          <nav className="hidden items-center gap-4 font-mono text-[11px] text-[var(--color-text-3)] md:flex">
            <NavLink href="/c/t" icon={<Radio className="size-3.5" strokeWidth={1.6} />}>
              threads <span className="ml-1 text-[var(--color-text-4)]">{threadCount}</span>
            </NavLink>
            <NavLink href="/signals" icon={<Bell className="size-3.5" strokeWidth={1.6} />}>signals</NavLink>
            <NavLink href="/lists" icon={<ListChecks className="size-3.5" strokeWidth={1.6} />}>lists</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="chip hover:border-[var(--color-text-4)] hover:text-[var(--color-text)] transition-colors"
            aria-label="Open command palette"
            type="button"
          >
            <Command className="size-3" strokeWidth={1.8} />
            <span>K</span>
          </button>
          <Link
            href="/settings"
            className="text-[var(--color-text-3)] hover:text-[var(--color-text)] transition-colors"
            aria-label="Settings"
          >
            <Settings2 className="size-4" strokeWidth={1.6} />
          </Link>
          <div
            className="ml-1 grid size-7 place-items-center rounded-full bg-[var(--color-surface-elev)] font-mono text-[11px] uppercase text-[var(--color-text-2)]"
            aria-label="Avatar"
          >
            I
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 transition-colors hover:text-[var(--color-text)]"
    >
      {icon}
      <span className="lowercase">{children}</span>
    </Link>
  );
}
