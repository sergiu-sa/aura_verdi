'use client'

/**
 * DocumentList
 *
 * Client component managing the documents page state.
 * Handles upload dialog, retry analysis, search/filter, and page refresh after changes.
 */

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentCard, type DocumentRecord } from './document-card'
import { UploadDialog } from './upload-dialog'

interface Props {
  initialDocuments: DocumentRecord[]
  linkedDocIds?: string[]
}

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: 'Invoice',
  contract: 'Contract',
  letter: 'Letter',
  inkasso: 'Inkasso',
  tax: 'Tax',
  insurance: 'Insurance',
  bank: 'Bank',
  other: 'Other',
}

export function DocumentList({ initialDocuments, linkedDocIds = [] }: Props) {
  const linkedDocSet = new Set(linkedDocIds)
  const router = useRouter()
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Search and filter state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  function refresh() {
    startTransition(() => router.refresh())
  }

  async function handleRetryAnalysis(documentId: string) {
    setRetryingId(documentId)
    try {
      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })
      if (res.ok) refresh()
    } finally {
      setRetryingId(null)
    }
  }

  // Get unique document types for filter dropdown
  const documentTypes = useMemo(() => {
    const types = new Set(initialDocuments.map((d) => d.document_type).filter(Boolean))
    return Array.from(types).sort()
  }, [initialDocuments])

  // Filter documents
  const filteredDocs = useMemo(() => {
    let docs = initialDocuments

    if (typeFilter !== 'all') {
      docs = docs.filter((d) => d.document_type === typeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      docs = docs.filter((d) =>
        d.original_filename.toLowerCase().includes(q) ||
        (d.ai_summary && d.ai_summary.toLowerCase().includes(q)) ||
        (d.document_type && d.document_type.toLowerCase().includes(q))
      )
    }

    return docs
  }, [initialDocuments, search, typeFilter])

  // ── Empty state ────────────────────────────────────────────────────────────
  if (initialDocuments.length === 0) {
    return (
      <div>
        <div className="p-8 rounded-xl bg-[#1C1C28] border border-[#2C2C3A] border-dashed text-center mb-6">
          <p className="text-3xl mb-3">🛡️</p>
          <p className="text-[#E8E8EC] text-sm font-medium mb-2">No documents yet</p>
          <p className="text-[#8888A0] text-xs leading-relaxed max-w-xs mx-auto mb-5">
            Upload contracts, letters, invoices, or tax documents. Aura scans for
            personal information first — you review what gets masked before any AI analysis.
          </p>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-[#0D7377] hover:bg-[#11999E] text-white text-sm"
          >
            Upload your first document
          </Button>
        </div>

        {showUploadDialog && (
          <UploadDialog
            onSuccess={() => { setShowUploadDialog(false); refresh() }}
            onCancel={() => setShowUploadDialog(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Toolbar — search, filter, upload */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55556A]" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1C1C28] border border-[#2C2C3A] rounded-lg pl-9 pr-3 py-2 text-xs text-[#E8E8EC] placeholder:text-[#55556A] focus:outline-none focus:border-[#0D7377] transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {documentTypes.length > 1 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#1C1C28] border border-[#2C2C3A] rounded-lg px-3 py-2 text-xs text-[#E8E8EC] focus:outline-none focus:border-[#0D7377] transition-colors"
            >
              <option value="all">All types</option>
              {documentTypes.map((type) => (
                <option key={type} value={type ?? ''}>
                  {DOC_TYPE_LABELS[type ?? ''] ?? type}
                </option>
              ))}
            </select>
          )}
          <Button
            onClick={() => setShowUploadDialog(true)}
            size="sm"
            className="bg-[#0D7377] hover:bg-[#11999E] text-white text-xs"
          >
            + Upload
          </Button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-[#8888A0] mb-3">
        {filteredDocs.length === initialDocuments.length
          ? `${initialDocuments.length} document${initialDocuments.length !== 1 ? 's' : ''}`
          : `${filteredDocs.length} of ${initialDocuments.length} documents`}
      </p>

      {/* Document list */}
      {filteredDocs.length === 0 ? (
        <p className="text-sm text-[#8888A0] text-center py-8">
          No documents match your search.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onRefresh={refresh}
              onRetryAnalysis={handleRetryAnalysis}
              retrying={retryingId === doc.id}
              hasLinkedBill={linkedDocSet.has(doc.id)}
            />
          ))}
        </div>
      )}

      {showUploadDialog && (
        <UploadDialog
          onSuccess={() => { setShowUploadDialog(false); refresh() }}
          onCancel={() => setShowUploadDialog(false)}
        />
      )}
    </div>
  )
}
