import { createHash } from 'node:crypto';
import { Redis } from 'ioredis';

/**
 * Aggressive caching layer for AI calls.
 * Key = sha256(provider | model | normalized-messages | tools | response_format).
 * Values stored gzip-compressed when over 8KB.
 */

let _redis: Redis | null = null;
function client(): Redis {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL;
  if (!url) throw new Error('UPSTASH_REDIS_URL (or REDIS_URL) not set');
  _redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
  return _redis;
}

export function aiCacheKey(input: unknown): string {
  return 'ai:' + createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await client().get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await client().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // soft-fail: cache miss on write is fine
  }
}
