import Link from 'next/link'
import { redirect } from 'next/navigation'
import RefreshButton from '../../../components/actions/RefreshButton'
import ReportTable, { ReportColumn } from '../../../components/business/ReportTable'
import PageHeader from '../../../components/PageHeader'
import { getAgentMonthly, getConcentration, getMonthlyReport, getStatements } from '../../../lib/api/business'
import { getCurrentUser } from '../../../lib/api/session'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

const MONTHLY: ReportColumn[] = [
  { name: 'MonthStart', label: 'UI_MONTH', kind: 'month' },
  { name: 'Capital', label: 'UI_CAPITAL', kind: 'money' },
  { name: 'Portfolio', label: 'UI_PORTFOLIO', kind: 'money' },
  { name: 'UtilizationPct', label: 'UI_UTILIZATION', kind: 'percent' },
  { name: 'InterestIncome', label: 'UI_GROSS_PROFIT', kind: 'money' },
  { name: 'InterestEarned', label: 'UI_INTEREST_EARNED', kind: 'money' },
  { name: 'CollectionRatePct', label: 'UI_COLLECTION_RATE', kind: 'percent' },
  { name: 'IncomePct', label: 'UI_INCOME_PCT', kind: 'percent' },
  { name: 'PenaltyIncome', label: 'UI_LATE_FEES', kind: 'money' },
  { name: 'OwnerSalary', label: 'UI_OWNER_SALARY', kind: 'money' },
  { name: 'AgentSalary', label: 'UI_AGENT_SALARY', kind: 'money' },
  { name: 'Overhead', label: 'UI_OVERHEAD', kind: 'money' },
  { name: 'OtherCost', label: 'UI_OTHER_COSTS', kind: 'money' },
  { name: 'BankInterest', label: 'UI_BANK_INTEREST', kind: 'money' },
  { name: 'BankPenalty', label: 'UI_BANK_PENALTY', kind: 'money' },
  { name: 'BankFee', label: 'UI_BANK_FEE', kind: 'money' },
  { name: 'InvestorInterest', label: 'UI_INVESTOR_INTEREST', kind: 'money' },
  { name: 'TotalCosts', label: 'UI_TOTAL_COSTS', kind: 'money' },
  { name: 'NetProfit', label: 'UI_NET_PROFIT', kind: 'money', strong: true },
  { name: 'BankPrincipal', label: 'UI_BANK_PRINCIPAL_PAID', kind: 'money' },
  { name: 'InvestorPrincipal', label: 'UI_INVESTOR_PRINCIPAL_REPAID', kind: 'money' },
  { name: 'NetCashFlow', label: 'UI_NET_CASH_FLOW', kind: 'money', strong: true },
  { name: 'EmergencyFund', label: 'UI_EMERGENCY_FUND', kind: 'money' },
  { name: 'Reserves', label: 'UI_ALL_FUNDS', kind: 'money' },
  { name: 'OwnCapital', label: 'UI_OWN_CAPITAL', kind: 'money' },
  { name: 'RetainedProfit', label: 'UI_RETAINED_PROFIT', kind: 'money' },
  { name: 'BankDebt', label: 'UI_BANK_DEBT_LEFT', kind: 'money' },
  { name: 'InvestorDebt', label: 'UI_INVESTOR_DEBT', kind: 'money' },
]

const AGENTS: ReportColumn[] = [
  { name: 'MonthStart', label: 'UI_MONTH', kind: 'month' },
  { name: 'Name', label: 'UI_AGENT', kind: 'text' },
  { name: 'InterestCollected', label: 'UI_INTEREST_COLLECTED', kind: 'money' },
  { name: 'CommissionPct', label: 'UI_COMMISSION_PCT', kind: 'percent' },
  { name: 'Commission', label: 'UI_COMMISSION', kind: 'money' },
  { name: 'FixedMonthly', label: 'UI_FIXED_MONTHLY', kind: 'money' },
  { name: 'PayDue', label: 'UI_PAY_DUE', kind: 'money', strong: true },
  { name: 'PaidAmt', label: 'UI_PAY_RECORDED', kind: 'money' },
]

const BY_PURPOSE: ReportColumn[] = [
  { name: 'GroupName', label: 'UI_PURPOSE_OF_LOAN', kind: 'text' },
  { name: 'ActiveLoans', label: 'UI_ACTIVE_LOANS_COUNT', kind: 'text' },
  { name: 'OutstandingPrincipal', label: 'UI_OUTSTANDING_PRINCIPAL', kind: 'money', strong: true },
  { name: 'SharePct', label: 'UI_SHARE', kind: 'percent' },
]

const BY_INCOME: ReportColumn[] = [
  { name: 'GroupName', label: 'UI_SOURCE_OF_INCOME', kind: 'text' },
  { name: 'ItemName', label: 'UI_INCOME_TYPE', kind: 'text' },
  { name: 'ActiveLoans', label: 'UI_ACTIVE_LOANS_COUNT', kind: 'text' },
  { name: 'OutstandingPrincipal', label: 'UI_OUTSTANDING_PRINCIPAL', kind: 'money', strong: true },
  { name: 'SharePct', label: 'UI_SHARE', kind: 'percent' },
]

// Each group's part of all outstanding principal, biggest first. A blank group is a loan or partner not filled in yet.
function concentration(rows: Awaited<ReturnType<typeof getConcentration>>, dimension: string) {
  const part = rows.filter(row => row.Dimension === dimension)
  const total = part.reduce((sum, row) => sum + Number(row.OutstandingPrincipal || 0), 0)
  return part
    .sort((a, b) => Number(b.OutstandingPrincipal || 0) - Number(a.OutstandingPrincipal || 0))
    .map(row => ({
      ...row,
      GroupName: row.GroupName || t('UI_NOT_SET'),
      ItemName: row.GroupName ? row.ItemName ?? '' : '',
      SharePct: total > 0 ? (Number(row.OutstandingPrincipal || 0) * 100 / total).toFixed(2) : '0',
    }))
}

export default async function BusinessReportPage() {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const [cashMonths, agents, statements, spread] = await Promise.all([getMonthlyReport(), getAgentMonthly(), getStatements(), getConcentration()])
  // Interest earned (accrual) beside interest collected, from the statements
  const earned = new Map(statements.map(row => [row.MonthStart, row]))
  const months = cashMonths.map(row => ({
    ...row,
    InterestEarned: earned.get(row.MonthStart)?.InterestIncome ?? '',
    CollectionRatePct: earned.get(row.MonthStart)?.CollectionRatePct ?? '',
  }))

  return (
    <>
      <Link href="/business" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_BUSINESS')}
      </Link>
      <PageHeader title={t('UI_MONTHLY_REPORT')} description={t('UI_MONTHLY_REPORT_DESCRIPTION')} />

      <div className="mb-5 flex justify-end"><RefreshButton /></div>
      <ReportTable columns={MONTHLY} rows={months} keyOf={row => row.MonthStart ?? ''} />
      <p className="mt-3 text-sm text-muted">{t('UI_MONTHLY_REPORT_NOTE_3')}</p>

      <section className="mt-10">
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-ink">{t('UI_AGENT_PAY_BY_MONTH')}</h2>
        <p className="mb-4 text-base text-body">{t('UI_AGENT_PAY_BY_MONTH_NOTE_2')}</p>
        <ReportTable columns={AGENTS} rows={agents} keyOf={row => `${row.MonthStart}-${row.AdminUserID}`} />
      </section>

      <section className="mt-10">
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-ink">{t('UI_CONCENTRATION')}</h2>
        <p className="mb-4 text-base text-body">{t('UI_CONCENTRATION_DESCRIPTION')}</p>
        <div className="grid gap-6 xl:grid-cols-2">
          <ReportTable columns={BY_PURPOSE} rows={concentration(spread, 'PURPOSE')} keyOf={row => row.GroupName ?? ''} />
          <ReportTable columns={BY_INCOME} rows={concentration(spread, 'INCOME')} keyOf={row => `${row.GroupName}-${row.ItemName}`} />
        </div>
      </section>
    </>
  )
}
