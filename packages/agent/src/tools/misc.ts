import { prisma } from '@ikan/db';
import type { z } from 'zod';
import type { ToolArgs } from '@ikan/shared/schemas';
import { defineTool, toolResult } from './registry.js';

type RefreshArgs = z.infer<(typeof ToolArgs)['refresh_entity']>;
type OutreachArgs = z.infer<(typeof ToolArgs)['generate_outreach_brief']>;
type ExportArgs = z.infer<(typeof ToolArgs)['export_csv']>;

/**
 * refresh_entity — enqueue a re-scrape + re-extract job. The worker
 * (@ikan/worker, BullMQ) picks it up. Returns a job id the agent can poll.
 *
 * MVP: writes an EnrichmentJob row in PENDING state. The worker (not yet
 * connected in MVP-deploy) will pick it up and run the adapter chain.
 */
export const refreshEntityTool = defineTool(
  'refresh_entity',
  "Enqueue a fresh scrape + AI extraction for a company or person. Use when data is stale, when a user explicitly asks to refresh, or when find_contacts returns empty. Returns a job id and ETA. Does NOT block — work happens in the background; the user will see updates as the canvas refreshes.",
  async (args: RefreshArgs, _ctx) => {
    const job = await prisma.enrichmentJob.create({
      data: {
        entityKind: args.kind,
        entityId: args.id,
        ...(args.kind === 'company' ? { companyId: args.id } : { personId: args.id }),
        jobKind: 'refresh',
        status: 'PENDING',
      },
    });
    return toolResult(
      true,
      {
        jobId: job.id,
        status: 'pending',
        entityKind: args.kind,
        entityId: args.id,
        etaSeconds: 30,
        note: 'Refresh enqueued. The canvas will update when the worker completes.',
      },
      [],
    );
  },
);

/**
 * generate_outreach_brief — produces a 1-pager. MVP returns a structured
 * stub so the agent can integrate it; Phase 1-week-3 wires the real NIM-driven
 * brief generation with the outreach-brief prompt.
 */
export const generateOutreachBriefTool = defineTool(
  'generate_outreach_brief',
  "Generate a 1-page outreach brief (hook, why-now, suggested contact, opener) for a company (optionally targeting a specific person). Uses recent signals + verified facts. Audience and tone control the style.",
  async (args: OutreachArgs, _ctx) => {
    const company = await prisma.company.findUnique({
      where: { id: args.companyId },
      include: {
        signals: { orderBy: { occurredAt: 'desc' }, take: 5, include: { source: true } },
      },
    });
    if (!company) return toolResult(false, null, [], `Company ${args.companyId} not found`);

    let person = null;
    if (args.personId) {
      person = await prisma.person.findUnique({
        where: { id: args.personId },
        include: { currentCompany: { select: { name: true } } },
      });
    }

    // MVP stub — return a structured outline. The agent will turn this into prose
    // with the system prompt's outreach style; Phase 2 will run a dedicated NIM
    // call with OUTREACH_BRIEF_PROMPT.
    return toolResult(
      true,
      {
        companyId: company.id,
        companyName: company.name,
        personId: person?.id ?? null,
        personName: person?.fullName ?? null,
        audience: args.audience,
        tone: args.tone,
        hookSeed: company.signals[0]
          ? `${company.name} — ${company.signals[0].title}`
          : `${company.name} — India operations`,
        recentSignals: company.signals.map((s) => ({
          id: s.id,
          title: s.title,
          summary: s.summary,
          whyItMatters: s.whyItMatters,
          occurredAt: s.occurredAt.toISOString(),
          url: s.url,
        })),
        note: 'MVP brief skeleton. The chat agent will write the prose using these facts + citations.',
      },
      company.signals.map((s) => ({
        id: `signal:${s.id}`,
        url: s.url,
        snippet: s.summary.slice(0, 240),
        fetchedAt: s.source.fetchedAt.toISOString(),
        trustTier: s.source.trustTier.toLowerCase() as 'primary' | 'secondary' | 'tertiary',
      })),
    );
  },
);

/**
 * export_csv — generate a downloadable CSV in R2 with a signed URL.
 * MVP: returns a deferred placeholder. The actual write happens in
 * /api/export which is reachable from the web app.
 */
export const exportCsvTool = defineTool(
  'export_csv',
  "Export a list to CSV. By default exports verified contacts only; pass includeInferred=true to include inferred contacts (each row will be labeled). Returns a signed download URL.",
  async (args: ExportArgs, _ctx) => {
    const list = await prisma.list.findUnique({ where: { id: args.listId } });
    if (!list) return toolResult(false, null, [], `List ${args.listId} not found`);

    return toolResult(
      true,
      {
        listId: list.id,
        listName: list.name,
        includeInferred: args.includeInferred,
        downloadUrl: `https://hub.ikan.example/api/export?listId=${list.id}&inferred=${args.includeInferred}`,
        note: "Download via the returned URL. The export is generated on demand and is valid for 1 hour.",
      },
      [],
    );
  },
);
