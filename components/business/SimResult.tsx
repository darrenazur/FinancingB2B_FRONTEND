import { t } from '../../lib/captions/t'
import { compareMoney, formatMoney, sumMoney } from '../../lib/format'
import { formatMonth } from './display'
import ReportTable, { type ReportColumn } from './ReportTable'

type Row = Record<string, string>
const ZERO = BigInt(0)

const COLUMNS: ReportColumn[] = [
  { name: 'MonthStart', label: 'UI_MONTH', kind: 'month' },
  { name: 'MoneyIn', label: 'UI_SIM_MONEY_IN', kind: 'money' },
  { name: 'FundsOut', label: 'UI_SIM_FUNDS_OUT', kind: 'money' },
  { name: 'Capital', label: 'UI_CAPITAL', kind: 'money' },
  { name: 'Reserves', label: 'UI_ALL_FUNDS', kind: 'money' },
  { name: 'Portfolio', label: 'UI_PORTFOLIO', kind: 'money' },
  { name: 'InterestIncome', label: 'UI_GROSS_PROFIT', kind: 'money' },
  { name: 'IncomePct', label: 'UI_INCOME_PCT', kind: 'percent' },
  { name: 'Releases', label: 'UI_SIM_RELEASES', kind: 'money' },
  { name: 'ProcessingFees', label: 'UI_PROCESSING_FEES', kind: 'money' },
  { name: 'MissedCollection', label: 'UI_SIM_MISSED', kind: 'money' },
  { name: 'LateCollected', label: 'UI_SIM_LATE', kind: 'money' },
  { name: 'RiskLoss', label: 'UI_SIM_LOSS', kind: 'money' },
  { name: 'LossPct', label: 'UI_SIM_LOSS_PCT', kind: 'percent' },
  { name: 'BankFees', label: 'UI_SIM_BANK_FEES', kind: 'money' },
  { name: 'OwnerSalary', label: 'UI_OWNER_SALARY', kind: 'money' },
  { name: 'AgentSalary', label: 'UI_AGENT_SALARY', kind: 'money' },
  { name: 'TotalCosts', label: 'UI_TOTAL_COSTS', kind: 'money' },
  { name: 'NetProfit', label: 'UI_NET_PROFIT', kind: 'money', strong: true },
  { name: 'NetCashFlow', label: 'UI_NET_CASH_FLOW', kind: 'money', strong: true },
  { name: 'QuotaStatus', label: 'UI_PROJ_QUOTA_STATUS', kind: 'text' },
  { name: 'BankDebt', label: 'UI_BANK_DEBT_LEFT', kind: 'money' },
  { name: 'InvestorDebt', label: 'UI_INVESTOR_DEBT', kind: 'money' },
]

// Money text as saved, or 0 when a value is missing (an older snapshot without that column)
const amount = (value: string | undefined) => (value && /^-?\d+(\.\d+)?$/.test(value) ? value : '0')

// The numbers compared: capital at the end = the last month's capital + its net profit - principal paid back
function summary(rows: Row[]) {
  const last = rows[rows.length - 1]
  const lowest = rows.reduce<Row | undefined>((low, row) => (!low || compareMoney(amount(row.NetCashFlow), amount(low.NetCashFlow)) < 0 ? row : low), undefined)
  return {
    portfolio: sumMoney([amount(last?.Portfolio)]),
    capital: last ? sumMoney([amount(last.Capital), amount(last.NetProfit)]) - sumMoney([amount(last.BankPrincipal), amount(last.InvestorPrincipal)]) : ZERO,
    profit: sumMoney(rows.map(row => amount(row.NetProfit))),
    lowest: sumMoney([amount(lowest?.NetCashFlow)]),
    lowestMonth: lowest?.MonthStart ?? '',
    short: rows.filter(row => row.QuotaStatus === 'SHORT').length,
    debt: sumMoney([amount(last?.BankDebt), amount(last?.InvestorDebt)]),
  }
}

// Base vs simulated, then the simulated months. The same on the Simulation page and on a saved snapshot.
export default function SimResult({ base, simulated }: { base: Row[]; simulated: Row[] }) {
  const before = summary(base)
  const after = summary(simulated)
  const money = (value: bigint) => formatMoney(value)
  // A change shows its sign: + more, - less
  const delta = (value: bigint) => (value > ZERO ? `+${formatMoney(value)}` : formatMoney(value))
  const lines: [string, string, string, string][] = [
    ['UI_SIM_END_PORTFOLIO', money(before.portfolio), money(after.portfolio), delta(after.portfolio - before.portfolio)],
    ['UI_SIM_END_CAPITAL', money(before.capital), money(after.capital), delta(after.capital - before.capital)],
    ['UI_SIM_TOTAL_NET_PROFIT', money(before.profit), money(after.profit), delta(after.profit - before.profit)],
    [
      'UI_SIM_LOWEST_CASH',
      t('UI_SIM_LOWEST_CASH_VALUE', { amount: money(before.lowest), month: before.lowestMonth ? formatMonth(before.lowestMonth) : '' }),
      t('UI_SIM_LOWEST_CASH_VALUE', { amount: money(after.lowest), month: after.lowestMonth ? formatMonth(after.lowestMonth) : '' }),
      delta(after.lowest - before.lowest),
    ],
    ['UI_SIM_SHORT_MONTHS', String(before.short), String(after.short), `${after.short > before.short ? '+' : ''}${after.short - before.short}`],
    ['UI_SIM_END_DEBT', money(before.debt), money(after.debt), delta(after.debt - before.debt)],
  ]
  const rows = simulated.map(row => ({ ...row, QuotaStatus: row.QuotaStatus ? t(`UI_PROJ_QUOTA_IS_${row.QuotaStatus}`) : '' }))

  return (
    <>
      <section className="mb-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">{t('UI_SIM_RESULT')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="text-sm text-muted">
                <th className="px-3 py-2 font-medium" />
                <th className="px-3 py-2 text-right font-medium">{t('UI_SIM_BASE')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('UI_SIM_SIMULATED')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('UI_SIM_CHANGE')}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(([label, was, now, diff]) => (
                <tr key={label} className="border-t border-line">
                  <td className="px-3 py-3 text-body">{t(label)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-ink">{was}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-ink">{now}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-body">{diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">{t('UI_SIM_NOTE')}</p>
      </section>

      <h2 className="mb-4 text-lg font-semibold text-ink">{t('UI_SIM_MONTHLY')}</h2>
      <ReportTable columns={COLUMNS} rows={rows} keyOf={row => row.MonthStart ?? ''} />
    </>
  )
}
