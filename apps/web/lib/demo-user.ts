import { prisma } from '@ikan/db';

/**
 * MVP demo-user helper.
 *
 * The MVP ships without real auth wired up — the seed creates demo@ikan.local
 * and this helper returns it. When Auth.js v5 is wired (Week 4 task), this
 * gets replaced by `auth()` from the route handlers.
 */
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
