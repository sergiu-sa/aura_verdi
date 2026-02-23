/**
 * PII Detector — scans extracted document text and returns all findings.
 *
 * Returns an array of PIIDetection objects with:
 * - the exact character positions in the text (start/end)
 * - the original matched text
 * - the suggested mask (consistent pseudonym)
 * - confirmed: true by default (user can unconfirm in the UI)
 *
 * Consistent pseudonymization: if the same value appears multiple times,
 * it always gets the same mask — so Claude can still reason about
 * relationships ("payment from ████.██.78901 to ████.██.32109").
 */

import { PII_PATTERNS, type PIIType } from './patterns'

export interface PIIDetection {
  type: PIIType
  start: number        // character position in text
  end: number
  original: string     // the matched text
  suggestedMask: string // what it would be replaced with
  confirmed: boolean   // user has confirmed this redaction (default: true)
}

export function detectPII(text: string): PIIDetection[] {
  const detections: PIIDetection[] = []
  const labelCounters: Record<string, number> = {}

  // Track unique values per type for consistent labeling across the document
  const seenValues: Record<string, string> = {} // normalizedOriginal → mask

  for (const [type, config] of Object.entries(PII_PATTERNS)) {
    // Always create a fresh regex to reset lastIndex
    const regex = new RegExp(config.regex.source, config.regex.flags)
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const original = match[0]

      // Normalize to check if we've seen this exact value before
      const normalizedOriginal = original.replace(/\s/g, '')
      let mask: string

      if (seenValues[normalizedOriginal]) {
        // Same value → same mask (consistent pseudonymization)
        mask = seenValues[normalizedOriginal]
      } else {
        // New unique value → generate new mask
        const labelBase = config.label
        if (!labelCounters[labelBase]) labelCounters[labelBase] = 0
        const letter = String.fromCharCode(65 + labelCounters[labelBase]) // A, B, C...
        labelCounters[labelBase]++

        if (config.maskType === 'partial' && type === 'bankAccount') {
          // Show last 5 digits: 1234.56.78901 → ████.██.78901
          const digits = normalizedOriginal
          const lastFive = digits.slice(-5)
          mask = `████.██.${lastFive}`
        } else if (config.maskType === 'partial' && type === 'iban') {
          const digits = normalizedOriginal.replace(/[^0-9]/g, '')
          const lastFour = digits.slice(-4)
          mask = `[IBAN ████${lastFour}]`
        } else {
          mask = `[${labelBase} ${letter}]`
        }

        seenValues[normalizedOriginal] = mask
      }

      detections.push({
        type: type as PIIType,
        start: match.index,
        end: match.index + original.length,
        original,
        suggestedMask: mask,
        confirmed: true, // auto-detected items default to confirmed
      })
    }
  }

  // Sort by position (important for applying redactions correctly)
  detections.sort((a, b) => a.start - b.start)

  // Remove overlapping detections (keep the longer/more specific match)
  const filtered: PIIDetection[] = []
  for (const detection of detections) {
    const lastKept = filtered[filtered.length - 1]
    if (lastKept && detection.start < lastKept.end) {
      // Overlap — keep the one with longer match (more specific)
      if (detection.original.length > lastKept.original.length) {
        filtered[filtered.length - 1] = detection
      }
      // else skip this detection
    } else {
      filtered.push(detection)
    }
  }

  return filtered
}
