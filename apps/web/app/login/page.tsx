import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, MailCheck, Sparkles } from 'lucide-react';
import { auth, signIn } from '@/auth';
import { ParticleField } from '@/components/hero/ParticleField';

export const metadata = {
  title: 'Sign in · Ikan Intel',
  description: 'Sign in to your Ikan Intel account with a magic link.',
};

/**
 * /login — the only auth surface (magic link, single field).
 *
 * Behaviour:
 *   - Already-signed-in users get bounced to `/`.
 *   - `?check=email` shows the "we just sent you a link" state.
 *   - `?error=…` surfaces Auth.js error codes in plain language.
 *
 * Server action calls signIn('nodemailer', formData). We wrap to handle the
 * "next-auth must redirect" thrown response.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/');

  const { check, error } = await searchParams;
  const sentToEmail = check === 'email';

  const handleSubmit = async (formData: FormData) => {
    'use server';
    await signIn('nodemailer', {
      email: String(formData.get('email') ?? '').trim().toLowerCase(),
      redirectTo: '/',
    });
  };

  return (
    <main className="relative grid min-h-dvh place-items-center px-5 py-12">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <ParticleField density={50} className="opacity-80" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <Link
          href="/"
          className="chip mb-6 hover:border-[var(--color-text-3)]"
        >
          <Sparkles className="size-3 text-[var(--color-accent)]" strokeWidth={1.8} />
          <span>back to ikan intel</span>
        </Link>

        <h1 className="font-display text-[56px] leading-[0.95] tracking-[-0.02em] text-[var(--color-text)] md:text-[64px]">
          Sign <span className="italic text-[var(--color-accent)]">in.</span>
        </h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-3)]">
          single use · magic link · no password
        </p>

        {sentToEmail ? (
          <SentState />
        ) : (
          <SignInForm action={handleSubmit} error={error} />
        )}

        <p className="mt-8 max-w-sm text-[12.5px] leading-relaxed text-[var(--color-text-4)]">
          By signing in, you agree to our acceptable-use posture: B2B intelligence
          only, no harvesting personal data, full audit-log of every contact
          reveal. See{' '}
          <Link href="/privacy" className="underline decoration-[var(--color-text-4)] underline-offset-2 hover:text-[var(--color-text-2)]">
            privacy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

function SignInForm({
  action,
  error,
}: {
  action: (formData: FormData) => Promise<void>;
  error?: string;
}) {
  return (
    <div className="mt-8 w-full">
      <form action={action} className="surface relative flex items-stretch gap-2 p-2 backdrop-blur-md">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          spellCheck={false}
          placeholder="you@company.com"
          aria-label="Email"
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-4)] focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-[var(--color-bg)] transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Send link
          <ArrowRight className="size-3.5" strokeWidth={2.2} />
        </button>
      </form>
      {error && <ErrorBanner code={error} />}
    </div>
  );
}

function SentState() {
  return (
    <div className="surface relative mt-8 flex w-full flex-col items-center gap-3 p-6">
      <div className="grid size-10 place-items-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-elev-2)] text-[var(--color-accent)]">
        <MailCheck className="size-4" strokeWidth={1.7} />
      </div>
      <p className="text-[15px] text-[var(--color-text)]">Check your email.</p>
      <p className="max-w-xs text-[13px] leading-relaxed text-[var(--color-text-3)]">
        We sent a one-time sign-in link. It expires in 24 hours. If it doesn&apos;t
        arrive, check spam or{' '}
        <Link href="/login" className="underline decoration-[var(--color-text-4)] underline-offset-2 hover:text-[var(--color-text-2)]">
          try a different address
        </Link>
        .
      </p>
    </div>
  );
}

function ErrorBanner({ code }: { code: string }) {
  const msg = humanError(code);
  return (
    <p className="mt-3 rounded-md border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.06)] px-3 py-2 text-left font-mono text-[11.5px] text-[var(--color-dnc)]">
      {msg}
    </p>
  );
}

function humanError(code: string): string {
  switch (code) {
    case 'OAuthSignin':
    case 'EmailSignin':
      return "Couldn't send the sign-in email. Try again in a moment.";
    case 'AccessDenied':
      return 'This email is not authorized for Ikan Intel yet.';
    case 'Verification':
      return 'That sign-in link has expired or already been used. Request a new one.';
    case 'Configuration':
      return 'Auth provider is not configured. Reach out to your admin.';
    default:
      return `Sign-in error: ${code}`;
  }
}
