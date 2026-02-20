/**
 * App layout — wraps all authenticated pages.
 * Contains the sidebar + main content area.
 * Full sidebar is built in Step 4 (App Shell).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-aura-background">
      {/* Sidebar placeholder — replaced in Step 4 */}
      <aside className="hidden md:flex w-60 flex-col border-r border-aura-border bg-aura-surface p-4 shrink-0">
        {/* Logo */}
        <div className="mb-8 px-2">
          <span className="font-display text-2xl text-aura-primary">Aura</span>
        </div>
        {/* Nav placeholder */}
        <nav className="flex flex-col gap-1">
          {['Dashboard', 'Chat', 'Documents', 'Legal', 'Settings'].map((item) => (
            <div
              key={item}
              className="px-3 py-2 rounded-md text-sm text-aura-text-secondary hover:text-aura-text hover:bg-white/5 cursor-pointer transition-colors"
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
