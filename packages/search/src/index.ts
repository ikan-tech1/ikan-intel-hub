export type {
  SearchProvider,
  SearchInput,
  SearchResults,
  AutocompleteHit,
} from './SearchProvider.js';
export { PostgresSearchProvider } from './PostgresSearchProvider.js';

import { PostgresSearchProvider } from './PostgresSearchProvider.js';
import type { SearchProvider } from './SearchProvider.js';

let _instance: SearchProvider | null = null;
export function getSearchProvider(): SearchProvider {
  _instance ??= new PostgresSearchProvider();
  return _instance;
}
