import type { EntityKind, SignalKind, Department, Seniority } from './enums.js';

/**
 * Cross-cutting TS types not derivable from Prisma.
 * Use these for tool-call return shapes, canvas events, etc.
 */

export interface SourceCitation {
  id: string;
  url: string;
  snippet: string | null;
  fetchedAt: string; // ISO
  trustTier: 'primary' | 'secondary' | 'tertiary';
}

export interface ToolResult<T> {
  result: T;
  sources: SourceCitation[];
  durationMs: number;
  cached?: boolean;
}

export interface CompanyBrief {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  aliases: string[];
  primaryDomain: string | null;
  description: string | null;
  industry: string | null;
  subIndustry: string | null;
  sizeEstimate: string | null;
  employeeCountEstimate: number | null;
  hqCity: string | null;
  hqCountry: string | null;
  indiaPresence: boolean;
  indiaOfficeCount: number;
  mobilityRelevanceScore: number;
  logoUrl: string | null;
  offices: Array<{
    id: string;
    city: string;
    state: string | null;
    country: string;
    address: string | null;
    phone: string | null;
    status: 'active' | 'rumored' | 'closed';
  }>;
  recentSignalCount: number;
  freshnessAt: string;
}

export interface PersonBrief {
  id: string;
  slug: string;
  fullName: string;
  currentTitle: string | null;
  currentDepartment: Department | null;
  currentSeniority: Seniority | null;
  currentCompanyId: string | null;
  currentCompanyName: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  linkedinUrl: string | null;
  hasInferredEmail: boolean;
  hasVerifiedEmail: boolean;
  hasInferredPhone: boolean;
  hasVerifiedPhone: boolean;
  freshnessAt: string;
}

export interface SignalBrief {
  id: string;
  kind: SignalKind;
  title: string;
  summary: string;
  whyItMatters: string | null;
  occurredAt: string;
  url: string;
  confidence: number;
  relevanceScore: number;
  companyId: string | null;
  companyName: string | null;
  personId: string | null;
  personName: string | null;
}

export interface ContactPointBrief {
  id: string;
  kind: 'email' | 'phone' | 'switchboard' | 'generic_email';
  value: string;        // post-decrypt; masking handled at UI layer
  isInferred: boolean;
  status: 'verified' | 'inferred' | 'reported_bad' | 'dnc';
  confidence: number;
  verificationMethod: string;
  verifiedAt: string | null;
  sourceId: string;
}

/**
 * Canvas events streamed from server → client over the AI SDK `data` channel.
 * The client renders cards/rows progressively as these arrive.
 */
export type CanvasEvent =
  | { type: 'canvas:reset' }
  | { type: 'canvas:add_company_card'; payload: CompanyBrief }
  | { type: 'canvas:add_person_row'; payload: PersonBrief }
  | { type: 'canvas:add_signal'; payload: SignalBrief }
  | { type: 'canvas:add_contact'; payload: { personId: string; contact: ContactPointBrief } }
  | { type: 'canvas:tool_start'; payload: { name: string; argsPreview: string } }
  | { type: 'canvas:tool_end'; payload: { name: string; durationMs: number; ok: boolean } };

export interface EntityRef {
  kind: EntityKind;
  id: string;
  display: string;
}
