import Link from 'next/link'
import { redirect } from 'next/navigation'
import ReportTable, { ReportColumn } from '../../../components/business/ReportTable'
import { formatMonth, trimNumber } from '../../../components/business/display'
import PageHeader from '../../../components/PageHeader'
import { getProjectionInput } from '../../../lib/api/business'
import { getCurrentUser } from '../../../lib/api/session'
import { project } from '../../../lib/business/projection'
import { formatMoney } from '../../../lib/format'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

const COLUMNS: ReportColumn[] = [
  { name: 'MonthStart', label: 'UI_MONTH', kind: 'month' },
  { name: 'Capital', label: 'UI_CAPITAL', kind: 'money' },
  { name: 'Portfolio', label: 'UI_PORTFOLIO', kind: 'money' },
  { name: 'UtilizationPct', label: 'UI_UTILIZATION', kind: 'percent' },
  { name: 'InterestIncome', label: 'UI_GROSS_PROFIT', kind: 'money' },
  { name: 'IncomePct', label: 'UI_INCOME_PCT', kind: 'percent' },
  { name: 'OwnerSalary', label: 'UI_OWNER_SALARY', kind: 'money' },
  { name: 'AgentSalary', label: 'UI_AGENT_SALARY', kind: 'money' },
  { name: 'Overhead', label: 'UI_OVERHEAD', kind: 'money' },
  { name: 'OtherCost', label: 'UI_OTHER_COSTS', kind: 'money' },
  { name: 'BankInterest', label: 'UI_BANK_INTEREST', kind: 'money' },
  { name: 'InvestorInterest', label: 'UI_INVESTOR_INTEREST', kind: 'money' },
  { name: 'TotalCosts', label: 'UI_TOTAL_COSTS', kind: 'money' },
  { name: 'NetProfit', label: 'UI_NET_PROFIT', kind: 'money', strong: true },
  { name: 'BankPrincipal', label: 'UI_BANK_PRINCIPAL_PAID', kind: 'money' },
  { name: 'InvestorPrincipal', label: 'UI_INVESTOR_PRINCIPAL_REPAID', kind: 'money' },
  { name: 'NetCashFlow', label: 'UI_NET_CASH_FLOW', kind: 'money', strong: true },
  { name: 'Reserves', label: 'UI_ALL_FUNDS', kind: 'money' },
  { name: 'BankDebt', label: 'UI_BANK_DEBT_LEFT', kind: 'money' },
  { name: 'InvestorDebt', label: 'UI_INVESTOR_DEBT', kind: 'money' },
]

export default async function ProjectionPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const result = project(await getProjectionInput())
  const a = result?.assumptions
  const assumptions: [string, string][] = a ? [
    ['UI_PROJ_START', formatMonth(a.startMonth)],
    ['UI_PROJ_MONTHS', String(a.monthsAhead)],
    ['UI_PROJ_UTILIZATION', `${trimNumber(a.utilizationPct)}%`],
    ['UI_PROJ_INTEREST', `${trimNumber(a.interestPct)}% ${t(a.interestFromHistory ? 'UI_PROJ_FROM_HISTORY' : 'UI_PROJ_FROM_SETTING')}`],
    ['UI_PROJ_COMMISSION', `${trimNumber(a.commissionPct)}%`],
    ['UI_PROJ_AGENT_FIXED', formatMoney(a.agentFixed)],
    ['UI_OWNER_SALARY', formatMoney(a.ownerSalary)],
    ['UI_OVERHEAD', formatMoney(a.overhead)],
    ['UI_OTHER_COSTS', formatMoney(a.other)],
    ['UI_PROJ_EMERGENCY', formatMoney(a.emergencyMonthly)],
    ['UI_PROJ_BANK_LOANS', String(a.openBankLoans)],
    ['UI_PROJ_INVESTOR_CONTRACTS', String(a.openContracts)],
  ] : []

  return (
    <>
      <Link href="/business" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_BUSINESS')}
      </Link>
      <PageHeader title={t('UI_PROJECTION')} description={t('UI_PROJECTION_DESCRIPTION')} />

      {a && (
        <section className="mb-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">{t('UI_PROJ_ASSUMPTIONS')}</h2>
          <dl className="grid gap-x-8 gap-y-3 text-base sm:grid-cols-2 xl:grid-cols-3">
            {assumptions.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-body">{t(label)}</dt>
                <dd className="text-right font-medium tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">{t('UI_PROJ_NOTE_2')}</p>
          <Link href="/business/setting" className="mt-3 inline-block text-base font-medium text-accent-strong hover:underline">
            {t('UI_PROJ_CHANGE_SETTINGS')}
          </Link>
        </section>
      )}

      <ReportTable columns={COLUMNS} rows={result?.rows ?? []} keyOf={row => row.MonthStart ?? ''} />
    </>
  )
}
