export { discoverContactsForPerson, type Intensity, type DiscoveryResult } from './engine.js';
export {
  detectPattern,
  applyPattern,
  extractDomain,
  KNOWN_PATTERNS,
  type EmailPattern,
  type EmailEvidence,
  type PatternResult,
} from './pattern-detect.js';
export { extractPhones, proximityBoost, type ExtractedPhone } from './phones.js';
export { checkMx, isGenericPersonalDomain, type MxResult } from './mx.js';
