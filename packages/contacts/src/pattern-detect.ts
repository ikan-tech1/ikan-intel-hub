/**
 * Email pattern detection. Given a set of known (firstName, lastName, email)
 * tuples for the same domain, pick the most likely pattern and return its
 * confidence based on consistency across observed tuples.
 */

export const KNOWN_PATTERNS = [
  '{first}.{last}@{domain}',
  '{first}{last}@{domain}',
  '{first}@{domain}',
  '{last}@{domain}',
  '{f}{last}@{domain}',
  '{first}{l}@{domain}',
  '{first}_{last}@{domain}',
  '{last}.{first}@{domain}',
  '{f}.{last}@{domain}',
] as const;

export type EmailPattern = (typeof KNOWN_PATTERNS)[number];

export interface EmailEvidence {
  firstName: string;
  lastName: string;
  email: string;
}

export interface PatternResult {
  pattern: EmailPattern | null;
  confidence: number;        // 0..1 fraction of evidence matching
  evidenceCount: number;
  hits: number;
}

function expand(pattern: EmailPattern, firstName: string, lastName: string, domain: string): string {
  const first = firstName.toLowerCase();
  const last = lastName.toLowerCase();
  const f = first.charAt(0);
  const l = last.charAt(0);
  return pattern
    .replace('{first}', first)
    .replace('{last}', last)
    .replace('{f}', f)
    .replace('{l}', l)
    .replace('{domain}', domain);
}

/**
 * Domain inference: e.g. "jane.doe@hul.co.in" → "hul.co.in".
 */
export function extractDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  return at === -1 ? null : email.slice(at + 1).toLowerCase();
}

/**
 * Detect the most-likely pattern for a domain given evidence tuples.
 *
 * Strategy:
 *   1. For each known pattern, compute what fraction of evidence emails it
 *      would have produced.
 *   2. Pick the pattern with the highest hit rate.
 *   3. Confidence = hits / total. Patterns with <3 hits get penalized.
 */
export function detectPattern(domain: string, evidence: EmailEvidence[]): PatternResult {
  if (evidence.length === 0) {
    return { pattern: null, confidence: 0, evidenceCount: 0, hits: 0 };
  }
  let best: PatternResult = {
    pattern: null,
    confidence: 0,
    evidenceCount: evidence.length,
    hits: 0,
  };
  for (const p of KNOWN_PATTERNS) {
    let hits = 0;
    for (const e of evidence) {
      const expected = expand(p, e.firstName, e.lastName, domain);
      if (expected === e.email.toLowerCase()) hits += 1;
    }
    const confidence = hits / evidence.length;
    // Penalize low-evidence wins
    const penalized = evidence.length < 3 ? confidence * 0.6 : confidence;
    if (penalized > best.confidence) {
      best = { pattern: p, confidence: penalized, evidenceCount: evidence.length, hits };
    }
  }
  return best;
}

/**
 * Apply a detected pattern to a new person.
 *
 * Returns the inferred email and a confidence number that takes both pattern
 * confidence AND a half-discount (since we never claim verified without
 * cross-source evidence).
 */
export function applyPattern(
  pattern: EmailPattern,
  patternConfidence: number,
  firstName: string,
  lastName: string,
  domain: string,
): { email: string; confidence: number } {
  return {
    email: expand(pattern, firstName, lastName, domain),
    confidence: Math.min(0.45, 0.5 * patternConfidence),
  };
}
