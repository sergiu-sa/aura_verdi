'use client'

/**
 * RedactionPreview
 *
 * Shows the extracted document text with all detected PII highlighted.
 * The user can confirm or unconfirm each detection before proceeding.
 *
 * Flow:
 *   1. Shows extracted text with highlighted spans for each PII item
 *   2. Lists all detections below with type, original (truncated), and mask
 *   3. User can uncheck any detection they don't want redacted
 *   4. "Confirm & Analyze" → POST /api/documents/confirm-redaction → POST /api/documents/analyze
 *   5. "Skip redaction" → skips with a warning, proceeds to analysis
 *
 * This is rendered inline in the document card when status = 'pii_detected'.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PIIDetection } from '@/lib/redaction/pii-detector'

interface Props {
  documentId: string
  extractedText: string
  detections: PIIDetection[]
  onComplete: () => void
  onCancel: () => void
}

const PII_TYPE_LABELS: Record<string, string> = {
  fodselsnummer: 'National ID (fødselsnummer)',
  bankAccount: 'Bank account number',
  iban: 'IBAN',
  phone: 'Phone number',
  email: 'Email address',
  address: 'Address',
  orgNumber: 'Organisation number',
}

const PII_TYPE_COLORS: Record<string, string> = {
  fodselsnummer: 'bg-red-500/20 border-red-500/40 text-red-300',
  bankAccount: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  iban: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  phone: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  email: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  address: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  orgNumber: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
}

export function RedactionPreview({
  documentId,
  extractedText,
  detections: initialDetections,
  onComplete,
  onCancel,
}: Props) {
  const [detections, setDetections] = useState<PIIDetection[]>(initialDetections)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmedCount = detections.filter((d) => d.confirmed).length

  // ── Toggle a single detection ────────────────────────────────────────────
  function toggleDetection(index: number) {
    setDetections((prev) =>
      prev.map((d, i) => (i === index ? { ...d, confirmed: !d.confirmed } : d))
    )
  }

  // ── Confirm redactions and trigger analysis ──────────────────────────────
  async function handleConfirm(skip = false) {
    setSubmitting(true)
    setError(null)

    try {
      // Step 1: confirm redactions
      const confirmRes = await fetch('/api/documents/confirm-redaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, detections, skip }),
      })

      if (!confirmRes.ok) {
        const d = await confirmRes.json()
        setError(d.error ?? 'Failed to apply redactions. Please try again.')
        return
      }

      // Step 2: trigger analysis on the redacted text
      const analyzeRes = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })

      if (!analyzeRes.ok) {
        const d = await analyzeRes.json()
        setError(d.error ?? 'Analysis failed. Please try again.')
        return
      }

      onComplete()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render highlighted text ──────────────────────────────────────────────
  // Build segments: alternating plain text and highlighted PII spans
  const segments: Array<{ text: string; detection?: PIIDetection; index?: number }> = []
  const confirmedDetections = detections
    .map((d, i) => ({ ...d, index: i }))
    .filter((d) => d.confirmed) // only show highlights for confirmed ones
    .sort((a, b) => a.start - b.start)

  let cursor = 0
  for (const det of confirmedDetections) {
    if (det.start > cursor) {
      segments.push({ text: extractedText.slice(cursor, det.start) })
    }
    segments.push({
      text: extractedText.slice(det.start, det.end),
      detection: det,
      index: det.index,
    })
    cursor = det.end
  }
  if (cursor < extractedText.length) {
    segments.push({ text: extractedText.slice(cursor) })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-1">
          Privacy Shield
        </p>
        <h3 className="text-sm font-medium text-[#E8E8EC]">Review personal information</h3>
        <p className="text-xs text-[#8888A0] mt-1 leading-relaxed">
          {detections.length === 0
            ? 'No personal information was detected. You can proceed directly to analysis.'
            : `${detections.length} item${detections.length !== 1 ? 's' : ''} detected. Highlighted items will be masked before the document is analyzed.`
          }
        </p>
      </div>

      {/* Extracted text with highlights */}
      {extractedText && (
        <div className="p-3 rounded-lg bg-[#121218] border border-[#2C2C3A] max-h-48 overflow-y-auto">
          <p className="text-xs text-[#8888A0] font-mono leading-relaxed whitespace-pre-wrap break-words">
            {segments.map((seg, i) =>
              seg.detection ? (
                <mark
                  key={i}
                  className={`rounded px-0.5 border ${PII_TYPE_COLORS[seg.detection.type] ?? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'} not-italic`}
                  title={PII_TYPE_LABELS[seg.detection.type] ?? seg.detection.type}
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </p>
        </div>
      )}

      {/* Detection list */}
      {detections.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest text-[#8888A0]">
            Detected items — uncheck to keep unmasked
          </p>
          {detections.map((det, i) => (
            <label
              key={i}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-[#121218] border border-[#2C2C3A] cursor-pointer hover:border-[#0D7377]/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={det.confirmed}
                onChange={() => toggleDetection(i)}
                className="mt-0.5 accent-[#0D7377] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PII_TYPE_COLORS[det.type] ?? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'}`}>
                    {PII_TYPE_LABELS[det.type] ?? det.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#8888A0] font-mono truncate max-w-[120px]">
                    {det.original.length > 20 ? `${det.original.slice(0, 20)}…` : det.original}
                  </span>
                  <span className="text-[10px] text-[#4A4A60]">→</span>
                  <span className="text-xs text-[#0D7377] font-mono">
                    {det.suggestedMask}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-2.5 rounded-lg bg-[#3B0D0D] border border-[#C75050]/40">
          <p className="text-xs text-[#F08080]">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={onCancel}
          className="text-xs text-[#8888A0] hover:text-[#E8E8EC]"
          disabled={submitting}
        >
          Cancel
        </button>

        <div className="flex gap-2">
          {detections.length > 0 && (
            <button
              onClick={() => handleConfirm(true)}
              disabled={submitting}
              className="text-xs text-[#8888A0] hover:text-[#D4A039] underline disabled:opacity-50"
            >
              Skip redaction
            </button>
          )}
          <Button
            size="sm"
            onClick={() => handleConfirm(false)}
            disabled={submitting}
            className="bg-[#0D7377] hover:bg-[#11999E] text-white text-xs"
          >
            {submitting
              ? 'Analyzing...'
              : detections.length === 0
                ? 'Analyze document'
                : `Redact ${confirmedCount} item${confirmedCount !== 1 ? 's' : ''} & analyze`
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
