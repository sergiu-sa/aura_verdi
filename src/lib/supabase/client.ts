import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Used in Client Components ('use client') for auth state and real-time queries.
 *
 * Only uses the public anon key — safe for the browser.
 * Row Level Security enforces data access on the database side.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
