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
        <p className="text-[#8888A0] text-sm mb-6">
          We couldn&apos;t load this page. This is usually temporary.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-[#0D7377] text-white text-sm font-medium hover:bg-[#11999E] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg border border-[#2C2C3A] text-[#8888A0] text-sm hover:text-[#E8E8EC] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
