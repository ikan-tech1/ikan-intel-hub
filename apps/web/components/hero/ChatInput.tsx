'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ChatInput — the hero's primary affordance.
 *
 * Behaviors:
 *  - Submit on Enter (Shift+Enter = newline)
 *  - Auto-grow with a max height; scrollable beyond
 *  - Focus ring uses accent color
 *  - Submit button reveals with a directional spring when input is non-empty
 *  - "/" keystroke from anywhere on the page focuses the input
 */
export function ChatInput({
  onSubmit,
  isStreaming = false,
  placeholder = 'Ask anything — a company, a person, a city, a signal.',
  initialValue = '',
  autoFocus = true,
}: {
  onSubmit: (value: string) => void;
  isStreaming?: boolean;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  // "/" anywhere focuses the input (unless typing in another field)
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== '/') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      textareaRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-grow
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(180, el.scrollHeight) + 'px';
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      doSubmit();
    }
  };

  const doSubmit = () => {
    const v = value.trim();
    if (!v || isStreaming) return;
    onSubmit(v);
    setValue('');
  };

  const hasValue = value.trim().length > 0;

  return (
    <div className="group relative">
      {/* The hero glow ring expands while the input has focus */}
      <div
        className={cn(
          'absolute -inset-px rounded-[var(--radius-xl)] transition duration-300',
          'pointer-events-none',
          'opacity-0 group-focus-within:opacity-100',
          'bg-[radial-gradient(120%_120%_at_50%_0%,rgba(184,255,102,0.18),transparent_60%)]',
        )}
      />
      <div
        className={cn(
          'relative flex items-end gap-3 rounded-[var(--radius-xl)]',
          'border border-[var(--color-border)] bg-[var(--color-surface-elev)]/85',
          'pl-5 pr-3 py-3 backdrop-blur-md',
          'transition-all duration-200',
          'group-focus-within:border-[rgba(184,255,102,0.5)]',
          'group-focus-within:shadow-[0_0_0_4px_rgba(184,255,102,0.06)]',
        )}
      >
        <span
          className="mt-1.5 select-none font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-4)]"
          aria-hidden="true"
        >
          ask
        </span>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          aria-label="Ask Ikan Intel"
          className={cn(
            'min-h-[28px] flex-1 resize-none bg-transparent text-[16px] leading-7 text-[var(--color-text)]',
            'placeholder:text-[var(--color-text-4)] focus:outline-none',
          )}
        />
        <button
          type="button"
          onClick={doSubmit}
          disabled={!hasValue || isStreaming}
          className={cn(
            'grid size-9 place-items-center rounded-full transition-all duration-200',
            hasValue
              ? 'translate-y-0 scale-100 bg-[var(--color-accent)] text-[var(--color-bg)] hover:brightness-110'
              : 'translate-y-0.5 scale-95 bg-[var(--color-surface-elev-2)] text-[var(--color-text-4)]',
            'disabled:cursor-not-allowed',
          )}
          aria-label="Submit"
        >
          {isStreaming ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2.2} />
          ) : (
            <ArrowUp className="size-4" strokeWidth={2.4} />
          )}
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between px-1 font-mono text-[10.5px] text-[var(--color-text-4)]">
        <span>
          press <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-elev)] px-1.5 py-px text-[10px] text-[var(--color-text-3)]">/</kbd> to focus · <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-elev)] px-1.5 py-px text-[10px] text-[var(--color-text-3)]">⏎</kbd> to send · <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-elev)] px-1.5 py-px text-[10px] text-[var(--color-text-3)]">⇧ ⏎</kbd> newline
        </span>
        <span className="hidden md:inline">india-first · cited · {value.length} chars</span>
      </div>
    </div>
  );
}
