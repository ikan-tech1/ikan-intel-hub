import { promises as dns } from 'node:dns';

/**
 * MX validation + catch-all heuristic.
 *
 * The engine NEVER probes individual SMTP addresses — that's an abuse vector.
 * We only:
 *   - resolve MX records to confirm the domain accepts email
 *   - flag catch-all domains (heuristic) so the UI can warn "verify manually"
 */

export interface MxResult {
  hasMx: boolean;
  records: Array<{ exchange: string; priority: number }>;
  catchAllSuspected: boolean | null;
}

const KNOWN_CATCH_ALL_DOMAINS = new Set<string>([
  // Domains historically associated with catch-all behavior; expand as we learn.
  'gmail.com', // not catch-all, but generic; treat specially in UI
  'yahoo.com',
  'outlook.com',
  'icloud.com',
  'protonmail.com',
]);

export async function checkMx(domain: string): Promise<MxResult> {
  try {
    const records = await dns.resolveMx(domain);
    return {
      hasMx: records.length > 0,
      records: records.map((r) => ({ exchange: r.exchange, priority: r.priority })),
      catchAllSuspected: KNOWN_CATCH_ALL_DOMAINS.has(domain) ? true : null,
    };
  } catch {
    return { hasMx: false, records: [], catchAllSuspected: null };
  }
}

export function isGenericPersonalDomain(domain: string): boolean {
  return KNOWN_CATCH_ALL_DOMAINS.has(domain);
}
