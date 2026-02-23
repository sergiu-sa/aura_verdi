/**
 * Pseudonymizer — applies confirmed PII redactions to create the redacted text.
 *
 * Returns:
 * - redactedText: the original text with confirmed PII replaced by masks
 * - redactionMap: { mask → original } for un-redaction later
 *
 * Applies redactions from end to start so character positions stay valid.
 */

import type { PIIDetection } from './pii-detector'

export interface RedactionResult {
  redactedText: string
  redactionMap: Record<string, string> // mask → original
}

export function applyRedactions(
  originalText: string,
  detections: PIIDetection[]
): RedactionResult {
  const redactionMap: Record<string, string> = {}

  // Apply redactions from end to start (positions stay valid when working backwards)
  const confirmedDetections = detections
    .filter((d) => d.confirmed)
    .sort((a, b) => b.start - a.start) // reverse order

  let redactedText = originalText

  for (const detection of confirmedDetections) {
    redactedText =
      redactedText.slice(0, detection.start) +
      detection.suggestedMask +
      redactedText.slice(detection.end)

    // Store mapping (mask → original) for un-redaction later
    redactionMap[detection.suggestedMask] = detection.original
  }

  return { redactedText, redactionMap }
}
