'use client'

/**
 * DocumentList
 *
 * Client component managing the documents page state.
 * Handles upload dialog, retry analysis, and page refresh after changes.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DocumentCard, type DocumentRecord } from './document-card'
import { UploadDialog } from './upload-dialog'

interface Props {
  initialDocuments: DocumentRecord[]
}

export function DocumentList({ initialDocuments }: Props) {
  const router = useRouter()
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

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
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-[#8888A0]">
          {initialDocuments.length} document{initialDocuments.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={() => setShowUploadDialog(true)}
          size="sm"
          className="bg-[#0D7377] hover:bg-[#11999E] text-white text-xs"
        >
          + Upload
        </Button>
      </div>

      <div className="space-y-3">
        {initialDocuments.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            onRefresh={refresh}
            onRetryAnalysis={handleRetryAnalysis}
            retrying={retryingId === doc.id}
          />
        ))}
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
