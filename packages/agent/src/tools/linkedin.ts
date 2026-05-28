import { prisma } from '@ikan/db';
import type { z } from 'zod';
import type { ToolArgs } from '@ikan/shared/schemas';
import type { SourceCitation } from '@ikan/shared/types';
import { defineTool, toolResult } from './registry.js';

type LinkedinLookupArgs = z.infer<(typeof ToolArgs)['linkedin_lookup']>;

/**
 * linkedin_lookup — surfaces LinkedIn-shaped data for a person/company.
 *
 * Data origin (priority order):
 *   1. Chrome extension observations — when user has the extension installed,
 *      these contain full-fidelity profile/company data from the user's
 *      authenticated LinkedIn session.
 *   2. SerpAPI snippet — Google-indexed `linkedin.com/in/...` results.
 *   3. Bing snippet — fallback when SerpAPI quota is exhausted.
 *
 * MVP: returns whatever `LinkedinObservation` rows we have for the entity.
 * Live SerpAPI/Bing fetches are deferred to the scraper queue (@ikan/worker)
 * which the user can trigger via `refresh_entity`.
 */
export const linkedinLookupTool = defineTool(
  'linkedin_lookup',
  'Look up LinkedIn-derived data for a person or company. Returns observations cached from the Chrome extension (highest fidelity) or Google-indexed snippets (broad coverage). Use to enrich a person with title/location/headline when @ikan/contacts inference is insufficient.',
  async (args: LinkedinLookupArgs, _ctx) => {
    let observations;
    if (args.personId) {
      observations = await prisma.linkedinObservation.findMany({
        where: { personId: args.personId },
        orderBy: { observedAt: 'desc' },
        take: 5,
      });
    } else if (args.url) {
      observations = await prisma.linkedinObservation.findMany({
        where: { url: args.url },
        orderBy: { observedAt: 'desc' },
        take: 5,
      });
    } else if (args.name && args.company) {
      // Resolve via cross-table lookup
      const company = await prisma.company.findFirst({
        where: { name: { contains: args.company, mode: 'insensitive' } },
        select: { id: true },
      });
      const person = company
        ? await prisma.person.findFirst({
            where: {
              fullName: { contains: args.name, mode: 'insensitive' },
              currentCompanyId: company.id,
            },
            select: { id: true },
          })
        : null;
      observations = person
        ? await prisma.linkedinObservation.findMany({
            where: { personId: person.id },
            orderBy: { observedAt: 'desc' },
            take: 5,
          })
        : [];
    } else {
      return toolResult(false, null, [], 'Must provide one of: personId, url, or (name + company)');
    }

    if (observations.length === 0) {
      return toolResult(
        true,
        {
          observations: [],
          count: 0,
          hint: 'No cached LinkedIn data. To fetch: ensure the user has the Ikan Chrome extension installed and visits the LinkedIn URL, or call refresh_entity to trigger a SerpAPI/Bing snippet fetch.',
        },
        [],
      );
    }

    const sources: SourceCitation[] = observations.map((o) => ({
      id: `linkedin:${o.id}`,
      url: o.url,
      snippet: o.rawSnippet?.slice(0, 240) ?? null,
      fetchedAt: o.observedAt.toISOString(),
      trustTier: o.source === 'EXTENSION' ? ('primary' as const) : ('tertiary' as const),
    }));

    return toolResult(
      true,
      {
        observations: observations.map((o) => ({
          id: o.id,
          source: o.source.toLowerCase(),
          url: o.url,
          observedAt: o.observedAt.toISOString(),
          parsedFields: o.parsedFields,
          confidence: o.confidence,
          resolutionStatus: o.resolutionStatus.toLowerCase(),
        })),
        count: observations.length,
      },
      sources,
    );
  },
);
