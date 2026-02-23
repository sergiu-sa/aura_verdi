'use client'

/**
 * DocumentCard
 *
 * Renders a single document through all stages of the Privacy Shield flow:
 *
 *   uploaded          → shouldn't normally be visible (detect-pii runs immediately after upload)
 *   pii_detected      → shows RedactionPreview inline (user must review before analysis)
 *   redaction_confirmed → shows "Analyzing..." spinner
 *   analyzing         → shows spinner
 *   analyzed          → shows AI summary with urgency + expand/collapse details
 *   error             → shows retry button
 */

import { useState } from 'react'
import { RedactionPreview } from './redaction-preview'
import type { PIIDetection } from '@/lib/redaction/pii-detector'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentRecord {
  id: string
  original_filename: string
  file_size_bytes: number | null
  mime_type: string | null
  document_type: 'contract' | 'letter' | 'invoice' | 'tax' | 'bank_statement' | 'inkasso' | 'other' | null
  extracted_text: string | null
  ai_summary: string | null
  ai_flags: {
    concerns?: string[]
    deadlines?: string[]
    urgency?: 'low' | 'medium' | 'high'
    recommended_action?: string | null
  } | null
  ai_analyzed_at: string | null
  status: 'uploaded' | 'text_extracted' | 'pii_detected' | 'redaction_confirmed' | 'analyzing' | 'analyzed' | 'error'
  redaction_status: 'pending' | 'auto_detected' | 'user_confirmed' | 'skipped' | null
  pii_detections: PIIDetection[] | null
  uploaded_at: string
}

interface Props {
  doc: DocumentRecord
  onRefresh: () => void
  onRetryAnalysis?: (documentId: string) => void
  retrying?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  contract: 'Contract',
  letter: 'Letter',
  invoice: 'Invoice',
  tax: 'Tax document',
  bank_statement: 'Bank statement',
  inkasso: 'Debt collection',
  other: 'Document',
}

const URGENCY_CONFIG = {
  high: { color: 'text-[#C75050]', bg: 'bg-[#3B0D0D]', border: 'border-[#C75050]/30', label: 'Urgent' },
  medium: { color: 'text-[#D4A039]', bg: 'bg-[#3B2A0D]', border: 'border-[#D4A039]/30', label: 'Review needed' },
  low: { color: 'text-[#2D8B6F]', bg: 'bg-[#0D3B2E]', border: 'border-[#2D8B6F]/30', label: 'No action needed' },
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fileIcon(mimeType: string | null): string {
  if (!mimeType) return '📄'
  if (mimeType === 'application/pdf') return '📋'
  if (mimeType.startsWith('image/')) return '🖼️'
  return '📄'
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentCard({ doc, onRefresh, onRetryAnalysis, retrying = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showRedactionPreview, setShowRedactionPreview] = useState(
    doc.status === 'pii_detected'
  )

  const urgency = doc.ai_flags?.urgency
  const urgencyConfig = urgency ? URGENCY_CONFIG[urgency] : null
  const docTypeLabel = doc.document_type ? DOC_TYPE_LABELS[doc.document_type] : 'Document'
  const isInProgress = doc.status === 'analyzing' || doc.status === 'redaction_confirmed'

  return (
    <div className="rounded-xl bg-[#1C1C28] border border-[#2C2C3A] overflow-hidden">

      {/* ── Card header ─────────────────────────────────────────────────── */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">{fileIcon(doc.mime_type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#E8E8EC] truncate">{doc.original_filename}</p>
            <p className="text-xs text-[#8888A0] mt-0.5">
              {docTypeLabel} · {formatDate(doc.uploaded_at)}
              {doc.file_size_bytes ? ` · ${formatBytes(doc.file_size_bytes)}` : ''}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex-shrink-0 text-right">
            {doc.status === 'pii_detected' && (
              <span className="text-xs text-[#D4A039]">🛡️ Review PII</span>
            )}
            {isInProgress && (
              <div className="flex items-center gap-1.5 text-xs text-[#D4A039]">
                <div className="w-3 h-3 border border-[#D4A039] border-t-transparent rounded-full animate-spin" />
                <span>Analyzing</span>
              </div>
            )}
            {doc.status === 'analyzed' && urgencyConfig && (
              <span className={`text-xs ${urgencyConfig.color}`}>{urgencyConfig.label}</span>
            )}
            {doc.status === 'error' && (
              <span className="text-xs text-[#C75050]">Failed</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Privacy Shield review (pii_detected) ────────────────────────── */}
      {doc.status === 'pii_detected' && showRedactionPreview && doc.extracted_text && (
        <div className="px-4 pb-4 border-t border-[#2C2C3A] pt-4">
          <RedactionPreview
            documentId={doc.id}
            extractedText={doc.extracted_text}
            detections={doc.pii_detections ?? []}
            onComplete={() => {
              setShowRedactionPreview(false)
              onRefresh()
            }}
            onCancel={() => setShowRedactionPreview(false)}
          />
        </div>
      )}

      {/* Show review button if user closed the preview */}
      {doc.status === 'pii_detected' && !showRedactionPreview && (
        <div className="px-4 pb-4 border-t border-[#2C2C3A] pt-3">
          <button
            onClick={() => setShowRedactionPreview(true)}
            className="text-xs text-[#D4A039] hover:text-[#E8C56A] underline"
          >
            🛡️ Review Privacy Shield ({doc.pii_detections?.length ?? 0} items detected)
          </button>
        </div>
      )}

      {/* ── Analyzed: summary + details ─────────────────────────────────── */}
      {doc.status === 'analyzed' && doc.ai_summary && (
        <>
          {urgencyConfig && urgency !== 'low' && (
            <div className={`px-4 py-2 ${urgencyConfig.bg} border-t ${urgencyConfig.border}`}>
              <p className={`text-xs font-medium ${urgencyConfig.color}`}>
                {urgency === 'high' ? '⚠️ Action required' : '📋 Review recommended'}
              </p>
            </div>
          )}

          <div className="px-4 pb-3 border-t border-[#2C2C3A]">
            <p className="text-xs text-[#C0C0D0] leading-relaxed mt-3">{doc.ai_summary}</p>

            {(doc.ai_flags?.concerns?.length || doc.ai_flags?.deadlines?.length || doc.ai_flags?.recommended_action) && (
              <button onClick={() => setExpanded((v) => !v)} className="mt-2 text-xs text-[#8888A0] hover:text-[#0D7377] underline">
                {expanded ? 'Show less' : 'Show details'}
              </button>
            )}

            {expanded && (
              <div className="mt-3 space-y-3">
                {doc.ai_flags?.concerns && doc.ai_flags.concerns.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8888A0] mb-1">Key points</p>
                    <ul className="space-y-1">
                      {doc.ai_flags.concerns.map((c, i) => (
                        <li key={i} className="text-xs text-[#C0C0D0] flex gap-1.5">
                          <span className="text-[#0D7377] flex-shrink-0">·</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {doc.ai_flags?.deadlines && doc.ai_flags.deadlines.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#8888A0] mb-1">Deadlines</p>
                    <ul className="space-y-1">
                      {doc.ai_flags.deadlines.map((d, i) => (
                        <li key={i} className="text-xs text-[#D4A039] flex gap-1.5">
                          <span className="flex-shrink-0">⏱</span>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {doc.ai_flags?.recommended_action && (
                  <div className="p-3 rounded-lg bg-[#121218] border border-[#2C2C3A]">
                    <p className="text-[10px] uppercase tracking-widest text-[#8888A0] mb-1">Suggested action</p>
                    <p className="text-xs text-[#E8E8EC] leading-relaxed">{doc.ai_flags.recommended_action}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Error state ─────────────────────────────────────────────────── */}
      {doc.status === 'error' && (
        <div className="px-4 pb-4 border-t border-[#2C2C3A] pt-3">
          <p className="text-xs text-[#8888A0] mb-2">Analysis failed. The file is saved — tap to retry.</p>
          {onRetryAnalysis && (
            <button onClick={() => onRetryAnalysis(doc.id)} disabled={retrying} className="text-xs text-[#0D7377] hover:text-[#11999E] underline disabled:opacity-50">
              {retrying ? 'Retrying...' : 'Retry analysis'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
