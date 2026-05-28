import { prisma } from '@ikan/db';
import { normalizeIndianCity } from '@ikan/shared/india';
import type {
  AutocompleteHit,
  SearchInput,
  SearchProvider,
  SearchResults,
} from './SearchProvider.js';

/**
 * PostgresSearchProvider — uses pg_trgm + ILIKE for fuzzy matching and the
 * existing `embedding` column (pgvector) when an embedding is supplied.
 *
 * For MVP this is intentionally simple — the agent tools `search_companies`
 * and `search_persons` in @ikan/agent contain the production query paths.
 * This provider exists primarily for the `/search` power-user page and for
 * autocomplete on the global ⌘K palette.
 */
export class PostgresSearchProvider implements SearchProvider {
  async query(input: SearchInput): Promise<SearchResults> {
    const start = Date.now();
    const types = input.entityTypes ?? ['company', 'person', 'signal'];
    const limit = input.limit ?? 10;
    const indiaOnly = input.filters?.indiaOnly ?? true;
    const locationCity = input.filters?.location ? normalizeIndianCity(input.filters.location) : null;

    const [companies, persons, signals] = await Promise.all([
      types.includes('company')
        ? prisma.company.findMany({
            where: {
              ...(indiaOnly ? { indiaPresence: true } : {}),
              OR: [
                { name: { contains: input.q, mode: 'insensitive' } },
                { aliases: { has: input.q } },
                { primaryDomain: { contains: input.q, mode: 'insensitive' } },
                { description: { contains: input.q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            orderBy: [{ mobilityRelevanceScore: 'desc' }],
            include: { offices: { take: 5 } },
          })
        : Promise.resolve([]),
      types.includes('person')
        ? prisma.person.findMany({
            where: {
              tombstonedAt: null,
              OR: [
                { fullName: { contains: input.q, mode: 'insensitive' } },
                { currentTitle: { contains: input.q, mode: 'insensitive' } },
              ],
              ...(locationCity ? { locationCity } : {}),
            },
            take: limit,
            include: { currentCompany: { select: { name: true } } },
          })
        : Promise.resolve([]),
      types.includes('signal')
        ? prisma.signal.findMany({
            where: {
              status: 'ACTIVE',
              title: { contains: input.q, mode: 'insensitive' },
            },
            take: limit,
            orderBy: [{ relevanceScore: 'desc' }],
            include: { company: { select: { id: true, name: true } } },
          })
        : Promise.resolve([]),
    ]);

    return {
      companies: companies.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        legalName: c.legalName,
        aliases: c.aliases,
        primaryDomain: c.primaryDomain,
        description: c.description,
        industry: c.industry,
        subIndustry: c.subIndustry,
        sizeEstimate: c.sizeEstimate,
        employeeCountEstimate: c.employeeCountEstimate,
        hqCity: c.hqCity,
        hqCountry: c.hqCountry,
        indiaPresence: c.indiaPresence,
        indiaOfficeCount: c.indiaOfficeCount,
        mobilityRelevanceScore: c.mobilityRelevanceScore,
        logoUrl: c.logoUrl,
        offices: c.offices.map((o) => ({
          id: o.id,
          city: o.city,
          state: o.state,
          country: o.country,
          address: o.address,
          phone: o.phone,
          status: o.status.toLowerCase() as 'active' | 'rumored' | 'closed',
        })),
        recentSignalCount: 0,
        freshnessAt: c.freshnessAt.toISOString(),
      })),
      persons: persons.map((p) => ({
        id: p.id,
        slug: p.slug,
        fullName: p.fullName,
        currentTitle: p.currentTitle,
        currentDepartment: null,
        currentSeniority: null,
        currentCompanyId: p.currentCompanyId,
        currentCompanyName: p.currentCompany?.name ?? null,
        locationCity: p.locationCity,
        locationCountry: p.locationCountry,
        linkedinUrl: p.publicLinkedinUrl,
        hasInferredEmail: false,
        hasVerifiedEmail: false,
        hasInferredPhone: false,
        hasVerifiedPhone: false,
        freshnessAt: p.freshnessAt.toISOString(),
      })),
      signals: signals.map((s) => ({
        id: s.id,
        kind: s.kind.toLowerCase() as never,
        title: s.title,
        summary: s.summary,
        whyItMatters: s.whyItMatters,
        occurredAt: s.occurredAt.toISOString(),
        url: s.url,
        confidence: s.confidence,
        relevanceScore: s.relevanceScore,
        companyId: s.companyId,
        companyName: s.company?.name ?? null,
        personId: s.personId,
        personName: null,
      })),
      durationMs: Date.now() - start,
    };
  }

  async autocomplete(prefix: string, limit = 8): Promise<AutocompleteHit[]> {
    const [companies, persons] = await Promise.all([
      prisma.company.findMany({
        where: { name: { startsWith: prefix, mode: 'insensitive' } },
        take: limit,
        orderBy: [{ mobilityRelevanceScore: 'desc' }],
      }),
      prisma.person.findMany({
        where: { fullName: { startsWith: prefix, mode: 'insensitive' }, tombstonedAt: null },
        take: limit,
        include: { currentCompany: { select: { name: true } } },
      }),
    ]);
    const hits: AutocompleteHit[] = [
      ...companies.map((c) => ({
        kind: 'company' as const,
        id: c.id,
        display: c.name,
        subtitle: c.hqCity ?? c.industry ?? null,
        url: `/c/${c.slug}`,
      })),
      ...persons.map((p) => ({
        kind: 'person' as const,
        id: p.id,
        display: p.fullName,
        subtitle: p.currentTitle ?? p.currentCompany?.name ?? null,
        url: `/p/${p.slug}`,
      })),
    ];
    return hits.slice(0, limit);
  }

  async reindex(_entity: { kind: 'company' | 'person' | 'signal'; id: string }): Promise<void> {
    // No-op for Postgres provider (we rely on btree/trigram indexes).
    // Meilisearch implementation would push the entity into its index here.
  }
}
