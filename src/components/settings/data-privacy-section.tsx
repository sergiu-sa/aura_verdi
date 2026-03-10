'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function DataPrivacySection() {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Export failed.')
        return
      }
      // Trigger file download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aura-data-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (deleteInput !== 'DELETE') return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      })
      if (res.ok) {
        // Redirect to login — account is gone
        router.push('/login')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Delete failed.')
      }
    } catch {
      setError('Delete failed. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="mb-10">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-aura-text-secondary mb-1">
          Privacy
        </p>
        <h2 className="font-display text-2xl text-aura-text">
          Data & Privacy
        </h2>
      </div>

      <div className="rounded-xl bg-aura-surface border border-aura-border p-5 space-y-5">
        {/* Export data */}
        <div>
          <p className="text-sm text-aura-text font-medium mb-1">Export your data</p>
          <p className="text-xs text-aura-text-secondary mb-3">
            Download all your Aura data as a JSON file — profile, accounts, transactions, bills, documents, and chat history.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Download my data'}
          </Button>
        </div>

        {/* Delete account */}
        <div className="pt-5 border-t border-aura-border">
          <p className="text-sm text-aura-danger font-medium mb-1">Delete account</p>
          <p className="text-xs text-aura-text-secondary mb-3">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!confirmDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete my account
            </Button>
          ) : (
            <div className="p-4 rounded-lg bg-aura-danger-muted border border-aura-danger/30">
              <p className="text-xs text-aura-danger font-medium mb-3">
                Type DELETE to confirm permanent account deletion:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="flex-1 px-3 py-1.5 rounded-md text-sm bg-aura-input border border-aura-border text-aura-text placeholder:text-aura-text-dim focus:outline-none focus:border-aura-danger"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteInput !== 'DELETE' || deleting}
                >
                  {deleting ? 'Deleting...' : 'Confirm'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setConfirmDelete(false); setDeleteInput('') }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-aura-danger">{error}</p>
        )}
      </div>
    </section>
  )
}
