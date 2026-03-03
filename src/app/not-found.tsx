import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#121218]">
      <div className="max-w-md w-full text-center">
        <p className="text-[#0D7377] text-sm font-mono mb-2">404</p>
        <h1 className="font-display text-3xl text-[#E8E8EC] mb-3">
          Page not found
        </h1>
        <p className="text-[#8888A0] text-sm mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-lg bg-[#0D7377] text-white text-sm font-medium hover:bg-[#11999E] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
