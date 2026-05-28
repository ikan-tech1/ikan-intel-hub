import type { CompanyBrief, PersonBrief, SignalBrief } from '@ikan/shared/types';

/**
 * SearchProvider — abstraction so we can swap Postgres (MVP) for Meilisearch
 * or OpenSearch later without touching the agent or web code.
 *
 * The MVP `PostgresSearchProvider` is implemented inline inside @ikan/agent's
 * search tools (`packages/agent/src/tools/search.ts`) for simplicity. This
 * interface exists to make the swap target explicit when we need it.
 */

export interface SearchInput {
  q: string;
  entityTypes?: Array<'company' | 'person' | 'signal'>;
  filters?: {
    indiaOnly?: boolean;
    location?: string;
    industry?: string;
    department?: string;
    signalKind?: string;
    sinceDays?: number;
  };
  limit?: number;
}

export interface AutocompleteHit {
  kind: 'company' | 'person';
  id: string;
  display: string;
  subtitle: string | null;
  url: string;
}

export interface SearchResults {
  companies: CompanyBrief[];
  persons: PersonBrief[];
  signals: SignalBrief[];
  durationMs: number;
}

export interface SearchProvider {
  query(input: SearchInput): Promise<SearchResults>;
  autocomplete(prefix: string, limit?: number): Promise<AutocompleteHit[]>;
  reindex(entity: { kind: 'company' | 'person' | 'signal'; id: string }): Promise<void>;
}
