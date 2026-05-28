import { z } from 'zod';

/**
 * Zod schemas — used by API route handlers, scraper outputs, agent tool
 * arguments, and the extension's ingest payloads. Single source of truth.
 */

export const CompanyExtractedFacts = z.object({
  name: z.string().min(1),
  legalName: z.string().nullable().optional(),
  aliases: z.array(z.string()).default([]),
  domain: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  subIndustry: z.string().nullable().optional(),
  foundedYear: z.number().int().min(1700).max(2100).nullable().optional(),
  hqCity: z.string().nullable().optional(),
  hqCountry: z.string().nullable().optional(),
  offices: z
    .array(
      z.object({
        city: z.string(),
        state: z.string().nullable().optional(),
        country: z.string().default('India'),
        address: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
      }),
    )
    .default([]),
  sizeEstimate: z.string().nullable().optional(),
  socialLinks: z.record(z.string(), z.string()).default({}),
  sourceUrl: z.string().url(),
  sourceSnippets: z.array(z.string()).default([]),
});
export type CompanyExtractedFacts = z.infer<typeof CompanyExtractedFacts>;

export const PersonExtractedFacts = z.object({
  fullName: z.string().min(1),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  currentTitle: z.string().nullable().optional(),
  currentCompany: z.string().nullable().optional(),
  currentCompanyDomain: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  seniority: z.string().nullable().optional(),
  locationCity: z.string().nullable().optional(),
  locationCountry: z.string().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  emailsFound: z.array(z.string().email()).default([]),
  phonesFound: z.array(z.string()).default([]),
  bio: z.string().nullable().optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
      }),
    )
    .default([]),
  sourceUrl: z.string().url(),
  sourceSnippets: z.array(z.string()).default([]),
});
export type PersonExtractedFacts = z.infer<typeof PersonExtractedFacts>;

export const SignalExtracted = z.object({
  kind: z.string(),
  title: z.string(),
  summary: z.string(),
  rawText: z.string(),
  url: z.string().url(),
  occurredAt: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  personName: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.7),
});
export type SignalExtracted = z.infer<typeof SignalExtracted>;

/* ----------------- Extension ingest payload ----------------- */

export const ExtensionLinkedinProfile = z.object({
  url: z.string().url(),
  name: z.string(),
  headline: z.string().nullable().optional(),
  currentTitle: z.string().nullable().optional(),
  currentCompany: z.string().nullable().optional(),
  currentCompanyUrl: z.string().url().nullable().optional(),
  location: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        dateRange: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string(),
        degree: z.string().nullable().optional(),
        dateRange: z.string().nullable().optional(),
      }),
    )
    .default([]),
  observedAt: z.string().datetime(),
});
export type ExtensionLinkedinProfile = z.infer<typeof ExtensionLinkedinProfile>;

export const ExtensionLinkedinCompany = z.object({
  url: z.string().url(),
  name: z.string(),
  industry: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  hq: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  specialties: z.array(z.string()).default([]),
  employeeCount: z.number().int().nullable().optional(),
  observedAt: z.string().datetime(),
});
export type ExtensionLinkedinCompany = z.infer<typeof ExtensionLinkedinCompany>;

export const ExtensionIngestPayload = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('profile'), payload: ExtensionLinkedinProfile }),
  z.object({ kind: z.literal('company'), payload: ExtensionLinkedinCompany }),
  z.object({
    kind: z.literal('search'),
    payload: z.object({
      query: z.string(),
      results: z.array(
        z.object({
          name: z.string(),
          headline: z.string().nullable().optional(),
          location: z.string().nullable().optional(),
          profileUrl: z.string().url(),
        }),
      ),
      observedAt: z.string().datetime(),
    }),
  }),
]);
export type ExtensionIngestPayload = z.infer<typeof ExtensionIngestPayload>;

/* ----------------- Agent tool arg schemas ----------------- */

export const ToolArgs = {
  search_companies: z.object({
    name: z.string().optional(),
    domain: z.string().optional(),
    location: z.string().optional(),
    industry: z.string().optional(),
    indiaOnly: z.boolean().default(true),
    limit: z.number().int().min(1).max(50).default(10),
  }),
  search_persons: z.object({
    name: z.string().optional(),
    companyId: z.string().optional(),
    companyName: z.string().optional(),
    role: z.string().optional(),
    department: z.string().optional(),
    location: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(10),
  }),
  search_signals: z.object({
    companyId: z.string().optional(),
    kinds: z.array(z.string()).optional(),
    sinceDays: z.number().int().min(1).max(365).default(90),
    indiaOnly: z.boolean().default(true),
    limit: z.number().int().min(1).max(50).default(20),
  }),
  get_company_brief: z.object({ id: z.string() }),
  get_person_brief: z.object({ id: z.string() }),
  find_contacts: z.object({
    personId: z.string(),
    intensity: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  linkedin_lookup: z.object({
    name: z.string().optional(),
    company: z.string().optional(),
    url: z.string().url().optional(),
    personId: z.string().optional(),
  }),
  refresh_entity: z.object({
    kind: z.enum(['company', 'person']),
    id: z.string(),
  }),
  add_to_list: z.object({
    listId: z.string(),
    entityKind: z.enum(['company', 'person']),
    entityId: z.string(),
    notes: z.string().optional(),
  }),
  create_list: z.object({
    name: z.string(),
    description: z.string().optional(),
    kind: z.enum(['company_list', 'person_list', 'mixed']).default('mixed'),
    isWatchlist: z.boolean().default(false),
  }),
  generate_outreach_brief: z.object({
    companyId: z.string(),
    personId: z.string().optional(),
    audience: z.enum(['hr', 'mobility', 'procurement', 'exec']).default('mobility'),
    tone: z.enum(['warm', 'direct']).default('warm'),
  }),
  export_csv: z.object({
    listId: z.string(),
    includeInferred: z.boolean().default(false),
  }),
} as const;

export type ToolName = keyof typeof ToolArgs;
