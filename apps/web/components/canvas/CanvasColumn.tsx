'use client';

import { Sparkles, Building2, Users, Radio } from 'lucide-react';
import type { CanvasState } from '../chat/useIkanChat';
import { CompanyCard } from './CompanyCard';
import { PersonRow } from './PersonRow';
import { SignalRow } from './SignalRow';

/**
 * CanvasColumn — the right column that builds in real time as the agent runs.
 *
 * Sections render only when they have content (no empty section headers).
 * Order matters: companies first (the anchor entity), then people (who to
 * reach), then signals (why now). Contacts are nested inside the relevant
 * person rows.
 */
export function CanvasColumn({ canvas, isActive }: { canvas: CanvasState; isActive: boolean }) {
  const hasAnything =
    canvas.companyOrder.length > 0 || canvas.personOrder.length > 0 || canvas.signalOrder.length > 0;

  if (!hasAnything) return <EmptyCanvas active={isActive} />;

  return (
    <div className="flex flex-col gap-6">
      {canvas.companyOrder.length > 0 && (
        <Section
          label="companies"
          icon={<Building2 className="size-3.5" strokeWidth={1.6} />}
          count={canvas.companyOrder.length}
        >
          <div className="grid gap-3">
            {canvas.companyOrder.map((id) => {
              const c = canvas.companies.get(id);
              return c ? <CompanyCard key={id} c={c} /> : null;
            })}
          </div>
        </Section>
      )}

      {canvas.personOrder.length > 0 && (
        <Section
          label="people"
          icon={<Users className="size-3.5" strokeWidth={1.6} />}
          count={canvas.personOrder.length}
        >
          <ul className="surface divide-y divide-[var(--color-border-subtle)] overflow-hidden">
            {canvas.personOrder.map((id) => {
              const p = canvas.persons.get(id);
              if (!p) return null;
              const contacts = canvas.contacts.get(id) ?? [];
              return <PersonRow key={id} p={p} contacts={contacts} />;
            })}
          </ul>
        </Section>
      )}

      {canvas.signalOrder.length > 0 && (
        <Section
          label="signals"
          icon={<Radio className="size-3.5" strokeWidth={1.6} />}
          count={canvas.signalOrder.length}
        >
          <ul className="surface divide-y divide-[var(--color-border-subtle)] overflow-hidden">
            {canvas.signalOrder
              .map((id) => canvas.signals.get(id))
              .filter((s): s is NonNullable<typeof s> => s != null)
              .sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
              .map((s) => (
                <SignalRow key={s.id} s={s} />
              ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  label,
  icon,
  count,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-rise">
      <header className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-text-3)]">
        {icon}
        <span>{label}</span>
        <span className="text-[var(--color-text-4)]">·</span>
        <span className="text-[var(--color-text-4)]">{count}</span>
        <div className="ml-2 h-px flex-1 bg-[var(--color-border-subtle)]" />
      </header>
      {children}
    </section>
  );
}

function EmptyCanvas({ active }: { active: boolean }) {
  return (
    <div className="grid h-full place-items-center">
      <div className="surface relative mx-auto max-w-md p-6 text-center">
        <div className="crosshair absolute inset-0 rounded-[var(--radius-lg)] opacity-10" aria-hidden />
        <div className="relative">
          <div className="mb-3 grid size-10 place-items-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elev-2)] text-[var(--color-accent)]">
            <Sparkles className="size-4" strokeWidth={1.7} />
          </div>
          <h2 className="font-display text-[22px] leading-tight text-[var(--color-text)]">
            Your intelligence canvas builds here.
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-3)]">
            Ask about any India-presence company or person. Companies, people, contacts, and signals
            will appear as the agent works — each card clickable, each fact cited to source.
          </p>
          {active && (
            <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
              <span className="size-1.5 rounded-full bg-[var(--color-accent)] animate-pulse-soft" />
              agent thinking
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
