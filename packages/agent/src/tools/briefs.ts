import { prisma } from '@ikan/db';
import type { z } from 'zod';
import type { ToolArgs } from '@ikan/shared/schemas';
import type {
  CompanyBrief,
  PersonBrief,
  SignalBrief,
  SourceCitation,
} from '@ikan/shared/types';
import { defineTool, toolResult } from './registry.js';
import { canvas } from '../canvas-events.js';

type GetCompanyBriefArgs = z.infer<(typeof ToolArgs)['get_company_brief']>;
type GetPersonBriefArgs = z.infer<(typeof ToolArgs)['get_person_brief']>;

export const getCompanyBriefTool = defineTool(
  'get_company_brief',
  'Get a full structured brief on one company: facts, offices, employee count estimate, recent signal count, mobility relevance. Use after `search_companies` returns a candidate.',
  async (args: GetCompanyBriefArgs, ctx) => {
    const c = await prisma.company.findUnique({
      where: { id: args.id },
      include: {
        offices: true,
        signals: {
          where: { status: 'ACTIVE' },
          orderBy: { occurredAt: 'desc' },
          take: 10,
          include: { source: true },
        },
      },
    });

    if (!c) return toolResult(false, null, [], `Company ${args.id} not found`);

    const brief: CompanyBrief = {
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
      recentSignalCount: c.signals.length,
      freshnessAt: c.freshnessAt.toISOString(),
    };

    if (ctx.emitCanvas) {
      canvas.companyCard(ctx.emitCanvas, brief);
      for (const s of c.signals.slice(0, 5)) {
        canvas.signal(ctx.emitCanvas, {
          id: s.id,
          kind: s.kind.toLowerCase() as SignalBrief['kind'],
          title: s.title,
          summary: s.summary,
          whyItMatters: s.whyItMatters,
          occurredAt: s.occurredAt.toISOString(),
          url: s.url,
          confidence: s.confidence,
          relevanceScore: s.relevanceScore,
          companyId: s.companyId,
          companyName: c.name,
          personId: s.personId,
          personName: null,
        });
      }
    }

    const sources: SourceCitation[] = [
      {
        id: `company:${c.id}`,
        url: c.primaryDomain ? `https://${c.primaryDomain}` : `https://hub.ikan.example/c/${c.slug}`,
        snippet: c.description?.slice(0, 240) ?? null,
        fetchedAt: c.freshnessAt.toISOString(),
        trustTier: 'primary' as const,
      },
      ...c.signals.map((s) => ({
        id: `signal:${s.id}`,
        url: s.url,
        snippet: s.summary.slice(0, 240),
        fetchedAt: s.source.fetchedAt.toISOString(),
        trustTier: (s.source.trustTier.toLowerCase() as 'primary' | 'secondary' | 'tertiary'),
      })),
    ];

    return toolResult(true, brief, sources);
  },
);

export const getPersonBriefTool = defineTool(
  'get_person_brief',
  "Get a full structured brief on one person: employment history, current title/department, location, contact-availability flags. Does NOT reveal contacts directly — call `find_contacts` for that.",
  async (args: GetPersonBriefArgs, ctx) => {
    const p = await prisma.person.findUnique({
      where: { id: args.id },
      include: {
        currentCompany: { select: { id: true, name: true } },
        contactPoints: {
          where: { status: { in: ['VERIFIED', 'INFERRED'] } },
          select: { kind: true, isInferred: true },
        },
      },
    });

    if (!p) return toolResult(false, null, [], `Person ${args.id} not found`);
    if (p.tombstonedAt) {
      return toolResult(false, null, [], 'Person has been removed via data subject request');
    }

    const emails = p.contactPoints.filter((c) => c.kind === 'EMAIL' || c.kind === 'GENERIC_EMAIL');
    const phones = p.contactPoints.filter((c) => c.kind === 'PHONE' || c.kind === 'SWITCHBOARD');

    const brief: PersonBrief = {
      id: p.id,
      slug: p.slug,
      fullName: p.fullName,
      currentTitle: p.currentTitle,
      currentDepartment: p.currentDepartment
        ? (p.currentDepartment.toLowerCase() as PersonBrief['currentDepartment'])
        : null,
      currentSeniority: p.currentSeniority
        ? (p.currentSeniority.toLowerCase() as PersonBrief['currentSeniority'])
        : null,
      currentCompanyId: p.currentCompanyId,
      currentCompanyName: p.currentCompany?.name ?? null,
      locationCity: p.locationCity,
      locationCountry: p.locationCountry,
      linkedinUrl: p.publicLinkedinUrl,
      hasInferredEmail: emails.some((e) => e.isInferred),
      hasVerifiedEmail: emails.some((e) => !e.isInferred),
      hasInferredPhone: phones.some((e) => e.isInferred),
      hasVerifiedPhone: phones.some((e) => !e.isInferred),
      freshnessAt: p.freshnessAt.toISOString(),
    };

    if (ctx.emitCanvas) canvas.personRow(ctx.emitCanvas, brief);

    const sources: SourceCitation[] = [
      {
        id: `person:${p.id}`,
        url: p.publicLinkedinUrl ?? `https://hub.ikan.example/p/${p.slug}`,
        snippet: p.bio?.slice(0, 240) ?? p.currentTitle ?? null,
        fetchedAt: p.freshnessAt.toISOString(),
        trustTier: 'secondary' as const,
      },
    ];

    return toolResult(true, brief, sources);
  },
);
