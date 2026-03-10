'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[APP_ERROR]', error.message)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-display text-3xl text-aura-text mb-3">
          Something went wrong
        </h1>
        <p className="text-aura-text-secondary text-sm mb-6">
          We couldn&apos;t load this page. This is usually temporary.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-aura-primary text-white text-sm font-medium hover:bg-aura-primary-light transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg border border-aura-border text-aura-text-secondary text-sm hover:text-aura-text transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
