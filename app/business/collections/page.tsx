import Link from 'next/link'
import { redirect } from 'next/navigation'
import RefreshButton from '../../../components/actions/RefreshButton'
import MonthPicker from '../../../components/business/MonthPicker'
import PaidList from '../../../components/business/PaidList'
import { formatMonth } from '../../../components/business/display'
import PageHeader from '../../../components/PageHeader'
import StatCard from '../../../components/StatCard'
import { getPaidDays, ReportRow } from '../../../lib/api/business'
import { getCurrentUser } from '../../../lib/api/session'
import { formatDate, formatMoney, sumMoney } from '../../../lib/format'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

const total = (rows: ReportRow[]) => formatMoney(sumMoney(rows.map(row => row.AmountPaid || '0')))

// What came in each day of one month, and which loans paid. The month goes in the address as ?month=YYYY-MM.
export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const { month } = await searchParams
  const rows = await getPaidDays()
  const months = [...new Set(rows.map(row => (row.PayDate ?? '').slice(0, 7)))]
  const shown = month && months.includes(month) ? month : months[0] ?? ''
  const monthRows = rows.filter(row => (row.PayDate ?? '').startsWith(shown))

  // Rows are newest day first, so the days keep that order.
  const days = new Map<string, ReportRow[]>()
  for (const row of monthRows) {
    const day = row.PayDate ?? ''
    days.set(day, [...(days.get(day) ?? []), row])
  }

  return (
    <>
      <Link href="/business" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_BUSINESS')}
      </Link>
      <PageHeader title={t('UI_COLLECTIONS')} description={t('UI_COLLECTIONS_DESCRIPTION')} />

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_NO_RECORDS_YET')}</p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <MonthPicker months={months.map(m => `${m}-01`)} value={shown} />
            <RefreshButton />
          </div>

          <section className="mb-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('UI_COLLECTED_IN_MONTH', { month: formatMonth(`${shown}-01`) })}
              value={total(monthRows)}
              hint={t('UI_PAYMENT_DAYS', { count: days.size })}
            />
          </section>

          <div className="flex flex-col gap-3">
            {[...days].map(([day, list], index) => (
              <details key={day} open={index === 0} className="rounded-2xl border border-line bg-surface px-7 py-5">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-x-6 gap-y-1">
                  <span className="text-lg font-semibold text-ink">{formatDate(day)}</span>
                  <span className="text-base text-body">
                    {t('UI_LOANS_PAID', { count: list.length })}{' · '}
                    <span className="font-semibold tabular-nums text-ink">{total(list)}</span>
                  </span>
                </summary>
                <div className="mt-3">
                  <PaidList rows={list} />
                </div>
              </details>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">{t('UI_COLLECTIONS_NOTE')}</p>
        </>
      )}
    </>
  )
}
