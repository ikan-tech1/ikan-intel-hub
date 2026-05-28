'use client';

import { useState } from 'react';
import { Check, AlertTriangle, Ban, Copy, Mail, Phone } from 'lucide-react';
import type { ContactPointBrief } from '@ikan/shared/types';
import { cn } from '@/lib/utils';

/**
 * ContactChip — three visual states that telegraph quality at a glance:
 *
 *   verified  : solid emerald + check + plain text     (high trust)
 *   inferred  : dashed amber + warning icon + confidence%  (use with care)
 *   dnc       : red strikethrough + ban icon                (do NOT contact)
 *
 * Click copies to clipboard. Hover reveals confidence + verification method.
 */
export function ContactChip({ c }: { c: ContactPointBrief }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (c.status === 'dnc') return;
    try {
      await navigator.clipboard.writeText(c.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // soft-fail
    }
  };

  const isEmail = c.kind === 'email' || c.kind === 'generic_email';
  const Icon = isEmail ? Mail : Phone;

  const base =
    'group inline-flex max-w-full items-center gap-1.5 font-mono text-[11.5px] leading-[18px] transition-colors';

  if (c.status === 'verified') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        title={`Verified · ${(c.confidence * 100).toFixed(0)}% · ${c.verificationMethod}`}
        className={cn(
          base,
          'rounded-md border border-[rgba(52,211,153,0.25)] bg-[rgba(52,211,153,0.06)] px-2 py-0.5 text-[var(--color-verified)] hover:bg-[rgba(52,211,153,0.12)]',
        )}
      >
        <Icon className="size-3 shrink-0" strokeWidth={1.8} />
        <span className="truncate">{c.value}</span>
        {copied ? (
          <Check className="size-3 shrink-0" strokeWidth={2.2} />
        ) : (
          <Copy className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.8} />
        )}
      </button>
    );
  }

  if (c.status === 'inferred') {
    const confidencePct = Math.round(c.confidence * 100);
    return (
      <button
        type="button"
        onClick={handleCopy}
        title={`Inferred · ${confidencePct}% via ${c.verificationMethod} · click to copy, treat with care`}
        className={cn(
          base,
          'rounded-md border border-dashed border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.06)] px-2 py-0.5 text-[var(--color-inferred)] hover:bg-[rgba(245,158,11,0.1)]',
        )}
      >
        <AlertTriangle className="size-3 shrink-0" strokeWidth={1.8} />
        <span className="truncate">{c.value}</span>
        <span className="ml-1 shrink-0 text-[10px] text-[var(--color-text-3)]">{confidencePct}%</span>
        {copied && <Check className="size-3 shrink-0 text-[var(--color-verified)]" strokeWidth={2.2} />}
      </button>
    );
  }

  // dnc / reported_bad
  return (
    <span
      title={c.status === 'dnc' ? 'Do not contact' : 'Reported as wrong'}
      className={cn(
        base,
        'rounded-md border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.06)] px-2 py-0.5 text-[var(--color-dnc)] line-through',
      )}
    >
      <Ban className="size-3 shrink-0 no-underline" strokeWidth={1.8} />
      <span className="truncate">redacted</span>
    </span>
  );
}
