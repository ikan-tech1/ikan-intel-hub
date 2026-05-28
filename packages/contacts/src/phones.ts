import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Phone extraction + validation, India-aware.
 *
 * We pull all phone-like sequences from a text blob, validate them via
 * libphonenumber, and return E.164-formatted strings. Numbers that don't
 * validate as Indian (+91) are excluded unless `allowAnyRegion` is true.
 */

const PHONE_REGEX = /(\+?\d[\d\s\-().]{7,}\d)/g;

export interface ExtractedPhone {
  e164: string;
  region: string;
  type: 'mobile' | 'landline' | 'switchboard' | 'unknown';
  raw: string;
  confidence: number;
}

export function extractPhones(text: string, opts?: { allowAnyRegion?: boolean }): ExtractedPhone[] {
  const allowAny = opts?.allowAnyRegion ?? false;
  const found: ExtractedPhone[] = [];
  const seen = new Set<string>();

  const matches = text.match(PHONE_REGEX) ?? [];
  for (const raw of matches) {
    const cleaned = raw.replace(/[^\d+]/g, '');
    if (cleaned.length < 8) continue;

    // Try parsing as Indian first
    const india = parsePhoneNumberFromString(cleaned, 'IN');
    let parsed = india && india.isValid() ? india : null;

    if (!parsed && allowAny) {
      const intl = parsePhoneNumberFromString(cleaned);
      if (intl && intl.isValid()) parsed = intl;
    }

    if (!parsed) continue;
    const e164 = parsed.number;
    if (seen.has(e164)) continue;
    seen.add(e164);

    found.push({
      e164,
      region: parsed.country ?? 'UNKNOWN',
      type: classify(parsed.getType()),
      raw,
      confidence: parsed.country === 'IN' ? 0.85 : 0.6,
    });
  }
  return found;
}

function classify(t: ReturnType<NonNullable<ReturnType<typeof parsePhoneNumberFromString>>['getType']>): ExtractedPhone['type'] {
  switch (t) {
    case 'MOBILE':
      return 'mobile';
    case 'FIXED_LINE':
    case 'FIXED_LINE_OR_MOBILE':
      return 'landline';
    case 'TOLL_FREE':
    case 'PERSONAL_NUMBER':
      return 'switchboard';
    default:
      return 'unknown';
  }
}

/**
 * Score a phone candidate by its proximity to a person's name in source text.
 * Used to upgrade confidence when the phone clearly belongs to the person
 * rather than being a generic switchboard.
 */
export function proximityBoost(
  text: string,
  personName: string,
  phoneRaw: string,
  windowChars = 250,
): number {
  const nameIdx = text.toLowerCase().indexOf(personName.toLowerCase());
  const phoneIdx = text.indexOf(phoneRaw);
  if (nameIdx === -1 || phoneIdx === -1) return 0;
  const dist = Math.abs(nameIdx - phoneIdx);
  if (dist <= windowChars) return 0.15;
  if (dist <= windowChars * 2) return 0.05;
  return 0;
}

export { isValidPhoneNumber };
