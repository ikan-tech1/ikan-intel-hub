import { prisma } from '@ikan/db';
import type { z } from 'zod';
import type { ToolArgs } from '@ikan/shared/schemas';
import { normalizeIndianCity } from '@ikan/shared/india';
import type { CompanyBrief, PersonBrief, SignalBrief, SourceCitation } from '@ikan/shared/types';
import { defineTool, toolResult } from './registry.js';
import { canvas } from '../canvas-events.js';

type SearchCompaniesArgs = z.infer<(typeof ToolArgs)['search_companies']>;
type SearchPersonsArgs = z.infer<(typeof ToolArgs)['search_persons']>;
type SearchSignalsArgs = z.infer<(typeof ToolArgs)['search_signals']>;

/**
 * search_companies — Postgres ILIKE + trigram-similarity fuzzy match, plus
 * substring matching against aliases and primary_domain. India bias by default.
 *
 * MVP keeps it simple. Phase-2 swaps in pgvector ANN + Postgres FTS hybrid.
 */
export const searchCompaniesTool = defineTool(
  'search_companies',
  'Find companies by name, domain, location, or industry. Defaults to India-only results. Returns up to `limit` companies with brief data (id, name, domain, hq, India office count, mobility relevance).',
  async (args: SearchCompaniesArgs, ctx) => {
    const start = Date.now();
    const locationCity = args.location ? normalizeIndianCity(args.location) : null;

    const where: Record<string, unknown> = {};
    if (args.indiaOnly !== false) where['indiaPresence'] = true;

    // Build OR clauses for name/domain/aliases
    const orClauses: Array<Record<string, unknown>> = [];
    if (args.name) {
      orClauses.push({ name: { contains: args.name, mode: 'insensitive' } });
      orClauses.push({ aliases: { has: args.name } });
    }
    if (args.domain) {
      orClauses.push({ primaryDomain: { contains: args.domain, mode: 'insensitive' } });
    }
    if (orClauses.length > 0) where['OR'] = orClauses;
    if (args.industry) where['industry'] = { contains: args.industry, mode: 'insensitive' };

    let companies = await prisma.company.findMany({
      where,
      take: args.limit,
      orderBy: [{ mobilityRelevanceScore: 'desc' }, { name: 'asc' }],
      include: { offices: { take: 10 } },
    });

    // If user mentioned a city, filter or boost companies with an office there.
    if (locationCity) {
      const withCity = companies.filter((c) =>
        c.offices.some((o) => o.city.toLowerCase() === locationCity.toLowerCase()),
      );
      if (withCity.length > 0) companies = withCity;
    }

    const briefs: CompanyBrief[] = companies.map((c) => ({
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
    }));

    // Emit canvas cards for each match — let the canvas build live.
    if (ctx.emitCanvas) for (const b of briefs) canvas.companyCard(ctx.emitCanvas, b);

    // Synthesize one citation per result so the agent has something to anchor [N] markers to.
    const sources: SourceCitation[] = briefs.map((b) => ({
      id: `company:${b.id}`,
      url: b.primaryDomain ? `https://${b.primaryDomain}` : `https://hub.ikan.example/c/${b.slug}`,
      snippet: b.description?.slice(0, 240) ?? null,
      fetchedAt: b.freshnessAt,
      trustTier: 'primary' as const,
    }));

    return toolResult(true, { companies: briefs, count: briefs.length, durationMs: Date.now() - start }, sources);
  },
);

/**
 * search_persons — find by name + optional company / role / department / location.
 * MVP uses ILIKE + relations; Phase 2 adds pgvector semantic match.
 */
export const searchPersonsTool = defineTool(
  'search_persons',
  "Find persons by name, current company, role/title, department, or location. Defaults to India. Returns brief person records (id, name, title, dept, location, LinkedIn URL if known, plus flags for whether contacts are available).",
  async (args: SearchPersonsArgs, ctx) => {
    const start = Date.now();

    const where: Record<string, unknown> = {};
    if (args.name) where['fullName'] = { contains: args.name, mode: 'insensitive' };
    if (args.companyId) where['currentCompanyId'] = args.companyId;
    if (args.companyName) {
      const company = await prisma.company.findFirst({
        where: { name: { contains: args.companyName, mode: 'insensitive' } },
        select: { id: true },
      });
      if (company) where['currentCompanyId'] = company.id;
    }
    if (args.role) where['currentTitle'] = { contains: args.role, mode: 'insensitive' };
    if (args.department) {
      const upper = args.department.toUpperCase();
      where['currentDepartment'] = upper as never;
    }
    if (args.location) {
      const city = normalizeIndianCity(args.location);
      if (city) where['locationCity'] = city;
      else where['locationCity'] = { contains: args.location, mode: 'insensitive' };
    }
    // Never surface DPDP-deleted persons
    where['tombstonedAt'] = null;

    const persons = await prisma.person.findMany({
      where,
      take: args.limit,
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        currentCompany: { select: { id: true, name: true } },
        contactPoints: {
          where: { status: { in: ['VERIFIED', 'INFERRED'] } },
          select: { kind: true, isInferred: true },
        },
      },
    });

    const briefs: PersonBrief[] = persons.map((p) => {
      const emails = p.contactPoints.filter((c) => c.kind === 'EMAIL' || c.kind === 'GENERIC_EMAIL');
      const phones = p.contactPoints.filter((c) => c.kind === 'PHONE' || c.kind === 'SWITCHBOARD');
      return {
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
    });

    if (ctx.emitCanvas) for (const b of briefs) canvas.personRow(ctx.emitCanvas, b);

    const sources: SourceCitation[] = briefs.map((b) => ({
      id: `person:${b.id}`,
      url: b.linkedinUrl ?? `https://hub.ikan.example/p/${b.slug}`,
      snippet: b.currentTitle ? `${b.fullName} — ${b.currentTitle}` : b.fullName,
      fetchedAt: b.freshnessAt,
      trustTier: 'secondary' as const,
    }));

    return toolResult(true, { persons: briefs, count: briefs.length, durationMs: Date.now() - start }, sources);
  },
);

/**
 * search_signals — by company, kind, recency. India bias unless told otherwise.
 */
export const searchSignalsTool = defineTool(
  'search_signals',
  'Find recent business signals (office openings, hires, expansions, funding) for a company or across India. Returns ranked-by-relevance signal briefs with citations.',
  async (args: SearchSignalsArgs, ctx) => {
    const start = Date.now();
    const since = new Date(Date.now() - args.sinceDays * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {
      occurredAt: { gte: since },
      status: 'ACTIVE',
    };
    if (args.companyId) where['companyId'] = args.companyId;
    if (args.kinds && args.kinds.length > 0) {
      where['kind'] = { in: args.kinds.map((k) => k.toUpperCase()) };
    }

    const signals = await prisma.signal.findMany({
      where,
      take: args.limit,
      orderBy: [{ relevanceScore: 'desc' }, { occurredAt: 'desc' }],
      include: {
        company: { select: { id: true, name: true, indiaPresence: true } },
        person: { select: { id: true, fullName: true } },
        source: true,
      },
    });

    const indiaFiltered = args.indiaOnly
      ? signals.filter((s) => !s.company || s.company.indiaPresence)
      : signals;

    const briefs: SignalBrief[] = indiaFiltered.map((s) => ({
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
      companyName: s.company?.name ?? null,
      personId: s.personId,
      personName: s.person?.fullName ?? null,
    }));

    if (ctx.emitCanvas) for (const b of briefs) canvas.signal(ctx.emitCanvas, b);

    const sources: SourceCitation[] = indiaFiltered.map((s) => ({
      id: `signal:${s.id}`,
      url: s.url,
      snippet: s.summary.slice(0, 240),
      fetchedAt: s.source.fetchedAt.toISOString(),
      trustTier: (s.source.trustTier.toLowerCase() as 'primary' | 'secondary' | 'tertiary'),
    }));

    return toolResult(true, { signals: briefs, count: briefs.length, durationMs: Date.now() - start }, sources);
  },
);
