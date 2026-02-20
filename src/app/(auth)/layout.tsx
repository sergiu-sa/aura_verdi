/**
 * Auth layout — wraps login and register pages.
 * No sidebar or top nav. Centered, full-screen layout.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-aura-background flex items-center justify-center p-4">
      {/* Subtle radial gradient behind the auth card for depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(13,115,119,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  )
}
