import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
}

/**
 * Login page — placeholder until Step 3 (Auth).
 * Replaced with full form in Step 3.
 */
export default function LoginPage() {
  return (
    <div className="surface p-8 text-center">
      <h1 className="font-display text-3xl text-aura-text mb-2">Welcome back</h1>
      <p className="text-aura-text-secondary text-sm">
        Sign in form — coming in Step 3
      </p>
    </div>
  )
}
