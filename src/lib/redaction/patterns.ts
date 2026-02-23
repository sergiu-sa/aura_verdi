/**
 * Norwegian PII patterns for the Privacy Shield redaction engine.
 * These cover the most common formats found in Norwegian financial documents.
 *
 * The regex patterns are used by pii-detector.ts to scan extracted document text.
 * ALL documents must pass through this detection before Claude analysis.
 */

export const PII_PATTERNS = {
  // Fødselsnummer: 6 digits (DDMMYY) + 5 digits (individual number + check digits)
  fodselsnummer: {
    regex: /\b(\d{2}[01]\d[0-3]\d)\s?(\d{5})\b/g,
    label: 'PERSONAL ID',
    maskType: 'full' as const, // completely remove — too sensitive
  },

  // Norwegian bank account: XXXX.XX.XXXXX (11 digits, often with dots)
  bankAccount: {
    regex: /\b(\d{4})[\.\s]?(\d{2})[\.\s]?(\d{5})\b/g,
    label: 'ACCOUNT',
    maskType: 'partial' as const, // show last 5 digits for relationship tracking
  },

  // IBAN starting with NO
  iban: {
    regex: /\b(NO)\s?(\d{2})\s?(\d{4})\s?(\d{4})\s?(\d{3})\b/gi,
    label: 'IBAN',
    maskType: 'partial' as const,
  },

  // Norwegian phone numbers (8 digits, optionally with +47)
  phone: {
    regex: /\b(?:\+47\s?)?([2-9]\d{2})\s?(\d{2})\s?(\d{3})\b/g,
    label: 'PHONE',
    maskType: 'full' as const,
  },

  // Email addresses
  email: {
    regex: /\b[\w.\-+]+@[\w.\-]+\.\w{2,}\b/gi,
    label: 'EMAIL',
    maskType: 'full' as const,
  },

  // Norwegian postal addresses — look for street type keywords
  address: {
    regex: /\b[\wæøåÆØÅ\s]+(?:gate|gata|vei|veien|vegen|plass|plassen|terrasse|terrassen|allé|alléen|sving|svingen|tun|tunet)\s+\d+[\s,]*(?:\d{4}\s+[\wæøåÆØÅ]+)?\b/gi,
    label: 'ADDRESS',
    maskType: 'full' as const,
  },

  // Organisation numbers (9 digits, often formatted XXX XXX XXX)
  // Note: this is broad — will have false positives. The user review step handles this.
  orgNumber: {
    regex: /\b(\d{3})\s?(\d{3})\s?(\d{3})\b/g,
    label: 'ORG NUMBER',
    maskType: 'full' as const,
  },
} as const

export type PIIType = keyof typeof PII_PATTERNS
