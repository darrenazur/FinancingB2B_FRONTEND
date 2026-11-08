import Link from 'next/link'
import { redirect } from 'next/navigation'
import RefreshButton from '../../../components/actions/RefreshButton'
import MonthPicker from '../../../components/business/MonthPicker'
import Statement, { StatementLine } from '../../../components/business/Statement'
import { formatMonth } from '../../../components/business/display'
import PageHeader from '../../../components/PageHeader'
import { getStatementBanks, getStatements, ReportRow } from '../../../lib/api/business'
import { getCurrentUser } from '../../../lib/api/session'
import { formatMoney } from '../../../lib/format'
import { can } from '../../../lib/permissions'
import { t } from '../../../lib/captions/t'

const isZero = (value = '') => /^-?0*(\.0*)?$/.test(value)

// A bank loan's short name, like "BPI 50K".
const bankName = (row: ReportRow) =>
  `${row.BankName ?? ''} ${new Intl.NumberFormat('en', { notation: 'compact' }).format(Number(row.LoanAmount ?? 0))}`.trim()

// A line that only shows when it has an amount.
const optional = (label: string, value?: string): StatementLine[] => (isZero(value) ? [] : [{ label: t(label), value }])

export default async function StatementsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const { month } = await searchParams
  const [statements, banks] = await Promise.all([getStatements(), getStatementBanks()])
  const row = statements.find(s => s.MonthStart?.slice(0, 7) === month) ?? statements[0]

  const header = (
    <>
      <Link href="/business" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
        {t('UI_BUSINESS')}
      </Link>
      <PageHeader title={t('UI_FINANCIAL_STATEMENTS')} description={t('UI_FINANCIAL_STATEMENTS_DESCRIPTION')} />
    </>
  )
  if (!row) {
    return (
      <>
        {header}
        <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_NO_RECORDS_YET')}</p>
      </>
    )
  }

  const monthBanks = banks.filter(b => b.MonthStart === row.MonthStart)
  const forMonth = formatMonth(row.MonthStart ?? '')
  const atMonthEnd = t('UI_AS_OF', { date: forMonth })

  const income: StatementLine[] = [
    { label: t('UI_REVENUE'), kind: 'heading' },
    { label: t('UI_INTEREST_INCOME'), value: row.InterestIncome },
    { label: t('UI_LATE_FEES'), value: row.LateFeeIncome },
    ...optional('UI_RECOVERIES', row.Recoveries),
    ...optional('UI_INVESTOR_LOSS_SHARE', row.InvestorLossShare),
    { label: t('UI_TOTAL_REVENUE'), value: row.TotalRevenue, kind: 'total' },
    { label: t('UI_EXPENSES'), kind: 'heading' },
    ...monthBanks.flatMap(b => [
      ...(isZero(b.InterestCost) ? [] : [{ label: t('UI_STMT_BANK_INTEREST', { bank: bankName(b) }), value: b.InterestCost }]),
      ...(isZero(b.Penalty) ? [] : [{ label: t('UI_STMT_BANK_PENALTY', { bank: bankName(b) }), value: b.Penalty }]),
      ...(isZero(b.Fee) ? [] : [{ label: t('UI_STMT_BANK_FEE', { bank: bankName(b) }), value: b.Fee }]),
    ]),
    { label: t('UI_AGENT_SALARY'), value: row.AgentSalary },
    { label: t('UI_OWNER_SALARY'), value: row.OwnerSalary },
    { label: t('UI_OVERHEAD'), value: row.Overhead },
    ...optional('UI_OTHER_COSTS', row.OtherCost),
    { label: t('UI_LOSSES_DEFAULTS'), value: row.WriteOffs },
    ...optional('UI_INVESTOR_INTEREST', row.InvestorInterest),
    { label: t('UI_TOTAL_EXPENSES'), value: row.TotalExpenses, kind: 'total' },
    { label: t('UI_NET_PROFIT'), value: row.NetProfit, kind: 'grand' },
  ]

  const balance: StatementLine[] = [
    { label: t('UI_ASSETS'), kind: 'heading' },
    { label: t('UI_CASH_ON_HAND'), value: row.Cash },
    { label: t('UI_ACTIVE_LOANS'), value: row.Portfolio },
    { label: t('UI_INTEREST_RECEIVABLE'), value: row.InterestReceivable },
    { label: t('UI_LATE_FEES_RECEIVABLE'), value: row.LateFeesReceivable },
    ...optional('UI_BANK_INTEREST_PREPAID', row.BankInterestPrepaid),
    ...optional('UI_AGENT_PAY_ADVANCE', row.AgentPayAdvance),
    { label: t('UI_EMERGENCY_FUND'), value: row.EmergencyFund },
    { label: t('UI_STMT_OTHER_FUNDS'), value: row.OtherFunds },
    { label: t('UI_TOTAL_ASSETS'), value: row.TotalAssets, kind: 'total' },
    { label: t('UI_LIABILITIES'), kind: 'heading' },
    ...monthBanks.filter(b => !isZero(b.Balance)).map(b => ({ label: t('UI_STMT_BANK_LOAN', { bank: bankName(b) }), value: b.Balance })),
    ...optional('UI_INTEREST_IN_ADVANCE', row.InterestInAdvance),
    ...optional('UI_BANK_INTEREST_ACCRUED', row.BankInterestAccrued),
    ...optional('UI_AGENT_PAY_OWED', row.AgentPayOwed),
    ...optional('UI_INVESTOR_FUNDS', row.InvestorFunds),
    ...optional('UI_INVESTOR_INTEREST_OWED', row.InvestorInterestOwed),
    { label: t('UI_TOTAL_LIABILITIES'), value: row.TotalLiabilities, kind: 'total' },
    { label: t('UI_OWNERS_EQUITY'), kind: 'heading' },
    { label: t('UI_BEGINNING_EQUITY'), value: row.BeginningEquity },
    { label: t('UI_ADDITIONAL_CAPITAL'), value: row.CapitalAdded },
    { label: t('UI_LESS_WITHDRAWALS'), value: row.Withdrawals },
    { label: t('UI_NET_PROFIT'), value: row.NetProfit },
    { label: t('UI_TOTAL_EQUITY'), value: row.EndingEquity, kind: 'total' },
    { label: t('UI_TOTAL_LIABILITIES_EQUITY'), value: row.TotalLiabilitiesAndEquity, kind: 'grand' },
  ]

  const equity: StatementLine[] = [
    { label: t('UI_BEGINNING_EQUITY'), value: row.BeginningEquity },
    { label: t('UI_PLUS_NET_PROFIT'), value: row.NetProfit },
    { label: t('UI_LESS_WITHDRAWALS'), value: row.Withdrawals },
    { label: t('UI_PLUS_ADDITIONAL_CAPITAL'), value: row.CapitalAdded },
    { label: t('UI_ENDING_EQUITY'), value: row.EndingEquity, kind: 'grand' },
  ]

  const cash: StatementLine[] = [
    { label: t('UI_BEGINNING_CASH'), value: row.BeginningCash, kind: 'total' },
    { label: t('UI_INFLOWS'), kind: 'heading' },
    { label: t('UI_CAPITAL_ADDED'), value: row.CashCapitalIn },
    { label: t('UI_BANK_LOANS_RECEIVED'), value: row.CashBankLoanReceived },
    { label: t('UI_PRINCIPAL_COLLECTED'), value: row.CashPrincipalCollected },
    { label: t('UI_INTEREST_COLLECTED'), value: row.CashInterestCollected },
    { label: t('UI_LATE_FEES_COLLECTED'), value: row.CashLateFeesCollected },
    ...optional('UI_TAKEN_FROM_FUNDS', row.CashFundsTakenOut),
    ...optional('UI_INVESTOR_MONEY_IN', row.CashInvestorIn),
    { label: t('UI_TOTAL_INFLOWS'), value: row.CashInflows, kind: 'total' },
    { label: t('UI_OUTFLOWS'), kind: 'heading' },
    { label: t('UI_LOANS_RELEASED'), value: row.CashLoansReleased },
    { label: t('UI_AGENT_SALARY'), value: row.CashAgentPaid },
    { label: t('UI_OWNER_SALARY'), value: row.CashOwnerSalary },
    { label: t('UI_OVERHEAD_AND_OTHER'), value: row.CashOverheadAndOther },
    { label: t('UI_WITHDRAWALS'), value: row.CashWithdrawals },
    { label: t('UI_PUT_INTO_FUNDS'), value: row.CashFundsPutIn },
    { label: t('UI_BANK_PRINCIPAL_PAID'), value: row.CashBankPrincipal },
    { label: t('UI_BANK_INTEREST_PENALTY_PAID'), value: row.CashBankInterest },
    { label: t('UI_BANK_FEE'), value: row.CashBankFee },
    ...optional('UI_INVESTOR_PAYOUT', row.CashInvestorPayout),
    { label: t('UI_TOTAL_OUTFLOWS'), value: row.CashOutflows, kind: 'total' },
    { label: t('UI_ENDING_CASH'), value: row.EndingCash, kind: 'grand' },
  ]

  const warnings = [
    ...(isZero(row.Unbalanced) ? [] : [t('UI_STMT_UNBALANCED', { amount: formatMoney(row.Unbalanced ?? '0') })]),
    ...(isZero(row.CashUnexplained) ? [] : [t('UI_STMT_CASH_UNEXPLAINED', { amount: formatMoney(row.CashUnexplained ?? '0') })]),
  ]

  return (
    <>
      {header}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <MonthPicker months={statements.map(s => s.MonthStart ?? '')} value={row.MonthStart?.slice(0, 7) ?? ''} />
        <RefreshButton />
      </div>

      {warnings.map(text => (
        <p key={text} className="mb-4 rounded-2xl border border-bad-line bg-bad-soft px-5 py-4 text-base text-bad">{text}</p>
      ))}

      <div className="grid gap-5 xl:grid-cols-3">
        <Statement title={t('UI_INCOME_STATEMENT')} subtitle={`${forMonth} · ${t('UI_ACCRUAL_METHOD')}`} lines={income} />
        <Statement title={t('UI_BALANCE_SHEET')} subtitle={atMonthEnd} lines={balance} />
        <div className="grid content-start gap-5">
          <Statement title={t('UI_EQUITY_ROLL_FORWARD')} subtitle={forMonth} lines={equity} />
          <Statement title={t('UI_CASH_FLOW_STATEMENT')} subtitle={forMonth} lines={cash} />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{t('UI_STMT_NOTE')}</p>
    </>
  )
}
