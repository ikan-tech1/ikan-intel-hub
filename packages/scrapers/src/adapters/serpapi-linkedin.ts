/**
 * SerpAPI adapter — surfaces Google-indexed LinkedIn snippets.
 *
 * Why SerpAPI: scraping Google directly trips reCAPTCHA at scale. SerpAPI
 * proxies through their own infrastructure and gives us a stable JSON response.
 * Free tier ≈ 100 searches/mo; entry paid tier ≈ $50/mo.
 *
 * What it gets us: name, current title, current company, location, and a
 * snippet bio for almost any LinkedIn profile that Google has indexed.
 *
 * What it does NOT get us: LinkedIn's full profile (connections, full
 * experience timeline, posts). For that, the user must install the Chrome
 * extension and visit the page in their own authenticated session.
 */

export interface SerpApiHit {
  title: string;
  link: string;
  snippet: string;
  displayedLink: string;
}

export interface SerpApiOptions {
  q: string;
  num?: number;
  apiKey?: string;
}

const ENDPOINT = 'https://serpapi.com/search.json';

export async function searchLinkedinViaSerpApi(opts: SerpApiOptions): Promise<SerpApiHit[]> {
  const apiKey = opts.apiKey ?? process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error('SERPAPI_KEY not set');

  const params = new URLSearchParams({
    engine: 'google',
    q: opts.q,
    num: String(opts.num ?? 10),
    api_key: apiKey,
    hl: 'en',
    gl: 'in',
  });

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    organic_results?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      displayed_link?: string;
    }>;
  };

  return (data.organic_results ?? [])
    .filter((r) => r.link?.includes('linkedin.com/'))
    .map((r) => ({
      title: r.title ?? '',
      link: r.link ?? '',
      snippet: r.snippet ?? '',
      displayedLink: r.displayed_link ?? '',
    }));
}

/**
 * Build a "find this person" SerpAPI query. Phrase the names in quotes for
 * Google's strict matching mode.
 */
export function buildPersonQuery(name: string, company?: string, location?: string): string {
  const parts: string[] = ['site:linkedin.com/in/', `"${name}"`];
  if (company) parts.push(`"${company}"`);
  if (location) parts.push(`"${location}"`);
  return parts.join(' ');
}

/**
 * Build a "find this company page" SerpAPI query.
 */
export function buildCompanyQuery(name: string): string {
  return `site:linkedin.com/company/ "${name}"`;
}

/**
 * Parse a LinkedIn-snippet hit into a normalized observation payload.
 * Snippets typically look like:
 *   "Priya Sharma — Head of Talent Acquisition at Acme India · Bengaluru ·"
 * We extract role + company + location with conservative regexes.
 */
export function parseSnippet(hit: SerpApiHit): {
  name: string;
  currentTitle: string | null;
  currentCompany: string | null;
  location: string | null;
} {
  const name = hit.title.split('—')[0]?.split('-')[0]?.split('|')[0]?.trim() ?? hit.title;
  const snippet = `${hit.title} ${hit.snippet}`;

  const titleAtCompany = snippet.match(/([A-Z][\w\s&,.'/-]+?)\s+at\s+([A-Z][\w\s&,.'/-]+?)(?:\s+[·•]|\.|\s+in\s|\s+\|)/);
  const currentTitle = titleAtCompany?.[1]?.trim() ?? null;
  const currentCompany = titleAtCompany?.[2]?.trim() ?? null;

  const locationMatch = snippet.match(/[·•]\s+([A-Z][\w\s,.\-]+?)(?:\s+[·•]|\.|$)/);
  const location = locationMatch?.[1]?.trim() ?? null;

  return { name, currentTitle, currentCompany, location };
}
