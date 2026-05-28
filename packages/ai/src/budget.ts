import { Redis } from 'ioredis';

/**
 * Daily token budget tracker — circuit-breaks if total daily AI token usage
 * exceeds AI_DAILY_TOKEN_CAP. Tracks per-day in Redis using a sliding key.
 */

let _redis: Redis | null = null;
function client(): Redis {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_URL ?? process.env.REDIS_URL;
  if (!url) throw new Error('UPSTASH_REDIS_URL (or REDIS_URL) not set');
  _redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
  return _redis;
}

const cap = () => Number(process.env.AI_DAILY_TOKEN_CAP ?? 500_000);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function key(): string {
  return `ai:budget:${today()}`;
}

export async function recordTokens(n: number): Promise<void> {
  if (n <= 0) return;
  try {
    const k = key();
    const r = client();
    await r.incrby(k, n);
    // Keep ~2 days so today's key survives midnight rollover gracefully
    await r.expire(k, 48 * 60 * 60);
  } catch {
    // soft-fail
  }
}

export async function tokensUsedToday(): Promise<number> {
  try {
    const v = await client().get(key());
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export async function isOverBudget(): Promise<boolean> {
  const used = await tokensUsedToday();
  return used >= cap();
}

export async function budgetSnapshot(): Promise<{
  usedToday: number;
  cap: number;
  remaining: number;
}> {
  const used = await tokensUsedToday();
  const c = cap();
  return { usedToday: used, cap: c, remaining: Math.max(0, c - used) };
}
