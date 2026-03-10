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
import { Plus, Check, Trash2, Download } from 'lucide-react'
import { RedactionPreview } from './redaction-preview'
import { AddExpenseDialog } from './add-expense-dialog'
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
    financial_extract?: {
      amount: number
      currency: string
      due_date: string | null
      payee: string | null
      is_expense: boolean
    } | null
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
  hasLinkedBill?: boolean
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
  high: { color: 'text-aura-danger', bg: 'bg-aura-danger-muted', border: 'border-aura-danger/30', label: 'Urgent' },
  medium: { color: 'text-aura-warning', bg: 'bg-aura-warning-muted', border: 'border-aura-warning/30', label: 'Review needed' },
  low: { color: 'text-aura-safe', bg: 'bg-aura-safe-muted', border: 'border-aura-safe/30', label: 'No action needed' },
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

export function DocumentCard({ doc, onRefresh, onRetryAnalysis, retrying = false, hasLinkedBill = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showRedactionPreview, setShowRedactionPreview] = useState(
    doc.status === 'pii_detected'
  )

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/documents/download?id=${doc.id}`)
      const data = await res.json()
      if (res.ok && data.url) {
        window.open(data.url, '_blank')
      }
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id }),
      })
      if (res.ok) onRefresh()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const urgency = doc.ai_flags?.urgency
  const urgencyConfig = urgency ? URGENCY_CONFIG[urgency] : null
  const docTypeLabel = doc.document_type ? DOC_TYPE_LABELS[doc.document_type] : 'Document'
  const isInProgress = doc.status === 'analyzing' || doc.status === 'redaction_confirmed'

  return (
    <div className="rounded-xl bg-aura-surface border border-aura-border overflow-hidden">

      {/* ── Card header ─────────────────────────────────────────────────── */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">{fileIcon(doc.mime_type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-aura-text truncate">{doc.original_filename}</p>
            <p className="text-xs text-aura-text-secondary mt-0.5">
              {docTypeLabel} · {formatDate(doc.uploaded_at)}
              {doc.file_size_bytes ? ` · ${formatBytes(doc.file_size_bytes)}` : ''}
            </p>
          </div>

          {/* Status badge + delete */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {doc.status === 'pii_detected' && (
              <span className="text-xs text-aura-warning">🛡️ Review PII</span>
            )}
            {isInProgress && (
              <div className="flex items-center gap-1.5 text-xs text-aura-warning">
                <div className="w-3 h-3 border border-aura-warning border-t-transparent rounded-full animate-spin" />
                <span>Analyzing</span>
              </div>
            )}
            {doc.status === 'analyzed' && urgencyConfig && (
              <span className={`text-xs ${urgencyConfig.color}`}>{urgencyConfig.label}</span>
            )}
            {doc.status === 'error' && (
              <span className="text-xs text-aura-danger">Failed</span>
            )}
            {!isInProgress && (
              <>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="text-aura-text-dim hover:text-aura-primary transition-colors p-1 disabled:opacity-50"
                  title="Download original"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-aura-text-dim hover:text-aura-danger transition-colors p-1"
                  title="Delete document"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="px-4 pb-3 flex items-center justify-between gap-3 border-t border-aura-border pt-3">
          <p className="text-xs text-aura-danger">Delete this document permanently?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="text-xs text-aura-text-secondary hover:text-aura-text transition-colors px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-aura-danger hover:text-white bg-aura-danger/20 hover:bg-aura-danger/40 px-3 py-1 rounded transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* ── Privacy Shield review (pii_detected) ────────────────────────── */}
      {doc.status === 'pii_detected' && showRedactionPreview && doc.extracted_text && (
        <div className="px-4 pb-4 border-t border-aura-border pt-4">
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
        <div className="px-4 pb-4 border-t border-aura-border pt-3">
          <button
            onClick={() => setShowRedactionPreview(true)}
            className="text-xs text-aura-warning hover:text-aura-warning underline"
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

          <div className="px-4 pb-3 border-t border-aura-border">
            <p className="text-xs text-aura-text-secondary leading-relaxed mt-3">{doc.ai_summary}</p>

            {(doc.ai_flags?.concerns?.length || doc.ai_flags?.deadlines?.length || doc.ai_flags?.recommended_action) && (
              <button onClick={() => setExpanded((v) => !v)} className="mt-2 text-xs text-aura-text-secondary hover:text-aura-primary underline">
                {expanded ? 'Show less' : 'Show details'}
              </button>
            )}

            {expanded && (
              <div className="mt-3 space-y-3">
                {doc.ai_flags?.concerns && doc.ai_flags.concerns.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-aura-text-secondary mb-1">Key points</p>
                    <ul className="space-y-1">
                      {doc.ai_flags.concerns.map((c, i) => (
                        <li key={i} className="text-xs text-aura-text-secondary flex gap-1.5">
                          <span className="text-aura-primary flex-shrink-0">·</span>{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {doc.ai_flags?.deadlines && doc.ai_flags.deadlines.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-aura-text-secondary mb-1">Deadlines</p>
                    <ul className="space-y-1">
                      {doc.ai_flags.deadlines.map((d, i) => (
                        <li key={i} className="text-xs text-aura-warning flex gap-1.5">
                          <span className="flex-shrink-0">⏱</span>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {doc.ai_flags?.recommended_action && (
                  <div className="p-3 rounded-lg bg-aura-background border border-aura-border">
                    <p className="text-[10px] uppercase tracking-widest text-aura-text-secondary mb-1">Suggested action</p>
                    <p className="text-xs text-aura-text leading-relaxed">{doc.ai_flags.recommended_action}</p>
                  </div>
                )}
              </div>
            )}

            {/* Add as expense — only for documents with extracted financial data */}
            {doc.ai_flags?.financial_extract && (
              <div className="mt-3 pt-3 border-t border-aura-border">
                {hasLinkedBill || justAdded ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-aura-positive">
                    <Check size={14} />
                    Added as expense
                  </span>
                ) : (
                  <button
                    onClick={() => setShowExpenseDialog(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-aura-primary hover:text-aura-primary-light transition-colors"
                  >
                    <Plus size={14} />
                    Add as upcoming expense
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Expense dialog */}
          {showExpenseDialog && (
            <AddExpenseDialog
              doc={doc}
              onClose={() => setShowExpenseDialog(false)}
              onAdded={() => {
                setShowExpenseDialog(false)
                setJustAdded(true)
                onRefresh()
              }}
            />
          )}
        </>
      )}

      {/* ── Error state ─────────────────────────────────────────────────── */}
      {doc.status === 'error' && (
        <div className="px-4 pb-4 border-t border-aura-border pt-3">
          <p className="text-xs text-aura-text-secondary mb-2">Analysis failed. The file is saved — tap to retry.</p>
          {onRetryAnalysis && (
            <button onClick={() => onRetryAnalysis(doc.id)} disabled={retrying} className="text-xs text-aura-primary hover:text-aura-primary-light underline disabled:opacity-50">
              {retrying ? 'Retrying...' : 'Retry analysis'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
