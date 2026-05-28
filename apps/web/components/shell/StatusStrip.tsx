'use client';

import { useEffect, useState } from 'react';
import { Activity, Cpu, Globe2 } from 'lucide-react';
import { indiaTime } from '@/lib/utils';

/**
 * StatusStrip — bottom-of-screen terminal status. Updates the IST clock once
 * per second. Other indicators (NIM tokens, active jobs) are pluggable via props.
 */
export function StatusStrip({
  tokensUsed = 0,
  tokensCap = 1_000_000,
  activeJobs = 0,
  provider = 'NIM',
}: {
  tokensUsed?: number;
  tokensCap?: number;
  activeJobs?: number;
  provider?: string;
}) {
  const [clock, setClock] = useState(indiaTime());
  useEffect(() => {
    const id = setInterval(() => setClock(indiaTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(100, (tokensUsed / Math.max(1, tokensCap)) * 100);
  const dotColor =
    pct < 70 ? 'bg-[var(--color-verified)]' : pct < 90 ? 'bg-[var(--color-inferred)]' : 'bg-[var(--color-dnc)]';

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg)]/85 backdrop-blur-md">
      <div className="flex h-9 items-center justify-between gap-6 px-5 font-mono text-[11px] text-[var(--color-text-3)]">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${dotColor} animate-pulse-soft`} />
            <span className="text-[var(--color-text-2)]">{provider.toLowerCase()}</span>
            <span className="text-[var(--color-text-4)]">/</span>
            <span>{formatTokens(tokensUsed)} / {formatTokens(tokensCap)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="size-3" strokeWidth={1.6} />
            <span>{activeJobs} active</span>
          </span>
          <span className="hidden items-center gap-1.5 md:flex">
            <Cpu className="size-3" strokeWidth={1.6} />
            <span>llama 3.3 70b · 8b extract</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe2 className="size-3" strokeWidth={1.6} />
          <span className="text-[var(--color-text-2)]">{clock}</span>
          <span className="text-[var(--color-text-4)]">IST</span>
        </div>
      </div>
    </footer>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}
