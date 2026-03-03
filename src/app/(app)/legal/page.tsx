import type { Metadata } from 'next'
import { Shield, ExternalLink, AlertTriangle, Scale } from 'lucide-react'
import { LEGAL_REFERENCES, LEGAL_DISCLAIMER } from '@/lib/constants/legal-references'

export const metadata: Metadata = { title: 'Legal Help' }

/**
 * How many months before a reference is considered "stale"
 * and shows a verification warning badge.
 */
const STALE_MONTHS = 12

function isStale(lastVerified: string): boolean {
  const verified = new Date(lastVerified)
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - STALE_MONTHS)
  return verified < cutoff
}

/** Format a date as "15. jan. 2026" (Norwegian short) */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function LegalPage() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Page header */}
      <p className="text-section-header mb-2">Rights &amp; Defense</p>
      <h1 className="font-display text-4xl text-aura-text mb-4">Legal Help</h1>
      <p className="text-aura-text-secondary text-sm leading-relaxed max-w-lg mb-8">
        Understand your rights under Norwegian law. Each reference links to the
        official text on Lovdata. Ask Aura in chat for help applying these to
        your situation.
      </p>

      {/* ── Disclaimer banner ────────────────────────────────────────── */}
      <div className="flex gap-3 rounded-xl bg-[#1C1C28] border border-[#2C2C3A] p-4 mb-8">
        <Shield size={20} className="text-[#F5A623] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#A0A0B8] leading-relaxed">
          {LEGAL_DISCLAIMER}
        </p>
      </div>

      {/* ── Law reference cards ──────────────────────────────────────── */}
      <div className="space-y-4">
        {LEGAL_REFERENCES.map((ref) => {
          const stale = isStale(ref.lastVerified)

          return (
            <div
              key={ref.key}
              className="rounded-xl bg-[#1C1C28] border border-[#2C2C3A] p-5 transition-colors hover:border-[#3C3C4A]"
            >
              {/* Top row: Norwegian name + staleness badge */}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-[#0D7377] flex-shrink-0" />
                  <h3 className="font-display text-lg text-[#E8E8EC]">
                    {ref.nameno}
                  </h3>
                </div>

                {stale && (
                  <span className="flex items-center gap-1 text-[10px] text-[#F5A623] bg-[#F5A623]/10 rounded-full px-2 py-0.5 flex-shrink-0">
                    <AlertTriangle size={10} />
                    Needs verification
                  </span>
                )}
              </div>

              {/* English name */}
              <p className="text-xs text-[#8888A0] mb-3 ml-6">{ref.nameen}</p>

              {/* Relevance description */}
              <p className="text-sm text-[#C0C0D0] leading-relaxed mb-3">
                {ref.relevance}
              </p>

              {/* Footer: verified date + Lovdata link */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8888A0]">
                  Verified {formatDate(ref.lastVerified)}
                </span>
                <a
                  href={ref.lovdataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#0D7377] hover:text-[#10969B] transition-colors"
                >
                  Read on Lovdata
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Privacy & Terms section ──────────────────────────────────── */}
      <div className="mt-12">
        <h2 className="font-display text-2xl text-[#E8E8EC] mb-4">
          Privacy &amp; Terms
        </h2>

        <div className="rounded-xl bg-[#1C1C28] border border-[#2C2C3A] p-5 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-[#E8E8EC] mb-1">
              How Aura handles your data
            </h3>
            <ul className="text-xs text-[#A0A0B8] leading-relaxed space-y-1.5 list-disc list-inside">
              <li>
                All financial data is stored in a Supabase database hosted in the EU (Frankfurt).
                Nothing is stored on servers outside the EU.
              </li>
              <li>
                Bank connections use Neonomics (licensed PSD2 provider). Aura never sees
                your BankID credentials — authentication happens directly with your bank.
              </li>
              <li>
                Uploaded documents pass through a Privacy Shield that detects and redacts
                personal information before any AI analysis. The AI only sees redacted text.
              </li>
              <li>
                Chat messages are sent to Anthropic&apos;s Claude API with a summarized financial
                snapshot — never raw account numbers, personal IDs, or transaction details.
              </li>
              <li>
                You can request deletion of all your data at any time by contacting the developer.
              </li>
            </ul>
          </div>

          <div className="border-t border-[#2C2C3A] pt-4">
            <h3 className="text-sm font-medium text-[#E8E8EC] mb-1">
              Disclaimer
            </h3>
            <p className="text-xs text-[#A0A0B8] leading-relaxed">
              Aura is a personal tool — not a licensed financial advisor, tax consultant, or lawyer.
              AI-generated advice may contain errors. Always verify important financial or legal
              decisions with a qualified professional (advokat, autorisert regnskapsfører, or
              skatterådgiver). Use of this tool is at your own risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
