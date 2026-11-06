import Link from 'next/link'
import RefreshButton from '../../components/actions/RefreshButton'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import { getLoans, getPartners } from '../../lib/api/financing'
import { formatDate, formatMoney, formatToday, sumMoney } from '../../lib/format'

const PLANNED = ['Outstanding balance', 'Payments collected', 'Overdue loans', 'Late fees']

export default async function DashboardPage() {
  const [partners, loans] = await Promise.all([getPartners(), getLoans()])

  const activePartners = partners.filter(partner => !partner.deleted)
  const liveLoans = loans.filter(loan => !loan.deleted)
  const openLoans = liveLoans.filter(loan => !loan.closed)
  const closedCount = liveLoans.length - openLoans.length
  const openPHP = openLoans.filter(loan => loan.currency === 'PHP')
  const otherCurrencyCount = openLoans.length - openPHP.length
  const currencyHint = otherCurrencyCount > 0 ? `PHP only. ${otherCurrencyCount} other-currency loans not included` : undefined
  const nextMaturing = [...openLoans]
    .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate))
    .slice(0, 5)
  const openShare = liveLoans.length > 0 ? Math.round((openLoans.length / liveLoans.length) * 100) : 0

  return (
    <>
      <PageHeader title="Overview" description={formatToday()} />

      <div className="mb-5 flex flex-wrap gap-3">
        <RefreshButton />
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.6fr_1.6fr]">
        <StatCard
          label="Active partners"
          value={String(activePartners.length)}
          hint={`${partners.length - activePartners.length} deleted`}
        />
        <StatCard label="Open loans" value={String(openLoans.length)} hint={`${closedCount} closed`} />
        <StatCard
          label="Principal, open loans"
          value={formatMoney(sumMoney(openPHP.map(loan => loan.principal)))}
          hint={currencyHint ?? 'As lent, before payments'}
        />
        <StatCard
          label="Interest, open loans"
          value={formatMoney(sumMoney(openPHP.map(loan => loan.interest)))}
          hint={currencyHint ?? 'Scheduled, before payments'}
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-7 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-ink">Maturing next</h2>
            <Link href="/loans" className="text-base font-medium text-accent-strong hover:underline">View all</Link>
          </div>

          {nextMaturing.length === 0 ? (
            <p className="py-6 text-base text-muted">No open loans.</p>
          ) : (
            <ul className="divide-y divide-line">
              {nextMaturing.map(loan => (
                <li key={loan.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-ink">{loan.partnerName}</p>
                    <p className="text-sm text-muted">Due {formatDate(loan.maturityDate)}</p>
                  </div>
                  <p className="text-lg font-semibold tabular-nums text-ink">{formatMoney(loan.principal, loan.currency)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line bg-surface p-7">
            <h2 className="text-xl font-semibold tracking-tight text-ink">Loan status</h2>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-elevated">
              <div className="h-full rounded-full bg-accent" style={{ width: `${openShare}%` }} />
            </div>
            <dl className="mt-4 flex justify-between text-base">
              <div>
                <dt className="text-muted">Open</dt>
                <dd className="text-lg font-semibold text-ink">{openLoans.length}</dd>
              </div>
              <div className="text-right">
                <dt className="text-muted">Closed</dt>
                <dd className="text-lg font-semibold text-ink">{closedCount}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-dashed border-[var(--border)] p-7">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Coming next</h2>
            <ul className="mt-3 flex flex-col gap-1.5 text-base text-body">
              {PLANNED.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
