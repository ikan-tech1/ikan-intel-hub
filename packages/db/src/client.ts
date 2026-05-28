import { PrismaClient } from '@prisma/client';

/**
 * Global Prisma singleton — avoids exhausting the connection pool during
 * Next.js dev hot reloads. Exported as `prisma` from this package.
 *
 * Build safety: when DATABASE_URL is missing (e.g. Vercel build phase before
 * env vars are configured), we synthesize a placeholder URL so PrismaClient
 * construction doesn't throw. Real queries will still fail at request time
 * with a clear error.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const BUILD_PLACEHOLDER = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder';

function ensureDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = BUILD_PLACEHOLDER;
  }
}

ensureDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { Prisma } from '@prisma/client';
export * from '@prisma/client';
