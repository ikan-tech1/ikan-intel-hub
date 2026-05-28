/**
 * Controlled vocabularies. These mirror the Prisma enums in @ikan/db.
 * Kept here so non-DB packages can reference them without pulling Prisma client.
 */

export const SignalKind = {
  OfficeOpening: 'office_opening',
  HiringSpike: 'hiring_spike',
  MobilityHire: 'mobility_hire',
  HrHire: 'hr_hire',
  LeadershipChange: 'leadership_change',
  Funding: 'funding',
  Acquisition: 'acquisition',
  Layoff: 'layoff',
  ClientWin: 'client_win',
  MarketEntry: 'market_entry',
  PolicyChange: 'policy_change',
  LocationLaunch: 'location_launch',
  ExpansionAnnounce: 'expansion_announce',
  ProductLaunch: 'product_launch',
  PartnershipAnnounce: 'partnership_announce',
} as const;
export type SignalKind = (typeof SignalKind)[keyof typeof SignalKind];

export const Department = {
  Hr: 'hr',
  Mobility: 'mobility',
  Procurement: 'procurement',
  It: 'it',
  Finance: 'finance',
  Legal: 'legal',
  Operations: 'operations',
  Engineering: 'engineering',
  Sales: 'sales',
  Marketing: 'marketing',
  Executive: 'executive',
  Product: 'product',
  Design: 'design',
  Research: 'research',
  Other: 'other',
} as const;
export type Department = (typeof Department)[keyof typeof Department];

export const Seniority = {
  Intern: 'intern',
  Junior: 'junior',
  Mid: 'mid',
  Senior: 'senior',
  Lead: 'lead',
  Principal: 'principal',
  Director: 'director',
  Vp: 'vp',
  SeniorVp: 'senior_vp',
  CSuite: 'c_suite',
  Founder: 'founder',
} as const;
export type Seniority = (typeof Seniority)[keyof typeof Seniority];

export const CompanySize = {
  Micro: '1-10',
  Small: '11-50',
  Medium: '51-200',
  Mid: '201-500',
  Large: '501-1000',
  Larger: '1001-5000',
  XLarge: '5001-10000',
  XXLarge: '10001+',
} as const;
export type CompanySize = (typeof CompanySize)[keyof typeof CompanySize];

export const SourceKind = {
  CompanySite: 'company_site',
  News: 'news',
  Press: 'press',
  CareersPage: 'careers_page',
  JobsBoard: 'jobs_board',
  Conference: 'conference',
  GitHub: 'github',
  SerpApi: 'serpapi',
  Bing: 'bing',
  LinkedinExtension: 'linkedin_extension',
  ManualUpload: 'manual_upload',
  Inferred: 'inferred',
  GovernmentRegistry: 'government_registry',
  Crunchbase: 'crunchbase',
  Patent: 'patent',
  Academic: 'academic',
} as const;
export type SourceKind = (typeof SourceKind)[keyof typeof SourceKind];

export const SourceTrustTier = {
  Primary: 'primary',     // company-owned or government
  Secondary: 'secondary', // reputable news, press, registries
  Tertiary: 'tertiary',   // aggregators, inferred
} as const;
export type SourceTrustTier = (typeof SourceTrustTier)[keyof typeof SourceTrustTier];

export const ContactKind = {
  Email: 'email',
  Phone: 'phone',
  Switchboard: 'switchboard',
  GenericEmail: 'generic_email',
  Direct: 'direct',
} as const;
export type ContactKind = (typeof ContactKind)[keyof typeof ContactKind];

export const ContactStatus = {
  Verified: 'verified',
  Inferred: 'inferred',
  ReportedBad: 'reported_bad',
  Dnc: 'dnc',
} as const;
export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];

export const VerificationMethod = {
  DirectSourceQuote: 'direct_source_quote',
  Pattern: 'pattern',
  GithubCommit: 'github_commit',
  Conference: 'conference',
  PressBio: 'press_bio',
  LinkedinExtension: 'linkedin_extension',
  Manual: 'manual',
  Reported: 'reported',
  SmtpMx: 'smtp_mx',
  CrossSource: 'cross_source',
} as const;
export type VerificationMethod = (typeof VerificationMethod)[keyof typeof VerificationMethod];

export const ListKind = {
  CompanyList: 'company_list',
  PersonList: 'person_list',
  Mixed: 'mixed',
} as const;
export type ListKind = (typeof ListKind)[keyof typeof ListKind];

export const ChatRole = {
  User: 'user',
  Assistant: 'assistant',
  Tool: 'tool',
  System: 'system',
} as const;
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

export const ToolCallStatus = {
  Pending: 'pending',
  Running: 'running',
  Success: 'success',
  Error: 'error',
} as const;
export type ToolCallStatus = (typeof ToolCallStatus)[keyof typeof ToolCallStatus];

export const EnrichmentStatus = {
  Pending: 'pending',
  Running: 'running',
  Success: 'success',
  Failed: 'failed',
  Partial: 'partial',
} as const;
export type EnrichmentStatus = (typeof EnrichmentStatus)[keyof typeof EnrichmentStatus];

export const EntityKind = {
  Company: 'company',
  Person: 'person',
  Signal: 'signal',
  Office: 'office',
} as const;
export type EntityKind = (typeof EntityKind)[keyof typeof EntityKind];
