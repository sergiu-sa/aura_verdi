'use client'

/**
 * BankConnectionSection
 *
 * Client component for the Settings page bank connection UI.
 * Handles:
 *   - Displaying existing bank connections with status + last synced
 *   - Bank picker (inline list of Norwegian banks)
 *   - Calling /api/bank/connect and redirecting user to BankID
 *   - Triggering /api/bank/sync and showing results
 *   - Handling the ?bank_connected=true / ?bank_error=xxx callback params
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { POPULAR_BANKS, NORWEGIAN_BANKS } from '@/lib/constants/norwegian-banks'

// ── Types ────────────────────────────────────────────────────────────────────

interface BankConnection {
  id: string
  bank_name: string
  bank_id: string
  status: 'pending' | 'active' | 'expired' | 'revoked' | 'error'
  last_synced_at: string | null
  consent_expires_at: string | null
  created_at: string
}

interface Props {
  initialConnections: BankConnection[]
  /** If the page loaded with ?bank_connected=true from the callback */
  justConnected?: boolean
  /** If the page loaded with ?bank_error=xxx from the callback */
  callbackError?: string | null
  /** Connection ID from the callback to auto-sync */
  newConnectionId?: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: BankConnection['status']): {
  text: string
  color: string
} {
  switch (status) {
    case 'active':
      return { text: 'Connected', color: 'text-[#2D8B6F]' }
    case 'pending':
      return { text: 'Connecting...', color: 'text-[#D4A039]' }
    case 'expired':
      return { text: 'Expired — re-authentication needed', color: 'text-[#D4A039]' }
    case 'revoked':
      return { text: 'Disconnected', color: 'text-[#8888A0]' }
    case 'error':
      return { text: 'Connection error', color: 'text-[#C75050]' }
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export function BankConnectionSection({
  initialConnections,
  justConnected = false,
  callbackError = null,
  newConnectionId = null,
}: Props) {
  const router = useRouter()

  // ── State ──────────────────────────────────────────────────────────────────
  const [connections] = useState<BankConnection[]>(initialConnections)
  const [showBankPicker, setShowBankPicker] = useState(false)
  const [showAllBanks, setShowAllBanks] = useState(false)
  const [connectingBankId, setConnectingBankId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    callbackError ? 'Bank authentication failed. Please try again.' : null
  )
  const [successMessage, setSuccessMessage] = useState<string | null>(
    justConnected ? 'Bank connected! Syncing your accounts and transactions...' : null
  )

  // ── Auto-sync after successful connection ──────────────────────────────────
  const triggerSync = useCallback(async (connectionId?: string) => {
    setSyncing(true)
    setSyncMessage('Syncing your accounts...')
    try {
      const res = await fetch('/api/bank/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionId ? { connectionId } : {}),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(data.message ?? 'Sync complete.')
        setSuccessMessage(null)
        // Refresh the page to show updated connection status
        router.refresh()
      } else {
        setSyncMessage(data.error ?? 'Sync failed. Please try again.')
      }
    } catch {
      setSyncMessage('Sync failed. Please check your connection and try again.')
    } finally {
      setSyncing(false)
    }
  }, [router])

  // Auto-trigger sync when user just completed BankID authentication
  useEffect(() => {
    if (justConnected) {
      triggerSync(newConnectionId ?? undefined)
      // Clean up the URL params without a page reload
      const url = new URL(window.location.href)
      url.searchParams.delete('bank_connected')
      url.searchParams.delete('connection_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [justConnected, newConnectionId, triggerSync])

  // ── Connect flow ───────────────────────────────────────────────────────────
  async function handleConnectBank(bankId: string) {
    setConnectingBankId(bankId)
    setErrorMessage(null)
    try {
      const res = await fetch('/api/bank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error ?? 'Failed to start bank connection. Please try again.')
        setConnectingBankId(null)
        return
      }
      // Redirect the user to BankID authentication
      window.location.href = data.redirectUrl
    } catch {
      setErrorMessage('Failed to connect to the bank service. Please try again.')
      setConnectingBankId(null)
    }
  }

  // ── Banks to show in picker ────────────────────────────────────────────────
  const banksToShow = showAllBanks ? NORWEGIAN_BANKS : POPULAR_BANKS
  // Don't show banks the user has already connected
  const connectedBankIds = new Set(connections.map((c) => c.bank_id))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-1">
            Banking
          </p>
          <h2 className="font-display text-2xl text-[#E8E8EC]">
            Connected Banks
          </h2>
        </div>
        {connections.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerSync()}
            disabled={syncing}
            className="border-[#2C2C3A] text-[#8888A0] hover:text-[#E8E8EC] hover:border-[#0D7377] text-xs"
          >
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        )}
      </div>

      {/* Status messages */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-[#0D3B2E] border border-[#2D8B6F]/40 text-[#4DD9A0] text-sm">
          {successMessage}
        </div>
      )}
      {syncMessage && (
        <div className="mb-4 p-3 rounded-lg bg-[#1C1C28] border border-[#2C2C3A] text-[#E8E8EC] text-sm">
          {syncMessage}
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-[#3B0D0D] border border-[#C75050]/40 text-[#F08080] text-sm">
          {errorMessage}
        </div>
      )}

      {/* Existing connections */}
      {connections.length > 0 && (
        <div className="space-y-3 mb-6">
          {connections.map((conn) => {
            const { text, color } = statusLabel(conn.status)
            return (
              <div
                key={conn.id}
                className="flex items-start justify-between p-4 rounded-xl bg-[#1C1C28] border border-[#2C2C3A]"
              >
                <div>
                  <p className="text-[#E8E8EC] font-medium text-sm">
                    {conn.bank_name}
                  </p>
                  <p className={`text-xs mt-0.5 ${color}`}>{text}</p>
                  <p className="text-xs text-[#8888A0] mt-1">
                    Last synced: {formatDate(conn.last_synced_at)}
                  </p>
                  {conn.consent_expires_at && (
                    <p className="text-xs text-[#8888A0]">
                      Consent expires: {formatDate(conn.consent_expires_at)}
                    </p>
                  )}
                </div>
                {conn.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => triggerSync(conn.id)}
                    disabled={syncing}
                    className="text-xs text-[#8888A0] hover:text-[#0D7377]"
                  >
                    Sync
                  </Button>
                )}
                {conn.status === 'expired' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleConnectBank(conn.bank_id)}
                    disabled={!!connectingBankId}
                    className="text-xs text-[#D4A039] hover:text-[#E8E8EC]"
                  >
                    Re-connect
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {connections.length === 0 && !showBankPicker && (
        <div className="p-6 rounded-xl bg-[#1C1C28] border border-[#2C2C3A] border-dashed text-center mb-6">
          <p className="text-[#8888A0] text-sm leading-relaxed mb-4">
            Connect your Norwegian bank account to let Aura see your balance,
            transactions, and upcoming bills.
          </p>
          <p className="text-[#8888A0] text-xs mb-4">
            You&apos;ll be redirected to your bank&apos;s BankID login — we never see your
            bank password. Read-only access only.
          </p>
        </div>
      )}

      {/* "Add bank" button */}
      {!showBankPicker && (
        <Button
          onClick={() => {
            setShowBankPicker(true)
            setErrorMessage(null)
          }}
          className="bg-[#0D7377] hover:bg-[#11999E] text-white text-sm"
        >
          + Connect bank account
        </Button>
      )}

      {/* Bank picker */}
      {showBankPicker && (
        <div className="mt-4 p-4 rounded-xl bg-[#1C1C28] border border-[#2C2C3A]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#E8E8EC] text-sm font-medium">Select your bank</p>
            <button
              onClick={() => {
                setShowBankPicker(false)
                setShowAllBanks(false)
                setConnectingBankId(null)
              }}
              className="text-[#8888A0] hover:text-[#E8E8EC] text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-2">
            {banksToShow.map((bank) => {
              const isConnected = connectedBankIds.has(bank.id)
              const isConnecting = connectingBankId === bank.id
              return (
                <button
                  key={bank.id}
                  onClick={() => !isConnected && !isConnecting && handleConnectBank(bank.id)}
                  disabled={isConnected || !!connectingBankId}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg text-left
                    border transition-colors
                    ${isConnected
                      ? 'border-[#2C2C3A] bg-[#121218] opacity-50 cursor-not-allowed'
                      : isConnecting
                        ? 'border-[#0D7377] bg-[#0D7377]/10 cursor-wait'
                        : 'border-[#2C2C3A] hover:border-[#0D7377] hover:bg-[#0D7377]/5 cursor-pointer'
                    }
                  `}
                >
                  <span className="text-sm text-[#E8E8EC]">{bank.name}</span>
                  <span className="text-xs text-[#8888A0]">
                    {isConnected ? 'Already connected' : isConnecting ? 'Connecting...' : 'Connect →'}
                  </span>
                </button>
              )
            })}
          </div>

          {!showAllBanks && (
            <button
              onClick={() => setShowAllBanks(true)}
              className="mt-3 text-xs text-[#8888A0] hover:text-[#0D7377] underline"
            >
              Show all supported banks
            </button>
          )}

          <p className="mt-4 text-xs text-[#8888A0] leading-relaxed">
            You&apos;ll be redirected to your bank&apos;s BankID authentication. Aura gets
            read-only access — we can never move money. Consent is valid for up to
            180 days.
          </p>
        </div>
      )}
    </section>
  )
}
