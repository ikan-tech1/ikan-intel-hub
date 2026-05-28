export { prisma } from './client.js';
export type { Prisma } from './client.js';
export {
  encryptContact,
  decryptContact,
  hashContactValue,
  canonicalizeEmail,
  canonicalizePhone,
} from './encryption.js';
// Re-export Prisma's generated types for downstream packages.
export * from '@prisma/client';
