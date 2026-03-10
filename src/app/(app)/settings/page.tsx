import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileSection } from '@/components/settings/profile-section'
import { NotificationSection } from '@/components/settings/notification-section'
import { BankConnectionSection } from '@/components/settings/bank-connection-section'
import { PartnerSection } from '@/components/settings/partner-section'
import { AppearanceSection } from '@/components/settings/appearance-section'
import type { NotificationPreferences } from '@/types/database'

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

  // 3. Fetch profile + bank connections in parallel
  const [profileRes, connectionsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, notification_preferences')
      .eq('id', user.id)
      .single(),
    supabase
      .from('bank_connections')
      .select('id, bank_name, bank_id, status, last_synced_at, consent_expires_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const displayName = profileRes.data?.display_name ?? ''
  const notifPrefs = (profileRes.data?.notification_preferences ?? {}) as NotificationPreferences
  const connections = connectionsRes.data

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Page header */}
      <p className="text-section-header mb-2">Preferences</p>
      <h1 className="font-display text-4xl text-aura-text mb-8">Settings</h1>

      {/* ── Appearance ────────────────────────────────────────────────── */}
      <AppearanceSection />

      {/* ── Profile Section ──────────────────────────────────────────── */}
      <ProfileSection displayName={displayName} email={user.email ?? ''} />

      {/* ── Notification Preferences ──────────────────────────────────── */}
      <NotificationSection preferences={notifPrefs} />

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
