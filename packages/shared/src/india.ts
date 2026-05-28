/**
 * India-specific constants. The hub is India-first, so these are first-class.
 *
 * `CITY_ALIASES` normalizes the many names for the same city.
 * `INDIA_STATES` is the canonical list. `TIER1_CITIES` is where mobility/BD focus.
 */

export const TIER1_CITIES = [
  'Bengaluru',
  'Mumbai',
  'Delhi',
  'Gurgaon',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Noida',
  'Kolkata',
  'Ahmedabad',
] as const;
export type Tier1City = (typeof TIER1_CITIES)[number];

/**
 * Map alternate / colloquial / historic names to the canonical city.
 * Used in query understanding ("find leads in Bangalore" → "Bengaluru").
 */
export const CITY_ALIASES: Readonly<Record<string, Tier1City>> = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  blr: 'Bengaluru',
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  bom: 'Mumbai',
  madras: 'Chennai',
  chennai: 'Chennai',
  maa: 'Chennai',
  calcutta: 'Kolkata',
  kolkata: 'Kolkata',
  ccu: 'Kolkata',
  'new delhi': 'Delhi',
  delhi: 'Delhi',
  del: 'Delhi',
  ncr: 'Delhi',
  gurugram: 'Gurgaon',
  gurgaon: 'Gurgaon',
  ggn: 'Gurgaon',
  noida: 'Noida',
  hyderabad: 'Hyderabad',
  hyd: 'Hyderabad',
  cyberabad: 'Hyderabad',
  pune: 'Pune',
  pnq: 'Pune',
  poona: 'Pune',
  ahmedabad: 'Ahmedabad',
  amd: 'Ahmedabad',
};

export function normalizeIndianCity(raw: string): Tier1City | null {
  const key = raw.trim().toLowerCase();
  return CITY_ALIASES[key] ?? null;
}

export const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export const INDIA_NEWS_RSS = [
  { name: 'Mint', url: 'https://www.livemint.com/rss/companies' },
  { name: 'Economic Times Tech', url: 'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms' },
  { name: 'Economic Times Companies', url: 'https://economictimes.indiatimes.com/news/company/corporate-trends/rssfeeds/13352306.cms' },
  { name: 'Inc42', url: 'https://inc42.com/feed/' },
  { name: 'YourStory', url: 'https://yourstory.com/feed' },
  { name: 'MoneyControl Business', url: 'https://www.moneycontrol.com/rss/business.xml' },
  { name: 'Business Standard Companies', url: 'https://www.business-standard.com/rss/companies-101.rss' },
  { name: 'The Hindu Businessline', url: 'https://www.thehindubusinessline.com/companies/feeder/default.rss' },
] as const;
