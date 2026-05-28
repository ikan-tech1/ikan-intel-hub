import NextAuth from 'next-auth';
import Nodemailer from 'next-auth/providers/nodemailer';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@ikan/db';
import { authConfig } from './auth.config';

/**
 * Auth.js v5 — full Node-runtime config.
 *
 * Magic-link email via Resend.
 *   - `EMAIL_SERVER` / `EMAIL_FROM` is the standard nodemailer config.
 *   - We prefer the Resend HTTPS API (no SMTP setup), so we override
 *     `sendVerificationRequest` to call Resend directly.
 *
 * When `RESEND_API_KEY` is missing or set to a placeholder, we fall back to
 * console-logging the magic link so local dev still works without an email
 * provider. This is intentional: it lets the build + first deploy succeed
 * before secrets are configured.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function isRealKey(v: string | undefined): v is string {
  return Boolean(v && !v.startsWith('placeholder') && v.length > 10);
}

// Wrapping in an intermediate const + explicit re-export side-steps a TS
// "type cannot be named without a reference to next-auth/lib" portability
// error during Next.js build's declaration-style typecheck.
const _result = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      // Server option is required for the provider type, but we never use it
      // — sendVerificationRequest below short-circuits SMTP entirely.
      server: { host: 'unused', port: 587, auth: { user: 'unused', pass: 'unused' } },
      from: process.env.RESEND_FROM ?? 'Ikan Intel <onboarding@resend.dev>',
      async sendVerificationRequest({ identifier: to, url, provider }) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!isRealKey(apiKey)) {
          // eslint-disable-next-line no-console
          console.log(
            `[auth] RESEND_API_KEY not set — magic link for ${to}: ${url}`,
          );
          return;
        }
        const res = await fetch(RESEND_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: provider.from,
            to,
            subject: 'Sign in to Ikan Intel',
            html: magicLinkHtml(url),
            text: `Sign in to Ikan Intel: ${url}\n\nIf you didn't request this, ignore.`,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
        }
      },
    }),
  ],
});

export const handlers = _result.handlers;
export const auth = _result.auth;
export const signIn = _result.signIn;
export const signOut = _result.signOut;

function magicLinkHtml(url: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Sign in to Ikan Intel</title></head>
<body style="margin:0;padding:0;background:#0A0B0E;color:#F2F4F7;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0A0B0E;padding:48px 24px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="480" style="max-width:480px;background:#14161B;border:1px solid #262A33;border-radius:14px;padding:32px;">
      <tr><td>
        <p style="margin:0 0 6px;font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8B92A0;">Ikan Intel</p>
        <h1 style="margin:0 0 16px;font-family:'Instrument Serif',Georgia,serif;font-weight:400;font-size:34px;line-height:1.1;color:#F2F4F7;">Sign in.</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#C5C9D2;">Click the link below to sign in to your Ikan Intel account. This link is single-use and expires in 24 hours.</p>
        <p style="margin:0 0 28px;"><a href="${url}" style="display:inline-block;background:#B8FF66;color:#0A0B0E;font-weight:600;font-size:14px;padding:11px 18px;border-radius:8px;text-decoration:none;">Sign in to Ikan Intel</a></p>
        <p style="margin:0 0 8px;font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#5C6473;">If the button doesn't work, paste this URL into your browser:</p>
        <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:11px;color:#8B92A0;word-break:break-all;">${url}</p>
      </td></tr>
    </table>
    <p style="margin:24px 0 0;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:#5C6473;letter-spacing:0.16em;text-transform:uppercase;">the india b2b intelligence terminal</p>
  </td></tr>
</table>
</body></html>`;
}
