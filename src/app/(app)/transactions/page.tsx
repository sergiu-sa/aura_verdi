import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/transactions/transaction-list'

export const metadata: Metadata = { title: 'Transactions' }

interface TransactionRow {
  id: string
  transaction_date: string
  description: string | null
  amount: number
  category: string | null
  counterpart_name: string | null
  is_recurring: boolean
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, transaction_date, description, amount, category, counterpart_name, is_recurring')
    .eq('user_id', user.id)
    .gte('transaction_date', ninetyDaysAgo.toISOString().split('T')[0])
    .order('transaction_date', { ascending: false })

  const txns = (transactions ?? []) as TransactionRow[]

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
      <p className="text-section-header mb-2">Banking</p>
      <h1 className="font-display text-4xl text-aura-text mb-2">Transactions</h1>
      <p className="text-aura-text-secondary text-sm mb-6">
        Last 90 days from your connected bank accounts.
      </p>

      <TransactionList transactions={txns} />
    </div>
  )
}
