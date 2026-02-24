'use client'

/**
 * PartnerSection
 *
 * Manages the full partner linking lifecycle in Settings.
 * Renders one of 4 states based on the current partner status:
 *
 *   none     — invite form (email input)
 *   sent     — waiting for partner to accept (can cancel)
 *   received — incoming invite (accept / decline)
 *   linked   — account sharing toggles + unlink button
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'

type PartnerState = 'none' | 'sent' | 'received' | 'linked'

interface SharingRecord {
  id: string
  user_id: string
  partner_id: string
  accepted: boolean
}

interface Account {
  id: string
  account_name: string
  account_type: string | null
  currency: string
  balance?: number
  is_shared_with_partner?: boolean
}

interface StatusData {
  state: PartnerState
  sharing?: SharingRecord
  partnerId?: string
  partnerName?: string
}

interface Props {
  userId: string
}

export function PartnerSection({ userId }: Props) {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  // For invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  // For account sharing (linked state)
  const [myAccounts, setMyAccounts] = useState<Account[]>([])
  const [partnerAccounts, setPartnerAccounts] = useState<Account[]>([])
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // For action feedback
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/partner/status')
      const data = await res.json()
      setStatus(data)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/partner/accounts')
    const data = await res.json()
    if (data.myAccounts) setMyAccounts(data.myAccounts)
    if (data.partnerAccounts) setPartnerAccounts(data.partnerAccounts)
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (status?.state === 'linked') {
      fetchAccounts()
    }
  }, [status?.state, fetchAccounts])

  // ── Invite ──────────────────────────────────────────────────────────────
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviting(true)
    try {
      const res = await fetch('/api/partner/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerEmail: inviteEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.error)
        return
      }
      setInviteEmail('')
      await fetchStatus()
    } finally {
      setInviting(false)
    }
  }

  // ── Accept ──────────────────────────────────────────────────────────────
  async function handleAccept() {
    if (!status?.sharing?.id) return
    setActionError(null)
    setActionLoading(true)
    try {
      const res = await fetch('/api/partner/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharingId: status.sharing.id }),
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error); return }
      await fetchStatus()
    } finally {
      setActionLoading(false)
    }
  }

  // ── Decline / Cancel / Unlink (all call unlink) ─────────────────────────
  async function handleUnlink() {
    setActionError(null)
    setActionLoading(true)
    try {
      const res = await fetch('/api/partner/unlink', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error); return }
      setMyAccounts([])
      setPartnerAccounts([])
      await fetchStatus()
    } finally {
      setActionLoading(false)
    }
  }

  // ── Toggle account sharing ───────────────────────────────────────────────
  async function handleToggleAccount(accountId: string, shared: boolean) {
    setTogglingId(accountId)
    try {
      await fetch('/api/partner/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, shared }),
      })
      setMyAccounts((prev) =>
        prev.map((a) => (a.id === accountId ? { ...a, is_shared_with_partner: shared } : a))
      )
    } finally {
      setTogglingId(null)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="mb-10">
      <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-1">Partner</p>
      <h2 className="font-display text-2xl text-[#E8E8EC] mb-4">Shared Economy</h2>

      {loading ? (
        <div className="p-6 rounded-xl bg-[#1C1C28] border border-[#2C2C3A]">
          <p className="text-sm text-[#8888A0]">Loading…</p>
        </div>
      ) : status?.state === 'none' ? (
        <StateNone
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteError={inviteError}
          inviting={inviting}
          onSubmit={handleInvite}
        />
      ) : status?.state === 'sent' ? (
        <StateSent
          partnerName={status.partnerName}
          actionLoading={actionLoading}
          actionError={actionError}
          onCancel={handleUnlink}
        />
      ) : status?.state === 'received' ? (
        <StateReceived
          partnerName={status.partnerName}
          actionLoading={actionLoading}
          actionError={actionError}
          onAccept={handleAccept}
          onDecline={handleUnlink}
        />
      ) : (
        <StateLinked
          partnerName={status?.partnerName}
          myAccounts={myAccounts}
          partnerAccounts={partnerAccounts}
          togglingId={togglingId}
          actionLoading={actionLoading}
          actionError={actionError}
          onToggle={handleToggleAccount}
          onUnlink={handleUnlink}
        />
      )}
    </section>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StateNone({
  inviteEmail, setInviteEmail, inviteError, inviting, onSubmit
}: {
  inviteEmail: string
  setInviteEmail: (v: string) => void
  inviteError: string | null
  inviting: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="p-6 rounded-xl bg-[#1C1C28] border border-[#2C2C3A]">
      <p className="text-sm text-[#8888A0] leading-relaxed mb-5">
        Link accounts with your partner to get a combined financial overview.
        Both of you need an Aura account. You choose which accounts to share — everything
        else stays private.
      </p>
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Partner's email address"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          required
          className="flex-1 bg-[#121218] border-[#2C2C3A] text-[#E8E8EC] placeholder:text-[#4A4A60]"
        />
        <Button
          type="submit"
          disabled={inviting || !inviteEmail}
          className="bg-[#0D7377] hover:bg-[#11999E] text-white shrink-0"
        >
          {inviting ? 'Sending…' : 'Send invite'}
        </Button>
      </form>
      {inviteError && (
        <p className="mt-3 text-sm text-[#C75050]">{inviteError}</p>
      )}
    </div>
  )
}

function StateSent({
  partnerName, actionLoading, actionError, onCancel
}: {
  partnerName?: string
  actionLoading: boolean
  actionError: string | null
  onCancel: () => void
}) {
  return (
    <div className="p-6 rounded-xl bg-[#1C1C28] border border-[#2C2C3A]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#E8E8EC] mb-1">
            Invite sent to {partnerName}
          </p>
          <p className="text-sm text-[#8888A0]">
            Waiting for them to accept in their Aura Settings.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={actionLoading}
          className="text-[#8888A0] hover:text-[#C75050] shrink-0"
        >
          {actionLoading ? 'Cancelling…' : 'Cancel invite'}
        </Button>
      </div>
      {actionError && <p className="mt-3 text-sm text-[#C75050]">{actionError}</p>}
    </div>
  )
}

function StateReceived({
  partnerName, actionLoading, actionError, onAccept, onDecline
}: {
  partnerName?: string
  actionLoading: boolean
  actionError: string | null
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div className="p-6 rounded-xl bg-[#1C1C28] border border-[#0D7377]/40">
      <p className="text-sm font-medium text-[#E8E8EC] mb-1">
        {partnerName} has invited you to link accounts
      </p>
      <p className="text-sm text-[#8888A0] mb-5 leading-relaxed">
        Accepting links your Aura accounts. You both control what you share —
        nothing is visible until you explicitly choose to share it.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={onAccept}
          disabled={actionLoading}
          className="bg-[#0D7377] hover:bg-[#11999E] text-white"
        >
          {actionLoading ? 'Accepting…' : 'Accept'}
        </Button>
        <Button
          variant="ghost"
          onClick={onDecline}
          disabled={actionLoading}
          className="text-[#8888A0] hover:text-[#C75050]"
        >
          Decline
        </Button>
      </div>
      {actionError && <p className="mt-3 text-sm text-[#C75050]">{actionError}</p>}
    </div>
  )
}

function StateLinked({
  partnerName, myAccounts, partnerAccounts, togglingId,
  actionLoading, actionError, onToggle, onUnlink
}: {
  partnerName?: string
  myAccounts: Account[]
  partnerAccounts: Account[]
  togglingId: string | null
  actionLoading: boolean
  actionError: string | null
  onToggle: (id: string, shared: boolean) => void
  onUnlink: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Linked status */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#1C1C28] border border-[#2C2C3A]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#2D8B6F]" />
          <p className="text-sm text-[#E8E8EC]">
            Linked with <span className="font-medium">{partnerName}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnlink}
          disabled={actionLoading}
          className="text-[#8888A0] hover:text-[#C75050] text-xs"
        >
          {actionLoading ? 'Unlinking…' : 'Unlink'}
        </Button>
      </div>

      {actionError && (
        <p className="text-sm text-[#C75050] px-1">{actionError}</p>
      )}

      {/* My accounts — sharing toggles */}
      <div className="p-5 rounded-xl bg-[#1C1C28] border border-[#2C2C3A]">
        <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-3">
          Your accounts — choose what to share
        </p>
        {myAccounts.length === 0 ? (
          <p className="text-sm text-[#8888A0]">No accounts connected yet.</p>
        ) : (
          <div className="space-y-2">
            {myAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm text-[#E8E8EC]">{account.account_name ?? 'Account'}</p>
                  {account.account_type && (
                    <p className="text-xs text-[#8888A0] capitalize">{account.account_type}</p>
                  )}
                </div>
                <button
                  onClick={() => onToggle(account.id, !account.is_shared_with_partner)}
                  disabled={togglingId === account.id}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0',
                    account.is_shared_with_partner ? 'bg-[#0D7377]' : 'bg-[#2C2C3A]',
                    togglingId === account.id && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label={`${account.is_shared_with_partner ? 'Stop sharing' : 'Share'} ${account.account_name}`}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                      account.is_shared_with_partner ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partner's shared accounts — read only */}
      {partnerAccounts.length > 0 && (
        <div className="p-5 rounded-xl bg-[#1C1C28] border border-[#2C2C3A]">
          <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-3">
            {partnerName}&apos;s shared accounts
          </p>
          <div className="space-y-2">
            {partnerAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-[#E8E8EC]">{account.account_name ?? 'Account'}</p>
                  {account.account_type && (
                    <p className="text-xs text-[#8888A0] capitalize">{account.account_type}</p>
                  )}
                </div>
                <span className="text-xs text-[#0D7377]">Shared</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
