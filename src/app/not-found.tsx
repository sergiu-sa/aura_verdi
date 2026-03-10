import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-aura-background">
      <div className="max-w-md w-full text-center">
        <p className="text-aura-primary text-sm font-mono mb-2">404</p>
        <h1 className="font-display text-3xl text-aura-text mb-3">
          Page not found
        </h1>
        <p className="text-aura-text-secondary text-sm mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-lg bg-aura-primary text-white text-sm font-medium hover:bg-aura-primary-light transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
