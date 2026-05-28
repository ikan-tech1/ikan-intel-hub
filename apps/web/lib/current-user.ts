import { prisma } from '@ikan/db';
import { auth } from '@/auth';

/**
 * Resolve the request's user.
 *
 *   1. Real Auth.js session (preferred).
 *   2. Demo fallback — when no session exists, load (or create) the seeded
 *      `demo@ikan.local` user so anonymous visitors can still poke the chat.
 *      This is what powers the public hero demo on the production URL until
 *      a visitor signs in.
 *
 * Returns a fully-hydrated Prisma User row.
 */
export async function getCurrentUser() {
  const session = await auth().catch(() => null);
  if (session?.user?.id) {
    const real = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (real) return real;
  }
  return getDemoUser();
}

export async function getDemoUser() {
  let user = await prisma.user.findUnique({ where: { email: 'demo@ikan.local' } });
  if (!user) {
    const team = await prisma.team.upsert({
      where: { slug: 'ikan-demo' },
      update: {},
      create: { slug: 'ikan-demo', name: 'Ikan Demo' },
    });
    user = await prisma.user.create({
      data: {
        email: 'demo@ikan.local',
        name: 'Demo User',
        role: 'ADMIN',
        teamId: team.id,
      },
    });
  }
  return user;
}
