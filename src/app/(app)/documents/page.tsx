import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DocumentList } from '@/components/documents/document-list'
import type { DocumentRecord } from '@/components/documents/document-card'

export const metadata: Metadata = { title: 'Documents' }

export default async function DocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: documents } = await supabase
    .from('documents')
    .select(
      'id, original_filename, file_size_bytes, mime_type, document_type, extracted_text, ai_summary, ai_flags, ai_analyzed_at, status, redaction_status, pii_detections, uploaded_at'
    )
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  const docs = (documents ?? []) as DocumentRecord[]

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Vault</p>
      <h1 className="font-display text-4xl text-aura-text mb-2">Documents</h1>
      <p className="text-aura-text-secondary text-sm leading-relaxed mb-6 max-w-md">
        Upload contracts, letters, and financial documents. Aura scans for personal
        information first — you control what gets masked before any AI analysis.
      </p>

      <DocumentList initialDocuments={docs} />

      <p className="mt-8 text-[10px] text-[#4A4A60] leading-relaxed">
        Aura is not a lawyer or licensed financial advisor. Document summaries are for
        informational purposes only. For legal advice, consult a professional.
      </p>
    </div>
  )
}
