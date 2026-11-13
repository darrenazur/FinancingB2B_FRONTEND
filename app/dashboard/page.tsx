import Link from 'next/link'
import RefreshButton from '../../components/actions/RefreshButton'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import { getDashboard, getOverdueLoans, getOverview } from '../../lib/api/business'
import { getLoans, getPartners } from '../../lib/api/financing'
import { getCurrentUser } from '../../lib/api/session'
import { can } from '../../lib/permissions'
import { formatDate, formatMoney, formatToday, sumMoney } from '../../lib/format'
import { t } from '../../lib/captions/t'

// Report values arrive as text, and empty when the view has nothing yet.
const money = (value: string | undefined) => formatMoney(value || '0')

export default async function DashboardPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  // Business totals and every late borrower: owner and admins only. The views carry no agent scope.
  const showBusiness = can(permissions, 'business.view')
  const [partners, loans, dashboard, overview, overdueLoans] = await Promise.all([
    can(permissions, 'partner.view') ? getPartners() : [],
    can(permissions, 'loan.view') ? getLoans() : [],
    showBusiness ? getDashboard() : null,
    showBusiness ? getOverview() : null,
    showBusiness ? getOverdueLoans() : [],
  ])
  const overdueTotal = sumMoney(overdueLoans.map(loan => loan.TotalOverdue || '0'))

  const activePartners = partners.filter(partner => !partner.deleted)
  const liveLoans = loans.filter(loan => !loan.deleted)
  const openLoans = liveLoans.filter(loan => !loan.closed)
  const closedCount = liveLoans.length - openLoans.length
  const openPHP = openLoans.filter(loan => loan.currency === 'PHP')
  const otherCurrencyCount = openLoans.length - openPHP.length
  const currencyHint = otherCurrencyCount > 0 ? t('UI_PHP_ONLY_OTHER_CURRENCY_LOANS_NOT_INCLUDED', { otherCurrencyCount }) : undefined
  const nextMaturing = [...openLoans]
    .sort((a, b) => a.maturityDate.localeCompare(b.maturityDate))
    .slice(0, 5)
  const openShare = liveLoans.length > 0 ? Math.round((openLoans.length / liveLoans.length) * 100) : 0

  return (
    <>
      <PageHeader title={t('UI_OVERVIEW')} description={formatToday()} />

      <div className="mb-5 flex flex-wrap gap-3">
        <RefreshButton />
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.6fr_1.6fr]">
        <StatCard
          label={t('UI_ACTIVE_PARTNERS')}
          value={String(activePartners.length)}
          hint={t('UI_DELETED', { count: partners.length - activePartners.length })}
        />
        <StatCard label={t('UI_OPEN_LOANS')} value={String(openLoans.length)} hint={t('UI_CLOSED', { closedCount })} />
        <StatCard
          label={t('UI_PRINCIPAL_OPEN_LOANS')}
          value={formatMoney(sumMoney(openPHP.map(loan => loan.principal)))}
          hint={currencyHint ?? t('UI_AS_LENT_BEFORE_PAYMENTS')}
        />
        <StatCard
          label={t('UI_INTEREST_OPEN_LOANS')}
          value={formatMoney(sumMoney(openPHP.map(loan => loan.interest)))}
          hint={currencyHint ?? t('UI_SCHEDULED_BEFORE_PAYMENTS')}
        />
      </section>

      {showBusiness && (
        <>
          <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('UI_CASH_ON_HAND')}
              value={dashboard?.CashOnHand ? money(dashboard.CashOnHand) : '—'}
              hint={dashboard?.CashOnHand ? t('UI_CASH_REAL_TIME_FROM', { date: formatDate(dashboard.CashOpeningDate) }) : t('UI_NO_OPENING_COUNT')}
            />
            <StatCard
              label={t('UI_OUTSTANDING_BALANCE')}
              value={money(overview?.OutstandingBalance)}
              hint={t('UI_PRINCIPAL_PLUS_INTEREST', { principal: money(overview?.OutstandingPrincipal), interest: money(overview?.OutstandingInterest) })}
            />
            <StatCard
              label={t('UI_PAYMENTS_COLLECTED_THIS_MONTH')}
              value={money(overview?.CollectedThisMonth)}
              hint={t('UI_TODAY_AMOUNT', { amount: money(overview?.CollectedToday) })}
            />
            <StatCard
              label={t('UI_LATE_FEES_RECEIVABLE')}
              value={money(dashboard?.UnpaidLateFees)}
              hint={t('UI_COLLECTED_THIS_MONTH_AMOUNT', { amount: money(overview?.LateFeesCollectedThisMonth) })}
            />
          </section>

          <section className="mt-5 rounded-2xl border border-line bg-surface p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{t('UI_OVERDUE_LOANS')}</h2>
              {overdueLoans.length > 0 && (
                <p className="text-base text-body">
                  {t('UI_TOTAL')}{' '}<span className="font-semibold tabular-nums text-bad">{formatMoney(overdueTotal)}</span>
                </p>
              )}
            </div>

            {overdueLoans.length === 0 ? (
              <p className="py-6 text-base text-muted">{t('UI_NO_OVERDUE_LOANS')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {overdueLoans.map(loan => (
                  <li key={loan.FinancingInformationID}>
                    <Link
                      href={`/loans/${loan.LoanNo}`}
                      className="-mx-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-xl px-3 py-4 hover:bg-elevated"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium text-ink">{loan.PartnerName}</p>
                        <p className="text-sm text-muted">{t('UI_LOAN_DAYS_LATE', { loanNo: loan.LoanNo, days: loan.DaysLate })}</p>
                      </div>
                      <p className="text-lg font-semibold tabular-nums text-bad">{formatMoney(loan.TotalOverdue || '0', loan.CurrencyCd?.trim() || 'PHP')}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-7 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{t('UI_MATURING_NEXT')}</h2>
            <Link href="/loans" className="text-base font-medium text-accent-strong hover:underline">{t('UI_VIEW_ALL')}</Link>
          </div>

          {nextMaturing.length === 0 ? (
            <p className="py-6 text-base text-muted">{t('UI_NO_OPEN_LOANS')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {nextMaturing.map(loan => (
                <li key={loan.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-ink">{loan.partnerName}</p>
                    <p className="text-sm text-muted">{t('UI_DUE')}{' '}{formatDate(loan.maturityDate)}</p>
                  </div>
                  <p className="text-lg font-semibold tabular-nums text-ink">{formatMoney(loan.principal, loan.currency)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-line bg-surface p-7">
            <h2 className="text-xl font-semibold tracking-tight text-ink">{t('UI_LOAN_STATUS')}</h2>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-elevated">
              <div className="h-full rounded-full bg-accent" style={{ width: `${openShare}%` }} />
            </div>
            <dl className="mt-4 flex justify-between text-base">
              <div>
                <dt className="text-muted">{t('UI_OPEN')}</dt>
                <dd className="text-lg font-semibold text-ink">{openLoans.length}</dd>
              </div>
              <div className="text-right">
                <dt className="text-muted">{t('UI_CLOSED_2')}</dt>
                <dd className="text-lg font-semibold text-ink">{closedCount}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  )
}
