import robotsParser from 'robots-parser';

/**
 * Polite HTTP fetcher.
 *
 * - Honors robots.txt (cached per-host, 24h)
 * - Per-host rate limit (1 req/sec default)
 * - Identifies itself in User-Agent
 * - Returns a structured response, never throws on non-2xx
 */

const USER_AGENT =
  'Ikan-IntelHub/1.0 (+https://hub.ikan.example/bot; contact: bot@ikan.example)';

interface HostState {
  lastFetchAt: number;
  robots: ReturnType<typeof robotsParser> | null;
  robotsFetchedAt: number;
  blocked: boolean;
}

const hostStates = new Map<string, HostState>();

const DEFAULT_DELAY_MS = 1000;
const ROBOTS_CACHE_MS = 24 * 60 * 60 * 1000;

export interface FetchResult {
  ok: boolean;
  status: number;
  url: string;
  finalUrl: string;
  body: string;
  headers: Headers;
  blockedByRobots?: boolean;
}

export async function politeFetch(url: string): Promise<FetchResult> {
  const u = new URL(url);
  const host = u.host;

  let state = hostStates.get(host);
  if (!state) {
    state = { lastFetchAt: 0, robots: null, robotsFetchedAt: 0, blocked: false };
    hostStates.set(host, state);
  }

  // Robots check
  const now = Date.now();
  if (!state.robots || now - state.robotsFetchedAt > ROBOTS_CACHE_MS) {
    try {
      const robotsRes = await fetch(`${u.protocol}//${u.host}/robots.txt`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });
      const txt = robotsRes.ok ? await robotsRes.text() : '';
      state.robots = robotsParser(`${u.protocol}//${u.host}/robots.txt`, txt);
      state.robotsFetchedAt = now;
    } catch {
      // If we can't fetch robots, assume permissive but mark a soft state
      state.robots = robotsParser(`${u.protocol}//${u.host}/robots.txt`, '');
    }
  }

  if (state.robots && !state.robots.isAllowed(url, USER_AGENT)) {
    return {
      ok: false,
      status: 0,
      url,
      finalUrl: url,
      body: '',
      headers: new Headers(),
      blockedByRobots: true,
    };
  }

  // Rate limit
  const delay = Math.max(0, state.lastFetchAt + DEFAULT_DELAY_MS - now);
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));

  state.lastFetchAt = Date.now();

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    const body = res.ok ? await res.text() : '';
    return {
      ok: res.ok,
      status: res.status,
      url,
      finalUrl: res.url,
      body,
      headers: res.headers,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      url,
      finalUrl: url,
      body: err instanceof Error ? err.message : 'fetch failed',
      headers: new Headers(),
    };
  }
}

export const POLITE_USER_AGENT = USER_AGENT;
