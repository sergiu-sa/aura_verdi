'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GLOBAL_ERROR]', error.message)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#121218]">
      <div className="max-w-md w-full text-center">
        <h1 className="font-display text-3xl text-[#E8E8EC] mb-3">
          Something went wrong
        </h1>
        <p className="text-[#8888A0] text-sm mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-[#0D7377] text-white text-sm font-medium hover:bg-[#11999E] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg border border-[#2C2C3A] text-[#8888A0] text-sm hover:text-[#E8E8EC] transition-colors"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  )
}
