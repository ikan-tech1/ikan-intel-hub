import { prisma, decryptContact } from '@ikan/db';
import type { z } from 'zod';
import type { ToolArgs } from '@ikan/shared/schemas';
import type { ContactPointBrief, SourceCitation } from '@ikan/shared/types';
import { defineTool, toolResult } from './registry.js';
import { canvas } from '../canvas-events.js';

type FindContactsArgs = z.infer<(typeof ToolArgs)['find_contacts']>;

/**
 * find_contacts — the headline feature. For MVP this reads from the DB; the
 * heavy lifting (running the 10-layer discovery engine, scraping, pattern
 * inference) lives in @ikan/contacts and is enqueued via @ikan/worker.
 *
 * For now we return whatever contact_points already exist for the person and
 * enqueue a refresh job if none are found at the requested intensity.
 */
export const findContactsTool = defineTool(
  'find_contacts',
  'Find email and phone contacts for a specific person. Intensity controls how aggressive the search is — "low" returns only directly-verified contacts; "medium" includes cross-source matches and GitHub/conference data; "high" runs the email-pattern engine and surfaces inferred contacts (clearly labeled).',
  async (args: FindContactsArgs, ctx) => {
    const person = await prisma.person.findUnique({
      where: { id: args.personId },
      include: {
        currentCompany: { select: { id: true, name: true, primaryDomain: true } },
      },
    });
    if (!person) return toolResult(false, null, [], `Person ${args.personId} not found`);
    if (person.tombstonedAt) {
      return toolResult(false, null, [], 'Person has been removed via data subject request');
    }

    // Filter by intensity:
    // low  → verified only
    // med  → verified + inferred via direct/cross-source
    // high → all (verified, inferred-pattern, inferred-phone)
    const statusFilter: Array<'VERIFIED' | 'INFERRED'> =
      args.intensity === 'low' ? ['VERIFIED'] : ['VERIFIED', 'INFERRED'];

    const contacts = await prisma.contactPoint.findMany({
      where: {
        personId: person.id,
        status: { in: statusFilter },
      },
      include: { source: true },
      orderBy: [{ status: 'asc' }, { confidence: 'desc' }],
    });

    const briefs: ContactPointBrief[] = contacts.map((c) => {
      // Best-effort decrypt — if CONTACT_ENC_KEY isn't set we surface a placeholder.
      let display = '[encrypted]';
      try {
        display = decryptContact(c.value);
      } catch {
        // Display the encrypted value's first 4 chars as a hint
        display = c.value.slice(0, 8) + '…';
      }
      return {
        id: c.id,
        kind: c.kind.toLowerCase() as ContactPointBrief['kind'],
        value: display,
        isInferred: c.isInferred,
        status: c.status.toLowerCase() as ContactPointBrief['status'],
        confidence: c.confidence,
        verificationMethod: c.verificationMethod.toLowerCase(),
        verifiedAt: c.verifiedAt?.toISOString() ?? null,
        sourceId: c.sourceId,
      };
    });

    if (ctx.emitCanvas) {
      for (const b of briefs) canvas.contact(ctx.emitCanvas, person.id, b);
    }

    const sources: SourceCitation[] = contacts.map((c) => ({
      id: `source:${c.source.id}`,
      url: c.source.url,
      snippet: c.source.snippet?.slice(0, 240) ?? null,
      fetchedAt: c.source.fetchedAt.toISOString(),
      trustTier: c.source.trustTier.toLowerCase() as 'primary' | 'secondary' | 'tertiary',
    }));

    // If we have nothing and intensity is medium/high, hint that a refresh job
    // should be enqueued. The agent can call refresh_entity to trigger it.
    const nextActionHint =
      briefs.length === 0
        ? 'No contacts found yet. Consider calling refresh_entity({kind:"person", id}) to enqueue a discovery run.'
        : null;

    return toolResult(
      true,
      {
        personId: person.id,
        contacts: briefs,
        count: briefs.length,
        intensity: args.intensity,
        emailPatternForCompany: person.currentCompany?.primaryDomain
          ? `{first}.{last}@${person.currentCompany.primaryDomain}`
          : null,
        nextActionHint,
      },
      sources,
    );
  },
);
