import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BankConnectionSection } from '@/components/settings/bank-connection-section'
import { PartnerSection } from '@/components/settings/partner-section'

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

      {/* ── Partner Section (Step 10) ─────────────────────────────────── */}
      <PartnerSection userId={user.id} />
    </div>
  )
}
