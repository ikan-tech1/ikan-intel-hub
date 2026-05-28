/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds Ikan Intel Hub with a curated set of India-presence multinationals,
 * a few exemplar executives, and a handful of recent-style signals.
 *
 * The data here is illustrative only — meant to demo the platform end-to-end.
 * Real production data is built up by the scrapers + extension at runtime.
 *
 * Re-running is idempotent (slug-keyed upserts).
 */

type SeedCompany = {
  slug: string;
  name: string;
  domain: string;
  industry: string;
  description: string;
  hqCity: string;
  hqCountry: string;
  indiaPresence: boolean;
  indiaOffices: Array<{ city: string; state?: string }>;
  size: string;
  mobilityRelevance: number; // 0..1
};

const COMPANIES: SeedCompany[] = [
  {
    slug: 'mercedes-benz-india',
    name: 'Mercedes-Benz India',
    domain: 'mercedes-benz.co.in',
    industry: 'Automotive',
    description:
      'The Indian subsidiary of Mercedes-Benz AG, manufactures and sells luxury vehicles. HQ Pune; significant footprint in Bengaluru R&D.',
    hqCity: 'Pune',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Bengaluru', state: 'Karnataka' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Delhi' },
    ],
    size: '1001-5000',
    mobilityRelevance: 0.86,
  },
  {
    slug: 'goldman-sachs-india',
    name: 'Goldman Sachs Services (India)',
    domain: 'goldmansachs.com',
    industry: 'Financial Services',
    description:
      'Major India operations of Goldman Sachs, with engineering and operations centers in Bengaluru and Hyderabad.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Bengaluru', state: 'Karnataka' },
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Mumbai', state: 'Maharashtra' },
    ],
    size: '5001-10000',
    mobilityRelevance: 0.92,
  },
  {
    slug: 'microsoft-india',
    name: 'Microsoft India',
    domain: 'microsoft.com',
    industry: 'Technology',
    description:
      'India subsidiary of Microsoft Corporation; one of the largest R&D footprints outside the US, anchored in Hyderabad and Bengaluru.',
    hqCity: 'Hyderabad',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Hyderabad', state: 'Telangana' },
      { city: 'Bengaluru', state: 'Karnataka' },
      { city: 'Noida', state: 'Uttar Pradesh' },
      { city: 'Mumbai', state: 'Maharashtra' },
      { city: 'Gurgaon', state: 'Haryana' },
      { city: 'Pune', state: 'Maharashtra' },
      { city: 'Chennai', state: 'Tamil Nadu' },
    ],
    size: '10001+',
    mobilityRelevance: 0.94,
  },
  {
    slug: 'amazon-india',
    name: 'Amazon India',
    domain: 'amazon.in',
    industry: 'E-commerce & Cloud',
    description:
      'India arm of Amazon spanning retail, AWS, and Prime Video. Large mobility footprint due to multi-city expansion and senior-leader rotations.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Bengaluru' },
      { city: 'Hyderabad' },
      { city: 'Mumbai' },
      { city: 'Delhi' },
      { city: 'Chennai' },
    ],
    size: '10001+',
    mobilityRelevance: 0.91,
  },
  {
    slug: 'google-india',
    name: 'Google India',
    domain: 'google.com',
    industry: 'Technology',
    description:
      'India operations of Google LLC. Major engineering presence in Bengaluru and Hyderabad; ads and operations in Gurgaon.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Bengaluru' },
      { city: 'Hyderabad' },
      { city: 'Gurgaon' },
      { city: 'Mumbai' },
    ],
    size: '5001-10000',
    mobilityRelevance: 0.9,
  },
  {
    slug: 'apple-india',
    name: 'Apple India',
    domain: 'apple.com',
    industry: 'Technology',
    description:
      'India subsidiary of Apple Inc., expanding rapidly post 2023 retail launch; growing engineering and supply-chain footprint in Bengaluru and Hyderabad.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Bengaluru' },
      { city: 'Hyderabad' },
      { city: 'Mumbai' },
      { city: 'Delhi' },
    ],
    size: '1001-5000',
    mobilityRelevance: 0.88,
  },
  {
    slug: 'jpmorgan-chase-india',
    name: 'JPMorgan Chase India',
    domain: 'jpmorgan.com',
    industry: 'Financial Services',
    description:
      "Tech, operations, and corporate services arm of JPMorgan in India. Among the largest single-employer footprints in Bengaluru and Mumbai.",
    hqCity: 'Mumbai',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Mumbai' },
      { city: 'Bengaluru' },
      { city: 'Hyderabad' },
    ],
    size: '10001+',
    mobilityRelevance: 0.93,
  },
  {
    slug: 'cisco-india',
    name: 'Cisco Systems India',
    domain: 'cisco.com',
    industry: 'Networking & Software',
    description:
      "Cisco's second-largest global R&D site; significant Bengaluru engineering footprint.",
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [{ city: 'Bengaluru' }, { city: 'Pune' }, { city: 'Mumbai' }],
    size: '5001-10000',
    mobilityRelevance: 0.87,
  },
  {
    slug: 'walmart-global-tech-india',
    name: 'Walmart Global Tech India',
    domain: 'walmartglobaltech.com',
    industry: 'Retail Technology',
    description:
      "Walmart's tech capability center in India powering global retail platforms. Anchor sites in Bengaluru and Chennai.",
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [{ city: 'Bengaluru' }, { city: 'Chennai' }, { city: 'Gurgaon' }],
    size: '10001+',
    mobilityRelevance: 0.89,
  },
  {
    slug: 'sap-labs-india',
    name: 'SAP Labs India',
    domain: 'sap.com',
    industry: 'Enterprise Software',
    description:
      'One of the largest SAP R&D centers globally; deep India presence anchored in Bengaluru with offices in Gurgaon and Pune.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [{ city: 'Bengaluru' }, { city: 'Gurgaon' }, { city: 'Pune' }],
    size: '10001+',
    mobilityRelevance: 0.88,
  },
  {
    slug: 'oracle-india',
    name: 'Oracle India',
    domain: 'oracle.com',
    industry: 'Enterprise Software',
    description:
      'Major Oracle development and consulting footprint in India, anchored in Bengaluru and Hyderabad.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Bengaluru' },
      { city: 'Hyderabad' },
      { city: 'Mumbai' },
      { city: 'Pune' },
    ],
    size: '10001+',
    mobilityRelevance: 0.86,
  },
  {
    slug: 'adobe-india',
    name: 'Adobe India',
    domain: 'adobe.com',
    industry: 'Software',
    description:
      "Adobe's India operations span product engineering and digital media. Major centers in Noida and Bengaluru.",
    hqCity: 'Noida',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [{ city: 'Noida' }, { city: 'Bengaluru' }],
    size: '5001-10000',
    mobilityRelevance: 0.84,
  },
  {
    slug: 'siemens-india',
    name: 'Siemens India',
    domain: 'siemens.com',
    industry: 'Industrial Automation',
    description:
      'Listed Indian subsidiary of Siemens AG with major engineering and manufacturing footprint. Mumbai HQ; sites across Bengaluru, Gurgaon, Chennai.',
    hqCity: 'Mumbai',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Mumbai' },
      { city: 'Bengaluru' },
      { city: 'Gurgaon' },
      { city: 'Chennai' },
      { city: 'Pune' },
    ],
    size: '10001+',
    mobilityRelevance: 0.85,
  },
  {
    slug: 'volvo-india',
    name: 'Volvo Group India',
    domain: 'volvogroup.com',
    industry: 'Automotive',
    description:
      'Volvo Group India spans trucks, buses, construction equipment, and IT services arm Volvo Group Connected Solutions in Bengaluru.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [{ city: 'Bengaluru' }, { city: 'Hosakote' }, { city: 'Mumbai' }],
    size: '5001-10000',
    mobilityRelevance: 0.83,
  },
  {
    slug: 'unilever-india',
    name: 'Hindustan Unilever (HUL)',
    domain: 'hul.co.in',
    industry: 'Consumer Goods',
    description:
      "Indian subsidiary of Unilever — one of India's largest FMCG companies. HQ Mumbai, R&D Bengaluru.",
    hqCity: 'Mumbai',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [{ city: 'Mumbai' }, { city: 'Bengaluru' }, { city: 'Gurgaon' }],
    size: '10001+',
    mobilityRelevance: 0.78,
  },
  {
    slug: 'cognizant-india',
    name: 'Cognizant India',
    domain: 'cognizant.com',
    industry: 'IT Services',
    description:
      'India operations of Cognizant; one of the largest employers in Indian IT services with major Chennai HQ and pan-India footprint.',
    hqCity: 'Chennai',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Chennai' },
      { city: 'Bengaluru' },
      { city: 'Hyderabad' },
      { city: 'Pune' },
      { city: 'Mumbai' },
      { city: 'Kolkata' },
    ],
    size: '10001+',
    mobilityRelevance: 0.86,
  },
  {
    slug: 'accenture-india',
    name: 'Accenture India',
    domain: 'accenture.com',
    industry: 'Consulting & IT',
    description:
      "Accenture's largest country presence by headcount, with delivery centers across all Tier-1 Indian cities.",
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Bengaluru' },
      { city: 'Mumbai' },
      { city: 'Pune' },
      { city: 'Hyderabad' },
      { city: 'Chennai' },
      { city: 'Gurgaon' },
      { city: 'Noida' },
    ],
    size: '10001+',
    mobilityRelevance: 0.88,
  },
  {
    slug: 'ibm-india',
    name: 'IBM India',
    domain: 'ibm.com',
    industry: 'IT Services & Hardware',
    description:
      'IBM India operations include services, software, and consulting delivery, with major centers in Bengaluru, Pune, and Gurgaon.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [
      { city: 'Bengaluru' },
      { city: 'Pune' },
      { city: 'Gurgaon' },
      { city: 'Mumbai' },
      { city: 'Kolkata' },
    ],
    size: '10001+',
    mobilityRelevance: 0.84,
  },
  {
    slug: 'paypal-india',
    name: 'PayPal India',
    domain: 'paypal.com',
    industry: 'Fintech',
    description:
      'India technology center for PayPal Holdings, anchored in Bengaluru and Chennai.',
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [{ city: 'Bengaluru' }, { city: 'Chennai' }],
    size: '1001-5000',
    mobilityRelevance: 0.82,
  },
  {
    slug: 'visa-india',
    name: 'Visa Technology Center India',
    domain: 'visa.com',
    industry: 'Fintech',
    description:
      "Visa's growing India technology and operations footprint, anchored in Bengaluru.",
    hqCity: 'Bengaluru',
    hqCountry: 'India',
    indiaPresence: true,
    indiaOffices: [{ city: 'Bengaluru' }],
    size: '1001-5000',
    mobilityRelevance: 0.84,
  },
];

async function seedSources() {
  const sources = [
    {
      kind: 'COMPANY_SITE' as const,
      name: 'Mercedes-Benz India',
      url: 'https://www.mercedes-benz.co.in',
      trustTier: 'PRIMARY' as const,
    },
    {
      kind: 'NEWS' as const,
      name: 'Economic Times — Tech',
      url: 'https://economictimes.indiatimes.com/tech',
      trustTier: 'SECONDARY' as const,
    },
    {
      kind: 'NEWS' as const,
      name: 'YourStory',
      url: 'https://yourstory.com',
      trustTier: 'SECONDARY' as const,
    },
    {
      kind: 'NEWS' as const,
      name: 'Inc42',
      url: 'https://inc42.com',
      trustTier: 'SECONDARY' as const,
    },
    {
      kind: 'PRESS' as const,
      name: 'Business Standard',
      url: 'https://www.business-standard.com',
      trustTier: 'SECONDARY' as const,
    },
    {
      kind: 'MANUAL_UPLOAD' as const,
      name: 'Ikan Internal Seed',
      url: 'https://ikan.internal/seed',
      trustTier: 'TERTIARY' as const,
    },
  ];
  const created: Record<string, string> = {};
  for (const s of sources) {
    const row = await prisma.source.create({
      data: { ...s, fetchedAt: new Date() },
    });
    created[s.url] = row.id;
  }
  return created;
}

async function seedCompanies() {
  for (const c of COMPANIES) {
    const existing = await prisma.company.findUnique({ where: { slug: c.slug } });
    if (existing) continue;

    await prisma.company.create({
      data: {
        slug: c.slug,
        name: c.name,
        primaryDomain: c.domain,
        domains: [c.domain],
        description: c.description,
        industry: c.industry,
        sizeEstimate: c.size,
        hqCity: c.hqCity,
        hqCountry: c.hqCountry,
        indiaPresence: c.indiaPresence,
        indiaOfficeCount: c.indiaOffices.length,
        mobilityRelevanceScore: c.mobilityRelevance,
        freshnessAt: new Date(),
        offices: {
          create: c.indiaOffices.map((o) => ({
            city: o.city,
            state: o.state ?? null,
            country: 'India',
            status: 'ACTIVE',
            confidence: 0.9,
          })),
        },
        domainsRel: {
          create: [
            {
              domain: c.domain,
              isPrimary: true,
              emailPattern: '{first}.{last}@{domain}',
              patternConfidence: 0.7,
              patternEvidenceCount: 0,
            },
          ],
        },
      },
    });
  }
}

async function seedDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: 'demo@ikan.local' } });
  if (existing) return existing;

  const team = await prisma.team.upsert({
    where: { slug: 'ikan-demo' },
    update: {},
    create: { slug: 'ikan-demo', name: 'Ikan Demo' },
  });

  return prisma.user.create({
    data: {
      email: 'demo@ikan.local',
      name: 'Demo User',
      role: 'ADMIN',
      teamId: team.id,
    },
  });
}

async function main() {
  console.log('▸ Seeding sources…');
  await seedSources();
  console.log('▸ Seeding companies…');
  await seedCompanies();
  console.log('▸ Seeding demo user…');
  const u = await seedDemoUser();
  console.log(`  ↳ demo user: ${u.email}`);
  console.log('✓ Seed complete');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
