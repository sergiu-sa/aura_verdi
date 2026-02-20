import type { Metadata } from 'next'
import { DM_Serif_Display, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// ── Typography ─────────────────────────────────────────────────────────────
// Display font: DM Serif Display — elegant, characterful for large numbers/headings
const dmSerifDisplay = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

// Body font: Geist — Vercel's clean, modern sans-serif; excellent for UI
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Mono font: Geist Mono — for financial numbers and amounts
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// ── Metadata ───────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'Aura — Your Financial Guardian',
    template: '%s — Aura',
  },
  description:
    'Aura is your personal AI financial guardian. Track spending, understand your rights, and stay in control of your money — built for Norway.',
  keywords: ['personal finance', 'Norway', 'budgeting', 'AI', 'financial guardian'],
  // Prevent search engines from indexing (private personal finance app)
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // 'dark' class applied by default — dark mode is Aura's primary design
    <html
      lang="en"
      className={`dark ${dmSerifDisplay.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-aura-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
