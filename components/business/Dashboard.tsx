import type { ReportRow } from '../../lib/api/business'
import { compareMoney, formatDate, formatMoney } from '../../lib/format'
import StatusBadge from '../StatusBadge'
import { trimNumber } from './display'
import { t } from '../../lib/captions/t'

type Remark = 'GOOD' | 'OVERUTILIZED' | 'STAGNANT' | 'LOW' | 'HIGH' | 'BELOW_CAPITAL' | 'NO_DATA'

const LABEL: Record<Remark, string> = {
  GOOD: 'UI_REMARK_GOOD',
  OVERUTILIZED: 'UI_REMARK_OVERUTILIZED',
  STAGNANT: 'UI_REMARK_STAGNANT',
  LOW: 'UI_REMARK_LOW',
  HIGH: 'UI_REMARK_HIGH',
  BELOW_CAPITAL: 'UI_REMARK_BELOW_CAPITAL',
  NO_DATA: 'UI_REMARK_NO_DATA',
}
const TONE: Record<Remark, 'good' | 'neutral' | 'bad'> = {
  GOOD: 'good', OVERUTILIZED: 'neutral', NO_DATA: 'neutral',
  STAGNANT: 'bad', LOW: 'bad', HIGH: 'bad', BELOW_CAPITAL: 'bad',
}
// The overall status is the most serious remark, in this order.
const SEVERITY: Remark[] = ['BELOW_CAPITAL', 'HIGH', 'LOW', 'STAGNANT', 'OVERUTILIZED', 'NO_DATA']

const pct = (value: string | undefined) => (value ? `${trimNumber(value)}%` : '—')
const money = (value: string | undefined) => (value ? formatMoney(value) : '—')
const num = (value: string | undefined) => (value ? Number(value) : null)

interface Metric {
  name: string
  source: string
  value: string
  parameter: string
  limit: string
  status: string
  remark: Remark
}

function metrics(d: ReportRow): Metric[] {
  const util = num(d.UtilizationPct)
  const utilRemark: Remark = util === null ? 'NO_DATA' : util > Number(d.MaxUtilizationPct) ? 'OVERUTILIZED' : 'GOOD'
  const fund = num(d.FundPct)
  const growth = num(d.EquityGrowthPct)
  const hasCapital = compareMoney(d.OwnCapital || '0', '0') > 0

  return [
    {
      name: 'UI_TOTAL_ACTIVE_PORTFOLIO', source: 'UI_SRC_PORTFOLIO', value: money(d.Portfolio),
      parameter: pct(d.MaxUtilizationPct), limit: money(d.PortfolioLimit), status: pct(d.UtilizationPct), remark: utilRemark,
    },
    {
      name: 'UI_EMERGENCY_FUND', source: 'UI_SRC_FUNDS', value: money(d.Reserves),
      parameter: pct(d.MinEmergencyPct), limit: money(d.FundTarget), status: pct(d.FundPct),
      remark: fund === null || fund >= Number(d.MinEmergencyPct) ? 'GOOD' : 'LOW',
    },
    {
      name: 'UI_DEFAULT_RATE', source: 'UI_SRC_DEFAULT', value: pct(d.DefaultPct),
      parameter: pct(d.MaxDefaultPct), limit: t('UI_AT_MOST', { value: pct(d.MaxDefaultPct) }), status: pct(d.DefaultPct),
      remark: (num(d.DefaultPct) ?? 0) <= Number(d.MaxDefaultPct) ? 'GOOD' : 'HIGH',
    },
    {
      name: 'UI_UTILIZATION', source: 'UI_SRC_UTILIZATION', value: pct(d.UtilizationPct),
      parameter: pct(d.MaxUtilizationPct), limit: t('UI_AT_MOST', { value: pct(d.MaxUtilizationPct) }), status: pct(d.UtilizationPct), remark: utilRemark,
    },
    {
      name: 'UI_TRUE_NET_EQUITY', source: 'UI_SRC_EQUITY_2', value: money(d.Equity),
      parameter: '', limit: t('UI_MORE_THAN_OWN_CAPITAL'), status: '',
      remark: !hasCapital ? 'NO_DATA' : compareMoney(d.Equity || '0', d.OwnCapital || '0') > 0 ? 'GOOD' : 'BELOW_CAPITAL',
    },
    {
      name: 'UI_TARGET_MINIMUM_EQUITY', source: 'UI_SRC_TARGET_EQUITY_2', value: money(d.Equity),
      parameter: pct(d.TargetEquityPct), limit: money(d.TargetEquity), status: pct(d.EquityGrowthPct),
      remark: growth === null || !hasCapital ? 'NO_DATA' : growth >= Number(d.TargetEquityPct) ? 'GOOD' : 'STAGNANT',
    },
  ]
}

const HEAD = 'whitespace-nowrap px-5 py-4 font-medium'
const CELL = 'whitespace-nowrap px-5 py-4'
const RIGHT = `${CELL} text-right tabular-nums`

export default function Dashboard({ data }: { data: ReportRow | null }) {
  if (!data) return <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_NO_RECORDS_YET')}</p>

  const rows = metrics(data)
  const overall = SEVERITY.find(remark => rows.some(row => row.remark === remark)) ?? 'GOOD'
  const summary: [string, string][] = [
    ['UI_ORIGINAL_CAPITAL', money(data.OwnCapital)],
    ['UI_RETAINED_PROFIT', money(data.RetainedProfit)],
    ['UI_BANK_DEBT_LEFT', money(data.BankDebt)],
    ['UI_INVESTOR_DEBT', money(data.InvestorDebt)],
    ['UI_CAPITAL', money(data.Capital)],
    ['UI_PORTFOLIO', money(data.Portfolio)],
    ['UI_ALL_FUNDS', money(data.Reserves)],
    ['UI_EMERGENCY_FUND_ONLY', money(data.EmergencyFund)],
    ['UI_OTHER_FUNDS', money(data.OtherFunds)],
    ['UI_UNPAID_DEFAULT_DEBT', money(data.OverduePrincipal)],
    ['UI_OVERDUE_INTEREST', money(data.OverdueInterest)],
    ['UI_UNPAID_LATE_FEES', money(data.UnpaidLateFees)],
    ['UI_CASH_ON_HAND', data.CashOnHand ? money(data.CashOnHand) : t('UI_NO_OPENING_COUNT')],
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-lg font-semibold text-ink">{t('UI_OVERALL_STATUS')}</span>
          <StatusBadge label={t(LABEL[overall])} tone={TONE[overall]} />
          <span className="text-sm text-muted">{t('UI_AS_OF', { date: formatDate(data.AsOfDate ?? '') })}</span>
        </div>
        <div className="overflow-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-base">
            <thead className="shadow-[0_1px_0_var(--border)]">
              <tr className="text-sm text-muted">
                <th className={HEAD}>{t('UI_METRIC')}</th>
                <th className={HEAD}>{t('UI_FORMULA')}</th>
                <th className={`${HEAD} text-right`}>{t('UI_CURRENT_VALUE')}</th>
                <th className={`${HEAD} text-right`}>{t('UI_PARAMETER')}</th>
                <th className={`${HEAD} text-right`}>{t('UI_TARGET_LIMIT')}</th>
                <th className={`${HEAD} text-right`}>{t('UI_STATUS')}</th>
                <th className={HEAD}>{t('UI_REMARKS')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(row => (
                <tr key={row.name}>
                  <td className={`${CELL} font-medium text-ink`}>{t(row.name)}</td>
                  <td className={`${CELL} text-sm text-muted`}>{t(row.source)}</td>
                  <td className={RIGHT}>{row.value}</td>
                  <td className={RIGHT}>{row.parameter}</td>
                  <td className={RIGHT}>{row.limit}</td>
                  <td className={RIGHT}>{row.status}</td>
                  <td className={CELL}><StatusBadge label={t(LABEL[row.remark])} tone={TONE[row.remark]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-6">
        <dl className="flex flex-col gap-3 text-base">
          {summary.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-body">{t(label)}</dt>
              <dd className="text-right font-medium tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {data.LastCountDate && (
          <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
            {t('UI_LAST_CASH_COUNT', {
              date: formatDate(data.LastCountDate),
              counted: money(data.LastCountAmount),
              expected: money(data.ExpectedOnLastCount),
              gap: money(data.CashCountGap),
            })}
          </p>
        )}
      </div>
    </div>
  )
}
