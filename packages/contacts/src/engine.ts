import { prisma, encryptContact, hashContactValue, canonicalizeEmail } from '@ikan/db';
import { detectPattern, applyPattern, type EmailEvidence } from './pattern-detect.js';
import { extractPhones } from './phones.js';
import { checkMx } from './mx.js';

/**
 * Discovery engine — orchestrates the 10 layers from the implementation plan.
 *
 * MVP scope: layers 7 (pattern inference), 8 (phone extraction), 9 (MX check).
 * The earlier layers (1–6: direct match, cross-source, GitHub, conferences,
 * LinkedIn extension, SerpAPI snippet) read from the scraper output tables
 * and aren't wired here yet — Phase 2 plumbs them.
 *
 * This file is the contract surface: `discoverContactsForPerson(personId, intensity)`
 * is the single entry point the worker and the `find_contacts` tool call.
 */

export type Intensity = 'low' | 'medium' | 'high';

export interface DiscoveryResult {
  personId: string;
  candidatesCreated: number;
  promoted: number;
  pattern: string | null;
  patternConfidence: number;
  phonesFound: number;
}

export async function discoverContactsForPerson(
  personId: string,
  intensity: Intensity = 'medium',
): Promise<DiscoveryResult> {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      currentCompany: {
        include: {
          domainsRel: { take: 5 },
          contactPoints: {
            where: {
              status: 'VERIFIED',
              kind: { in: ['EMAIL', 'GENERIC_EMAIL'] },
            },
            include: { person: { select: { firstName: true, lastName: true } } },
            take: 50,
          },
        },
      },
    },
  });
  if (!person || !person.currentCompany) {
    return {
      personId,
      candidatesCreated: 0,
      promoted: 0,
      pattern: null,
      patternConfidence: 0,
      phonesFound: 0,
    };
  }

  const company = person.currentCompany;
  const primaryDomain = company.primaryDomain ?? company.domainsRel[0]?.domain;
  if (!primaryDomain) {
    return {
      personId,
      candidatesCreated: 0,
      promoted: 0,
      pattern: null,
      patternConfidence: 0,
      phonesFound: 0,
    };
  }

  // Layer 7: pattern inference (only for intensity 'high', or 'medium' if domain pattern is well-known)
  let pattern: string | null = null;
  let patternConfidence = 0;
  let candidatesCreated = 0;

  if (intensity === 'high' && person.firstName && person.lastName) {
    // Build evidence from verified emails for the same domain
    // (Decryption-required — but for MVP we keep verified emails plaintext in seed.
    // Real production will decrypt via packages/db encryption helpers.)
    const evidence: EmailEvidence[] = company.contactPoints
      .map((c) => {
        if (!c.person?.firstName || !c.person?.lastName) return null;
        const email = safeDecrypt(c.value);
        if (!email) return null;
        return { firstName: c.person.firstName, lastName: c.person.lastName, email };
      })
      .filter((e): e is EmailEvidence => e !== null);

    if (evidence.length > 0) {
      const detected = detectPattern(primaryDomain, evidence);
      pattern = detected.pattern;
      patternConfidence = detected.confidence;

      if (detected.pattern && detected.confidence > 0.4) {
        // Check MX before persisting an inferred email
        const mx = await checkMx(primaryDomain);
        if (mx.hasMx) {
          const { email, confidence } = applyPattern(
            detected.pattern,
            detected.confidence,
            person.firstName,
            person.lastName,
            primaryDomain,
          );
          const valueHash = hashContactValue(canonicalizeEmail(email));
          // Avoid creating dupe candidates
          const existing = await prisma.contactCandidate.findFirst({
            where: { personId, kind: 'EMAIL', value: email },
          });
          if (!existing) {
            await prisma.contactCandidate.create({
              data: {
                personId,
                kind: 'EMAIL',
                value: email,
                sourceEvidence: [{ method: 'pattern', evidenceCount: evidence.length }] as object,
                inferredMethod: 'PATTERN',
                confidence,
              },
            });
            candidatesCreated += 1;
            // Also write the pattern to the Domain row so other queries benefit
            await prisma.domain.updateMany({
              where: { domain: primaryDomain },
              data: {
                emailPattern: detected.pattern,
                patternConfidence: detected.confidence,
                patternEvidenceCount: detected.evidenceCount,
              },
            });
          }
          // Silence "unused" warning while we wire the promotion step:
          void valueHash;
        }
      }
    }
  }

  // Layer 8: phone extraction (high intensity only — phones are harder to dedupe and bias)
  let phonesFound = 0;
  // (Phase 2: pull biography/source-text from scraped sources for this person
  // and run extractPhones() on each. For MVP, we leave this as a no-op stub
  // so the agent's `find_contacts` tool returns sensible results.)
  void extractPhones; // keep import live until wired

  return {
    personId,
    candidatesCreated,
    promoted: 0,
    pattern,
    patternConfidence,
    phonesFound,
  };
}

function safeDecrypt(value: string): string | null {
  // For seed data we keep emails plaintext until encryption key is provisioned.
  // If the value looks like base64-AEAD blob, try to decrypt; otherwise return as-is.
  try {
    if (value.includes('@')) return value;
    // Real path: decryptContact(value)
    return null;
  } catch {
    return null;
  }
}

void encryptContact;
