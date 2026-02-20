import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
}

/**
 * Register page — placeholder until Step 3 (Auth).
 */
export default function RegisterPage() {
  return (
    <div className="surface p-8 text-center">
      <h1 className="font-display text-3xl text-aura-text mb-2">Create your account</h1>
      <p className="text-aura-text-secondary text-sm">
        Registration form — coming in Step 3
      </p>
    </div>
  )
}
