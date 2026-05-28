/**
 * App-wide constants.
 */

export const APP_NAME = 'Ikan Intel';
export const APP_TAGLINE = 'the india b2b intelligence terminal';

export const CONFIDENCE = {
  VERIFIED_FLOOR: 0.85,
  INFERRED_FLOOR: 0.35,
  INFERRED_CEILING: 0.7,
} as const;

export const RATE_LIMITS = {
  CONTACTS_REVEAL_PER_USER_PER_DAY: 200,
  AI_CHAT_MESSAGES_PER_USER_PER_HOUR: 60,
  EXTENSION_INGEST_PER_MINUTE: 30,
  SCRAPE_DEFAULT_RPS: 1,
} as const;

export const CACHE_TTL_SECONDS = {
  TOOL_RESULT: 5 * 60,
  COMPANY_BRIEF: 24 * 60 * 60,
  PERSON_BRIEF: 24 * 60 * 60,
  COMPANY_SUMMARY: 7 * 24 * 60 * 60,
  AI_QUERY_UNDERSTANDING: 24 * 60 * 60,
  RAW_HTML: 7 * 24 * 60 * 60,
} as const;

export const FRESHNESS_THRESHOLDS_DAYS = {
  COMPANY_REFRESH: 7,
  PERSON_REFRESH: 14,
  SIGNAL_DECAY: 90,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const EMBED_DIMENSIONS = 1024;

/**
 * Mobility-relevance department weights — used when scoring how likely a
 * company is to need relocation/mobility services based on its employee mix.
 */
export const MOBILITY_DEPT_WEIGHTS = {
  mobility: 1.0,
  hr: 0.7,
  procurement: 0.5,
  legal: 0.3,
  executive: 0.4,
  operations: 0.2,
} as const;
