import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * AEAD encryption for contact_points.value.
 *
 * Uses AES-256-GCM with a key derived from CONTACT_ENC_KEY env var.
 * Output format: base64(iv | ciphertext | authTag).
 *
 * `valueHash` is sha256 of the *canonicalized* value (lowercased for email;
 * E.164 stripped for phone) so we can dedupe + look up without decrypting.
 */

const KEY_ENV = 'CONTACT_ENC_KEY';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer {
  const raw = process.env[KEY_ENV];
  if (!raw) {
    throw new Error(
      `${KEY_ENV} not set. Generate with: openssl rand -base64 32`,
    );
  }
  // Accept base64 or raw 32-byte hex. We hash-stretch to be safe.
  return createHash('sha256').update(raw).digest();
}

export function encryptContact(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]).toString('base64');
}

export function decryptContact(blob: string): string {
  const key = getKey();
  const data = Buffer.from(blob, 'base64');
  const iv = data.subarray(0, IV_BYTES);
  const tag = data.subarray(data.length - TAG_BYTES);
  const ct = data.subarray(IV_BYTES, data.length - TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/**
 * Canonical hash used for dedupe + DNC lookup. Lowercases emails; for phones,
 * caller should pass an already E.164-normalized value.
 */
export function hashContactValue(canonicalValue: string): string {
  return createHash('sha256').update(canonicalValue).digest('hex');
}

export function canonicalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Phones should already be E.164. If you have a raw string, run it through
 * libphonenumber first (see @ikan/contacts/layers/phones.ts).
 */
export function canonicalizePhone(phoneE164: string): string {
  return phoneE164.replace(/\s|-/g, '');
}
