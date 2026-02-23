'use client'

/**
 * UploadDialog
 *
 * Handles ONLY the file upload and initial PII detection.
 * After upload succeeds, calls detect-pii to extract text and scan for PII.
 * Then closes — the document card in the list will show the Privacy Shield review.
 *
 * Does NOT trigger analysis — that happens after the user reviews redactions.
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

type UploadState = 'idle' | 'uploading' | 'extracting' | 'done' | 'error'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
}

export function UploadDialog({ onSuccess, onCancel }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function processFile(file: File) {
    setSelectedFile(file)
    setErrorMessage(null)
    setUploadState('uploading')

    // Step 1: Upload the file
    const formData = new FormData()
    formData.append('file', file)

    let documentId: string
    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error ?? 'Upload failed. Please try again.')
        setUploadState('error')
        return
      }
      documentId = data.documentId
    } catch {
      setErrorMessage('Upload failed. Please check your connection and try again.')
      setUploadState('error')
      return
    }

    // Step 2: Extract text and detect PII
    setUploadState('extracting')
    try {
      const res = await fetch('/api/documents/detect-pii', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrorMessage(data.error ?? 'Privacy scan failed. Please try again.')
        setUploadState('error')
        return
      }
    } catch {
      setErrorMessage('Privacy scan failed. Please try again.')
      setUploadState('error')
      return
    }

    setUploadState('done')
    setTimeout(onSuccess, 600)
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) processFile(acceptedFiles[0])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploadState !== 'idle' && uploadState !== 'error',
  })

  const dropzoneError = fileRejections[0]?.errors[0]?.message ?? null

  function resetAndCancel() {
    setUploadState('idle')
    setSelectedFile(null)
    setErrorMessage(null)
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1C1C28] border border-[#2C2C3A] rounded-2xl p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-0.5">Vault</p>
            <h2 className="font-display text-xl text-[#E8E8EC]">Upload document</h2>
          </div>
          <button onClick={resetAndCancel} className="text-[#8888A0] hover:text-[#E8E8EC] text-xl leading-none" aria-label="Close">×</button>
        </div>

        {/* Drop zone */}
        {(uploadState === 'idle' || uploadState === 'error') && (
          <div
            {...getRootProps()}
            className={`
              flex flex-col items-center justify-center min-h-[160px] rounded-xl border-2 border-dashed
              cursor-pointer transition-colors mb-4
              ${isDragActive ? 'border-[#0D7377] bg-[#0D7377]/10' : 'border-[#2C2C3A] hover:border-[#0D7377]/60 hover:bg-[#0D7377]/5'}
            `}
          >
            <input {...getInputProps()} />
            <div className="text-3xl mb-3 select-none">{isDragActive ? '📂' : '📄'}</div>
            <p className="text-sm text-[#E8E8EC] font-medium mb-1">
              {isDragActive ? 'Drop it here' : 'Drop a file or click to browse'}
            </p>
            <p className="text-xs text-[#8888A0] text-center px-4">
              PDF, JPEG, PNG, or HEIC — max 10 MB
            </p>
          </div>
        )}

        {dropzoneError && (
          <p className="text-xs text-[#F08080] mb-3">
            {dropzoneError.includes('too large') ? 'File is too large. Maximum size is 10 MB.' : 'Unsupported file type. Please upload a PDF or image.'}
          </p>
        )}

        {/* Progress */}
        {uploadState === 'uploading' && (
          <div className="flex flex-col items-center justify-center min-h-[120px] gap-3">
            <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#8888A0]">Uploading{selectedFile ? ` "${selectedFile.name}"` : '...'}</p>
          </div>
        )}

        {uploadState === 'extracting' && (
          <div className="flex flex-col items-center justify-center min-h-[120px] gap-3">
            <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-sm text-[#E8E8EC] mb-1">Scanning for personal information...</p>
              <p className="text-xs text-[#8888A0]">Privacy Shield is reviewing the document</p>
            </div>
          </div>
        )}

        {uploadState === 'done' && (
          <div className="flex flex-col items-center justify-center min-h-[120px] gap-2">
            <div className="text-3xl">🛡️</div>
            <p className="text-sm text-[#2D8B6F]">Privacy scan complete</p>
            <p className="text-xs text-[#8888A0]">Review the findings in your document list</p>
          </div>
        )}

        {uploadState === 'error' && errorMessage && (
          <div className="p-3 rounded-lg bg-[#3B0D0D] border border-[#C75050]/40 mb-4">
            <p className="text-sm text-[#F08080]">{errorMessage}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={resetAndCancel} className="text-[#8888A0] hover:text-[#E8E8EC] text-xs">
            {uploadState === 'done' ? 'Close' : 'Cancel'}
          </Button>
          {uploadState === 'error' && (
            <Button size="sm" onClick={() => { setUploadState('idle'); setSelectedFile(null); setErrorMessage(null) }} className="bg-[#0D7377] hover:bg-[#11999E] text-white text-xs">
              Try again
            </Button>
          )}
        </div>

        {(uploadState === 'idle' || uploadState === 'error') && (
          <p className="mt-4 text-[10px] text-[#4A4A60] text-center leading-relaxed">
            Aura scans for personal information before any AI analysis.
            You review and confirm what gets masked.
          </p>
        )}
      </div>
    </div>
  )
}
