import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe Auth.js v5 config — used by middleware and the main `auth.ts`.
 *
 * Notes:
 *   - No adapter or provider implementations here (those need Node).
 *   - This config carries the callbacks and session strategy that should run
 *     on every request, including the Edge runtime middleware.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/login?check=email',
  },
  callbacks: {
    /**
     * `authorized` — gates middleware-routed requests. We keep the chat hero
     * (`/`) and the auth routes public; everything else (lists, settings,
     * admin) requires a session.
     */
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const isLoggedIn = Boolean(auth?.user);
      const isPublic =
        path === '/' ||
        path === '/login' ||
        path === '/privacy' ||
        path.startsWith('/api/auth') ||
        path.startsWith('/_next') ||
        path.startsWith('/static');
      if (isPublic) return true;
      return isLoggedIn;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  providers: [], // wired in auth.ts (Node-only)
};
