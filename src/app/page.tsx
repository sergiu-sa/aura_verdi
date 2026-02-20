import { redirect } from 'next/navigation'

/**
 * Root page — redirect to the dashboard.
 * Middleware handles auth: unauthenticated users get sent to /login instead.
 */
export default function RootPage() {
  redirect('/dashboard')
}
