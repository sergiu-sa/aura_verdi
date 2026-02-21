import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BankConnectionSection } from '@/components/settings/bank-connection-section'

export const metadata: Metadata = { title: 'Settings' }

interface Props {
  searchParams: Promise<{
    bank_connected?: string
    bank_error?: string
    connection_id?: string
  }>
}

export default async function SettingsPage({ searchParams }: Props) {
  // 1. Verify user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 2. Resolve searchParams (Next.js 15+ requires awaiting this)
  const params = await searchParams
  const justConnected = params.bank_connected === 'true'
  const callbackError = params.bank_error ?? null
  const newConnectionId = params.connection_id ?? null

  // 3. Fetch existing bank connections for this user
  const { data: connections } = await supabase
    .from('bank_connections')
    .select('id, bank_name, bank_id, status, last_synced_at, consent_expires_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Page header */}
      <p className="text-section-header mb-2">Preferences</p>
      <h1 className="font-display text-4xl text-aura-text mb-8">Settings</h1>

      {/* ── Bank Connection Section (Step 6) ─────────────────────────── */}
      <BankConnectionSection
        initialConnections={connections ?? []}
        justConnected={justConnected}
        callbackError={callbackError}
        newConnectionId={newConnectionId}
      />

      {/* ── Coming soon sections ──────────────────────────────────────── */}
      <section className="mb-10 opacity-40">
        <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-1">
          Partner
        </p>
        <h2 className="font-display text-2xl text-[#E8E8EC] mb-2">
          Shared Economy
        </h2>
        <p className="text-[#8888A0] text-sm">
          Invite your partner to share a combined financial overview. Coming in Step 9.
        </p>
      </section>

      <section className="mb-10 opacity-40">
        <p className="text-xs uppercase tracking-widest text-[#8888A0] mb-1">
          Data
        </p>
        <h2 className="font-display text-2xl text-[#E8E8EC] mb-2">
          Privacy & Export
        </h2>
        <p className="text-[#8888A0] text-sm">
          Export or delete all your data. Coming in Step 10.
        </p>
      </section>
    </div>
  )
}
