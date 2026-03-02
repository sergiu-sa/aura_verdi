import { formatNOK } from '@/lib/utils/format-currency'

interface PartnerAccount {
  account_name: string
  balance: number
}

interface Props {
  partnerName: string
  accounts: PartnerAccount[]
  partnerTotalBalance: number
  householdTotal: number
}

export function PartnerOverview({
  partnerName,
  accounts,
  partnerTotalBalance,
  householdTotal,
}: Props) {
  return (
    <div className="surface p-6 rounded-xl border border-[#0D7377]/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-section-header">Partner&apos;s shared accounts</p>
        <span className="text-[10px] uppercase tracking-wider text-[#0D7377] bg-[#0D7377]/10 px-2 py-0.5 rounded-full">
          View only
        </span>
      </div>

      <p className="text-[#8888A0] text-sm mb-4">{partnerName}</p>

      {/* Partner total */}
      <p className="font-display text-3xl font-normal tracking-tight leading-none text-aura-text">
        {formatNOK(partnerTotalBalance)}
      </p>
      <p className="text-[#8888A0] text-xs mt-1">
        {accounts.length} shared {accounts.length === 1 ? 'account' : 'accounts'}
      </p>

      {/* Account list */}
      <div className="mt-5 pt-4 border-t border-[#2C2C3A] space-y-1.5">
        {accounts.map((a) => (
          <div key={a.account_name} className="flex justify-between text-xs">
            <span className="text-[#8888A0]">{a.account_name}</span>
            <span className="text-amount text-sm">{formatNOK(Number(a.balance))}</span>
          </div>
        ))}
      </div>

      {/* Household total */}
      <div className="mt-4 pt-4 border-t border-[#2C2C3A]">
        <div className="flex justify-between text-xs">
          <span className="text-[#8888A0]">Household total</span>
          <span className="text-amount text-sm font-medium text-[#4DD9A0]">
            {formatNOK(householdTotal)}
          </span>
        </div>
      </div>
    </div>
  )
}
