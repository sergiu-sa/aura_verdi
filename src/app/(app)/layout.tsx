import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { MobileNav } from '@/components/layout/mobile-nav'

/**
 * App layout — Server Component.
 *
 * Responsibilities:
 * 1. Verify the user is authenticated (double-check beyond middleware)
 * 2. Fetch the user's profile (display name for nav)
 * 3. Compose the shell: sidebar (desktop) + top nav + mobile nav
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // Auth check — middleware handles the redirect, but we verify server-side too
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'User'
  const email = user.email ?? ''

  return (
    <div className="flex min-h-screen bg-aura-background">

      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar userDisplayName={displayName} userEmail={email} userId={user.id} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar — hidden on desktop */}
        <TopNav userDisplayName={displayName} userId={user.id} />

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {/* pb-20 on mobile = space above the fixed bottom nav */}
          {children}
        </main>

      </div>

      {/* Mobile bottom tab navigation — fixed, hidden on desktop */}
      <MobileNav />

    </div>
  )
}
