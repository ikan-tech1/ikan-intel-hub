import { XMLParser } from 'fast-xml-parser';
import { politeFetch } from '../http.js';
import { INDIA_NEWS_RSS } from '@ikan/shared/india';

/**
 * News RSS adapter — pulls headlines from Indian business publications and
 * Google News (per-company queries). Output is normalized for the AI
 * extraction pipeline.
 */

export interface NewsItem {
  source: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date | null;
  guid: string | null;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export async function fetchFeed(name: string, url: string): Promise<NewsItem[]> {
  const res = await politeFetch(url);
  if (!res.ok) return [];

  try {
    const parsed = parser.parse(res.body);
    const items =
      parsed?.rss?.channel?.item ??
      parsed?.feed?.entry ??
      [];
    const arr = Array.isArray(items) ? items : [items];
    return arr
      .filter(Boolean)
      .map((it: Record<string, unknown>) => ({
        source: name,
        title: String(it['title'] ?? '').trim(),
        link: String(it['link'] ?? (it as Record<string, { '@_href'?: string }>)['link']?.['@_href'] ?? ''),
        description: stripHtml(String(it['description'] ?? it['summary'] ?? '')),
        pubDate: parseDate(it['pubDate'] ?? it['published']),
        guid: (it['guid'] as string | null) ?? null,
      }))
      .filter((it) => it.title && it.link);
  } catch {
    return [];
  }
}

export async function fetchAllIndianFeeds(): Promise<NewsItem[]> {
  const all = await Promise.all(INDIA_NEWS_RSS.map((f) => fetchFeed(f.name, f.url)));
  return all.flat();
}

export function googleNewsQueryUrl(query: string): string {
  const q = encodeURIComponent(`${query} India`);
  return `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseDate(s: unknown): Date | null {
  if (!s || typeof s !== 'string') return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}
