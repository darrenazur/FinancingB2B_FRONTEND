import Link from 'next/link'
import { redirect } from 'next/navigation'
import ConfirmAction from '../../../../../components/actions/ConfirmAction'
import RenameSnapshotButton from '../../../../../components/business/RenameSnapshotButton'
import SimResult from '../../../../../components/business/SimResult'
import { formatMonth, trimNumber } from '../../../../../components/business/display'
import PageHeader from '../../../../../components/PageHeader'
import { getMonthlyReport, getSimSnapshots } from '../../../../../lib/api/business'
import { getCurrentUser } from '../../../../../lib/api/session'
import { parseSnapshot, SECTIONS, type Field } from '../../../../../lib/business/snapshot'
import { formatMoney, manilaToday, sumMoney } from '../../../../../lib/format'
import { can } from '../../../../../lib/permissions'
import { t } from '../../../../../lib/captions/t'
import { deleteSimSnapshot, purgeSimSnapshot } from '../../actions'

type Row = Record<string, string>
const ZERO = BigInt(0)
const SECONDARY = 'rounded-xl border border-line px-5 py-3 text-base font-medium text-body hover:border-accent'
// Delete permanently can't be undone, so it shows in red
const DANGER = 'rounded-xl border border-line px-5 py-3 text-base font-medium text-bad hover:border-bad'
const isAmount = (value: string | undefined): value is string => !!value && /^-?\d+(\.\d+)?$/.test(value)
const money = (value: string | undefined) => (isAmount(value) ? formatMoney(value) : '—')
// actual - plan, with its sign
const gap = (plan: string | undefined, actual: string | undefined) => {
  if (!isAmount(plan) || !isAmount(actual)) return '—'
  const value = sumMoney([actual]) - sumMoney([plan])
  return value > ZERO ? `+${formatMoney(value)}` : formatMoney(value)
}

// How one entered value reads: a month by name, money as pesos, a percentage with %
function show(field: Field, value: string | undefined, who: (id: string) => string): string {
  if (!value) return '—'
  if (field.kind === 'month') return formatMonth(`${value}-01`)
  if (field.kind === 'money') return isAmount(value) ? formatMoney(value) : value
  if (field.kind === 'pct') return `${trimNumber(value)}%`
  if (field.kind === 'who') return who(value)
  return value
}

// Plan vs actual: each month the plan covers that has an actual month in the monthly report
const COMPARED: { name: string; label: string }[] = [
  { name: 'Portfolio', label: 'UI_PORTFOLIO' },
  { name: 'InterestIncome', label: 'UI_GROSS_PROFIT' },
  { name: 'NetProfit', label: 'UI_NET_PROFIT' },
]

// One saved simulation, read-only. The numbers are the ones worked out the day it was saved.
export default async function SnapshotPage({ params }: { params: Promise<{ id: string }> }) {
  const permissions = (await getCurrentUser())?.permissions ?? []
  if (!can(permissions, 'business.view')) redirect('/dashboard')

  const { id } = await params
  const [snapshots, actualMonths] = await Promise.all([getSimSnapshots(), getMonthlyReport()])
  const snapshot = snapshots.map(parseSnapshot).find(item => item.id === id)

  const back = (
    <Link href="/business/simulation/snapshots" className="mb-4 inline-block text-base font-medium text-accent-strong hover:underline">
      {t('UI_SIM_SNAPSHOTS')}
    </Link>
  )
  if (!snapshot) {
    return (
      <>
        {back}
        <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_SIM_SNAPSHOT_NOT_FOUND')}</p>
      </>
    )
  }

  const form = snapshot.inputs?.form
  const result = snapshot.result
  const who = (value: string) => value === 'OWNER' ? t('UI_SIM_OWNER')
    : value.startsWith('NEW-') ? t('UI_SIM_NEW_AGENT', { n: value.slice(4) })
    : snapshot.inputs?.agents?.find(agent => agent.id === value)?.name ?? t('UI_SIM_AGENT_ID', { id: value })

  // The months already in the monthly report; this month is only so far
  const actual = new Map<string, Row>(actualMonths.map(row => [row.MonthStart ?? '', row]))
  const thisMonth = `${manilaToday().slice(0, 7)}-01`
  const compared = (result?.simulated ?? []).filter(row => actual.has(row.MonthStart ?? ''))

  return (
    <>
      {back}
      <PageHeader title={snapshot.name} description={snapshot.notes || t('UI_SIM_SNAPSHOT_READ_ONLY')} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-body">
          {t('UI_SIM_SAVED_BY', { at: snapshot.savedAt, by: snapshot.savedBy })}
          {' · '}
          {t('UI_SIM_BASE_MONTH_VALUE', { month: snapshot.baseMonth ? formatMonth(snapshot.baseMonth) : '—' })}
        </p>
        <div className="flex flex-wrap gap-3">
          {form && (
            <Link href={`/business/simulation?snapshot=${snapshot.id}`} className={SECONDARY}>
              {t('UI_SIM_LOAD_INTO_SIMULATOR')}
            </Link>
          )}
          {can(permissions, 'business.manage') && (
            <RenameSnapshotButton id={snapshot.id} name={snapshot.name} notes={snapshot.notes} className={SECONDARY} />
          )}
          {can(permissions, 'business.manage') && (
            <ConfirmAction
              label={t('UI_DELETE')}
              title={t('UI_SIM_DELETE_SNAPSHOT', { name: snapshot.name })}
              message={t('UI_SIM_DELETE_SNAPSHOT_MESSAGE')}
              reasonLabel={t('UI_REASON_FOR_DELETING')}
              action={deleteSimSnapshot.bind(null, snapshot.id)}
              triggerClass={SECONDARY}
            />
          )}
          {can(permissions, 'business.manage') && (
            <ConfirmAction
              label={t('UI_SIM_PURGE')}
              title={t('UI_SIM_PURGE_SNAPSHOT', { name: snapshot.name })}
              message={t('UI_SIM_PURGE_MESSAGE')}
              reasonLabel={t('UI_REASON_FOR_DELETING')}
              action={purgeSimSnapshot.bind(null, snapshot.id)}
              triggerClass={DANGER}
            />
          )}
        </div>
      </div>

      {/* Plan vs actual */}
      <section className="mb-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold text-ink">{t('UI_SIM_PLAN_VS_ACTUAL')}</h2>
        <p className="mb-4 text-sm text-muted">{t('UI_SIM_PLAN_VS_ACTUAL_HINT')}</p>
        {compared.length === 0 ? (
          <p className="text-base text-body">
            {t('UI_SIM_NO_ACTUAL_YET', { month: result?.simulated[0]?.MonthStart ? formatMonth(result.simulated[0].MonthStart) : '—' })}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="text-sm text-muted">
                  <th className="px-3 py-2 font-medium">{t('UI_MONTH')}</th>
                  {COMPARED.map(column => (
                    <th key={column.name} colSpan={3} className="px-3 py-2 text-center font-medium">{t(column.label)}</th>
                  ))}
                </tr>
                <tr className="text-sm text-muted">
                  <th />
                  {COMPARED.map(column => [
                    <th key={`${column.name}-plan`} className="px-3 py-1 text-right font-normal">{t('UI_SIM_PLAN')}</th>,
                    <th key={`${column.name}-actual`} className="px-3 py-1 text-right font-normal">{t('UI_SIM_ACTUAL')}</th>,
                    <th key={`${column.name}-gap`} className="px-3 py-1 text-right font-normal">{t('UI_SIM_CHANGE')}</th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {compared.map(row => {
                  const month = row.MonthStart ?? ''
                  const real = actual.get(month)
                  return (
                    <tr key={month} className="border-t border-line">
                      <td className="whitespace-nowrap px-3 py-3 text-body">
                        {formatMonth(month)}{month === thisMonth ? ` (${t('UI_SO_FAR')})` : ''}
                      </td>
                      {COMPARED.map(column => [
                        <td key={`${column.name}-plan`} className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-body">{money(row[column.name])}</td>,
                        <td key={`${column.name}-actual`} className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-ink">{money(real?.[column.name])}</td>,
                        <td key={`${column.name}-gap`} className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-body">{gap(row[column.name], real?.[column.name])}</td>,
                      ])}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* What was entered */}
      {form && (
        <section className="mb-8 rounded-2xl border border-line bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-ink">{t('UI_SIM_WHAT_WAS_ENTERED')}</h2>
          <dl className="mb-4 grid gap-x-8 gap-y-2 text-base sm:grid-cols-2 xl:grid-cols-3">
            {[
              ['UI_SIM_MONTHS', form.monthsAhead],
              ['UI_SIM_FEE_TYPE', form.fee ? `${t(form.feeType === 'AMT' ? 'UI_SIM_FEE_TYPE_AMT' : 'UI_SIM_FEE_TYPE_PCT')}: ${form.feeType === 'AMT' ? money(form.fee) : `${trimNumber(form.fee)}%`}` : '—'],
              ['UI_SIM_INTEREST_PCT', form.interestPct ? `${trimNumber(form.interestPct)}%` : '—'],
              ['UI_SIM_MONTHLY_LOSS_PCT', form.monthlyLossPct ? `${trimNumber(form.monthlyLossPct)}%` : '—'],
              ['UI_SIM_AVG_TERM', form.termMonths || '—'],
              ['UI_SIM_AVG_LOAN', form.feeType === 'AMT' ? money(form.avgLoan) : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-body">{t(label)}</dt>
                <dd className="text-right font-medium tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {SECTIONS.filter(section => (form.items[section.key] ?? []).length > 0).map(section => (
            <div key={section.key} className="mt-4">
              <h3 className="mb-2 text-base font-semibold text-ink">{t(section.title)}</h3>
              <ul className="flex flex-col gap-1 text-sm text-body">
                {form.items[section.key].map((item, index) => (
                  <li key={index}>
                    {section.fields.map(field => `${t(field.label)}: ${show(field, item[field.name], who)}`).join(' · ')}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {result ? <SimResult base={result.base} simulated={result.simulated} /> : (
        <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center text-muted">{t('UI_SIM_SNAPSHOT_UNREADABLE')}</p>
      )}
    </>
  )
}
