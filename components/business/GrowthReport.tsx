'use client'

import { useState } from 'react'
import type { ReportRow } from '../../lib/api/business'
import { t } from '../../lib/captions/t'
import { formatMoney, manilaToday } from '../../lib/format'
import { INPUT } from '../forms/FormDialog'
import { formatMonth, trimNumber } from './display'

// stock: a balance at month end (portfolio). flow: money in the month (profit), so the current month also gets a pace.
// rate: a percentage, compared in points. better: which way is good, for the colour.
interface Metric {
  name: string
  label: string
  kind: 'stock' | 'flow' | 'rate'
  better: 'up' | 'down'
  card?: boolean
}

const METRICS: Metric[] = [
  { name: 'Portfolio', label: 'UI_PORTFOLIO', kind: 'stock', better: 'up', card: true },
  { name: 'InterestIncome', label: 'UI_GROSS_PROFIT', kind: 'flow', better: 'up', card: true },
  { name: 'NetProfit', label: 'UI_NET_PROFIT', kind: 'flow', better: 'up', card: true },
  { name: 'CollectionRatePct', label: 'UI_COLLECTION_RATE', kind: 'rate', better: 'up', card: true },
  { name: 'NetCashFlow', label: 'UI_NET_CASH_FLOW', kind: 'flow', better: 'up', card: true },
  { name: 'InterestEarned', label: 'UI_INTEREST_EARNED', kind: 'flow', better: 'up' },
  { name: 'PenaltyIncome', label: 'UI_LATE_FEES', kind: 'flow', better: 'up' },
  { name: 'OtherIncome', label: 'UI_OTHER_INCOME', kind: 'flow', better: 'up' },
  { name: 'ProcessingFees', label: 'UI_PROCESSING_FEES', kind: 'flow', better: 'up' },
  { name: 'TotalCosts', label: 'UI_TOTAL_COSTS', kind: 'flow', better: 'down' },
  { name: 'IncomePct', label: 'UI_INCOME_PCT', kind: 'rate', better: 'up' },
  { name: 'UtilizationPct', label: 'UI_UTILIZATION', kind: 'rate', better: 'up' },
  { name: 'Capital', label: 'UI_CAPITAL', kind: 'stock', better: 'up' },
  { name: 'Reserves', label: 'UI_ALL_FUNDS', kind: 'stock', better: 'up' },
  { name: 'BankDebt', label: 'UI_BANK_DEBT_LEFT', kind: 'stock', better: 'down' },
]

const SHOWN_MONTHS = 6
const AVG_MONTHS = 3
const num = (value: string | undefined) => Number(value || 0)
const show = (metric: Metric, value: number) => metric.kind === 'rate' ? `${trimNumber(value.toFixed(2))}%` : formatMoney(value.toFixed(2))

// What a month is compared with: the month a set number of months before it, or the average of the months before it
type Basis = { kind: 'month'; distance: number } | { kind: 'avg' }

interface Change {
  text: string
  tone: 'good' | 'bad' | 'neutral'
}

// Money: (now - before) / |before| x 100. Rates: the difference in points. Nothing to compare when before is 0.
function changeOf(metric: Metric, now: number, before: number): Change | null {
  const diff = now - before
  if (metric.kind !== 'rate' && before === 0) return null
  const amount = metric.kind === 'rate' ? Math.round(diff * 10) / 10 : Math.round((diff / Math.abs(before)) * 100)
  if (amount === 0) return { text: metric.kind === 'rate' ? t('UI_PTS', { value: 0 }) : '0%', tone: 'neutral' }
  const arrow = amount > 0 ? '▲' : '▼'
  const size = Math.abs(amount)
  const good = (amount > 0) === (metric.better === 'up')
  return { text: `${arrow} ${metric.kind === 'rate' ? t('UI_PTS', { value: size }) : `${size}%`}`, tone: good ? 'good' : 'bad' }
}

const TONE = { good: 'text-good', bad: 'text-bad', neutral: 'text-muted' }

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${28 - ((value - min) / span) * 24}`).join(' ')
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-24 text-accent" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}

// How each number moved, from the monthly report rows. The owner picks the month to look at and what to compare it with.
// The current month's money is so far; its pace (so far / days passed x days in the month) is what gets compared.
export default function GrowthReport({ rows }: { rows: ReportRow[] }) {
  const months = [...rows].sort((a, b) => (a.MonthStart ?? '').localeCompare(b.MonthStart ?? ''))
  const last = months.length - 1
  const [target, setTarget] = useState(last)
  const [basis, setBasis] = useState<Basis>({ kind: 'month', distance: 1 })
  if (months.length === 0) return null

  const today = manilaToday()
  const current = today.slice(0, 7)
  const [year, month] = current.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const daysPassed = Number(today.slice(8, 10))
  const isCurrent = (row: ReportRow) => (row.MonthStart ?? '').slice(0, 7) === current
  const monthLabel = (row: ReportRow) => formatMonth(row.MonthStart ?? '')

  // A month's value as compared: the pace for money in the current month, the month's value otherwise
  const compared = (metric: Metric, row: ReportRow) => {
    const value = num(row[metric.name])
    return metric.kind === 'flow' && isCurrent(row) ? (value / daysPassed) * daysInMonth : value
  }
  // The months the month at index is compared with (one month, or up to AVG_MONTHS for the average)
  const baseRows = (index: number): ReportRow[] =>
    basis.kind === 'month'
      ? index - basis.distance >= 0 ? [months[index - basis.distance]] : []
      : months.slice(Math.max(0, index - AVG_MONTHS), index)
  const baseValue = (metric: Metric, index: number): number | null => {
    const base = baseRows(index)
    return base.length === 0 ? null : base.reduce((sum, row) => sum + compared(metric, row), 0) / base.length
  }
  const baseLabel = (index: number) => {
    const base = baseRows(index)
    return basis.kind === 'month' ? (base[0] ? monthLabel(base[0]) : '') : t('UI_AVG_OF_N', { count: base.length })
  }
  const changeAt = (metric: Metric, index: number): Change | null => {
    const before = baseValue(metric, index)
    return before === null ? null : changeOf(metric, compared(metric, months[index]), before)
  }

  const pickTarget = (index: number) => {
    setTarget(index)
    // Keep the comparison if it still fits; otherwise fall back to the month before
    if (basis.kind === 'month' && index - basis.distance < 0) setBasis({ kind: 'month', distance: 1 })
  }
  const basisValue = basis.kind === 'avg' ? 'avg' : String(basis.distance)
  const pickBasis = (value: string) => setBasis(value === 'avg' ? { kind: 'avg' } : { kind: 'month', distance: Number(value) })
  const quick: { value: string; label: string }[] = [
    { value: '1', label: 'UI_VS_PREVIOUS_MONTH' },
    { value: '3', label: 'UI_VS_THREE_MONTHS' },
    { value: 'avg', label: 'UI_VS_AVG_THREE' },
  ]

  const shownStart = Math.max(0, target - SHOWN_MONTHS + 1)
  const shown = months.slice(shownStart, target + 1)
  const targetRow = months[target]

  return (
    <section className="mb-12 flex flex-col gap-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-ink">{t('UI_GROWTH')}</h2>
        <p className="text-base text-body">{t('UI_GROWTH_DESCRIPTION')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <label className="flex items-center gap-2 text-sm text-body">
          {t('UI_COMPARE')}
          <select value={target} onChange={event => pickTarget(Number(event.target.value))} className={`${INPUT} w-auto`}>
            {months.map((row, index) => (
              <option key={row.MonthStart} value={index}>{monthLabel(row)}{isCurrent(row) ? ` (${t('UI_SO_FAR')})` : ''}</option>
            )).reverse()}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-body">
          {t('UI_WITH')}
          <select value={basisValue} onChange={event => pickBasis(event.target.value)} className={`${INPUT} w-auto`} disabled={target === 0}>
            {months.slice(0, target).map((row, index) => (
              <option key={row.MonthStart} value={target - index}>{monthLabel(row)}</option>
            )).reverse()}
            {target > 0 && <option value="avg">{t('UI_AVG_OPTION', { count: Math.min(AVG_MONTHS, target) })}</option>}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <span className="text-sm text-muted">{t('UI_QUICK')}</span>
          {quick.map(option => {
            const fits = option.value === 'avg' ? target > 0 : target - Number(option.value) >= 0
            return (
              <button
                key={option.value}
                type="button"
                disabled={!fits}
                onClick={() => pickBasis(option.value)}
                aria-pressed={basisValue === option.value}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${basisValue === option.value ? 'bg-accent text-white' : 'border border-line text-body hover:bg-elevated'}`}
              >
                {t(option.label)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {METRICS.filter(metric => metric.card).map(metric => {
          const change = changeAt(metric, target)
          const before = baseValue(metric, target)
          const paced = metric.kind === 'flow' && isCurrent(targetRow)
          return (
            <div key={metric.name} className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5">
              <p className="text-sm text-muted">{t(metric.label)} · {monthLabel(targetRow)}</p>
              <p className="text-2xl font-semibold tabular-nums text-ink">{show(metric, num(targetRow[metric.name]))}</p>
              {paced && <p className="text-sm text-muted">{t('UI_SO_FAR_PACE', { amount: show(metric, compared(metric, targetRow)) })}</p>}
              <div className="flex items-end justify-between gap-2">
                <p className="text-sm">
                  {change ? <span className={`font-semibold ${TONE[change.tone]}`}>{change.text}</span> : <span className="text-muted">—</span>}
                  {before !== null && <span className="text-muted">{' '}{t('UI_VS_MONTH', { month: baseLabel(target), value: show(metric, before) })}</span>}
                </p>
                <Sparkline values={shown.map(item => compared(metric, item))} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-base">
          <thead>
            <tr className="text-sm text-muted">
              <th className="sticky left-0 bg-surface px-5 py-4 font-medium">{t('UI_GROWTH')}</th>
              {shown.map(row => (
                <th key={row.MonthStart} className="whitespace-nowrap px-5 py-4 text-right font-medium">
                  {monthLabel(row)}{isCurrent(row) ? ` (${t('UI_SO_FAR')})` : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {METRICS.map(metric => (
              <tr key={metric.name}>
                <td className="sticky left-0 whitespace-nowrap bg-surface px-5 py-3 font-medium text-ink">{t(metric.label)}</td>
                {shown.map((row, offset) => {
                  const change = changeAt(metric, shownStart + offset)
                  const paced = metric.kind === 'flow' && isCurrent(row)
                  return (
                    <td key={row.MonthStart} className="whitespace-nowrap px-5 py-3 text-right tabular-nums">
                      <span className="text-body">{show(metric, num(row[metric.name]))}</span>
                      {paced && <span className="block text-xs text-muted">{t('UI_PACE', { amount: show(metric, compared(metric, row)) })}</span>}
                      <span className={`block text-sm font-semibold ${change ? TONE[change.tone] : 'text-muted'}`}>{change ? change.text : '—'}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">{t('UI_GROWTH_FORMULA')}</p>
    </section>
  )
}
