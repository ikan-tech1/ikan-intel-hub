/**
 * Scrapers — source adapters for contact discovery + signals.
 *
 * Each adapter is a function that takes a company/person and yields
 * ScrapedFact payloads. Workers invoke these via job queues.
 */

export { POLITE_USER_AGENT, politeFetch, type FetchResult } from './http.js';
export {
  searchLinkedinViaSerpApi,
  buildPersonQuery,
  buildCompanyQuery,
  parseSnippet,
  type SerpApiHit,
  type SerpApiOptions,
} from './adapters/serpapi-linkedin.js';
export {
  fetchFeed,
  fetchAllIndianFeeds,
  googleNewsQueryUrl,
  type NewsItem,
} from './adapters/news-rss.js';
// company-site adapter currently a stub — full implementation in Week 2.
// Re-export when ready: scrapeCompanySite, CompanyPageScrape.

// Adapter names for job queuing:
export const ADAPTERS = [
  'company-site',
  'news-rss',
  'careers-public',
  'github-org',
  'serpapi-linkedin',
  'bing-search',
  'press-release',
  'conferences',
  'manual-csv',
] as const;

export type AdapterName = (typeof ADAPTERS)[number];

/**
 * ScrapedFact — normalized payload that all adapters emit.
 * Workers persist these to the Source table + enqueue extraction jobs.
 */
export interface ScrapedFact {
  kind: 'company_snippet' | 'person_snippet' | 'office' | 'signal' | 'email' | 'phone';
  value: string;
  metadata: Record<string, unknown>;
  confidence?: number;
  source_url?: string;
}
